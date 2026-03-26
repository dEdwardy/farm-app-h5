# CI/CD to Aliyun Server

Workflow file: `.github/workflows/release-automation.yml`

## Flow

1. `pull_request` / `push master` runs `build-check`
2. `push master` runs `deploy-aliyun`
   - Build project
   - Stream `dist/` to server path with `tar + ssh`
   - Verify deployed `build-info.txt` on the server through SSH
   - Reload Nginx
3. `post-deploy-smoke` and `auto-rollback` are currently disabled

## Required GitHub Secrets

- `SERVER_HOST` e.g. `1.2.3.4`
- `SERVER_USER` e.g. `root` or deploy user
- `SERVER_PORT` e.g. `22`
- `SERVER_SSH_KEY` private key for SSH
- `SERVER_DEPLOY_PATH` e.g. `/var/www/farm-app`

## Required GitHub Variables

- `PRODUCTION_URL` e.g. `https://farm.example.com`

## Server Requirements

- Nginx configured to serve `SERVER_DEPLOY_PATH`
- Deploy user can write `SERVER_DEPLOY_PATH`
- Deploy user can run `sudo nginx -t` and `sudo systemctl reload nginx`
