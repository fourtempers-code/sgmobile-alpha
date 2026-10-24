# SimGolf Mobile — Alpha version 1.1

[Play SimGolf Mobile](https://fourtempers-code.github.io/sgmobile-alpha/golf.html?hd=0&mobile=1)

Build: **alpha110-release-v1-20261024T014532Z**.

An unofficial mobile-focused adaptation of the original SimGolf engine. Players supply their own compatible game files; original game assets, executables and saves are not included. See [setup and testing notes](site/README.txt) and [third-party notices](site/THIRD_PARTY_NOTICES.txt).

## Changes in Alpha 1.1

- Optional precision terrain controls: select a location, then use separated Up (left) and Down (right) buttons. Normal touch editing remains the default.
- Compact contextual Build, Play and Manage navigation, selected menu symbols, and a clearer Open-hole H.
- Original blimp opening playback from locally imported game files, with a Skip intro button.
- Unpacking progress appears above setup instructions.

The preceding private candidate passed 68 focused browser assertions; the Alpha 1.1 package passes 41 packaging checks. Hosted checks and physical-device acceptance have separate scopes; this is alpha software, not a stable release.

## Updating and testing

Export a save backup, save your game, close all game tabs/Home Screen windows, then reopen online and verify **Alpha version 1.1**. Do not clear website data. Test portrait/landscape, direct and precision terrain editing, normal play and save/load, then an offline cold launch.

Use one game window at a time: simultaneous clients can overwrite each other’s save inventory. Broader device coverage, long sessions, storage eviction and progression edge cases remain test areas. Include the exact version/build, device, orientation, course/date and steps when reporting a problem.

This repository contains reviewed app artifacts and public dependency source archives. Development remains private. Publication is manual, verifies every staged file hash, and uploads only `site/`.
