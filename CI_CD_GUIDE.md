# CI/CD Guide

This repo includes real GitHub Actions workflows for CI and CD.

Files:
- `.github/workflows/ci.yml`
- `.github/workflows/cd.yml`

## What CI Does
Workflow:
- `CI`

Triggers:
- pull requests
- pushes to `main`, `master`, `develop`, and `feature/**`

Jobs:
1. Backend build and test
2. Frontend build
3. Docker build validation

Checks performed:
- backend `npm ci`
- backend `npm run build`
- backend `npm run test:e2e`
- frontend `npm ci`
- frontend `npm run build`
- Docker runtime image build for backend
- Docker runtime image build for frontend

Why this is useful:
- PRs fail before merge if the backend breaks
- frontend production build is validated
- Dockerfiles are checked, not just app code

## What CD Does
Workflow:
- `CD`

Triggers:
- push to `main`
- manual run through `workflow_dispatch`

Behavior:
- logs in to GitHub Container Registry
- builds runtime Docker images
- pushes versioned images to GHCR

Published images:
- `ghcr.io/<owner>/<repo>-backend`
- `ghcr.io/<owner>/<repo>-frontend`

Tags generated:
- `sha-...`
- branch tag
- `latest` on the default branch

## Why GHCR
GHCR is the most direct default for GitHub Actions because:
- no extra Docker registry account is required
- `GITHUB_TOKEN` can authenticate automatically
- image publishing stays close to the repo

## Repo Settings You Need
### Packages permission
The workflow uses:
- `permissions.packages: write`

This is already declared in `cd.yml`, but the repository must also allow GitHub Actions to publish packages for the repo owner/account.

### Default branch
The CD workflow pushes `latest` only on the default branch.

## What You Will See In GitHub
On every PR:
- CI workflow runs
- backend/frontend status checks appear on the PR

On every push to `main`:
- CD workflow runs
- backend and frontend images are pushed to GHCR

## How To Use The Published Images
Example pull:
```bash
docker pull ghcr.io/<owner>/<repo>-backend:latest
docker pull ghcr.io/<owner>/<repo>-frontend:latest
```

Example production-style compose snippet:
```yaml
services:
  backend:
    image: ghcr.io/<owner>/<repo>-backend:latest
  frontend:
    image: ghcr.io/<owner>/<repo>-frontend:latest
```

## What This Pipeline Does Not Do Yet
It does not auto-deploy to a server or Kubernetes cluster.

That is intentional because deployment target details are missing:
- server IP / hostname
- SSH user
- deployment path
- container runtime strategy
- production secrets source

Right now CD is:
- build
- package
- publish

That is still a real CD artifact pipeline.

## If You Want Server Deployment Next
The next standard step would be:
1. add deployment secrets
2. create a server compose file that uses pushed images instead of local `build:`
3. add a deploy job over SSH or a platform-specific deploy action

Typical secrets:
- `DEPLOY_HOST`
- `DEPLOY_USERNAME`
- `DEPLOY_SSH_KEY`
- `DEPLOY_PATH`
- production app secrets

## Interview Answer
"My CI pipeline validates backend and frontend builds, runs backend e2e tests, and validates Docker images on every PR. My CD pipeline builds immutable runtime images and publishes them to GHCR on every push to main, so deployment can consume versioned artifacts instead of rebuilding on the server."
