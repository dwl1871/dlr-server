import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();
export const router = Router();

function auth(req: any, res: any, next: any) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Missing Authorization header' });
  const token = header.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev') as any;
    req.userId = Number((payload as any).sub);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Auth
router.post('/auth/register', async (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(6), name: z.string().min(1) });
  const parse = schema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error);
  const { email, password, name } = parse.data;
  const hash = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({ data: { email, password: hash, name } });
    return res.json({ id: user.id, email: user.email, name: user.name });
  } catch {
    return res.status(400).json({ message: 'Email already in use' });
  }
});

router.post('/auth/login', async (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
  const parse = schema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error);
  const { email, password } = parse.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

// Clients
router.get('/clients', auth, async (req: any, res) => {
  const clients = await prisma.client.findMany({ where: { ownerId: req.userId }, orderBy: { createdAt: 'desc' } });
  res.json(clients);
});

router.post('/clients', auth, async (req: any, res) => {
  const schema = z.object({ name: z.string().min(1), phone: z.string().optional(), email: z.string().email().optional(), address: z.string().optional(), notes: z.string().optional() });
  const parse = schema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error);
  const created = await prisma.client.create({ data: { ...parse.data, ownerId: req.userId } });
  res.status(201).json(created);
});

// Jobs
router.get('/jobs', auth, async (req: any, res) => {
  const jobs = await prisma.job.findMany({ where: { ownerId: req.userId }, include: { client: true, photos: true }, orderBy: { createdAt: 'desc' } });
  res.json(jobs);
});

router.post('/jobs', auth, async (req: any, res) => {
  const schema = z.object({ title: z.string().min(1), description: z.string().optional(), budget: z.number().optional(), clientId: z.number().optional() });
  const parse = schema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error);
  const job = await prisma.job.create({ data: { ...parse.data, ownerId: req.userId } });
  res.status(201).json(job);
});

// Photos
router.get('/jobs/:id/photos', auth, async (req: any, res) => {
  const id = Number(req.params.id);
  const list = await prisma.photo.findMany({ where: { jobId: id }, orderBy: { takenAt: 'asc' } });
  const withParsed = list.map((p: any) => ({ ...p, tags: (() => { try { return JSON.parse(p.tags); } catch { return []; } })() }));
  res.json(withParsed);
});

router.post('/jobs/:id/photos', auth, async (req: any, res) => {
  const id = Number(req.params.id);
  const schema = z.object({ url: z.string().url(), caption: z.string().optional(), stage: z.enum(['BEFORE','DURING','AFTER']).optional(), tags: z.array(z.string()).optional(), takenAt: z.string().datetime().optional() });
  const parse = schema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error);
  const created = await prisma.photo.create({ data: { url: parse.data.url, caption: parse.data.caption, stage: (parse.data.stage || 'BEFORE') as any, tags: JSON.stringify(parse.data.tags || []), takenAt: parse.data.takenAt ? new Date(parse.data.takenAt) : new Date(), jobId: id } });
  res.status(201).json(created);
});
