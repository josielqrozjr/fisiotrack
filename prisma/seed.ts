import { PrismaClient } from '@prisma/client';
import { seedDatabase } from '../src/lib/seedData';

const prisma = new PrismaClient();

async function main() {
  console.log('[FisioTrack] Iniciando seed do banco SQLite...');
  await seedDatabase(prisma);
  console.log('[FisioTrack] 3 atletas clínicos completos inseridos com sucesso no SQLite.');
}

main()
  .catch((e) => {
    console.error('[FisioTrack] Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
