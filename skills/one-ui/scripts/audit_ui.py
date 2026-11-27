#!/usr/bin/env python3
"""Static UI auditor for One UI (Web, SwiftUI, Compose and Flutter).

Zero external dependencies (Python 3 standard library only).
Emits terse `file:line  ONE-xx  message` diagnostics for agent-driven fixes.
Static checks catch common regressions; they do NOT certify rendered contrast or assistive behavior.
"""
from __future__ import annotations

import argparse
import json
import os
import re
from collections import Counter
from dataclasses import dataclass
from pathlib import Path

WEB_EXTS = {".tsx", ".jsx", ".ts", ".js", ".html", ".htm", ".css", ".scss", ".svelte", ".vue"}
SWIFT_EXTS = {".swift"}
NATIVE_TYPES = {".kt": "compose", ".dart": "flutter"}
SUPPORTED = WEB_EXTS | SWIFT_EXTS | NATIVE_TYPES.keys()
SKIP_DIRS = {
    ".git", "node_modules", "dist", "build", ".next", ".nuxt", ".svelte-kit",
    ".build", "DerivedData", "__pycache__", ".venv", "venv", "coverage", ".dart_tool", ".gradle", "Pods",
}
SKIP_TOKEN_FILES = {
    "one-tokens.css",
    "one-tailwind-v4.css",
    "one.tokens.json",
    "one-compat-asterline.css",
    "OneDesignTokens.generated.swift",
    "OneDesignTokens.generated.kt",
    "one_design_tokens.g.dart",
}


@dataclass(frozen=True)
class Finding:
    path: str
    line: int
    rule: str
    severity: str
    message: str


# Regex patterns mapped to stable One UI v1.0 rule IDs (ONE-01..ONE-28)
HEX_COLOR_RE = re.compile(r"(?<![&\w])#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b")
ARBITRARY_TW_COLOR_RE = re.compile(r"\b(?:bg|text|border|ring|fill|stroke)-(?:indigo|violet|purple|fuchsia|pink|rose|cyan|sky|emerald|lime|amber|orange|yellow|blue|green|red|slate|zinc|gray|neutral|stone)-\d{2,3}\b")
OPACITY_DISABLED_RE = re.compile(r"disabled:opacity-\d+|opacity-(?:30|40|50|60)\b")
SWIFT_OPACITY_RE = re.compile(r"\.opacity\(\s*0?\.[1-8]\d*\s*\)")
GRADIENT_SLOP_RE = re.compile(r"\b(?:bg-gradient-to-|bg-linear-to-|bg-clip-text|linear-gradient\(|radial-gradient\(|conic-gradient\()")
GLOW_SLOP_RE = re.compile(r"shadow-\[0_0_|shadow-(?:purple|indigo|blue|cyan|pink|violet|emerald|amber)-\d{2,3}/")
TRANSITION_ALL_RE = re.compile(r"\btransition-all\b|transition\s*:\s*all\b")
LONG_DURATION_RE = re.compile(r"\bduration-(?:500|700|1000)\b|(?:transition|animation)-duration\s*:\s*(?:[4-9]\d{2}|[1-9]\d{3})ms")
BOUNCE_PULSE_DOT_RE = re.compile(r"\b(?:animate-bounce|animate-ping)\b")
HEAVY_WEIGHT_RE = re.compile(r"\b(?:font-extrabold|font-black)\b|font-weight\s*:\s*(?:800|900)\b")
CLICKABLE_DIV_RE = re.compile(r"<(?:div|span)\b[^>]*\bonClick\s*=")
INLINE_PX_SPACING_RE = re.compile(r"\b(?:p|px|py|pt|pb|pl|pr|ps|pe|m|mx|my|mt|mb|ml|mr|ms|me|gap)-\[(\d+)px\]")
INPUT_SMALL_TEXT_RE = re.compile(r"<(?:input|textarea|select)\b[^>]*\btext-(?:xs|sm|\[(?:1[0-5]|[1-9])px\])")
OOPS_COPY_RE = re.compile(r"\b(?:Oops|Whoops)!|\bSomething went wrong!|\bClick here to\b", re.IGNORECASE)
OUTLINE_NONE_NO_FOCUS_RE = re.compile(r"\boutline-none\b|\boutline:\s*(?:none|0)\b")
SWIFT_FIXED_FONT_RE = re.compile(r"\.font\(\s*\.system\(\s*size\s*:\s*\d+")
SWIFT_RAW_COLOR_RE = re.compile(r"\bColor\(\s*(?:red\s*:|hex\s*:|#)")
SWIFT_GRADIENT_RE = re.compile(r"\b(?:LinearGradient|RadialGradient|AngularGradient)\s*\(")
SWIFT_HEAVY_WEIGHT_RE = re.compile(r"\.fontWeight\(\s*\.(?:heavy|black)\s*\)|\.weight\(\s*\.(?:heavy|black)\s*\)")


