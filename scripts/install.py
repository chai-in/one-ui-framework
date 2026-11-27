#!/usr/bin/env python3
"""Install One UI v1.0 skill and optional rules snippet into Antigravity, Codex, Claude Code, or a project repo.

Zero external dependencies (Python 3 standard library only).
"""
from __future__ import annotations

import argparse
import re
import shutil
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[1]
SKILL_SRC = ROOT / "skills/one-ui"
RULES_SRC = ROOT / "RULES.md"
HOME = Path.home()

GLOBAL_TARGETS = {
    "agents": HOME / ".agents/skills/one-ui",
    "antigravity": HOME / ".gemini/config/skills/one-ui",
    "codex": HOME / ".codex/skills/one-ui",
    "claude": HOME / ".claude/skills/one-ui",
}


def discover_t3_targets() -> list[Path]:
    """Discover T3 Code instance provider skill directories (Antigravity + Codex provider homes)."""
    targets: list[Path] = []
    t3_root = HOME / ".t3"
    # T3 Code Antigravity provider configs (~/.t3/userdata/providers/antigravity/<hash>/config)
    ag_root = t3_root / "userdata/providers/antigravity"
    if ag_root.is_dir():
        for entry in sorted(ag_root.iterdir()):
            cfg = entry / "config"
            if cfg.is_dir():
                targets.append(cfg / "skills/one-ui")
    # T3 Code Codex provider homes (~/.t3/provider-homes/codex-*)
    homes_root = t3_root / "provider-homes"
    if homes_root.is_dir():
        for entry in sorted(homes_root.iterdir()):
            if entry.is_dir() and (entry / "skills").is_dir():
                targets.append(entry / "skills/one-ui")
    return targets


def install_dir(src: Path, dst: Path, *, symlink: bool, dry_run: bool) -> str:
    if dry_run:
        mode = "symlink" if symlink else "copy"
        return f"[dry-run] would {mode} {src} -> {dst}"
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.resolve() == src.resolve() and (symlink or not dst.is_symlink()):
        return f"already installed at {dst}"
    with TemporaryDirectory(prefix=".one-ui-install-", dir=dst.parent) as staging:
        staged = Path(staging) / "skill"
        previous = Path(staging) / "previous"
        if symlink:
            staged.symlink_to(src.resolve(), target_is_directory=True)
        else:
            shutil.copytree(src, staged, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
        if dst.is_symlink() or dst.exists():
            dst.rename(previous)
        try:
            staged.rename(dst)
        except OSError:
            if previous.is_symlink() or previous.exists():
                previous.rename(dst)
            raise
    return f"{'symlinked' if symlink else 'copied'} {src} -> {dst}"


def append_rules_snippet(target_file: Path, *, dry_run: bool) -> str:
    marker = "one-ui:v1.0"
    snippet = f"<!-- {marker} -->\n{RULES_SRC.read_text(encoding='utf-8').strip()}\n<!-- /{marker} -->"
    existing = target_file.read_text(encoding="utf-8") if target_file.exists() else ""
    # Upgrade only the installer-owned block, preserving surrounding user instructions.
    block = re.compile(r"<!-- (one-ui:v1\.0|asterline-ui:v0\.3) -->.*?<!-- /\1 -->", re.S)
    if block.search(existing):
        updated = block.sub(lambda _: snippet, existing, count=1)
    else:
        separator = "\n" if existing.endswith("\n") else "\n\n"
        updated = (existing + separator if existing else "") + snippet + "\n"
    if updated == existing:
        return f"rules current in {target_file}"
    if dry_run:
        return f"[dry-run] would install One UI rules in {target_file}"
    target_file.parent.mkdir(parents=True, exist_ok=True)
    target_file.write_text(updated, encoding="utf-8")
    return f"installed One UI rules in {target_file}"


def main() -> int:
    parser = argparse.ArgumentParser(description="Install One UI v1.0 skill into coding agent harnesses or a project repo.")
    parser.add_argument(
        "--targets",
        nargs="+",
        choices=["all", "t3", *GLOBAL_TARGETS.keys()],
        default=[],
        help="Global agent directories to install into (`t3` targets this T3 Code instance's providers; `all` installs everywhere)",
    )
    parser.add_argument("--repo", type=Path, default=None, help="Install into a project repo's .agents/skills/one-ui")
    parser.add_argument(
        "--inject-rules",
        choices=["AGENTS.md", "GEMINI.md", "CLAUDE.md"],
        default=None,
        help="With --repo, also append the compact One UI v1.0 RULES.md snippet into the chosen file",
    )
    parser.add_argument("--symlink", action="store_true", help="Symlink instead of copying (ideal for live local development)")
    parser.add_argument("--dry-run", action="store_true", help="Print planned changes without writing")
    args = parser.parse_args()

    if not args.targets and not args.repo:
        parser.print_help()
        print("\nExample: python3 scripts/install.py --targets all --symlink --dry-run")
        return 0

    if not SKILL_SRC.exists():
        print(f"Skill source missing: {SKILL_SRC}", file=sys.stderr)
        return 1

    for name in ("LICENSE", "NOTICE.md"):
        bundled = SKILL_SRC / name
        if not bundled.is_file() or bundled.read_bytes() != (ROOT / name).read_bytes():
            print(f"Skill {name} is missing or stale. Copy {ROOT / name} to {bundled}.", file=sys.stderr)
            return 1

    actions: list[str] = []
    if "all" in args.targets:
        chosen_paths = list(GLOBAL_TARGETS.values()) + discover_t3_targets()
    else:
        chosen_paths = []
        for name in args.targets:
            if name == "t3":
                chosen_paths.extend(discover_t3_targets())
            else:
                chosen_paths.append(GLOBAL_TARGETS[name])

    # Deduplicate while preserving order
    seen: set[Path] = set()
    for dst in chosen_paths:
        if dst not in seen:
            seen.add(dst)
            actions.append(install_dir(SKILL_SRC, dst, symlink=args.symlink, dry_run=args.dry_run))

    if args.repo:
        repo_skill_dst = args.repo.resolve() / ".agents/skills/one-ui"
        actions.append(install_dir(SKILL_SRC, repo_skill_dst, symlink=args.symlink, dry_run=args.dry_run))
        if args.inject_rules:
            actions.append(append_rules_snippet(args.repo.resolve() / args.inject_rules, dry_run=args.dry_run))

    for act in actions:
        print(f"  - {act}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
