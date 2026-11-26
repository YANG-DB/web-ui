import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { QueryBuilder } from "react-querybuilder";
import "react-querybuilder/dist/query-builder.css";
import { convertOntologyToQueryBuilderFields, queryBuilderToGraphQLQuery } from "../helpers/ontologyToQueryBuilder";
import apiService from "../services/api";
import queryToCypher from "../helpers/queryToCypher";
import queryToV1 from "../helpers/queryToV1";
import styles from "./VisualQueryBuilder.module.css";
import RelationshipValueEditor from "./RelationshipValueEditor";
import RelationshipRuleActions from "./RelationshipRuleActions";
import QueryTemplates from "./QueryTemplates";

// ID generator for query objects
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

const initialQuery = {
  combinator: "and",
  rules: [],
  id: generateId()
};

const defaultLoadOntology = type => apiService.getOntology(type);

export default function VisualQueryBuilder({
  onSubmit,
  ontologyType = 'dragons',
  loadOntology = defaultLoadOntology,
  backendLabel = 'mock server'
}) {
  const [query, setQuery] = useState(initialQuery);
  const [fields, setFields] = useState([]);
  const [ontology, setOntology] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLanguage, setPreviewLanguage] = useState('json');
  const [showTemplates, setShowTemplates] = useState(false);
  const programmaticUpdate = useRef(false);

  useEffect(() => {
    console.log("Query state changed:", query);
  }, [query]);

  useEffect(() => {
    // Load ontology and convert to query builder fields
    setIsLoading(true);
    setLoadError(null);
    // Clear query when ontology changes to avoid invalid field references
    setQuery({ combinator: "and", rules: [], id: generateId() });

    loadOntology(ontologyType).then(ontologyData => {
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
      setLoadError(null);
    }).catch(error => {
      console.error("Failed to load ontology for query builder:", error);
      setLoadError(error.message || "Cannot connect to backend server");
      setIsLoading(false);
    });
  }, [ontologyType, loadOntology]);

  const handleQueryChange = useCallback((newQuery) => {
    console.log("handleQueryChange: Query changed:", newQuery);
    console.log("handleQueryChange: programmaticUpdate.current =", programmaticUpdate.current);

    // If this is a programmatic update from template selection, don't process it
    if (programmaticUpdate.current) {
      console.log("handleQueryChange: Ignoring because programmaticUpdate is true");
      programmaticUpdate.current = false;
      return;
    }

    setQuery(newQuery);
  }, []);

  // Helper function to build relationship operators for an entity
  const buildRelationshipOperators = useCallback((entityType) => {
    if (!ontology || !ontology.data || !ontology.data[0]) return [];

    const { relationshipTypes } = ontology.data[0];
    const operators = [];
    if (relationshipTypes) {
      relationshipTypes.forEach(rel => {
        rel.ePairs.forEach(pair => {
          if (pair.eTypeA === entityType) {
            operators.push({ name: rel.rType, label: rel.rType });
          }
        });
      });
    }
    return operators;
  }, [ontology]);

  // Function to expand a relationship rule into a nested group
  const expandRelationshipRule = useCallback((ruleId, rulePath = []) => {
    if (!ontology || !ontology.data || !ontology.data[0]) return;

    const { relationshipTypes, entityTypes } = ontology.data[0];

    // Use functional update to avoid dependency on query state
    setQuery(currentQuery => {
      // Find the rule by traversing the path
      const findAndExpandRule = (rules, path, currentIndex = 0) => {
        return rules.map((rule, idx) => {
          // If this is a group, recurse into it
          if ('rules' in rule) {
            if (path[currentIndex] === idx) {
              return {
                ...rule,
                rules: findAndExpandRule(rule.rules, path, currentIndex + 1)
              };
            }
            return rule;
          }

          // If this is the target rule (end of path)
          if (path.length === currentIndex + 1 && path[currentIndex] === idx) {
            // Check if it's a relationship rule
            if (rule.operator && relationshipTypes) {
              const relationship = relationshipTypes.find(r => r.rType === rule.operator);

              if (relationship && rule.field) {
                // Find possible target entities for this relationship
                const possibleTargets = [];
                relationship.ePairs.forEach(pair => {
                  if (pair.eTypeA === rule.field) {
                    possibleTargets.push(pair.eTypeB);
                  }
                });

                // Use rule's value if set, otherwise use first possible target
                const targetEntity = rule.value || (possibleTargets.length > 0 ? possibleTargets[0] : null);

                if (targetEntity) {
                  const targetEntityType = entityTypes?.find(e => e.eType === targetEntity);

                  if (targetEntityType) {
                    console.log(`Expanding relationship: ${rule.field} -[${rule.operator}]-> ${targetEntity}`);

                    // Determine the default operator for the target entity
                    const targetRelOps = buildRelationshipOperators(targetEntity);
                    const targetDefaultOp = targetRelOps.length > 0
                      ? targetRelOps[0].name
                      : '=';

                    // Create a nested rule group with the relationship rule
                    // and a nested subgroup for the target entity
                    return {
                      id: `${rule.id}-group`,
                      combinator: 'and',
                      rules: [
                        {
                          ...rule,
                          value: targetEntity, // Ensure value is set
                          _expanded: true // Mark as expanded
                        },
                        {
                          // Nested subgroup for the target entity
                          id: `${rule.id}-target-group`,
                          combinator: 'and',
                          rules: [
                            {
                              id: `rule-${Date.now()}-${Math.random()}-target`,
                              field: targetEntity,
                              operator: targetDefaultOp,
                              value: ''
                            }
                          ]
                        }
                      ]
                    };
                  }
                }
              }
            }
          }

          return rule;
        });
      };

      return {
        ...currentQuery,
        rules: findAndExpandRule(currentQuery.rules, rulePath)
      };
    });
  }, [ontology, buildRelationshipOperators]);

  const handleSubmit = useCallback(() => {
    console.log("Submitting query:", query);

    // Convert query builder format to GraphQL query
    const graphqlQuery = queryBuilderToGraphQLQuery(query, ontology);
    console.log("Generated GraphQL query:", graphqlQuery);

    if (onSubmit) {
      // The ontology lets the caller generate Cypher or V1 (helpers/queryToCypher, queryToV1)
      onSubmit(query, { ontology });
    }
  }, [query, ontology, onSubmit]);

  const handleClear = useCallback(() => {
    setQuery(initialQuery);
  }, []);

  // Memoize control elements to prevent input focus loss
  // This must be before any conditional returns to follow Rules of Hooks
  const controlElements = useMemo(() => ({
    valueEditor: (props) => (
      <RelationshipValueEditor
        {...props}
        ontology={ontology}
      />
    ),
    removeRuleAction: (props) => (
      <RelationshipRuleActions
        {...props}
        ontology={ontology}
        onExpandRelationship={expandRelationshipRule}
      />
    )
  }), [ontology, expandRelationshipRule]);

  // Helper function to add syntax highlighting
  const syntaxHighlight = useCallback((code, language) => {
    if (!code) return code;

    // Simple syntax highlighting - can be enhanced further
    let highlighted = code;

    switch (language) {
      case 'cypher':
        // Highlight Cypher keywords
        highlighted = highlighted.replace(/\b(MATCH|WHERE|RETURN|AND|OR|NOT|IS|NULL)\b/g, '<span class="keyword">$1</span>');
        // Highlight strings
        highlighted = highlighted.replace(/'([^']*)'/g, '<span class="string">\'$1\'</span>');
        // Highlight node/relationship patterns
        highlighted = highlighted.replace(/\(([a-z]+):([A-Z][a-z]*)\)/g, '(<span class="entity">$1:$2</span>)');
        highlighted = highlighted.replace(/\[([a-z]+):([A-Z_]+)\]/g, '[<span class="relationship">$1:$2</span>]');
        break;

      case 'graphql':
        // Highlight GraphQL keywords
        highlighted = highlighted.replace(/\b(query|mutation|fragment|on)\b/g, '<span class="keyword">$1</span>');
        // Highlight comments
        highlighted = highlighted.replace(/#([^\n]*)/g, '<span class="comment">#$1</span>');
        // Highlight strings
        highlighted = highlighted.replace(/"([^"]*)"/g, '<span class="string">"$1"</span>');
        break;

      case 'sql':
        // Highlight SQL keywords
        highlighted = highlighted.replace(/\b(SELECT|FROM|WHERE|AND|OR|LIKE|IS|NULL|NOT)\b/g, '<span class="keyword">$1</span>');
        // Highlight strings
        highlighted = highlighted.replace(/'([^']*)'/g, '<span class="string">\'$1\'</span>');
        break;

      case 'mongodb':
        // Highlight MongoDB operators
        highlighted = highlighted.replace(/"\$([a-z]+)"/g, '"<span class="operator">$$$1</span>"');
        // Highlight strings
        highlighted = highlighted.replace(/: "([^"]*)"/g, ': <span class="string">"$1"</span>');
        break;

      default:
        break;
    }

    return highlighted;
  }, []);

  const getPreviewContent = useCallback(() => {
    if (!query || query.rules.length === 0) {
      return 'No query built yet. Add rules to see preview.';
    }

    let content = '';

    switch (previewLanguage) {
      case 'json':
        content = JSON.stringify(query, null, 2);
        return content;

      case 'sql':
        // Simple SQL-like conversion
        const processSQLRule = (rule) => {
          if ('rules' in rule) {
            const nested = rule.rules.map(r => processSQLRule(r)).filter(Boolean);
            return nested.length > 0 ? `(${nested.join(` ${rule.combinator.toUpperCase()} `)})` : null;
          }

          // Check if this is a relationship operator
          if (rule.operator && ontology && ontology.data && ontology.data[0]) {
            const { relationshipTypes } = ontology.data[0];
            if (relationshipTypes) {
              const relationship = relationshipTypes.find(r => r.rType === rule.operator);
              if (relationship) {
                // This is a relationship query, not a property filter
                const sourceEntity = rule.field;
                const relType = rule.operator;
                const targetEntity = rule.value;
                return `${sourceEntity} ${relType} ${targetEntity}`;
              }
            }
          }

          // Handle property filters
          const [table, field] = rule.field.split('.');

          // If there's no field (just entity name), skip it
          if (!field) {
            return null;
          }

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
        content = `SELECT *\nFROM entities\nWHERE ${whereClause || 'TRUE'};`;
        return { __html: syntaxHighlight(content, 'sql') };

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
        content = `db.collection.find(\n${JSON.stringify(mongoQuery, null, 2)}\n)`;
        return { __html: syntaxHighlight(content, 'mongodb') };

      case 'graphql':
        // GraphQL-like conversion using the existing helper
        const gqlQuery = queryBuilderToGraphQLQuery(query, ontology);
        content = gqlQuery || 'query {\n  # Add rules to generate query\n}';
        return { __html: syntaxHighlight(content, 'graphql') };

      case 'cypher':
        // The Cypher sent to Fuse (helpers/queryToCypher)
        content = queryToCypher(query, ontology);
        return { __html: syntaxHighlight(content, 'cypher') };

      case 'v1':
        // The V1 query sent to Fuse (helpers/queryToV1)
        try {
          content = JSON.stringify(queryToV1(query, ontology), null, 2);
        } catch (error) {
          content = `// ${error.message}`;
        }
        return { __html: syntaxHighlight(content, 'json') };

      default:
        return JSON.stringify(query, null, 2);
    }
  }, [query, previewLanguage, ontology, syntaxHighlight]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading query builder...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>⚠️ Cannot load the ontology</h3>
          <p>The {backendLabel} did not return the <strong>{ontologyType}</strong> ontology.</p>
          <p><strong>Error:</strong> {loadError}</p>
          <p style={{ marginTop: '15px', fontSize: '13px' }}>
            For the mock server, run <code>yarn server</code> in the project root. For Fuse, see
            the Backends section of the README.
          </p>
        </div>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>⚠️ No Schema Fields Available</h3>
          <p>The ontology loaded but contains no queryable fields.</p>
          <p>Please check your ontology configuration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Visual Query Builder</h3>
        <div className={styles.actions}>
          <button
            onClick={() => setShowTemplates(true)}
            className={styles.templatesButton}
          >
            📋 Templates
          </button>
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
          key={query.id}
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
          controlElements={controlElements}
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
              <option value="cypher">Cypher (Fuse)</option>
              <option value="v1">V1 (Fuse)</option>
            </select>
          </div>
          <div className={styles.previewContent}>
            <pre dangerouslySetInnerHTML={
              typeof getPreviewContent() === 'string'
                ? { __html: getPreviewContent() }
                : getPreviewContent()
            } />
          </div>
        </div>
      )}

      {showTemplates && (
        <QueryTemplates
          ontologyType={ontologyType}
          loadOntology={loadOntology}
          onSelectTemplate={(templateQuery) => {
            console.log("VisualQueryBuilder: Received template query:", templateQuery);
            console.log("VisualQueryBuilder: Current query before update:", query);

            // Set flag to indicate this is a programmatic update
            programmaticUpdate.current = true;
            setQuery(templateQuery);

            console.log("VisualQueryBuilder: setQuery called with:", templateQuery);
            console.log("VisualQueryBuilder: programmaticUpdate flag set to true");
          }}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
}
