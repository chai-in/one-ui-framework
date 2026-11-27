#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""List, find, and report reusable design feedback on GitHub."""
from __future__ import annotations

import argparse
import json
import os
import re
import shlex
import subprocess
import sys
from pathlib import Path
from tempfile import NamedTemporaryFile

DEFAULT_REPO = "chai-in/one-ui-framework"
FEEDBACK_LABEL = "design-feedback"
KINDS = ("bug", "improvement", "change", "pattern", "a11y", "docs")
AREAS = ("tokens", "kinetic-moments", "a11y", "agent-ergonomics")
PLATFORMS = ("web", "apple", "android", "flutter", "cross-platform")
SECRET = re.compile(
    r"\b(?:gh[opusr]_[\w-]+|github_pat_[\w-]+|sk-[\w-]+|AKIA[A-Z0-9]+)"
    r"|\bBEGIN[ \t]+(?:[A-Z0-9]+[ \t]+)*PRIVATE[ \t]+KEY\b|\bBearer[ \t]+\S+",
    re.IGNORECASE,
)
STOP_WORDS = frozenset(
    "a an and are as at be by can for from in is it of on or should the to when with".split()
)


class GitHubError(Exception):
    """GitHub could not be queried or updated."""


def gh(*arguments: str, body: str | None = None) -> str:
    try:
        result = subprocess.run(
            ["gh", *arguments],
            input=body or "",
            text=True,
            capture_output=True,
            timeout=60,
            env={**os.environ, "GH_HOST": "github.com", "GH_PROMPT_DISABLED": "1"},
        )
    except FileNotFoundError as error:
        raise GitHubError("GitHub CLI (gh) is unavailable") from error
    except subprocess.TimeoutExpired as error:
        raise GitHubError("GitHub CLI timed out") from error
    except OSError as error:
        raise GitHubError("GitHub CLI could not run") from error
    if result.returncode == 4 or (result.returncode and "HTTP 401" in result.stderr):
        raise GitHubError("GitHub CLI requires authentication (gh auth login)")
    if result.returncode:
        raise GitHubError(f"gh {' '.join(arguments[:2])} exited with status {result.returncode}")
    return result.stdout.strip()


def github_json(*arguments: str):
    try:
        return json.loads(gh(*arguments))
    except json.JSONDecodeError as error:
        raise GitHubError("GitHub CLI returned invalid JSON") from error


def open_issues(repo: str, label: str | None = None) -> list[dict]:
    labels = f"{FEEDBACK_LABEL},{label}" if label and label != FEEDBACK_LABEL else FEEDBACK_LABEL
    pages = github_json(
        "api", "--hostname", "github.com", "--method", "GET", "--paginate", "--slurp",
        f"repos/{repo}/issues", "-f", "state=open", "-f", f"labels={labels}",
        "-f", "sort=updated", "-f", "per_page=100",
    )
    return [
        {
            "number": issue["number"],
            "title": issue["title"],
            "url": issue["html_url"],
            "labels": [item["name"] for item in issue["labels"]],
            "updatedAt": issue["updated_at"],
            "body": issue["body"] or "",
        }
        for page in pages for issue in page if "pull_request" not in issue
    ]


def words(value: str) -> set[str]:
    return set(re.findall(r"\w+", value.casefold())) - STOP_WORDS


def search_issues(query: str, issues: list[dict]) -> list[dict]:
    terms = words(query)
    matches = []
    for issue in issues:
        content = f"{issue['title']}\n{issue['body']}"
        if query.casefold() in content.casefold() or (terms and terms <= words(content)):
            matches.append(issue)
    return matches


def possible_duplicates(title: str, context: str, proposal: str, issues: list[dict]) -> list[dict]:
    title_words = words(title)
    details = words(context + "\n" + proposal)
    matches = []
    for issue in issues:
        other_words = words(issue["title"])
        shared = len(title_words & other_words)
        total = len(title_words | other_words)
        if (
            title.casefold() == issue["title"].strip().casefold()
            or (shared >= 2 and shared / total >= 0.65)
            or (shared >= 2 and shared / total >= 0.4 and len(details & words(issue["body"])) >= 4)
        ):
            matches.append(issue)
    return matches


def print_issues(issues: list[dict], *, as_json: bool = False) -> None:
    if as_json:
        print(json.dumps(issues, indent=2, ensure_ascii=False))
    elif issues:
        for issue in issues:
            print(f"#{issue['number']} {issue['title']} [{', '.join(issue['labels'])}]")
            print(f"  {issue['url']}")
    else:
        print("No matching open design-feedback issues.")


