# Releasing web-ui

Releases are GitHub releases built by the **Release** workflow (`.github/workflows/deploy.yml`) from a `vX.Y.Z` tag.
Each release carries `web-ui-vX.Y.Z.tar.gz` (the production client build, the mock server and its data, and the Fuse
scripts) and uses the matching `CHANGELOG.md` section as its notes.

## Steps

1. **Merge everything for the release into `master`**, with CI green.
2. **Prepare a release PR** from a branch:
   - Set `"version"` to `X.Y.Z` in `package.json` and `client/package.json`. The workflow refuses a tag that does not
     match both.
   - In `CHANGELOG.md`, rename `## [Unreleased]` to `## [X.Y.Z] - YYYY-MM-DD`, add a new empty `## [Unreleased]`
     above it, and update the compare links at the bottom.
   - Check the Dragons tutorial against a live Fuse: `scripts/fuse-up.sh`, then `cd client && yarn test:fuse`.
   - Pick the Fuse version the release supports (normally the latest [yang-db release](https://github.com/YANG-DB/yang-db/releases)):
     set it as the default `FUSE_IMAGE` in `docker-compose.yml` and `scripts/fuse-up.sh`, and record it in the
     section's **Works with** table and in the README's **Compatibility** table.
   - Links in the section use absolute URLs pinned to the tag (`https://github.com/YANG-DB/web-ui/blob/vX.Y.Z/...`),
     because the section becomes the release page.
3. **Merge the release PR**, then tag the merge commit and push the tag:
   ```bash
   git checkout master && git pull
   git tag -a vX.Y.Z -m "web-ui X.Y.Z"
   git push origin vX.Y.Z
   ```
4. The **Release** workflow tests, builds, checks the versions, packages and publishes the release. Watch it with
   `gh run watch` or on the Actions tab.

Alternatively, create the release in the GitHub UI or with `gh release create vX.Y.Z --target master`. The tag push
then triggers the same workflow, which uploads the package to the existing release.

## What is in the package

```
web-ui-vX.Y.Z/
├── client/            production build of the React app (static files)
├── server.js          mock backend (port 5001)
├── package.json, yarn.lock
├── mocks/             mock data
├── scripts/           fuse-up.sh / fuse-down.sh
├── docs/              tutorials (Getting started, Dragons) and screenshots
├── README.md, CHANGELOG.md, LICENSE
```

To run everything in Docker instead, use the source code (a clone, or the release's "Source code" archive) and
`docker compose up -d`.

Serve `client/` from any static web server. In production the app calls Fuse at `REACT_APP_FUSE_URL`, which is read
at **build time** (default `/fuse`, so put Fuse behind the same origin under `/fuse`, or rebuild with
`REACT_APP_FUSE_URL=https://fuse.example.org/fuse yarn build`). Fuse has CORS open and no authentication: do not
expose it publicly as it is.

## Versioning

- Patch (`0.2.1`): fixes only.
- Minor (`0.3.0`): new features, such as the next items of `docs/UX_AND_FUSE_PLAN.md`.
- Major: reserved for 1.0, when the plan's definition of done is met.
