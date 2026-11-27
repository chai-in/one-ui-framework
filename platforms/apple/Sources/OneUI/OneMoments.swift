// SPDX-License-Identifier: AGPL-3.0-only
import SwiftUI

public enum OneMomentID: String, CaseIterable, Identifiable, Sendable {
  case barsFade = "bars-fade"
  case bloomToggle = "bloom-toggle"
  case snapGrid = "snap-grid"
  case cardFan = "card-fan"
  case gooeyTabBar = "gooey-tab-bar"
  case blocksScale = "blocks-scale"
  case stretchToggle = "stretch-toggle"
  case mergeDrops = "merge-drops"
  case paperPlane = "paper-plane"
  case detentDial = "detent-dial"
  case dominoRow = "domino-row"
  case pebbleRating = "pebble-rating"
  case jellyPad = "jelly-pad"
  case swipeConfirm = "swipe-confirm"
  case bookmark = "bookmark"
  case depthStack = "depth-stack"
  case menuMorph = "menu-morph"
  case elasticString = "elastic-string"
  case ripplePad = "ripple-pad"
  case wormDots = "worm-dots"
  case downloadRing = "download-ring"
  case leafTabs = "leaf-tabs"
  case bellToggle = "bell-toggle"
  case inkSwitch = "ink-switch"
  case rockerSwitch = "rocker-switch"
  case scrubWave = "scrub-wave"
  case squashPlay = "squash-play"
  case rubberSearch = "rubber-search"
  case odometer = "odometer"
  case tideProgress = "tide-progress"
  case eclipseHalf = "eclipse-half"
  case magnetGrid = "magnet-grid"
  case checklist = "checklist"
  case flipCoin = "flip-coin"
  case radialMenu = "radial-menu"
  case dotRevolve = "dot-revolve"

  public var id: Self { self }
  public var slug: String { rawValue }
  public var number: Int { metadata.number }
  public var title: String { metadata.title }
  public var category: String { metadata.category }
  public var springPreset: OneSpringPreset { metadata.spring }
  public var reducedMotionSummary: String { metadata.reduced }

  private var metadata:
    (number: Int, title: String, category: String, spring: OneSpringPreset, reduced: String)
  {
    switch self {
    case .barsFade:
      (
        1, "Bars Fade", "feedback", .gentle,
        "Show a static progress indicator and its accessible label."
      )
    case .bloomToggle:
      (2, "Bloom Toggle", "selection", .tactile, "Swap the checked marker instantly.")
    case .snapGrid:
      (3, "Snap Grid", "layout", .detent, "Place the selection on its final grid cell.")
    case .cardFan:
      (4, "Card Fan", "selection", .gentle, "Keep cards stationary and mark the selected card.")
    case .gooeyTabBar:
      (5, "Gooey Tab Bar", "navigation", .elastic, "Move the active tab marker immediately.")
    case .blocksScale:
      (6, "Blocks Scale", "feedback", .snappy, "Show the current block count without scaling.")
    case .stretchToggle:
      (7, "Stretch Toggle", "selection", .elastic, "Set the final thumb position on change.")
    case .mergeDrops:
      (8, "Merge Drops", "feedback", .elastic, "Present the merged state and its text immediately.")
    case .paperPlane: (9, "Paper Plane", "action", .snappy, "Show the send result without flight.")
    case .detentDial: (10, "Detent Dial", "input", .detent, "Set the indicated detent directly.")
    case .dominoRow: (11, "Domino Row", "feedback", .tactile, "Set all completed segments at once.")
    case .pebbleRating:
      (12, "Pebble Rating", "input", .tactile, "Mark the selected rating immediately.")
    case .jellyPad: (13, "Jelly Pad", "action", .elastic, "Use a static pressed state.")
    case .swipeConfirm:
      (
        14, "Swipe Confirm", "action", .detent,
        "Commit immediately on activation and display confirmation."
      )
    case .bookmark: (15, "Bookmark", "selection", .snappy, "Swap the saved marker immediately.")
    case .depthStack:
      (16, "Depth Stack", "layout", .gentle, "Show the selected item without depth travel.")
    case .menuMorph:
      (17, "Menu Morph", "disclosure", .snappy, "Switch the icon and menu visibility instantly.")
    case .elasticString:
      (18, "Elastic String", "input", .elastic, "Update the value with a stationary track.")
    case .ripplePad:
      (19, "Ripple Pad", "action", .tactile, "Indicate activation without an expanding ripple.")
    case .wormDots:
      (20, "Worm Dots", "navigation", .elastic, "Mark the current page without stretching.")
    case .downloadRing:
      (
        21, "Download Ring", "feedback", .gentle,
        "Update the ring to the current value immediately."
      )
    case .leafTabs:
      (22, "Leaf Tabs", "navigation", .tactile, "Show the chosen tab and panel immediately.")
    case .bellToggle:
      (23, "Bell Toggle", "selection", .tactile, "Use a stationary notification-state icon.")
    case .inkSwitch:
      (24, "Ink Switch", "selection", .gentle, "Show the checked state without spreading ink.")
    case .rockerSwitch:
      (25, "Rocker Switch", "selection", .detent, "Set the labelled switch state immediately.")
    case .scrubWave: (26, "Scrub Wave", "input", .detent, "Update the playhead and time directly.")
    case .squashPlay:
      (27, "Squash Play", "action", .tactile, "Switch playback state without scaling.")
    case .rubberSearch:
      (28, "Rubber Search", "input", .elastic, "Keep the search field fixed while editing.")
    case .odometer:
      (29, "Odometer", "feedback", .snappy, "Display and expose the final number once.")
    case .tideProgress:
      (30, "Tide Progress", "feedback", .gentle, "Show the current fill level without waves.")
    case .eclipseHalf:
      (31, "Eclipse Half", "selection", .gentle, "Show the chosen appearance immediately.")
    case .magnetGrid:
      (32, "Magnet Grid", "selection", .tactile, "Keep items fixed and show the current selection.")
    case .checklist: (33, "Checklist", "selection", .snappy, "Set checkbox markers immediately.")
    case .flipCoin: (34, "Flip Coin", "action", .elastic, "Expose the chosen face immediately.")
    case .radialMenu:
      (35, "Radial Menu", "disclosure", .snappy, "Show all menu items in their final positions.")
    case .dotRevolve:
      (
        36, "Dot Revolve", "feedback", .gentle,
        "Use a stationary indicator while the operation is pending."
      )
    }
  }
}

