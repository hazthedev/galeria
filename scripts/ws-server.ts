// ============================================
// MOMENTIQUE - WebSocket Server Entrypoint
// ============================================

import { initializeWebSocket } from '@/lib/websocket/server';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const port = Number(process.env.WS_PORT || 3001);

initializeWebSocket(port)
  .then(() => {
    console.log(`[WS] Ready on port ${port}`);
  })
  .catch((error) => {
    console.error('[WS] Failed to start WebSocket server:', error);
    process.exit(1);
  });
