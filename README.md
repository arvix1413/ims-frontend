# IMS Frontend

## Development

## Deleted-item order cleanup

The order action menu and mobile card expose **删除订单 / Delete Order**. Permanent deletion is enabled only for statuses with no inventory holding (`pending`, `shipped`, `out of stock`, `void`, `arrived picked up`). Inventory-holding statuses keep the button disabled and must first be resolved through the normal status workflow. The action shows the design and order ID in a destructive confirmation dialog; successful deletion refreshes the list. The backend remains the final inventory-safety authority.

Install dependencies:

```bash
npm ci
```

Start local development:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

## Auto Deploy

This project is configured for automatic production deployment with GitHub Actions.

Workflow file:

- [.github/workflows/deploy.yml](/Users/leo_w/Workspace/codes/ern-projects/ims-frontend/.github/workflows/deploy.yml:1)

Trigger conditions:

- Push to `main`
- Manual `workflow_dispatch`

## Deployment Flow

When `main` is updated, GitHub Actions does the following:

1. Checks out the repository.
2. Runs `npm ci`.
3. Runs `node buildZip.js`.
4. `buildZip.js` runs `npm run build`, then packages `.next`, `public`, and `package.json` into `build.zip`.
5. Uploads `build.zip` to production server `119.28.104.20`.
6. Moves the uploaded file to `/root/frontend/build.zip`.
7. Executes `/root/frontend/restartFrontend.sh` on the server.
8. Verifies the deployment with `curl http://127.0.0.1`.
9. Sends a Telegram deployment notification.

## Production Server

Current production target:

- Host: `119.28.104.20`
- SSH port: `22`
- Deploy directory: `/root/frontend`

Current server restart script:

```bash
cd /root/frontend
unzip -o build.zip
npm install --production
pm2 stop nextjs-app
pm2 delete nextjs-app
pm2 start npm --name "nextjs-app" -- start
pm2 save
pm2 startup
service nginx restart
```

Runtime layout:

- Next.js app runs with `pm2` as `nextjs-app`
- App serves on port `3000`
- `nginx` proxies external traffic on port `80`

## Required GitHub Secrets

The deploy workflow depends on these repository secrets:

- `IMS_PROD_HOST`
- `IMS_PROD_USERNAME`
- `IMS_PROD_PASSWORD`
- `IMS_PROD_SUDO_PASSWORD`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

## Notes

- Deployment is currently zip-based, not Docker-based.
- Server-side deploy logic depends on `/root/frontend/restartFrontend.sh`.
- If the server restart script changes, update the GitHub Actions workflow to match it.
