import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import apiRoutes from './routes/api.js';
import { setupChatSocket } from './sockets/chatSocket.js';
import { runMigrations } from './db/migrate.js';
import pool from './db/index.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', '*'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

setupChatSocket(io);

// Start server after migrations
async function bootstrap() {
  try {
    console.log('[BOOTSTRAP] Initializing database migrations...');
    await runMigrations();

    server.listen(PORT, () => {
      console.log(`[SERVER RUNNING] Chat Backend active at http://localhost:${PORT}`);
      console.log(`[SOCKET.IO READY] Real-time engine listening for connections`);
    });
  } catch (err) {
    console.error('[BOOTSTRAP FATAL ERROR] Failed to start server:', err.message);
    process.exit(1);
  }
}

bootstrap();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[SHUTDOWN] Closing server and database pool...');
  await pool.end();
  server.close(() => {
    console.log('[SHUTDOWN] Exited cleanly.');
    process.exit(0);
  });
});
