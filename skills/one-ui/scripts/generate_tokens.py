#!/usr/bin/env python3
"""Generate web, SwiftUI, Compose, Flutter and optional Xcode asset catalogs from One UI tokens.

Single-source generator with zero external dependencies (Python 3 standard library only).
"""
from __future__ import annotations

import argparse
import json
import math
import re
from pathlib import Path

from spring_physics import Spring
from verify_tokens import (contrast_rows, default_tokens_path, parse_hex, srgb_to_linear,
                           theme_palettes, write_csv)


def camel_to_kebab(name: str) -> str:
    return re.sub(r"([a-z0-9])([A-Z])", r"\1-\2", name).lower()


def hex_to_oklch(hex_color: str) -> str:
    r, g, b, a = parse_hex(hex_color)
    lr, lg, lb = srgb_to_linear(r), srgb_to_linear(g), srgb_to_linear(b)
    l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
    m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
    s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb
    l_ = math.copysign(abs(l) ** (1 / 3), l)
    m_ = math.copysign(abs(m) ** (1 / 3), m)
    s_ = math.copysign(abs(s) ** (1 / 3), s)
    L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
    A = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
    B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    C = math.hypot(A, B)
    H = math.degrees(math.atan2(B, A)) % 360.0
    if C < 1e-5:
        C, H = 0.0, 0.0
    if a < 1.0:
        return f"oklch({L:.4f} {C:.4f} {H:.2f} / {a:.3f})"
    return f"oklch({L:.4f} {C:.4f} {H:.2f})"


def css_colors(palette: dict, keys) -> list[str]:
    lines = []
    for key in keys:
        light, dark = (palette[mode][key] for mode in ("light", "dark"))
        value = light if light == dark else f"light-dark({light}, {dark})"
        comment = f" /* {hex_to_oklch(light)} */" if light == dark else ""
        lines.append(f"    --one-color-{camel_to_kebab(key)}: {value};{comment}")
    return lines


def motion_declarations(motion: dict, name: str) -> list[str]:
    profile = motion["profiles"][name]
    spring = profile["spring"]
    duration = f"var(--one-spring-{spring}-duration)" if spring else f"{profile['utilityMs']}ms"
    easing = f"var(--one-spring-{spring})" if spring else "var(--one-ease)"
    lines = [f"    --one-motion-duration: {duration};", f"    --one-motion-ease: {easing};"]
    for prop in ("translation", "scale", "ambient"):
        lines.append(f"    --one-motion-{prop}: {int(profile[prop])};")
    for label, key in (("fast", "fastMs"), ("standard", "standardMs"), ("max", "maxUtilityMs")):
        value = 0 if name == "reduced" else motion[key]
        lines.append(f"    --one-duration-{label}: {value}ms;")
    for key, spec in motion["springs"].items():
        value = 0 if name == "reduced" else Spring.from_tokens(spec).duration * 1000
        lines.append(f"    --one-spring-{key}-duration: {value:g}ms;")
    return lines


