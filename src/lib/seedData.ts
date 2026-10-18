import { PrismaClient } from '@prisma/client';
import { INITIAL_ATHLETES } from '@/data/mockAthletes';

export async function seedDatabase(prismaClient: PrismaClient) {
  // Limpa todas as tabelas respeitando cascata
  await prismaClient.orthopedicTest.deleteMany();
  await prismaClient.functionalAssessment.deleteMany();
  await prismaClient.injuryRecord.deleteMany();
  await prismaClient.extraActivity.deleteMany();
  await prismaClient.athlete.deleteMany();

  for (const mock of INITIAL_ATHLETES) {
    await prismaClient.athlete.create({
      data: {
        id: mock.id,
        name: mock.name,
        age: mock.age,
        weight: mock.weight,
        height: mock.height,
        dominance: mock.dominance,
        mainSport: mock.mainSport,
        mainSportFrequency: mock.mainSportFrequency,
        sessionDurationMinutes: mock.sessionDurationMinutes,
        competitiveLevel: mock.competitiveLevel,
        hasExtraActivity: mock.hasExtraActivity,
        riskLevel: mock.clinicalSummary.riskLevel,
        clinicalSummary: JSON.stringify(mock.clinicalSummary),
        createdAt: new Date(mock.createdAt),
        extraActivities: {
          create: mock.extraActivities.map((ea) => ({
            activityName: ea.activityName,
            weeklyFrequency: ea.weeklyFrequency,
          })),
        },
        injuries: {
          create: mock.injuries.map((inj) => ({
            type: inj.type,
            bodyRegion: inj.bodyRegion,
            side: inj.side,
            description: inj.description,
            occurredAt: inj.occurredAt,
            recoveryStatus: inj.recoveryStatus,
            currentPainEVA: inj.currentPainEVA,
          })),
        },
        functionalTests: {
          create: [
            {
              hopTestRight: mock.functional.hopTestRightCm,
              hopTestLeft: mock.functional.hopTestLeftCm,
              hopTestLSI: mock.functional.hopTestLSI,
              yBalanceRight: mock.functional.yBalanceRightCm,
              yBalanceLeft: mock.functional.yBalanceLeftCm,
              yBalanceDiff: mock.functional.yBalanceAsymmetryPercent,
              lungeTestRight: mock.functional.lungeTestRightCm,
              lungeTestLeft: mock.functional.lungeTestLeftCm,
              plankTimeSeconds: mock.functional.plankTimeSeconds,
              notes: mock.functional.functionalNotes,
            },
          ],
        },
        orthopedicTests: {
          create: mock.orthopedic.tests.map((ot) => ({
            joint: ot.joint,
            testName: ot.name,
            result: ot.result,
            side: ot.side,
            painProvoked: ot.result === 'Positivo',
            notes: ot.painNotes || '',
          })),
        },
      },
    });
  }
}
