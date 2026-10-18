'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid,
  ClipboardPlus,
  RotateCcw,
  Search,
  Menu,
  X,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';
import { useFisioTrack } from '@/context/FisioTrackContext';
import { cn } from '@/lib/utils';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { athletes, isMutating, searchQuery, setSearchQuery, restoreDemoData } =
    useFisioTrack();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRestoreToast, setShowRestoreToast] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const handleRestoreDemo = async () => {
    await restoreDemoData();
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

  const highRiskCount = athletes.filter(
    (a) => a.clinicalSummary.riskLevel === 'Alto'
  ).length;

  return (
    <div className="min-h-screen bg-[#0B1913] text-[#0F241C] flex flex-col lg:flex-row lg:p-3 print:bg-white print:p-0">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden print:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar (Inspired by AeuxGlobal / Forest Glass Aesthetic) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-[#0B1913] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:w-64 lg:shrink-0 print:hidden overflow-hidden',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Subtle Top-Left Emerald Radial Glow */}
        <div className="absolute -top-20 -left-20 w-56 h-56 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 p-5 space-y-6 flex-1 overflow-y-auto">
          {/* Brand Logo */}
          <div className="flex items-center justify-between px-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5"
            >
              <div className="flex items-end gap-0.5 h-5">
                <span className="w-1.5 h-5 rounded-full bg-[#22C55E]" />
                <span className="w-1.5 h-3.5 rounded-full bg-[#22C55E]/70" />
                <span className="w-1.5 h-4 rounded-full bg-[#22C55E]/40" />
              </div>
              <span className="font-semibold text-lg tracking-tight text-white">
                FisioTrack
              </span>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Glassmorphic Workspace Pill */}
          <div className="glass-dark rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-inner">
                <span className="w-2.5 h-2.5 rounded-full bg-white" />
              </div>
              <div className="truncate">
                <p className="text-[10px] text-white/50 font-medium leading-tight">
                  Unidade Clínica
                </p>
                <p className="text-xs font-semibold text-white truncate">
                  Fisio Esportiva APP
                </p>
              </div>
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/10 text-emerald-300">
              SQL
            </span>
          </div>

          {/* Sidebar Embedded Search (like ⌘+F in reference) */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
              placeholder="Buscar atleta..."
              className="w-full pl-9 pr-11 py-2.5 text-xs bg-white/[0.06] hover:bg-white/[0.09] focus:bg-white/[0.12] rounded-xl border border-white/[0.08] focus:border-emerald-400/40 outline-none text-white placeholder:text-white/40 transition-all"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/50 hover:text-white"
              >
                Limpar
              </button>
            ) : (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/40 bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/10">
                ⌘F
              </span>
            )}

            {/* Quick Jump Dropdown */}
            {searchFocused && quickSearchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-[#12281F] border border-white/15 rounded-2xl shadow-2xl py-1.5 z-50 backdrop-blur-xl">
                {quickSearchResults.map((athlete) => (
                  <button
                    key={athlete.id}
                    onMouseDown={() => {
                      router.push(`/atleta/${athlete.id}`);
                      setSearchFocused(false);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-white/10 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="truncate pr-2">
                      <p className="font-medium text-white truncate">{athlete.name}</p>
                      <p className="text-[10px] text-white/50">{athlete.mainSport}</p>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-emerald-300 shrink-0">
                      {athlete.functional.hopTestLSI}%
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Primary Navigation */}
          <div className="space-y-1.5">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-white/35">
              Navegação
            </p>
            <nav className="space-y-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all',
                  pathname === '/'
                    ? 'bg-white/[0.11] text-white border border-white/[0.08] shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                )}
              >
                <div className="flex items-center gap-3">
                  <LayoutGrid className="w-4 h-4 opacity-80" />
                  <span>Dashboard</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/80">
                  {athletes.length}
                </span>
              </Link>

              <Link
                href="/avaliacao/nova"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all',
                  pathname?.startsWith('/avaliacao')
                    ? 'bg-white/[0.11] text-white border border-white/[0.08] shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                )}
              >
                <div className="flex items-center gap-3">
                  <ClipboardPlus className="w-4 h-4 opacity-80" />
                  <span>Nova Avaliação</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#22C55E]/20 text-[#4ADE80] font-semibold">
                  APP
                </span>
              </Link>
            </nav>
          </div>

          {/* Athletes Roster in Sidebar */}
          <div className="space-y-2 pt-2">
            <div className="px-3 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">
                Prontuários Ativos
              </p>
              {highRiskCount > 0 && (
                <span className="text-[10px] text-amber-300/90 font-medium">
                  {highRiskCount} alerta
                </span>
              )}
            </div>

            <div className="space-y-1">
              {athletes.map((athlete) => {
                const isActive = pathname === `/atleta/${athlete.id}`;
                const risk = athlete.clinicalSummary.riskLevel;
                return (
                  <Link
                    key={athlete.id}
                    href={`/atleta/${athlete.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all',
                      isActive
                        ? 'bg-white/[0.11] text-white font-semibold border border-white/[0.08]'
                        : 'text-white/65 hover:text-white hover:bg-white/[0.05]'
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full shrink-0',
                          risk === 'Alto'
                            ? 'bg-rose-400'
                            : risk === 'Moderado'
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        )}
                      />
                      <span className="truncate">{athlete.name}</span>
                    </div>
                    <span className="text-[11px] text-white/40 font-mono">
                      {athlete.functional.hopTestLSI}%
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Actions & User Account */}
        <div className="relative z-10 p-5 border-t border-white/[0.07] space-y-4">
          <button
            onClick={handleRestoreDemo}
            disabled={isMutating}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-white/65 hover:text-white hover:bg-white/[0.06] transition-all disabled:opacity-50"
            title="Restaura os 3 atletas padrão no SQLite"
          >
            <span className="flex items-center gap-2.5">
              {isMutating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5 opacity-75" />
              )}
              <span>Restaurar Seed SQL</span>
            </span>
          </button>

          {showRestoreToast && (
            <div className="text-[11px] text-center py-1.5 px-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Banco SQLite restaurado
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#1C3B2E] border border-white/15 flex items-center justify-center text-xs font-semibold text-emerald-300">
                FT
              </div>
              <div>
                <p className="text-xs font-medium text-white leading-tight">
                  Equipe Fisioterapia
                </p>
                <p className="text-[10px] text-white/40">prisma/dev.db</p>
              </div>
            </div>
            <SlidersHorizontal className="w-3.5 h-3.5 text-white/40" />
          </div>
        </div>
      </aside>

      {/* Main Rounded Canvas Container (Exact match to reference images) */}
      <div className="flex-1 bg-[#F4F7F5] lg:rounded-[30px] flex flex-col min-w-0 overflow-hidden shadow-2xl print:bg-white print:rounded-none print:shadow-none">
        {/* Mobile Top Bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3.5 bg-white/80 backdrop-blur-md border-b border-[#E6ECE8] print:hidden">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl text-[#0F241C] hover:bg-neutral-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm text-[#0F241C]">FisioTrack</span>
          <Link
            href="/avaliacao/nova"
            className="px-3 py-1.5 rounded-xl bg-[#0F241C] text-white text-xs font-medium"
          >
            + Avaliar
          </Link>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-5 sm:p-8 max-w-[1360px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
