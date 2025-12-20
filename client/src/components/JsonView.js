import React, { useState } from "react";
import styles from "./JsonView.module.css";

export default function JsonView({ results }) {
  const [collapsed, setCollapsed] = useState({});

  const toggleCollapse = (path) => {
    setCollapsed(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const renderValue = (value, path = '', depth = 0) => {
    if (value === null) {
      return <span className={styles.null}>null</span>;
    }

    if (value === undefined) {
      return <span className={styles.undefined}>undefined</span>;
    }

    if (typeof value === 'boolean') {
      return <span className={styles.boolean}>{String(value)}</span>;
    }

    if (typeof value === 'number') {
      return <span className={styles.number}>{value}</span>;
    }

    if (typeof value === 'string') {
      return <span className={styles.string}>"{value}"</span>;
    }

    if (Array.isArray(value)) {
      const isCollapsed = collapsed[path];
      const isEmpty = value.length === 0;

      return (
        <div className={styles.arrayContainer}>
          <span
            className={styles.bracket}
            onClick={() => !isEmpty && toggleCollapse(path)}
            style={{ cursor: isEmpty ? 'default' : 'pointer' }}
          >
            [
            {isEmpty && ']'}
            {!isEmpty && (
              <span className={styles.length}> {value.length} items </span>
            )}
          </span>
          {!isEmpty && !isCollapsed && (
            <div className={styles.arrayContent}>
              {value.map((item, index) => (
                <div key={index} className={styles.arrayItem}>
                  <span className={styles.arrayIndex}>{index}:</span>
                  {renderValue(item, `${path}[${index}]`, depth + 1)}
                  {index < value.length - 1 && <span className={styles.comma}>,</span>}
                </div>
              ))}
            </div>
          )}
          {!isEmpty && (
            <span className={styles.bracket}>]</span>
          )}
        </div>
      );
    }

    if (typeof value === 'object') {
      const isCollapsed = collapsed[path];
      const keys = Object.keys(value);
      const isEmpty = keys.length === 0;

      return (
        <div className={styles.objectContainer}>
          <span
            className={styles.brace}
            onClick={() => !isEmpty && toggleCollapse(path)}
            style={{ cursor: isEmpty ? 'default' : 'pointer' }}
          >
            {'{'}
            {isEmpty && '}'}
            {!isEmpty && (
              <span className={styles.length}> {keys.length} keys </span>
            )}
          </span>
          {!isEmpty && !isCollapsed && (
            <div className={styles.objectContent}>
              {keys.map((key, index) => (
                <div key={key} className={styles.objectItem}>
                  <span className={styles.key}>"{key}"</span>
                  <span className={styles.colon}>: </span>
                  {renderValue(value[key], `${path}.${key}`, depth + 1)}
                  {index < keys.length - 1 && <span className={styles.comma}>,</span>}
                </div>
              ))}
            </div>
          )}
          {!isEmpty && (
            <span className={styles.brace}>{'}'}</span>
          )}
        </div>
      );
    }

    return <span>{String(value)}</span>;
  };

  const copyToClipboard = () => {
    const jsonString = JSON.stringify(results, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      // Could add a toast notification here
      console.log('JSON copied to clipboard');
    });
  };

  const downloadJson = () => {
    const jsonString = JSON.stringify(results, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const collapseAll = () => {
    const allPaths = {};
    const traverse = (obj, currentPath = '') => {
      if (obj && typeof obj === 'object') {
        allPaths[currentPath] = true;
        if (Array.isArray(obj)) {
          obj.forEach((item, index) => traverse(item, `${currentPath}[${index}]`));
        } else {
          Object.keys(obj).forEach(key => traverse(obj[key], `${currentPath}.${key}`));
        }
      }
    };
    traverse(results);
    setCollapsed(allPaths);
  };

  const expandAll = () => {
    setCollapsed({});
  };

  return (
    <div className={styles.jsonContainer}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <button onClick={expandAll} className={styles.toolbarButton}>
            Expand All
          </button>
          <button onClick={collapseAll} className={styles.toolbarButton}>
            Collapse All
          </button>
        </div>
        <div className={styles.toolbarGroup}>
          <button onClick={copyToClipboard} className={styles.toolbarButton}>
            Copy JSON
          </button>
          <button onClick={downloadJson} className={styles.toolbarButton}>
            Download JSON
          </button>
        </div>
      </div>
      <div className={styles.jsonContent}>
        {renderValue(results, 'root')}
      </div>
    </div>
  );
}
