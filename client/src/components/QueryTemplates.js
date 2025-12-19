import React, { useState, useEffect } from "react";
import { QueryBuilder } from "react-querybuilder";
import "react-querybuilder/dist/query-builder.css";
import styles from "./QueryTemplates.module.css";
import apiService from "../services/api";
import { convertOntologyToQueryBuilderFields } from "../helpers/ontologyToQueryBuilder";

// Simple ID generator (compatible with react-querybuilder's expected format)
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

// Helper function to add IDs to query structure
const addIdsToQuery = (query) => {
  const processedQuery = { ...query, id: generateId() };

  if (query.rules) {
    processedQuery.rules = query.rules.map(rule => {
      if (rule.combinator) {
        // It's a nested group
        return addIdsToQuery(rule);
      } else {
        // It's a rule
        return { ...rule, id: generateId() };
      }
    });
  }

  return processedQuery;
};

// Predefined query templates for different ontologies
const templates = {
  dragons: [
    {
      description: "Find all persons by first name",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person.firstName",
            operator: "notNull",
            value: null
          }
        ]
      }
    },
    {
      description: "Find dragons with specific color",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Dragon.color",
            operator: "=",
            value: ""
          }
        ]
      }
    },
    {
      description: "Find entities with multiple attributes",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person.firstName",
            operator: "notNull",
            value: null
          },
          {
            field: "Person.lastName",
            operator: "notNull",
            value: null
          }
        ]
      }
    },
    {
      description: "Find entities using OR condition",
      query: {
        combinator: "or",
        rules: [
          {
            field: "Dragon.color",
            operator: "=",
            value: "red"
          },
          {
            field: "Dragon.color",
            operator: "=",
            value: "blue"
          }
        ]
      }
    },
    {
      description: "Complex nested query example",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person.firstName",
            operator: "notNull",
            value: null
          },
          {
            combinator: "or",
            rules: [
              {
                field: "Person.gender",
                operator: "=",
                value: "male"
              },
              {
                field: "Person.gender",
                operator: "=",
                value: "female"
              }
            ]
          }
        ]
      }
    },
    {
      description: "Find dragons owned by persons (relationship)",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person",
            operator: "Own",
            value: "Dragon"
          }
        ]
      }
    },
    {
      description: "Find persons who are members of guilds (relationship)",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person",
            operator: "MemberOf",
            value: "Guild"
          }
        ]
      }
    },
    {
      description: "Find persons who know someone named George (complex)",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person",
            operator: "Know",
            value: "Person"
          },
          {
            field: "Person.firstName",
            operator: "=",
            value: "George"
          }
        ]
      }
    },
    {
      description: "Multi-relationship query with nested conditions (advanced)",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person",
            operator: "OriginatedIn",
            value: "Kingdom"
          },
          {
            field: "Kingdom.funds",
            operator: ">",
            value: "1000"
          },
          {
            combinator: "and",
            rules: [
              {
                field: "Dragon",
                operator: "Fire",
                value: "Dragon"
              },
              {
                combinator: "and",
                rules: [
                  {
                    field: "Dragon",
                    operator: "Freeze",
                    value: "Dragon"
                  },
                  {
                    field: "Dragon.name",
                    operator: "=",
                    value: "morgan"
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  ],
  linkedin: [
    {
      description: "Find all persons by name",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person.name",
            operator: "notNull",
            value: null
          }
        ]
      }
    },
    {
      description: "Find companies with specific attributes",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Company.name",
            operator: "=",
            value: ""
          }
        ]
      }
    },
    {
      description: "Find entities with multiple attributes",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person.name",
            operator: "notNull",
            value: null
          },
          {
            field: "Person.email",
            operator: "contains",
            value: "@"
          }
        ]
      }
    },
    {
      description: "Find entities using OR condition",
      query: {
        combinator: "or",
        rules: [
          {
            field: "Company.industry",
            operator: "=",
            value: "Technology"
          },
          {
            field: "Company.industry",
            operator: "=",
            value: "Finance"
          }
        ]
      }
    },
    {
      description: "Complex nested query example",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person.name",
            operator: "notNull",
            value: null
          },
          {
            combinator: "or",
            rules: [
              {
                field: "Person.title",
                operator: "contains",
                value: "Engineer"
              },
              {
                field: "Person.title",
                operator: "contains",
                value: "Developer"
              }
            ]
          }
        ]
      }
    },
    {
      description: "Find persons working at companies (relationship)",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person",
            operator: "WorksAt",
            value: "Company"
          }
        ]
      }
    },
    {
      description: "Find persons connected to other persons (relationship)",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person",
            operator: "ConnectedTo",
            value: "Person"
          }
        ]
      }
    },
    {
      description: "Find companies founded by persons (relationship)",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person",
            operator: "Founded",
            value: "Company"
          }
        ]
      }
    },
    {
      description: "Find persons connected to someone named John (complex)",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person",
            operator: "ConnectedTo",
            value: "Person"
          },
          {
            field: "Person.name",
            operator: "=",
            value: "John Smith"
          }
        ]
      }
    },
    {
      description: "Multi-relationship LinkedIn query (advanced)",
      query: {
        combinator: "and",
        rules: [
          {
            field: "Person",
            operator: "WorksAt",
            value: "Company"
          },
          {
            field: "Company.industry",
            operator: "=",
            value: "Technology"
          },
          {
            combinator: "and",
            rules: [
              {
                field: "Person",
                operator: "ConnectedTo",
                value: "Person"
              },
              {
                combinator: "and",
                rules: [
                  {
                    field: "Person",
                    operator: "Founded",
                    value: "Company"
                  },
                  {
                    field: "Person.title",
                    operator: "contains",
                    value: "CEO"
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  ]
};

export default function QueryTemplates({ ontologyType, onSelectTemplate, onClose }) {
  const ontologyTemplates = templates[ontologyType] || [];
  const [fields, setFields] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load ontology to get fields for the query builder preview
    setIsLoading(true);
    apiService.getOntology(ontologyType).then(ontologyData => {
      const wrappedData = { data: [ontologyData] };
      const queryFields = convertOntologyToQueryBuilderFields(wrappedData);
      setFields(queryFields);
      setIsLoading(false);
    }).catch(error => {
      console.error("Error loading ontology for templates:", error);
      setIsLoading(false);
    });
  }, [ontologyType]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Query Templates - {ontologyType.charAt(0).toUpperCase() + ontologyType.slice(1)}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loading}>Loading templates...</div>
          ) : ontologyTemplates.length === 0 ? (
            <div className={styles.noTemplates}>
              <p>No templates available for this ontology yet.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Query Structure</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {ontologyTemplates.map((template, index) => (
                  <tr key={index}>
                    <td className={styles.descriptionCell}>
                      {template.description}
                    </td>
                    <td className={styles.queryCell}>
                      <div className={styles.queryBuilderPreview}>
                        <QueryBuilder
                          fields={fields}
                          query={addIdsToQuery(template.query)}
                          controlElements={{
                            addRuleAction: () => null,
                            addGroupAction: () => null,
                            removeRuleAction: () => null,
                            removeGroupAction: () => null,
                            combinatorSelector: (props) => (
                              <span className={styles.readOnlyCombinator}>{props.value}</span>
                            ),
                            fieldSelector: (props) => (
                              <span className={styles.readOnlyField}>
                                {fields.find(f => f.name === props.value)?.label || props.value}
                              </span>
                            ),
                            operatorSelector: (props) => (
                              <span className={styles.readOnlyOperator}>{props.value}</span>
                            ),
                            valueEditor: (props) => (
                              <span className={styles.readOnlyValue}>
                                {props.value || props.fieldData?.placeholder || 'exists'}
                              </span>
                            )
                          }}
                        />
                      </div>
                    </td>
                    <td className={styles.actionCell}>
                      <button
                        className={styles.useButton}
                        onClick={() => {
                          // Add unique IDs to the query before passing it to the builder
                          const queryWithIds = addIdsToQuery(template.query);
                          console.log("Template selected:", template.description);
                          console.log("Original template query:", template.query);
                          console.log("Query with IDs:", queryWithIds);
                          onSelectTemplate(queryWithIds);
                          onClose();
                        }}
                      >
                        Use Me
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
