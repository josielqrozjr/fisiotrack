'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, MoreVertical } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFisioTrack } from '@/context/FisioTrackContext';
import { RiskLevel } from '@/types/fisiotrack';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { athletes, searchQuery } = useFisioTrack();
  const [selectedSport, setSelectedSport] = useState<string>('Todos');
  const [selectedRisk, setSelectedRisk] = useState<string>('Todos');

  const sportsList = useMemo(() => {
    const unique = Array.from(new Set(athletes.map((a) => a.mainSport)));
    return ['Todos', ...unique];
  }, [athletes]);

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

  // Dashboard Metrics
  const stats = useMemo(() => {
    const total = athletes.length;
    const avgLSI =
      total > 0
        ? (
            athletes.reduce((acc, a) => acc + a.functional.hopTestLSI, 0) / total
          ).toFixed(1)
        : '0.0';

    const avgReadiness =
      total > 0
        ? (
            athletes.reduce((acc, a) => acc + a.clinicalSummary.readinessScore, 0) /
            total
          ).toFixed(1)
        : '0.0';

    const totalWeeklyHours = athletes
      .reduce(
        (acc, a) => acc + (a.mainSportFrequency * a.sessionDurationMinutes) / 60,
        0
      )
      .toFixed(1);

    const totalWeeklySessions = athletes.reduce((acc, a) => {
      const extras = a.hasExtraActivity
        ? a.extraActivities.reduce((s, e) => s + e.weeklyFrequency, 0)
        : 0;
      return acc + a.mainSportFrequency + extras;
    }, 0);

    const adequateLsiCount = athletes.filter(
      (a) => a.functional.hopTestLSI >= 90
    ).length;

    const positiveOrthoCount = athletes.reduce(
      (acc, a) =>
        acc + a.orthopedic.tests.filter((t) => t.result === 'Positivo').length,
      0
    );

    // Joint distribution
    const regionMap: Record<string, number> = {
      Joelho: 0,
      Ombro: 0,
      'Tornozelo/Pé': 0,
      'Quadril/Coluna': 0,
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
    const topRegion = sortedRegions[0] || ['Joelho', 0];

    // Chart data comparing athletes' Hop Test LSI and Y-Balance Symmetry
    const symmetryChartData = athletes.map((a) => ({
      name: a.name.split(' ')[0],
      fullName: a.name,
      lsi: a.functional.hopTestLSI,
      ySymmetry: Number((100 - a.functional.yBalanceAsymmetryPercent).toFixed(1)),
      readiness: a.clinicalSummary.readinessScore,
    }));

    return {
      total,
      avgLSI,
      avgReadiness,
      totalWeeklyHours,
      totalWeeklySessions,
      adequateLsiCount,
      positiveOrthoCount,
      topRegion,
      regionMap,
      symmetryChartData,
    };
  }, [athletes]);

  const getStatusTag = (risk: RiskLevel) => {
    if (risk === 'Alto') {
      return {
        label: 'Reabilitação / Restrição',
        className: 'bg-[#FDECEC] text-[#9E2A2B]',
        curveColor: '#E05A47',
      };
    }
    if (risk === 'Moderado') {
      return {
        label: 'Atenção Funcional',
        className: 'bg-[#FDF3E4] text-[#8F5B14]',
        curveColor: '#D9822B',
      };
    }
    return {
      label: 'Apto (Return to Play)',
      className: 'bg-[#E6F4EA] text-[#175634]',
      curveColor: '#22C55E',
    };
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Clean Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#0F241C]">
            Dashboard
          </h1>
          <p className="text-xs text-[#5A6E65] mt-0.5">
            Monitoramento clínico de prontidão esportiva, assimetria funcional e testes ortopédicos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 bg-white rounded-xl p-1 border border-[#E6ECE8]">
            {(['Todos', 'Alto', 'Moderado', 'Baixo'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRisk(r)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  selectedRisk === r
                    ? 'bg-[#0F241C] text-white'
                    : 'text-[#5A6E65] hover:text-[#0F241C]'
                )}
              >
                {r === 'Todos' ? 'Todos' : `Risco ${r}`}
              </button>
            ))}
          </div>

          <Link
            href="/avaliacao/nova"
            className="px-4 py-2.5 rounded-xl bg-[#0F241C] hover:bg-[#173529] text-white text-xs font-medium transition-all shadow-sm"
          >
            Nova Avaliação
          </Link>
        </div>
      </div>

      {/* ROW 1: 3 KPI Cards (1 Inverted Dark Forest Card + 2 Crisp White Cards with Mini Bar Sparklines) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Highlighted Dark Forest Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0F241C] via-[#132C22] to-[#0B1913] text-white p-6 shadow-lg flex items-end justify-between"
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
          <div className="space-y-2 relative z-10">
            <p className="text-xs text-white/60 font-medium">
              Índice de Simetria Médio (LSI)
            </p>
            <div className="text-3xl sm:text-[34px] font-semibold tracking-tight leading-none">
              {stats.avgLSI}%
            </div>
            <p className="text-[11px] text-emerald-400 font-medium pt-1">
              ↗ Corte clínico RTS ≥ 90%
            </p>
          </div>

          {/* Mini Vertical Bar Sparkline */}
          <div className="flex items-end gap-1.5 h-12 relative z-10">
            <span className="w-1.5 h-10 rounded-full bg-[#22C55E]" />
            <span className="w-1.5 h-6 rounded-full bg-[#22C55E]/70" />
            <span className="w-1.5 h-8 rounded-full bg-[#22C55E]/85" />
            <span className="w-1.5 h-12 rounded-full bg-[#22C55E]" />
          </div>
        </motion.div>

        {/* Card 2: Readiness Score Index */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="card-surface p-6 flex items-end justify-between"
        >
          <div className="space-y-2">
            <p className="text-xs text-[#6B7E75] font-medium">
              Índice de Prontidão Esportiva
            </p>
            <div className="text-3xl sm:text-[34px] font-semibold tracking-tight leading-none text-[#0F241C]">
              {stats.avgReadiness}
              <span className="text-lg font-normal text-[#8A9B93]">/100%</span>
            </div>
            <p className="text-[11px] text-[#D96B52] font-medium pt-1">
              ↘ {stats.positiveOrthoCount} testes ortopédicos positivos
            </p>
          </div>

          {/* Mini Vertical Bar Sparkline (Coral) */}
          <div className="flex items-end gap-1.5 h-12">
            <span className="w-1.5 h-5 rounded-full bg-[#E06D53]/70" />
            <span className="w-1.5 h-9 rounded-full bg-[#E06D53]" />
            <span className="w-1.5 h-4 rounded-full bg-[#E06D53]/60" />
            <span className="w-1.5 h-11 rounded-full bg-[#E06D53]" />
          </div>
        </motion.div>

        {/* Card 3: Weekly Training Load */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="card-surface p-6 flex items-end justify-between"
        >
          <div className="space-y-2">
            <p className="text-xs text-[#6B7E75] font-medium">
              Volume Semanal Monitorado
            </p>
            <div className="text-3xl sm:text-[34px] font-semibold tracking-tight leading-none text-[#0F241C]">
              {stats.totalWeeklyHours}h
              <span className="text-base font-normal text-[#8A9B93]"> / sem</span>
            </div>
            <p className="text-[11px] text-[#209653] font-medium pt-1">
              ↗ {stats.totalWeeklySessions} sessões semanais acumuladas
            </p>
          </div>

          {/* Mini Vertical Bar Sparkline (Green) */}
          <div className="flex items-end gap-1.5 h-12">
            <span className="w-1.5 h-6 rounded-full bg-[#22C55E]/70" />
            <span className="w-1.5 h-9 rounded-full bg-[#22C55E]" />
            <span className="w-1.5 h-5 rounded-full bg-[#22C55E]/60" />
            <span className="w-1.5 h-11 rounded-full bg-[#22C55E]" />
          </div>
        </motion.div>
      </div>

      {/* ROW 2: Bento Grid — Main Functional Symmetry Chart (8 cols) + Soft Sage Summary Card (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 8 Cols: Functional Symmetry Index Chart */}
        <div className="lg:col-span-8 card-surface p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#0F241C]">
                Índice de Simetria entre Membros (LSI %) & Y-Balance
              </h2>
              <p className="text-xs text-[#6B7E75]">
                Comparativo individual frente à linha de corte para alta esportiva (90%)
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#0F241C] text-white text-[11px] font-medium">
              Meta RTS ≥ 90%
            </span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.symmetryChartData}
                margin={{ top: 16, right: 16, left: -16, bottom: 0 }}
                barGap={6}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E8EEEA"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#5A6E65', fontWeight: 500 }}
                />
                <YAxis
                  domain={[0, 105]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#8A9B93' }}
                />
                <Tooltip
                  cursor={{ fill: '#F4F7F5' }}
                  contentStyle={{
                    backgroundColor: '#0F241C',
                    color: '#ffffff',
                    borderRadius: '14px',
                    border: 'none',
                    fontSize: '12px',
                    padding: '10px 14px',
                  }}
                />
                <ReferenceLine
                  y={90}
                  stroke="#0F241C"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <Bar
                  dataKey="lsi"
                  name="Hop Test LSI (%)"
                  radius={[6, 6, 6, 6]}
                  barSize={16}
                >
                  {stats.symmetryChartData.map((entry, idx) => (
                    <Cell
                      key={`lsi-${idx}`}
                      fill={entry.lsi >= 90 ? '#22C55E' : '#0F241C'}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="ySymmetry"
                  name="Simetria Y-Balance (%)"
                  radius={[6, 6, 6, 6]}
                  barSize={16}
                  fill="#B8D8C5"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 4 Cols: Soft Sage Tinted Card (Inspired by "99,681m TONS" in Image 4) */}
        <div className="lg:col-span-4 rounded-[24px] bg-[#DCECE3] border border-[#CBE0D4] p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-[44px] font-semibold tracking-tight text-[#0F241C] leading-none">
                {stats.total}
              </span>
              <span className="text-sm font-medium uppercase tracking-wider text-[#496558]">
                Atletas Avaliados
              </span>
            </div>
            <p className="text-xs font-medium text-[#1F7A46] pt-1">
              ↗ {stats.adequateLsiCount} de {stats.total} atingiram LSI ≥ 90% no Hop Test
            </p>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#C6DFD1] flex items-center justify-center shrink-0">
                <span className="w-3 h-3 rounded-full bg-[#0F241C]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F241C]">
                  Estabilidade & Controle Motor
                </p>
                <p className="text-xs text-[#496558]">
                  {stats.adequateLsiCount} atletas com simetria liberada
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#C6DFD1] flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1F7A46]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F241C]">
                  Exame Ortopédico Especial
                </p>
                <p className="text-xs text-[#496558]">
                  {stats.positiveOrthoCount} testes clínicos positivos em acompanhamento
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: Clean Athlete Table (8 cols) + Dark Glass Joint Map Card (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 8 Cols: Structured Athlete Roster Table */}
        <div className="lg:col-span-8 card-surface p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#0F241C]">
                Rastreio Clínico por Atleta
              </h2>
              <p className="text-xs text-[#6B7E75]">
                Selecione um atleta para visualizar o Prontuário Completo e Laudo Return-to-Play
              </p>
            </div>

            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="px-3.5 py-1.5 rounded-full bg-[#0F241C] text-white text-xs font-medium outline-none cursor-pointer self-start sm:self-auto"
            >
              {sportsList.map((sport) => (
                <option key={sport} value={sport}>
                  {sport === 'Todos' ? 'Todas as Modalidades' : sport}
                </option>
              ))}
            </select>
          </div>

          {filteredAthletes.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#6B7E75]">
              Nenhum atleta encontrado para os critérios selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#EBF0ED] text-[11px] font-medium text-[#8A9B93]">
                    <th className="pb-3 font-medium">Atleta</th>
                    <th className="pb-3 font-medium">Carga</th>
                    <th className="pb-3 font-medium">Hop LSI</th>
                    <th className="pb-3 font-medium hidden sm:table-cell">Simetria</th>
                    <th className="pb-3 font-medium">Status Clínico</th>
                    <th className="pb-3 font-medium text-right">Score RTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F4F1] text-xs">
                  {filteredAthletes.map((athlete) => {
                    const statusTag = getStatusTag(
                      athlete.clinicalSummary.riskLevel
                    );
                    const lsi = athlete.functional.hopTestLSI;

                    return (
                      <tr
                        key={athlete.id}
                        className="group hover:bg-[#F4F8F5] transition-colors"
                      >
                        <td className="py-3.5 pr-3">
                          <Link
                            href={`/atleta/${athlete.id}`}
                            className="flex items-center gap-3"
                          >
                            <div className="w-9 h-9 rounded-full bg-[#0F241C] text-white font-semibold text-xs flex items-center justify-center shrink-0 group-hover:bg-[#1E8E4E] transition-colors">
                              {athlete.name
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')}
                            </div>
                            <div>
                              <p className="font-semibold text-[#0F241C] group-hover:text-[#175634] transition-colors">
                                {athlete.name}
                              </p>
                              <p className="text-[11px] text-[#7A8C84]">
                                {athlete.mainSport} • {athlete.age} anos
                              </p>
                            </div>
                          </Link>
                        </td>

                        <td className="py-3.5 pr-3 text-[#3E5249] font-medium">
                          {athlete.mainSportFrequency}x/sem
                          {athlete.hasExtraActivity &&
                            athlete.extraActivities.length > 0 && (
                              <span className="block text-[10px] text-[#7A8C84]">
                                +{athlete.extraActivities[0].activityName}
                              </span>
                            )}
                        </td>

                        <td className="py-3.5 pr-3">
                          <span
                            className={cn(
                              'font-semibold',
                              lsi < 90 ? 'text-[#C83E3B]' : 'text-[#0F241C]'
                            )}
                          >
                            {lsi}%
                          </span>
                        </td>

                        {/* Mini Sparkline SVG (Inspired by "Dynamic" column in Image 4) */}
                        <td className="py-3.5 pr-3 hidden sm:table-cell">
                          <svg
                            width="68"
                            height="22"
                            viewBox="0 0 68 22"
                            className="overflow-visible"
                          >
                            <path
                              d={
                                lsi >= 90
                                  ? 'M2,18 C16,16 24,8 38,10 C50,12 56,4 66,3'
                                  : 'M2,6 C16,8 26,14 38,12 C50,10 56,17 66,19'
                              }
                              fill="none"
                              stroke={statusTag.curveColor}
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </td>

                        <td className="py-3.5 pr-3">
                          <Link
                            href={`/atleta/${athlete.id}`}
                            className={cn(
                              'inline-block px-3 py-1 rounded-lg text-[11px] font-medium',
                              statusTag.className
                            )}
                          >
                            {statusTag.label}
                          </Link>
                        </td>

                        <td className="py-3.5 text-right">
                          <Link
                            href={`/atleta/${athlete.id}`}
                            className="inline-flex items-center justify-end gap-2 font-semibold text-[#0F241C]"
                          >
                            <span>{athlete.clinicalSummary.readinessScore}/100</span>
                            <MoreVertical className="w-3.5 h-3.5 text-[#9BA9A2] group-hover:text-[#0F241C]" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 4 Cols: Dark Forest Card with Glassmorphism Callout (Inspired by "Global pollution" card in Image 4) */}
        <div className="lg:col-span-4 rounded-[24px] bg-[#0B1913] text-white p-6 relative overflow-hidden flex flex-col justify-between min-h-[290px]">
          <div className="absolute -bottom-16 -right-12 w-52 h-52 rounded-full bg-[#22C55E]/20 blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <h3 className="text-base font-semibold text-white">
              Mapa de Acometimento
            </h3>
            <span className="px-3 py-1 rounded-full bg-white text-[#0F241C] text-[11px] font-semibold">
              Articulações
            </span>
          </div>

          {/* Regional Bars + Glassmorphic Floating Callout */}
          <div className="relative z-10 my-4 space-y-3">
            {Object.entries(stats.regionMap).map(([region, count]) => {
              const widthPct = Math.min(100, Math.max(18, count * 35));
              return (
                <div key={region} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/75 font-medium">{region}</span>
                    <span className="text-emerald-400 font-semibold">
                      {count} ocorr.
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/[0.07] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#166534] to-[#22C55E]"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Floating Glassmorphism Badge */}
            <div className="glass-dark rounded-2xl p-3.5 mt-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white">
                  {stats.topRegion[0]}
                </p>
                <p className="text-[11px] text-white/55">Maior incidência clínica</p>
              </div>
              <div className="flex items-center gap-1 text-emerald-400 font-semibold text-sm">
                <span>{stats.topRegion[1]} casos</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-[11px] text-white/45 pt-1">
            <span>Sincronizado via Prisma SQLite</span>
            <span> Tempo real</span>
          </div>
        </div>
      </div>
    </div>
  );
}
