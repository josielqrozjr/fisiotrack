'use client';

import React from 'react';
import { BodyRegion, BodySide, InjuryRecord } from '@/types/fisiotrack';
import { cn } from '@/lib/utils';

interface InteractiveBodyMapProps {
  selectedRegion: BodyRegion;
  selectedSide: BodySide;
  onSelectRegionAndSide: (region: BodyRegion, side?: BodySide) => void;
  existingInjuries?: InjuryRecord[];
}

const ALL_REGIONS: BodyRegion[] = [
  'Ombro',
  'Cotovelo/Punho',
  'Coluna',
  'Quadril',
  'Joelho',
  'Tornozelo/Pé',
  'Muscular/Outros',
];

export function InteractiveBodyMap({
  selectedRegion,
  selectedSide,
  onSelectRegionAndSide,
  existingInjuries = [],
}: InteractiveBodyMapProps) {
  const hasInjuryIn = (region: BodyRegion, side?: BodySide) => {
    return existingInjuries.some(
      (inj) =>
        inj.bodyRegion === region &&
        (!side || inj.side === side || inj.side === 'Bilateral' || inj.side === 'N/A')
    );
  };

  const getRegionColor = (region: BodyRegion, side?: BodySide) => {
    const isSelected =
      selectedRegion === region &&
      (!side || selectedSide === side || selectedSide === 'Bilateral');
    const injured = hasInjuryIn(region, side);

    if (isSelected) {
      return 'fill-teal-500 stroke-teal-200 stroke-[3px] drop-shadow-[0_0_10px_rgba(20,184,166,0.75)]';
    }
    if (injured) {
      return 'fill-rose-500/85 stroke-rose-200 stroke-[2.5px] drop-shadow-[0_0_8px_rgba(244,63,94,0.65)]';
    }
    return 'fill-slate-700/80 hover:fill-teal-400/80 stroke-slate-500 stroke-[1.5px] transition-all cursor-pointer';
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-col items-center justify-between shadow-inner">
      <div className="w-full flex items-center justify-between mb-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">
            Mapa Anatômico Interativo
          </span>
          <p className="text-xs text-slate-400">
            Clique na articulação/segmento para preencher região e lado
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 text-teal-300 border border-slate-700 font-medium">
          Vista Anterior (Espelhada)
        </span>
      </div>

      {/* Labels Lado Direito / Esquerdo Anatômico */}
      <div className="w-full flex justify-between px-6 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-1">
        <span className="text-teal-400/90">Lado Direito (D)</span>
        <span className="text-teal-400/90">Lado Esquerdo (E)</span>
      </div>

      {/* SVG Human Figure */}
      <div className="relative w-full max-w-[250px] my-1 flex items-center justify-center">
        <svg
          viewBox="0 0 240 430"
          className="w-full h-auto select-none"
          aria-label="Mapa Corporal de Fisioterapia"
        >
          {/* Background Grid / Posture Reference Lines */}
          <line
            x1="120"
            y1="10"
            x2="120"
            y2="415"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <line
            x1="35"
            y1="92"
            x2="205"
            y2="92"
            stroke="#1e293b"
            strokeWidth="1"
          />
          <line
            x1="35"
            y1="210"
            x2="205"
            y2="210"
            stroke="#1e293b"
            strokeWidth="1"
          />

          {/* Base Body Silhouette */}
          <g className="fill-slate-800/90 stroke-slate-600 stroke-[1.5]">
            {/* Head & Neck */}
            <circle cx="120" cy="40" r="24" />
            <rect x="111" y="62" width="18" height="16" rx="4" />

            {/* Torso */}
            <path d="M84,78 L156,78 L148,195 L92,195 Z" />

            {/* Arms */}
            <path d="M66,86 L84,82 L76,185 L58,185 Z" />
            <path d="M156,82 L174,86 L182,185 L164,185 Z" />

            {/* Thighs */}
            <path d="M92,212 L117,212 L113,300 L90,300 Z" />
            <path d="M123,212 L148,212 L150,300 L127,300 Z" />

            {/* Lower Legs */}
            <path d="M91,310 L112,310 L108,388 L93,388 Z" />
            <path d="M128,310 L149,310 L147,388 L132,388 Z" />
          </g>

          {/* INTERACTIVE HOTSPOTS */}

          {/* 1. OMBRO DIREITO (Left side of viewer) */}
          <g
            onClick={() => onSelectRegionAndSide('Ombro', 'Direito')}
            className="group cursor-pointer"
          >
            <circle
              cx="77"
              cy="90"
              r="15"
              className={getRegionColor('Ombro', 'Direito')}
            />
            <title>Ombro Direito</title>
          </g>

          {/* 1b. OMBRO ESQUERDO (Right side of viewer) */}
          <g
            onClick={() => onSelectRegionAndSide('Ombro', 'Esquerdo')}
            className="group cursor-pointer"
          >
            <circle
              cx="163"
              cy="90"
              r="15"
              className={getRegionColor('Ombro', 'Esquerdo')}
            />
            <title>Ombro Esquerdo</title>
          </g>

          {/* 2. COLUNA (Central Spine) */}
          <g
            onClick={() => onSelectRegionAndSide('Coluna', 'N/A')}
            className="group cursor-pointer"
          >
            <rect
              x="109"
              y="84"
              width="22"
              height="96"
              rx="10"
              className={getRegionColor('Coluna')}
            />
            <title>Coluna Vertebral (Cervical / Torácica / Lombar)</title>
          </g>

          {/* 3. COTOVELO / PUNHO DIREITO */}
          <g
            onClick={() => onSelectRegionAndSide('Cotovelo/Punho', 'Direito')}
            className="group cursor-pointer"
          >
            <rect
              x="56"
              y="132"
              width="22"
              height="56"
              rx="9"
              className={getRegionColor('Cotovelo/Punho', 'Direito')}
            />
            <title>Cotovelo / Punho Direito</title>
          </g>

          {/* 3b. COTOVELO / PUNHO ESQUERDO */}
          <g
            onClick={() => onSelectRegionAndSide('Cotovelo/Punho', 'Esquerdo')}
            className="group cursor-pointer"
          >
            <rect
              x="162"
              y="132"
              width="22"
              height="56"
              rx="9"
              className={getRegionColor('Cotovelo/Punho', 'Esquerdo')}
            />
            <title>Cotovelo / Punho Esquerdo</title>
          </g>

          {/* 4. QUADRIL DIREITO */}
          <g
            onClick={() => onSelectRegionAndSide('Quadril', 'Direito')}
            className="group cursor-pointer"
          >
            <path
              d="M88,192 L119,192 L119,220 L88,216 Z"
              className={getRegionColor('Quadril', 'Direito')}
            />
            <title>Quadril Direito</title>
          </g>

          {/* 4b. QUADRIL ESQUERDO */}
          <g
            onClick={() => onSelectRegionAndSide('Quadril', 'Esquerdo')}
            className="group cursor-pointer"
          >
            <path
              d="M121,192 L152,192 L152,216 L121,220 Z"
              className={getRegionColor('Quadril', 'Esquerdo')}
            />
            <title>Quadril Esquerdo</title>
          </g>

          {/* 5. MUSCULAR / COXA DIREITA */}
          <g
            onClick={() => onSelectRegionAndSide('Muscular/Outros', 'Direito')}
            className="group cursor-pointer"
          >
            <rect
              x="91"
              y="226"
              width="23"
              height="54"
              rx="8"
              className={getRegionColor('Muscular/Outros', 'Direito')}
            />
            <title>Muscular / Outros (Direito)</title>
          </g>

          {/* 5b. MUSCULAR / COXA ESQUERDA */}
          <g
            onClick={() => onSelectRegionAndSide('Muscular/Outros', 'Esquerdo')}
            className="group cursor-pointer"
          >
            <rect
              x="126"
              y="226"
              width="23"
              height="54"
              rx="8"
              className={getRegionColor('Muscular/Outros', 'Esquerdo')}
            />
            <title>Muscular / Outros (Esquerdo)</title>
          </g>

          {/* 6. JOELHO DIREITO */}
          <g
            onClick={() => onSelectRegionAndSide('Joelho', 'Direito')}
            className="group cursor-pointer"
          >
            <circle
              cx="102"
              cy="302"
              r="15"
              className={getRegionColor('Joelho', 'Direito')}
            />
            <title>Joelho Direito</title>
          </g>

          {/* 6b. JOELHO ESQUERDO */}
          <g
            onClick={() => onSelectRegionAndSide('Joelho', 'Esquerdo')}
            className="group cursor-pointer"
          >
            <circle
              cx="138"
              cy="302"
              r="15"
              className={getRegionColor('Joelho', 'Esquerdo')}
            />
            <title>Joelho Esquerdo</title>
          </g>

          {/* 7. TORNOZELO / PÉ DIREITO */}
          <g
            onClick={() => onSelectRegionAndSide('Tornozelo/Pé', 'Direito')}
            className="group cursor-pointer"
          >
            <path
              d="M89,378 L111,378 L114,412 L82,412 Z"
              className={getRegionColor('Tornozelo/Pé', 'Direito')}
            />
            <title>Tornozelo / Pé Direito</title>
          </g>

          {/* 7b. TORNOZELO / PÉ ESQUERDO */}
          <g
            onClick={() => onSelectRegionAndSide('Tornozelo/Pé', 'Esquerdo')}
            className="group cursor-pointer"
          >
            <path
              d="M129,378 L151,378 L158,412 L126,412 Z"
              className={getRegionColor('Tornozelo/Pé', 'Esquerdo')}
            />
            <title>Tornozelo / Pé Esquerdo</title>
          </g>
        </svg>
      </div>

      {/* Quick Pills Selector Below SVG */}
      <div className="w-full space-y-2 mt-2 pt-3 border-t border-slate-800">
        <div className="flex flex-wrap gap-1.5 justify-center">
          {ALL_REGIONS.map((region) => {
            const active = selectedRegion === region;
            const injured = hasInjuryIn(region);
            return (
              <button
                key={region}
                type="button"
                onClick={() =>
                  onSelectRegionAndSide(
                    region,
                    region === 'Coluna' ? 'N/A' : selectedSide === 'N/A' ? 'Direito' : selectedSide
                  )
                }
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border',
                  active
                    ? 'bg-teal-500 text-white border-teal-400 shadow-sm'
                    : injured
                    ? 'bg-rose-950/70 text-rose-200 border-rose-700/70 hover:bg-rose-900/60'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                )}
              >
                {injured && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />}
                <span>{region}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" /> Selecionado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Lesão registrada
          </span>
        </div>
      </div>
    </div>
  );
}
