// One UI v1.0.0 — Generated SwiftUI Semantic Tokens (iOS, macOS, watchOS)
// Source of truth: tokens/one.tokens.json — regenerate with generate_tokens.py; do not edit by hand.
// BoardUI free-source provenance (MIT) & Inter Variable 4.1 (SIL OFL 1.1) — see NOTICE.md.
import SwiftUI
#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

@available(iOS 17, macOS 14, watchOS 10, tvOS 17, *)
private struct AdaptiveColor: ShapeStyle, Hashable {
    let light: Color
    let dark: Color
    func resolve(in environment: EnvironmentValues) -> Color.Resolved {
        (environment.colorScheme == .dark ? dark : light).resolve(in: environment)
    }
}

public enum OneColor {
    /// Creates a dynamic color resolving exact sRGB light/dark token values across iOS, macOS, and watchOS.
    private static func dynamic(light: (Double, Double, Double, Double), dark: (Double, Double, Double, Double)) -> Color {
        if #available(iOS 17, macOS 14, watchOS 10, tvOS 17, *) {
            return Color(AdaptiveColor(
                light: Color(.sRGB, red: light.0, green: light.1, blue: light.2, opacity: light.3),
                dark: Color(.sRGB, red: dark.0, green: dark.1, blue: dark.2, opacity: dark.3)))
        }
        #if canImport(UIKit) && !os(watchOS)
        return Color(UIColor { traits in
            let c = traits.userInterfaceStyle == .dark ? dark : light
            return UIColor(red: c.0, green: c.1, blue: c.2, alpha: c.3)
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil) { appearance in
            let isDark = appearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua
            let c = isDark ? dark : light
            return NSColor(srgbRed: c.0, green: c.1, blue: c.2, alpha: c.3)
        })
        #else
        // watchOS is dark-appearance by default; use Color("<role>") from Design.xcassets if supporting custom themes.
        return Color(.sRGB, red: dark.0, green: dark.1, blue: dark.2, opacity: dark.3)
        #endif
    }

    public static let canvas = dynamic(light: (1.000000, 1.000000, 1.000000, 1.0000), dark: (0.000000, 0.000000, 0.000000, 1.0000))
    public static let surface = dynamic(light: (1.000000, 1.000000, 1.000000, 1.0000), dark: (0.098039, 0.098039, 0.098039, 1.0000))
    public static let surfaceSubtle = dynamic(light: (0.956863, 0.956863, 0.956863, 1.0000), dark: (0.098039, 0.098039, 0.098039, 1.0000))
    public static let surfaceRaised = dynamic(light: (0.917647, 0.917647, 0.917647, 1.0000), dark: (0.129412, 0.129412, 0.129412, 1.0000))
    public static let textPrimary = dynamic(light: (0.000000, 0.000000, 0.000000, 1.0000), dark: (1.000000, 1.000000, 1.000000, 1.0000))
    public static let textSecondary = dynamic(light: (0.349020, 0.349020, 0.349020, 1.0000), dark: (0.784314, 0.784314, 0.784314, 1.0000))
    public static let textMuted = dynamic(light: (0.349020, 0.349020, 0.349020, 1.0000), dark: (0.584314, 0.584314, 0.584314, 1.0000))
    public static let placeholder = dynamic(light: (0.349020, 0.349020, 0.349020, 1.0000), dark: (0.584314, 0.584314, 0.584314, 1.0000))
    public static let borderSubtle = dynamic(light: (0.870588, 0.870588, 0.870588, 1.0000), dark: (0.196078, 0.196078, 0.196078, 1.0000))
    public static let borderControl = Color(.sRGB, red: 0.509804, green: 0.509804, blue: 0.509804, opacity: 1.0000)
    public static let borderStrong = dynamic(light: (0.349020, 0.349020, 0.349020, 1.0000), dark: (0.584314, 0.584314, 0.584314, 1.0000))
    public static let borderHighContrast = dynamic(light: (0.000000, 0.000000, 0.000000, 1.0000), dark: (1.000000, 1.000000, 1.000000, 1.0000))
    public static let action = Color(.sRGB, red: 0.874510, green: 0.831373, blue: 0.603922, opacity: 1.0000)
    public static let actionHover = Color(.sRGB, red: 0.905882, green: 0.874510, blue: 0.686275, opacity: 1.0000)
    public static let actionActive = Color(.sRGB, red: 0.811765, green: 0.756863, blue: 0.517647, opacity: 1.0000)
    public static let onAction = Color(.sRGB, red: 0.000000, green: 0.000000, blue: 0.000000, opacity: 1.0000)
    public static let accept = Color(.sRGB, red: 0.247059, green: 0.439216, blue: 0.341176, opacity: 1.0000)
    public static let acceptHover = Color(.sRGB, red: 0.290196, green: 0.478431, blue: 0.384314, opacity: 1.0000)
    public static let acceptActive = Color(.sRGB, red: 0.203922, green: 0.368627, blue: 0.286275, opacity: 1.0000)
    public static let onAccept = Color(.sRGB, red: 1.000000, green: 1.000000, blue: 1.000000, opacity: 1.0000)
    public static let decline = Color(.sRGB, red: 0.850980, green: 0.564706, blue: 0.564706, opacity: 1.0000)
    public static let declineHover = Color(.sRGB, red: 0.882353, green: 0.643137, blue: 0.643137, opacity: 1.0000)
    public static let declineActive = Color(.sRGB, red: 0.796078, green: 0.498039, blue: 0.498039, opacity: 1.0000)
    public static let onDecline = Color(.sRGB, red: 0.000000, green: 0.000000, blue: 0.000000, opacity: 1.0000)
    public static let destructive = Color(.sRGB, red: 0.678431, green: 0.274510, blue: 0.282353, opacity: 1.0000)
    public static let destructiveHover = Color(.sRGB, red: 0.725490, green: 0.309804, blue: 0.317647, opacity: 1.0000)
    public static let destructiveActive = Color(.sRGB, red: 0.596078, green: 0.239216, blue: 0.250980, opacity: 1.0000)
    public static let onDestructive = Color(.sRGB, red: 1.000000, green: 1.000000, blue: 1.000000, opacity: 1.0000)
    public static let neutral = dynamic(light: (1.000000, 1.000000, 1.000000, 1.0000), dark: (0.098039, 0.098039, 0.098039, 1.0000))
    public static let neutralHover = dynamic(light: (0.956863, 0.956863, 0.956863, 1.0000), dark: (0.129412, 0.129412, 0.129412, 1.0000))
    public static let neutralActive = dynamic(light: (0.917647, 0.917647, 0.917647, 1.0000), dark: (0.196078, 0.196078, 0.196078, 1.0000))
    public static let onNeutral = dynamic(light: (0.000000, 0.000000, 0.000000, 1.0000), dark: (1.000000, 1.000000, 1.000000, 1.0000))
    public static let selected = dynamic(light: (0.984314, 0.960784, 0.807843, 1.0000), dark: (0.274510, 0.250980, 0.160784, 1.0000))
    public static let onSelected = dynamic(light: (0.000000, 0.000000, 0.000000, 1.0000), dark: (1.000000, 1.000000, 1.000000, 1.0000))
    public static let focus = dynamic(light: (0.000000, 0.000000, 0.000000, 1.0000), dark: (0.874510, 0.831373, 0.603922, 1.0000))
    public static let focusGap = dynamic(light: (1.000000, 1.000000, 1.000000, 1.0000), dark: (0.000000, 0.000000, 0.000000, 1.0000))
    public static let disabledFill = dynamic(light: (0.917647, 0.917647, 0.917647, 1.0000), dark: (0.129412, 0.129412, 0.129412, 1.0000))
    public static let disabledText = dynamic(light: (0.349020, 0.349020, 0.349020, 1.0000), dark: (0.721569, 0.721569, 0.721569, 1.0000))
    public static let onCategory = Color(.sRGB, red: 0.000000, green: 0.000000, blue: 0.000000, opacity: 1.0000)
    public static let successText = dynamic(light: (0.086275, 0.396078, 0.203922, 1.0000), dark: (0.525490, 0.937255, 0.674510, 1.0000))
    public static let successFill = dynamic(light: (0.941176, 0.992157, 0.956863, 1.0000), dark: (0.078431, 0.200000, 0.133333, 1.0000))
    public static let warningText = dynamic(light: (0.521569, 0.301961, 0.054902, 1.0000), dark: (0.992157, 0.901961, 0.541176, 1.0000))
    public static let warningFill = dynamic(light: (1.000000, 0.984314, 0.917647, 1.0000), dark: (0.200000, 0.168627, 0.070588, 1.0000))
    public static let dangerText = dynamic(light: (0.725490, 0.109804, 0.109804, 1.0000), dark: (1.000000, 0.400000, 0.400000, 1.0000))
    public static let dangerFill = dynamic(light: (1.000000, 0.945098, 0.949020, 1.0000), dark: (0.231373, 0.090196, 0.090196, 1.0000))
    public static let infoText = dynamic(light: (0.113725, 0.305882, 0.847059, 1.0000), dark: (0.576471, 0.772549, 0.992157, 1.0000))
    public static let infoFill = dynamic(light: (0.937255, 0.964706, 1.000000, 1.0000), dark: (0.090196, 0.156863, 0.231373, 1.0000))
    public static let overlay = dynamic(light: (0.000000, 0.000000, 0.000000, 0.4510), dark: (0.000000, 0.000000, 0.000000, 0.6000))

    // Base category accents — alias to product domain meanings in your app adapter.
    public static let categoryBlue = Color(.sRGB, red: 0.352941, green: 0.721569, blue: 1.000000, opacity: 1.0000)
    public static let categoryLavender = Color(.sRGB, red: 0.615686, green: 0.541176, blue: 1.000000, opacity: 1.0000)
    public static let categoryGreen = Color(.sRGB, red: 0.188235, green: 0.709804, blue: 0.533333, opacity: 1.0000)
}

