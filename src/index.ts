
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { router } from './routes.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
// ---- CORS (allow web + preflight) ----
const raw = process.env.ORIGIN ?? '*';
const origins = raw.split(',').map(s => s.trim());
const allowAll = origins.length === 1 && origins[0] === '*';

app.use(
  cors({
    origin: allowAll ? '*' : origins,                 // allow "*" or a list
    credentials: !allowAll,                           // only send credentials if not "*"
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Handle OPTIONS preflight for all routes
app.options('*', cors());
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

