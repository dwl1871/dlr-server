import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function run() {
  const password = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'owner@dlr.local' },
    create: { email: 'owner@dlr.local', name: 'David Love', password },
    update: {}
  });

  const client = await prisma.client.create({
    data: { name: 'Tonya Williams', email: 'tmarie_2020@yahoo.com', address: 'Port Orange, FL', ownerId: user.id }
  });

  const job = await prisma.job.create({
    data: { title: 'Kitchen Remodel – Williams', description: 'Spanish Mediterranean style', ownerId: user.id, clientId: client.id }
  });

  await prisma.photo.createMany({
    data: [
      { url: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=80&w=1080&auto=format&fit=crop', caption:'Before – view 1', stage:'BEFORE', jobId: job.id, tags: '[]' },
      { url: 'https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1080&auto=format&fit=crop', caption:'During – framing', stage:'DURING', jobId: job.id, tags: '[]' },
      { url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1080&auto=format&fit=crop', caption:'After – reveal', stage:'AFTER', jobId: job.id, tags: '[]' }
    ]
  });

  console.log('Seeded owner, client, job, and photos.');
}
run().finally(() => prisma.$disconnect());
