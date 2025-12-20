import React, { useMemo } from "react";
import { extractResults } from "../helpers";
import styles from "./Table.module.css";

export default function Table({ results }) {
  const r = extractResults(results);

  // Group entities by type
  const entitiesByType = useMemo(() => {
    const grouped = {};
    r.entities.forEach(entity => {
      const type = entity.eType;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(entity);
    });
    return grouped;
  }, [r.entities]);

  // Get all unique property keys for each type
  const propertyKeysByType = useMemo(() => {
    const keysByType = {};
    Object.entries(entitiesByType).forEach(([type, entities]) => {
      const allKeys = new Set();
      entities.forEach(entity => {
        if (entity.properties) {
          Object.keys(entity.properties).forEach(key => allKeys.add(key));
        }
      });
      keysByType[type] = Array.from(allKeys).sort();
    });
    return keysByType;
  }, [entitiesByType]);

  return (
    <div className={styles.tableContainer}>
      {Object.entries(entitiesByType).map(([type, entities]) => {
        const propertyKeys = propertyKeysByType[type] || [];

        return (
          <div key={type} className={styles.typeSection}>
            <h3 className={styles.typeHeader}>{type} ({entities.length})</h3>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>ID</th>
                    {propertyKeys.map(key => (
                      <th key={key} className={styles.th}>
                        {type}.{key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entities.map((entity, idx) => (
                    <tr key={entity.eID} className={styles.tr}>
                      <td className={styles.td}>{entity.eID}</td>
                      {propertyKeys.map(key => (
                        <td key={key} className={styles.td}>
                          {entity.properties && entity.properties[key] !== undefined
                            ? String(entity.properties[key])
                            : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {r.entities.length === 0 && (
        <div className={styles.emptyState}>No results to display</div>
      )}
    </div>
  );
}
