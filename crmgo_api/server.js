import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './src/db/models/index.js';
import router from './src/routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api', router);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

sequelize
  .authenticate()
  .then(() => {
    console.log('Database connected.');
    return sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Database connection error:', err);
    process.exit(1);
  });
