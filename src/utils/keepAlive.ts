import axios from 'axios';

/**
 * Keep-alive utility to prevent Render free tier spin-down
 * Pings the health endpoint every 10 minutes to keep the instance active
 */
export function startKeepAlive() {
  // Only run in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('Keep-alive disabled in non-production environment');
    return;
  }

  const keepAliveUrl = process.env.KEEP_ALIVE_URL || process.env.RENDER_EXTERNAL_URL;
  
  if (!keepAliveUrl) {
    console.warn('Keep-alive: No URL configured. Set KEEP_ALIVE_URL or RENDER_EXTERNAL_URL environment variable');
    return;
  }

  // Ping interval: 10 minutes (600,000 ms)
  // Render free tier spins down after ~15 minutes of inactivity
  const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes

  const healthEndpoint = `${keepAliveUrl}/api/health`;

  console.log(`🔄 Keep-alive enabled. Pinging ${healthEndpoint} every ${PING_INTERVAL / 1000 / 60} minutes`);

  // Ping immediately on start
  pingHealthEndpoint(healthEndpoint);

  // Set up interval for periodic pings
  setInterval(() => {
    pingHealthEndpoint(healthEndpoint);
  }, PING_INTERVAL);
}

async function pingHealthEndpoint(url: string) {
  try {
    const response = await axios.get(url, {
      timeout: 5000, // 5 second timeout
      headers: {
        'User-Agent': 'Keep-Alive-Bot/1.0'
      }
    });

    if (response.status === 200) {
      console.log(`✅ Keep-alive ping successful at ${new Date().toISOString()}`);
    }
  } catch (error: any) {
    // Don't throw - just log errors silently
    // Server might be starting up or there might be network issues
    if (process.env.NODE_ENV === 'production') {
      console.warn(`⚠️ Keep-alive ping failed: ${error.message}`);
    }
  }
}

