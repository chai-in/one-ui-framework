# One UI design feedback

When a user reports a UI or UX bug, critiques the design, or asks for a change,
apply the fix in the active project. Capture the reusable insight in a public
`design-feedback` issue on `chai-in/one-ui-framework`. File feedback that can improve a shared token, interaction,
control, Kinetic UI Moment, accessibility contract, reference, or agent workflow.
Skip one-off copy, business rules, and app-specific behavior that has no shared
design implication. [Open design feedback](https://github.com/chai-in/one-ui-framework/issues?q=is%3Aissue+is%3Aopen+label%3Adesign-feedback)

## Prepare public-safe feedback

- Describe the behavior, impact, and proposed change in generic terms. Use a
  minimal example with synthetic data and state which checks you observed.
- Omit credentials, private project and customer names, URLs, paths, source,
  screenshots, and proprietary workflows or business details. Leave
  `--source-project` out or use an anonymous description such as “settings app.”
- Review every field before using the CLI, including search text and the issue
  title. Its credential guard recognizes common patterns. You must still scrub
  private details. Omit the upstream report if you cannot share the insight safely.

## Reuse an open thread

Run the tool from the installed skill directory. Search using the affected
control or rule and the observed behavior. Try related words if the first search
is empty, and check the open list when needed.

```sh
python3 scripts/report_feedback.py --search "focus ring"
python3 scripts/report_feedback.py --list --label a11y
```

If an open issue covers the same baseline change, add the new evidence and any
refinement of the proposal to that thread. Replace the example issue number with
the matching thread number.

```sh
python3 scripts/report_feedback.py --comment-on 123 \
  --context "Keyboard focus on the final sticky-footer action is clipped at 200% zoom." \
  --proposal "Reserve enough space for the full focus ring."
```

If the search finds no match, open a structured issue. The tool checks open issue
titles and overlapping evidence. It stops and lists likely matches when it finds
them. Review the candidates before commenting or using `--force-new` for a
confirmed distinct issue.

```sh
python3 scripts/report_feedback.py --title "Focus ring clips in a sticky action footer" \
  --kind bug --area a11y --platform web --law ONE-11 \
  --context "The last action loses part of its focus ring at 200% zoom." \
  --proposal "Reserve space for the full ring on scrollable panels." \
  --acceptance "At 200% zoom, Tab reaches the last action and its full ring stays visible."
```

Add `--dry-run` to preview the destination, fields and labels without contacting
GitHub. The default destination is `chai-in/one-ui-framework` from any working directory.
Pass `--repo OWNER/REPO` to report to a fork with the One UI feedback form and
labels configured.

The CLI uses an authenticated `gh` session. If your account has write access,
the CLI creates the issue with its labels. Otherwise it saves a draft under
`~/.one-ui/pending-feedback/` and prints a link to the design feedback form, which
applies the `design-feedback` label when you submit it. You can still comment
on open feedback issues through the CLI if GitHub allows your account to comment.

If GitHub access fails, the tool saves a draft and prints a command to retry.
Review any warning about a submission that GitHub may already have accepted
before retrying.

## Triage for a baseline release

When updating One UI, start here from the repository root.

```sh
python3 skills/one-ui/scripts/report_feedback.py --list
python3 skills/one-ui/scripts/report_feedback.py --list --label baseline-improvement --limit 20 --json
```

Read the issue and its follow-up evidence. Confirm the affected behavior,
platform, rule, and acceptance criteria. Group requests for the same baseline
change and label release candidates `baseline-improvement`. The script sets
that label on behavior reports. Maintainers can add it to documentation reports
or to issues submitted through the form. Link implementation PRs to the affected
threads and close the issues once the baseline change ships.
