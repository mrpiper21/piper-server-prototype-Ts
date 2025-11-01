import axios from 'axios';
import http from 'http';

/**
 * Keep-alive utility to prevent Render free tier spin-down
 * Uses multiple strategies to ensure the instance stays active
 */
export function startKeepAlive(server: http.Server) {
  // Only run in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('ℹ️ Keep-alive disabled in non-production environment');
    return;
  }

  const PORT = Number(process.env.PORT) || 3000;
  
  // Strategy 1: Internal HTTP ping (most reliable - doesn't rely on external URL)
  // Ping interval: 5 minutes (300,000 ms) - Render spins down after ~15 minutes
  const INTERNAL_PING_INTERVAL = 5 * 60 * 1000; // 5 minutes
  
  console.log(`🔄 Keep-alive enabled (internal ping every ${INTERNAL_PING_INTERVAL / 1000 / 60} minutes)`);

  // Start internal ping immediately
  pingInternalHealth(PORT);
  
  // Set up interval for periodic internal pings
  const internalInterval = setInterval(() => {
    pingInternalHealth(PORT);
  }, INTERNAL_PING_INTERVAL);

  // Strategy 2: External ping (if URL is available)
  const externalUrl = getExternalUrl();
  let externalInterval: NodeJS.Timeout | null = null;
  
  if (externalUrl) {
    console.log(`🔄 External keep-alive also enabled: ${externalUrl}`);
    pingExternalHealth(externalUrl);
    
    externalInterval = setInterval(() => {
      pingExternalHealth(externalUrl);
    }, INTERNAL_PING_INTERVAL);
    
    externalInterval.unref();
  }
  
  // Clean up on server close
  server.on('close', () => {
    clearInterval(internalInterval);
    if (externalInterval) {
      clearInterval(externalInterval);
    }
  });

  // Ensure intervals don't prevent process exit
  internalInterval.unref();
}

/**
 * Internal ping - hits localhost directly (most reliable)
 */
function pingInternalHealth(port: number) {
  const options = {
    hostname: 'localhost',
    port: port,
    path: '/api/health',
    method: 'GET',
    timeout: 3000,
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      const timestamp = new Date().toISOString();
      console.log(`✅ [Internal] Keep-alive ping successful at ${timestamp}`);
    } else {
      console.warn(`⚠️ [Internal] Keep-alive ping returned status ${res.statusCode}`);
    }
    res.resume(); // Consume response to allow connection to close
  });

  req.on('error', (error: any) => {
    // Silently handle errors - server might still be starting
    if (process.env.NODE_ENV === 'production') {
      console.warn(`⚠️ [Internal] Keep-alive ping error: ${error.message}`);
    }
  });

  req.on('timeout', () => {
    req.destroy();
    console.warn('⚠️ [Internal] Keep-alive ping timeout');
  });

  req.end();
}

/**
 * External ping - hits the public URL (backup strategy)
 */
async function pingExternalHealth(url: string) {
  try {
    const healthEndpoint = url.endsWith('/api/health') 
      ? url 
      : `${url.replace(/\/$/, '')}/api/health`;
    
    const response = await axios.get(healthEndpoint, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Keep-Alive-Bot/1.0',
        'Cache-Control': 'no-cache',
      },
      validateStatus: (status) => status < 500, // Accept any status < 500
    });

    if (response.status === 200) {
      const timestamp = new Date().toISOString();
      console.log(`✅ [External] Keep-alive ping successful at ${timestamp}`);
    } else {
      console.warn(`⚠️ [External] Keep-alive ping returned status ${response.status}`);
    }
  } catch (error: any) {
    // Don't throw - external ping is just a backup
    if (error.code !== 'ECONNREFUSED' && error.code !== 'ETIMEDOUT') {
      console.warn(`⚠️ [External] Keep-alive ping failed: ${error.message}`);
    }
  }
}

/**
 * Get external URL from environment variables
 */
function getExternalUrl(): string | null {
  // Try multiple environment variable names
  const url = process.env.KEEP_ALIVE_URL 
    || process.env.RENDER_EXTERNAL_URL 
    || process.env.RENDER_EXTERNAL_HOSTNAME
    || process.env.APP_URL
    || null;

  if (!url) {
    return null;
  }

  // Ensure URL has protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }

  return url;
}