def generate_web_css(tokens: dict, presets: dict) -> str:
    light = tokens["color"]["light"]
    version = tokens["version"]
    lines = [
        f"/* One UI v{version} — Generated Web CSS Tokens (Baseline light-dark() + Cascade Layers) */",
        "/* Source of truth: tokens/one.tokens.json — regenerate with generate_tokens.py; do not edit by hand. */",
        "",
        "@layer one.tokens, one.base, one.components, one.utilities;",
        "",
        "@layer one.tokens {",
        "  :root {",
        "    color-scheme: light dark;",
        "",
        "    /* Semantic color roles (exact WCAG 2.2 sRGB pairs via Baseline light-dark()) */",
    ]
    lines.extend(css_colors(tokens["color"], light))
    motion = tokens["motion"]
    for name, spec in motion["springs"].items():
        spring = Spring.from_tokens(spec)
        lines.append(f"    --one-spring-{name}: {spring.css_curve()};")


    lines += [
        "",
        "    /* Action border policy: borderless-filled default */",
        "    --one-action-border-width: 0px;",
        "    --one-action-border-color: transparent;",
        "    --one-neutral-action-border-width: 1px;",
        "    --one-neutral-action-border-color: var(--one-color-border-strong);",
        f"    --one-field-border-width: {tokens['focus']['fieldBorderWidth']}px;",
        "    --one-field-border-color: var(--one-color-border-control);",
        "",
        "    /* Focus ring contract: full 2px perimeter outside 2px separating gap (3px in high contrast) */",
        f"    --one-focus-width: {tokens['focus']['width']}px;",
        f"    --one-focus-offset: {tokens['focus']['offset']}px;",
        "",
        "    /* Typography */",
        f"    --one-font-sans: {tokens['type']['family']};",
        f"    --one-font-mono: {tokens['type']['mono']};",
    ]
    for role in ("display", "pageTitle", "section", "heading", "reading", "longReading", "control", "small", "caption"):
        spec = tokens["type"][role]
        k = camel_to_kebab(role)
        lines.append(f"    --one-type-{k}-size: {spec['size'] / 16:g}rem;")
        if "fluid" in spec:
            lines.append(f"    --one-type-{k}-size-fluid: {spec['fluid']};")
        lines.append(f"    --one-type-{k}-line: {spec['line'] / 16:g}rem;")
        lines.append(f"    --one-type-{k}-weight: {spec['weight']};")
        lines.append(f"    --one-type-{k}-tracking: {spec['trackingEm']}em;")

    lines += ["", "    /* 4px Spacing Scale */"]
    for step, px in tokens["space"].items():
        lines.append(f"    --one-space-{step}: {px}px;")

    lines += ["", "    /* Semantic Radii */"]
    for role, px in tokens["radius"].items():
        lines.append(f"    --one-radius-{camel_to_kebab(role)}: {px}px;")

    lines += ["", "    /* Density (Comfortable default; Compact opt-in via [data-one-density='compact']) */"]
    comf = tokens["density"]["comfortable"]
    lines += [
        f"    --one-control-height: {comf['controlHeight']}px;",
        f"    --one-icon-target: {comf['iconTarget']}px;",
        f"    --one-row-min-height: {comf['rowMinHeight']}px;",
        f"    --one-cell-padding-block: {comf['cellPaddingBlock']}px;",
        f"    --one-action-gap: {comf['actionGap']}px;",
        "",
        "    /* Layout & Reading Measure */",
        f"    --one-layout-min-width: {tokens['layout']['minimumWidth']}px;",
        f"    --one-reading-min: {tokens['layout']['readingMinCh']}ch;",
        f"    --one-reading-max: {tokens['layout']['readingMaxCh']}ch;",
        f"    --one-dialog-max-width: {tokens['layout']['dialogMaxWidthRem']}rem;",
        f"    --one-dialog-max-height: {tokens['layout']['dialogMaxHeightDvh']}dvh;",
        f"    --one-content-max: {tokens['layout']['contentMaxRem']}rem;",
        "",
        "    /* Motion (<= 300ms utility ceiling) */",
        f"    --one-ease: {tokens['motion']['ease']};",
        "",
        "    /* Elevation (quiet by default) */",
        f"    --one-shadow-base: {tokens['elevation']['base']};",
        f"    --one-shadow-popover: {tokens['elevation']['popover']};",
        f"    --one-shadow-dialog: {tokens['elevation']['dialog']};",
        "  }",
        "",
        "  /* Explicit theme overrides for light-dark() */",
        '  [data-one-theme="system"] { color-scheme: light dark; }',
        '  [data-one-theme="light"] { color-scheme: light; }',
        '  [data-one-theme="dark"] { color-scheme: dark; }',
        "",
    ]
    for density in ("comfortable", "compact"):
        lines.append(f'  [data-one-density="{density}"] {{')
        for key, value in tokens["density"][density].items():
            lines.append(f"    --one-{camel_to_kebab(key)}: {value}px;")
        lines.append("  }")
    lines += [
        "  /* Coarse pointers always preserve >= 44px touch targets */",
        "  @media (pointer: coarse) {",
        '    [data-one-density="compact"] {',
        f"      --one-control-height: {tokens['density']['coarsePointerMinTarget']}px;",
        f"      --one-icon-target: {tokens['density']['coarsePointerMinTarget']}px;",
        "    }",
        "  }",
        "",
        '  [data-one-action-border="borderless-filled"] { --_one-bordered: 0; }',
        '  [data-one-action-border="bordered"] { --_one-bordered: 1; }',
        "",
    ]
    # Re-emit the union of overridden roles to allow a nested default preset.
    keys = [key for key in light if any(
        palette[mode][key] != tokens["color"][mode][key]
        for palette in presets.values() for mode in ("light", "dark"))]
    for name, palette in presets.items():
        lines.append(f'  [data-one-preset="{name}"] {{')
        lines.extend(css_colors(palette, keys))
        lines.append("  }")

    # A nested preset resolves its own edges. A system contrast request wins
    # even inside a component that explicitly selects the default preset.
    def edge_tokens(high: bool) -> list[str]:
        focus = tokens["focus"]
        return [
            f"--one-focus-width: {focus['highContrastWidth' if high else 'width']}px;",
            f"--one-field-border-width: {focus['fieldHighContrastBorderWidth' if high else 'fieldBorderWidth']}px;",
            f"--one-field-border-color: var(--one-color-border-{'high-contrast' if high else 'control'});",
            f"--one-neutral-action-border-width: {2 if high else 1}px;",
            f"--one-neutral-action-border-color: var(--one-color-border-{'high-contrast' if high else 'strong'});",
        ]

    for selector, high in [("[data-one-preset]", False), ('[data-one-preset="high-contrast"]', True)]:
        lines.append(f"  {selector} {{")
        lines.extend("    " + declaration for declaration in edge_tokens(high))
        lines.append("  }")
    lines += ["  @media (prefers-contrast: more) {", "    :root, [data-one-preset] {"]
    lines.extend("      " + declaration for declaration in edge_tokens(True))
    lines += ["    }", "  }",
              "  :root, [data-one-preset], [data-one-action-border] {",
              "    --one-action-border-width: calc(var(--_one-bordered, 0) * var(--one-neutral-action-border-width));",
              "    --one-action-border-color: var(--one-neutral-action-border-color);",
              "  }"]
    for name in ("calm", "tactile", "reduced"):
        default = ":root, " if name == motion["defaultProfile"] else ""
        lines.append(f'  {default}[data-one-motion="{name}"] {{')
        lines.extend(motion_declarations(motion, name))
        lines.append("  }")
    lines.extend(["  @media (prefers-reduced-motion: reduce) {", "    :root, [data-one-motion] {"])
    lines.extend("  " + line for line in motion_declarations(motion, "reduced"))
    lines.extend(["    }", "  }", "}", ""])
    return "\n".join(lines)


