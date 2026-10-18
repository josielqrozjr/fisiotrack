'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Dumbbell,
  FileText,
  Printer,
  Ruler,
  Scale,
  ShieldAlert,
  Stethoscope,
  Timer,
  Trash2,
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
import { cn, formatDateBR } from '@/lib/utils';

export default function AthleteProntuarioPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { getAthleteById, deleteAthlete } = useFisioTrack();

  const athlete = getAthleteById(params.id);

  // Comparative Bar Chart Data (Right vs Left Limb)
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

  // Radar Functional Profile Data (0 - 100 scale)
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
      { dominio: 'Simetria Salto (LSI)', score: hopScore, fullMark: 100 },
      { dominio: 'Controle Y-Balance', score: yBalScore, fullMark: 100 },
      { dominio: 'Mobilidade Tornozelo', score: lungeScore, fullMark: 100 },
      { dominio: 'Estabilidade Core', score: coreScore, fullMark: 100 },
      { dominio: 'Integridade Ortopédica', score: orthoStabilityScore, fullMark: 100 },
    ];
  }, [athlete]);

  if (!athlete) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
          <FileText className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Prontuário não encontrado</h2>
        <p className="text-sm text-slate-500">
          O atleta solicitado não foi localizado ou foi removido.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700"
        >
          <ArrowLeft className="w-4 h-4" />
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

  const handleDelete = () => {
    deleteAthlete(athlete.id);
    router.push('/');
  };

  return (
    <div className="space-y-6 pb-16 print:space-y-4 print:pb-0">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Lista de Atletas</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Printer className="w-4 h-4 text-teal-400" />
            <span>Imprimir / Exportar Laudo (PDF)</span>
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 text-xs font-semibold transition-all"
            title="Excluir prontuário"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Print-Only Official Medical Header */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            FISIOTRACK — LAUDO CLÍNICO DE AVALIAÇÃO PRÉ-PARTICIPAÇÃO (APP)
          </h1>
          <p className="text-xs text-slate-600">
            Departamento de Fisioterapia Esportiva & Biomecânica Aplicada • Data:{' '}
            {formatDateBR(athlete.createdAt)}
          </p>
        </div>
        <div className="text-right text-xs font-semibold text-slate-700">
          <p>Score de Prontidão: {clinicalSummary.readinessScore}/100</p>
          <p>Risco Clínico: {clinicalSummary.riskLevel}</p>
        </div>
      </div>

      {/* Header Card: Ficha de Clube Profissional + Semáforo Return-to-Play */}
      <div className="bg-gradient-to-br from-[#0F172A] via-slate-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl print:bg-white print:text-slate-900 print:border-slate-300 print:shadow-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Athlete Profile */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-600 text-slate-950 font-black text-2xl flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/25 print:border print:border-slate-300">
              {athlete.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px] font-bold uppercase tracking-wider print:text-teal-800 print:border-teal-600">
                  Ficha Técnica #{athlete.id.slice(0, 8)}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold print:bg-slate-100 print:text-slate-800">
                  {athlete.competitiveLevel}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 print:text-slate-600">
                  <Calendar className="w-3.5 h-3.5" />
                  Avaliado em {formatDateBR(athlete.createdAt)}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white print:text-slate-900">
                {athlete.name}
              </h1>

              {/* Anthropometric & Sport Pills */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 print:text-slate-700">
                <span className="flex items-center gap-1 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 print:bg-slate-100 print:border-slate-300">
                  <Award className="w-3.5 h-3.5 text-teal-400 print:text-teal-700" />
                  <strong>{athlete.mainSport}</strong> ({athlete.mainSportFrequency}x/sem •{' '}
                  {athlete.sessionDurationMinutes}min)
                </span>
                <span className="bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 print:bg-slate-100 print:border-slate-300">
                  {athlete.age} anos • Dominância: <strong>{athlete.dominance}</strong>
                </span>
                <span className="flex items-center gap-1 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 print:bg-slate-100 print:border-slate-300">
                  <Scale className="w-3.5 h-3.5 text-slate-400" />
                  {athlete.weight} kg
                </span>
                <span className="flex items-center gap-1 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 print:bg-slate-100 print:border-slate-300">
                  <Ruler className="w-3.5 h-3.5 text-slate-400" />
                  {athlete.height} cm (IMC {bmi})
                </span>
              </div>
            </div>
          </div>

          {/* Traffic Light Return to Play Status (Semáforo Visual) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 print:bg-slate-50 print:border-slate-300">
            {/* Visual Traffic Light Dots */}
            <div className="flex sm:flex-col items-center justify-center gap-2 px-2 py-1 bg-slate-900 rounded-xl border border-slate-800">
              <span
                className={cn(
                  'w-4 h-4 rounded-full transition-all',
                  clinicalSummary.riskLevel === 'Alto'
                    ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.9)] scale-110'
                    : 'bg-rose-950/50'
                )}
                title="Alto Risco / Restrição"
              />
              <span
                className={cn(
                  'w-4 h-4 rounded-full transition-all',
                  clinicalSummary.riskLevel === 'Moderado'
                    ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)] scale-110'
                    : 'bg-amber-950/50'
                )}
                title="Risco Moderado / Atenção"
              />
              <span
                className={cn(
                  'w-4 h-4 rounded-full transition-all',
                  clinicalSummary.riskLevel === 'Baixo'
                    ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.9)] scale-110'
                    : 'bg-emerald-950/50'
                )}
                title="Baixo Risco / Return to Play Liberado"
              />
            </div>

            <div className="space-y-1 pr-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Status Return-to-Play (Prontidão)
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-lg font-black',
                    clinicalSummary.riskLevel === 'Alto'
                      ? 'text-rose-400 print:text-rose-700'
                      : clinicalSummary.riskLevel === 'Moderado'
                      ? 'text-amber-400 print:text-amber-700'
                      : 'text-emerald-400 print:text-emerald-700'
                  )}
                >
                  Risco {clinicalSummary.riskLevel}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-white font-bold print:bg-slate-200 print:text-slate-900">
                  Score: {clinicalSummary.readinessScore}/100
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-[230px] print:text-slate-600">
                {clinicalSummary.riskLevel === 'Alto'
                  ? 'Reabilitação prioritária / restrição de retorno competitivo total'
                  : clinicalSummary.riskLevel === 'Moderado'
                  ? 'Liberado com ajustes preventivos de mobilidade/controle'
                  : 'Apto para treino e competição sem restrições funcionais'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Automatic Clinical Recommendations & Alerts Box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-2xl p-6 border shadow-sm space-y-4',
          clinicalSummary.riskLevel === 'Alto'
            ? 'bg-rose-50/70 border-rose-200'
            : clinicalSummary.riskLevel === 'Moderado'
            ? 'bg-amber-50/70 border-amber-200'
            : 'bg-emerald-50/70 border-emerald-200'
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white',
              clinicalSummary.riskLevel === 'Alto'
                ? 'bg-rose-600'
                : clinicalSummary.riskLevel === 'Moderado'
                ? 'bg-amber-600'
                : 'bg-emerald-600'
            )}
          >
            {clinicalSummary.riskLevel === 'Alto' ? (
              <AlertOctagon className="w-5 h-5" />
            ) : clinicalSummary.riskLevel === 'Moderado' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Parecer Clínico Automatizado & Tomada de Decisão
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Síntese Diagnóstica Funcional e Conduta Fisioterapêutica Recomendada
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Alertas Detectados */}
          <div className="bg-white/90 rounded-xl p-4 border border-slate-200/80 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>Achados Clínicos & Alertas Biomecânicos</span>
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-800">
              {clinicalSummary.alerts.map((alert, index) => (
                <li key={index} className="flex items-start gap-2 leading-relaxed">
                  <span className="font-bold text-rose-600 mt-0.5">•</span>
                  <span>{alert}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recomendações Baseadas em Evidência */}
          <div className="bg-white/90 rounded-xl p-4 border border-slate-200/80 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
              <ClipboardCheck className="w-4 h-4 text-teal-600" />
              <span>Plano de Intervenção e Recomendações (Return-to-Sport)</span>
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-800">
              {clinicalSummary.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 leading-relaxed">
                  <span className="font-bold text-teal-600 mt-0.5">✓</span>
                  <span className="font-medium">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Functional Metrics & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Bar Chart Right vs Left + Detailed Functional Cards */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-600">
                Análise de Simetria Intermembros
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Comparativo Membro Direito vs. Membro Esquerdo
              </h3>
            </div>
            <span
              className={cn(
                'px-3 py-1 rounded-full text-xs font-bold border',
                functional.hopTestLSI >= 90
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              )}
            >
              LSI Salto Unipodal: {functional.hopTestLSI}%
            </span>
          </div>

          {/* BarChart Right vs Left */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={limbComparisonData}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="teste"
                  tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar
                  dataKey="Direito"
                  name="Membro Direito"
                  fill="#0d9488"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="Esquerdo"
                  name="Membro Esquerdo"
                  fill="#0f172a"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 4 Functional Test Mini-Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {/* Single Leg Hop */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Single Leg Hop Test</span>
                <span
                  className={cn(
                    'text-xs font-extrabold px-2 py-0.5 rounded-full',
                    functional.hopTestLSI >= 90
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  )}
                >
                  LSI {functional.hopTestLSI}%
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900">
                Direito: {functional.hopTestRightCm} cm | Esquerdo: {functional.hopTestLeftCm} cm
              </p>
              <p className="text-[11px] text-slate-500">
                Critério de alta: LSI &ge; 90% (Diferença atual:{' '}
                {Math.abs(functional.hopTestRightCm - functional.hopTestLeftCm)} cm)
              </p>
            </div>

            {/* Y-Balance */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Y-Balance Test</span>
                <span
                  className={cn(
                    'text-xs font-extrabold px-2 py-0.5 rounded-full',
                    Math.abs(functional.yBalanceRightCm - functional.yBalanceLeftCm) < 4
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  )}
                >
                  Δ {Math.abs(functional.yBalanceRightCm - functional.yBalanceLeftCm).toFixed(1)} cm
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900">
                Direito: {functional.yBalanceRightCm} cm | Esquerdo: {functional.yBalanceLeftCm} cm
              </p>
              <p className="text-[11px] text-slate-500">
                Assimetria: {functional.yBalanceAsymmetryPercent}% (Corte de alerta: &ge; 4 cm)
              </p>
            </div>

            {/* Lunge Test */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Lunge Test (Dorsiflexão)
                </span>
                <span
                  className={cn(
                    'text-xs font-extrabold px-2 py-0.5 rounded-full',
                    Math.abs(functional.lungeTestRightCm - functional.lungeTestLeftCm) < 1.5
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  )}
                >
                  Δ {Math.abs(functional.lungeTestRightCm - functional.lungeTestLeftCm).toFixed(1)}{' '}
                  cm
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900">
                Direito: {functional.lungeTestRightCm} cm | Esquerdo:{' '}
                {functional.lungeTestLeftCm} cm
              </p>
              <p className="text-[11px] text-slate-500">
                Assimetria: {functional.lungeAsymmetryPercent}% (Normal: 10–14 cm da parede)
              </p>
            </div>

            {/* Core Plank */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Prancha Isométrica (Core)</span>
                <span
                  className={cn(
                    'text-xs font-extrabold px-2 py-0.5 rounded-full',
                    functional.plankTimeSeconds >= 60
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  )}
                >
                  {functional.plankTimeSeconds} segundos
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-teal-600" />
                Resistência Estabilizadora: {functional.plankTimeSeconds}s
              </p>
              <p className="text-[11px] text-slate-500">
                Referência atlética recomendada: &ge; 90 segundos
              </p>
            </div>
          </div>

          {functional.functionalNotes && (
            <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200/70 text-xs text-slate-700 space-y-1">
              <span className="font-bold uppercase tracking-wider text-teal-800 block">
                Notas Qualitativas da Avaliação Funcional:
              </span>
              <p className="leading-relaxed">{functional.functionalNotes}</p>
            </div>
          )}
        </div>

        {/* Right 5 Cols: Radar Chart of Functional Symmetry & Training Load */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-600">
                Radar de Simetria & Capacidade
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Perfil Biomecânico Multidimensional
              </h3>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                  <PolarGrid stroke="#cbd5e1" />
                  <PolarAngleAxis
                    dataKey="dominio"
                    tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <Radar
                    name={athlete.name}
                    dataKey="score"
                    stroke="#0d9488"
                    fill="#14b8a6"
                    fillOpacity={0.45}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly Training Load & Extra Activities Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-600">
                  Controle de Carga Externa
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Rotina Esportiva & Atividades Extras
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold">
                {totalWeeklySessions} sessões/sem
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-teal-600" />
                  <div>
                    <p className="font-bold text-slate-900">
                      Esporte Principal: {athlete.mainSport}
                    </p>
                    <p className="text-slate-500">
                      Sessões de {athlete.sessionDurationMinutes} min (~
                      {((athlete.mainSportFrequency * athlete.sessionDurationMinutes) / 60).toFixed(
                        1
                      )}
                      h/sem)
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-teal-600 text-white font-bold">
                  {athlete.mainSportFrequency}x / sem
                </span>
              </div>

              {athlete.hasExtraActivity && athlete.extraActivities.length > 0 ? (
                athlete.extraActivities.map((extra, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/70"
                  >
                    <div className="flex items-center gap-2.5">
                      <Dumbbell className="w-4 h-4 text-emerald-600" />
                      <div>
                        <p className="font-bold text-slate-900">
                          Complementar: {extra.activityName}
                        </p>
                        <p className="text-slate-500">Fator protetor neuromuscular</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
                      {extra.weeklyFrequency}x / sem
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Atleta <strong>não realiza</strong> atividade complementar de fortalecimento ou
                    prevenção.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Injury History + Special Orthopedic Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Histórico de Lesões e Cirurgias */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-600">
              Anamnese & Morbidade Referida
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Histórico de Lesões, Cirurgias e Dor (EVA)
            </h3>
          </div>

          {injuries.length === 0 ? (
            <div className="p-6 rounded-xl bg-emerald-50/50 border border-emerald-200 text-center text-xs text-emerald-800 font-medium">
              Nenhum histórico de lesão ou cirurgia relatado na anamnese.
            </div>
          ) : (
            <div className="space-y-3">
              {injuries.map((inj) => (
                <div
                  key={inj.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                          inj.type === 'Cirurgia'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-teal-100 text-teal-800'
                        )}
                      >
                        {inj.type}
                      </span>
                      <span className="font-bold text-sm text-slate-900">
                        {inj.bodyRegion} ({inj.side})
                      </span>
                    </div>

                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-xs font-bold border',
                        inj.currentPainEVA > 3
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : inj.currentPainEVA > 0
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      )}
                    >
                      Dor EVA: {inj.currentPainEVA}/10
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-medium text-slate-800">
                    {inj.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Ocorrência: {inj.occurredAt}
                    </span>
                    <span className="font-semibold text-slate-700">{inj.recoveryStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 7 Cols: Testes Ortopédicos Especiais */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-600">
                Exame Físico Articular
              </span>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                <span>Bateria de Testes Ortopédicos Especiais</span>
              </h3>
            </div>
            <span
              className={cn(
                'px-3 py-1 rounded-full text-xs font-bold border',
                positiveOrthoTests.length > 0
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              )}
            >
              {positiveOrthoTests.length > 0
                ? `${positiveOrthoTests.length} Teste(s) Positivo(s)`
                : 'Todos os Testes Negativos'}
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
                    'p-3 rounded-xl border text-xs flex flex-col justify-between gap-1.5',
                    isPos
                      ? 'bg-rose-50/70 border-rose-300'
                      : isNeg
                      ? 'bg-slate-50/80 border-slate-200/80'
                      : 'bg-slate-50/40 border-slate-200/50 opacity-60'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {test.joint} • {test.side}
                      </span>
                      <p className="font-bold text-slate-900">{test.name}</p>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0',
                        isPos
                          ? 'bg-rose-600 text-white'
                          : isNeg
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      )}
                    >
                      {test.result}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500">{test.targetStructure}</p>

                  {test.painNotes && (
                    <p
                      className={cn(
                        'text-[11px] font-medium pt-1 border-t',
                        isPos
                          ? 'text-rose-800 border-rose-200'
                          : 'text-slate-600 border-slate-200/60'
                      )}
                    >
                      Obs: {test.painNotes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
