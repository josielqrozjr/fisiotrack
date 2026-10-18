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
        (!side ||
          inj.side === side ||
          inj.side === 'Bilateral' ||
          inj.side === 'N/A')
    );
  };

  const getRegionColor = (region: BodyRegion, side?: BodySide) => {
    const isSelected =
      selectedRegion === region &&
      (!side || selectedSide === side || selectedSide === 'Bilateral');
    const injured = hasInjuryIn(region, side);

    if (isSelected) {
      return 'fill-[#22C55E] stroke-white stroke-[2.5px] drop-shadow-[0_0_12px_rgba(34,197,94,0.85)]';
    }
    if (injured) {
      return 'fill-[#E05A47]/90 stroke-white/80 stroke-[2px] drop-shadow-[0_0_8px_rgba(224,90,71,0.65)]';
    }
    return 'fill-white/15 hover:fill-[#22C55E]/70 stroke-white/30 stroke-[1.2px] transition-all cursor-pointer';
  };

  return (
    <div className="relative overflow-hidden bg-[#0B1913] text-white rounded-[24px] p-6 border border-[#1B382C] flex flex-col items-center justify-between">
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#22C55E]/15 blur-3xl pointer-events-none" />

      <div className="w-full flex items-center justify-between relative z-10 mb-2">
        <div>
          <p className="text-[11px] font-medium text-emerald-400">
            Mapeamento Anatômico
          </p>
          <h3 className="text-sm font-semibold text-white">
            Selecione a articulação no modelo
          </h3>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.08] text-white/80 border border-white/10">
          Vista Anterior
        </span>
      </div>

      {/* Labels Lado Direito / Esquerdo Anatômico */}
      <div className="w-full flex justify-between px-4 text-[11px] font-medium text-white/45 mt-1 relative z-10">
        <span>Direito (D)</span>
        <span>Esquerdo (E)</span>
      </div>

      {/* SVG Human Figure */}
      <div className="relative z-10 w-full max-w-[235px] my-1 flex items-center justify-center">
        <svg
          viewBox="0 0 240 430"
          className="w-full h-auto select-none"
          aria-label="Mapa Corporal de Fisioterapia"
        >
          {/* Reference Lines */}
          <line
            x1="120"
            y1="10"
            x2="120"
            y2="415"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* Base Body Silhouette */}
          <g className="fill-white/[0.05] stroke-white/20 stroke-[1.2]">
            <circle cx="120" cy="40" r="24" />
            <rect x="111" y="62" width="18" height="16" rx="4" />
            <path d="M84,78 L156,78 L148,195 L92,195 Z" />
            <path d="M66,86 L84,82 L76,185 L58,185 Z" />
            <path d="M156,82 L174,86 L182,185 L164,185 Z" />
            <path d="M92,212 L117,212 L113,300 L90,300 Z" />
            <path d="M123,212 L148,212 L150,300 L127,300 Z" />
            <path d="M91,310 L112,310 L108,388 L93,388 Z" />
            <path d="M128,310 L149,310 L147,388 L132,388 Z" />
          </g>

          {/* 1. OMBRO DIREITO */}
          <g onClick={() => onSelectRegionAndSide('Ombro', 'Direito')}>
            <circle
              cx="77"
              cy="90"
              r="15"
              className={getRegionColor('Ombro', 'Direito')}
            />
            <title>Ombro Direito</title>
          </g>

          {/* 1b. OMBRO ESQUERDO */}
          <g onClick={() => onSelectRegionAndSide('Ombro', 'Esquerdo')}>
            <circle
              cx="163"
              cy="90"
              r="15"
              className={getRegionColor('Ombro', 'Esquerdo')}
            />
            <title>Ombro Esquerdo</title>
          </g>

          {/* 2. COLUNA */}
          <g onClick={() => onSelectRegionAndSide('Coluna', 'N/A')}>
            <rect
              x="109"
              y="84"
              width="22"
              height="96"
              rx="10"
              className={getRegionColor('Coluna')}
            />
            <title>Coluna Vertebral</title>
          </g>

          {/* 3. COTOVELO / PUNHO DIREITO */}
          <g onClick={() => onSelectRegionAndSide('Cotovelo/Punho', 'Direito')}>
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
          <g onClick={() => onSelectRegionAndSide('Cotovelo/Punho', 'Esquerdo')}>
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
          <g onClick={() => onSelectRegionAndSide('Quadril', 'Direito')}>
            <path
              d="M88,192 L119,192 L119,220 L88,216 Z"
              className={getRegionColor('Quadril', 'Direito')}
            />
            <title>Quadril Direito</title>
          </g>

          {/* 4b. QUADRIL ESQUERDO */}
          <g onClick={() => onSelectRegionAndSide('Quadril', 'Esquerdo')}>
            <path
              d="M121,192 L152,192 L152,216 L121,220 Z"
              className={getRegionColor('Quadril', 'Esquerdo')}
            />
            <title>Quadril Esquerdo</title>
          </g>

          {/* 5. MUSCULAR / COXA DIREITA */}
          <g
            onClick={() => onSelectRegionAndSide('Muscular/Outros', 'Direito')}
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
          <g onClick={() => onSelectRegionAndSide('Joelho', 'Direito')}>
            <circle
              cx="102"
              cy="302"
              r="15"
              className={getRegionColor('Joelho', 'Direito')}
            />
            <title>Joelho Direito</title>
          </g>

          {/* 6b. JOELHO ESQUERDO */}
          <g onClick={() => onSelectRegionAndSide('Joelho', 'Esquerdo')}>
            <circle
              cx="138"
              cy="302"
              r="15"
              className={getRegionColor('Joelho', 'Esquerdo')}
            />
            <title>Joelho Esquerdo</title>
          </g>

          {/* 7. TORNOZELO / PÉ DIREITO */}
          <g onClick={() => onSelectRegionAndSide('Tornozelo/Pé', 'Direito')}>
            <path
              d="M89,378 L111,378 L114,412 L82,412 Z"
              className={getRegionColor('Tornozelo/Pé', 'Direito')}
            />
            <title>Tornozelo / Pé Direito</title>
          </g>

          {/* 7b. TORNOZELO / PÉ ESQUERDO */}
          <g onClick={() => onSelectRegionAndSide('Tornozelo/Pé', 'Esquerdo')}>
            <path
              d="M129,378 L151,378 L158,412 L126,412 Z"
              className={getRegionColor('Tornozelo/Pé', 'Esquerdo')}
            />
            <title>Tornozelo / Pé Esquerdo</title>
          </g>
        </svg>
      </div>

      {/* Glassmorphic Region Selector Footer */}
      <div className="w-full glass-dark rounded-2xl p-3.5 space-y-2.5 mt-2 relative z-10">
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
                    region === 'Coluna'
                      ? 'N/A'
                      : selectedSide === 'N/A'
                      ? 'Direito'
                      : selectedSide
                  )
                }
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5',
                  active
                    ? 'bg-[#22C55E] text-[#0B1913] font-semibold'
                    : injured
                    ? 'bg-[#E05A47]/25 text-white border border-[#E05A47]/40'
                    : 'bg-white/[0.06] text-white/70 hover:bg-white/15'
                )}
              >
                {injured && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E05A47]" />
                )}
                <span>{region}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
