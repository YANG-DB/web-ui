import React, { useEffect, useRef } from "react";
import { propertyRows } from "../helpers/elementDetails";
import styles from "./Force.module.css";

// Right-hand panel for the selected node or edge: type, name, id, properties, and actions.
//
// details: {
//   kind: "node" | "edge", id, type, name, color,
//   node:  rawId, degree, expanded
//   edge:  source: {id, name}, target: {id, name}, directional
//   properties: [{pType, value}]
// }
export default function DetailsPanel({ details, expanding, error, onClose, onExpand, onHide, onSelectNode }) {
  const closeRef = useRef(null);
  const detailsId = details ? details.id : null;

  // Move focus into the panel when it opens on a new element, and close on Escape.
  useEffect(() => {
    if (closeRef.current) closeRef.current.focus();
  }, [detailsId]);

  useEffect(() => {
    if (!detailsId) return undefined;
    const onKey = e => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, detailsId]);

  if (!details) return null;
  const rows = propertyRows(details.properties);
  const isNode = details.kind === "node";

  return (
    <aside className={styles.details} aria-label={`${isNode ? "Node" : "Relationship"} details`}>
      <div className={styles.detailsHeader}>
        <span className={styles.detailsType}>
          {isNode && <span className={styles.legendSwatch} style={{ background: details.color }} aria-hidden="true" />}
          {isNode ? details.type : `${details.type} relationship`}
        </span>
        <button ref={closeRef} type="button" className={styles.detailsClose} onClick={onClose} aria-label="Close details">
          ×
        </button>
      </div>

      <h3 className={styles.detailsTitle}>{details.name}</h3>

      <dl className={styles.detailsMeta}>
        {isNode ? (
          <>
            <dt>ID</dt>
            <dd>{String(details.rawId)}</dd>
            <dt>Relationships</dt>
            <dd>{details.degree} in this graph</dd>
          </>
        ) : (
          <>
            <dt>From</dt>
            <dd>
              <button type="button" className={styles.linkButton} onClick={() => onSelectNode(details.source.id)}>
                {details.source.name}
              </button>
            </dd>
            <dt>To</dt>
            <dd>
              <button type="button" className={styles.linkButton} onClick={() => onSelectNode(details.target.id)}>
                {details.target.name}
              </button>
            </dd>
            <dt>Direction</dt>
            <dd>{details.directional ? "From → To" : "Either way"}</dd>
          </>
        )}
      </dl>

      <div className={styles.detailsActions}>
        {isNode && (
          <button
            type="button"
            className={styles.detailsPrimary}
            onClick={onExpand}
            disabled={expanding}
          >
            {expanding ? "Expanding…" : details.expanded ? "Collapse neighbors" : "Expand neighbors"}
          </button>
        )}
        <button type="button" className={styles.detailsSecondary} onClick={onHide}>
          Hide
        </button>
      </div>
      {error && <p className={styles.detailsError} role="alert">{error}</p>}

      <h4 className={styles.detailsSection}>Properties</h4>
      {rows.length === 0 ? (
        <p className={styles.detailsEmpty}>No properties.</p>
      ) : (
        <table className={styles.detailsTable}>
          <tbody>
            {rows.map(row => (
              <tr key={row.name}>
                <th scope="row">{row.name}</th>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </aside>
  );
}