def generate_tailwind_v4(tokens: dict) -> str:
    light = tokens["color"]["light"]
    version = tokens["version"]
    lines = [
        f"/* One UI v{version} — Generated Tailwind CSS v4 @theme Bridge */",
        "/* Import after `@import \"tailwindcss\";` and `@import \"./one-tokens.css\";`. */",
        "/* Source of truth: tokens/one.tokens.json — regenerate with generate_tokens.py. */",
        "",
        "@theme inline {",
        "  /* Semantic Color Roles (prefixed `one-*` to coexist cleanly or map to project tokens) */",
    ]
    for key in light:
        k = camel_to_kebab(key)
        lines.append(f"  --color-one-{k}: var(--one-color-{k});")

    lines += [
        "",
        "  /* Typography */",
        "  --font-sans: var(--one-font-sans);",
        "  --font-mono: var(--one-font-mono);",
        "",
        "  /* Radii */",
    ]
    for role in tokens["radius"]:
        k = camel_to_kebab(role)
        lines.append(f"  --radius-one-{k}: var(--one-radius-{k});")

    for name in tokens["motion"]["springs"]:
        lines.append(f"  --ease-one-{name}: var(--one-spring-{name});")

    lines += [
        "",
        "  /* Motion */",
        "  --ease-one: var(--one-ease);",
        "",
        "  /* Shadows */",
        "  --shadow-one-popover: var(--one-shadow-popover);",
        "  --shadow-one-dialog: var(--one-shadow-dialog);",
        "}",
        "",
        "/* Explicit dark mode variant matching both OS preference and [data-one-theme='dark'] */",
        '@custom-variant dark (&:where([data-one-theme="dark"], [data-one-theme="dark"] *));',
        "",
    ]
    return "\n".join(lines)