private struct MomentProgress: View {
  let id: OneMomentID
  let label: String
  let value: Double?
  @Environment(\.oneMotionProfile) private var profile
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @Environment(\.isLuminanceReduced) private var dimmed

  var body: some View {
    let still = reduceMotion || profile == .reduced || dimmed
    let fraction = value.flatMap { $0.isFinite ? min(1, max(0, $0)) : nil }
    Group {
      if let fraction {
        ProgressDrawing(id: id, fraction: fraction, phase: nil, still: still)
          .id(still)
          .modifier(OneMotionFeedback(preset: id.springPreset, value: fraction))
      } else if still {
        GeometryReader { _ in
          Image(systemName: "hourglass")
            .foregroundStyle(OneColor.textPrimary)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
      } else {
        TimelineView(.animation(minimumInterval: 1 / 30)) { context in
          let phase =
            context.date.timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: 1.6) / 1.6
          ProgressDrawing(id: id, fraction: 0.5, phase: phase, still: false)
        }
      }
    }
    .frame(maxWidth: 144)
    .frame(height: 44)
    .accessibilityRepresentation {
      if let fraction { ProgressView(label, value: fraction) } else { ProgressView(label) }
    }
  }
}

private struct ProgressDrawing: View, Animatable {
  let id: OneMomentID
  var fraction: Double
  let phase: Double?
  let still: Bool
  var animatableData: Double {
    get { fraction }
    set { fraction = newValue }
  }

  var body: some View {
    Canvas { context, size in
      let p = min(1, max(0, fraction))
      let phase = self.phase ?? 0
      let center = CGPoint(x: size.width / 2, y: size.height / 2)
      let ink = GraphicsContext.Shading.color(OneColor.textPrimary)
      let track = GraphicsContext.Shading.color(OneColor.borderControl)
      let surface = GraphicsContext.Shading.color(OneColor.surfaceRaised)
      switch id {
      case .downloadRing, .dotRevolve:
        let radius = min(size.height, size.width) * 0.4
        var ring = Path()
        ring.addArc(
          center: center, radius: radius, startAngle: .degrees(-90), endAngle: .degrees(270),
          clockwise: false)
        context.stroke(ring, with: surface, lineWidth: 4)
        var outline = Path()
        outline.addArc(
          center: center, radius: radius + 3, startAngle: .degrees(-90), endAngle: .degrees(270),
          clockwise: false)
        context.stroke(outline, with: track, lineWidth: 1)
        var arc = Path()
        let start = phase * 360 - 90
        arc.addArc(
          center: center, radius: radius, startAngle: .degrees(start),
          endAngle: .degrees(start + 360 * p), clockwise: false)
        context.stroke(arc, with: ink, lineWidth: 4)
        if id == .dotRevolve {
          let angle = (start + 360 * p) * .pi / 180
          let dot = CGRect(
            x: center.x + radius * cos(angle) - 4, y: center.y + radius * sin(angle) - 4, width: 8,
            height: 8)
          context.fill(Path(ellipseIn: dot), with: ink)
        }
      case .tideProgress:
        let bounds = CGRect(origin: .zero, size: size)
        let shape = Path(roundedRect: bounds, cornerRadius: 6)
        var tide = context
        tide.clip(to: shape)
        tide.fill(shape, with: surface)
        var water = Path()
        water.move(to: CGPoint(x: 0, y: size.height))
        for x in stride(from: 0.0, through: ceil(size.width), by: 1) {
          let wave = still ? 0 : sin(2 * .pi * (x / max(1, size.width) + phase))
          let y = size.height * (1 - p) + min(p, 1 - p) * 6 * wave
          water.addLine(to: CGPoint(x: x, y: y))
        }
        water.addLine(to: CGPoint(x: size.width, y: size.height))
        water.closeSubpath()
        tide.fill(water, with: ink)
        tide.stroke(shape, with: track, lineWidth: 2)
      default:
        let count = 8
        let slot = size.width / CGFloat(count)
        for index in 0..<count {
          let active = Double(index) < p * Double(count)
          let wave = cos(2 * .pi * (phase - Double(index) / Double(count)))
          let height = still ? 24 : (id == .blocksScale ? (active ? 24.0 : 12.0) : 24 + 6 * wave)
          let rect = CGRect(
            x: slot * (CGFloat(index) + 0.2), y: (size.height - height) / 2,
            width: slot * 0.6, height: height)
          var segment = context
          if id == .dominoRow && active && !still {
            segment.translateBy(x: rect.midX, y: rect.maxY)
            segment.rotate(by: .degrees(25))
            segment.translateBy(x: -rect.midX, y: -rect.maxY)
          }
          if id == .barsFade && active && self.phase != nil {
            segment.opacity = 0.7 + 0.3 * wave
          }
          let shape = Path(roundedRect: rect, cornerRadius: 3)
          if active {
            segment.fill(shape, with: ink)
          } else {
            segment.stroke(shape, with: track, lineWidth: 1)
          }
        }
      }
    }
  }
}

/// Supply a fraction in 0...1, or nil while an operation is pending.
public struct OneBarsFade: View {
  let progress: Double?
  let label: String

  public init(progress: Double? = nil, label: String = "Bars Fade") {
    self.progress = progress
    self.label = label
  }

