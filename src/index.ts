import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { router } from './routes.js';

const app = express();
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(cors({ origin: process.env.ORIGIN?.split(',') || true, credentials: true }));
app.use(morgan('dev'));
app.use('/api', router);

const port = Number(process.env.PORT) || 4000;
app.listen(port, '0.0.0.0', () => {
  console.log(`DLR server running on port ${port}`);
});
