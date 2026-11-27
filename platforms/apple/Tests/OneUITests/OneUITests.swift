// SPDX-License-Identifier: AGPL-3.0-only
import SwiftUI
import XCTest

@testable import OneUI

final class OneUITests: XCTestCase {
  #if os(macOS)
    @MainActor func testWormDotKeepsItsLayoutSizeWhenSelectionChanges() {
      for chosen in [false, true] {
        let host = NSHostingView(rootView: WormDotIndicator(chosen: chosen))
        XCTAssertEqual(host.fittingSize, CGSize(width: 24, height: 8))
      }
    }

    @MainActor func testLoadingKeepsButtonSizeWithShortAndWrappedLabels() {
      for label in ["Save", "Save updates for the next scheduled review"] {
        for reducedMotion in [false, true] {
          func buttonSize(loading: Bool) -> CGSize {
            let view = OneButton(isLoading: loading, action: {}) { Text(label) }
              .environment(\.oneMotionProfile, reducedMotion ? .reduced : .calm)
              .frame(maxWidth: 148)
            return NSHostingView(rootView: view).fittingSize
          }
          let resting = buttonSize(loading: false)
          XCTAssertGreaterThanOrEqual(resting.height, OneLayout.controlHeight)
          XCTAssertEqual(buttonSize(loading: true), resting)
        }
      }
    }
  #endif

  func testCatalog() {
    let entries = OneMomentID.allCases
    XCTAssertEqual(entries.count, 36)
    XCTAssertEqual(entries.map(\.number), Array(1...36))
    XCTAssertEqual(Set(entries.map(\.slug)).count, 36)
    XCTAssertEqual(entries.first, .barsFade)
    XCTAssertEqual(entries.last, .dotRevolve)
    for entry in entries {
      XCTAssertFalse(entry.title.isEmpty)
      XCTAssertFalse(entry.category.isEmpty)
      XCTAssertFalse(entry.reducedMotionSummary.isEmpty)
      XCTAssertEqual(OneMomentID(rawValue: entry.slug), entry)
    }
  }

  @MainActor func testCatalogViews() {
    for id in OneMomentID.allCases {
      let view = OneMomentView(id: id)
      XCTAssertEqual(view.id, id)
      #if os(macOS)
        let host = NSHostingView(rootView: view.environment(\.oneMotionProfile, .reduced).frame(width: 280))
        XCTAssertGreaterThan(host.fittingSize.height, 0, id.slug)
      #else
        _ = view.body
      #endif
    }
  }

  func testPresetConvergence() {
    XCTAssertEqual(OneSpringPreset.allCases.count, 5)
    for preset in OneSpringPreset.allCases {
      let start = OneSpringSolver.evaluate(t: 0, config: preset.config, initialVelocity: 3)
      XCTAssertEqual(start.position, 0)
      XCTAssertEqual(start.velocity, 3)
      let end = OneSpringSolver.evaluate(t: 4, config: preset.config, initialVelocity: 3)
      XCTAssertEqual(end.position, 1, accuracy: 1e-8)
      XCTAssertEqual(end.velocity, 0, accuracy: 1e-8)
    }
  }

  func testCriticalAndOverdampedWithVelocity() {
    // For roots -1 and -4, initial velocity 1 selects the slow exponential.
    let over = OneSpringSolver.evaluate(
      t: 1, config: .init(stiffness: 4, damping: 5), initialVelocity: 1)
    XCTAssertEqual(over.position, 1 - exp(-1), accuracy: 1e-12)
    XCTAssertEqual(over.velocity, exp(-1), accuracy: 1e-12)
    let critical = OneSpringSolver.evaluate(t: 1, config: .init(stiffness: 4, damping: 4))
    XCTAssertEqual(critical.position, 1 - 3 * exp(-2), accuracy: 1e-12)
    XCTAssertEqual(critical.velocity, 4 * exp(-2), accuracy: 1e-12)
  }

  func testPhysicsMath() {
    XCTAssertEqual(OnePhysicsMath.rubberBand(-100, limit: 55), -27.5)
    XCTAssertEqual(OnePhysicsMath.rubberBand(100, limit: 0), 0)
    XCTAssertEqual(OnePhysicsMath.snapToDetent(2.5, steps: 3, min: 0, max: 10), 5)
    XCTAssertEqual(OnePhysicsMath.snapToDetent(20, steps: 1, min: -1, max: 1), -1)
    XCTAssertEqual(OnePhysicsMath.angularDetent(-45, count: 4), 0)
    XCTAssertEqual(OnePhysicsMath.swipeProgress(-10, trackWidth: 50).progress, 0)
    XCTAssertTrue(OnePhysicsMath.swipeProgress(40, trackWidth: 50).confirmed)
    XCTAssertFalse(OnePhysicsMath.swipeProgress(30, trackWidth: 50).confirmed)
    XCTAssertEqual(OnePhysicsMath.swipeProgress(5, trackWidth: 0).progress, 0)
  }

  func testTokensAndMotion() {
    XCTAssertEqual(OneTokens.Layout.controlHeight, 44)
    XCTAssertEqual(OneTokens.Density.Compact.controlHeight, 36)
    XCTAssertEqual(OneTokens.Space.xs, 8)
    for preset in OneSpringPreset.allCases {
      for profile in OneMotionProfile.allCases {
        XCTAssertNil(profile.animation(preset, accessibilityReduceMotion: true))
      }
      XCTAssertNil(OneMotionProfile.reduced.animation(preset, accessibilityReduceMotion: false))
      XCTAssertNotNil(OneMotionProfile.tactile.animation(preset, accessibilityReduceMotion: false))
      XCTAssertNotNil(OneMotionProfile.calm.animation(preset, accessibilityReduceMotion: false))
    }
  }
}
