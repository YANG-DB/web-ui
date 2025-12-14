# GitHub Actions CI/CD Setup Guide

This guide explains how to set up and use the GitHub Actions workflows for this project.

## 🚀 Quick Start

1. **Push to GitHub**: All workflows are automatically triggered when you push code
2. **View Results**: Go to the "Actions" tab in your GitHub repository
3. **Get Status Badges**: Add badges to your README (see below)

## 📋 Workflows Overview

### 1. CI/CD Pipeline (`ci.yml`)

**Purpose**: Continuous Integration and Testing

**Triggers**:
- Push to `main`, `master`, or `develop` branches
- Pull requests to these branches

**What it does**:
- ✅ Runs server tests on Node.js 18.x and 20.x
- ✅ Runs client tests on Node.js 18.x and 20.x
- ✅ Builds the React application
- ✅ Runs ESLint for code quality
- ✅ Performs security audit
- ✅ Generates test coverage reports
- ✅ Archives build artifacts

### 2. Deploy (`deploy.yml`)

**Purpose**: Automated Deployment

**Triggers**:
- Push to `main` or `master` branch
- Version tags (e.g., `v1.0.0`)
- Manual trigger via GitHub UI

**What it does**:
- ✅ Runs full test suite
- ✅ Builds production bundle
- ✅ Creates deployment package
- ✅ Creates GitHub Release for tags
- ✅ (Optional) Deploys to server via SSH

### 3. Pull Request Checks (`pr-checks.yml`)

**Purpose**: Enhanced PR Validation

**Triggers**:
- Pull request opened, synchronized, or reopened

**What it does**:
- ✅ Validates PR title (semantic commits)
- ✅ Tests only changed files
- ✅ Reports bundle size in PR comment
- ✅ Reports test coverage in PR comment

## 🔧 Setup Instructions

### Step 1: Enable GitHub Actions

GitHub Actions are enabled by default for public repositories. For private repositories:

1. Go to repository **Settings** → **Actions** → **General**
2. Ensure "Allow all actions and reusable workflows" is selected

### Step 2: Configure Branch Protection (Recommended)

1. Go to **Settings** → **Branches**
2. Add rule for `main` branch:
   - ✅ Require pull request reviews
   - ✅ Require status checks:
     - `Test Server API`
     - `Test Client Application`
     - `Build Client Application`
   - ✅ Require branches to be up to date

### Step 3: Add Status Badges to README

Add these lines to your `README.md`:

```markdown
[![CI/CD Pipeline](https://github.com/YOUR_USERNAME/web-ui/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/YOUR_USERNAME/web-ui/actions/workflows/ci.yml)
[![Deploy](https://github.com/YOUR_USERNAME/web-ui/workflows/Deploy/badge.svg)](https://github.com/YOUR_USERNAME/web-ui/actions/workflows/deploy.yml)
[![Test Coverage](https://codecov.io/gh/YOUR_USERNAME/web-ui/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/web-ui)
```

Replace `YOUR_USERNAME` with your GitHub username.

### Step 4: (Optional) Configure Codecov

For test coverage tracking:

1. Sign up at [codecov.io](https://codecov.io)
2. Add your repository
3. No token needed for public repos
4. For private repos, add `CODECOV_TOKEN` secret

### Step 5: (Optional) Configure Deployment

To enable automatic deployment:

1. Add these secrets in **Settings** → **Secrets and variables** → **Actions**:
   - `DEPLOY_HOST`: Your server hostname
   - `DEPLOY_USER`: SSH username
   - `DEPLOY_KEY`: SSH private key

2. Uncomment deployment steps in `.github/workflows/deploy.yml`

3. Customize deployment commands for your server setup

## 🎯 Using the Workflows

### Running Tests Locally

Before pushing, test locally:

```bash
# Server tests
yarn test

# Client tests
cd client && yarn test

# Client build
cd client && yarn build

# Lint
cd client && yarn lint
```

### Creating a Release

1. Update version in `package.json`:
   ```bash
   npm version patch  # or minor, major
   ```

2. Push with tags:
   ```bash
   git push origin main --tags
   ```

3. GitHub Actions will:
   - Run all tests
   - Create deployment package
   - Create GitHub Release
   - Attach deployment artifact

### Manual Deployment

Trigger deployment workflow manually:

1. Go to **Actions** → **Deploy**
2. Click **Run workflow**
3. Select branch
4. Click **Run workflow**

### Viewing Workflow Results

1. Go to **Actions** tab
2. Click on workflow run
3. Click on job to see details
4. Download artifacts from summary page

## 📊 Understanding Workflow Results

### Success ✅
- All jobs completed successfully
- Green checkmark on commit/PR
- Safe to merge

### Failure ❌
- One or more jobs failed
- Red X on commit/PR
- Click "Details" to see error logs
- Fix issues and push again

### Warnings ⚠️
- Non-critical issues found
- Yellow indicator
- Review and fix when possible

## 🔍 Troubleshooting

### "Test Server API" fails

**Common causes**:
- Test coverage below 70%
- Server tests failing
- Dependencies not installing

**Solution**:
1. Check test logs in Actions tab
2. Run `yarn test` locally
3. Ensure `yarn.lock` is committed

### "Build Client Application" fails

**Common causes**:
- Build errors
- Missing dependencies
- Environment variables

**Solution**:
1. Run `cd client && yarn build` locally
2. Check for TypeScript/ESLint errors
3. Verify all dependencies are in `package.json`

### Deployment fails

**Common causes**:
- Missing secrets
- SSH connection issues
- Server permissions

**Solution**:
1. Verify secrets are configured
2. Test SSH connection manually
3. Check server logs

### Slow workflow execution

**Optimizations**:
- Workflows use caching for dependencies
- Parallel job execution
- Selective testing in PR checks

Average times:
- CI/CD: 3-5 minutes
- Deploy: 4-6 minutes
- PR Checks: 2-4 minutes

## 🔐 Security Best Practices

1. **Never commit secrets** - Use GitHub Secrets
2. **Review Dependabot PRs** - Automated dependency updates
3. **Enable security scanning** - npm audit runs automatically
4. **Use branch protection** - Prevent direct pushes to main
5. **Require reviews** - Mandatory PR reviews

## 📝 Customization

### Adding Environment Variables

In workflow file:

```yaml
- name: Build client
  run: cd client && yarn build
  env:
    REACT_APP_API_URL: ${{ secrets.API_URL }}
    REACT_APP_VERSION: ${{ github.sha }}
```

### Changing Node.js Versions

Edit matrix in `ci.yml`:

```yaml
strategy:
  matrix:
    node-version: [16.x, 18.x, 20.x]
```

### Adding Test Databases

```yaml
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_PASSWORD: postgres
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
```

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [Semantic Commit Messages](https://www.conventionalcommits.org/)
- [Codecov Documentation](https://docs.codecov.io/)

## 🆘 Getting Help

1. Check workflow logs in Actions tab
2. Review this documentation
3. Search [GitHub Actions Community](https://github.community/c/code-to-cloud/github-actions)
4. Open an issue in this repository

## ✨ Features

- ✅ Multi-version Node.js testing
- ✅ Parallel job execution
- ✅ Test coverage reporting
- ✅ Bundle size tracking
- ✅ Automated dependency updates
- ✅ Security scanning
- ✅ Deployment automation
- ✅ Release management
- ✅ PR validation
- ✅ Artifact archiving

---

**Last Updated**: December 2025