def should_skip(path: Path) -> bool:
    if path.name in SKIP_TOKEN_FILES:
        return True
    return any(part in SKIP_DIRS for part in path.parts)


LAYOUT_PROPERTY = re.compile(r"(?<![\w-])(?:width|height|top|left|margin|padding)(?:-[\w-]+)?(?![\w-])", re.I)
DECORATIVE_LOOP = re.compile(r"(?:bounce|pulse|shimmer|ping)", re.I)
STATUS_SELECTOR = re.compile(r"""(?:\[role\s*=\s*["']?(?:status|progressbar)|\[aria-busy|(?:^|[.#_-])(?:status|loading|spinner|progress)(?:$|[.#_:\s\[-]))""", re.I)
CSS_COMMENTS = re.compile(r"/\*.*?\*/", re.S)
KEYFRAMES = re.compile(r"@(?:-webkit-)?keyframes\b", re.I)
SWIFT_SPRING = re.compile(r"\.(?:spring|interpolatingSpring|interactiveSpring)\s*\(|(?:OneTokens\.Springs|OneSprings)\.\w+")
EVIDENCE = ("Static source patterns only. Compose and Flutter checks cover literal colors, "
            "with an additional Flutter check for disabled text scaling. Verify task hierarchy, "
            "rendering, focus, motion and assistive output on the target.")


def strip_comments(text: str, pattern: re.Pattern) -> str:
    # Preserve offsets for line numbers.
    return pattern.sub(lambda match: re.sub(r"[^\n]", " ", match[0]), text)


def audit_css_motion(source: str, rel: str) -> list[Finding]:
    css = strip_comments(source, CSS_COMMENTS)
    findings = []
    stack = []
    start = 0
    def report(offset, rule, message):
        findings.append(Finding(rel, css.count("\n", 0, offset) + 1, rule, "warn", message))
    # Track enclosing selectors through @media, @layer and keyframe steps.
    for token in re.finditer(r"[{};]", css):
        fragment = css[start:token.start()].strip()
        if token[0] == "{":
            stack.append(fragment)
        elif stack:
            prop, _, value = fragment.partition(":")
            prop, value = prop.lower(), value.lower()
            offset = start + len(css[start:token.start()]) - len(css[start:token.start()].lstrip())
            in_frames = any(KEYFRAMES.match(scope) for scope in stack)
            if ((prop in {"transition", "transition-property"} and LAYOUT_PROPERTY.search(value))
                    or (in_frames and LAYOUT_PROPERTY.fullmatch(prop))):
                report(offset, "ONE-25", "Animate transform or opacity to preserve layout during motion")
            if (prop == "pointer-events" and value.strip() == "none"
                    and re.search(r"animating|transitioning|springing", stack[-1], re.I)):
                report(offset, "ONE-26", "Keep input available while a spring settles so it can retarget")
            if token[0] == "}":
                stack.pop()
        start = token.end()

    # Join shorthand/longhand animation declarations for the same selector.
    for block in re.finditer(r"([^{};]+)\{([^{}]*)}", css):
        selectors, body = block.groups()
        animation = " ".join(re.findall(r"(?<![\w-])animation(?:-name|-iteration-count)?\s*:\s*([^;}]+)", body, re.I))
        if (re.search(r"\binfinite\b", animation, re.I) and DECORATIVE_LOOP.search(animation)
                and any(not STATUS_SELECTOR.search(s.strip()) for s in selectors.split(","))):
            report(block.start(2), "ONE-27", "Limit repeating motion to a real pending status or progress value")
    motion = KEYFRAMES.search(css) or re.search(r"(?:transition|animation)[^;{}]*var\(--one-spring-", css)
    if motion and not re.search(r"\(\s*prefers-reduced-motion\s*:\s*(?:reduce|no-preference)\s*\)", css, re.I):
        report(motion.start(), "ONE-28", "Supply a prefers-reduced-motion path with the same immediate state")
    return findings


