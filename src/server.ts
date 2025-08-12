import express from 'express';
import dotenv from 'dotenv';
import { authRouter } from './routes/authRoutes';
import { priceRouter } from './routes/priceRoutes';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Electricity Price API is running!' });
});

// Mount routes
app.use('/api/auth', authRouter);
app.use('/api/price', priceRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
