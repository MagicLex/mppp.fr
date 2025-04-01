// Using ES Modules for compatibility with package.json setting
import express from 'express';
import path from 'path';
import cors from 'cors';
import axios from 'axios';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// CORS config
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from the Vite build directory
app.use(express.static(path.join(__dirname, 'dist')));

// PayPlug API proxy endpoint
app.post('/api/payplug/payments', async (req, res) => {
  try {
    console.log('Proxying PayPlug payment request');
    
    const response = await axios.post('https://api.payplug.com/v1/payments', req.body, {
      headers: {
        'Authorization': `Bearer ${req.headers.authorization.replace('Bearer ', '')}`,
        'Content-Type': 'application/json',
        'PayPlug-Version': req.headers['payplug-version'] || '2019-08-06'
      }
    });
    
    console.log('PayPlug payment created successfully');
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('PayPlug payment creation error:', error.response?.data || error.message);
    
    if (error.response) {
      // Forward the PayPlug error response
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        message: 'Error processing payment request',
        error: error.message
      });
    }
  }
});

// PayPlug payment confirmation endpoint
app.get('/api/payplug/payments/:paymentId', async (req, res) => {
  try {
    console.log('Checking payment status for:', req.params.paymentId);
    
    const response = await axios.get(`https://api.payplug.com/v1/payments/${req.params.paymentId}`, {
      headers: {
        'Authorization': `Bearer ${req.headers.authorization.replace('Bearer ', '')}`,
        'Content-Type': 'application/json',
        'PayPlug-Version': req.headers['payplug-version'] || '2019-08-06'
      }
    });
    
    console.log('PayPlug payment status retrieved successfully');
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('PayPlug payment status error:', error.response?.data || error.message);
    
    if (error.response) {
      // Forward the PayPlug error response
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        message: 'Error checking payment status',
        error: error.message
      });
    }
  }
});

// All other routes should serve the main index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`PayPlug API proxy available at http://localhost:${PORT}/api/payplug`);
  console.log(`Frontend available at http://localhost:${PORT}`);
});