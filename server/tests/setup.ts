import { beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/database.js';

beforeAll(async () => {
  // Connect to database
  await prisma.$connect();
  console.log('Test database connected');
});

afterAll(async () => {
  // Disconnect from database
  await prisma.$disconnect();
  console.log('Test database disconnected');
});
