'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Dumbbell,
  Flame,
  HeartHandshake,
  Plus,
  Ruler,
  Scale,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Timer,
  Trash2,
  User,
} from 'lucide-react';
import { useFisioTrack } from '@/context/FisioTrackContext';
import {
  BodyRegion,
  BodySide,
  CompetitiveLevel,
  Dominance,
  ExtraActivity,
  InjuryRecord,
  OrthopedicJoint,
  OrthopedicTestItem,
  OrthopedicTestResult,
  RecoveryStatus,
} from '@/types/fisiotrack';
import {
  calculateAsymmetryPercent,
  calculateLSI,
  computeFunctionalMetrics,
  createDefaultOrthopedicTests,
  evaluateClinicalSummary,
} from '@/lib/clinicalEngine';
import { InteractiveBodyMap } from '@/components/assessment/InteractiveBodyMap';
import { cn } from '@/lib/utils';

const SPORTS_OPTIONS = [
  { name: 'Futebol', emoji: '⚽' },
  { name: 'Corrida de Rua', emoji: '🏃' },
  { name: 'Crossfit', emoji: '🏋️' },
  { name: 'Vôlei', emoji: '🏐' },
  { name: 'Basquete', emoji: '🏀' },
  { name: 'Natação', emoji: '🏊' },
  { name: 'Beach Tennis', emoji: '🎾' },
  { name: 'Ciclismo', emoji: '🚴' },
];

const QUICK_INJURY_PRESETS: Record<BodyRegion, string[]> = {
  Joelho: [
    'Reconstrução de LCA',
    'Tendinopatia Patelar (Jumper’s Knee)',
    'Lesão Meniscal Medial',
    'Síndrome da Dor Femoropatelar',
  ],
  'Tornozelo/Pé': [
    'Entorse de tornozelo grau II (LTFA)',
    'Tendinopatia do Calcâneo (Aquiles)',
    'Fasciíte Plantar',
    'Instabilidade Crônica de Tornozelo',
  ],
  Ombro: [
    'Impacto Subacromial / Tendinopatia Supraespinal',
    'Lesão SLAP / Instabilidade Glenoumeral',
    'Luxação Acromioclavicular',
  ],
  Quadril: [
    'Impacto Femoroacetabular (IFA)',
    'Pubalgia Atlética',
    'Tendinopatia Glútea',
  ],
  Coluna: [
    'Lombalgia Mecânica Esportiva',
    'Protusão Discal Lombar L4-L5',
    'Espondilólise Lombar',
  ],
  'Cotovelo/Punho': [
    'Epicondilite Lateral (Tennis Elbow)',
    'Epicondilite Medial',
    'Lesão da Fibrocartilagem Triangular',
  ],
  'Muscular/Outros': [
    'Estiramento de Isquiotibiais (Grau II)',
    'Lesão Muscular de Reto Femoral',
    'Estiramento de Gastrocnêmio Medial',
  ],
};

const STEPS = [
  {
    number: 1,
    title: 'Identificação & Esporte',
    subtitle: 'Perfil antropométrico e carga semanal',
    icon: User,
  },
  {
    number: 2,
    title: 'Histórico & Mapa Corporal',
    subtitle: 'Lesões prévias, cirurgias e EVA',
    icon: HeartHandshake,
  },
  {
    number: 3,
    title: 'Testes Funcionais',
    subtitle: 'Hop Test, Y-Balance, Lunge e LSI%',
    icon: Activity,
  },
  {
    number: 4,
    title: 'Testes Ortopédicos',
    subtitle: 'Exame especial articular e conclusão',
    icon: Stethoscope,
  },
];

