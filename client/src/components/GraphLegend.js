import React from "react";
import styles from "./Force.module.css";

// One chip per entity type with its colour and node count. Clicking a chip hides or shows
// that type in the graph.
export default function GraphLegend({ items, hidden, onToggle }) {
  if (!items || items.length === 0) return null;
  return (
    <div className={styles.legend} role="group" aria-label="Entity types">
      {items.map(({ type, count, color }) => {
        const isHidden = hidden.has(type);
        return (
          <button
            key={type}
            type="button"
            className={styles.legendChip}
            data-hidden={isHidden}
            aria-pressed={!isHidden}
            title={isHidden ? `Show ${type}` : `Hide ${type}`}
            onClick={() => onToggle(type)}
          >
            <span className={styles.legendSwatch} style={{ background: color }} aria-hidden="true" />
            <span className={styles.legendType}>{type}</span>
            <span className={styles.legendCount}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}
