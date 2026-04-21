// features/translator/DirectionToggle.tsx
"use client";

import type { Direction } from "./types";
import { DIRECTION_CONFIG } from "./types";

interface Props {
  direction: Direction;
  onToggle: () => void;
  disabled?: boolean;
}

export default function DirectionToggle({ direction, onToggle, disabled }: Props) {
  const cfg = DIRECTION_CONFIG[direction];

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={`Направление: ${cfg.label}. Нажмите для смены.`}
      className="direction-toggle"
    >
      {/* Source */}
      <div className="direction-lang direction-lang-left">
        <span className="direction-flag">{cfg.flagFrom}</span>
        <span className="direction-name">{cfg.source}</span>
      </div>

      {/* Arrow */}
      <div className="direction-arrow-wrap">
        <div className="direction-arrow">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </div>
        <span className="direction-label">{cfg.label.replace(/ /g, "")}</span>
      </div>

      {/* Target */}
      <div className="direction-lang direction-lang-right">
        <span className="direction-name">{cfg.target}</span>
        <span className="direction-flag">{cfg.flagTo}</span>
      </div>
    </button>
  );
}