  public var body: some View {
    MomentProgress(id: .barsFade, label: label, value: progress)
  }
}

/// Supply a fraction in 0...1, or nil while an operation is pending.
public struct OneBlocksScale: View {
  let progress: Double?
  let label: String

  public init(progress: Double? = nil, label: String = "Blocks Scale") {
    self.progress = progress
    self.label = label
  }

  public var body: some View {
    MomentProgress(id: .blocksScale, label: label, value: progress)
  }
}

/// Supply a fraction in 0...1, or nil while an operation is pending.
public struct OneDominoRow: View {
  let progress: Double?
  let label: String

  public init(progress: Double? = nil, label: String = "Domino Row") {
    self.progress = progress
    self.label = label
  }

  public var body: some View {
    MomentProgress(id: .dominoRow, label: label, value: progress)
  }
}

/// Supply a fraction in 0...1, or nil while an operation is pending.
public struct OneDownloadRing: View {
  let progress: Double?
  let label: String

  public init(progress: Double? = nil, label: String = "Download Ring") {
    self.progress = progress
    self.label = label
  }

  public var body: some View {
    MomentProgress(id: .downloadRing, label: label, value: progress)
  }
}

/// Supply a fraction in 0...1, or nil while an operation is pending.
public struct OneTideProgress: View {
  let progress: Double?
  let label: String

  public init(progress: Double? = nil, label: String = "Tide Progress") {
    self.progress = progress
    self.label = label
  }

  public var body: some View {
    MomentProgress(id: .tideProgress, label: label, value: progress)
  }
}

/// Supply a fraction in 0...1, or nil while an operation is pending.
public struct OneDotRevolve: View {
  let progress: Double?
  let label: String

  public init(progress: Double? = nil, label: String = "Dot Revolve") {
    self.progress = progress
    self.label = label
  }

  public var body: some View {
    MomentProgress(id: .dotRevolve, label: label, value: progress)
  }
}
private struct MomentToggle: View {
  let id: OneMomentID
  let label: String
  @Binding var isOn: Bool
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @Environment(\.oneMotionProfile) private var profile

  @ViewBuilder private var mark: some View {
    let moving = !reduceMotion && profile != .reduced
    switch id {
    case .bloomToggle:
      Image(systemName: isOn ? "camera.macro" : "leaf")
        .rotationEffect(.degrees(moving && isOn ? 35 : 0))
        .scaleEffect(moving && isOn ? 1.25 : 1)
    case .inkSwitch:
      ZStack {
        Capsule().strokeBorder(OneColor.borderStrong)
        Capsule().fill(OneColor.accept).scaleEffect(x: isOn ? 1 : 0, anchor: .leading)
        Image(systemName: isOn ? "checkmark" : "minus")
          .foregroundStyle(isOn ? OneColor.onAccept : OneColor.textPrimary)
      }.frame(width: 48, height: 28)
    case .stretchToggle, .rockerSwitch:
      ZStack(alignment: isOn ? .trailing : .leading) {
        Capsule().fill(isOn ? OneColor.accept : OneColor.surfaceRaised)
        Capsule().strokeBorder(OneColor.borderStrong)
        Image(systemName: isOn ? "checkmark.circle.fill" : "minus.circle")
          .foregroundStyle(isOn ? OneColor.onAccept : OneColor.textPrimary)
          .scaleEffect(x: id == .stretchToggle && isOn ? 1.3 : 1)
          .rotation3DEffect(
            .degrees(id == .rockerSwitch && isOn ? 25 : -5), axis: (x: 0, y: 1, z: 0)
          )
          .padding(4)
      }.frame(width: 52, height: 28)
    case .bellToggle:
      Image(systemName: isOn ? "bell.fill" : "bell.slash")
        .rotationEffect(.degrees(moving && isOn ? 12 : 0))
    case .eclipseHalf:
      Image(systemName: "circle.lefthalf.filled").rotationEffect(.degrees(isOn ? 180 : 0))
    case .bookmark:
      Image(systemName: isOn ? "bookmark.fill" : "bookmark")
        .offset(y: moving && isOn ? -3 : 0)
    default:
      Image(systemName: isOn ? "pause.fill" : "play.fill")
        .scaleEffect(x: moving && isOn ? 0.85 : 1)
    }
  }

  var body: some View {
    Button {
      isOn.toggle()
    } label: {
      HStack(spacing: OneSpace.sm) {
        mark.modifier(OneMotionFeedback(preset: id.springPreset, value: isOn))
        Text(label)
      }
    }
    .buttonStyle(OneButtonStyle(role: .neutral))
    .accessibilityRepresentation { Toggle(label, isOn: $isOn) }
  }
}

public struct OneBloomToggle: View {
  @Binding var isOn: Bool
  let label: String

  public init(isOn: Binding<Bool>, label: String = "Bloom") {
    _isOn = isOn
    self.label = label
  }

  public var body: some View { MomentToggle(id: .bloomToggle, label: label, isOn: $isOn) }
}

public struct OneRockerSwitch: View {
  @Binding var isOn: Bool
  let label: String

  public init(isOn: Binding<Bool>, label: String = "Power") {
    _isOn = isOn
    self.label = label
  }

  public var body: some View { MomentToggle(id: .rockerSwitch, label: label, isOn: $isOn) }
}

public struct OneStretchToggle: View {
  @Binding var isOn: Bool
  let label: String

  public init(isOn: Binding<Bool>, label: String = "Enable") {
    _isOn = isOn
    self.label = label
  }

  public var body: some View { MomentToggle(id: .stretchToggle, label: label, isOn: $isOn) }
}

public struct OneEclipseHalf: View {
  @Binding var isOn: Bool
  let label: String

  public init(isOn: Binding<Bool>, label: String = "Dark appearance") {
    _isOn = isOn
    self.label = label
  }