def generate_swift(tokens: dict, category_map: dict[str, str] | None = None) -> str:
    version = tokens["version"]
    light = tokens["color"]["light"]
    dark = tokens["color"]["dark"]
    categories = category_map or {}
    base_roles = [r for r in light if not r.startswith("category")]

    def hex_tuple(hex_val: str) -> str:
        r, g, b, a = parse_hex(hex_val)
        return f"red: {r:.6f}, green: {g:.6f}, blue: {b:.6f}, opacity: {a:.4f}"

    lines = [
        f"// One UI v{version} — Generated SwiftUI Semantic Tokens (iOS, macOS, watchOS)",
        "// Source of truth: tokens/one.tokens.json — regenerate with generate_tokens.py; do not edit by hand.",
        "// BoardUI free-source provenance (MIT) & Inter Variable 4.1 (SIL OFL 1.1) — see NOTICE.md.",
        "import SwiftUI",
        "#if canImport(UIKit)",
        "import UIKit",
        "#elseif canImport(AppKit)",
        "import AppKit",
        "#endif",
        "",
        "@available(iOS 17, macOS 14, watchOS 10, tvOS 17, *)",
        "private struct AdaptiveColor: ShapeStyle, Hashable {",
        "    let light: Color",
        "    let dark: Color",
        "    func resolve(in environment: EnvironmentValues) -> Color.Resolved {",
        "        (environment.colorScheme == .dark ? dark : light).resolve(in: environment)",
        "    }",
        "}",
        "",
        "public enum OneColor {",
        "    /// Creates a dynamic color resolving exact sRGB light/dark token values across iOS, macOS, and watchOS.",
        "    private static func dynamic(light: (Double, Double, Double, Double), dark: (Double, Double, Double, Double)) -> Color {",
        "        if #available(iOS 17, macOS 14, watchOS 10, tvOS 17, *) {",
        "            return Color(AdaptiveColor(",
        "                light: Color(.sRGB, red: light.0, green: light.1, blue: light.2, opacity: light.3),",
        "                dark: Color(.sRGB, red: dark.0, green: dark.1, blue: dark.2, opacity: dark.3)))",
        "        }",
        "        #if canImport(UIKit) && !os(watchOS)",
        "        return Color(UIColor { traits in",
        "            let c = traits.userInterfaceStyle == .dark ? dark : light",
        "            return UIColor(red: c.0, green: c.1, blue: c.2, alpha: c.3)",
        "        })",
        "        #elseif canImport(AppKit)",
        "        return Color(NSColor(name: nil) { appearance in",
        "            let isDark = appearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua",
        "            let c = isDark ? dark : light",
        "            return NSColor(srgbRed: c.0, green: c.1, blue: c.2, alpha: c.3)",
        "        })",
        "        #else",
        "        // watchOS is dark-appearance by default; use Color(\"<role>\") from Design.xcassets if supporting custom themes.",
        "        return Color(.sRGB, red: dark.0, green: dark.1, blue: dark.2, opacity: dark.3)",
        "        #endif",
        "    }",
        "",
    ]
    for role in base_roles:
        lr, lg, lb, la = parse_hex(light[role])
        dr, dg, db, da = parse_hex(dark[role])
        if light[role].lower() == dark[role].lower():
            lines.append(f"    public static let {role} = Color(.sRGB, {hex_tuple(light[role])})")
        else:
            lines.append(
                f"    public static let {role} = dynamic("
                f"light: ({lr:.6f}, {lg:.6f}, {lb:.6f}, {la:.4f}), "
                f"dark: ({dr:.6f}, {dg:.6f}, {db:.6f}, {da:.4f}))"
            )

    if categories:
        lines.append("")
        lines.append("    // Product-mapped category roles (palette names stay inside this generator)")
        for domain_name, source_role in categories.items():
            lines.append(f"    public static let {domain_name} = Color(.sRGB, {hex_tuple(light[source_role])})")
    else:
        lines.append("")
        lines.append("    // Base category accents — alias to product domain meanings in your app adapter.")
        for cat in ("categoryBlue", "categoryLavender", "categoryGreen"):
            lines.append(f"    public static let {cat} = Color(.sRGB, {hex_tuple(light[cat])})")

    lines += ["}", "", "public enum OneSpace {"]
    for alias, px in tokens["spaceAliases"].items():
        lines.append(f"    public static let {alias}: CGFloat = {px}")

    lines += ["}", "", "public enum OneRadius {"]
    for role, px in tokens["radius"].items():
        lines.append(f"    public static let {role}: CGFloat = {px}")

    comf = tokens["density"]["comfortable"]
    comp = tokens["density"]["compact"]
    reading_pt = tokens["type"]["reading"]["size"] * tokens["layout"]["appleReadingMaxEm"]
    lines += [
        "}",
        "",
        "public enum OneLayout {",
        f"    public static let controlHeight: CGFloat = {comf['controlHeight']}",
        f"    public static let compactControlHeight: CGFloat = {comp['controlHeight']}",
        f"    public static let rowMinHeight: CGFloat = {comf['rowMinHeight']}",
        f"    public static let actionGap: CGFloat = {comf['actionGap']}",
        f"    public static let focusRingWidth: CGFloat = {tokens['focus']['width']}",
        f"    public static let focusRingHighContrastWidth: CGFloat = {tokens['focus']['highContrastWidth']}",
        f"    public static let focusGap: CGFloat = {tokens['focus']['offset']}",
        f"    public static let fieldBorderWidth: CGFloat = {tokens['focus']['fieldBorderWidth']}",
        f"    public static let fieldHighContrastBorderWidth: CGFloat = {tokens['focus']['fieldHighContrastBorderWidth']}",
        f"    /// Native reading cap: {tokens['layout']['appleReadingMaxEm']}em at default 16pt reading size; Dynamic Type wraps naturally.",
        f"    public static let readingMaxWidth: CGFloat = {reading_pt}",
        "}",
        "",
        "public enum OneMotion {",
        f"    public static let fastSeconds: Double = {tokens['motion']['fastMs'] / 1000:.3f}",
        f"    public static let standardSeconds: Double = {tokens['motion']['standardMs'] / 1000:.3f}",
        f"    public static let maxUtilitySeconds: Double = {tokens['motion']['maxUtilityMs'] / 1000:.3f}",
        "    /// Exact One UI cubic-bezier(.3, .06, .06, .79) timing curve.",
        "    public static func standard(reducedMotion: Bool) -> Animation? {",
        "        reducedMotion ? nil : .timingCurve(0.30, 0.06, 0.06, 0.79, duration: standardSeconds)",
        "    }",
        "    public static func fast(reducedMotion: Bool) -> Animation? {",
        "        reducedMotion ? nil : .timingCurve(0.30, 0.06, 0.06, 0.79, duration: fastSeconds)",
        "    }",
        "}",
        "",
        "public enum OneTypography {",
    ]
    weights = {300: "light", 400: "regular", 500: "medium", 600: "semibold"}
    font_name = tokens["type"].get("appleFontName", "InterVariable")
    for role in ("display", "pageTitle", "section", "heading", "reading", "longReading", "control", "small", "caption"):
        spec = tokens["type"][role]
        w = weights[spec["weight"]]
        rel = spec["appleRelativeTo"]
        lines.append(
            f'    public static let {role} = Font.custom("{font_name}", size: {spec["size"]}, relativeTo: .{rel}).weight(.{w})'
        )
    lines += [
        "    /// Monospaced digits for timestamps, counts, and sensor measurements.",
        "    public static let metricNumeric = reading.monospacedDigit()",
        "}",
        "",
    ]
    lines += ["public enum OneTokens {"]
    for member in ("Color", "Space", "Radius", "Layout", "Motion", "Typography"):
        lines.append(f"    public typealias {member} = One{member}")
    lines.append("    public enum Density {")
    for density in ("comfortable", "compact"):
        lines.append(f"        public enum {density.title()} {{")
        for key, value in tokens["density"][density].items():
            lines.append(f"            public static let {key}: CGFloat = {value}")
        lines.append("        }")
    lines += ["    }", "    public enum Springs {"]
    for name, spec in tokens["motion"]["springs"].items():
        lines.append(f"        public static let {name} = Animation.interpolatingSpring("
                     f"mass: {spec['mass']}, stiffness: {spec['stiffness']}, damping: {spec['damping']})")
        lines.append(f"        public static let {name}Response = Animation.spring("
                     f"response: {spec['response']}, dampingFraction: {spec['dampingFraction']})")
    lines += ["    }", "}", ""]
    return "\n".join(lines)


