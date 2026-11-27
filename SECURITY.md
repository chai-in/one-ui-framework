# Security policy

## Supported versions

| Release line | Security support |
| --- | --- |
| 1.0.x | Supported. Fixes ship in the latest patch release. |
| Asterline UI 0.x | Ended. Upgrade to One UI 1.0.x. |

## Reporting a vulnerability

Open **Report a vulnerability** on the repository's advisories page. [Security advisories](https://github.com/chai-in/one-ui-framework/security/advisories)

If private reporting is unavailable, open an issue titled “Private security
contact requested” with no technical or personal details. Share the report
only after the maintainer establishes a private channel. [New issue](https://github.com/chai-in/one-ui-framework/issues/new/choose)

Include the affected version or commit, package or CLI command, platform,
required conditions, observed impact and a minimal example using synthetic
data. Omit credentials, personal information and production logs.

Maintainers will triage the report privately, confirm affected versions with
the reporter and coordinate a fix and disclosure. The advisory should identify
the fixed version, any workaround and the reporter's preferred credit.

## Dependency scope

The core, web components and CLI are designed to run without third-party
runtime dependencies. The React adapter uses the application's React peer.
The Python verification tools use the standard library. Build tools, the
host framework and platform SDKs have their own update cycles.

Reports about One UI's handling of theme input, generated files, installer
destinations or published packages are in scope. Include the upstream issue
reference when a host or toolchain defect also affects One UI users.