  public var body: some View { MomentToggle(id: .eclipseHalf, label: label, isOn: $isOn) }
}

public struct OneInkSwitch: View {
  @Binding var isOn: Bool
  let label: String

  public init(isOn: Binding<Bool>, label: String = "Ink") {
    _isOn = isOn
    self.label = label
  }

  public var body: some View { MomentToggle(id: .inkSwitch, label: label, isOn: $isOn) }
}

public struct OneBellToggle: View {
  @Binding var isOn: Bool
  let label: String

  public init(isOn: Binding<Bool>, label: String = "Notifications") {
    _isOn = isOn
    self.label = label
  }

  public var body: some View { MomentToggle(id: .bellToggle, label: label, isOn: $isOn) }
}

public struct OneBookmarkButton: View {
  @Binding var isOn: Bool
  let label: String

  public init(isOn: Binding<Bool>, label: String = "Bookmark") {
    _isOn = isOn
    self.label = label
  }

  public var body: some View { MomentToggle(id: .bookmark, label: label, isOn: $isOn) }
}

public struct OneSquashPlayButton: View {
  @Binding var isOn: Bool
  let label: String

  public init(isOn: Binding<Bool>, label: String = "Playback") {
    _isOn = isOn
    self.label = label
  }

  public var body: some View { MomentToggle(id: .squashPlay, label: label, isOn: $isOn) }
}

struct WormDotIndicator: View {
  let chosen: Bool

  var body: some View {
    Capsule().fill(chosen ? OneColor.accept : OneColor.borderControl)
      .frame(width: 24, height: 8)
      .scaleEffect(x: chosen ? 1 : 1.0 / 3, y: 1)
  }
}

private struct MomentChoices: View {
  let id: OneMomentID
  let label: String
  let options: [String]
  @Binding var selection: Int
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @Environment(\.oneMotionProfile) private var profile
  @Environment(\.dynamicTypeSize) private var typeSize
  @Namespace private var marker

  private var isGrid: Bool { id == .snapGrid || id == .magnetGrid }
  private var isTab: Bool { [.leafTabs, .wormDots, .gooeyTabBar].contains(id) }
  private var moving: Bool { !reduceMotion && profile != .reduced }

  private func choice(_ index: Int) -> some View {
    let chosen = selection == index
    let middle = Double(options.count - 1) / 2
    return Button {
      selection = index
    } label: {
      VStack(spacing: OneSpace.xxs) {
        Group {
          switch id {
          case .pebbleRating:
            Image(systemName: index <= selection ? "circle.fill" : "circle")
              .scaleEffect(chosen ? 1.2 : 0.85)
          case .wormDots:
            WormDotIndicator(chosen: chosen)
          case .leafTabs:
            Image(systemName: chosen ? "leaf.fill" : "leaf")
              .rotationEffect(.degrees(chosen && moving ? -20 : 0))
          case .cardFan, .depthStack:
            Image(systemName: chosen ? "rectangle.portrait.fill" : "rectangle.portrait")
              .rotationEffect(.degrees(id == .cardFan && moving ? (Double(index) - middle) * 9 : 0))
              .offset(y: chosen && moving ? -3 : 0)
              .scaleEffect(id == .depthStack && moving && chosen ? 1.3 : 1)
          case .magnetGrid:
            Image(systemName: chosen ? "scope" : "circle.dotted")
              .offset(x: moving && !chosen ? CGFloat(selection - index).clamped(to: -1...1) * 4 : 0)
          default:
            Image(systemName: chosen ? "checkmark.circle.fill" : "circle")
          }
        }
        .modifier(OneMotionFeedback(preset: id.springPreset, value: selection))
        Text(options[index]).fixedSize(horizontal: false, vertical: true)
      }
      .padding(4)
      .frame(minWidth: 44, minHeight: 44)
      .foregroundStyle(chosen ? OneColor.onSelected : OneColor.textPrimary)
      .background {
        Group {
          if chosen {
            RoundedRectangle(cornerRadius: isTab ? 20 : OneRadius.small)
              .fill(OneColor.selected)
              .matchedGeometryEffect(id: "selection", in: marker)
          }
        }
        .modifier(OneMotionFeedback(preset: id.springPreset, value: selection))
      }
      .contentShape(Rectangle())
    }
    .buttonStyle(.plain)
    .accessibilityLabel(options[index])
    .accessibilityAddTraits(chosen ? .isSelected : [])
  }

  var body: some View {
    VStack(alignment: .leading, spacing: OneSpace.xs) {
      Text(label).font(OneControlTypography.control)
      if isGrid || typeSize.isAccessibilitySize {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: typeSize.isAccessibilitySize ? 100 : 60))])
        {
          ForEach(options.indices, id: \.self) { choice($0) }
        }
      } else {
        ViewThatFits(in: .horizontal) {
          HStack(spacing: OneSpace.xs) { ForEach(options.indices, id: \.self) { choice($0) } }
          VStack(alignment: .leading) { ForEach(options.indices, id: \.self) { choice($0) } }
        }
      }
    }
    .accessibilityElement(children: .contain)
    .accessibilityLabel(label)
  }
}

extension Comparable {
  fileprivate func clamped(to range: ClosedRange<Self>) -> Self {
    min(range.upperBound, max(range.lowerBound, self))
  }
}

public struct OneSnapGrid: View {
  let options: [String]
  @Binding var selection: Int
  let label: String

  public init(options: [String], selection: Binding<Int>, label: String = "Snap Grid") {
    self.options = options
    _selection = selection
    self.label = label
  }

  public var body: some View {
    MomentChoices(id: .snapGrid, label: label, options: options, selection: $selection)
  }
}

public struct OneMagnetGrid: View {
  let options: [String]
  @Binding var selection: Int
  let label: String

  public init(options: [String], selection: Binding<Int>, label: String = "Magnet Grid") {
    self.options = options
    _selection = selection
    self.label = label
  }