def generate_xcassets(tokens: dict, assets_dir: Path, category_map: dict[str, str] | None = None) -> int:
    assets_dir.mkdir(parents=True, exist_ok=True)
    info = {"author": "xcode", "version": 1}
    (assets_dir / "Contents.json").write_text(json.dumps({"info": info}, indent=2) + "\n", encoding="utf-8")

    categories = category_map or {}
    base_roles = [r for r in tokens["color"]["light"] if not r.startswith("category")]
    role_names = base_roles + (list(categories) if categories else ["categoryBlue", "categoryLavender", "categoryGreen"])

    for role in role_names:
        source_role = categories.get(role, role)
        colors = []
        for theme in ("light", "dark"):
            r, g, b, a = parse_hex(tokens["color"][theme][source_role])
            entry = {
                "idiom": "universal",
                "color": {
                    "color-space": "srgb",
                    "components": {
                        "red": f"{r:.8f}",
                        "green": f"{g:.8f}",
                        "blue": f"{b:.8f}",
                        "alpha": f"{a:.8f}",
                    },
                },
            }
            if theme == "dark":
                entry["appearances"] = [{"appearance": "luminosity", "value": "dark"}]
            colors.append(entry)
        target = assets_dir / f"{role}.colorset"
        target.mkdir(exist_ok=True)
        (target / "Contents.json").write_text(json.dumps({"colors": colors, "info": info}, indent=2) + "\n", encoding="utf-8")
    return len(role_names)


