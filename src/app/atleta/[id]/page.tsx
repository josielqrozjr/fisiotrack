'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  Printer,
  Trash2,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFisioTrack } from '@/context/FisioTrackContext';
import { getAthleteByIdAction } from '@/app/actions/athleteActions';
import { Athlete, BodyRegion, BodySide, RecoveryStatus } from '@/types/fisiotrack';
import { cn, formatDateBR } from '@/lib/utils';

export default function AthleteProntuarioPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { getAthleteById, updateAthlete, deleteAthlete, isLoaded, isMutating } =
    useFisioTrack();

  const cachedAthlete = getAthleteById(params.id);
  const [dbAthlete, setDbAthlete] = useState<Athlete | null>(null);
  const [fetchingSingle, setFetchingSingle] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showQuickInjuryModal, setShowQuickInjuryModal] = useState(false);

  const [injType, setInjType] = useState<'Lesão' | 'Cirurgia'>('Lesão');
  const [injRegion, setInjRegion] = useState<BodyRegion>('Joelho');
  const [injSide, setInjSide] = useState<BodySide>('Direito');
  const [injDesc, setInjDesc] = useState('');
  const [injDate, setInjDate] = useState('10/2026');
  const [injStatus, setInjStatus] = useState<RecoveryStatus>('Em reabilitação');
  const [injEva, setInjEva] = useState<number>(4);

  useEffect(() => {
    if (!cachedAthlete && params.id) {
      setFetchingSingle(true);
      getAthleteByIdAction(params.id)
        .then((res) => {
          if (res) setDbAthlete(res);
        })
        .finally(() => setFetchingSingle(false));
    }
  }, [cachedAthlete, params.id]);

  const athlete = cachedAthlete || dbAthlete;

  const limbComparisonData = useMemo(() => {
    if (!athlete) return [];
    return [
      {
        teste: 'Hop Test (cm)',
        Direito: athlete.functional.hopTestRightCm,
        Esquerdo: athlete.functional.hopTestLeftCm,
      },
      {
        teste: 'Y-Balance (cm)',
        Direito: athlete.functional.yBalanceRightCm,
        Esquerdo: athlete.functional.yBalanceLeftCm,
      },
      {
        teste: 'Lunge ×10 (mm)',
        Direito: Math.round(athlete.functional.lungeTestRightCm * 10),
        Esquerdo: Math.round(athlete.functional.lungeTestLeftCm * 10),
      },
    ];
  }, [athlete]);

  const radarData = useMemo(() => {
    if (!athlete) return [];
    const hopScore = Math.min(100, athlete.functional.hopTestLSI);
    const yBalScore = Math.max(
      0,
      Math.min(100, Math.round(100 - athlete.functional.yBalanceAsymmetryPercent * 3))
    );
    const lungeScore = Math.max(
      0,
      Math.min(100, Math.round(100 - athlete.functional.lungeAsymmetryPercent * 1.8))
    );
    const coreScore = Math.min(
      100,
      Math.round((athlete.functional.plankTimeSeconds / 120) * 100)
    );
    const positiveTestsCount = athlete.orthopedic.tests.filter(
      (t) => t.result === 'Positivo'
    ).length;
    const orthoStabilityScore = Math.max(25, 100 - positiveTestsCount * 25);

    return [
      { dominio: 'Hop LSI', score: hopScore, fullMark: 100 },
      { dominio: 'Y-Balance', score: yBalScore, fullMark: 100 },
      { dominio: 'Lunge Test', score: lungeScore, fullMark: 100 },
      { dominio: 'Core', score: coreScore, fullMark: 100 },
      { dominio: 'Estab. Articular', score: orthoStabilityScore, fullMark: 100 },
    ];
  }, [athlete]);

  if (!athlete && (!isLoaded || fetchingSingle)) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-3 text-[#496558] text-xs font-medium">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Carregando prontuário do banco SQLite...</span>
        </div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="card-surface p-12 text-center space-y-4 max-w-lg mx-auto my-12">
        <h2 className="text-lg font-semibold text-[#0F241C]">
          Prontuário não encontrado
        </h2>
        <p className="text-xs text-[#6B7E75]">
          O atleta solicitado não foi localizado no banco de dados SQLite.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F241C] text-white text-xs font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Dashboard</span>
        </Link>
      </div>
    );
  }

  const { clinicalSummary, functional, orthopedic, injuries } = athlete;
  const positiveOrthoTests = orthopedic.tests.filter((t) => t.result === 'Positivo');
  const bmi = (athlete.weight / Math.pow(athlete.height / 100, 2)).toFixed(1);
  const totalWeeklySessions =
    athlete.mainSportFrequency +
    (athlete.hasExtraActivity
      ? athlete.extraActivities.reduce((a, b) => a + b.weeklyFrequency, 0)
      : 0);

  const handleConfirmDelete = async () => {
    await deleteAthlete(athlete.id);
    setShowDeleteModal(false);
    router.push('/');
  };

  const handleQuickAddInjury = async (e: React.FormEvent) => {
    e.preventDefault();
    const newInjury = {
      id: `inj-${Date.now()}`,
      type: injType,
      bodyRegion: injRegion,
      side: injSide,
      description: injDesc.trim() || `${injType} em ${injRegion} (${injSide})`,
      occurredAt: injDate || 'Recente',
      recoveryStatus: injStatus,
      currentPainEVA: injEva,
    };

    const updated = await updateAthlete(athlete.id, {
      name: athlete.name,
      age: athlete.age,
      weight: athlete.weight,
      height: athlete.height,
      dominance: athlete.dominance,
      mainSport: athlete.mainSport,
      mainSportFrequency: athlete.mainSportFrequency,
      sessionDurationMinutes: athlete.sessionDurationMinutes,
      competitiveLevel: athlete.competitiveLevel,
      hasExtraActivity: athlete.hasExtraActivity,
      extraActivities: athlete.extraActivities,
      injuries: [newInjury, ...athlete.injuries],
      functional: athlete.functional,
      orthopedic: athlete.orthopedic,
    });

    setDbAthlete(updated);
    setInjDesc('');
    setShowQuickInjuryModal(false);
  };

  // Semi-circular gauge calculation for Hop LSI (Inspired by Image 3 "72%" gauge)
  const lsiAngle = Math.min(100, Math.max(0, functional.hopTestLSI));
  const arcLength = 157; // Math.PI * 50
  const strokeDashoffset = arcLength - (lsiAngle / 100) * arcLength;

  return (
    <div className="space-y-6 pb-16 print:space-y-4 print:pb-0">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-50 text-[#0F241C] border border-[#E6ECE8] text-xs font-medium transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowQuickInjuryModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#DCECE3] hover:bg-[#CBE0D4] text-[#0F241C] text-xs font-medium transition-all"
          >
            + Nova Lesão
          </button>

          <Link
            href={`/avaliacao/nova?edit=${athlete.id}`}
            className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-50 text-[#0F241C] border border-[#E6ECE8] text-xs font-medium transition-all"
          >
            Editar Prontuário
          </Link>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F241C] hover:bg-[#173529] text-white text-xs font-medium transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Exportar Laudo</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="p-2 rounded-xl bg-white hover:bg-[#FDECEC] text-[#6B7E75] hover:text-[#9E2A2B] border border-[#E6ECE8] transition-all"
            title="Excluir prontuário"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:flex items-center justify-between border-b border-black pb-3 mb-4">
        <div>
          <h1 className="text-lg font-semibold">
            FISIOTRACK — LAUDO CLÍNICO DE PRONTIDÃO ESPORTIVA (APP)
          </h1>
          <p className="text-xs text-neutral-600">
            Avaliação realizada em {formatDateBR(athlete.createdAt)}
          </p>
        </div>
        <div className="text-right text-xs font-medium">
          <p>Score RTS: {clinicalSummary.readinessScore}/100</p>
          <p>Risco: {clinicalSummary.riskLevel}</p>
        </div>
      </div>

      {/* Hero Athlete Banner (Deep Forest with Glassmorphism Callout) */}
      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#0B1913] via-[#0F241C] to-[#163327] text-white p-6 sm:p-8 print:bg-white print:text-black print:border print:border-neutral-300">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#22C55E]/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#22C55E] text-[#0B1913] font-semibold text-xl flex items-center justify-center shrink-0">
              {athlete.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
                <span>{athlete.competitiveLevel}</span>
                <span>•</span>
                <span>Avaliado em {formatDateBR(athlete.createdAt)}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white print:text-black">
                {athlete.name}
              </h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-white/75 pt-1 print:text-neutral-700">
                <span>
                  Modalidade: <strong className="text-white">{athlete.mainSport}</strong> (
                  {athlete.mainSportFrequency}x/sem)
                </span>
                <span>
                  Idade: <strong className="text-white">{athlete.age} anos</strong>
                </span>
                <span>
                  Dominância: <strong className="text-white">{athlete.dominance}</strong>
                </span>
                <span>
                  Antropometria:{' '}
                  <strong className="text-white">
                    {athlete.weight} kg / {athlete.height} cm
                  </strong>{' '}
                  (IMC {bmi})
                </span>
              </div>
            </div>
          </div>

          {/* Glassmorphic Return-to-Play Status Box */}
          <div className="glass-dark rounded-2xl p-4 sm:px-6 flex items-center justify-between sm:justify-end gap-5 print:border print:border-neutral-300">
            {/* Circular Progress Ring (like Image 3 bottom-left "76.2" ring) */}
            <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle
                  cx="28"
                  cy="28"
                  r="23"
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="4.5"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="23"
                  fill="none"
                  stroke={
                    clinicalSummary.riskLevel === 'Alto'
                      ? '#E05A47'
                      : clinicalSummary.riskLevel === 'Moderado'
                      ? '#F59E0B'
                      : '#22C55E'
                  }
                  strokeWidth="4.5"
                  strokeDasharray={144.5}
                  strokeDashoffset={
                    144.5 - (clinicalSummary.readinessScore / 100) * 144.5
                  }
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xs font-semibold text-white">
                {clinicalSummary.readinessScore}
              </span>
            </div>

            <div>
              <p className="text-[11px] text-white/55 font-medium">
                Índice Return-to-Play
              </p>
              <p className="text-base font-semibold text-white">
                Risco {clinicalSummary.riskLevel}
              </p>
              <p className="text-[11px] text-emerald-400">
                LSI Salto: {functional.hopTestLSI}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: 3 Cards inspired by Image 3 (Semi-circular Gauge + Metrics + Comparative Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Card 1 (3 cols): Semi-Circular Gauge for Hop Test LSI (Exact match to Image 3 "72%" gauge) */}
        <div className="lg:col-span-3 card-surface p-6 flex flex-col items-center justify-between text-center">
          <div className="w-full text-left">
            <h3 className="text-sm font-semibold text-[#0F241C]">
              Simetria Unipodal (LSI)
            </h3>
            <p className="text-xs text-[#6B7E75]">Single Leg Hop Test</p>
          </div>

          <div className="my-2">
            <div className="text-4xl font-semibold tracking-tight text-[#0F241C]">
              {functional.hopTestLSI}%
            </div>

            <svg
              viewBox="0 0 120 70"
              className="w-40 h-24 mx-auto mt-2 overflow-visible"
            >
              <path
                d="M 10,60 A 50,50 0 0,1 110,60"
                fill="none"
                stroke="#0F241C"
                strokeWidth="14"
                strokeLinecap="round"
              />
              <path
                d="M 10,60 A 50,50 0 0,1 110,60"
                fill="none"
                stroke={functional.hopTestLSI >= 90 ? '#22C55E' : '#E05A47'}
                strokeWidth="14"
                strokeDasharray={arcLength}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="w-full pt-2 border-t border-[#F0F4F1] flex justify-between text-xs text-[#5A6E65]">
            <span>D: {functional.hopTestRightCm} cm</span>
            <span>E: {functional.hopTestLeftCm} cm</span>
          </div>
        </div>

        {/* Card 2 (3 cols): Functional Breakdown List (Exact match to Image 3 "86% Renewable Energy" card) */}
        <div className="lg:col-span-3 card-surface p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#0F241C]">
              Estabilidade Dinâmica
            </h3>
            <p className="text-xs text-[#6B7E75]">Y-Balance, Lunge & Core</p>
          </div>

          <div className="my-3">
            <div className="text-4xl font-semibold tracking-tight text-[#0F241C]">
              {(100 - functional.yBalanceAsymmetryPercent).toFixed(0)}%
            </div>
            <p className="text-[11px] text-[#6B7E75] mt-0.5">
              Simetria no alcance Y-Balance
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#3E5249]">
                <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                Y-Balance (D/E)
              </span>
              <span className="font-semibold text-[#0F241C]">
                {functional.yBalanceRightCm}/{functional.yBalanceLeftCm} cm
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#3E5249]">
                <span className="w-2 h-2 rounded-full bg-[#0F241C]" />
                Lunge Test (D/E)
              </span>
              <span className="font-semibold text-[#0F241C]">
                {functional.lungeTestRightCm}/{functional.lungeTestLeftCm} cm
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#3E5249]">
                <span className="w-2 h-2 rounded-full bg-[#8CC9A6]" />
                Prancha Core
              </span>
              <span className="font-semibold text-[#0F241C]">
                {functional.plankTimeSeconds}s
              </span>
            </div>
          </div>
        </div>

        {/* Card 3 (6 cols): Comparative Limb Chart Right vs Left */}
        <div className="lg:col-span-6 card-surface p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-[#0F241C]">
                Comparativo Membro Direito vs. Membro Esquerdo
              </h3>
              <p className="text-xs text-[#6B7E75]">
                Avaliação bilateral de potência, alcance e mobilidade
              </p>
            </div>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={limbComparisonData}
                margin={{ top: 10, right: 10, left: -16, bottom: 0 }}
                barGap={6}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#EBF0ED"
                />
                <XAxis
                  dataKey="teste"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#5A6E65', fontWeight: 500 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#8A9B93' }}
                />
                <Tooltip
                  cursor={{ fill: '#F4F7F5' }}
                  contentStyle={{
                    backgroundColor: '#0F241C',
                    color: '#fff',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar
                  dataKey="Direito"
                  name="Membro Direito"
                  fill="#22C55E"
                  radius={[6, 6, 6, 6]}
                  barSize={18}
                />
                <Bar
                  dataKey="Esquerdo"
                  name="Membro Esquerdo"
                  fill="#0F241C"
                  radius={[6, 6, 6, 6]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Clinical Decision & Recommendations Row (Dark Forest Card + Soft Sage Card like Image 3 bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 rounded-[24px] bg-[#0F241C] text-white p-6 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-emerald-400">
              Achados Biomecânicos & Alertas
            </p>
            <span className="text-xs text-white/50">
              {clinicalSummary.alerts.length} apontamento(s)
            </span>
          </div>
          <ul className="space-y-2.5 text-xs sm:text-sm text-white/90 leading-relaxed">
            {clinicalSummary.alerts.map((alert, index) => (
              <li
                key={index}
                className="p-3.5 rounded-2xl bg-white/[0.06] border border-white/[0.08]"
              >
                {alert}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-6 rounded-[24px] bg-[#DCECE3] border border-[#CBE0D4] p-6 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#1F7A46]">
              Conduta Fisioterapêutica Recomendada
            </p>
            <span className="text-xs text-[#496558]">Baseado em evidências</span>
          </div>
          <ul className="space-y-2.5 text-xs sm:text-sm text-[#0F241C] leading-relaxed">
            {clinicalSummary.recommendations.map((rec, index) => (
              <li
                key={index}
                className="p-3.5 rounded-2xl bg-white/80 font-medium"
              >
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Row: Radar + Injury History + Orthopedic Special Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 5 Cols: Radar + Injuries & Routine */}
        <div className="lg:col-span-5 space-y-5">
          {/* Radar */}
          <div className="card-surface p-6 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-[#0F241C]">
                Perfil Funcional Multidimensional
              </h3>
              <p className="text-xs text-[#6B7E75]">
                Equilíbrio entre simetria, mobilidade, core e estabilidade articular
              </p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                  <PolarGrid stroke="#DCE5E0" />
                  <PolarAngleAxis
                    dataKey="dominio"
                    tick={{ fontSize: 11, fill: '#3E5249', fontWeight: 500 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: '#8A9B93' }}
                  />
                  <Radar
                    name={athlete.name}
                    dataKey="score"
                    stroke="#0F241C"
                    fill="#22C55E"
                    fillOpacity={0.35}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Injuries & Routine */}
          <div className="card-surface p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#0F241C]">
                  Histórico de Lesões & Carga Semanal
                </h3>
                <p className="text-xs text-[#6B7E75]">
                  {totalWeeklySessions} sessões semanais totais
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickInjuryModal(true)}
                className="print:hidden px-2.5 py-1 rounded-lg bg-[#F4F7F5] hover:bg-[#DCECE3] text-[#0F241C] text-xs font-medium transition-colors"
              >
                + Adicionar
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-[#F4F7F5] flex items-center justify-between">
                <span className="text-[#496558]">
                  Esporte Principal ({athlete.mainSport})
                </span>
                <span className="font-semibold text-[#0F241C]">
                  {athlete.mainSportFrequency}x/sem • {athlete.sessionDurationMinutes}min
                </span>
              </div>

              {athlete.hasExtraActivity &&
                athlete.extraActivities.map((extra, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-[#EEF6F1] flex items-center justify-between"
                  >
                    <span className="text-[#1F7A46] font-medium">
                      Complementar: {extra.activityName}
                    </span>
                    <span className="font-semibold text-[#0F241C]">
                      {extra.weeklyFrequency}x/sem
                    </span>
                  </div>
                ))}
            </div>

            <div className="space-y-2.5 pt-2 border-t border-[#F0F4F1]">
              {injuries.length === 0 ? (
                <p className="text-xs text-[#6B7E75]">
                  Sem lesões ou cirurgias registradas.
                </p>
              ) : (
                injuries.map((inj) => (
                  <div
                    key={inj.id}
                    className="p-3.5 rounded-2xl bg-[#F4F7F5] space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0F241C]">
                        {inj.type}: {inj.bodyRegion} ({inj.side})
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-md font-medium text-[11px]',
                          inj.currentPainEVA > 3
                            ? 'bg-[#FDECEC] text-[#9E2A2B]'
                            : 'bg-white text-[#0F241C]'
                        )}
                      >
                        EVA {inj.currentPainEVA}/10
                      </span>
                    </div>
                    <p className="text-[#3E5249]">{inj.description}</p>
                    <p className="text-[11px] text-[#7A8C84]">
                      {inj.occurredAt} • {inj.recoveryStatus}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Orthopedic Special Tests */}
        <div className="lg:col-span-7 card-surface p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#0F241C]">
                Bateria de Testes Ortopédicos Especiais
              </h3>
              <p className="text-xs text-[#6B7E75]">
                Exame clínico ligamentar, meniscal e tendíneo por articulação
              </p>
            </div>
            <span
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium',
                positiveOrthoTests.length > 0
                  ? 'bg-[#FDECEC] text-[#9E2A2B]'
                  : 'bg-[#DCECE3] text-[#175634]'
              )}
            >
              {positiveOrthoTests.length > 0
                ? `${positiveOrthoTests.length} Positivo(s)`
                : 'Todos Negativos'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {orthopedic.tests.map((test) => {
              const isPos = test.result === 'Positivo';
              const isNeg = test.result === 'Negativo';

              return (
                <div
                  key={test.id}
                  className={cn(
                    'p-3.5 rounded-2xl text-xs flex flex-col justify-between gap-1.5 border',
                    isPos
                      ? 'bg-[#FDECEC]/60 border-[#F5C2C2]'
                      : isNeg
                      ? 'bg-[#F4F7F5] border-transparent'
                      : 'bg-[#F4F7F5]/50 border-transparent opacity-60'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-[#7A8C84]">
                        {test.joint} • {test.side}
                      </span>
                      <p className="font-semibold text-[#0F241C]">{test.name}</p>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-md text-[11px] font-medium shrink-0',
                        isPos
                          ? 'bg-[#C83E3B] text-white'
                          : isNeg
                          ? 'bg-white text-[#175634]'
                          : 'bg-white/60 text-[#7A8C84]'
                      )}
                    >
                      {test.result}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#6B7E75]">{test.targetStructure}</p>

                  {test.painNotes && (
                    <p
                      className={cn(
                        'text-[11px] pt-1 border-t',
                        isPos
                          ? 'text-[#9E2A2B] border-[#F5C2C2]'
                          : 'text-[#496558] border-[#E4EBE7]'
                      )}
                    >
                      {test.painNotes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal: Quick Add Injury */}
      {showQuickInjuryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-[26px] max-w-lg w-full p-6 border border-[#E6ECE8] shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6B7E75]">Atualização SQLite</p>
                <h3 className="text-base font-semibold text-[#0F241C]">
                  Adicionar Lesão ou Cirurgia — {athlete.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickInjuryModal(false)}
                className="p-1.5 rounded-xl text-[#6B7E75] hover:text-[#0F241C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddInjury} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#496558] mb-1">
                    Tipo
                  </label>
                  <select
                    value={injType}
                    onChange={(e) =>
                      setInjType(e.target.value as 'Lesão' | 'Cirurgia')
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F7F5] font-medium"
                  >
                    <option value="Lesão">Lesão</option>
                    <option value="Cirurgia">Cirurgia</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#496558] mb-1">
                    Região Anatômica
                  </label>
                  <select
                    value={injRegion}
                    onChange={(e) => setInjRegion(e.target.value as BodyRegion)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F7F5] font-medium"
                  >
                    {[
                      'Ombro',
                      'Cotovelo/Punho',
                      'Coluna',
                      'Quadril',
                      'Joelho',
                      'Tornozelo/Pé',
                      'Muscular/Outros',
                    ].map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#496558] mb-1">
                    Lado
                  </label>
                  <select
                    value={injSide}
                    onChange={(e) => setInjSide(e.target.value as BodySide)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F7F5] font-medium"
                  >
                    {['Direito', 'Esquerdo', 'Bilateral', 'N/A'].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#496558] mb-1">
                    Época
                  </label>
                  <input
                    type="text"
                    value={injDate}
                    onChange={(e) => setInjDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F7F5] font-medium outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#496558] mb-1">
                  Descrição Clínica
                </label>
                <input
                  type="text"
                  required
                  value={injDesc}
                  onChange={(e) => setInjDesc(e.target.value)}
                  placeholder="Ex: Estiramento grau I de bíceps femoral..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F7F5] font-medium outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#496558] mb-1">
                    Status
                  </label>
                  <select
                    value={injStatus}
                    onChange={(e) =>
                      setInjStatus(e.target.value as RecoveryStatus)
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F7F5] font-medium"
                  >
                    <option value="Recuperado totalmente">
                      Recuperado totalmente
                    </option>
                    <option value="Desconforto ocasional">
                      Desconforto ocasional
                    </option>
                    <option value="Em reabilitação">Em reabilitação</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#496558] mb-1">
                    Dor Atual (EVA: {injEva}/10)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={injEva}
                    onChange={(e) => setInjEva(Number(e.target.value))}
                    className="w-full mt-2 accent-[#0F241C]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickInjuryModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#F4F7F5] text-[#496558] font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isMutating}
                  className="px-5 py-2 rounded-xl bg-[#0F241C] text-white font-medium flex items-center gap-1.5"
                >
                  {isMutating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Salvar no Banco</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-[26px] max-w-md w-full p-6 border border-[#E6ECE8] shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-[#0F241C]">
              Excluir Prontuário de {athlete.name}?
            </h3>
            <p className="text-xs text-[#6B7E75] leading-relaxed">
              Esta ação removerá permanentemente o atleta e todos os seus registros
              associados do banco SQLite (<code className="font-mono">onDelete: Cascade</code>).
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-[#F4F7F5] text-[#496558] text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isMutating}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-[#C83E3B] text-white text-xs font-medium flex items-center gap-1.5"
              >
                {isMutating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirmar Exclusão</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