  public var body: some View {
    MomentChoices(id: .magnetGrid, label: label, options: options, selection: $selection)
  }
}

public struct OnePebbleRating: View {
  let options: [String]
  @Binding var selection: Int
  let label: String

  public init(options: [String], selection: Binding<Int>, label: String = "Pebble Rating") {
    self.options = options
    _selection = selection
    self.label = label
  }

  public var body: some View {
    MomentChoices(id: .pebbleRating, label: label, options: options, selection: $selection)
  }
}

public struct OneCardFan: View {
  let options: [String]
  @Binding var selection: Int
  let label: String

  public init(options: [String], selection: Binding<Int>, label: String = "Card Fan") {
    self.options = options
    _selection = selection
    self.label = label
  }

  public var body: some View {
    MomentChoices(id: .cardFan, label: label, options: options, selection: $selection)
  }
}

public struct OneDepthStack: View {
  let options: [String]
  @Binding var selection: Int
  let label: String

  public init(options: [String], selection: Binding<Int>, label: String = "Depth Stack") {
    self.options = options
    _selection = selection
    self.label = label
  }

  public var body: some View {
    MomentChoices(id: .depthStack, label: label, options: options, selection: $selection)
  }
}

public struct OneGooeyTabBar: View {
  let options: [String]
  @Binding var selection: Int
  let label: String

  public init(options: [String], selection: Binding<Int>, label: String = "Gooey Tab Bar") {
    self.options = options
    _selection = selection
    self.label = label
  }

  public var body: some View {
    MomentChoices(id: .gooeyTabBar, label: label, options: options, selection: $selection)
  }
}

public struct OneWormDots: View {
  let options: [String]
  @Binding var selection: Int
  let label: String

  public init(options: [String], selection: Binding<Int>, label: String = "Worm Dots") {
    self.options = options
    _selection = selection
    self.label = label
  }

  public var body: some View {
    MomentChoices(id: .wormDots, label: label, options: options, selection: $selection)
  }
}

public struct OneLeafTabs: View {
  let options: [String]
  @Binding var selection: Int
  let label: String

  public init(options: [String], selection: Binding<Int>, label: String = "Leaf Tabs") {
    self.options = options
    _selection = selection
    self.label = label
  }

  public var body: some View {
    MomentChoices(id: .leafTabs, label: label, options: options, selection: $selection)
  }
}
private struct MomentPad: View {
  let id: OneMomentID
  let label: String
  let action: () -> Void
  var sent = false
  @State private var activations = 0
  @Environment(\.oneMotionProfile) private var profile
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  private var symbol: String {
    switch id {
    case .paperPlane: sent ? "checkmark" : "paperplane"
    case .jellyPad: "square.fill"
    case .ripplePad: "circle.circle"
    default: activations.isMultiple(of: 2) ? "h.circle" : "t.circle"
    }
  }

  private var result: String {
    switch id {
    case .paperPlane: sent ? "Sent" : ""
    case .flipCoin: activations.isMultiple(of: 2) ? "Heads" : "Tails"
    default: activations == 0 ? "Ready" : "Activated \(activations)"
    }
  }

  var body: some View {
    Button {
      activations += 1
      action()
    } label: {
      HStack {
        if reduceMotion || profile == .reduced {
          Image(systemName: symbol)
        } else {
          Image(systemName: symbol)
            .phaseAnimator([false, true], trigger: activations) { image, peak in
              image
                .offset(
                  x: peak && id == .paperPlane ? 11 : 0, y: peak && id == .paperPlane ? -7 : 0
                )
                .scaleEffect(
                  x: peak && id == .jellyPad ? 1.3 : 1,
                  y: peak && id == .jellyPad ? 0.75 : 1
                )
                .scaleEffect(peak && id == .ripplePad ? 1.5 : 1)
                .rotation3DEffect(
                  .degrees(peak && id == .flipCoin ? 180 : 0), axis: (x: 0, y: 1, z: 0))
            } animation: { _ in
              profile.animation(id.springPreset, accessibilityReduceMotion: reduceMotion)
            }
        }
        Text(label)
      }
    }
    .buttonStyle(OneButtonStyle(role: .action))
    .accessibilityLabel(label)
    .accessibilityValue(result)
  }
}

public struct OnePaperPlaneButton: View {
  let label: String
  let sent: Bool
  let action: () -> Void

  public init(_ label: String = "Send", action: @escaping () -> Void) {
    self.init(label, sent: false, action: action)
  }

  /// Supply delivery state after the send has completed.
  public init(_ label: String = "Send", sent: Bool, action: @escaping () -> Void) {
    self.label = label
    self.sent = sent
    self.action = action
  }

  public var body: some View { MomentPad(id: .paperPlane, label: label, action: action, sent: sent) }
}

public struct OneFlipCoin: View {
  let label: String
  let action: () -> Void

  public init(_ label: String = "Flip coin", action: @escaping () -> Void) {
    self.label = label
    self.action = action
  }

  public var body: some View { MomentPad(id: .flipCoin, label: label, action: action) }
}

public struct OneRipplePad: View {
  let label: String
  let action: () -> Void

  public init(_ label: String = "Ripple", action: @escaping () -> Void) {
    self.label = label
    self.action = action
  }

  public var body: some View { MomentPad(id: .ripplePad, label: label, action: action) }
}

public struct OneJellyPad: View {
  let label: String
  let action: () -> Void

  public init(_ label: String = "Press pad", action: @escaping () -> Void) {
    self.label = label
    self.action = action
  }

  public var body: some View { MomentPad(id: .jellyPad, label: label, action: action) }
}

public struct OneSwipeConfirm: View {
  let label: String
  @Binding var confirmed: Bool
  let action: () -> Void
  @GestureState private var translation: CGFloat = 0
  @Environment(\.layoutDirection) private var direction
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @Environment(\.oneMotionProfile) private var profile

