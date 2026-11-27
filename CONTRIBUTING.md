# Contributing to One UI

Open an issue for a behavior change that needs design discussion. For a fix,
send a focused pull request describing the observed behavior, the expected
result and how you checked it. Include the affected platforms and rule IDs.
Report vulnerabilities privately using the [security policy](SECURITY.md).

For reusable UI bugs and improvements, check the open `design-feedback` issues
with `python3 skills/one-ui/scripts/report_feedback.py --list`. Use the same
script to add public-safe evidence to an existing thread or file a distinct
report with the expected behavior and acceptance criteria. Use the GitHub form
to submit feedback directly. [Feedback workflow](skills/one-ui/references/feedback-loop.md) · [GitHub issue form](https://github.com/chai-in/one-ui-framework/issues/new?template=design-feedback.yml)

## Licensing and origin

One UI uses inbound = outbound licensing. By submitting original work, you
license it under the same GNU Affero General Public License v3.0 only
(`AGPL-3.0-only`) that recipients receive. You retain your copyright.
[Project license](LICENSE)

Sign off each commit with `git commit -s`. The resulting
`Signed-off-by: Name <email>` line certifies that you have the right to
contribute the change under the Developer Certificate of Origin 1.1. Include
sign-offs from the people who contributed the work. [Developer Certificate of Origin](https://developercertificate.org/)

For Kinetic UI Moments, describe the observed interaction in your own words,
then implement the behavior from that description and the project's physics
tokens. Keep paid source, extracted bundles, traced artwork and copied
implementations out of submissions. For authorized third-party materials,
identify the source, revision, license and required notices in the pull
request and update [NOTICE.md](NOTICE.md).

## Running the checks

Run the token verifier from the repository root with Python 3. It checks the
canonical tokens, the skill's copy and the theme presets.

```sh
python3 skills/one-ui/scripts/verify_tokens.py --tokens tokens/one.tokens.json \
  --check-sync skills/one-ui/assets/one.tokens.json --themes-dir tokens/themes
```

For the Node workspace, use the Node version specified in the root
`package.json`. Install the locked dependencies, build the packages, audit the
UI sources and run the tests.

```sh
npm ci
npm run build
npm run audit
npm test
```

On macOS with the project Swift toolchain and Apple SDKs installed, run the
Swift Package tests from the same root.

```sh
swift test --package-path platforms/apple
```

## Adding a Kinetic UI Moment

1. Describe the action the Moment helps someone perform. Give it a stable slug,
   an accessible name, a native role or keyboard pattern, and a reduced-motion
   behavior in the agent and package catalogs.
2. Implement it against `ONE-01` through `ONE-28`. Use semantic tokens and a
   named spring. On interruption, preserve position and velocity. Reduced
   motion must reach the same final state immediately, with equivalent keyboard
   access, focus and announcements. [One UI rules](RULES.md)
3. Exercise the control in both themes and high contrast. Compare unrounded
   WCAG ratios against 4.5:1 for text and 3:1 for essential UI and focus.
   Check rapid retargeting, cancellation and reduced motion during interaction.
4. Include regression coverage for the changed behavior. In the pull request,
   distinguish token calculations, static audits, rendered inspection and
   assistive or physical-device checks. Identify any tiers still untested.
