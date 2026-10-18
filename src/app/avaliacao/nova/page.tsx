'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { useFisioTrack } from '@/context/FisioTrackContext';
import { getAthleteByIdAction } from '@/app/actions/athleteActions';
import {
  BodyRegion,
  BodySide,
  CompetitiveLevel,
  Dominance,
  ExtraActivity,
  InjuryRecord,
  OrthopedicJoint,
  OrthopedicTestItem,
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
  'Futebol',
  'Corrida de Rua',
  'Crossfit',
  'Vôlei',
  'Basquete',
  'Natação',
  'Beach Tennis',
  'Ciclismo',
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
    code: '01',
    title: 'Identificação & Esporte',
    subtitle: 'Perfil e rotina semanal',
  },
  {
    number: 2,
    code: '02',
    title: 'Histórico & Mapeamento',
    subtitle: 'Lesões prévias e EVA',
  },
  {
    number: 3,
    code: '03',
    title: 'Testes Funcionais',
    subtitle: 'Hop Test, Y-Balance e Lunge',
  },
  {
    number: 4,
    code: '04',
    title: 'Testes Ortopédicos',
    subtitle: 'Exame clínico articular',
  },
];

function AssessmentWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const { addAthlete, updateAthlete, getAthleteById, isMutating } = useFisioTrack();

  const [currentStep, setCurrentStep] = useState(1);
  const [loadingEditData, setLoadingEditData] = useState(false);

  // Step 1 State
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

  // Step 2 State
  const [injuries, setInjuries] = useState<InjuryRecord[]>([]);
  const [draftType, setDraftType] = useState<'Lesão' | 'Cirurgia'>('Lesão');
  const [draftRegion, setDraftRegion] = useState<BodyRegion>('Joelho');
  const [draftSide, setDraftSide] = useState<BodySide>('Direito');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftOccurredAt, setDraftOccurredAt] = useState('04/2026');
  const [draftRecovery, setDraftRecovery] =
    useState<RecoveryStatus>('Desconforto ocasional');
  const [draftPainEVA, setDraftPainEVA] = useState<number>(3);

  // Step 3 State
  const [hopTestRightCm, setHopTestRightCm] = useState<number>(162);
  const [hopTestLeftCm, setHopTestLeftCm] = useState<number>(182);
  const [yBalanceRightCm, setYBalanceRightCm] = useState<number>(92);
  const [yBalanceLeftCm, setYBalanceLeftCm] = useState<number>(97);
  const [lungeTestRightCm, setLungeTestRightCm] = useState<number>(10.5);
  const [lungeTestLeftCm, setLungeTestLeftCm] = useState<number>(12.5);
  const [plankTimeSeconds, setPlankTimeSeconds] = useState<number>(90);
  const [functionalNotes, setFunctionalNotes] = useState('');

  // Step 4 State
  const [orthopedicTests, setOrthopedicTests] = useState<OrthopedicTestItem[]>(() =>
    createDefaultOrthopedicTests()
  );
  const [activeJointTab, setActiveJointTab] = useState<OrthopedicJoint>('Joelho');

  useEffect(() => {
    if (!editId) return;

    const populateFromAthlete = (
      existing: NonNullable<ReturnType<typeof getAthleteById>>
    ) => {
      setName(existing.name);
      setAge(existing.age);
      setWeight(existing.weight);
      setHeight(existing.height);
      setDominance(existing.dominance);
      setMainSport(existing.mainSport);
      setMainSportFrequency(existing.mainSportFrequency);
      setSessionDurationMinutes(existing.sessionDurationMinutes);
      setCompetitiveLevel(existing.competitiveLevel);
      setHasExtraActivity(existing.hasExtraActivity);
      setExtraActivities(existing.extraActivities);
      setInjuries(existing.injuries);
      setHopTestRightCm(existing.functional.hopTestRightCm);
      setHopTestLeftCm(existing.functional.hopTestLeftCm);
      setYBalanceRightCm(existing.functional.yBalanceRightCm);
      setYBalanceLeftCm(existing.functional.yBalanceLeftCm);
      setLungeTestRightCm(existing.functional.lungeTestRightCm);
      setLungeTestLeftCm(existing.functional.lungeTestLeftCm);
      setPlankTimeSeconds(existing.functional.plankTimeSeconds);
      setFunctionalNotes(existing.functional.functionalNotes);
      if (existing.orthopedic.tests.length > 0) {
        setOrthopedicTests(existing.orthopedic.tests);
      }
    };

    const cached = getAthleteById(editId);
    if (cached) {
      populateFromAthlete(cached);
    } else {
      setLoadingEditData(true);
      getAthleteByIdAction(editId)
        .then((dbRecord) => {
          if (dbRecord) populateFromAthlete(dbRecord);
        })
        .finally(() => setLoadingEditData(false));
    }
  }, [editId, getAthleteById]);

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

  const updateOrthoTest = (
    id: string,
    updates: Partial<Pick<OrthopedicTestItem, 'result' | 'side' | 'painNotes'>>
  ) => {
    setOrthopedicTests((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

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
          description: 'Entorse leve de tornozelo (Grau I) reabilitada',
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
        'Alinhamento biomecânico adequado na aterrissagem unipodal, LSI de 98.3% e estabilidade lombopélvica preservada.'
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
      setHopTestLeftCm(160);
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

  const handleFinishAssessment = async () => {
    const payload = {
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
    };

    if (editId) {
      const updated = await updateAthlete(editId, payload);
      router.push(`/atleta/${updated.id}`);
    } else {
      const created = await addAthlete(payload);
      router.push(`/atleta/${created.id}`);
    }
  };

  if (loadingEditData) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-3 text-[#496558] text-xs font-medium">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Carregando dados do banco SQLite...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#5A6E65]">
            {editId ? 'Atualização de Prontuário' : 'Avaliação Pré-Participação (APP)'}
          </p>
          <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#0F241C]">
            {editId ? `Editar — ${name || 'Atleta'}` : 'Nova Avaliação Clínica'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleFillDemoPreset('apto')}
            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-[#DCECE3] hover:bg-[#CBE0D4] text-[#0F241C] transition-colors"
          >
            Preencher Caso Apto (98%)
          </button>
          <button
            type="button"
            onClick={() => handleFillDemoPreset('risco')}
            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white hover:bg-neutral-50 text-[#9E2A2B] border border-[#E6ECE8] transition-colors"
          >
            Preencher Caso Alerta (82%)
          </button>
        </div>
      </div>

      {/* Minimalist Numbered Stepper */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {STEPS.map((step) => {
          const isCurrent = currentStep === step.number;
          const isCompleted = currentStep > step.number;

          return (
            <button
              key={step.number}
              type="button"
              onClick={() => setCurrentStep(step.number)}
              className={cn(
                'text-left p-4 rounded-[20px] border transition-all flex items-center justify-between',
                isCurrent
                  ? 'bg-[#0F241C] text-white border-[#0F241C] shadow-md'
                  : isCompleted
                  ? 'bg-[#DCECE3] border-[#CBE0D4] text-[#0F241C]'
                  : 'bg-white border-[#E6ECE8] text-[#6B7E75] hover:bg-white/80'
              )}
            >
              <div className="min-w-0 pr-2">
                <p
                  className={cn(
                    'text-[10px] font-medium uppercase tracking-widest',
                    isCurrent
                      ? 'text-emerald-400'
                      : isCompleted
                      ? 'text-[#1F7A46]'
                      : 'text-[#8A9B93]'
                  )}
                >
                  Etapa {step.code}
                </p>
                <p className="font-semibold text-sm truncate mt-0.5">
                  {step.title}
                </p>
                <p
                  className={cn(
                    'text-[11px] truncate hidden sm:block',
                    isCurrent ? 'text-white/60' : 'text-[#6B7E75]'
                  )}
                >
                  {step.subtitle}
                </p>
              </div>

              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0',
                  isCurrent
                    ? 'bg-[#22C55E] text-[#0B1913]'
                    : isCompleted
                    ? 'bg-[#0F241C] text-white'
                    : 'bg-[#F3F6F4] text-[#8A9B93]'
                )}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.code}
              </div>
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {/* STEP 1 */}
        {currentStep === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-5"
          >
            <div className="lg:col-span-8 card-surface p-6 space-y-6">
              <div>
                <h2 className="text-base font-semibold text-[#0F241C]">
                  Dados do Atleta e Modalidade Principal
                </h2>
                <p className="text-xs text-[#6B7E75]">
                  Informações antropométricas, dominância motora e frequência semanal
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#496558] mb-1.5">
                    Nome Completo do Atleta
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Lucas Mendes, Mariana Costa..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F4F7F5] focus:bg-white border border-transparent focus:border-[#0F241C] outline-none text-sm font-medium text-[#0F241C] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#496558] mb-1.5">
                    Idade (anos)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={80}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F4F7F5] focus:bg-white border border-transparent focus:border-[#0F241C] outline-none text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#496558] mb-1.5">
                    Dominância Motora
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Destro', 'Canhoto', 'Ambidestro'] as Dominance[]).map((dom) => (
                      <button
                        key={dom}
                        type="button"
                        onClick={() => setDominance(dom)}
                        className={cn(
                          'py-2.5 px-3 rounded-xl text-xs font-medium transition-all',
                          dominance === dom
                            ? 'bg-[#0F241C] text-white'
                            : 'bg-[#F4F7F5] text-[#496558] hover:bg-[#E6F0EB]'
                        )}
                      >
                        {dom}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#496558] mb-1.5">
                    Massa Corporal (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F4F7F5] focus:bg-white border border-transparent focus:border-[#0F241C] outline-none text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#496558] mb-1.5">
                    Estatura (cm)
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F4F7F5] focus:bg-white border border-transparent focus:border-[#0F241C] outline-none text-sm font-medium"
                  />
                </div>
              </div>

              {/* Clean Sport Selection Pills (Zero Emojis) */}
              <div className="space-y-2.5">
                <label className="block text-xs font-medium text-[#496558]">
                  Esporte Principal
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SPORTS_OPTIONS.map((sport) => {
                    const selected = mainSport === sport;
                    return (
                      <button
                        key={sport}
                        type="button"
                        onClick={() => setMainSport(sport)}
                        className={cn(
                          'py-2.5 px-3.5 rounded-xl text-xs font-medium text-left transition-all flex items-center justify-between',
                          selected
                            ? 'bg-[#0F241C] text-white shadow-sm'
                            : 'bg-[#F4F7F5] text-[#3E5249] hover:bg-[#E6F0EB]'
                        )}
                      >
                        <span className="truncate">{sport}</span>
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full shrink-0',
                            selected ? 'bg-[#22C55E]' : 'bg-transparent'
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Weekly Frequency & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 bg-[#F4F7F5] p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#496558]">
                      Frequência Semanal no Esporte
                    </label>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#0F241C] text-white text-xs font-semibold">
                      {mainSportFrequency}x / semana
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={7}
                    value={mainSportFrequency}
                    onChange={(e) => setMainSportFrequency(Number(e.target.value))}
                    className="w-full accent-[#0F241C] cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-[#7A8C84]">
                    <span>1x</span>
                    <span>3x</span>
                    <span>5x</span>
                    <span>7x</span>
                  </div>
                </div>

                <div className="bg-[#F4F7F5] p-4 rounded-2xl space-y-1.5">
                  <label className="block text-xs font-medium text-[#496558]">
                    Sessão (min)
                  </label>
                  <input
                    type="number"
                    step={15}
                    min={20}
                    max={240}
                    value={sessionDurationMinutes}
                    onChange={(e) => setSessionDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white text-sm font-semibold text-[#0F241C] outline-none"
                  />
                  <p className="text-[11px] text-[#7A8C84]">
                    ~{((mainSportFrequency * sessionDurationMinutes) / 60).toFixed(1)}h/sem
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#496558] mb-2">
                  Nível Competitivo
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['Amador', 'Semiprofissional', 'Profissional'] as CompetitiveLevel[]).map(
                    (lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setCompetitiveLevel(lvl)}
                        className={cn(
                          'py-2.5 px-3 rounded-xl text-xs font-medium transition-all',
                          competitiveLevel === lvl
                            ? 'bg-[#0F241C] text-white'
                            : 'bg-[#F4F7F5] text-[#496558] hover:bg-[#E6F0EB]'
                        )}
                      >
                        {lvl}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Complementary Activities (Soft Sage Card) */}
            <div className="lg:col-span-4 rounded-[24px] bg-[#DCECE3] border border-[#CBE0D4] p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-medium text-[#1F7A46]">
                    Preparação Complementar
                  </p>
                  <h3 className="text-base font-semibold text-[#0F241C]">
                    Atividades Extras
                  </h3>
                  <p className="text-xs text-[#496558] mt-0.5">
                    Pratica musculação, pilates ou controle motor além do esporte?
                  </p>
                </div>

                {/* Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/80 backdrop-blur-md">
                  <span className="text-xs font-semibold text-[#0F241C]">
                    Pratica outra atividade?
                  </span>
                  <button
                    type="button"
                    onClick={() => setHasExtraActivity(!hasExtraActivity)}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                      hasExtraActivity ? 'bg-[#0F241C]' : 'bg-[#B7C9BF]'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white transition',
                        hasExtraActivity ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>

                {hasExtraActivity ? (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-white/85 space-y-2.5">
                      <input
                        type="text"
                        value={newExtraName}
                        onChange={(e) => setNewExtraName(e.target.value)}
                        placeholder="Ex: Musculação, Pilates..."
                        className="w-full px-3 py-2 rounded-xl bg-[#F4F7F5] text-xs font-medium outline-none"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <select
                          value={newExtraFreq}
                          onChange={(e) => setNewExtraFreq(Number(e.target.value))}
                          className="px-2.5 py-1.5 rounded-lg bg-[#F4F7F5] text-xs font-semibold text-[#0F241C]"
                        >
                          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                            <option key={n} value={n}>
                              {n}x / semana
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleAddExtraActivity}
                          className="px-3 py-1.5 rounded-lg bg-[#0F241C] text-white text-xs font-medium"
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {extraActivities.map((act, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/75 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-[#0F241C]">
                              {act.activityName}
                            </span>
                            <span className="ml-2 text-[#1F7A46] font-medium">
                              {act.weeklyFrequency}x/sem
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveExtraActivity(index)}
                            className="text-[#7A8C84] hover:text-[#9E2A2B]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-white/75 text-xs text-[#496558] leading-relaxed">
                    Volume elevado no esporte principal ({mainSportFrequency}x/sem) sem treino de
                    força complementar eleva o risco de sobrecarga tendínea.
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-[#0F241C] text-white space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/60">IMC Calculado</span>
                  <span className="font-semibold text-emerald-400">
                    {height > 0
                      ? (weight / Math.pow(height / 100, 2)).toFixed(1)
                      : '--'}{' '}
                    kg/m²
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Sessões Totais</span>
                  <span className="font-semibold">
                    {mainSportFrequency +
                      (hasExtraActivity
                        ? extraActivities.reduce((a, b) => a + b.weeklyFrequency, 0)
                        : 0)}{' '}
                    / semana
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2 */}
        {currentStep === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-5"
          >
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

            <div className="lg:col-span-7 space-y-5">
              <div className="card-surface p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-[#0F241C]">
                      Histórico de Lesões e Cirurgias
                    </h2>
                    <p className="text-xs text-[#6B7E75]">
                      Selecione a região no mapa ao lado e registre ocorrências prévias ou atuais
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#DCECE3] text-[#0F241C] text-xs font-semibold">
                    {draftRegion} ({draftSide})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#496558] mb-1">
                      Evento
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['Lesão', 'Cirurgia'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setDraftType(t)}
                          className={cn(
                            'py-2 rounded-xl text-xs font-medium transition-all',
                            draftType === t
                              ? 'bg-[#0F241C] text-white'
                              : 'bg-[#F4F7F5] text-[#496558]'
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#496558] mb-1">
                      Lado
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['Direito', 'Esquerdo', 'Bilateral', 'N/A'] as BodySide[]).map(
                        (s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setDraftSide(s)}
                            className={cn(
                              'py-1.5 px-2 rounded-lg text-xs font-medium transition-all',
                              draftSide === s
                                ? 'bg-[#0F241C] text-white'
                                : 'bg-[#F4F7F5] text-[#496558]'
                            )}
                          >
                            {s}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#496558] mb-1">
                      Período
                    </label>
                    <input
                      type="text"
                      value={draftOccurredAt}
                      onChange={(e) => setDraftOccurredAt(e.target.value)}
                      placeholder="Ex: 02/2026"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#F4F7F5] text-xs font-medium outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-[#496558]">
                    Descrição Clínica ({draftRegion})
                  </label>
                  <input
                    type="text"
                    value={draftDescription}
                    onChange={(e) => setDraftDescription(e.target.value)}
                    placeholder={`Ex: ${QUICK_INJURY_PRESETS[draftRegion][0]}`}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F4F7F5] text-sm font-medium outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {QUICK_INJURY_PRESETS[draftRegion].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDraftDescription(preset)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-[#F4F7F5] hover:bg-[#DCECE3] text-[#3E5249] transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

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
                        'py-2 px-3 rounded-xl text-xs font-medium transition-all',
                        draftRecovery === st
                          ? 'bg-[#0F241C] text-white'
                          : 'bg-[#F4F7F5] text-[#496558]'
                      )}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* EVA Pain Scale */}
                <div className="p-4 rounded-2xl bg-[#F4F7F5] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#496558]">
                      Escala Visual Analógica de Dor (EVA)
                    </span>
                    <span className="font-semibold text-[#0F241C]">
                      {draftPainEVA} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={draftPainEVA}
                    onChange={(e) => setDraftPainEVA(Number(e.target.value))}
                    className="w-full cursor-pointer accent-[#0F241C]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddInjury}
                  className="w-full py-3 rounded-xl bg-[#0F241C] hover:bg-[#173529] text-white font-medium text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Registro ao Histórico</span>
                </button>
              </div>

              {/* Registered Injuries */}
              <div className="card-surface p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6B7E75]">
                    Registros Adicionados ({injuries.length})
                  </h3>
                </div>

                {injuries.length === 0 ? (
                  <p className="text-xs text-[#6B7E75]">
                    Nenhuma lesão prévia registrada até o momento.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {injuries.map((inj) => (
                      <div
                        key={inj.id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-[#F4F7F5] text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#0F241C]">
                              {inj.type}: {inj.bodyRegion} ({inj.side})
                            </span>
                            <span className="text-[#7A8C84]">• {inj.occurredAt}</span>
                            <span className="px-2 py-0.5 rounded bg-white text-[#0F241C] font-medium">
                              EVA {inj.currentPainEVA}/10
                            </span>
                          </div>
                          <p className="text-[#496558]">{inj.description}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveInjury(inj.id)}
                          className="p-1.5 text-[#7A8C84] hover:text-[#9E2A2B]"
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

        {/* STEP 3 */}
        {currentStep === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Dark Forest Real-Time LSI Callout Card */}
            <div className="rounded-[24px] bg-[#0F241C] text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-white/60">
                    Índice de Simetria entre Membros (LSI)
                  </span>
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-[11px] font-medium',
                      hopLSI >= 90
                        ? 'bg-[#22C55E]/20 text-[#4ADE80]'
                        : 'bg-[#E05A47]/25 text-[#FCA5A5]'
                    )}
                  >
                    {hopLSI >= 90
                      ? 'Simetria Adequada (≥ 90%)'
                      : 'Déficit Funcional Detectado (< 90%)'}
                  </span>
                </div>
                <p className="text-xs text-white/50">
                  Cálculo automático: (Menor Alcance / Maior Alcance) × 100
                </p>
              </div>

              <div className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                {hopLSI}%
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Single Leg Hop */}
              <div className="card-surface p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[#0F241C]">
                      Single Leg Hop Test (Salto Unipodal)
                    </h3>
                    <p className="text-xs text-[#6B7E75]">Distância propulsiva em cm</p>
                  </div>
                  <span className="text-sm font-semibold text-[#0F241C]">
                    LSI {hopLSI}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#F4F7F5]">
                    <label className="block text-xs text-[#5A6E65] mb-1">
                      Membro Direito (cm)
                    </label>
                    <input
                      type="number"
                      value={hopTestRightCm}
                      onChange={(e) => setHopTestRightCm(Number(e.target.value))}
                      className="w-full bg-white px-3 py-2 rounded-xl text-lg font-semibold text-[#0F241C] outline-none"
                    />
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F4F7F5]">
                    <label className="block text-xs text-[#5A6E65] mb-1">
                      Membro Esquerdo (cm)
                    </label>
                    <input
                      type="number"
                      value={hopTestLeftCm}
                      onChange={(e) => setHopTestLeftCm(Number(e.target.value))}
                      className="w-full bg-white px-3 py-2 rounded-xl text-lg font-semibold text-[#0F241C] outline-none"
                    />
                  </div>
                </div>

                <div className="w-full h-2 bg-[#EBF0ED] rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      hopLSI >= 90 ? 'bg-[#22C55E]' : 'bg-[#E05A47]'
                    )}
                    style={{ width: `${Math.min(100, hopLSI)}%` }}
                  />
                </div>
              </div>

              {/* Y-Balance */}
              <div className="card-surface p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[#0F241C]">
                      Y-Balance Test (Membros Inferiores)
                    </h3>
                    <p className="text-xs text-[#6B7E75]">
                      Estabilidade dinâmica unipodal (cm)
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[#F4F7F5] text-[#0F241C]">
                    Δ {Math.abs(yBalanceRightCm - yBalanceLeftCm).toFixed(1)} cm (
                    {yBalanceAsymmetry}%)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#F4F7F5]">
                    <label className="block text-xs text-[#5A6E65] mb-1">
                      Direito (cm)
                    </label>
                    <input
                      type="number"
                      value={yBalanceRightCm}
                      onChange={(e) => setYBalanceRightCm(Number(e.target.value))}
                      className="w-full bg-white px-3 py-2 rounded-xl text-lg font-semibold text-[#0F241C] outline-none"
                    />
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F4F7F5]">
                    <label className="block text-xs text-[#5A6E65] mb-1">
                      Esquerdo (cm)
                    </label>
                    <input
                      type="number"
                      value={yBalanceLeftCm}
                      onChange={(e) => setYBalanceLeftCm(Number(e.target.value))}
                      className="w-full bg-white px-3 py-2 rounded-xl text-lg font-semibold text-[#0F241C] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Lunge Test */}
              <div className="card-surface p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[#0F241C]">
                      Lunge Test (Dorsiflexão de Tornozelo)
                    </h3>
                    <p className="text-xs text-[#6B7E75]">
                      Distância hálux-parede em cadeia fechada (cm)
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[#F4F7F5] text-[#0F241C]">
                    Δ {Math.abs(lungeTestRightCm - lungeTestLeftCm).toFixed(1)} cm (
                    {lungeAsymmetry}%)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#F4F7F5]">
                    <label className="block text-xs text-[#5A6E65] mb-1">
                      Tornozelo Direito (cm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={lungeTestRightCm}
                      onChange={(e) => setLungeTestRightCm(Number(e.target.value))}
                      className="w-full bg-white px-3 py-2 rounded-xl text-lg font-semibold text-[#0F241C] outline-none"
                    />
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F4F7F5]">
                    <label className="block text-xs text-[#5A6E65] mb-1">
                      Tornozelo Esquerdo (cm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={lungeTestLeftCm}
                      onChange={(e) => setLungeTestLeftCm(Number(e.target.value))}
                      className="w-full bg-white px-3 py-2 rounded-xl text-lg font-semibold text-[#0F241C] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Core Plank & Notes */}
              <div className="card-surface p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#0F241C]">
                    Prancha Isométrica (Core) & Qualidade de Movimento
                  </h3>
                  <p className="text-xs text-[#6B7E75]">
                    Resistência estabilizadora lombopélvica em segundos
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-[#5A6E65] mb-1">
                    Tempo em Segundos
                  </label>
                  <input
                    type="number"
                    value={plankTimeSeconds}
                    onChange={(e) => setPlankTimeSeconds(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F4F7F5] text-base font-semibold text-[#0F241C] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#5A6E65] mb-1">
                    Observações Biomecânicas
                  </label>
                  <textarea
                    rows={2}
                    value={functionalNotes}
                    onChange={(e) => setFunctionalNotes(e.target.value)}
                    placeholder="Anote valgo dinâmico, controle pélvico ou compensações..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F4F7F5] text-xs text-[#0F241C] outline-none"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 4 */}
        {currentStep === 4 && (
          <motion.div
            key="step-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-5"
          >
            <div className="lg:col-span-8 card-surface p-6 space-y-5">
              <div>
                <h2 className="text-base font-semibold text-[#0F241C]">
                  Testes Ortopédicos Especiais
                </h2>
                <p className="text-xs text-[#6B7E75]">
                  Selecione o resultado clínico de cada manobra articular
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {(['Joelho', 'Tornozelo', 'Ombro', 'Quadril/Coluna'] as OrthopedicJoint[]).map(
                  (joint) => {
                    const posCount = orthopedicTests.filter(
                      (t) => t.joint === joint && t.result === 'Positivo'
                    ).length;
                    const active = activeJointTab === joint;

                    return (
                      <button
                        key={joint}
                        type="button"
                        onClick={() => setActiveJointTab(joint)}
                        className={cn(
                          'px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2',
                          active
                            ? 'bg-[#0F241C] text-white'
                            : 'bg-[#F4F7F5] text-[#496558] hover:bg-[#E6F0EB]'
                        )}
                      >
                        <span>{joint}</span>
                        {posCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#E05A47] text-white text-[10px]">
                            {posCount}
                          </span>
                        )}
                      </button>
                    );
                  }
                )}
              </div>

              <div className="space-y-3">
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
                            ? 'bg-[#FDECEC]/60 border-[#F5C2C2]'
                            : 'bg-[#F4F7F5] border-transparent'
                        )}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h4 className="font-semibold text-sm text-[#0F241C]">
                              {test.name}
                            </h4>
                            <p className="text-xs text-[#6B7E75]">
                              {test.targetStructure}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                updateOrthoTest(test.id, { result: 'Negativo' })
                              }
                              className={cn(
                                'px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                                isNegative
                                  ? 'bg-[#0F241C] text-white'
                                  : 'bg-white text-[#496558]'
                              )}
                            >
                              Negativo
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                updateOrthoTest(test.id, { result: 'Positivo' })
                              }
                              className={cn(
                                'px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                                isPositive
                                  ? 'bg-[#C83E3B] text-white'
                                  : 'bg-white text-[#496558]'
                              )}
                            >
                              Positivo
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                updateOrthoTest(test.id, {
                                  result: 'Não realizado',
                                })
                              }
                              className={cn(
                                'px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                                isNA
                                  ? 'bg-[#6B7E75] text-white'
                                  : 'bg-white text-[#6B7E75]'
                              )}
                            >
                              N/A
                            </button>
                          </div>
                        </div>

                        {test.result !== 'Não realizado' && (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg shrink-0">
                              {(['Direito', 'Esquerdo', 'Bilateral'] as BodySide[]).map(
                                (s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => updateOrthoTest(test.id, { side: s })}
                                    className={cn(
                                      'px-2 py-0.5 rounded text-[11px] font-medium',
                                      test.side === s
                                        ? 'bg-[#0F241C] text-white'
                                        : 'text-[#6B7E75]'
                                    )}
                                  >
                                    {s}
                                  </button>
                                )
                              )}
                            </div>

                            <input
                              type="text"
                              value={test.painNotes}
                              onChange={(e) =>
                                updateOrthoTest(test.id, { painNotes: e.target.value })
                              }
                              placeholder="Observação clínica (ex: dor subacromial, end-feel firme)..."
                              className="flex-1 px-3 py-1.5 rounded-lg bg-white text-xs text-[#0F241C] outline-none"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Right 4 Cols: Dark Forest Glassmorphic Summary Preview */}
            <div className="lg:col-span-4">
              <div className="rounded-[24px] bg-[#0B1913] text-white p-6 space-y-5 sticky top-8 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#22C55E]/15 blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-[11px] text-emerald-400 font-medium">
                      Síntese Automática
                    </p>
                    <h3 className="text-base font-semibold text-white">
                      Score de Prontidão
                    </h3>
                  </div>
                  <div className="text-3xl font-semibold text-white">
                    {livePreviewAthlete.clinicalSummary.readinessScore}
                    <span className="text-xs text-white/40">/100</span>
                  </div>
                </div>

                <div className="glass-dark rounded-2xl p-4 relative z-10">
                  <p className="text-[10px] uppercase tracking-wider text-white/50">
                    Classificação Clínica
                  </p>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    Risco {livePreviewAthlete.clinicalSummary.riskLevel}
                  </p>
                </div>

                <div className="space-y-2 relative z-10">
                  <p className="text-[11px] text-white/50 font-medium">
                    Achados Identificados
                  </p>
                  <ul className="space-y-2 text-xs text-white/80">
                    {livePreviewAthlete.clinicalSummary.alerts.map((alert, i) => (
                      <li
                        key={i}
                        className="p-3 rounded-xl bg-white/[0.05] border border-white/[0.08] leading-relaxed"
                      >
                        {alert}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={isMutating}
                  onClick={handleFinishAssessment}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-[#0B1913] font-semibold text-xs flex items-center justify-center gap-2 transition-all relative z-10 disabled:opacity-50"
                >
                  {isMutating && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>
                    {editId
                      ? 'Salvar Alterações no Prontuário'
                      : 'Salvar Avaliação & Gerar Laudo'}
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() =>
            currentStep > 1
              ? setCurrentStep(currentStep - 1)
              : router.push(editId ? `/atleta/${editId}` : '/')
          }
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-50 text-[#0F241C] border border-[#E6ECE8] text-xs font-medium transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{currentStep > 1 ? 'Etapa Anterior' : 'Voltar'}</span>
        </button>

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={() => setCurrentStep(currentStep + 1)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F241C] hover:bg-[#173529] text-white text-xs font-medium transition-all"
          >
            <span>Próxima Etapa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            disabled={isMutating}
            onClick={handleFinishAssessment}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0F241C] hover:bg-[#173529] text-white text-xs font-medium transition-all disabled:opacity-50"
          >
            {isMutating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>
              {editId ? 'Confirmar Alterações' : 'Concluir e Abrir Prontuário'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function NovaAvaliacaoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 text-[#6B7E75] text-xs">
          Carregando avaliação...
        </div>
      }
    >
      <AssessmentWizardContent />
    </Suspense>
  );
}