  public init(
    _ label: String = "Confirm", confirmed: Binding<Bool>, action: @escaping () -> Void = {}
  ) {
    self.label = label
    _confirmed = confirmed
    self.action = action
  }

  private func commit() {
    guard !confirmed else { return }
    confirmed = true
    action()
  }

  public var body: some View {
    VStack(alignment: .leading) {
      GeometryReader { geometry in
        let travel = max(0, geometry.size.width - 44)
        let sign: CGFloat = direction == .rightToLeft ? -1 : 1
        let progress = OnePhysicsMath.swipeProgress(translation * sign, trackWidth: travel).progress
        let fraction = confirmed ? 1 : ((reduceMotion || profile == .reduced) ? 0 : progress)
        ZStack(alignment: .leading) {
          Capsule().fill(OneColor.surfaceRaised)
          Image(systemName: confirmed ? "checkmark" : "chevron.forward")
            .frame(width: 44, height: 44)
            .foregroundStyle(OneColor.onAction)
            .background(OneColor.action, in: Circle())
            .offset(x: sign * travel * fraction)
            .modifier(OneMotionFeedback(preset: .detent, value: fraction))
        }
        .contentShape(Capsule())
        .gesture(
          DragGesture().updating($translation) { value, state, _ in
            state = value.translation.width
          }.onEnded { value in
            if OnePhysicsMath.swipeProgress(value.translation.width * sign, trackWidth: travel)
              .confirmed
            {
              commit()
            }
          },
          including: confirmed || travel == 0 ? .none : .all
        )
      }
      .frame(height: 44)
      .accessibilityHidden(true)
      Button(confirmed ? "Confirmed" : label, action: commit)
        .buttonStyle(OneButtonStyle(role: .accept))
        .disabled(confirmed)
    }
  }
}

private struct RangeDrawing: View, Animatable {
  let id: OneMomentID
  var fraction: Double
  let still: Bool
  var animatableData: Double {
    get { fraction }
    set { fraction = newValue }
  }

  var body: some View {
    Canvas { context, size in
      let position = fraction.clamped(to: 0...1)
      let center = CGPoint(x: size.width / 2, y: size.height / 2)
      var path = Path()
      switch id {
      case .detentDial:
        path.addEllipse(in: CGRect(x: center.x - 18, y: center.y - 18, width: 36, height: 36))
        let angle = (.pi * 1.5) * position + .pi * 0.75
        path.move(to: center)
        path.addLine(to: CGPoint(x: center.x + 16 * cos(angle), y: center.y + 16 * sin(angle)))
      case .elasticString:
        path.move(to: CGPoint(x: 0, y: center.y))
        path.addQuadCurve(
          to: CGPoint(x: size.width, y: center.y),
          control: CGPoint(
            x: size.width * position, y: still ? center.y : size.height * (1 - position)))
      default:
        for i in 0..<32 {
          let x = size.width * (Double(i) + 0.5) / 32
          let amplitude = 3 + abs(sin(Double(i) * 0.7)) * 14
          var tick = Path()
          tick.move(to: CGPoint(x: x, y: center.y - amplitude))
          tick.addLine(to: CGPoint(x: x, y: center.y + amplitude))
          context.stroke(
            tick,
            with: .color(x <= size.width * position ? OneColor.accept : OneColor.borderControl),
            lineWidth: 3)
        }
      }
      context.stroke(path, with: .color(OneColor.textPrimary), lineWidth: 2)
    }
  }
}

private struct MomentRange: View {
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @Environment(\.oneMotionProfile) private var profile
  let id: OneMomentID
  let label: String
  @Binding var value: Double
  let range: ClosedRange<Double>
  let steps: Int

  var body: some View {
    let fraction = (value - range.lowerBound) / (range.upperBound - range.lowerBound)
    VStack(alignment: .leading) {
      HStack {
        Text(label)
        Spacer()
        Text(value, format: .number.precision(.fractionLength(0...2))).monospacedDigit()
      }
      GeometryReader { geometry in
        RangeDrawing(id: id, fraction: fraction, still: reduceMotion || profile == .reduced)
          .modifier(OneMotionFeedback(preset: id.springPreset, value: value))
          .contentShape(Rectangle())
          .gesture(
            DragGesture(minimumDistance: 0).onChanged { drag in
              let position: Double
              if id == .detentDial {
                let dx = drag.location.x - geometry.size.width / 2
                let dy = drag.location.y - geometry.size.height / 2
                let angle = atan2(dy, dx) * 180 / .pi
                let wrapped = (angle - 135 + 360).truncatingRemainder(dividingBy: 360)
                position = wrapped > 315 ? 0 : min(1, wrapped / 270)
              } else {
                position = drag.location.x / max(1, geometry.size.width)
              }
              value = OnePhysicsMath.snapToDetent(
                range.lowerBound + position * (range.upperBound - range.lowerBound),
                steps: steps, min: range.lowerBound, max: range.upperBound)
            })
      }
      .frame(height: 44)
      .accessibilityHidden(true)
      Slider(
        value: $value, in: range, step: (range.upperBound - range.lowerBound) / Double(steps - 1)
      ) {
        Text(label)
      }
      .accessibilityValue(Text(value, format: .number))
    }
  }
}

public struct OneDetentDial: View {
  @Binding var value: Double
  let range: ClosedRange<Double>
  let steps: Int
  let label: String

  public init(
    value: Binding<Double>, range: ClosedRange<Double> = 0...10, steps: Int = 11,
    label: String = "Detent Dial"
  ) {
    precondition(range.upperBound > range.lowerBound && steps >= 2)
    _value = value
    self.range = range
    self.steps = steps
    self.label = label
  }

  public var body: some View {
    MomentRange(id: .detentDial, label: label, value: $value, range: range, steps: steps)
  }
}

