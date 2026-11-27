#!/usr/bin/env python3
"""Verify One UI v1.0 tokens: schema, WCAG 2.2 luminance contrast pairs, and asset parity.

Zero external dependencies (Python 3 standard library only).
Compares unrounded WCAG 2.2 relative luminance ratios against exact thresholds.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
from spring_physics import Spring
import sys
from pathlib import Path

REQUIRED_THEMES = ("light", "dark")
REQUIRED_COLOR_KEYS = (
    "canvas", "surface", "surfaceSubtle", "surfaceRaised",
    "textPrimary", "textSecondary", "textMuted", "placeholder",
    "borderSubtle", "borderControl", "borderStrong", "borderHighContrast",
    "action", "actionHover", "actionActive", "onAction",
    "accept", "acceptHover", "acceptActive", "onAccept",
    "decline", "declineHover", "declineActive", "onDecline",
    "destructive", "destructiveHover", "destructiveActive", "onDestructive",
    "neutral", "neutralHover", "neutralActive", "onNeutral",
    "selected", "onSelected", "focus", "focusGap",
    "disabledFill", "disabledText",
    "categoryBlue", "categoryLavender", "categoryGreen", "onCategory",
    "successText", "successFill", "warningText", "warningFill",
    "dangerText", "dangerFill", "infoText", "infoFill", "overlay",
)


def parse_hex(value: str) -> tuple[float, float, float, float]:
    if not isinstance(value, str) or not re.fullmatch(r"#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?", value):
        raise ValueError(f"Invalid sRGB hex {value!r}")
    raw = value[1:]
    if len(raw) not in (6, 8):
        raise ValueError(f"Expected 6 or 8 hex digits, got {value!r}")
    r = int(raw[0:2], 16) / 255.0
    g = int(raw[2:4], 16) / 255.0
    b = int(raw[4:6], 16) / 255.0
    a = int(raw[6:8], 16) / 255.0 if len(raw) == 8 else 1.0
    return r, g, b, a


def srgb_to_linear(channel: float) -> float:
    return channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4


def relative_luminance(hex_color: str) -> float:
    r, g, b, a = parse_hex(hex_color)
    if a != 1.0:
        raise ValueError(f"Contrast calculation requires opaque sRGB color, got {hex_color!r}")
    return (
        0.2126 * srgb_to_linear(r)
        + 0.7152 * srgb_to_linear(g)
        + 0.0722 * srgb_to_linear(b)
    )


def contrast_ratio(fg: str, bg: str) -> float:
    low, high = sorted((relative_luminance(fg), relative_luminance(bg)))
    return (high + 0.05) / (low + 0.05)


def build_specified_pairs(tokens: dict) -> list[tuple[str, str, str, float]]:
    """Build the full One UI WCAG luminance contract from canonical tokens."""
    light = tokens["color"]["light"]
    dark = tokens["color"]["dark"]
    pairs: list[tuple[str, str, str, float]] = []

    # 1. Four semantic action roles (theme-invariant fills & foregrounds) x default/hover/pressed/loading x label(4.5)/icon(3)
    action_specs = [
        ("Action / Oat", "action", "actionHover", "actionActive", "onAction"),
        ("Accept / Evergreen", "accept", "acceptHover", "acceptActive", "onAccept"),
        ("Decline / Soft red", "decline", "declineHover", "declineActive", "onDecline"),
        ("Destructive / Muted red", "destructive", "destructiveHover", "destructiveActive", "onDestructive"),
    ]
    for title, default_k, hover_k, active_k, fg_k in action_specs:
        # Verify theme invariance
        for key in (default_k, hover_k, active_k, fg_k):
            if light[key].lower() != dark[key].lower():
                raise ValueError(f"Action token {key} diverges between light and dark themes")
        fg = light[fg_k]
        for state_name, fill_k, cue_name in (
            ("default", default_k, "essential icon"),
            ("hover", hover_k, "essential icon"),
            ("pressed", active_k, "essential icon"),
            ("loading", default_k, "progress indicator"),
        ):
            bg = light[fill_k]
            pairs.append((f"{title}: {state_name} label", fg, bg, 4.5))
            pairs.append((f"{title}: {state_name} {cue_name}", fg, bg, 3.0))

    # 2. Neutral surfaces, text, borders, focus, disabled, selected, neutral actions per theme
    for theme_name, palette in (("light", light), ("dark", dark)):
        surfaces = (
            ("canvas", palette["canvas"]),
            ("surface", palette["surface"]),
            ("subtle", palette["surfaceSubtle"]),
            ("raised", palette["surfaceRaised"]),
        )
        for text_label, text_k in (
            ("Primary text", "textPrimary"),
            ("Secondary text", "textSecondary"),
            ("Muted text", "textMuted"),
            ("Placeholder", "placeholder"),
        ):
            for s_label, s_hex in surfaces:
                pairs.append((f"{theme_name} {text_label}: {s_label}", palette[text_k], s_hex, 4.5))

        for border_label, border_k in (
            ("Control border", "borderControl"),
            ("Strong/action border", "borderStrong"),
            ("higher-contrast edge", "borderHighContrast"),
        ):
            for s_label, s_hex in surfaces:
                pairs.append((f"{theme_name} {border_label}: {s_label}", palette[border_k], s_hex, 3.0))

        for focus_label in ("normal focus", "higher-contrast focus"):
            for s_label, s_hex in surfaces:
                pairs.append((f"{theme_name} {focus_label}: {s_label}", palette["focus"], s_hex, 3.0))
            pairs.append((f"{theme_name} {focus_label}: separating gap", palette["focus"], palette["focusGap"], 3.0))

        pairs.append((f"{theme_name} disabled: label", palette["disabledText"], palette["disabledFill"], 4.5))
        pairs.append((f"{theme_name} selected: label", palette["onSelected"], palette["selected"], 4.5))
        pairs.append((f"{theme_name} selected: marker", palette["onSelected"], palette["selected"], 3.0))

        for state_name, bg_k in (("default", "neutral"), ("hover", "neutralHover"), ("pressed", "neutralActive")):
            pairs.append((f"{theme_name} neutral action: {state_name} label", palette["onNeutral"], palette[bg_k], 4.5))

    # 3. Status pairs (light & dark)
    for status_label, text_k, fill_k in (
        ("Success", "successText", "successFill"),
        ("Warning", "warningText", "warningFill"),
        ("Danger/error", "dangerText", "dangerFill"),
        ("Information", "infoText", "infoFill"),
    ):
        for theme_name, palette in (("light", light), ("dark", dark)):
            pairs.append((f"{theme_name} {status_label}: status text", palette[text_k], palette[fill_k], 4.5))
            pairs.append((f"{theme_name} {status_label}: status icon", palette[text_k], palette[fill_k], 3.0))

    # 4. Informational Oat notification + category fills
    pairs.append(("informational Oat notification: label", light["onAction"], light["action"], 4.5))
    pairs.append(("informational Oat notification: icon", light["onAction"], light["action"], 3.0))

    for cat_label, cat_k in (
        ("Blue category", "categoryBlue"),
        ("Lavender category", "categoryLavender"),
        ("Green category", "categoryGreen"),
    ):
        for mode, palette in tokens["color"].items():
            pairs.append((f"{mode} {cat_label}: label", palette["onCategory"], palette[cat_k], 4.5))
            pairs.append((f"{mode} {cat_label}: icon", palette["onCategory"], palette[cat_k], 3.0))

    return pairs


def validate_schema(tokens: dict) -> list[str]:
    errors: list[str] = []
    if tokens.get("schemaVersion") != 3:
        errors.append(f"Unsupported schemaVersion: {tokens.get('schemaVersion')!r}")
    colors = tokens.get("color", {})
    for theme in REQUIRED_THEMES:
        if theme not in colors:
            errors.append(f"Missing color.{theme}")
            continue
        for key in REQUIRED_COLOR_KEYS:
            if key not in colors[theme]:
                errors.append(f"Missing color.{theme}.{key}")
            else:
                try:
                    parse_hex(colors[theme][key])
                except Exception as exc:
                    errors.append(f"Invalid hex at color.{theme}.{key}: {exc}")
    # Ensure spacing is on the 4px grid
    space = tokens.get("space", {})
    space_values = space.values() if isinstance(space, dict) else space
    for v in space_values:
        if not isinstance(v, int) or v % 4 != 0:
            errors.append(f"Spacing value {v!r} is off the 4px grid")
    # Ensure motion cap is honored
    motion = tokens.get("motion", {})
    if motion.get("maxUtilityMs", 999) > 300:
        errors.append(f"motion.maxUtilityMs exceeds 300ms: {motion.get('maxUtilityMs')}")
    for name in ("snappy", "tactile", "elastic", "gentle", "detent"):
        if name not in motion.get("springs", {}):
            errors.append(f"Missing motion.springs.{name}")
    for name, spec in motion.get("springs", {}).items():
        try:
            spring = Spring.from_tokens(spec)
            if not 0 < spring.duration < float("inf"):
                raise ValueError("spring must settle in finite time")
        except (TypeError, KeyError, ValueError, ArithmeticError) as exc:
            errors.append(f"motion.springs.{name}: {exc}")
    if motion.get("defaultProfile") != "calm":
        errors.append("Default motion profile must be calm")
    for name in ("calm", "tactile", "reduced"):
        profile = motion.get("profiles", {}).get(name, {})
        if not {"spring", "utilityMs", "translation", "scale", "ambient"} <= profile.keys():
            errors.append(f"Incomplete motion.profiles.{name}")
        elif profile["spring"] is not None and profile["spring"] not in motion["springs"]:
            errors.append(f"Unknown spring in motion.profiles.{name}")
        elif name == "reduced" and any(profile.values()):
            errors.append("Reduced motion must be immediate and stationary")
    return errors


def default_tokens_path() -> Path:
    here = Path(__file__).resolve()
    candidates = [
        here.parents[3] / "tokens/one.tokens.json",
        here.parents[1] / "assets/one.tokens.json",
    ]
    for path in candidates:
        if path.exists():
            return path
    return candidates[0]


def theme_palettes(tokens: dict, directory: Path) -> dict:
    """Resolve sparse per-mode overrides against the canonical palette."""
    presets = {}
    for path in sorted(directory.glob("*.json")):
        preset = json.loads(path.read_bytes())
        name = preset["id"]
        if name != path.stem or not re.fullmatch(r"[a-z][a-z0-9-]*", name):
            raise ValueError(f"{path}: id must match the filename and be a CSS identifier")
        overrides = preset["color"]
        if set(overrides) != {"light", "dark"}:
            raise ValueError(f"{name}: expected light and dark color overrides")
        palette = {}
        for mode, values in overrides.items():
            unknown = values.keys() - tokens["color"][mode].keys()
            if unknown:
                raise ValueError(f"{name}.{mode}: unknown color roles {sorted(unknown)}")
            palette[mode] = {**tokens["color"][mode], **values}
        presets[name] = palette
    missing = {"default", "high-contrast", "paper-editorial", "obsidian-studio"} - presets.keys()
    if missing:
        raise ValueError(f"{directory}: missing presets {sorted(missing)}")
    return presets


def contrast_rows(tokens: dict, presets: dict) -> list[dict]:
    rows = []
    for preset, palette in [("canonical", tokens["color"]), *presets.items()]:
        resolved = {**tokens, "color": palette}
        errors = validate_schema(resolved)
        if errors:
            raise ValueError(f"{preset}: " + ", ".join(errors))
        for pair, fg, bg, threshold in build_specified_pairs(resolved):
            ratio = contrast_ratio(fg, bg)
            rows.append({
                "preset": preset, "pair": pair, "foreground": fg.upper(), "background": bg.upper(),
                "threshold": f"{threshold:g}", "ratio": repr(ratio),
                "result": "pass" if ratio >= threshold else "fail",
            })
    return rows


def write_csv(rows: list[dict], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=list(rows[0]), lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tokens", type=Path, default=default_tokens_path())
    parser.add_argument("--themes-dir", type=Path, help="Check all preset overrides in this directory")
    parser.add_argument("--check-sync", type=Path, help="Require a byte-identical installed token asset")
    parser.add_argument("--csv", "--write-csv", dest="csv", type=Path)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    errors, rows = [], []
    tokens = {}
    try:
        raw = args.tokens.read_bytes()
        tokens = json.loads(raw)
        if args.check_sync and raw != args.check_sync.read_bytes():
            errors.append(f"Token sync mismatch: {args.check_sync}")
        presets = theme_palettes(tokens, args.themes_dir) if args.themes_dir else {}
        rows = contrast_rows(tokens, presets)
        if args.csv:
            write_csv(rows, args.csv)
    except (OSError, ValueError, TypeError, KeyError, AttributeError, ArithmeticError) as exc:
        errors.append(str(exc))

    failures = [row for row in rows if row["result"] == "fail"]
    scope = "Solid-color sRGB arithmetic. Rendered contrast, keyboard and assistive behavior require per-artifact checks."
    separation = None
    if rows:
        palette = tokens["color"]["light"]
        separation = contrast_ratio(palette["accept"], palette["destructive"])
    if args.json:
        print(json.dumps({"tokens": str(args.tokens), "version": tokens.get("version"), "schemaErrors": errors,
                          "pairsChecked": len(rows), "pairsFailed": len(failures), "evidenceScope": scope,
                          "acceptVsDestructiveLuminanceRatio": separation}, indent=2))
    else:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        for row in failures:
            print(f"FAIL {row['preset']} {row['pair']}: {row['ratio']} < {row['threshold']}", file=sys.stderr)
        print(f"{len(rows) - len(failures)}/{len(rows)} contrast pairs passed. {scope}")
    return int(bool(errors or failures))


if __name__ == "__main__":
    raise SystemExit(main())
