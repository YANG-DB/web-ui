import React, { useEffect, useMemo, useRef, useState } from "react";
import { buildNodeTable, filterRows } from "../helpers/nodeTable";
import styles from "./Force.module.css";

// Rows rendered at most; filtering narrows the rest.
export const MAX_ROWS = 500;

// Scrolls `container` (only) so `row` is visible below the sticky header of height
// `headerHeight`. scrollIntoView would also scroll the page and every other ancestor.
export function scrollRowIntoView(container, row, headerHeight = 0) {
  if (!container || !row) return;
  const top = row.offsetTop;
  const bottom = top + row.offsetHeight;
  const viewTop = container.scrollTop + headerHeight;
  const viewBottom = container.scrollTop + container.clientHeight;
  if (top < viewTop) container.scrollTop = top - headerHeight;
  else if (bottom > viewBottom) container.scrollTop = bottom - container.clientHeight;
}

// The visible graph nodes as a table under the graph, with a filter per column. Clicking a
// row (or Enter/Space on it) selects that node in the graph; the node selected in the graph
// is highlighted here and scrolled into view.
export default function NodeTable({ nodes, selectedId, onSelect, colors }) {
  const [filters, setFilters] = useState({});
  const { columns, rows } = useMemo(() => buildNodeTable(nodes), [nodes]);
  const filtered = useMemo(() => filterRows(rows, filters), [rows, filters]);
  const shown = filtered.slice(0, MAX_ROWS);
  const selectedRow = useRef(null);
  const scrollRef = useRef(null);
  const headRef = useRef(null);

  useEffect(() => {
    scrollRowIntoView(scrollRef.current, selectedRow.current, headRef.current ? headRef.current.offsetHeight : 0);
  }, [selectedId]);

  const setFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const anyFilter = Object.values(filters).some(v => v && v.trim() !== "");

  return (
    <div className={styles.nodeTable} role="region" aria-label="Nodes table">
      <div className={styles.nodeTableBar}>
        <span>
          {filtered.length === rows.length
            ? `${rows.length} node${rows.length === 1 ? "" : "s"}`
            : `${filtered.length} of ${rows.length} nodes`}
          {filtered.length > MAX_ROWS && ` · showing the first ${MAX_ROWS}, filter to narrow`}
        </span>
        {anyFilter && (
          <button type="button" className={styles.toolbarButton} onClick={() => setFilters({})}>
            Clear filters
          </button>
        )}
      </div>
      <div className={styles.nodeTableScroll} ref={scrollRef}>
        <table className={styles.nodeTableGrid}>
          <thead ref={headRef}>
            <tr>
              {columns.map(col => (
                <th key={col.key} scope="col">
                  {col.label}
                </th>
              ))}
            </tr>
            <tr className={styles.nodeTableFilters}>
              {columns.map(col => (
                <th key={col.key}>
                  <input
                    type="search"
                    value={filters[col.key] || ""}
                    onChange={e => setFilter(col.key, e.target.value)}
                    placeholder={col.numeric ? "e.g. > 2" : "Filter"}
                    aria-label={`Filter ${col.label}`}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map(row => {
              const selected = row.id === selectedId;
              return (
                <tr
                  key={row.id}
                  ref={selected ? selectedRow : null}
                  className={styles.nodeTableRow}
                  aria-selected={selected}
                  tabIndex={0}
                  onClick={() => onSelect(row.id)}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(row.id);
                    }
                  }}
                >
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.key === "type" ? (
                        <span className={styles.nodeTableType}>
                          <span
                            className={styles.legendSwatch}
                            style={{ background: colors && colors[row.cells.type] }}
                            aria-hidden="true"
                          />
                          {row.cells.type}
                        </span>
                      ) : (
                        row.cells[col.key]
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
            {shown.length === 0 && (
              <tr>
                <td colSpan={columns.length} className={styles.nodeTableEmpty}>
                  {rows.length === 0 ? "No visible nodes." : "No node matches these filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