def issue_labels(args: argparse.Namespace) -> list[str]:
    labels = [FEEDBACK_LABEL]
    if args.kind != "docs":
        labels.append("baseline-improvement")
    if args.kind == "bug":
        labels.append("bug")
    labels.extend(args.area)
    if args.kind == "a11y" and "a11y" not in labels:
        labels.append("a11y")
    labels.extend(f"platform:{platform}" for platform in args.platform if platform != "cross-platform")
    return labels


def markdown(fields: list[tuple[str, str | None]]) -> str:
    return "\n\n".join(f"### {heading}\n\n{value}" for heading, value in fields if value) + "\n"


def report_body(args: argparse.Namespace) -> str:
    details = [("Context", args.context), ("Proposal", args.proposal)]
    if args.comment_on:
        return "## Design feedback follow-up\n\n" + markdown([
            ("Source project", args.source_project), *details,
        ])
    return markdown([
        ("Kind", args.kind),
        ("Area", ", ".join(args.area)),
        ("Platform", ", ".join(args.platform)),
        ("One UI rule", args.law),
        ("Source project", args.source_project),
        *details,
        ("Acceptance criteria", args.acceptance),
    ])


def save_draft(
    args: argparse.Namespace, body: str, labels: list[str], argv: list[str], *, retry: bool = True,
) -> int:
    directory = Path.home() / ".one-ui/pending-feedback"
    try:
        directory.mkdir(mode=0o700, parents=True, exist_ok=True)
        with NamedTemporaryFile(
            mode="w", encoding="utf-8", dir=directory, prefix="feedback-", suffix=".md", delete=False,
        ) as draft:
            if args.comment_on:
                draft.write(f"# Follow-up for {args.repo}#{args.comment_on}\n\n")
            else:
                draft.write(f"# {args.title}\n\nLabels: {', '.join(labels)}\n\n")
            draft.write(body)
    except OSError as error:
        print(f"Unable to save local draft: {error}", file=sys.stderr)
        return 1
    print(f"Saved a local draft at {draft.name}")
    if args.title:
        print(f"Design feedback form: https://github.com/{args.repo}/issues/new?template=design-feedback.yml")
    if retry:
        command = shlex.join([sys.executable, str(Path(__file__).absolute()), *argv])
        print("To submit after restoring GitHub access, rerun:")
        print(command)
    return 0


def nonempty(value: str) -> str:
    if not value.strip():
        raise argparse.ArgumentTypeError("expected nonempty text")
    return value.strip()