public struct OneElasticString: View {
  @Binding var value: Double
  let range: ClosedRange<Double>
  let steps: Int
  let label: String

  public init(
    value: Binding<Double>, range: ClosedRange<Double> = 0...10, steps: Int = 11,
    label: String = "Elastic String"
  ) {
    precondition(range.upperBound > range.lowerBound && steps >= 2)
    _value = value
    self.range = range
    self.steps = steps
    self.label = label
  }

  public var body: some View {
    MomentRange(id: .elasticString, label: label, value: $value, range: range, steps: steps)
  }
}

public struct OneScrubWave: View {
  @Binding var value: Double
  let range: ClosedRange<Double>
  let steps: Int
  let label: String

  public init(
    value: Binding<Double>, range: ClosedRange<Double> = 0...10, steps: Int = 11,
    label: String = "Scrub Wave"
  ) {
    precondition(range.upperBound > range.lowerBound && steps >= 2)
    _value = value
    self.range = range
    self.steps = steps
    self.label = label
  }

  public var body: some View {
    MomentRange(id: .scrubWave, label: label, value: $value, range: range, steps: steps)
  }
}
public struct OneRubberSearch: View {
  @Binding var query: String
  let label: String
  @FocusState private var focused: Bool
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @Environment(\.oneMotionProfile) private var profile

  public init(_ label: String = "Search", query: Binding<String>) {
    self.label = label
    _query = query
  }

  public var body: some View {
    HStack {
      Image(systemName: "magnifyingglass")
        .scaleEffect(focused && !reduceMotion && profile != .reduced ? 1.15 : 1)
        .modifier(OneMotionFeedback(preset: .elastic, value: focused))
      TextField(label, text: $query)
        .submitLabel(.search)
        .focused($focused)
        .accessibilityLabel(label)
    }
    .oneField()
    .oneFocusRing(focused)
  }
}

public struct OneOdometer: View {
  let value: Int
  let label: String
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @Environment(\.oneMotionProfile) private var profile

  public init(value: Int, label: String = "Count") {
    self.value = value
    self.label = label
  }

  public var body: some View {
    Text(value, format: .number)
      .font(OneControlTypography.pageTitle.monospacedDigit())
      .contentTransition(
        reduceMotion || profile == .reduced ? .identity : .numericText(value: Double(value))
      )
      .modifier(OneMotionFeedback(preset: .snappy, value: value))
      .accessibilityLabel(label)
      .accessibilityValue(Text(value, format: .number))
  }
}

public struct OneMergeDrops: View {
  let merged: Bool
  let label: String

  public init(merged: Bool, label: String = "Merge status") {
    self.merged = merged
    self.label = label
  }

  public var body: some View {
    HStack {
      ZStack {
        Circle().fill(OneColor.accept).offset(x: merged ? 0 : -8)
        Circle().fill(OneColor.accept).offset(x: merged ? 0 : 8)
      }
      .frame(width: 32, height: 16)
      .modifier(OneMotionFeedback(preset: .elastic, value: merged))
      Text(merged ? "Merged" : "Separate")
    }
    .accessibilityElement(children: .ignore)
    .accessibilityLabel(label)
    .accessibilityValue(merged ? "Merged" : "Separate")
  }
}

public struct OneChecklist: View {
  let items: [String]
  @Binding var checked: Set<Int>
  let label: String

  public init(items: [String], checked: Binding<Set<Int>>, label: String = "Checklist") {
    self.items = items
    _checked = checked
    self.label = label
  }

  public var body: some View {
    VStack(alignment: .leading, spacing: OneSpace.xs) {
      ForEach(items.indices, id: \.self) { index in
        let selected = checked.contains(index)
        let binding = Binding(
          get: { checked.contains(index) },
          set: { enabled in
            if enabled { checked.insert(index) } else { checked.remove(index) }
          })
        Button {
          binding.wrappedValue.toggle()
        } label: {
          Label {
            Text(items[index])
          } icon: {
            Image(systemName: selected ? "checkmark.square.fill" : "square")
              .scaleEffect(selected ? 1.1 : 1)
              .modifier(OneMotionFeedback(preset: .snappy, value: selected))
          }
        }
        .buttonStyle(OneButtonStyle(role: .neutral))
        .accessibilityRepresentation { Toggle(items[index], isOn: binding) }
      }
    }
    .accessibilityElement(children: .contain)
    .accessibilityLabel(label)
  }
}

private struct MomentMenu: View {
  let id: OneMomentID
  let label: String
  let items: [String]
  let select: (Int) -> Void
  @State private var open = false
  @AccessibilityFocusState private var triggerFocused: Bool
  @FocusState private var keyboardFocus: Int?

  private func item(_ index: Int) -> some View {
    Button(items[index]) {
      open = false
      select(index)
      keyboardFocus = -1
      triggerFocused = true
    }
    .buttonStyle(OneButtonStyle(role: .neutral))
    .focused($keyboardFocus, equals: index)
  }

  #if !os(watchOS)
  private func moveFocus(_ offset: Int) -> KeyPress.Result {
    guard !items.isEmpty else { return .ignored }
    if !open {
      open = true
      keyboardFocus = offset > 0 ? 0 : items.count - 1
    } else {
      keyboardFocus = ((keyboardFocus ?? -1) + offset + items.count) % items.count
    }
    return .handled
  }
  #endif