def argb(value: str) -> str:
    alpha = value[7:] or "ff"
    return "0x" + (alpha + value[1:7]).upper()


def pascal(name: str) -> str:
    return "".join(part.title() for part in name.split("-"))


def generate_compose(tokens: dict, presets: dict) -> str:
    lines = [
        "// Generated from one.tokens.json by generate_tokens.py.",
        "package one.ui", "", "import androidx.compose.animation.core.SpringSpec",
        "import androidx.compose.animation.core.spring", "import androidx.compose.foundation.isSystemInDarkTheme",
        "import androidx.compose.runtime.Composable", "import androidx.compose.ui.graphics.Color",
        "import androidx.compose.ui.unit.dp", "", "data class OnePalette(",
    ]
    for key in tokens["color"]["light"]:
        lines.append(f"    val {key}: Color,")
    lines += [")", "", "object OneTokens {"]
    for mode, palette in tokens["color"].items():
        lines.append(f"    val {mode} = OnePalette(")
        lines.extend(f"        {key} = Color({argb(value)})," for key, value in palette.items())
        lines.append("    )")
    for name, colors in presets.items():
        for mode, palette in colors.items():
            changed = [(key, value) for key, value in palette.items() if value != tokens["color"][mode][key]]
            base = f"    private val {mode}{pascal(name)} = {mode}"
            if changed:
                lines.append(base + ".copy(")
                lines.extend(f"        {key} = Color({argb(value)})," for key, value in changed)
                lines.append("    )")
            else:
                lines.append(base)
    lines += ["", "    @Composable", '    fun colors(darkTheme: Boolean = isSystemInDarkTheme(), preset: String = "default"): OnePalette =',
              "        when (preset) {"]
    for name in presets:
        lines.append(f'            "{name}" -> if (darkTheme) dark{pascal(name)} else light{pascal(name)}')
    lines += ["            else -> if (darkTheme) dark else light", "        }", ""]
    for name, values in (("Space", tokens["spaceAliases"]), ("Radius", tokens["radius"])):
        lines.append(f"    object {name} {{")
        lines.extend(f"        val {key} = {value}.dp" for key, value in values.items())
        lines.append("    }")
    lines += ["}", "", "object OneSprings {"]
    for name, spec in tokens["motion"]["springs"].items():
        omega = math.sqrt(spec["stiffness"] / spec["mass"])
        ratio = spec["damping"] / (2 * omega * spec["mass"])
        # Compose assumes unit mass. Normalize physical coefficients first.
        lines.append(f"    val {name}: SpringSpec<Float> = spring(dampingRatio = {ratio:.8f}f, "
                     f"stiffness = {spec['stiffness']/spec['mass']:.6f}f)")
    return "\n".join([*lines, "}", ""])


