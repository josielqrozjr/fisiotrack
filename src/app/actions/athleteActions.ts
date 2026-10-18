'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { seedDatabase } from '@/lib/seedData';
import {
  Athlete,
  BodyRegion,
  BodySide,
  ClinicalSummary,
  CompetitiveLevel,
  Dominance,
  OrthopedicJoint,
  OrthopedicTestResult,
  RecoveryStatus,
  RiskLevel,
} from '@/types/fisiotrack';
import {
  calculateAsymmetryPercent,
  calculateLSI,
  computeFunctionalMetrics,
  createDefaultOrthopedicTests,
  evaluateClinicalSummary,
} from '@/lib/clinicalEngine';

// Catálogo de estruturas-alvo para exibição enriquecida
const TARGET_STRUCTURES_BY_NAME: Record<string, string> = {
  'Teste de Lachman': 'Ligamento Cruzado Anterior (LCA)',
  'Gaveta Anterior / Posterior': 'Estabilidade Anteroposterior (LCA / LCP)',
  'Teste de McMurray': 'Meniscos Medial e Lateral',
  'Estresse em Valgo / Varo': 'Ligamentos Colaterais (LCM / LCL)',
  'Gaveta Anterior Talofibular': 'Ligamento Talofibular Anterior (LTFA)',
  'Teste de Thompson': 'Integridade do Tendão Calcâneo (Aquiles)',
  'Teste de Kleiger (Rotação Externa)': 'Sindesmose Tibiofibular / Ligamento Deltoide',
  'Teste de Impacto de Neer': 'Espaço Subacromial / Supraespinal',
  'Teste de Hawkins-Kennedy': 'Impacto Subacromial / Bursa Subdeltoidea',
  'Teste de Jobe (Empty Can)': 'Tendão do Supraespinal (Manguito Rotador)',
  'Teste de Thomas': 'Flexores de Quadril (Iliopsoas / Reto Femoral)',
  'Teste de Lasègue / Slump': 'Tensão Neural Ciática / Radiculopatia Lombar',
  'Teste de Patrick (FABER)': 'Articulação Coxofemoral e Sacroilíaca',
};

type PrismaAthleteWithRelations = NonNullable<
  Awaited<ReturnType<typeof fetchAthleteWithRelations>>
>;

async function fetchAthleteWithRelations(id: string) {
  return prisma.athlete.findUnique({
    where: { id },
    include: {
      extraActivities: true,
      injuries: true,
      functionalTests: {
        orderBy: { assessedAt: 'desc' },
      },
      orthopedicTests: true,
    },
  });
}

function mapPrismaAthleteToDomain(record: PrismaAthleteWithRelations): Athlete {
  const latestFunctional = record.functionalTests[0];

  const hopRight = latestFunctional?.hopTestRight ?? 0;
  const hopLeft = latestFunctional?.hopTestLeft ?? 0;
  const yRight = latestFunctional?.yBalanceRight ?? 0;
  const yLeft = latestFunctional?.yBalanceLeft ?? 0;
  const lungeRight = latestFunctional?.lungeTestRight ?? 0;
  const lungeLeft = latestFunctional?.lungeTestLeft ?? 0;
  const plank = latestFunctional?.plankTimeSeconds ?? 0;
  const notes = latestFunctional?.notes ?? '';

  const functional = computeFunctionalMetrics({
    hopTestRightCm: hopRight,
    hopTestLeftCm: hopLeft,
    yBalanceRightCm: yRight,
    yBalanceLeftCm: yLeft,
    lungeTestRightCm: lungeRight,
    lungeTestLeftCm: lungeLeft,
    plankTimeSeconds: plank,
    functionalNotes: notes,
  });

  const mappedOrthoTests =
    record.orthopedicTests.length > 0
      ? record.orthopedicTests.map((ot) => ({
          id: ot.id,
          joint: ot.joint as OrthopedicJoint,
          name: ot.testName,
          targetStructure:
            TARGET_STRUCTURES_BY_NAME[ot.testName] || 'Avaliação Articular Especial',
          result: ot.result as OrthopedicTestResult,
          side: ot.side as BodySide,
          painNotes: ot.notes || '',
        }))
      : createDefaultOrthopedicTests();

  const mappedInjuries = record.injuries.map((inj) => ({
    id: inj.id,
    type: (inj.type === 'Cirurgia' ? 'Cirurgia' : 'Lesão') as 'Lesão' | 'Cirurgia',
    bodyRegion: inj.bodyRegion as BodyRegion,
    side: inj.side as BodySide,
    description: inj.description,
    occurredAt: inj.occurredAt,
    recoveryStatus: inj.recoveryStatus as RecoveryStatus,
    currentPainEVA: inj.currentPainEVA,
  }));

  const mappedExtras = record.extraActivities.map((ea) => ({
    activityName: ea.activityName,
    weeklyFrequency: ea.weeklyFrequency,
  }));

  const baseAthlete = {
    name: record.name,
    age: record.age,
    weight: record.weight,
    height: record.height,
    dominance: record.dominance as Dominance,
    mainSport: record.mainSport,
    mainSportFrequency: record.mainSportFrequency,
    sessionDurationMinutes: record.sessionDurationMinutes,
    competitiveLevel: record.competitiveLevel as CompetitiveLevel,
    hasExtraActivity: record.hasExtraActivity,
    extraActivities: mappedExtras,
    injuries: mappedInjuries,
    functional,
    orthopedic: { tests: mappedOrthoTests },
  };

  let clinicalSummary: ClinicalSummary;
  if (record.clinicalSummary) {
    try {
      const parsed = JSON.parse(record.clinicalSummary);
      if (parsed && parsed.riskLevel && Array.isArray(parsed.alerts)) {
        clinicalSummary = parsed;
      } else {
        clinicalSummary = evaluateClinicalSummary(baseAthlete);
      }
    } catch {
      clinicalSummary = evaluateClinicalSummary(baseAthlete);
    }
  } else {
    clinicalSummary = evaluateClinicalSummary(baseAthlete);
    clinicalSummary.riskLevel = (record.riskLevel as RiskLevel) || clinicalSummary.riskLevel;
  }

  return {
    id: record.id,
    ...baseAthlete,
    createdAt: record.createdAt.toISOString(),
    clinicalSummary,
  };
}

