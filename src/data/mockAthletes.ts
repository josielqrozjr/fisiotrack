import { Athlete } from '@/types/fisiotrack';
import {
  computeFunctionalMetrics,
  createDefaultOrthopedicTests,
  evaluateClinicalSummary,
} from '@/lib/clinicalEngine';

function buildAthlete(
  data: Omit<Athlete, 'clinicalSummary'>
): Athlete {
  return {
    ...data,
    clinicalSummary: evaluateClinicalSummary(data),
  };
}

export const INITIAL_ATHLETES: Athlete[] = [
  buildAthlete({
    id: 'lucas-mendes',
    name: 'Lucas Mendes',
    age: 22,
    weight: 76.5,
    height: 179,
    dominance: 'Destro',
    createdAt: '2026-10-14T10:30:00.000Z',
    mainSport: 'Futebol',
    mainSportFrequency: 5,
    sessionDurationMinutes: 90,
    competitiveLevel: 'Semiprofissional',
    hasExtraActivity: true,
    extraActivities: [
      {
        activityName: 'Musculação',
        weeklyFrequency: 2,
      },
    ],
    injuries: [
      {
        id: 'inj-lucas-1',
        type: 'Cirurgia',
        bodyRegion: 'Joelho',
        side: 'Direito',
        description: 'Reconstrução de LCA (enxerto de isquiotibiais) há 8 meses',
        occurredAt: '02/2026',
        recoveryStatus: 'Em reabilitação',
        currentPainEVA: 2,
      },
    ],
    functional: computeFunctionalMetrics({
      yBalanceRightCm: 91,
      yBalanceLeftCm: 98,
      hopTestRightCm: 158,
      hopTestLeftCm: 188, // 158 / 188 = 84.0% LSI
      lungeTestRightCm: 11.0,
      lungeTestLeftCm: 12.0,
      plankTimeSeconds: 95,
      functionalNotes:
        'Aterrissagem no Single Leg Hop direito apresenta leve valgo dinâmico e receio na fase de desaceleração excêntrica. LSI em 84% (abaixo da meta de 90% para alta esportiva).',
    }),
    orthopedic: {
      tests: createDefaultOrthopedicTests().map((test) => {
        if (test.id === 'ortho-gaveta-joelho') {
          return {
            ...test,
            result: 'Positivo',
            side: 'Direito',
            painNotes: 'Gaveta anterior leve (+/4+) com end-feel firme do neo-ligamento, indolor.',
          };
        }
        if (test.id === 'ortho-lachman') {
          return {
            ...test,
            result: 'Negativo',
            side: 'Direito',
            painNotes: 'End-feel firme presente, sem dor articular.',
          };
        }
        return test;
      }),
    },
  }),

  buildAthlete({
    id: 'mariana-costa',
    name: 'Mariana Costa',
    age: 28,
    weight: 59.0,
    height: 166,
    dominance: 'Destro',
    createdAt: '2026-10-16T14:15:00.000Z',
    mainSport: 'Corrida de Rua',
    mainSportFrequency: 4,
    sessionDurationMinutes: 65,
    competitiveLevel: 'Amador',
    hasExtraActivity: true,
    extraActivities: [
      {
        activityName: 'Pilates Clínico',
        weeklyFrequency: 2,
      },
    ],
    injuries: [
      {
        id: 'inj-mariana-1',
        type: 'Lesão',
        bodyRegion: 'Tornozelo/Pé',
        side: 'Esquerdo',
        description: 'Entorse de tornozelo em inversão Grau II (LTFA)',
        occurredAt: '05/2026',
        recoveryStatus: 'Desconforto ocasional',
        currentPainEVA: 2,
      },
    ],
    functional: computeFunctionalMetrics({
      yBalanceRightCm: 94,
      yBalanceLeftCm: 89,
      hopTestRightCm: 146,
      hopTestLeftCm: 141, // 96.6% LSI
      lungeTestRightCm: 13.5,
      lungeTestLeftCm: 9.0, // Restrição importante à esquerda (9.0 cm vs 13.5 cm)
      plankTimeSeconds: 110,
      functionalNotes:
        'Simetria excelente de propulsão no Hop Test (96.6%), porém apresenta restrição importante de dorsiflexão em cadeia cinética fechada no tornozelo esquerdo (Lunge Test: 9.0 cm vs 13.5 cm à direita) com sensação de bloqueio anterior talocrural.',
    }),
    orthopedic: {
      tests: createDefaultOrthopedicTests().map((test) => {
        if (test.id === 'ortho-gaveta-tornozelo') {
          return {
            ...test,
            result: 'Negativo',
            side: 'Esquerdo',
            painNotes: 'Estabilidade mecânica preservada, sem frouxidão residual.',
          };
        }
        return test;
      }),
    },
  }),

  buildAthlete({
    id: 'rafael-oliveira',
    name: 'Rafael Oliveira',
    age: 25,
    weight: 84.0,
    height: 181,
    dominance: 'Destro',
    createdAt: '2026-10-17T16:45:00.000Z',
    mainSport: 'Crossfit',
    mainSportFrequency: 6,
    sessionDurationMinutes: 75,
    competitiveLevel: 'Semiprofissional',
    hasExtraActivity: false,
    extraActivities: [],
    injuries: [
      {
        id: 'inj-rafael-1',
        type: 'Lesão',
        bodyRegion: 'Ombro',
        side: 'Direito',
        description: 'Tendinopatia reativa do supraespinal e síndrome do impacto subacromial',
        occurredAt: '09/2026',
        recoveryStatus: 'Em reabilitação',
        currentPainEVA: 5,
      },
    ],
    functional: computeFunctionalMetrics({
      yBalanceRightCm: 96,
      yBalanceLeftCm: 95,
      hopTestRightCm: 192,
      hopTestLeftCm: 189, // 98.4% LSI
      lungeTestRightCm: 12.5,
      lungeTestLeftCm: 12.0,
      plankTimeSeconds: 125,
      functionalNotes:
        'Membros inferiores simétricos e bom condicionamento de core, mas relata dor no arco doloroso (70°-120° de elevação) durante movimentos de Snatch, Kipping Pull-up e Handstand Push-up.',
    }),
    orthopedic: {
      tests: createDefaultOrthopedicTests().map((test) => {
        if (test.id === 'ortho-neer') {
          return {
            ...test,
            result: 'Positivo',
            side: 'Direito',
            painNotes: 'Dor subacromial anterolateral ao final da flexão passiva forçada (EVA 5/10).',
          };
        }
        if (test.id === 'ortho-jobe') {
          return {
            ...test,
            result: 'Positivo',
            side: 'Direito',
            painNotes: 'Dor reproduzida e perda leve de força isométrica contra resistência à direita.',
          };
        }
        if (test.id === 'ortho-hawkins') {
          return {
            ...test,
            result: 'Negativo',
            side: 'Direito',
            painNotes: 'Leve incômodo terminal sem reprodução da dor principal.',
          };
        }
        return test;
      }),
    },
  }),
];
