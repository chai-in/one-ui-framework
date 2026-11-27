// SPDX-License-Identifier: AGPL-3.0-only
import CoreText
import SwiftUI

/// Swift packages rely on the host to register Inter. Preserve Dynamic Type for either font.
enum OneControlTypography {
  private static var hasInter: Bool {
    let font = CTFontCreateWithName("InterVariable" as CFString, 14, nil)
    return CTFontCopyPostScriptName(font) as String == "InterVariable"
  }

  static var control: Font { hasInter ? OneTypography.control : .callout.weight(.medium) }
  static var reading: Font { hasInter ? OneTypography.reading : .body }
  static var small: Font { hasInter ? OneTypography.small : .footnote }
  static var pageTitle: Font { hasInter ? OneTypography.pageTitle : .largeTitle }
}


public enum OneDensity: Sendable {
  case comfortable, compact

  var target: CGFloat {
    #if os(macOS)
      self == .compact ? OneLayout.compactControlHeight : OneLayout.controlHeight
    #else
      OneLayout.controlHeight
    #endif
  }
}

public enum OneActionBorderPolicy: Sendable { case borderlessFilled, bordered }

public enum OneActionRole: Sendable {
  /// Standalone invitation, hero CTA, or app-owned informational notification action.
  case action
  /// Explicit Yes, Accept, Confirm, or Save decision.
  case accept
  /// Ordinary refusal (No, thanks) without data loss.
  case decline
  /// Delete, Discard, or irreversible data loss (pair with Button(role: .destructive)).
  case destructive
  /// Supporting action, Back, Close, or Cancel.
  case neutral

  public var defaultFill: Color {
    switch self {
    case .action: OneColor.action
    case .accept: OneColor.accept
    case .decline: OneColor.decline
    case .destructive: OneColor.destructive
    case .neutral: OneColor.neutral
    }
  }

  public var hoverFill: Color {
    switch self {
    case .action: OneColor.actionHover
    case .accept: OneColor.acceptHover
    case .decline: OneColor.declineHover
    case .destructive: OneColor.destructiveHover
    case .neutral: OneColor.neutralHover
    }
  }

  public var pressedFill: Color {
    switch self {
    case .action: OneColor.actionActive
    case .accept: OneColor.acceptActive
    case .decline: OneColor.declineActive
    case .destructive: OneColor.destructiveActive
    case .neutral: OneColor.neutralActive
    }
  }

  public var foreground: Color {
    switch self {
    case .action: OneColor.onAction
    case .accept: OneColor.onAccept
    case .decline: OneColor.onDecline
    case .destructive: OneColor.onDestructive
    case .neutral: OneColor.onNeutral
    }
  }
}

/// Shared native ButtonStyle implementing One UI v1.0 action roles, opaque disabled state,
/// width-preserving loading state, pointer hover, and borderless-filled default (opt-in bordered).
/// Pair `isLoading` with `.disabled(isLoading)` on the button, or use `OneButton`.
public struct OneButtonStyle: ButtonStyle {
  public let role: OneActionRole
  public var isLoading: Bool
  public var fullWidth: Bool
  public var borderPolicy: OneActionBorderPolicy
  public var density: OneDensity

  @Environment(\.isEnabled) private var isEnabled
  @Environment(\.colorSchemeContrast) private var contrast
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @Environment(\.oneMotionProfile) private var profile
  @State private var isHovered = false

  public init(
    role: OneActionRole,
    isLoading: Bool = false,
    fullWidth: Bool = false,
    borderPolicy: OneActionBorderPolicy = .borderlessFilled,
    density: OneDensity = .comfortable
  ) {
    self.role = role
    self.isLoading = isLoading
    self.fullWidth = fullWidth
    self.borderPolicy = borderPolicy
    self.density = density
  }

  public func makeBody(configuration: Configuration) -> some View {
    let minHeight = density.target
    let background = resolveFill(isPressed: configuration.isPressed)
    let foreground = isEnabled || isLoading ? role.foreground : OneColor.disabledText
    let needsStroke = role == .neutral || borderPolicy == .bordered
    let strokeWidth: CGFloat = contrast == .increased ? 2 : 1
    let strokeColor: Color =
      contrast == .increased ? OneColor.borderHighContrast : OneColor.borderStrong

    configuration.label
      .multilineTextAlignment(.center)
      .fixedSize(horizontal: false, vertical: true)
    .font(OneControlTypography.control)
    .foregroundStyle(foreground)
    .padding(.horizontal, OneSpace.lg)
    .padding(.vertical, OneSpace.xs)
    .frame(minWidth: minHeight, maxWidth: fullWidth ? .infinity : nil, minHeight: minHeight)
    .overlay(alignment: .leading) {
      if isLoading {
        Group {
          if reduceMotion || profile == .reduced {
            Image(systemName: "hourglass").font(.system(size: OneSpace.sm))
          } else {
            ProgressView()
              .progressViewStyle(.circular)
              .tint(foreground)
              .controlSize(.mini)
          }
        }
        .foregroundStyle(foreground)
        .frame(width: OneSpace.lg)
        .accessibilityHidden(true)
        .allowsHitTesting(false)
      }
    }
    .background(
      RoundedRectangle(cornerRadius: OneRadius.control, style: .continuous)
        .fill(background)
    )
    .overlay(
      RoundedRectangle(cornerRadius: OneRadius.control, style: .continuous)
        .strokeBorder(needsStroke ? strokeColor : .clear, lineWidth: needsStroke ? strokeWidth : 0)
    )
    .contentShape(RoundedRectangle(cornerRadius: OneRadius.control, style: .continuous))
    .animation(
      profile.animation(.snappy, accessibilityReduceMotion: reduceMotion),
      value: configuration.isPressed
    )
    #if os(macOS)
      .onHover { hovering in isHovered = hovering }
    #endif
    .accessibilityValue(isLoading ? Text("Loading") : Text(""))
    .allowsHitTesting(!isLoading)
  }

