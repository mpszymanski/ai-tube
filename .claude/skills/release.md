# Release AI Tube

Prepare and publish a new release: summarise changes, bump version, write changelog, commit, tag, and push to trigger the CI build.

## Steps

### 1. Gather context

Run these commands to understand the current state:

```bash
# Current version
node -p "require('./package.json').version"

# Last published tag
git describe --tags --abbrev=0 2>/dev/null || echo "(no tags yet)"

# Commits since last tag (or all commits if no tags)
git log $(git describe --tags --abbrev=0 2>/dev/null)..HEAD --oneline 2>/dev/null || git log --oneline
```

Also read `CHANGELOG.md` if it exists, so new entries are formatted consistently.

### 2. Categorise the changes

Group the commits into:
- **Breaking changes** — anything that removes or changes existing behaviour
- **Features** — new user-visible capabilities
- **Fixes** — bug fixes
- **Chores** — version bumps, dependency updates, CI, docs (no user impact)

### 3. Propose a version bump

Use semver rules:
- Breaking change present → **major** bump
- New features, no breaking changes → **minor** bump
- Only fixes / chores → **patch** bump

Show the proposed new version and ask the user to confirm or override before continuing:

> Proposed: **vX.Y.Z** (patch bump — only bug fixes since last release). Proceed, or enter a different version?

### 4. Update version numbers

Update the version field in all three files to the confirmed version (without the leading `v`):

- `package.json` — `"version"` field
- `src-tauri/tauri.conf.json` — `"version"` field
- `src-tauri/Cargo.toml` — `version` field under `[package]`

Read each file before editing.

### 5. Write the changelog

If `CHANGELOG.md` does not exist, create it with this header:

```markdown
# Changelog

All notable changes to AI Tube are documented here.
```

Prepend a new entry for this release above all previous entries:

```markdown
## [vX.Y.Z] — YYYY-MM-DD

### Breaking Changes
- ...

### Features
- ...

### Fixes
- ...
```

Omit sections that have no entries. Use plain English bullet points written for end users, not raw commit messages.

### 6. Show a final diff and ask for confirmation

Run `git diff` to show all staged changes, then ask:

> Ready to commit, tag `vX.Y.Z`, and push. This will trigger the GitHub Actions build and publish the release. Confirm?

Do NOT proceed without explicit confirmation.

### 7. Commit, tag, and push

```bash
git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml CHANGELOG.md
git commit -m "chore: release vX.Y.Z"
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
```

### 8. Report completion

After pushing, tell the user:
- The tag that was pushed (`vX.Y.Z`)
- The GitHub Actions URL to watch the build: `https://github.com/mpszymanski/ai-tube/actions`
- The releases page where the installer will appear once CI finishes: `https://github.com/mpszymanski/ai-tube/releases`
