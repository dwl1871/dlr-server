import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { router } from './routes.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
app.use(helmet());
app.use(express.json()); //
app.use(cors({ origin: process.env.ORIGIN?.split(',') || true, credentials: true }));
app.use(morgan('dev'));
app.use('/api', router);

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));


app.get('/api/health/db', async (_req, res) => {
  try { await prisma.$queryRaw`SELECT 1`; res.json({ db: true }); }
  catch (e: any) { console.error('DB health:', e); res.status(500).json({ db:false, error:String(e) }); }
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, '0.0.0.0', () => console.log(`DLR server running on port ${port}`));

