// SPDX-License-Identifier: AGPL-3.0-only
import SwiftUI

public struct OneSpringConfig: Sendable, Equatable {
  public let stiffness: Double
  public let damping: Double
  public let mass: Double

  public init(stiffness: Double, damping: Double, mass: Double = 1) {
    precondition(
      stiffness.isFinite && stiffness > 0 && damping.isFinite && damping >= 0 && mass.isFinite
        && mass > 0)
    self.stiffness = stiffness
    self.damping = damping
    self.mass = mass
  }
}

public enum OneSpringPreset: String, CaseIterable, Sendable {
  case snappy, tactile, elastic, gentle, detent

  public var config: OneSpringConfig {
    switch self {
    case .snappy: .init(stiffness: 420, damping: 32)
    case .tactile: .init(stiffness: 360, damping: 24)
    case .elastic: .init(stiffness: 300, damping: 20)
    case .gentle: .init(stiffness: 220, damping: 26)
    case .detent: .init(stiffness: 520, damping: 38)
    }
  }
}

public enum OneSpringSolver {
  /// Unit step from zero to one. Time is seconds, velocity is units per second.
  public static func evaluate(t: Double, config: OneSpringConfig, initialVelocity v: Double = 0)
    -> (position: Double, velocity: Double)
  {
    precondition(t.isFinite && t >= 0 && v.isFinite)
    if t == 0 { return (0, v) }
    let a = config.damping / (2 * config.mass)
    let w2 = config.stiffness / config.mass
    let w = sqrt(w2)
    if a > w {
      let b = sqrt(a - w) * sqrt(a + w)
      let slow = -w2 / (a + b)
      let fast = -(a + b)
      let decay = exp(slow * t)
      let displacement = -decay + decay * (-expm1(-2 * b * t) / (2 * b)) * (v + slow)
      return (1 + displacement, slow * displacement + exp(fast * t) * (v + slow))
    }
    let decay = exp(-a * t)
    if decay == 0 { return (1, 0) }
    let b = sqrt(w - a) * sqrt(w + a)
    let c = decay * cos(b * t)
    let s = decay * (b == 0 ? t : sin(b * t) / b)
    return (1 - c + (v - a) * s, v * c + (w2 - a * v) * s)
  }
}

public enum OneMotionProfile: String, CaseIterable, Sendable {
  case calm, tactile, reduced

  public func animation(_ preset: OneSpringPreset, accessibilityReduceMotion: Bool) -> Animation? {
    guard !accessibilityReduceMotion && self != .reduced else { return nil }
    if self == .calm { return OneMotion.standard(reducedMotion: false) }
    let config = preset.config
    return .interpolatingSpring(
      mass: config.mass, stiffness: config.stiffness, damping: config.damping)
  }
}

private enum MotionProfileKey: EnvironmentKey {
  static let defaultValue = OneMotionProfile.calm
}

extension EnvironmentValues {
  public var oneMotionProfile: OneMotionProfile {
    get { self[MotionProfileKey.self] }
    set { self[MotionProfileKey.self] = newValue }
  }
}

/// Use on the moving child so the focus target and hit area stay stable.
struct OneMotionFeedback<Value: Equatable>: ViewModifier {
  let preset: OneSpringPreset
  let value: Value
  @Environment(\.oneMotionProfile) private var profile
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  func body(content: Content) -> some View {
    content
      .animation(profile.animation(preset, accessibilityReduceMotion: reduceMotion), value: value)
      .transaction { transaction in
        if reduceMotion || profile == .reduced {
          transaction.animation = nil
          transaction.disablesAnimations = true
        }
      }
  }
}

public enum OnePhysicsMath {
  public static func rubberBand(_ offset: Double, limit: Double, resistance: Double = 0.55)
    -> Double
  {
    precondition(
      offset.isFinite && limit.isFinite && limit >= 0 && resistance.isFinite && resistance >= 0)
    guard offset != 0 && limit > 0 && resistance > 0 else { return 0 }
    return copysign(limit / (1 + limit / abs(offset) / resistance), offset)
  }

  public static func snapToDetent(_ value: Double, steps: Int, min: Double, max: Double) -> Double {
    precondition(value.isFinite && min.isFinite && max.isFinite && steps > 0 && max >= min)
    if steps == 1 || max == min || value <= min { return min }
    if value >= max { return max }
    let intervals = Double(steps - 1)
    let index = ((value - min) / (max - min) * intervals).rounded()
    return min + (max - min) * (index / intervals)
  }

  public static func angularDetent(_ angle: Double, count: Int) -> Double {
    precondition(angle.isFinite && count > 0)
    let wrapped = (angle.truncatingRemainder(dividingBy: 360) + 360).truncatingRemainder(
      dividingBy: 360)
    let step = 360 / Double(count)
    return ((wrapped / step).rounded() * step).truncatingRemainder(dividingBy: 360)
  }

  public static func swipeProgress(_ deltaX: Double, trackWidth: Double, threshold: Double = 0.8)
    -> (progress: Double, confirmed: Bool)
  {
    precondition(
      deltaX.isFinite && trackWidth.isFinite && trackWidth >= 0 && threshold > 0 && threshold <= 1)
    let progress = trackWidth > 0 ? min(1, max(0, deltaX / trackWidth)) : 0
    return (progress, progress >= threshold)
  }
}