def audit_web_file(path: Path, rel: str) -> list[Finding]:
    findings: list[Finding] = []
    text = path.read_text(encoding="utf-8", errors="ignore")
    lines = text.splitlines()
    is_css = path.suffix in {".css", ".scss"}

    for idx, line in enumerate(lines, start=1):
        stripped = line.strip()
        if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
            continue

        # ONE-01: Raw hex / arbitrary Tailwind palette colors instead of semantic tokens
        if HEX_COLOR_RE.search(line) and "--one-" not in line and "url(#" not in line and "href=\"#" not in line:
            # Skip common SVG fragment refs / anchors like href="#section"
            for m in HEX_COLOR_RE.finditer(line):
                token = m.group(0)
                if len(token) in (4, 7, 9):
                    findings.append(Finding(rel, idx, "ONE-01", "warn", f"Hardcoded color {token}; bind an One UI semantic token instead"))
                    break

        if not is_css and ARBITRARY_TW_COLOR_RE.search(line):
            m = ARBITRARY_TW_COLOR_RE.search(line)
            assert m is not None
            findings.append(Finding(rel, idx, "ONE-01", "warn", f"Raw Tailwind palette class `{m.group(0)}`; map to semantic `--one-color-*` role"))

        # ONE-08: Whole-control opacity to fake disabled/loading states
        if OPACITY_DISABLED_RE.search(line):
            findings.append(Finding(rel, idx, "ONE-08", "error", "Avoid opacity dimming for disabled/loading states; use opaque semantic disabledFill/disabledText tokens"))

        # ONE-10: Clickable div/span instead of native button/link
        if not is_css and CLICKABLE_DIV_RE.search(line):
            findings.append(Finding(rel, idx, "ONE-10", "error", "Clickable <div>/<span> detected; use native <button> or <a> for keyboard and assistive semantics"))

        # ONE-11: outline-none without visible focus-visible ring on the same line/rule
        if OUTLINE_NONE_NO_FOCUS_RE.search(line) and "focus-visible" not in line and "ring-" not in line:
            findings.append(Finding(rel, idx, "ONE-11", "warn", "Focus outline suppressed without visible 2px focus-visible ring + 2px gap"))

        # ONE-12: Heavy weights or <16px editable mobile fields
        if HEAVY_WEIGHT_RE.search(line):
            findings.append(Finding(rel, idx, "ONE-12", "warn", "Extra-heavy weight (800/900) violates One UI light editorial typography; use 300–500 (max 600)"))
        if not is_css and INPUT_SMALL_TEXT_RE.search(line):
            findings.append(Finding(rel, idx, "ONE-12", "warn", "Editable field text appears < 16px (triggers iOS Safari auto-zoom); use >= 16px on touch inputs"))

        # ONE-13: Off-4px-grid arbitrary spacing
        for m in INLINE_PX_SPACING_RE.finditer(line):
            px = int(m.group(1))
            if px % 4 != 0 and px not in (1, 2):
                findings.append(Finding(rel, idx, "ONE-13", "warn", f"Off-scale arbitrary spacing `{m.group(0)}`; snap to the 4px spacing scale"))
                break

        # ONE-14: Motion violations (transition-all, >300ms utility duration, bounce/ping)
        if TRANSITION_ALL_RE.search(line):
            findings.append(Finding(rel, idx, "ONE-14", "error", "`transition-all` animates layout unintentionally; transition explicit properties (<= 200ms)"))
        if LONG_DURATION_RE.search(line):
            findings.append(Finding(rel, idx, "ONE-14", "warn", "Utility transition > 300ms exceeds One UI motion ceiling (150ms fast / 200ms standard / 300ms max)"))
        if BOUNCE_PULSE_DOT_RE.search(line):
            findings.append(Finding(rel, idx, "ONE-14", "warn", "Ambient decorative motion (`animate-bounce`/`animate-ping`); remove or tie strictly to real state with reduced-motion guard"))

        # ONE-17: Gradients and colored glows
        if GRADIENT_SLOP_RE.search(line):
            findings.append(Finding(rel, idx, "ONE-17", "warn", "Gradient detected; One UI uses flat opaque semantic fills and neutral surfaces"))
        if GLOW_SLOP_RE.search(line):
            findings.append(Finding(rel, idx, "ONE-17", "warn", "Colored glow/shadow detected; One UI base surfaces have no shadow and overlays use neutral shadows only"))

        # ONE-18: Botsplaining / cutesy error copy
        if OOPS_COPY_RE.search(line):
            findings.append(Finding(rel, idx, "ONE-18", "warn", "Generic/cutesy UI copy detected; state the concrete problem and recovery action plainly"))

    if is_css:
        findings.extend(audit_css_motion(text, rel))
    else:
        for element in re.finditer(r"<[a-zA-Z][^>]*>", text):
            tag = element[0]
            line = text.count("\n", 0, element.start()) + 1
            if re.search(r"\banimate-(?:bounce|pulse|ping|shimmer)\b", tag) and not re.search(
                    r"""role=["'](?:status|progressbar)["']|aria-busy|^<progress\b""", tag):
                findings.append(Finding(rel, line, "ONE-27", "warn", "Use looping motion only for meaningful status"))
            if re.search(r"disabled=\{(?:isAnimating|isTransitioning|isSpringing)\}", tag):
                findings.append(Finding(rel, line, "ONE-26", "warn", "Keep controls operable while motion is settling"))

    return findings


