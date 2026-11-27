// swift-tools-version: 5.9
// SPDX-License-Identifier: AGPL-3.0-only
import PackageDescription

let package = Package(
  name: "OneUI",
  platforms: [.iOS(.v17), .macOS(.v14), .watchOS(.v10)],
  products: [.library(name: "OneUI", targets: ["OneUI"])],
  targets: [.target(name: "OneUI"), .testTarget(name: "OneUITests", dependencies: ["OneUI"])]
)
