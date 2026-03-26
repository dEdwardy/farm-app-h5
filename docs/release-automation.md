# Release Automation

This project now uses `.github/workflows/release-automation.yml`.

## What is automated

1. **Pre-release check (automatic)**
   - Trigger: `pull_request` and `push` to `master`
   - Runs: `npm ci` + `npm run build`

2. **Post-deploy smoke check (automatic)**
   - Trigger: `push` to `master`
   - Checks production homepage and `/login` endpoint for HTTP 200

3. **Fast rollback (automatic)**
   - If smoke check fails, workflow auto-creates a revert commit and pushes it to `master`
   - Revert commit message prefix: `revert(auto): ...`

## Required repository configuration

Set repository variable:

- `PRODUCTION_URL` (example: `https://farm-app.example.com`)

GitHub path:

- Repository → Settings → Secrets and variables → Actions → Variables

## Notes

- Workflow assumes Vercel deploy is already triggered by push to `master`.
- Smoke check waits 60 seconds before probing production.
- Auto rollback is skipped for commits already prefixed with `revert(auto):` to avoid loops.