public enum OneSpace {
    public static let zero: CGFloat = 0
    public static let xxs: CGFloat = 4
    public static let xs: CGFloat = 8
    public static let sm: CGFloat = 12
    public static let md: CGFloat = 16
    public static let lg: CGFloat = 20
    public static let xl: CGFloat = 24
    public static let section: CGFloat = 32
    public static let display: CGFloat = 40
    public static let hero: CGFloat = 48
    public static let page: CGFloat = 64
}

public enum OneRadius {
    public static let small: CGFloat = 6
    public static let control: CGFloat = 12
    public static let workingPanel: CGFloat = 12
    public static let readingDialog: CGFloat = 18
    public static let categoryPanel: CGFloat = 24
    public static let pill: CGFloat = 9999
}

public enum OneLayout {
    public static let controlHeight: CGFloat = 44
    public static let compactControlHeight: CGFloat = 36
    public static let rowMinHeight: CGFloat = 48
    public static let actionGap: CGFloat = 8
    public static let focusRingWidth: CGFloat = 2
    public static let focusRingHighContrastWidth: CGFloat = 3
    public static let focusGap: CGFloat = 2
    public static let fieldBorderWidth: CGFloat = 1
    public static let fieldHighContrastBorderWidth: CGFloat = 2
    /// Native reading cap: 40em at default 16pt reading size; Dynamic Type wraps naturally.
    public static let readingMaxWidth: CGFloat = 640
}

