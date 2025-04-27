// Using ES Modules for compatibility with package.json setting
import express from 'express';
import path from 'path';
import cors from 'cors';
import axios from 'axios';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure API data directory exists for persistent storage
const apiDataDir = path.join(__dirname, 'api', 'data');
if (!fs.existsSync(apiDataDir)) {
  fs.mkdirSync(apiDataDir, { recursive: true });
  console.log('Created API data directory for persistent storage:', apiDataDir);
}

const app = express();
const PORT = process.env.PORT || 3000;

// CORS config
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from the Vite build directory
app.use(express.static(path.join(__dirname, 'dist')));

// PayPlug endpoints have been removed as we're fully switching to Stripe with Vercel serverless functions

// Note: Stripe integration is now client-side only
// No server-side endpoints needed for the static site deployment

// All other routes should serve the main index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Stripe payments handled through Vercel serverless functions`);
  console.log(`Frontend available at http://localhost:${PORT}`);
});