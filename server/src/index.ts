import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes/api.routes.js';
import { marketService } from './services/market.service.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Start Server & Poller
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`====================================================`);
  console.log(` CryptoPro AI Backend Server Running on Port ${PORT}`);
  console.log(` API Endpoint: http://localhost:${PORT}/api/market/kpis`);
  console.log(`====================================================`);
  
  // Start Bitkub & Binance background sync
  await marketService.start();
});