def audit_swift_file(path: Path, rel: str) -> list[Finding]:
    findings: list[Finding] = []
    text = path.read_text(encoding="utf-8", errors="ignore")
    lines = text.splitlines()

    for idx, line in enumerate(lines, start=1):
        stripped = line.strip()
        if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
            continue

        if SWIFT_RAW_COLOR_RE.search(line):
            findings.append(Finding(rel, idx, "ONE-01", "warn", "Raw Color literal outside DesignTokens; use OneColor semantic roles"))

        if SWIFT_OPACITY_RE.search(line) and ("disabled" in line.lower() or "loading" in line.lower() or "isEnabled" in line):
            findings.append(Finding(rel, idx, "ONE-08", "error", "Opacity dimming on disabled/loading SwiftUI view; use opaque OneColor.disabledFill/disabledText"))

        if SWIFT_FIXED_FONT_RE.search(line):
            findings.append(Finding(rel, idx, "ONE-21", "error", "Fixed `.font(.system(size:))` breaks Dynamic Type; use OneTypography (`relativeTo:`) or semantic SwiftUI text styles"))

        if SWIFT_HEAVY_WEIGHT_RE.search(line):
            findings.append(Finding(rel, idx, "ONE-12", "warn", "Heavy/black font weight violates One UI editorial hierarchy; use light/regular/medium"))

        if SWIFT_GRADIENT_RE.search(line):
            findings.append(Finding(rel, idx, "ONE-17", "warn", "Gradient view detected; verify it is not decorating an One UI action button or calm neutral surface"))

        if OOPS_COPY_RE.search(line):
            findings.append(Finding(rel, idx, "ONE-18", "warn", "Cutesy/vague UI copy; write concrete problem + recovery text"))

    code = strip_comments(text, re.compile(r"/\*.*?\*/|//[^\n]*", re.S))
    match = SWIFT_SPRING.search(code)
    if match and "accessibilityReduceMotion" not in code:
        findings.append(Finding(rel, code.count("\n", 0, match.start()) + 1, "ONE-28", "warn", "Bind springs to accessibilityReduceMotion and keep the end state visible"))
    for match in re.finditer(r"\.(?:disabled\(\s*|allowsHitTesting\(\s*!)is(?:Animating|Transitioning|Springing)\s*\)", code):
        findings.append(Finding(rel, code.count("\n", 0, match.start()) + 1, "ONE-26", "warn", "Keep input available for interruptible spring motion"))

    return findings


