# Keep-Alive Setup for Render Free Tier

This project includes a built-in keep-alive mechanism to prevent Render's free tier from spinning down due to inactivity.

## How It Works

The server automatically pings its own health endpoint (`/api/health`) every 10 minutes to keep the instance active. This prevents the 50+ second cold start delay.

## Configuration

### Option 1: Automatic (Recommended)
The keep-alive will automatically use `RENDER_EXTERNAL_URL` if available in Render.

### Option 2: Manual Configuration
Set the `KEEP_ALIVE_URL` environment variable in Render dashboard:
```
KEEP_ALIVE_URL=https://your-app-name.onrender.com
```

## Alternative Solutions

### Option 1: External Cron Service (More Reliable)
Use a free cron service to ping your health endpoint:

**Services:**
- **cron-job.org** (Free): https://cron-job.org
- **UptimeRobot** (Free): https://uptimerobot.com
- **EasyCron** (Free tier available): https://www.easycron.com

**Setup:**
1. Create account on one of these services
2. Add a new cron job/uptime monitor
3. URL: `https://your-app-name.onrender.com/api/health`
4. Interval: Every 5-10 minutes
5. Method: GET

### Option 2: GitHub Actions (If using GitHub)
Create `.github/workflows/keep-alive.yml`:

```yaml
name: Keep Alive

on:
  schedule:
    - cron: '*/10 * * * *'  # Every 10 minutes
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping health endpoint
        run: |
          curl -f https://your-app-name.onrender.com/api/health || exit 0
```

### Option 3: Client-Side Keep-Alive
If you have a frontend, ping the health endpoint periodically:

```javascript
// In your frontend app
setInterval(async () => {
  try {
    await fetch('https://your-api.onrender.com/api/health');
  } catch (error) {
    // Silently fail
  }
}, 10 * 60 * 1000); // Every 10 minutes
```

## Notes

- The built-in keep-alive only runs in production
- Pings every 10 minutes (Render spins down after ~15 minutes of inactivity)
- If the self-ping fails, errors are logged but won't crash the server
- External cron services are more reliable as they're independent of your server

## Recommended Approach

**Best Practice**: Use both:
1. Built-in self-ping (backup)
2. External cron service (primary)

This ensures redundancy - if one method fails, the other keeps your instance alive.