def generate_flutter(tokens: dict, presets: dict) -> str:
    lines = [
        "// Generated from one.tokens.json by generate_tokens.py.",
        "import 'dart:ui' show Brightness, Color;", "import 'package:flutter/physics.dart' show SpringDescription;",
        "", "class OnePalette {", "  final Map<String, Color> _colors;", "  const OnePalette._(this._colors);", "",
    ]
    for key in tokens["color"]["light"]:
        lines.append(f"  Color get {key} => _colors['{key}']!;")
    lines += ["}", "", "class OneTokens {", "  OneTokens._();"]
    for mode, palette in tokens["color"].items():
        lines.append(f"  static const _{mode} = <String, Color>{{")
        lines.extend(f"    '{key}': Color({argb(value)})," for key, value in palette.items())
        lines += ["  };", f"  static const {mode} = OnePalette._(_{mode});"]
    lines += ["", "  static final _presets = {"]
    for name, colors in presets.items():
        lines.append(f"    '{name}': {{")
        for mode, palette in colors.items():
            lines += [f"      Brightness.{mode}: OnePalette._({{", f"        ..._{mode},"]
            lines.extend(f"        '{key}': Color({argb(value)})," for key, value in palette.items()
                         if value != tokens["color"][mode][key])
            lines.append("      }),")
        lines.append("    },")
    lines += ["  };", "", "  static OnePalette colors(Brightness brightness, {String preset = 'default'}) =>",
              "      (_presets[preset] ?? _presets['default']!)[brightness]!;"]
    for group, values in (("space", tokens["spaceAliases"]), ("radius", tokens["radius"])):
        for key, value in values.items():
            lines.append(f"  static const double {group}{key[0].upper() + key[1:]} = {value};")
    lines += ["}", "", "class OneSprings {", "  OneSprings._();"]
    for name, spec in tokens["motion"]["springs"].items():
        lines.append(f"  static const {name} = SpringDescription(mass: {spec['mass']}, "
                     f"stiffness: {spec['stiffness']}, damping: {spec['damping']});")
    return "\n".join([*lines, "}", ""])


def generate_compat(web_css: str) -> str:
    # Rebind at configuration boundaries: a var() alias on :root alone would
    # inherit its root value and miss nested preset, density or motion overrides.
    lines = ['@import "./one-tokens.css";', "", "@layer one.tokens {",
             "  :root, [data-one-theme], [data-one-preset], [data-one-density],",
             "  [data-one-action-border], [data-one-motion] {"]
    for suffix in sorted(set(re.findall(r"--one-([\w-]+)\s*:", web_css))):
        lines.append(f"    --al-{suffix}: var(--one-{suffix});")
    return "\n".join([*lines, "  }", "}", ""])


