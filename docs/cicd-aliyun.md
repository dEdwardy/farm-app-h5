# CI/CD to Aliyun Server

Workflow file: `.github/workflows/release-automation.yml`

## Flow

1. `pull_request` / `push master` runs `build-check`
   - Build project once
   - Write `dist/build-info.txt`
   - Upload downloadable build artifact from `dist/`
2. `push master` runs `deploy-aliyun`
   - Download the tested build artifact from `build-check`
   - Stream `dist/` to server path with `tar + ssh`
   - Verify deployed `build-info.txt` on the server through SSH
   - Reload Nginx
3. `post-deploy-smoke` and `auto-rollback` are currently disabled

> `deploy.sh` is a manual fallback path. It should only be used when GitHub Actions is unavailable, and it now writes the same `build-info.txt` marker for manual verification.

## Required GitHub Secrets

- `SERVER_HOST` e.g. `1.2.3.4`
- `SERVER_USER` e.g. `root` or deploy user
- `SERVER_PORT` e.g. `22`
- `SERVER_SSH_KEY` private key for SSH
- `SERVER_DEPLOY_PATH` must be `/usr/pros/farm-app`

## Server Requirements

- Nginx configured to serve `SERVER_DEPLOY_PATH`
- Deploy user can write `SERVER_DEPLOY_PATH`
- Deploy user can run `sudo nginx -t` and `sudo systemctl reload nginx`

## Verification

- Download the `farm-app-dist-<commit-sha>` artifact from the GitHub Actions run to inspect the exact deployed build output.
- Confirm the server-side fingerprint at `${SERVER_DEPLOY_PATH}/build-info.txt` matches the deployed commit SHA.