export default function NovaAvaliacaoPage() {
  const router = useRouter();
  const { addAthlete } = useFisioTrack();

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 State: Athlete Identification & Sport Routine
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(23);
  const [weight, setWeight] = useState<number>(72);
  const [height, setHeight] = useState<number>(176);
  const [dominance, setDominance] = useState<Dominance>('Destro');
  const [mainSport, setMainSport] = useState('Futebol');
  const [mainSportFrequency, setMainSportFrequency] = useState<number>(4);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState<number>(90);
  const [competitiveLevel, setCompetitiveLevel] =
    useState<CompetitiveLevel>('Semiprofissional');
  const [hasExtraActivity, setHasExtraActivity] = useState<boolean>(true);
  const [extraActivities, setExtraActivities] = useState<ExtraActivity[]>([
    { activityName: 'Musculação', weeklyFrequency: 3 },
  ]);
  const [newExtraName, setNewExtraName] = useState('');
  const [newExtraFreq, setNewExtraFreq] = useState<number>(2);

  // Step 2 State: Injuries & Body Map
  const [injuries, setInjuries] = useState<InjuryRecord[]>([]);
  const [draftType, setDraftType] = useState<'Lesão' | 'Cirurgia'>('Lesão');
  const [draftRegion, setDraftRegion] = useState<BodyRegion>('Joelho');
  const [draftSide, setDraftSide] = useState<BodySide>('Direito');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftOccurredAt, setDraftOccurredAt] = useState('04/2026');
  const [draftRecovery, setDraftRecovery] =
    useState<RecoveryStatus>('Desconforto ocasional');
  const [draftPainEVA, setDraftPainEVA] = useState<number>(3);

  // Step 3 State: Functional Assessment
  const [hopTestRightCm, setHopTestRightCm] = useState<number>(162);
  const [hopTestLeftCm, setHopTestLeftCm] = useState<number>(182);
  const [yBalanceRightCm, setYBalanceRightCm] = useState<number>(92);
  const [yBalanceLeftCm, setYBalanceLeftCm] = useState<number>(97);
  const [lungeTestRightCm, setLungeTestRightCm] = useState<number>(10.5);
  const [lungeTestLeftCm, setLungeTestLeftCm] = useState<number>(12.5);
  const [plankTimeSeconds, setPlankTimeSeconds] = useState<number>(90);
  const [functionalNotes, setFunctionalNotes] = useState('');

  // Step 4 State: Orthopedic Assessment
  const [orthopedicTests, setOrthopedicTests] = useState<OrthopedicTestItem[]>(() =>
    createDefaultOrthopedicTests()
  );
  const [activeJointTab, setActiveJointTab] = useState<OrthopedicJoint>('Joelho');

  // Real-time computed functional metrics
  const hopLSI = useMemo(
    () => calculateLSI(hopTestRightCm, hopTestLeftCm),
    [hopTestRightCm, hopTestLeftCm]
  );
  const yBalanceAsymmetry = useMemo(
    () => calculateAsymmetryPercent(yBalanceRightCm, yBalanceLeftCm),
    [yBalanceRightCm, yBalanceLeftCm]
  );
  const lungeAsymmetry = useMemo(
    () => calculateAsymmetryPercent(lungeTestRightCm, lungeTestLeftCm),
    [lungeTestRightCm, lungeTestLeftCm]
  );

  // Live Clinical Summary Preview
  const livePreviewAthlete = useMemo(() => {
    const functional = computeFunctionalMetrics({
      yBalanceRightCm,
      yBalanceLeftCm,
      hopTestRightCm,
      hopTestLeftCm,
      lungeTestRightCm,
      lungeTestLeftCm,
      plankTimeSeconds,
      functionalNotes,
    });

    const baseData = {
      name: name.trim() || 'Novo Atleta',
      age,
      weight,
      height,
      dominance,
      mainSport,
      mainSportFrequency,
      sessionDurationMinutes,
      competitiveLevel,
      hasExtraActivity,
      extraActivities: hasExtraActivity ? extraActivities : [],
      injuries,
      functional,
      orthopedic: { tests: orthopedicTests },
    };

    return {
      ...baseData,
      clinicalSummary: evaluateClinicalSummary(baseData),
    };
  }, [
    name,
    age,
    weight,
    height,
    dominance,
    mainSport,
    mainSportFrequency,
    sessionDurationMinutes,
    competitiveLevel,
    hasExtraActivity,
    extraActivities,
    injuries,
    yBalanceRightCm,
    yBalanceLeftCm,
    hopTestRightCm,
    hopTestLeftCm,
    lungeTestRightCm,
    lungeTestLeftCm,
    plankTimeSeconds,
    functionalNotes,
    orthopedicTests,
  ]);

  // Handlers for Step 1 Extra Activities
  const handleAddExtraActivity = () => {
    if (!newExtraName.trim()) return;
    setExtraActivities((prev) => [
      ...prev,
      { activityName: newExtraName.trim(), weeklyFrequency: newExtraFreq },
    ]);
    setNewExtraName('');
    setNewExtraFreq(2);
  };

  const handleRemoveExtraActivity = (idx: number) => {
    setExtraActivities((prev) => prev.filter((_, i) => i !== idx));
  };

  // Handlers for Step 2 Injury Records
  const handleAddInjury = () => {
    const desc =
      draftDescription.trim() || `${draftType} em ${draftRegion} (${draftSide})`;
    const newInj: InjuryRecord = {
      id: `inj-${Date.now()}`,
      type: draftType,
      bodyRegion: draftRegion,
      side: draftSide,
      description: desc,
      occurredAt: draftOccurredAt || 'Recente',
      recoveryStatus: draftRecovery,
      currentPainEVA: draftPainEVA,
    };
    setInjuries((prev) => [newInj, ...prev]);
    setDraftDescription('');
  };

  const handleRemoveInjury = (id: string) => {
    setInjuries((prev) => prev.filter((i) => i.id !== id));
  };

  // Handlers for Step 4 Orthopedic Tests
  const updateOrthoTest = (
    id: string,
    updates: Partial<Pick<OrthopedicTestItem, 'result' | 'side' | 'painNotes'>>
  ) => {
    setOrthopedicTests((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  // Quick Demo Fill Preset for Live Presentation
  const handleFillDemoPreset = (presetType: 'apto' | 'risco') => {
    if (presetType === 'apto') {
      setName('Beatriz Vasconcelos');
      setAge(21);
      setWeight(64);
      setHeight(174);
      setDominance('Destro');
      setMainSport('Vôlei');
      setMainSportFrequency(5);
      setSessionDurationMinutes(90);
      setCompetitiveLevel('Profissional');
      setHasExtraActivity(true);
      setExtraActivities([
        { activityName: 'Preparação Física / Força', weeklyFrequency: 3 },
        { activityName: 'Mobilidade & Core', weeklyFrequency: 2 },
      ]);
      setInjuries([
        {
          id: 'inj-demo-1',
          type: 'Lesão',
          bodyRegion: 'Tornozelo/Pé',
          side: 'Direito',
          description: 'Entorse leve de tornozelo (Grau I) totalmente reabilitada',
          occurredAt: '11/2025',
          recoveryStatus: 'Recuperado totalmente',
          currentPainEVA: 0,
        },
      ]);
      setHopTestRightCm(178);
      setHopTestLeftCm(175);
      setYBalanceRightCm(98);
      setYBalanceLeftCm(97);
      setLungeTestRightCm(13.0);
      setLungeTestLeftCm(12.5);
      setPlankTimeSeconds(135);
      setFunctionalNotes(
        'Excelente alinhamento biomecânico na aterrissagem unipodal, LSI de 98.3% e estabilidade lombopélvica acima da média.'
      );
      setOrthopedicTests(createDefaultOrthopedicTests());
    } else {
      setName('Gabriel Henrique Silva');
      setAge(24);
      setWeight(78);
      setHeight(180);
      setDominance('Canhoto');
      setMainSport('Basquete');
      setMainSportFrequency(6);
      setSessionDurationMinutes(100);
      setCompetitiveLevel('Semiprofissional');
      setHasExtraActivity(false);
      setExtraActivities([]);
      setInjuries([
        {
          id: 'inj-demo-2',
          type: 'Lesão',
          bodyRegion: 'Joelho',
          side: 'Esquerdo',
          description: 'Tendinopatia patelar reativa e entorse rotacional recente',
          occurredAt: '08/2026',
          recoveryStatus: 'Em reabilitação',
          currentPainEVA: 6,
        },
      ]);
      setHopTestRightCm(195);
      setHopTestLeftCm(160); // 82.1% LSI
      setYBalanceRightCm(99);
      setYBalanceLeftCm(90);
      setLungeTestRightCm(12.5);
      setLungeTestLeftCm(9.5);
      setPlankTimeSeconds(55);
      setFunctionalNotes(
        'Valgo dinâmico acentuado à esquerda na desaceleração do salto unipodal com reprodução de dor anterior no joelho.'
      );
      setOrthopedicTests(
        createDefaultOrthopedicTests().map((t) =>
          t.id === 'ortho-mcmurray'
            ? {
                ...t,
                result: 'Positivo',
                side: 'Esquerdo',
                painNotes: 'Dor na interlinha articular medial à rotação externa.',
              }
            : t
        )
      );
    }
  };

  // Final Submit
  const handleFinishAssessment = () => {
    const created = addAthlete({
      name: name.trim() || 'Atleta Avaliado',
      age,
      weight,
      height,
      dominance,
      mainSport,
      mainSportFrequency,
      sessionDurationMinutes,
      competitiveLevel,
      hasExtraActivity,
      extraActivities: hasExtraActivity ? extraActivities : [],
      injuries,
      functional: livePreviewAthlete.functional,
      orthopedic: { tests: orthopedicTests },
    });

    router.push(`/atleta/${created.id}`);
  };

  const getEvaColor = (eva: number) => {
    if (eva <= 2) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (eva <= 5) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Bar & Quick Presets for Live Demo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">
            Protocolo de Avaliação Pré-Participação (APP)
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Nova Avaliação Fisioterapêutica Esportiva
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleFillDemoPreset('apto')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
            title="Preenche automaticamente um caso de atleta com alta esportiva (Baixo Risco)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Demo: Atleta Apto (LSI 98%)</span>
          </button>
          <button
            type="button"
            onClick={() => handleFillDemoPreset('risco')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
            title="Preenche automaticamente um caso de atleta com assimetria e risco aumentado"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Demo: Atleta em Risco (LSI 82%)</span>
          </button>
        </div>
      </div>

      {/* Stepper Navigation Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STEPS.map((step) => {
          const StepIcon = step.icon;
          const isCurrent = currentStep === step.number;
          const isCompleted = currentStep > step.number;

          return (
            <button
              key={step.number}
              type="button"
              onClick={() => setCurrentStep(step.number)}
              className={cn(
                'text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5',
                isCurrent
                  ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10'
                  : isCompleted
                  ? 'bg-teal-50/70 border-teal-200 text-slate-900 hover:bg-teal-50'
                  : 'bg-white border-slate-200/80 text-slate-500 hover:bg-slate-50'
              )}
            >
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm transition-colors',
                  isCurrent
                    ? 'bg-teal-500 text-slate-950'
                    : isCompleted
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p
                  className={cn(
                    'text-[11px] font-semibold uppercase tracking-wider',
                    isCurrent
                      ? 'text-teal-400'
                      : isCompleted
                      ? 'text-teal-700'
                      : 'text-slate-400'
                  )}
                >
                  Passo {step.number} de 4
                </p>
                <p
                  className={cn(
                    'font-bold text-sm truncate',
                    isCurrent ? 'text-white' : 'text-slate-800'
                  )}
                >
                  {step.title}
                </p>
                <p
                  className={cn(
                    'text-xs truncate hidden sm:block',
                    isCurrent ? 'text-slate-300' : 'text-slate-500'
                  )}
                >
                  {step.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Step Content Area */}
      <AnimatePresence mode="wait">
        {/* PASSO 1: IDENTIFICAÇÃO E ROTINA ESPORTIVA */}
        {currentStep === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.22 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Dados Pessoais e Antropometria */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  1. Identificação & Perfil Antropométrico
                </h2>
                <p className="text-xs text-slate-500">
                  Dados cadastrais básicos, dominância motora e modalidade esportiva principal
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Nome Completo do Atleta *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Gabriel Medina, Beatriz Souza..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Idade (anos)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={80}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Dominância de Membro
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Destro', 'Canhoto', 'Ambidestro'] as Dominance[]).map((dom) => (
                      <button
                        key={dom}
                        type="button"
                        onClick={() => setDominance(dom)}
                        className={cn(
                          'py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all',
                          dominance === dom
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        )}
                      >
                        {dom}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Massa Corporal (kg)
                  </label>
                  <div className="relative">
                    <Scale className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.5"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-sm font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Estatura (cm)
                  </label>
                  <div className="relative">
                    <Ruler className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Seleção Visual do Esporte Principal */}
              <div className="pt-2 space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Esporte / Modalidade Principal
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {SPORTS_OPTIONS.map((sport) => {
                    const selected = mainSport === sport.name;
                    return (
                      <button
                        key={sport.name}
                        type="button"
                        onClick={() => setMainSport(sport.name)}
                        className={cn(
                          'p-3 rounded-xl border text-left transition-all flex items-center gap-2.5',
                          selected
                            ? 'bg-teal-50/90 border-teal-500 text-teal-950 ring-2 ring-teal-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        <span className="text-xl">{sport.emoji}</span>
                        <span className="text-xs font-bold truncate">{sport.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Frequência Semanal, Duração e Nível Competitivo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="sm:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Frequência Semanal no Esporte
                    </label>
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-600 text-white text-xs font-bold">
                      {mainSportFrequency}x por semana
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={7}
                    value={mainSportFrequency}
                    onChange={(e) => setMainSportFrequency(Number(e.target.value))}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                    <span>1x/sem</span>
                    <span>3x/sem</span>
                    <span>5x/sem</span>
                    <span>7x/sem (Diário)</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Duração da Sessão (min)
                  </label>
                  <input
                    type="number"
                    step={15}
                    min={20}
                    max={240}
                    value={sessionDurationMinutes}
                    onChange={(e) => setSessionDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800"
                  />
                  <p className="text-[11px] text-slate-500">
                    Volume: ~{((mainSportFrequency * sessionDurationMinutes) / 60).toFixed(1)}h/sem
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Nível Competitivo
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Amador', 'Semiprofissional', 'Profissional'] as CompetitiveLevel[]).map(
                    (lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setCompetitiveLevel(lvl)}
                        className={cn(
                          'py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all',
                          competitiveLevel === lvl
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        )}
                      >
                        {lvl}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Coluna Direita Passo 1: Atividades Complementares */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-600">
                    Prevenção & Preparação Física
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Atividades Complementares
                  </h3>
                  <p className="text-xs text-slate-500">
                    O atleta realiza treino de força ou controle motor além do esporte principal?
                  </p>
                </div>

                {/* Toggle Switch */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Pratica outra atividade?
                    </p>
                    <p className="text-xs text-slate-500">
                      Ex: Musculação, Pilates, Funcional
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasExtraActivity(!hasExtraActivity)}
                    className={cn(
                      'relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                      hasExtraActivity ? 'bg-teal-600' : 'bg-slate-300'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                        hasExtraActivity ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>

                {hasExtraActivity ? (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/70 space-y-3">
                      <p className="text-xs font-semibold text-teal-900">
                        Adicionar Atividade Complementar
                      </p>
                      <input
                        type="text"
                        value={newExtraName}
                        onChange={(e) => setNewExtraName(e.target.value)}
                        placeholder="Ex: Musculação, Pilates, Mobilidade..."
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium outline-none focus:border-teal-500"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-slate-700">
                          <span>Frequência:</span>
                          <select
                            value={newExtraFreq}
                            onChange={(e) => setNewExtraFreq(Number(e.target.value))}
                            className="px-2 py-1 rounded-lg bg-white border border-slate-200 font-semibold"
                          >
                            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                              <option key={n} value={n}>
                                {n}x/sem
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddExtraActivity}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar</span>
                        </button>
                      </div>
                    </div>

                    {/* Lista de atividades extras adicionadas */}
                    <div className="space-y-2">
                      {extraActivities.map((act, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Dumbbell className="w-4 h-4 text-teal-600" />
                            <span className="font-bold text-slate-800">{act.activityName}</span>
                            <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-semibold">
                              {act.weeklyFrequency}x/semana
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveExtraActivity(index)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Atenção à Carga Isolada</span>
                    </p>
                    <p>
                      Atletas com alta frequência semanal ({mainSportFrequency}x/sem) sem trabalho
                      complementar de força apresentam maior risco de sobrecarga tendínea e articular.
                    </p>
                  </div>
                )}
              </div>

              {/* IMC & Resumo de Carga */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">IMC Estimado:</span>
                  <span className="font-bold text-teal-400">
                    {height > 0 ? (weight / Math.pow(height / 100, 2)).toFixed(1) : '--'} kg/m²
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total de Sessões Semanais:</span>
                  <span className="font-bold text-white">
                    {mainSportFrequency +
                      (hasExtraActivity
                        ? extraActivities.reduce((a, b) => a + b.weeklyFrequency, 0)
                        : 0)}{' '}
                    sessões/sem
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* PASSO 2: HISTÓRICO DE LESÕES E MAPA CORPORAL INTERATIVO */}
        {currentStep === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.22 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Interactive Body Map SVG (5 columns) */}
            <div className="lg:col-span-5">
              <InteractiveBodyMap
                selectedRegion={draftRegion}
                selectedSide={draftSide}
                existingInjuries={injuries}
                onSelectRegionAndSide={(region, side) => {
                  setDraftRegion(region);
                  if (side) setDraftSide(side);
                }}
              />
            </div>

            {/* Injury Form & Registered List (7 columns) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      2. Registrar Lesão Prévia, Queixa ou Cirurgia
                    </h2>
                    <p className="text-xs text-slate-500">
                      Clique no Mapa Anatômico ao lado ou selecione abaixo para adicionar ao prontuário
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold">
                    {draftRegion} ({draftSide})
                  </span>
                </div>

                {/* Tipo + Lado + Data */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      Natureza do Evento
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['Lesão', 'Cirurgia'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setDraftType(t)}
                          className={cn(
                            'py-2 rounded-xl text-xs font-bold border transition-all',
                            draftType === t
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      Lado Acometido
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['Direito', 'Esquerdo', 'Bilateral', 'N/A'] as BodySide[]).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setDraftSide(s)}
                          className={cn(
                            'py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all',
                            draftSide === s
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      Época (Mês/Ano)
                    </label>
                    <input
                      type="text"
                      value={draftOccurredAt}
                      onChange={(e) => setDraftOccurredAt(e.target.value)}
                      placeholder="Ex: 02/2026 ou Há 6 meses"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Descrição + Sugestões Rápidas da Região Selecionada */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Diagnóstico Clínico / Descrição da Lesão ({draftRegion})
                  </label>
                  <input
                    type="text"
                    value={draftDescription}
                    onChange={(e) => setDraftDescription(e.target.value)}
                    placeholder={`Ex: ${QUICK_INJURY_PRESETS[draftRegion][0]}...`}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-teal-500"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-400 font-medium mr-1">
                      Sugestões rápidas:
                    </span>
                    {QUICK_INJURY_PRESETS[draftRegion].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDraftDescription(preset)}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 font-medium transition-colors"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status de Recuperação */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Status Funcional Atual
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {(
                      [
                        'Recuperado totalmente',
                        'Desconforto ocasional',
                        'Em reabilitação',
                      ] as RecoveryStatus[]
                    ).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setDraftRecovery(st)}
                        className={cn(
                          'py-2 px-3 rounded-xl text-xs font-semibold border transition-all',
                          draftRecovery === st
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        )}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Escala Visual Analógica de Dor (EVA 0 - 10) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Escala Visual Analógica de Dor Atual (EVA 0 a 10)
                    </label>
                    <span
                      className={cn(
                        'px-3 py-0.5 rounded-full text-xs font-bold border',
                        getEvaColor(draftPainEVA)
                      )}
                    >
                      EVA: {draftPainEVA} / 10 —{' '}
                      {draftPainEVA === 0
                        ? 'Sem Dor'
                        : draftPainEVA <= 3
                        ? 'Dor Leve'
                        : draftPainEVA <= 6
                        ? 'Dor Moderada'
                        : 'Dor Intensa'}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={draftPainEVA}
                    onChange={(e) => setDraftPainEVA(Number(e.target.value))}
                    className="w-full cursor-pointer accent-teal-600"
                  />

                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-emerald-600">0 (Ausência de dor)</span>
                    <span className="text-amber-600">5 (Moderada)</span>
                    <span className="text-rose-600">10 (Máxima suportável)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddInjury}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar ao Histórico Clínico do Atleta</span>
                </button>
              </div>

              {/* Lista de Lesões Adicionadas */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Histórico Registrado ({injuries.length})
                  </h3>
                  {injuries.length === 0 && (
                    <span className="text-xs text-emerald-600 font-medium">
                      Nenhuma lesão registrada (Atleta assintomático)
                    </span>
                  )}
                </div>

                {injuries.length > 0 && (
                  <div className="space-y-2.5">
                    {injuries.map((inj) => (
                      <div
                        key={inj.id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded font-bold text-[10px] uppercase',
                                inj.type === 'Cirurgia'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-teal-100 text-teal-800'
                              )}
                            >
                              {inj.type}
                            </span>
                            <span className="font-bold text-slate-900">
                              {inj.bodyRegion} ({inj.side})
                            </span>
                            <span className="text-slate-400">• {inj.occurredAt}</span>
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full font-bold border',
                                getEvaColor(inj.currentPainEVA)
                              )}
                            >
                              EVA {inj.currentPainEVA}/10
                            </span>
                          </div>
                          <p className="text-slate-700 font-medium">{inj.description}</p>
                          <p className="text-[11px] text-slate-500">Status: {inj.recoveryStatus}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveInjury(inj.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Remover registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* PASSO 3: TESTES FUNCIONAIS COM CÁLCULOS EM TEMPO REAL */}
        {currentStep === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.22 }}
            className="space-y-6"
          >
            {/* Real-Time LSI Banner */}
            <div
              className={cn(
                'rounded-2xl p-5 border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all',
                hopLSI >= 90
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50/90 border-rose-300 text-rose-950'
              )}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-bold',
                    hopLSI >= 90
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white animate-pulse'
                  )}
                >
                  {hopLSI >= 90 ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <AlertOctagon className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Índice de Simetria entre Membros (LSI) em Tempo Real
                    </span>
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-xs font-bold',
                        hopLSI >= 90
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600 text-white'
                      )}
                    >
                      {hopLSI >= 90
                        ? 'Simetria Adequada — Alta Esportiva (≥ 90%)'
                        : 'Déficit Funcional Detectado — Risco Aumentado (< 90%)'}
                    </span>
                  </div>
                  <p className="text-xs mt-1 opacity-85">
                    Fórmula clínica: <strong>(Menor Alcance / Maior Alcance) × 100</strong>. Meta de
                    segurança na literatura para Return-to-Sport: LSI ≥ 90%.
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-3xl font-black">{hopLSI}%</div>
                <span className="text-[11px] font-semibold uppercase tracking-wider opacity-75">
                  Single Leg Hop LSI
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 1. Single Leg Hop Test */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-600">
                      Potência & Aterrissagem Unipodal
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      Single Leg Hop Test (Salto Unipodal)
                    </h3>
                  </div>
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-bold border',
                      hopLSI >= 90
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    )}
                  >
                    LSI: {hopLSI}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Membro Direito (cm)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={300}
                      value={hopTestRightCm}
                      onChange={(e) => setHopTestRightCm(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-lg font-bold text-slate-900 outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Membro Esquerdo (cm)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={300}
                      value={hopTestLeftCm}
                      onChange={(e) => setHopTestLeftCm(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-lg font-bold text-slate-900 outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Visual Progress Bar with 90% Cutoff Marker */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span>Simetria Atual: {hopLSI}%</span>
                    <span className="text-teal-700 font-semibold">Corte de Segurança: 90%</span>
                  </div>
                  <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={cn(
                        'h-full transition-all duration-300 rounded-full',
                        hopLSI >= 90 ? 'bg-emerald-500' : 'bg-rose-500'
                      )}
                      style={{ width: `${Math.min(100, hopLSI)}%` }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-900"
                      style={{ left: '90%' }}
                      title="Corte clínico de 90%"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Y-Balance Test */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-600">
                      Estabilidade Dinâmica & Controle Neuromuscular
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      Y-Balance Test (Membros Inferiores)
                    </h3>
                  </div>
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-bold border',
                      Math.abs(yBalanceRightCm - yBalanceLeftCm) < 4
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    )}
                  >
                    Assimetria: {yBalanceAsymmetry}% (
                    {Math.abs(yBalanceRightCm - yBalanceLeftCm).toFixed(1)} cm)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Alcance Direito (cm)
                    </label>
                    <input
                      type="number"
                      min={20}
                      max={150}
                      value={yBalanceRightCm}
                      onChange={(e) => setYBalanceRightCm(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-lg font-bold text-slate-900 outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Alcance Esquerdo (cm)
                    </label>
                    <input
                      type="number"
                      min={20}
                      max={150}
                      value={yBalanceLeftCm}
                      onChange={(e) => setYBalanceLeftCm(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-lg font-bold text-slate-900 outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  Diferença &ge; 4 cm entre membros no alcance anterior indica maior risco de lesão
                  sem contato em membros inferiores.
                </p>
              </div>

              {/* 3. Weight-Bearing Lunge Test (Tornozelo) */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-600">
                      Mobilidade Talocrural em Cadeia Fechada
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      Lunge Test (Dorsiflexão de Tornozelo)
                    </h3>
                  </div>
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-bold border',
                      Math.abs(lungeTestRightCm - lungeTestLeftCm) < 1.5
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    )}
                  >
                    Δ {Math.abs(lungeTestRightCm - lungeTestLeftCm).toFixed(1)} cm (
                    {lungeAsymmetry}%)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Tornozelo Direito (cm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      max={25}
                      value={lungeTestRightCm}
                      onChange={(e) => setLungeTestRightCm(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-lg font-bold text-slate-900 outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Tornozelo Esquerdo (cm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      max={25}
                      value={lungeTestLeftCm}
                      onChange={(e) => setLungeTestLeftCm(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-lg font-bold text-slate-900 outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  Distância hálux-parede (referência normal: 10 a 14 cm). Assimetria &ge; 1,5 cm
                  sugere restrição de dorsiflexão pós-entorse e sobrecarga patelofemoral.
                </p>
              </div>

              {/* 4. Prancha Isométrica & Observações Funcionais */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-600">
                      Resistência Estabilizadora Lombopélvica
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      Prancha Ventral Isométrica (Core) & Notas
                    </h3>
                  </div>
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1',
                      plankTimeSeconds >= 60
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    )}
                  >
                    <Timer className="w-3.5 h-3.5" />
                    <span>{plankTimeSeconds}s</span>
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Tempo de Sustentação com Alinhamento Neutro (segundos)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={600}
                    value={plankTimeSeconds}
                    onChange={(e) => setPlankTimeSeconds(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-base font-bold text-slate-900 outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Observações Qualitativas do Movimento (Valgo Dinâmico, Controle de Tronco)
                  </label>
                  <textarea
                    rows={2}
                    value={functionalNotes}
                    onChange={(e) => setFunctionalNotes(e.target.value)}
                    placeholder="Descreva compensações observadas durante aterrissagem, agachamento unipodal ou corrida..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* PASSO 4: TESTES ORTOPÉDICOS ESPECIAIS */}
        {currentStep === 4 && (
          <motion.div
            key="step-4"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.22 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left 8 Cols: Orthopedic Tests by Joint */}
            <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    4. Testes Ortopédicos Especiais por Articulação
                  </h2>
                  <p className="text-xs text-slate-500">
                    Marcação rápida de beira de campo/clínica: Negativo, Positivo ou Não Realizado
                  </p>
                </div>
              </div>

              {/* Joint Tabs */}
              <div className="flex flex-wrap gap-2">
                {(['Joelho', 'Tornozelo', 'Ombro', 'Quadril/Coluna'] as OrthopedicJoint[]).map(
                  (joint) => {
                    const jointTests = orthopedicTests.filter((t) => t.joint === joint);
                    const posCount = jointTests.filter((t) => t.result === 'Positivo').length;
                    const active = activeJointTab === joint;

                    return (
                      <button
                        key={joint}
                        type="button"
                        onClick={() => setActiveJointTab(joint)}
                        className={cn(
                          'px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border',
                          active
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        )}
                      >
                        <span>{joint}</span>
                        {posCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px]">
                            {posCount} (+)
                          </span>
                        )}
                      </button>
                    );
                  }
                )}
              </div>

              {/* Tests List for Active Joint */}
              <div className="space-y-3.5">
                {orthopedicTests
                  .filter((t) => t.joint === activeJointTab)
                  .map((test) => {
                    const isPositive = test.result === 'Positivo';
                    const isNegative = test.result === 'Negativo';
                    const isNA = test.result === 'Não realizado';

                    return (
                      <div
                        key={test.id}
                        className={cn(
                          'p-4 rounded-2xl border transition-all space-y-3',
                          isPositive
                            ? 'bg-rose-50/50 border-rose-300'
                            : isNegative
                            ? 'bg-emerald-50/20 border-slate-200'
                            : 'bg-slate-50 border-slate-200 opacity-75'
                        )}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">{test.name}</h4>
                            <p className="text-xs text-slate-500">
                              Estrutura alvo: {test.targetStructure}
                            </p>
                          </div>

                          {/* 1-Click Result Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => updateOrthoTest(test.id, { result: 'Negativo' })}
                              className={cn(
                                'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                                isNegative
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50'
                              )}
                            >
                              Negativo (-)
                            </button>

                            <button
                              type="button"
                              onClick={() => updateOrthoTest(test.id, { result: 'Positivo' })}
                              className={cn(
                                'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                                isPositive
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50'
                              )}
                            >
                              Positivo (+)
                            </button>

                            <button
                              type="button"
                              onClick={() => updateOrthoTest(test.id, { result: 'Não realizado' })}
                              className={cn(
                                'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                                isNA
                                  ? 'bg-slate-700 text-white border-slate-700'
                                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                              )}
                            >
                              N/A
                            </button>
                          </div>
                        </div>

                        {/* Side & Clinical Notes */}
                        {test.result !== 'Não realizado' && (
                          <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shrink-0">
                              <span className="text-[11px] font-semibold text-slate-400 mr-1">
                                Lado:
                              </span>
                              {(['Direito', 'Esquerdo', 'Bilateral'] as BodySide[]).map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => updateOrthoTest(test.id, { side: s })}
                                  className={cn(
                                    'px-2 py-0.5 rounded text-[11px] font-bold transition-colors',
                                    test.side === s
                                      ? 'bg-teal-600 text-white'
                                      : 'text-slate-600 hover:bg-slate-100'
                                  )}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>

                            <input
                              type="text"
                              value={test.painNotes}
                              onChange={(e) =>
                                updateOrthoTest(test.id, { painNotes: e.target.value })
                              }
                              placeholder="Observação clínica (ex: dor subacromial, frouxidão leve, end-feel firme)..."
                              className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 outline-none focus:border-teal-500"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Right 4 Cols: Live Automatic Clinical Summary Preview */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-lg space-y-5 sticky top-24">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-400">
                      Síntese Clínica em Tempo Real
                    </span>
                    <h3 className="text-base font-bold text-white">
                      Prévia do Laudo de Prontidão
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-teal-400">
                      {livePreviewAthlete.clinicalSummary.readinessScore}
                    </span>
                    <span className="text-xs text-slate-400">/100</span>
                  </div>
                </div>

                {/* Semáforo de Risco */}
                <div
                  className={cn(
                    'p-4 rounded-xl border flex items-center gap-3',
                    livePreviewAthlete.clinicalSummary.riskLevel === 'Alto'
                      ? 'bg-rose-950/60 border-rose-700/80 text-rose-200'
                      : livePreviewAthlete.clinicalSummary.riskLevel === 'Moderado'
                      ? 'bg-amber-950/60 border-amber-700/80 text-amber-200'
                      : 'bg-emerald-950/60 border-emerald-700/80 text-emerald-200'
                  )}
                >
                  <ShieldAlert className="w-6 h-6 shrink-0" />
                  <div>
                    <p className="text-xs uppercase font-bold tracking-wider opacity-80">
                      Classificação de Risco
                    </p>
                    <p className="text-sm font-bold">
                      Risco {livePreviewAthlete.clinicalSummary.riskLevel} (
                      {livePreviewAthlete.clinicalSummary.riskLevel === 'Baixo'
                        ? 'Apto ao Esporte'
                        : livePreviewAthlete.clinicalSummary.riskLevel === 'Moderado'
                        ? 'Retorno Monitorado'
                        : 'Restrição / Reabilitação'}
                      )
                    </p>
                  </div>
                </div>

                {/* Alertas Detectados */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Achados Clínicos ({livePreviewAthlete.clinicalSummary.alerts.length})
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {livePreviewAthlete.clinicalSummary.alerts.map((alert, i) => (
                      <li
                        key={i}
                        className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700/80 leading-relaxed"
                      >
                        • {alert}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={handleFinishAssessment}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Gerar Prontuário & Laudo Completo</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Wizard Navigation Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() =>
            currentStep > 1 ? setCurrentStep(currentStep - 1) : router.push('/')
          }
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-sm font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentStep > 1 ? 'Passo Anterior' : 'Voltar ao Dashboard'}</span>
        </button>

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={() => setCurrentStep(currentStep + 1)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-sm transition-all"
          >
            <span>Próxima Etapa ({STEPS[currentStep].title})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinishAssessment}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-sm font-bold shadow-md shadow-teal-600/20 transition-all"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Finalizar e Abrir Laudo do Atleta</span>
          </button>
        )}
      </div>
    </div>
  );
}
