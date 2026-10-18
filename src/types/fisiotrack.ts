export type Dominance = 'Destro' | 'Canhoto' | 'Ambidestro';

export type CompetitiveLevel = 'Amador' | 'Semiprofissional' | 'Profissional';

export type BodyRegion =
  | 'Ombro'
  | 'Cotovelo/Punho'
  | 'Coluna'
  | 'Quadril'
  | 'Joelho'
  | 'Tornozelo/Pé'
  | 'Muscular/Outros';

export type BodySide = 'Direito' | 'Esquerdo' | 'Bilateral' | 'N/A';

export type RecoveryStatus =
  | 'Recuperado totalmente'
  | 'Desconforto ocasional'
  | 'Em reabilitação';

export interface ExtraActivity {
  activityName: string;
  weeklyFrequency: number;
}

export interface InjuryRecord {
  id: string;
  type: 'Lesão' | 'Cirurgia';
  bodyRegion: BodyRegion;
  side: BodySide;
  description: string;
  occurredAt: string; // mês/ano ex: "02/2026" ou "Fev/2026"
  recoveryStatus: RecoveryStatus;
  currentPainEVA: number; // 0 a 10
}

export interface FunctionalAssessment {
  // Y-Balance Test (Membros Inferiores)
  yBalanceRightCm: number;
  yBalanceLeftCm: number;
  yBalanceAsymmetryPercent: number;

  // Single Leg Hop Test (Salto Unipodal)
  hopTestRightCm: number;
  hopTestLeftCm: number;
  hopTestLSI: number; // Limb Symmetry Index (%) = (Menor / Maior) * 100

  // Lunge Test (Dorsiflexão de Tornozelo - Weight-Bearing Lunge Test)
  lungeTestRightCm: number;
  lungeTestLeftCm: number;
  lungeAsymmetryPercent: number;

  // Prancha Isométrica (Core)
  plankTimeSeconds: number;

  functionalNotes: string;
}

export type OrthopedicJoint = 'Joelho' | 'Tornozelo' | 'Ombro' | 'Quadril/Coluna';

export type OrthopedicTestResult = 'Negativo' | 'Positivo' | 'Não realizado';

export interface OrthopedicTestItem {
  id: string;
  joint: OrthopedicJoint;
  name: string;
  targetStructure: string;
  result: OrthopedicTestResult;
  side: BodySide;
  painNotes: string;
}

export interface OrthopedicAssessment {
  tests: OrthopedicTestItem[];
}

export type RiskLevel = 'Baixo' | 'Moderado' | 'Alto';

export interface ClinicalSummary {
  riskLevel: RiskLevel;
  readinessScore: number; // 0 - 100
  alerts: string[];
  recommendations: string[];
}

export interface Athlete {
  id: string;
  name: string;
  age: number;
  weight: number; // kg
  height: number; // cm
  dominance: Dominance;
  createdAt: string;

  // Prática Esportiva Principal
  mainSport: string;
  mainSportFrequency: number; // 1 a 7 vezes/semana
  sessionDurationMinutes: number;
  competitiveLevel: CompetitiveLevel;

  // Atividades Complementares
  hasExtraActivity: boolean;
  extraActivities: ExtraActivity[];

  // Histórico de Lesões e Cirurgias
  injuries: InjuryRecord[];

  // Avaliação Funcional
  functional: FunctionalAssessment;

  // Testes Ortopédicos Especiais
  orthopedic: OrthopedicAssessment;

  // Resumo Clínico Automático
  clinicalSummary: ClinicalSummary;
}