public enum OneMotion {
    public static let fastSeconds: Double = 0.150
    public static let standardSeconds: Double = 0.200
    public static let maxUtilitySeconds: Double = 0.300
    /// Exact One UI cubic-bezier(.3, .06, .06, .79) timing curve.
    public static func standard(reducedMotion: Bool) -> Animation? {
        reducedMotion ? nil : .timingCurve(0.30, 0.06, 0.06, 0.79, duration: standardSeconds)
    }
    public static func fast(reducedMotion: Bool) -> Animation? {
        reducedMotion ? nil : .timingCurve(0.30, 0.06, 0.06, 0.79, duration: fastSeconds)
    }
}

public enum OneTypography {
    public static let display = Font.custom("InterVariable", size: 43, relativeTo: .largeTitle).weight(.light)
    public static let pageTitle = Font.custom("InterVariable", size: 31, relativeTo: .largeTitle).weight(.regular)
    public static let section = Font.custom("InterVariable", size: 24, relativeTo: .title2).weight(.regular)
    public static let heading = Font.custom("InterVariable", size: 20, relativeTo: .headline).weight(.medium)
    public static let reading = Font.custom("InterVariable", size: 16, relativeTo: .body).weight(.regular)
    public static let longReading = Font.custom("InterVariable", size: 18, relativeTo: .body).weight(.regular)
    public static let control = Font.custom("InterVariable", size: 14, relativeTo: .callout).weight(.medium)
    public static let small = Font.custom("InterVariable", size: 13, relativeTo: .footnote).weight(.regular)
    public static let caption = Font.custom("InterVariable", size: 12, relativeTo: .caption).weight(.regular)
    /// Monospaced digits for timestamps, counts, and sensor measurements.
    public static let metricNumeric = reading.monospacedDigit()
}

public enum OneTokens {
    public typealias Color = OneColor
    public typealias Space = OneSpace
    public typealias Radius = OneRadius
    public typealias Layout = OneLayout
    public typealias Motion = OneMotion
    public typealias Typography = OneTypography
    public enum Density {
        public enum Comfortable {
            public static let controlHeight: CGFloat = 44
            public static let iconTarget: CGFloat = 44
            public static let rowMinHeight: CGFloat = 48
            public static let cellPaddingBlock: CGFloat = 12
            public static let actionGap: CGFloat = 8
        }
        public enum Compact {
            public static let controlHeight: CGFloat = 36
            public static let iconTarget: CGFloat = 36
            public static let rowMinHeight: CGFloat = 40
            public static let cellPaddingBlock: CGFloat = 8
            public static let actionGap: CGFloat = 8
        }
    }
    public enum Springs {
        public static let snappy = Animation.interpolatingSpring(mass: 1, stiffness: 420, damping: 32)
        public static let snappyResponse = Animation.spring(response: 0.31, dampingFraction: 0.78)
        public static let tactile = Animation.interpolatingSpring(mass: 1, stiffness: 360, damping: 24)
        public static let tactileResponse = Animation.spring(response: 0.33, dampingFraction: 0.63)
        public static let elastic = Animation.interpolatingSpring(mass: 1, stiffness: 300, damping: 20)
        public static let elasticResponse = Animation.spring(response: 0.36, dampingFraction: 0.58)
        public static let gentle = Animation.interpolatingSpring(mass: 1, stiffness: 220, damping: 26)
        public static let gentleResponse = Animation.spring(response: 0.42, dampingFraction: 0.88)
        public static let detent = Animation.interpolatingSpring(mass: 1, stiffness: 520, damping: 38)
        public static let detentResponse = Animation.spring(response: 0.28, dampingFraction: 0.83)
    }
}