  var body: some View {
    VStack(spacing: OneSpace.xs) {
      Button {
        open.toggle()
      } label: {
        Label(
          label,
          systemImage: open
            ? "xmark" : (id == .radialMenu ? "circle.grid.3x3" : "line.3.horizontal")
        )
        .contentTransition(.interpolate)
      }
      .buttonStyle(OneButtonStyle(role: .neutral))
      .accessibilityValue(open ? "Expanded" : "Collapsed")
      .accessibilityFocused($triggerFocused)
      .focused($keyboardFocus, equals: -1)

      if open {
        if id == .radialMenu {
          ViewThatFits(in: .horizontal) {
            HStack(alignment: .top, spacing: OneSpace.xs) {
              ForEach(items.indices, id: \.self) { index in
                item(index).padding(
                  .top, 20 * sin(.pi * Double(index) / Double(max(1, items.count - 1))))
              }
            }
            VStack { ForEach(items.indices, id: \.self) { item($0) } }
          }
        } else {
          VStack { ForEach(items.indices, id: \.self) { item($0) } }
        }
      }
    }
    .modifier(OneMotionFeedback(preset: id.springPreset, value: open))
    #if !os(watchOS)
      .onKeyPress(.downArrow) { moveFocus(1) }
      .onKeyPress(.upArrow) { moveFocus(-1) }
      .onKeyPress(.escape) {
        guard open else { return .ignored }
        open = false
        keyboardFocus = -1
        triggerFocused = true
        return .handled
      }
    #endif
  }
}

public struct OneMenuMorphButton: View {
  let label: String
  let items: [String]
  let select: (Int) -> Void

  public init(_ label: String = "Menu", items: [String], onSelect: @escaping (Int) -> Void) {
    self.label = label
    self.items = items
    self.select = onSelect
  }

  public var body: some View {
    MomentMenu(id: .menuMorph, label: label, items: items, select: select)
  }
}

public struct OneRadialMenu: View {
  let label: String
  let items: [String]
  let select: (Int) -> Void

  public init(_ label: String = "Menu", items: [String], onSelect: @escaping (Int) -> Void) {
    self.label = label
    self.items = items
    self.select = onSelect
  }

  public var body: some View {
    MomentMenu(id: .radialMenu, label: label, items: items, select: select)
  }
}

/// Interactive catalog entry. Standalone controls above accept application-owned state.
public struct OneMomentView: View {
  public let id: OneMomentID
  public init(id: OneMomentID) { self.id = id }

  public var body: some View { CatalogEntry(id: id).id(id) }
}

private struct CatalogEntry: View {
  let id: OneMomentID
  @State private var toggle = false
  @State private var selected = 0
  @State private var value = 5.0
  @State private var count = 0
  @State private var checked: Set<Int> = []
  @State private var query = ""
  let choices = ["First", "Second", "Third"]

  var body: some View {
    switch id {
    case .barsFade:
      VStack {
        OneBarsFade(progress: value / 10)
        Slider(value: $value, in: 0...10) { Text("Progress") }
      }
    case .bloomToggle:
      OneBloomToggle(isOn: $toggle)
    case .snapGrid:
      OneSnapGrid(options: choices, selection: $selected)
    case .cardFan:
      OneCardFan(options: choices, selection: $selected)
    case .gooeyTabBar:
      OneGooeyTabBar(options: choices, selection: $selected)
    case .blocksScale:
      VStack {
        OneBlocksScale(progress: value / 10)
        Slider(value: $value, in: 0...10) { Text("Progress") }
      }
    case .stretchToggle:
      OneStretchToggle(isOn: $toggle)
    case .mergeDrops:
      VStack {
        OneMergeDrops(merged: toggle)
        Button(toggle ? "Separate" : "Merge") { toggle.toggle() }
      }
    case .paperPlane:
      OnePaperPlaneButton { count += 1 }
    case .detentDial:
      OneDetentDial(value: $value)
    case .dominoRow:
      VStack {
        OneDominoRow(progress: value / 10)
        Slider(value: $value, in: 0...10) { Text("Progress") }
      }
    case .pebbleRating:
      OnePebbleRating(options: ["1", "2", "3", "4", "5"], selection: $selected)
    case .jellyPad:
      OneJellyPad { count += 1 }
    case .swipeConfirm:
      OneSwipeConfirm(confirmed: $toggle)
    case .bookmark:
      OneBookmarkButton(isOn: $toggle)
    case .depthStack:
      OneDepthStack(options: choices, selection: $selected)
    case .menuMorph:
      VStack {
        OneMenuMorphButton(items: choices) { selected = $0 }
        Text(choices[selected])
      }
    case .elasticString:
      OneElasticString(value: $value)
    case .ripplePad:
      OneRipplePad { count += 1 }
    case .wormDots:
      OneWormDots(options: choices, selection: $selected)
    case .downloadRing:
      VStack {
        OneDownloadRing(progress: value / 10)
        Slider(value: $value, in: 0...10) { Text("Progress") }
      }
    case .leafTabs:
      OneLeafTabs(options: choices, selection: $selected)
    case .bellToggle:
      OneBellToggle(isOn: $toggle)
    case .inkSwitch:
      OneInkSwitch(isOn: $toggle)
    case .rockerSwitch:
      OneRockerSwitch(isOn: $toggle)
    case .scrubWave:
      OneScrubWave(value: $value)
    case .squashPlay:
      OneSquashPlayButton(isOn: $toggle)
    case .rubberSearch:
      OneRubberSearch(query: $query)
    case .odometer:
      VStack {
        OneOdometer(value: count)
        Button("Increment") { count += 1 }
      }
    case .tideProgress:
      VStack {
        OneTideProgress(progress: value / 10)
        Slider(value: $value, in: 0...10) { Text("Progress") }
      }
    case .eclipseHalf:
      OneEclipseHalf(isOn: $toggle)
    case .magnetGrid:
      OneMagnetGrid(options: choices, selection: $selected)
    case .checklist:
      OneChecklist(items: choices, checked: $checked)
    case .flipCoin:
      OneFlipCoin { count += 1 }
    case .radialMenu:
      VStack {
        OneRadialMenu(items: choices) { selected = $0 }
        Text(choices[selected])
      }
    case .dotRevolve:
      VStack {
        OneDotRevolve(progress: value / 10)
        Slider(value: $value, in: 0...10) { Text("Progress") }
      }
    }
  }
}