def category_aliases(value: str, tokens: dict) -> dict:
    aliases = {}
    categories = {key for key in tokens["color"]["light"] if key.startswith("category")}
    for pair in filter(None, value.split(",")):
        name, _, role = (part.strip() for part in pair.partition("="))
        if (not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", name) or role not in categories or
                name in aliases or name in tokens["color"]["light"].keys() - categories):
            raise ValueError(f"Invalid category alias {pair!r}")
        aliases[name] = role
    return aliases


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tokens", type=Path, default=default_tokens_path())
    parser.add_argument("--themes-dir", type=Path, help="Defaults to themes/ alongside the input tokens")
    parser.add_argument("--out-web", type=Path, help="Directory for CSS, Tailwind v4 and compatibility aliases")
    parser.add_argument("--out-swift", type=Path)
    parser.add_argument("--out-android", "--out-kotlin", type=Path)
    parser.add_argument("--out-flutter", "--out-dart", type=Path)
    parser.add_argument("--csv", "--write-csv", type=Path)
    parser.add_argument("--out-xcassets", type=Path)
    parser.add_argument("--category-map", default="", help="Comma-separated Swift aliases, e.g. measurement=categoryBlue")
    parser.add_argument("--sync-skill-asset", type=Path, nargs="?", const=Path(__file__).resolve().parents[1]/"assets/one.tokens.json",
                        help="Sync tokens and sibling themes to the skill assets directory")
    args = parser.parse_args()
    if not any((args.out_web, args.out_swift, args.out_android, args.out_flutter, args.csv,
                args.out_xcassets, args.sync_skill_asset)):
        args.out_web = Path("platforms/web")
        args.out_swift = Path("platforms/apple/Sources/OneUI/OneDesignTokens.generated.swift")
        args.out_android = Path("platforms/android/OneDesignTokens.generated.kt")
        args.out_flutter = Path("platforms/flutter/one_design_tokens.g.dart")
        args.csv = Path("verification/accessibility-contrast.csv")

    try:
        raw = args.tokens.read_bytes()
        tokens = json.loads(raw)
        themes_dir = args.themes_dir or args.tokens.parent / "themes"
        if not args.themes_dir and not themes_dir.exists():
            themes_dir = Path(__file__).resolve().parents[1] / "assets/themes"
        presets = theme_palettes(tokens, themes_dir)
        rows = contrast_rows(tokens, presets)
        failures = [r for r in rows if r["result"] == "fail"]
        if failures:
            first = failures[0]
            raise ValueError(f"{len(failures)} contrast failures, first: {first['preset']} / {first['pair']}")
        categories = category_aliases(args.category_map, tokens)
        files = {}
        if args.out_web:
            css = generate_web_css(tokens, presets)
            files[args.out_web / "one-tokens.css"] = css
            files[args.out_web / "one-tailwind-v4.css"] = generate_tailwind_v4(tokens)
            files[args.out_web / "one-compat-asterline.css"] = generate_compat(css)
        if args.out_swift:
            files[args.out_swift] = generate_swift(tokens, categories)
        if args.out_android:
            files[args.out_android] = generate_compose(tokens, presets)
        if args.out_flutter:
            files[args.out_flutter] = generate_flutter(tokens, presets)
        for path, content in files.items():
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")
            print(f"Generated {path}")
        if args.csv:
            write_csv(rows, args.csv)
            print(f"Generated {args.csv} ({len(rows)} pairs)")
        if args.out_xcassets:
            count = generate_xcassets(tokens, args.out_xcassets, categories)
            print(f"Generated {args.out_xcassets} ({count} colorsets)")
        if args.sync_skill_asset:
            assets = args.sync_skill_asset.parent
            (assets / "themes").mkdir(parents=True, exist_ok=True)
            args.sync_skill_asset.write_bytes(raw)
            for name in presets:
                target = assets / "themes" / f"{name}.json"
                target.write_bytes((themes_dir / target.name).read_bytes())
            print(f"Synced {args.sync_skill_asset} and {len(presets)} presets")
    except (OSError, ValueError, TypeError, KeyError, AttributeError, ArithmeticError) as exc:
        parser.exit(1, f"Generation failed: {exc}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
