'use client';

import React from 'react';

export interface VibeDimensions {
  communication: number; // scale 1-5
  humor: number;
  curiosity: number;
  adventure: number;
  openness: number;
  lifestyle: number;
  values: number;
  energy: number;
  conflict: number;
  spontaneity: number;
}

interface VibeGraphProps {
  scores: VibeDimensions;
  comparisonScores?: VibeDimensions;
  userName?: string;
  comparisonName?: string;
  size?: number;
}

const DIMENSIONS_LIST = [
  { key: 'communication', label: 'COMM' },
  { key: 'humor', label: 'HUMOR' },
  { key: 'curiosity', label: 'CURIOUS' },
  { key: 'adventure', label: 'ADVENTURE' },
  { key: 'openness', label: 'OPENNESS' },
  { key: 'lifestyle', label: 'LIFESTYLE' },
  { key: 'values', label: 'VALUES' },
  { key: 'energy', label: 'ENERGY' },
  { key: 'conflict', label: 'CONFLICT' },
  { key: 'spontaneity', label: 'SPONTAN' },
] as const;

export function VibeGraph({
  scores,
  comparisonScores,
  userName = 'You',
  comparisonName = 'Match',
  size = 280
}: VibeGraphProps) {
  const cx = size / 2;
  const cy = size / 2;
  const rMax = (size / 2) - 45; // Leave space for labels

  const getCoordinates = (scoresObj: VibeDimensions) => {
    return DIMENSIONS_LIST.map((dim, index) => {
      const value = scoresObj[dim.key] || 3;
      const angle = (index * 2 * Math.PI) / 10 - Math.PI / 2;
      const r = (value / 5) * rMax;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return { x, y };
    });
  };

  const myCoords = getCoordinates(scores);
  const myPointsPath = myCoords.map(c => `${c.x},${c.y}`).join(' ');

  const partnerCoords = comparisonScores ? getCoordinates(comparisonScores) : null;
  const partnerPointsPath = partnerCoords ? partnerCoords.map(c => `${c.x},${c.y}`).join(' ') : '';

  // Decagon Ring points for grid levels (1 to 5)
  const getGridPoints = (level: number) => {
    return DIMENSIONS_LIST.map((_, index) => {
      const angle = (index * 2 * Math.PI) / 10 - Math.PI / 2;
      const r = (level / 5) * rMax;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div className="flex flex-col items-center select-none font-mono w-full">
      <svg 
        viewBox={`0 0 ${size} ${size}`} 
        className="w-full max-w-[280px] aspect-square overflow-visible"
      >
        {/* Background Grid Rings (concentric decagons) */}
        {[1, 2, 3, 4, 5].map((level) => (
          <polygon
            key={level}
            points={getGridPoints(level)}
            fill="none"
            stroke="#E8E8EC"
            strokeWidth={1}
          />
        ))}

        {/* Radial lines */}
        {DIMENSIONS_LIST.map((dim, index) => {
          const angle = (index * 2 * Math.PI) / 10 - Math.PI / 2;
          const xOuter = cx + rMax * Math.cos(angle);
          const yOuter = cy + rMax * Math.sin(angle);
          
          // Label offset position
          const xLabel = cx + (rMax + 20) * Math.cos(angle);
          const yLabel = cy + (rMax + 20) * Math.sin(angle);

          return (
            <g key={dim.key}>
              <line
                x1={cx}
                y1={cy}
                x2={xOuter}
                y2={yOuter}
                stroke="#E8E8EC"
                strokeWidth={1}
              />
              <text
                x={xLabel}
                y={yLabel}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[9px] font-bold fill-dark uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                {dim.label}
              </text>
            </g>
          );
        })}

        {/* User Polygon Area (Lavender AI Color) */}
        <polygon
          points={myPointsPath}
          fill="rgba(124, 122, 230, 0.12)"
          stroke="#7C7AE6"
          strokeWidth={1.5}
        />

        {/* Comparison Overlay Polygon (Primary Pink-Red Color) */}
        {partnerCoords && (
          <polygon
            points={partnerPointsPath}
            fill="rgba(214, 51, 108, 0.08)"
            stroke="#D6336C"
            strokeWidth={1.5}
            strokeDasharray="3,3"
          />
        )}

        {/* Central Origin Dot */}
        <circle cx={cx} cy={cy} r={2.5} fill="#1C1C1E" />
      </svg>

      {/* Dynamic legend */}
      {comparisonScores && (
        <div className="flex justify-center gap-6 mt-2 text-[10px] uppercase font-bold tracking-widest">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 border border-[#7C7AE6] bg-[rgba(124,122,230,0.12)] inline-block" />
            <span className="text-gray-400">{userName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 border border-dashed border-[#D6336C] bg-[rgba(214,51,108,0.08)] inline-block" />
            <span className="text-gray-400">{comparisonName}</span>
          </div>
        </div>
      )}
    </div>
  );
}
