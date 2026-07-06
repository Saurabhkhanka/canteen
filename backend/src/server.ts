import dotenv from 'dotenv';
import path from 'path';

// Load environment variables before importing App and DB
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import app from './app';
import { connectDB } from './config/db';

const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const startServer = async () => {
  // Connect to database
  await connectDB();

  // Listen
  app.listen(PORT, HOST, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on http://${HOST}:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
