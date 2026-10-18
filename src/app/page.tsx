'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowUpRight,
  Award,
  CheckCircle2,
  ClipboardPlus,
  Clock,
  Dumbbell,
  Filter,
  Flame,
  HeartPulse,
  ShieldAlert,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFisioTrack } from '@/context/FisioTrackContext';
import { RiskLevel } from '@/types/fisiotrack';
import { cn, formatDateBR } from '@/lib/utils';

export default function DashboardPage() {
  const { athletes, searchQuery } = useFisioTrack();
  const [selectedSport, setSelectedSport] = useState<string>('Todos');
  const [selectedRisk, setSelectedRisk] = useState<string>('Todos');

  // Sports list for filter
  const sportsList = useMemo(() => {
    const unique = Array.from(new Set(athletes.map((a) => a.mainSport)));
    return ['Todos', ...unique];
  }, [athletes]);

  // Filtered athletes
  const filteredAthletes = useMemo(() => {
    return athletes.filter((athlete) => {
      const matchesSearch =
        !searchQuery.trim() ||
        athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        athlete.mainSport.toLowerCase().includes(searchQuery.toLowerCase()) ||
        athlete.injuries.some(
          (i) =>
            i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.bodyRegion.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesSport =
        selectedSport === 'Todos' || athlete.mainSport === selectedSport;

      const matchesRisk =
        selectedRisk === 'Todos' || athlete.clinicalSummary.riskLevel === selectedRisk;

      return matchesSearch && matchesSport && matchesRisk;
    });
  }, [athletes, searchQuery, selectedSport, selectedRisk]);

  // KPI Metrics Calculation
  const kpis = useMemo(() => {
    const totalAthletes = athletes.length;
    const athletesInAlert = athletes.filter(
      (a) =>
        a.clinicalSummary.riskLevel === 'Alto' ||
        a.clinicalSummary.riskLevel === 'Moderado' ||
        a.functional.hopTestLSI < 90 ||
        a.orthopedic.tests.some((t) => t.result === 'Positivo')
    ).length;

    const highRiskCount = athletes.filter(
      (a) => a.clinicalSummary.riskLevel === 'Alto'
    ).length;

    // Weekly load (sport sessions + extra activities)
    const avgWeeklySessions =
      totalAthletes > 0
        ? (
            athletes.reduce((acc, a) => {
              const extraSum = a.hasExtraActivity
                ? a.extraActivities.reduce((s, e) => s + e.weeklyFrequency, 0)
                : 0;
              return acc + a.mainSportFrequency + extraSum;
            }, 0) / totalAthletes
          ).toFixed(1)
        : '0';

    const avgWeeklyHours =
      totalAthletes > 0
        ? (
            athletes.reduce(
              (acc, a) => acc + (a.mainSportFrequency * a.sessionDurationMinutes) / 60,
              0
            ) / totalAthletes
          ).toFixed(1)
        : '0';

    // Joint distribution combining injuries + positive orthopedic tests
    const regionMap: Record<string, number> = {
      Joelho: 0,
      Ombro: 0,
      'Tornozelo/Pé': 0,
      'Quadril/Coluna': 0,
      'Cotovelo/Punho': 0,
      'Muscular/Outros': 0,
    };

    athletes.forEach((a) => {
      a.injuries.forEach((inj) => {
        const key =
          inj.bodyRegion === 'Coluna' || inj.bodyRegion === 'Quadril'
            ? 'Quadril/Coluna'
            : inj.bodyRegion;
        regionMap[key] = (regionMap[key] || 0) + 1;
      });

      a.orthopedic.tests
        .filter((t) => t.result === 'Positivo')
        .forEach((t) => {
          const key = t.joint === 'Tornozelo' ? 'Tornozelo/Pé' : t.joint;
          regionMap[key] = (regionMap[key] || 0) + 1;
        });
    });

    const sortedRegions = Object.entries(regionMap).sort((a, b) => b[1] - a[1]);
    const topRegion = sortedRegions[0] && sortedRegions[0][1] > 0 ? sortedRegions[0][0] : 'Nenhuma';

    const chartData = Object.entries(regionMap).map(([region, count]) => ({
      region,
      ocorrencias: count,
    }));

    return {
      totalAthletes,
      athletesInAlert,
      highRiskCount,
      avgWeeklySessions,
      avgWeeklyHours,
      topRegion,
      chartData,
    };
  }, [athletes]);

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case 'Alto':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          icon: AlertOctagon,
          label: 'Alto Risco / Restrição',
        };
      case 'Moderado':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          icon: AlertTriangle,
          label: 'Atenção / Assimetria',
        };
      default:
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          icon: CheckCircle2,
          label: 'Baixo Risco / Apto',
        };
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] via-slate-900 to-teal-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute -right-12 -top-12 w-72 h-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-24 -bottom-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-400/30 text-teal-300 text-xs font-semibold">
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Sistema Clínico de Rastreio & Return-to-Play</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Painel de Vigilância Fisioterapêutica Esportiva
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Monitoramento integrado de Anamnese Esportiva, Índice de Simetria entre Membros (LSI),
              Testes Funcionais e Testes Ortopédicos Especiais para tomada de decisão clínica baseada em evidências.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/avaliacao/nova"
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/25 transition-all"
            >
              <ClipboardPlus className="w-4 h-4" />
              <span>Iniciar Nova Avaliação</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total de Atletas
            </span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900">{kpis.totalAthletes}</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
              <span>100% com avaliação funcional completa</span>
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Atletas em Alerta
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{kpis.athletesInAlert}</span>
              <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                {kpis.highRiskCount} Alto Risco
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Assimetria (LSI &lt; 90%), dor ou teste (+)
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Carga Média Semanal
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-slate-900">{kpis.avgWeeklySessions}</span>
              <span className="text-sm font-medium text-slate-500">sessões/sem</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>~{kpis.avgWeeklyHours}h de volume específico/semana</span>
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Regiões Acometidas
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900 truncate">{kpis.topRegion}</div>
            <p className="text-xs text-slate-500 mt-1">
              Joelho, Ombro e Tornozelo lideram ocorrências
            </p>
          </div>
        </motion.div>
      </div>

      {/* Main Grid: Athletes List (Left 2 cols) + Epidemiological Chart & LSI Summary (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Athletes List with Filters */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Atletas Avaliados & Status de Prontidão
                </h2>
                <p className="text-xs text-slate-500">
                  Clique em um atleta para abrir o Prontuário Completo e Laudo Return-to-Play
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={selectedSport}
                    onChange={(e) => setSelectedSport(e.target.value)}
                    className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
                    aria-label="Filtrar por esporte"
                  >
                    {sportsList.map((sport) => (
                      <option key={sport} value={sport}>
                        {sport === 'Todos' ? 'Todos os Esportes' : sport}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                  {(['Todos', 'Alto', 'Moderado', 'Baixo'] as const).map((risk) => (
                    <button
                      key={risk}
                      onClick={() => setSelectedRisk(risk)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg font-medium transition-all',
                        selectedRisk === risk
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      )}
                    >
                      {risk}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Athlete Cards */}
            <div className="space-y-3.5">
              {filteredAthletes.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-sm font-medium text-slate-600">
                    Nenhum atleta encontrado com os filtros selecionados.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedSport('Todos');
                      setSelectedRisk('Todos');
                    }}
                    className="mt-2 text-xs font-semibold text-teal-600 hover:underline"
                  >
                    Limpar filtros
                  </button>
                </div>
              ) : (
                filteredAthletes.map((athlete, idx) => {
                  const badge = getRiskBadge(athlete.clinicalSummary.riskLevel);
                  const BadgeIcon = badge.icon;
                  const positiveTests = athlete.orthopedic.tests.filter(
                    (t) => t.result === 'Positivo'
                  );
                  const lsi = athlete.functional.hopTestLSI;
                  const isLsiLow = lsi < 90;

                  return (
                    <motion.div
                      key={athlete.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.04 }}
                    >
                      <Link
                        href={`/atleta/${athlete.id}`}
                        className="block rounded-2xl border border-slate-200/90 hover:border-teal-500/60 bg-white hover:bg-slate-50/50 p-5 transition-all shadow-sm hover:shadow-md group"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          {/* Athlete Identity & Sport Routine */}
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-sm group-hover:from-teal-600 group-hover:to-emerald-600 transition-colors">
                              {athlete.name
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')}
                            </div>
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-base text-slate-900 group-hover:text-teal-700 transition-colors">
                                  {athlete.name}
                                </h3>
                                <span className="text-xs text-slate-500 font-medium">
                                  {athlete.age} anos • {athlete.dominance}
                                </span>
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                  {athlete.competitiveLevel}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                                <span className="font-semibold text-teal-700 flex items-center gap-1">
                                  <Award className="w-3.5 h-3.5" />
                                  {athlete.mainSport} ({athlete.mainSportFrequency}x/sem •{' '}
                                  {athlete.sessionDurationMinutes}min)
                                </span>
                                {athlete.hasExtraActivity &&
                                  athlete.extraActivities.length > 0 && (
                                    <span className="text-slate-500 flex items-center gap-1">
                                      <Dumbbell className="w-3.5 h-3.5 text-slate-400" />+{' '}
                                      {athlete.extraActivities
                                        .map((e) => `${e.activityName} (${e.weeklyFrequency}x/sem)`)
                                        .join(', ')}
                                    </span>
                                  )}
                                {!athlete.hasExtraActivity && (
                                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium">
                                    Sem treino complementar
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Risk Status Badge */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
                                badge.bg
                              )}
                            >
                              <BadgeIcon className="w-3.5 h-3.5" />
                              <span>{badge.label}</span>
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-teal-600 group-hover:text-white text-slate-500 flex items-center justify-center transition-colors">
                              <ArrowUpRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>

                        {/* Clinical Metrics Row */}
                        <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          {/* Injury / Complaint */}
                          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                              Histórico / Queixa Principal
                            </span>
                            {athlete.injuries.length > 0 ? (
                              <p className="font-medium text-slate-700 mt-0.5 truncate">
                                {athlete.injuries[0].bodyRegion} ({athlete.injuries[0].side}):{' '}
                                {athlete.injuries[0].description}
                              </p>
                            ) : (
                              <p className="font-medium text-emerald-700 mt-0.5">
                                Sem lesões prévias relatadas
                              </p>
                            )}
                          </div>

                          {/* Hop Test LSI */}
                          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                Hop Test (LSI %)
                              </span>
                              <span
                                className={cn(
                                  'font-bold text-xs',
                                  isLsiLow ? 'text-rose-600' : 'text-emerald-600'
                                )}
                              >
                                {lsi}% {isLsiLow ? '(Alerta < 90%)' : '(Adequado)'}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  isLsiLow ? 'bg-rose-500' : 'bg-emerald-500'
                                )}
                                style={{ width: `${Math.min(100, lsi)}%` }}
                              />
                            </div>
                          </div>

                          {/* Orthopedic & Lunge Summary */}
                          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex flex-col justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              Testes Ortopédicos & Mobilidade
                            </span>
                            <div className="flex items-center justify-between mt-0.5">
                              {positiveTests.length > 0 ? (
                                <span className="font-semibold text-rose-600 truncate">
                                  {positiveTests.length} Positivo(s):{' '}
                                  {positiveTests.map((t) => t.name).join(', ')}
                                </span>
                              ) : (
                                <span className="font-medium text-emerald-700">
                                  Testes articulares negativos
                                </span>
                              )}
                              <span className="text-[11px] text-slate-400 shrink-0 ml-2">
                                {formatDateBR(athlete.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Epidemiological Joint Chart + Clinical Summary */}
        <div className="space-y-6">
          {/* Joint Distribution Chart */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-600">
                Epidemiologia Clínica
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Acometimento por Articulação / Segmento
              </h3>
              <p className="text-xs text-slate-500">
                Soma de histórico de lesões e testes ortopédicos positivos
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={kpis.chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="region"
                    width={100}
                    tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="ocorrencias" name="Ocorrências Clínicas" radius={[0, 8, 8, 0]}>
                    {kpis.chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.ocorrencias >= 2 ? '#0d9488' : '#10b981'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Symmetry & Readiness Quick Overview */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-600">
                Rastreio Funcional (RTS)
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Índice de Simetria (LSI %) do Elenco
              </h3>
              <p className="text-xs text-slate-500">
                Meta clínica para alta esportiva: LSI ≥ 90%
              </p>
            </div>

            <div className="space-y-3">
              {athletes.map((athlete) => {
                const lsi = athlete.functional.hopTestLSI;
                const lungeDiff = Math.abs(
                  athlete.functional.lungeTestRightCm - athlete.functional.lungeTestLeftCm
                );
                return (
                  <Link
                    key={athlete.id}
                    href={`/atleta/${athlete.id}`}
                    className="block p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                      <span>{athlete.name}</span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[11px]',
                          lsi < 90
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        )}
                      >
                        Hop LSI: {lsi}%
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        Hop: {athlete.functional.hopTestRightCm}cm (D) /{' '}
                        {athlete.functional.hopTestLeftCm}cm (E)
                      </span>
                      <span
                        className={cn(
                          lungeDiff >= 1.5 ? 'text-amber-700 font-semibold' : 'text-slate-500'
                        )}
                      >
                        Lunge Δ: {lungeDiff.toFixed(1)}cm
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
