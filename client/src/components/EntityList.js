import React, { useMemo } from "react";
import { extractResults } from "../helpers";
import styles from "./EntityList.module.css";

export default function EntityList({ results }) {
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

  // Sort types alphabetically
  const sortedTypes = useMemo(() => {
    return Object.keys(entitiesByType).sort();
  }, [entitiesByType]);

  const renderPropertyValue = (value) => {
    if (value === null || value === undefined) {
      return <span className={styles.nullValue}>null</span>;
    }
    if (typeof value === 'boolean') {
      return <span className={styles.boolValue}>{String(value)}</span>;
    }
    if (typeof value === 'number') {
      return <span className={styles.numberValue}>{value}</span>;
    }
    return <span className={styles.stringValue}>{String(value)}</span>;
  };

  return (
    <div className={styles.listContainer}>
      {sortedTypes.map(type => {
        const entities = entitiesByType[type];

        return (
          <div key={type} className={styles.typeSection}>
            <div className={styles.typeHeader}>
              <span className={styles.typeName}>{type}</span>
              <span className={styles.typeCount}>{entities.length}</span>
            </div>

            <div className={styles.entitiesList}>
              {entities.map(entity => (
                <div key={entity.eID} className={styles.entityCard}>
                  <div className={styles.entityHeader}>
                    <span className={styles.entityId}>{entity.eID}</span>
                    {entity.eTag && (
                      <span className={styles.entityTag}>
                        {Array.isArray(entity.eTag) ? entity.eTag.join(', ') : String(entity.eTag)}
                      </span>
                    )}
                  </div>

                  {entity.properties && Object.keys(entity.properties).length > 0 && (
                    <div className={styles.propertiesGrid}>
                      {Object.entries(entity.properties).map(([key, value]) => (
                        <div key={key} className={styles.property}>
                          <span className={styles.propertyKey}>{key}:</span>
                          <span className={styles.propertyValue}>
                            {renderPropertyValue(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {r.entities.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📊</div>
          <div>No entities to display</div>
        </div>
      )}
    </div>
  );
}
