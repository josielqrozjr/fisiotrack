'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  ClipboardPlus,
  LayoutDashboard,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Menu,
  X,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';
import { useFisioTrack } from '@/context/FisioTrackContext';
import { cn } from '@/lib/utils';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { athletes, searchQuery, setSearchQuery, restoreDemoData } = useFisioTrack();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRestoreToast, setShowRestoreToast] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const handleRestoreDemo = () => {
    restoreDemoData();
    setShowRestoreToast(true);
    setTimeout(() => setShowRestoreToast(false), 3000);
  };

  const quickSearchResults = searchQuery.trim()
    ? athletes.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.mainSport.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const getRiskDot = (risk: string) => {
    if (risk === 'Alto') return 'bg-rose-500';
    if (risk === 'Moderado') return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col lg:flex-row">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden print:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-[#0F172A] text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 print:hidden',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 group"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/25 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">
                  Fisio<span className="text-emerald-400">Track</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-400">Fisioterapia Esportiva & APP</p>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="p-4 flex-1 overflow-y-auto space-y-6">
          <div>
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Menu Principal
            </p>
            <nav className="space-y-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                  pathname === '/'
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-900/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard & Rastreio</span>
              </Link>

              <Link
                href="/avaliacao/nova"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                  pathname?.startsWith('/avaliacao')
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-900/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                )}
              >
                <ClipboardPlus className="w-4 h-4" />
                <span>Nova Avaliação (APP)</span>
              </Link>
            </nav>
          </div>

          {/* Direct Athlete Prontuários List */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Prontuários de Atletas ({athletes.length})
              </p>
            </div>
            <div className="space-y-1">
              {athletes.map((athlete) => {
                const isActive = pathname === `/atleta/${athlete.id}`;
                return (
                  <Link
                    key={athlete.id}
                    href={`/atleta/${athlete.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all group',
                      isActive
                        ? 'bg-slate-800 text-white border border-teal-500/40'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full shrink-0',
                          getRiskDot(athlete.clinicalSummary.riskLevel)
                        )}
                      />
                      <div className="truncate">
                        <p className="font-medium truncate text-xs text-slate-100">
                          {athlete.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {athlete.mainSport} • LSI {athlete.functional.hopTestLSI}%
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={cn(
                        'w-3.5 h-3.5 shrink-0 transition-transform',
                        isActive
                          ? 'text-teal-400 translate-x-0.5'
                          : 'text-slate-500 group-hover:text-slate-300'
                      )}
                    />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Clinical Criteria Legend */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Critérios Return-to-Play</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>LSI ≥ 90%: Simetria adequada</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Y-Balance Δ &gt; 4cm: Atenção</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>LSI &lt; 90% ou Teste (+): Alto risco</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer / Restore Demo Data */}
        <div className="p-4 border-t border-slate-800/80 space-y-2 bg-slate-950/40">
          <button
            onClick={handleRestoreDemo}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 transition-all"
            title="Restaura os 3 atletas padrão para apresentação"
          >
            <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
            <span>Restaurar Dados de Demonstração</span>
          </button>
          {showRestoreToast && (
            <div className="text-[11px] text-center py-1.5 px-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
              Dados de demonstração restaurados!
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick Athlete Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                placeholder="Buscar atleta por nome, esporte ou lesão..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white rounded-xl border border-transparent focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all text-slate-800 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  Limpar
                </button>
              )}

              {/* Dropdown Quick Jump */}
              {searchFocused && quickSearchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                  <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Ir para Prontuário
                  </p>
                  {quickSearchResults.map((athlete) => (
                    <button
                      key={athlete.id}
                      onMouseDown={() => {
                        router.push(`/atleta/${athlete.id}`);
                        setSearchFocused(false);
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center justify-between text-sm"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">{athlete.name}</p>
                        <p className="text-xs text-slate-500">
                          {athlete.mainSport} • {athlete.age} anos
                        </p>
                      </div>
                      <span
                        className={cn(
                          'text-xs font-semibold px-2.5 py-0.5 rounded-full',
                          athlete.clinicalSummary.riskLevel === 'Alto'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : athlete.clinicalSummary.riskLevel === 'Moderado'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        )}
                      >
                        Risco {athlete.clinicalSummary.riskLevel}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200/70 text-teal-800 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Avaliação Pré-Participação (APP)</span>
            </div>

            <Link
              href="/avaliacao/nova"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-sm shadow-teal-600/20 hover:shadow-md transition-all active:scale-[0.99]"
            >
              <ClipboardPlus className="w-4 h-4" />
              <span>+ Nova Avaliação</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
