# GitHub Actions Workflows

This directory contains the CI/CD workflows for the web-ui project.

## Workflows

### 1. CI (`ci.yml`)

**Trigger:** pull requests, pushes to `master`, manual dispatch

**Jobs:**
- **test-server**: mock server tests (`yarn test`, 70% coverage gate) on Node.js 20.x and 22.x
- **test-client**: client unit tests with coverage, then the production build (uploaded as `client-build`)
- **fuse-integration**: starts OpenSearch and Fuse with `scripts/fuse-up.sh`, loads the Dragons sample and runs
  `yarn test:fuse` in `client/`: every Fuse call the UI makes, every Dragons template in Cypher and V1, and the
  queries of the Dragons tutorial. Fuse logs are printed on failure.

- **compose**: `docker compose up -d --build` (OpenSearch, Fuse, the Dragons loader, the mock server and the UI
  image), waits for the loader, checks the UI serves its pages and forwards `/fuse` and `/api`, then runs
  `yarn test:fuse` through the UI container's nginx (`FUSE_URL=http://localhost:3000`).

### 2. Release (`deploy.yml`)

**Trigger:** `vX.Y.Z` tags, pushes to `master`, manual dispatch

**Jobs:**
- **package**: server and client tests, build, and the deployment package `web-ui-<ref>.tar.gz` (artifact,
  90 days). On a tag it also checks that both `package.json` versions match the tag and publishes a GitHub release
  with the package and the matching `CHANGELOG.md` section as notes.

See [docs/RELEASING.md](../../docs/RELEASING.md).

### 3. Pull Request Checks (`pr-checks.yml`)

**Trigger:** Pull Request opened/synchronized/reopened

**Jobs:**
- **pr-metadata**: Validates PR title follows semantic conventions
- **test-changes**: Runs tests only for changed files
- **size-check**: Checks and reports bundle size
- **code-quality**: Generates test coverage report

**Features:**
- ✅ Semantic PR title validation
- ✅ Selective testing based on changed files
- ✅ Bundle size reporting as PR comment
- ✅ Test coverage reporting as PR comment
- ✅ Optimized CI for faster feedback

## Workflow Status Badges

Add these badges to your README.md:

```markdown
![CI/CD Pipeline](https://github.com/YOUR_USERNAME/web-ui/workflows/CI%2FCD%20Pipeline/badge.svg)
![Deploy](https://github.com/YOUR_USERNAME/web-ui/workflows/Deploy/badge.svg)
```

## Required Secrets

For full functionality, configure these secrets in GitHub:

### Optional (for deployment):
- `DEPLOY_HOST`: Production server hostname
- `DEPLOY_USER`: SSH username
- `DEPLOY_KEY`: SSH private key
- `CODECOV_TOKEN`: Codecov upload token (optional, works without it)

### Automatically available:
- `GITHUB_TOKEN`: Provided automatically by GitHub Actions

## Branch Protection Rules

Recommended settings for main/master branch:

1. ✅ Require pull request reviews before merging
2. ✅ Require status checks to pass before merging:
   - `Test Server API`
   - `Test Client Application`
   - `Build Client Application`
   - `Lint Code`
3. ✅ Require branches to be up to date before merging
4. ✅ Require signed commits (optional)

## Local Testing

Test workflows locally using [act](https://github.com/nektos/act):

```bash
# Install act
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash  # Linux

# Run CI workflow
act -j test-server

# Run all jobs
act
```

## Workflow Optimization

The workflows are optimized for:
- **Speed**: Parallel job execution, selective testing
- **Cost**: Caching dependencies, conditional execution
- **Reliability**: Matrix testing, artifact retention
- **Developer Experience**: PR comments, clear feedback

## Customization

### Changing Node.js Versions

Edit the matrix strategy in `ci.yml`:

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x]  # Add/remove versions
```

### Adding Environment Variables

Add to the build step:

```yaml
- name: Build client
  run: cd client && yarn build
  env:
    CI: false
    REACT_APP_API_URL: ${{ secrets.API_URL }}
```

### Enabling Deployment

1. Uncomment SSH deployment steps in `deploy.yml`
2. Add required secrets to GitHub repository
3. Update deployment paths and commands

## Troubleshooting

### Workflow fails on dependency installation

Check that:
- `yarn.lock` is committed
- Dependencies are compatible
- Node version matches local development

### Tests pass locally but fail in CI

Check for:
- Environment-specific code
- Missing environment variables
- Timezone differences
- File path case sensitivity

### Coverage upload fails

This is expected if:
- Running on forked repository
- Codecov token not configured
- Set `continue-on-error: true` (already configured)

## Monitoring

View workflow runs:
1. Go to repository on GitHub
2. Click "Actions" tab
3. Select workflow from left sidebar
4. Click on individual run for details

## Support

For issues with workflows:
1. Check workflow run logs in GitHub Actions tab
2. Verify required secrets are configured
3. Test locally with `act` if possible
4. Review GitHub Actions documentation