def audit_native_file(path: Path, rel: str) -> list[Finding]:
    source = strip_comments(path.read_text(encoding="utf-8", errors="ignore"), re.compile(r"/\*.*?\*/|//[^\n]*", re.S))
    findings = []
    for match in re.finditer(r"\bColor\(\s*0x[\da-fA-F]{8}(?:[uU]?[lL])?\s*\)", source):
        findings.append(Finding(rel, source.count("\n", 0, match.start()) + 1, "ONE-01", "warn",
                                "Literal ARGB color in native source. Check whether a semantic palette role applies."))
    if path.suffix == ".dart":
        for match in re.finditer(r"\btextScaler\s*:\s*TextScaler\.noScaling\b", source):
            findings.append(Finding(rel, source.count("\n", 0, match.start()) + 1, "ONE-21", "warn",
                                    "Text scaling is suppressed. Verify the label remains accessible at large text sizes."))
    return findings


def collect_files(targets: list[Path]) -> tuple[list[Path], list[str]]:
    files: dict[Path, Path] = {}
    unscanned = []
    for target in targets:
        matched = False
        if target.is_dir() and not should_skip(target):
            for parent, directories, names in os.walk(target):
                directories[:] = sorted(name for name in directories if name not in SKIP_DIRS)
                for name in sorted(names):
                    path = Path(parent) / name
                    if path.suffix in SUPPORTED and name not in SKIP_TOKEN_FILES and path.is_file():
                        files.setdefault(path.resolve(), path)
                        matched = True
        elif target.is_file() and target.suffix in SUPPORTED and not should_skip(target):
            files.setdefault(target.resolve(), target)
            matched = True
        if not matched:
            unscanned.append(str(target))
    return list(files.values()), unscanned


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit web and native UI source patterns against One UI rules.")
    parser.add_argument("targets", nargs="+", type=Path, help="Files or directories to audit")
    parser.add_argument("--strict", action="store_true", help="Exit non-zero on warnings as well as errors")
    parser.add_argument("--json", action="store_true", help="Emit JSON output")
    args = parser.parse_args()

    files, unscanned = collect_files(args.targets)
    findings: list[Finding] = []
    by_platform: Counter = Counter()
    cwd = Path.cwd()
    for path in files:
        try:
            rel = str(path.resolve().relative_to(cwd))
        except ValueError:
            rel = str(path)
        if path.suffix in WEB_EXTS:
            by_platform["web"] += 1
            findings.extend(audit_web_file(path, rel))
        elif path.suffix in SWIFT_EXTS:
            by_platform["swiftui"] += 1
            findings.extend(audit_swift_file(path, rel))
        else:
            by_platform[NATIVE_TYPES[path.suffix]] += 1
            findings.extend(audit_native_file(path, rel))

    errors = [f for f in findings if f.severity == "error"]
    warns = [f for f in findings if f.severity == "warn"]

    if args.json:
        print(json.dumps({
            "filesScanned": len(files),
            "filesByPlatform": by_platform,
            "unscannedTargets": unscanned,
            "errors": len(errors),
            "warnings": len(warns),
            "findings": [f.__dict__ for f in findings],
            "evidenceScope": EVIDENCE,
        }, indent=2))
    else:
        for f in findings:
            print(f"{f.path}:{f.line}  [{f.severity.upper()}] {f.rule}  {f.message}")
        counts = Counter(f.rule for f in findings)
        summary = ", ".join(f"{rule}={n}" for rule, n in sorted(counts.items())) or "no findings"
        for target in unscanned:
            print(f"No supported source scanned for target: {target}")
        print(f"\nOne UI v1.0 static audit: {len(files)} file(s), {len(errors)} error(s), {len(warns)} warning(s) [{summary}].")
        print(EVIDENCE)

    if unscanned or errors or (args.strict and warns):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
