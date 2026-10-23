# Native Electron packaging probe

This independent experiment uses the Electron 42.11.18, Forge 7.11.2 and
better-sqlite3 12.11.1 versions locked by J Agent at the time of the experiment.
It contains no J Agent application source, credentials or user data.

The manual/experiment-branch workflow runs on native Intel macOS and Windows x64.
Each job independently installs dependencies, rebuilds SQLite for Electron,
makes a ZIP or Squirrel.Windows installer, then launches the packaged executable.
The app checks in-memory SQLite and hidden Renderer startup and writes a report
inside a job-owned Profile directory. Artifacts expire after three days.

Packages are unsigned experiments. They are not J Agent releases and must not be
used as release, installed-upgrade, notarization, SmartScreen or Computer Use
acceptance. The Windows test starts the packaged executable, not Setup.exe.

There is no private-repository checkout, secret, release upload or feed change.
For public repositories, standard hosted runners are free according to GitHub's
current runner documentation; artifact storage remains governed by account limits.
