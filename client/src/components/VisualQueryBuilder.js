import React, { useState, useEffect, useCallback } from "react";
import { QueryBuilder } from "react-querybuilder";
import "react-querybuilder/dist/query-builder.css";
import { convertOntologyToQueryBuilderFields, queryBuilderToGraphQLQuery } from "../helpers/ontologyToQueryBuilder";
import apiService from "../services/api";
import styles from "./VisualQueryBuilder.module.css";

const initialQuery = {
  combinator: "and",
  rules: []
};

export default function VisualQueryBuilder({ onSubmit }) {
  const [query, setQuery] = useState(initialQuery);
  const [fields, setFields] = useState([]);
  const [ontology, setOntology] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLanguage, setPreviewLanguage] = useState('json');

  useEffect(() => {
    // Load ontology and convert to query builder fields
    apiService.getOntology().then(ontologyData => {
      console.log("Loaded ontology for query builder:", ontologyData);

      // Wrap the data since getOntology returns data[0]
      const wrappedData = { data: [ontologyData] };

      const queryFields = convertOntologyToQueryBuilderFields(wrappedData);
      console.log("Generated query builder fields:", queryFields);

      // Log relationship fields specifically
      const relationshipFields = queryFields.filter(f => f.name.startsWith('relationship:'));
      console.log("Relationship pattern fields:", relationshipFields);

      setFields(queryFields);
      setOntology(wrappedData);
      setIsLoading(false);
    }).catch(error => {
      console.error("Failed to load ontology for query builder:", error);
      setIsLoading(false);
    });
  }, []);

  const handleQueryChange = useCallback((newQuery) => {
    console.log("Query changed:", newQuery);
    setQuery(newQuery);
  }, []);

  const handleSubmit = useCallback(() => {
    console.log("Submitting query:", query);

    // Convert query builder format to GraphQL query
    const graphqlQuery = queryBuilderToGraphQLQuery(query, ontology);
    console.log("Generated GraphQL query:", graphqlQuery);

    if (onSubmit) {
      // For now, pass the query builder object
      // You may need to convert this to your custom format
      onSubmit(query);
    }
  }, [query, ontology, onSubmit]);

  const handleClear = useCallback(() => {
    setQuery(initialQuery);
  }, []);

  const getPreviewContent = useCallback(() => {
    if (!query || query.rules.length === 0) {
      return 'No query built yet. Add rules to see preview.';
    }

    switch (previewLanguage) {
      case 'json':
        return JSON.stringify(query, null, 2);

      case 'sql':
        // Simple SQL-like conversion
        const processSQLRule = (rule) => {
          if ('rules' in rule) {
            const nested = rule.rules.map(r => processSQLRule(r)).filter(Boolean);
            return nested.length > 0 ? `(${nested.join(` ${rule.combinator.toUpperCase()} `)})` : null;
          }
          const [table, field] = rule.field.split('.');
          let condition = '';
          switch (rule.operator) {
            case '=': condition = `${table}.${field} = '${rule.value}'`; break;
            case '!=': condition = `${table}.${field} != '${rule.value}'`; break;
            case 'contains': condition = `${table}.${field} LIKE '%${rule.value}%'`; break;
            case 'beginsWith': condition = `${table}.${field} LIKE '${rule.value}%'`; break;
            case 'endsWith': condition = `${table}.${field} LIKE '%${rule.value}'`; break;
            case '<': case '>': case '<=': case '>=':
              condition = `${table}.${field} ${rule.operator} ${rule.value}`; break;
            case 'null': condition = `${table}.${field} IS NULL`; break;
            case 'notNull': condition = `${table}.${field} IS NOT NULL`; break;
            default: condition = `${table}.${field} ${rule.operator} '${rule.value}'`;
          }
          return condition;
        };
        const whereClause = processSQLRule(query);
        return `SELECT *\nFROM entities\nWHERE ${whereClause || 'TRUE'};`;

      case 'mongodb':
        // MongoDB-like conversion
        const processMongoRule = (rule) => {
          if ('rules' in rule) {
            const nested = rule.rules.map(r => processMongoRule(r)).filter(Boolean);
            if (nested.length === 0) return null;
            const op = rule.combinator === 'and' ? '$and' : '$or';
            return { [op]: nested };
          }
          const [table, field] = rule.field.split('.');
          const fieldPath = `${table}.${field}`;
          switch (rule.operator) {
            case '=': return { [fieldPath]: rule.value };
            case '!=': return { [fieldPath]: { $ne: rule.value } };
            case 'contains': return { [fieldPath]: { $regex: rule.value, $options: 'i' } };
            case 'beginsWith': return { [fieldPath]: { $regex: `^${rule.value}`, $options: 'i' } };
            case 'endsWith': return { [fieldPath]: { $regex: `${rule.value}$`, $options: 'i' } };
            case '<': return { [fieldPath]: { $lt: rule.value } };
            case '>': return { [fieldPath]: { $gt: rule.value } };
            case '<=': return { [fieldPath]: { $lte: rule.value } };
            case '>=': return { [fieldPath]: { $gte: rule.value } };
            case 'null': return { [fieldPath]: null };
            case 'notNull': return { [fieldPath]: { $ne: null } };
            default: return { [fieldPath]: rule.value };
          }
        };
        const mongoQuery = processMongoRule(query);
        return `db.collection.find(\n${JSON.stringify(mongoQuery, null, 2)}\n)`;

      case 'graphql':
        // GraphQL-like conversion using the existing helper
        const gqlQuery = queryBuilderToGraphQLQuery(query, ontology);
        return gqlQuery || 'query {\n  # Add rules to generate query\n}';

      case 'cypher':
        // Neo4j Cypher-like conversion
        const cypherRelationships = [];

        const processCypherRule = (rule) => {
          if ('rules' in rule) {
            const nested = rule.rules.map(r => processCypherRule(r)).filter(Boolean);
            return nested.length > 0 ? `(${nested.join(` ${rule.combinator.toUpperCase()} `)})` : null;
          }

          // Handle relationship patterns
          if (rule.field.startsWith('relationship:')) {
            const relationshipPattern = rule.field.replace('relationship:', '');

            if (relationshipPattern.includes('.')) {
              // Relationship with property: Person-[MemberOf]->Guild.startDate
              const [relPath, property] = relationshipPattern.split('.');
              const match = relPath.match(/(.+)-\[(.+)\]->(.+)/);
              if (match) {
                const [, sourceEntity, relType, targetEntity] = match;
                cypherRelationships.push({
                  source: sourceEntity.toLowerCase(),
                  relation: relType.toUpperCase(),
                  target: targetEntity.toLowerCase(),
                  property: property
                });
                return `r.${property} ${rule.operator} '${rule.value}'`;
              }
            } else {
              // Relationship existence: Person-[MemberOf]->Guild
              const match = relationshipPattern.match(/(.+)-\[(.+)\]->(.+)/);
              if (match) {
                const [, sourceEntity, relType, targetEntity] = match;
                cypherRelationships.push({
                  source: sourceEntity.toLowerCase(),
                  relation: relType.toUpperCase(),
                  target: targetEntity.toLowerCase(),
                  exists: rule.value === 'exists'
                });
                return null; // Existence is handled in MATCH pattern
              }
            }
          }

          // Regular property
          const parts = rule.field.split('.');
          const property = parts[1];
          let condition = '';
          switch (rule.operator) {
            case '=': condition = `n.${property} = '${rule.value}'`; break;
            case '!=': condition = `n.${property} <> '${rule.value}'`; break;
            case 'contains': condition = `n.${property} CONTAINS '${rule.value}'`; break;
            case 'beginsWith': condition = `n.${property} STARTS WITH '${rule.value}'`; break;
            case 'endsWith': condition = `n.${property} ENDS WITH '${rule.value}'`; break;
            case '<': case '>': case '<=': case '>=':
              condition = `n.${property} ${rule.operator} ${rule.value}`; break;
            case 'null': condition = `n.${property} IS NULL`; break;
            case 'notNull': condition = `n.${property} IS NOT NULL`; break;
            default: condition = `n.${property} ${rule.operator} '${rule.value}'`;
          }
          return condition;
        };

        const cypherWhere = processCypherRule(query);

        // Generate Cypher query with relationship patterns
        if (cypherRelationships.length > 0) {
          const rel = cypherRelationships[0];
          let matchPattern = `MATCH (a:${rel.source.charAt(0).toUpperCase() + rel.source.slice(1)})-[r:${rel.relation}]->(b:${rel.target.charAt(0).toUpperCase() + rel.target.slice(1)})`;
          let whereClause = cypherWhere ? `\nWHERE ${cypherWhere}` : '';
          return `${matchPattern}${whereClause}\nRETURN a, r, b`;
        }

        return `MATCH (n)\nWHERE ${cypherWhere || 'TRUE'}\nRETURN n`;

      default:
        return JSON.stringify(query, null, 2);
    }
  }, [query, previewLanguage, ontology]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading query builder...</div>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>No schema fields available. Please check your ontology.</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Visual Query Builder</h3>
        <div className={styles.actions}>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={styles.previewButton}
          >
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
          <button onClick={handleClear} className={styles.clearButton}>
            Clear
          </button>
          <button onClick={handleSubmit} className={styles.submitButton}>
            Run Query
          </button>
        </div>
      </div>

      <div className={styles.queryBuilderWrapper}>
        <QueryBuilder
          fields={fields}
          query={query}
          onQueryChange={handleQueryChange}
          controlClassnames={{
            queryBuilder: styles.queryBuilder,
            ruleGroup: styles.ruleGroup,
            rule: styles.rule,
            addRule: styles.addRule,
            addGroup: styles.addGroup,
            removeRule: styles.removeRule,
            removeGroup: styles.removeGroup
          }}
        />
      </div>

      {showPreview && query.rules.length > 0 && (
        <div className={styles.queryPreview}>
          <div className={styles.previewHeader}>
            <h4>Query Preview:</h4>
            <select
              value={previewLanguage}
              onChange={(e) => setPreviewLanguage(e.target.value)}
              className={styles.languageSelector}
            >
              <option value="json">JSON</option>
              <option value="graphql">GraphQL</option>
              <option value="sql">SQL</option>
              <option value="mongodb">MongoDB</option>
              <option value="cypher">Cypher (Neo4j)</option>
            </select>
          </div>
          <pre>{getPreviewContent()}</pre>
        </div>
      )}
    </div>
  );
}