def positive_int(value: str) -> int:
    try:
        number = int(value)
    except ValueError:
        number = 0
    if number < 1:
        raise argparse.ArgumentTypeError("expected a positive integer")
    return number


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    modes = parser.add_mutually_exclusive_group(required=True)
    modes.add_argument("--list", action="store_true", help="list open design feedback")
    modes.add_argument("--search", type=nonempty, metavar="QUERY", help="find words in open issue titles and bodies")
    modes.add_argument("--comment-on", type=positive_int, metavar="NUMBER", help="add evidence to an open issue")
    modes.add_argument("--title", type=nonempty, help="title of a new issue")
    parser.add_argument("--repo", default=DEFAULT_REPO, metavar="OWNER/REPO",
                        help=f"GitHub feedback repository (default: {DEFAULT_REPO})")
    parser.add_argument("--label", type=nonempty, help="additional label filter for --list")
    parser.add_argument("--limit", type=positive_int, help="maximum results for --list (default: all)")
    parser.add_argument("--json", action="store_true", help="emit --list results as JSON")
    parser.add_argument("--kind", choices=KINDS)
    parser.add_argument("--area", help=f"comma-separated areas: {', '.join(AREAS)}")
    parser.add_argument("--platform", help=f"comma-separated platforms: {', '.join(PLATFORMS)}")
    parser.add_argument("--law", metavar="ONE-XX", help="related One UI rule")
    parser.add_argument("--source-project", type=nonempty, help="optional public name or anonymous project description")
    parser.add_argument("--context", type=nonempty, help="reusable scenario and observed behavior")
    parser.add_argument("--proposal", type=nonempty, help="suggested baseline behavior")
    parser.add_argument("--acceptance", type=nonempty, help="observable acceptance criteria")
    parser.add_argument("--dry-run", action="store_true", help="preview without contacting GitHub or saving a draft")
    parser.add_argument("--force-new", action="store_true", help="skip duplicate check for a confirmed distinct issue")
    if any(SECRET.search(value) for value in argv):
        parser.error("feedback arguments contain a possible credential. Remove it and retry.")
    args = parser.parse_args(argv)
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9-]*/[A-Za-z0-9_.-]+", args.repo) or args.repo.split("/")[1] in (".", ".."):
        parser.error("--repo must use GitHub's OWNER/REPO format")
    if not args.list and (args.label or args.limit or args.json):
        parser.error("--label, --limit and --json require --list")
    if args.label and "," in args.label:
        parser.error("--label accepts one additional label")
    if not args.title and (args.kind or args.area or args.platform or args.law or args.acceptance or args.force_new):
        parser.error("--kind, --area, --platform, --law, --acceptance and --force-new require --title")
    if not (args.title or args.comment_on) and (args.context or args.proposal or args.source_project or args.dry_run):
        parser.error("--context, --proposal, --source-project and --dry-run require --title or --comment-on")
    if args.title and not (args.kind and args.context and args.proposal):
        parser.error("--title requires --kind, --context and --proposal")
    if args.title and ("\n" in args.title or "\r" in args.title):
        parser.error("--title must be a single line")
    if args.comment_on and not args.context:
        parser.error("--comment-on requires --context")
    if args.law and not re.fullmatch(r"ONE-\d{2}", args.law):
        parser.error("--law must use the ONE-XX format")
    for field, choices in (("area", AREAS), ("platform", PLATFORMS)):
        raw = getattr(args, field)
        values = list(dict.fromkeys(part.strip() for part in raw.split(","))) if raw is not None else []
        if any(value not in choices for value in values):
            parser.error(f"--{field} must use these values: {', '.join(choices)}")
        setattr(args, field, values)
    if "cross-platform" in args.platform and len(args.platform) > 1:
        parser.error("use cross-platform alone or select specific platforms")
    return args


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    if args.list or args.search:
        try:
            issues = open_issues(args.repo, args.label)
        except GitHubError as error:
            print(error, file=sys.stderr)
            return 1
        if args.search:
            issues = search_issues(args.search, issues)
        print_issues(issues[:args.limit], as_json=args.json)
        return 0

    body = report_body(args)
    labels = [] if args.comment_on else issue_labels(args)
    if args.dry_run:
        print(f"Dry run for {args.repo}. No GitHub checks or writes were performed.")
        if args.comment_on:
            print(f"Comment on #{args.comment_on}\n")
        else:
            print(f"Title: {args.title}\nLabels: {', '.join(labels)}\n")
        print(body, end="")
        return 0

    publishing = False
    try:
        if args.comment_on:
            number = str(args.comment_on)
            issue = github_json("issue", "view", number, "--repo", args.repo, "--json", "state,labels")
            if issue["state"] != "OPEN" or FEEDBACK_LABEL not in {label["name"] for label in issue["labels"]}:
                print(f"#{number} is not an open {FEEDBACK_LABEL} issue on {args.repo}.", file=sys.stderr)
                return 1
            command = ["issue", "comment", number]
        else:
            if not args.force_new:
                matches = possible_duplicates(args.title, args.context, args.proposal, open_issues(args.repo))
                if matches:
                    print("Possible duplicates. Use --comment-on for the same issue or --force-new if distinct.",
                          file=sys.stderr)
                    print_issues(matches)
                    return 3
            # GitHub may drop labels when the current user cannot write to the repository.
            permission = github_json("repo", "view", args.repo, "--json", "viewerPermission")["viewerPermission"]
            if permission not in ("ADMIN", "MAINTAIN", "WRITE"):
                print("Use the design feedback form to create a labeled issue without write access.", file=sys.stderr)
                return save_draft(args, body, labels, argv, retry=False)
            command = ["issue", "create", f"--title={args.title}"]
            for label in labels:
                command.extend(("--label", label))
        publishing = True
        print(gh(*command, "--repo", args.repo, "--body-file", "-", body=body))
    except GitHubError as error:
        print(error, file=sys.stderr)
        if publishing:
            print("Check whether GitHub already accepted this submission before retrying.", file=sys.stderr)
        return save_draft(args, body, labels, argv)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