/**
 * READ ALL: Lista todos os atletas do banco SQLite com todos os relacionamentos
 */
export async function getAthletesAction(): Promise<Athlete[]> {
  let records = await prisma.athlete.findMany({
    include: {
      extraActivities: true,
      injuries: true,
      functionalTests: {
        orderBy: { assessedAt: 'desc' },
      },
      orthopedicTests: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Se o banco estiver vazio no primeiro uso, popula automaticamente com os 3 casos clínicos
  if (records.length === 0) {
    await seedDatabase(prisma);
    records = await prisma.athlete.findMany({
      include: {
        extraActivities: true,
        injuries: true,
        functionalTests: {
          orderBy: { assessedAt: 'desc' },
        },
        orthopedicTests: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  return records.map(mapPrismaAthleteToDomain);
}

/**
 * READ ONE: Busca o prontuário completo de um atleta pelo ID no SQLite
 */
export async function getAthleteByIdAction(id: string): Promise<Athlete | null> {
  const record = await fetchAthleteWithRelations(id);
  if (!record) return null;
  return mapPrismaAthleteToDomain(record);
}

/**
 * CREATE: Cria um novo atleta com Nested Write em uma única transação do Prisma
 */
export async function createAthleteAction(
  data: Omit<Athlete, 'id' | 'createdAt' | 'clinicalSummary'>
): Promise<Athlete> {
  const hopLSI = calculateLSI(
    data.functional.hopTestRightCm,
    data.functional.hopTestLeftCm
  );
  const yDiff = calculateAsymmetryPercent(
    data.functional.yBalanceRightCm,
    data.functional.yBalanceLeftCm
  );

  const enrichedFunctional = computeFunctionalMetrics(data.functional);
  const clinicalSummary = evaluateClinicalSummary({
    ...data,
    functional: enrichedFunctional,
  });

  const created = await prisma.athlete.create({
    data: {
      name: data.name,
      age: data.age,
      weight: data.weight,
      height: data.height,
      dominance: data.dominance,
      mainSport: data.mainSport,
      mainSportFrequency: data.mainSportFrequency,
      sessionDurationMinutes: data.sessionDurationMinutes,
      competitiveLevel: data.competitiveLevel,
      hasExtraActivity: data.hasExtraActivity,
      riskLevel: clinicalSummary.riskLevel,
      clinicalSummary: JSON.stringify(clinicalSummary),
      extraActivities: {
        create: (data.hasExtraActivity ? data.extraActivities : []).map((ea) => ({
          activityName: ea.activityName,
          weeklyFrequency: ea.weeklyFrequency,
        })),
      },
      injuries: {
        create: data.injuries.map((inj) => ({
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
            hopTestRight: data.functional.hopTestRightCm,
            hopTestLeft: data.functional.hopTestLeftCm,
            hopTestLSI: hopLSI,
            yBalanceRight: data.functional.yBalanceRightCm,
            yBalanceLeft: data.functional.yBalanceLeftCm,
            yBalanceDiff: yDiff,
            lungeTestRight: data.functional.lungeTestRightCm,
            lungeTestLeft: data.functional.lungeTestLeftCm,
            plankTimeSeconds: data.functional.plankTimeSeconds,
            notes: data.functional.functionalNotes,
          },
        ],
      },
      orthopedicTests: {
        create: data.orthopedic.tests.map((ot) => ({
          joint: ot.joint,
          testName: ot.name,
          result: ot.result,
          side: ot.side,
          painProvoked: ot.result === 'Positivo',
          notes: ot.painNotes || '',
        })),
      },
    },
    include: {
      extraActivities: true,
      injuries: true,
      functionalTests: {
        orderBy: { assessedAt: 'desc' },
      },
      orthopedicTests: true,
    },
  });

  revalidatePath('/');
  return mapPrismaAthleteToDomain(created);
}

/**
 * UPDATE: Atualiza dados cadastrais, atividades extras, lesões, testes funcionais e ortopédicos no SQLite
 */
export async function updateAthleteAction(
  id: string,
  data: Omit<Athlete, 'id' | 'createdAt' | 'clinicalSummary'>
): Promise<Athlete> {
  const hopLSI = calculateLSI(
    data.functional.hopTestRightCm,
    data.functional.hopTestLeftCm
  );
  const yDiff = calculateAsymmetryPercent(
    data.functional.yBalanceRightCm,
    data.functional.yBalanceLeftCm
  );

  const enrichedFunctional = computeFunctionalMetrics(data.functional);
  const clinicalSummary = evaluateClinicalSummary({
    ...data,
    functional: enrichedFunctional,
  });

  const updated = await prisma.$transaction(async (tx) => {
    await tx.extraActivity.deleteMany({ where: { athleteId: id } });
    await tx.injuryRecord.deleteMany({ where: { athleteId: id } });
    await tx.functionalAssessment.deleteMany({ where: { athleteId: id } });
    await tx.orthopedicTest.deleteMany({ where: { athleteId: id } });

    return tx.athlete.update({
      where: { id },
      data: {
        name: data.name,
        age: data.age,
        weight: data.weight,
        height: data.height,
        dominance: data.dominance,
        mainSport: data.mainSport,
        mainSportFrequency: data.mainSportFrequency,
        sessionDurationMinutes: data.sessionDurationMinutes,
        competitiveLevel: data.competitiveLevel,
        hasExtraActivity: data.hasExtraActivity,
        riskLevel: clinicalSummary.riskLevel,
        clinicalSummary: JSON.stringify(clinicalSummary),
        extraActivities: {
          create: (data.hasExtraActivity ? data.extraActivities : []).map((ea) => ({
            activityName: ea.activityName,
            weeklyFrequency: ea.weeklyFrequency,
          })),
        },
        injuries: {
          create: data.injuries.map((inj) => ({
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
              hopTestRight: data.functional.hopTestRightCm,
              hopTestLeft: data.functional.hopTestLeftCm,
              hopTestLSI: hopLSI,
              yBalanceRight: data.functional.yBalanceRightCm,
              yBalanceLeft: data.functional.yBalanceLeftCm,
              yBalanceDiff: yDiff,
              lungeTestRight: data.functional.lungeTestRightCm,
              lungeTestLeft: data.functional.lungeTestLeftCm,
              plankTimeSeconds: data.functional.plankTimeSeconds,
              notes: data.functional.functionalNotes,
            },
          ],
        },
        orthopedicTests: {
          create: data.orthopedic.tests.map((ot) => ({
            joint: ot.joint,
            testName: ot.name,
            result: ot.result,
            side: ot.side,
            painProvoked: ot.result === 'Positivo',
            notes: ot.painNotes || '',
          })),
        },
      },
      include: {
        extraActivities: true,
        injuries: true,
        functionalTests: {
          orderBy: { assessedAt: 'desc' },
        },
        orthopedicTests: true,
      },
    });
  });

  revalidatePath('/');
  revalidatePath(`/atleta/${id}`);
  return mapPrismaAthleteToDomain(updated);
}

/**
 * DELETE: Exclui o atleta do banco SQLite (onDelete: Cascade remove automaticamente registros filhos)
 */
export async function deleteAthleteAction(id: string): Promise<void> {
  await prisma.athlete.delete({
    where: { id },
  });
  revalidatePath('/');
}

/**
 * RESET DEMO: Limpa todas as tabelas SQLite e executa o seed com os 3 atletas padrão
 */
export async function resetDemoDataAction(): Promise<Athlete[]> {
  await seedDatabase(prisma);
  revalidatePath('/');
  return getAthletesAction();
}