  private func resolveFill(isPressed: Bool) -> Color {
    if isLoading { return role.defaultFill }
    if !isEnabled { return OneColor.disabledFill }
    if isPressed {
      return role.pressedFill
    }
    if isHovered {
      return role.hoverFill
    }
    return role.defaultFill
  }
}

/// Full 2pt perimeter focus ring outside a 2pt separating gap (3pt under Increase Contrast).
public struct OneFocusRingModifier: ViewModifier {
  public let isFocused: Bool
  public var cornerRadius: CGFloat

  @Environment(\.colorSchemeContrast) private var contrast

  public init(isFocused: Bool, cornerRadius: CGFloat = OneRadius.control) {
    self.isFocused = isFocused
    self.cornerRadius = cornerRadius
  }

  public func body(content: Content) -> some View {
    let ringWidth =
      contrast == .increased
      ? OneLayout.focusRingHighContrastWidth
      : OneLayout.focusRingWidth
    let gap = OneLayout.focusGap

    content
      .overlay(
        RoundedRectangle(cornerRadius: cornerRadius + gap, style: .continuous)
          .strokeBorder(OneColor.focusGap, lineWidth: gap)
          .padding(-gap)
          .opacity(isFocused ? 1 : 0)
          .allowsHitTesting(false)
      )
      .overlay(
        RoundedRectangle(cornerRadius: cornerRadius + gap + ringWidth, style: .continuous)
          .strokeBorder(OneColor.focus, lineWidth: ringWidth)
          .padding(-(gap + ringWidth))
          .opacity(isFocused ? 1 : 0)
          .allowsHitTesting(false)
      )
  }
}

/// Essential editable-field boundary strengthening to 2pt high-contrast under Increase Contrast.
public struct OneFieldStyle: ViewModifier {
  public var isInvalid: Bool
  @Environment(\.colorSchemeContrast) private var contrast

  public init(isInvalid: Bool = false) {
    self.isInvalid = isInvalid
  }

  public func body(content: Content) -> some View {
    let width =
      contrast == .increased
      ? OneLayout.fieldHighContrastBorderWidth
      : OneLayout.fieldBorderWidth
    let borderColor: Color =
      isInvalid
      ? OneColor.dangerText
      : (contrast == .increased ? OneColor.borderHighContrast : OneColor.borderControl)

    content
      .font(OneControlTypography.reading)
      .padding(.horizontal, OneSpace.sm)
      .padding(.vertical, OneSpace.xs)
      .frame(minHeight: OneLayout.controlHeight)
      .background(
        RoundedRectangle(cornerRadius: OneRadius.control, style: .continuous)
          .fill(OneColor.surface)
      )
      .overlay(
        RoundedRectangle(cornerRadius: OneRadius.control, style: .continuous)
          .strokeBorder(borderColor, lineWidth: width)
      )
  }
}

extension View {
  public func oneFocusRing(_ isFocused: Bool, cornerRadius: CGFloat = OneRadius.control)
    -> some View
  {
    modifier(OneFocusRingModifier(isFocused: isFocused, cornerRadius: cornerRadius))
  }

  public func oneField(isInvalid: Bool = false) -> some View {
    modifier(OneFieldStyle(isInvalid: isInvalid))
  }

  public func oneReadingWidth() -> some View {
    frame(maxWidth: OneLayout.readingMaxWidth, alignment: .leading)
  }
}

public struct OneButton<Label: View>: View {
  private let role: OneActionRole
  private let loading: Bool
  private let action: () -> Void
  private let label: Label

  public init(
    role: OneActionRole = .action, isLoading: Bool = false, action: @escaping () -> Void,
    @ViewBuilder label: () -> Label
  ) {
    self.role = role
    loading = isLoading
    self.action = action
    self.label = label()
  }

  public var body: some View {
    Button(role: role == .destructive ? .destructive : nil, action: action) { label }
      .buttonStyle(OneButtonStyle(role: role, isLoading: loading))
      .disabled(loading)
  }
}

public typealias OneFieldModifier = OneFieldStyle

public struct OneChoiceGroup: View {
  let label: String
  let options: [String]
  @Binding var selection: Int

  public init(_ label: String, options: [String], selection: Binding<Int>) {
    self.label = label
    self.options = options
    _selection = selection
  }

  public var body: some View {
    Picker(label, selection: $selection) {
      ForEach(options.indices, id: \.self) { index in
        Text(options[index]).tag(index)
      }
    }
  }
}

public struct OneBadge: View {
  let label: String
  let symbol: String
  @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

  public init(_ label: String, systemImage: String = "info.circle") {
    self.label = label
    self.symbol = systemImage
  }

  public var body: some View {
    Label(label, systemImage: symbol)
      .font(OneControlTypography.small)
      .padding(.horizontal, OneSpace.xs)
      .padding(.vertical, OneSpace.xxs)
      .foregroundStyle(reduceTransparency ? OneColor.textPrimary : OneColor.infoText)
      .background(reduceTransparency ? OneColor.surfaceRaised : OneColor.infoFill, in: Capsule())
      .accessibilityElement(children: .combine)
  }
}

extension View {
  /// Redact private values on watchOS when the system requests privacy.
  @ViewBuilder public func oneWatchPrivacySensitive(_ sensitive: Bool = true) -> some View {
    #if os(watchOS)
      privacySensitive(sensitive)
    #else
      self
    #endif
  }
}
