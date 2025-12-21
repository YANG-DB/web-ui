/**
 * Converts Dragons ontology format to react-querybuilder fields format
 */

const typeToInputType = {
  string: 'text',
  text: 'text',
  int: 'number',
  float: 'number',
  date: 'date',
  datetime: 'datetime-local',
  geo_point: 'text',
  array: 'text'
};

const typeToOperators = {
  string: ['=', '!=', 'contains', 'beginsWith', 'endsWith', 'null', 'notNull'],
  text: ['=', '!=', 'contains', 'beginsWith', 'endsWith', 'null', 'notNull'],
  int: ['=', '!=', '<', '>', '<=', '>=', 'null', 'notNull'],
  float: ['=', '!=', '<', '>', '<=', '>=', 'null', 'notNull'],
  date: ['=', '!=', '<', '>', '<=', '>=', 'null', 'notNull'],
  datetime: ['=', '!=', '<', '>', '<=', '>=', 'null', 'notNull'],
  geo_point: ['=', '!=', 'null', 'notNull'],
  array: ['contains', 'null', 'notNull']
};

export function convertOntologyToQueryBuilderFields(ontologyData) {
  if (!ontologyData || !ontologyData.data || !ontologyData.data[0]) {
    return [];
  }

  const ontology = ontologyData.data[0];
  const { entityTypes, relationshipTypes, properties } = ontology;

  // Create a map of property types
  const propertyTypeMap = {};
  if (properties) {
    properties.forEach(prop => {
      propertyTypeMap[prop.pType] = prop.type;
    });
  }

  const fields = [];

  // Build relationship operators for each entity (just the relationship types)
  const buildRelationshipOperators = (entityType) => {
    const operators = [];
    const addedRelationships = new Set();

    if (relationshipTypes && relationshipTypes.length > 0) {
      relationshipTypes.forEach(rel => {
        rel.ePairs.forEach(pair => {
          if (pair.eTypeA === entityType && !addedRelationships.has(rel.rType)) {
            operators.push({
              name: rel.rType,
              label: rel.rType
            });
            addedRelationships.add(rel.rType);
          }
        });
      });
    }

    return operators;
  };

  // Add entity type fields
  if (entityTypes && entityTypes.length > 0) {
    entityTypes.forEach(entity => {
      // Add a field for the entity type itself with relationship operators
      const relationshipOps = buildRelationshipOperators(entity.eType);

      fields.push({
        name: entity.eType,
        label: entity.name || entity.eType,
        operators: relationshipOps,
        defaultOperator: relationshipOps.length > 0 ? relationshipOps[0].name : '=',
        valueEditorType: 'select'
      });

      // Add fields for entity properties
      if (entity.properties && entity.properties.length > 0) {
        entity.properties
          .filter(prop => !entity.metadata?.includes(prop))
          .forEach(propName => {
            const propType = propertyTypeMap[propName] || 'string';
            const fieldName = `${entity.eType}.${propName}`;

            fields.push({
              name: fieldName,
              label: `${entity.eType} > ${propName}`,
              inputType: typeToInputType[propType] || 'text',
              operators: typeToOperators[propType] || typeToOperators.string,
              valueSources: ['value']
            });
          });
      }
    });
  }

  // Removed relationship pattern fields - using entity fields with relationship operators instead

  return fields;
}

/**
 * Converts react-querybuilder RuleGroupType to a custom query object
 * that can be sent to the backend
 */
export function queryBuilderToCustomQuery(ruleGroup) {
  if (!ruleGroup || !ruleGroup.rules) {
    return null;
  }

  const processRule = (rule) => {
    if ('rules' in rule) {
      // It's a group
      return {
        combinator: rule.combinator,
        conditions: rule.rules.map(r => processRule(r))
      };
    } else {
      // It's a rule
      return {
        field: rule.field,
        operator: rule.operator,
        value: rule.value
      };
    }
  };

  return processRule(ruleGroup);
}

/**
 * Generates a simple GraphQL-like query string from the query builder output
 * This is a simplified version - you may need to enhance based on your backend
 */
export function queryBuilderToGraphQLQuery(ruleGroup, ontologyData) {
  if (!ruleGroup || !ruleGroup.rules || ruleGroup.rules.length === 0) {
    return '';
  }

  const entityTypes = new Set();
  const relationships = [];

  const processRule = (rule) => {
    if ('rules' in rule) {
      // It's a group
      const groupConditions = rule.rules.map(r => processRule(r)).filter(Boolean);
      if (groupConditions.length > 0) {
        return `(${groupConditions.join(` ${rule.combinator.toUpperCase()} `)})`;
      }
      return null;
    } else {
      // Check if operator is a simple relationship name (e.g., "Own", "MemberOf")
      // This is the new preferred format: field=entity, operator=relationship, value=targetEntity
      if (rule.operator && ontologyData && ontologyData.data && ontologyData.data[0]) {
        const { relationshipTypes } = ontologyData.data[0];
        if (relationshipTypes) {
          const relationship = relationshipTypes.find(r => r.rType === rule.operator);
          if (relationship) {
            const sourceEntity = rule.field;
            const relType = rule.operator;
            const targetEntity = rule.value;

            entityTypes.add(sourceEntity);
            relationships.push({
              source: sourceEntity,
              relation: relType,
              target: targetEntity,
              exists: true
            });
            return `${sourceEntity}-[${relType}]->${targetEntity}`;
          }
        }
      }

      // Check if operator is a relationship pattern (old format: -[RelType]->)
      if (rule.operator && rule.operator.startsWith('-[') && rule.operator.endsWith(']->')) {
        const relTypeMatch = rule.operator.match(/-\[(.+)\]->/);
        if (relTypeMatch) {
          const sourceEntity = rule.field;
          const relType = relTypeMatch[1];
          const targetEntity = rule.value;

          entityTypes.add(sourceEntity);
          relationships.push({
            source: sourceEntity,
            relation: relType,
            target: targetEntity,
            exists: true
          });
          return `${sourceEntity}-[${relType}]->${targetEntity}`;
        }
      }

      // Check if it's a relationship rule (old format)
      if (rule.field.startsWith('relationship:')) {
        const relationshipPattern = rule.field.replace('relationship:', '');

        // Check if it's a relationship property or just existence check
        if (relationshipPattern.includes('.')) {
          // Relationship property: Person-[MemberOf]->Guild.startDate
          const [relPath, property] = relationshipPattern.split('.');
          const match = relPath.match(/(.+)-\[(.+)\]->(.+)/);
          if (match) {
            const [, sourceEntity, relType, targetEntity] = match;
            entityTypes.add(sourceEntity);
            relationships.push({
              source: sourceEntity,
              relation: relType,
              target: targetEntity,
              property: property,
              operator: rule.operator,
              value: rule.value
            });
            return `${sourceEntity}-[${relType}:${property} ${rule.operator} "${rule.value}"]->${targetEntity}`;
          }
        } else {
          // Relationship existence: Person-[MemberOf]->Guild
          const match = relationshipPattern.match(/(.+)-\[(.+)\]->(.+)/);
          if (match) {
            const [, sourceEntity, relType, targetEntity] = match;
            entityTypes.add(sourceEntity);
            relationships.push({
              source: sourceEntity,
              relation: relType,
              target: targetEntity,
              exists: rule.value === 'exists'
            });
            const existsOperator = rule.value === 'exists' ? '' : 'NOT ';
            return `${existsOperator}${sourceEntity}-[${relType}]->${targetEntity}`;
          }
        }
      } else {
        // Regular entity property rule
        const parts = rule.field.split('.');
        const entityType = parts[0];
        if (entityType) {
          entityTypes.add(entityType);
        }

        let condition = '';
        switch (rule.operator) {
          case '=':
            condition = `${rule.field} == "${rule.value}"`;
            break;
          case '!=':
            condition = `${rule.field} != "${rule.value}"`;
            break;
          case 'contains':
            condition = `${rule.field} contains "${rule.value}"`;
            break;
          case 'beginsWith':
            condition = `${rule.field} startsWith "${rule.value}"`;
            break;
          case 'endsWith':
            condition = `${rule.field} endsWith "${rule.value}"`;
            break;
          case '<':
          case '>':
          case '<=':
          case '>=':
            condition = `${rule.field} ${rule.operator} ${rule.value}`;
            break;
          case 'null':
            condition = `${rule.field} is null`;
            break;
          case 'notNull':
            condition = `${rule.field} is not null`;
            break;
          case 'in':
            condition = `${rule.field} in [${rule.value}]`;
            break;
          case 'notIn':
            condition = `${rule.field} not in [${rule.value}]`;
            break;
          default:
            condition = `${rule.field} ${rule.operator} "${rule.value}"`;
        }
        return condition;
      }
    }
  };

  const whereClause = processRule(ruleGroup);

  // Collect property conditions for filtering
  const propertyConditions = [];
  const collectConditions = (rule) => {
    if ('rules' in rule) {
      rule.rules.forEach(r => collectConditions(r));
    } else {
      // Check if it's a property filter (not a relationship)
      if (rule.field.includes('.') && rule.operator !== 'Own' && rule.operator !== 'MemberOf' &&
          (!ontologyData?.data?.[0]?.relationshipTypes?.find(r => r.rType === rule.operator))) {
        propertyConditions.push({
          field: rule.field,
          operator: rule.operator,
          value: rule.value
        });
      }
    }
  };
  collectConditions(ruleGroup);

  // Generate query using nested relationship resolvers
  if (relationships.length > 0) {
    let query = 'query {\n';

    // Build a graph of entity connections to detect disconnected components
    const entityGraph = {};
    relationships.forEach(rel => {
      if (!entityGraph[rel.source]) entityGraph[rel.source] = new Set();
      if (!entityGraph[rel.target]) entityGraph[rel.target] = new Set();
      entityGraph[rel.source].add(rel.target);
      entityGraph[rel.target].add(rel.source); // Treat as undirected for connectivity
    });

    // Find connected components using DFS
    const visited = new Set();
    const components = [];

    const dfs = (entity, component) => {
      if (visited.has(entity)) return;
      visited.add(entity);
      component.add(entity);
      const neighbors = entityGraph[entity] || new Set();
      neighbors.forEach(neighbor => dfs(neighbor, component));
    };

    Object.keys(entityGraph).forEach(entity => {
      if (!visited.has(entity)) {
        const component = new Set();
        dfs(entity, component);
        components.push(component);
      }
    });

    // If multiple disconnected components, add a note
    if (components.length > 1) {
      query += `  # NOTE: This query contains ${components.length} disconnected graph patterns.\n`;
      query += `  # Each pattern is queried independently.\n\n`;
    }

    // Process each connected component
    components.forEach((componentEntities, compIndex) => {
      // Find relationships in this component
      const componentRels = relationships.filter(rel =>
        componentEntities.has(rel.source) && componentEntities.has(rel.target)
      );

      // Determine the root entity for this component
      const entityFrequency = {};
      componentRels.forEach(rel => {
        entityFrequency[rel.source] = (entityFrequency[rel.source] || 0) + 1;
      });

      // Also consider entities with property conditions as potential roots
      propertyConditions.forEach(cond => {
        const [entityType] = cond.field.split('.');
        if (componentEntities.has(entityType)) {
          entityFrequency[entityType] = (entityFrequency[entityType] || 0) + 2; // Weight property filters higher
        }
      });

      // Find root entity (highest frequency)
      let rootEntity = null;
      let maxFreq = 0;
      Object.entries(entityFrequency).forEach(([entity, freq]) => {
        if (freq > maxFreq) {
          maxFreq = freq;
          rootEntity = entity;
        }
      });

      // Fallback to first relationship source in this component
      if (!rootEntity && componentRels.length > 0) {
        rootEntity = componentRels[0].source;
      }

      if (!rootEntity) {
        return;
      }

      const rootEntityLower = rootEntity.toLowerCase();
      const rootConditions = propertyConditions.filter(cond => {
        const [entityType] = cond.field.split('.');
        return entityType === rootEntity;
      });

      // Detect correlated multi-relationship pattern
      // If root entity has multiple self-referential relationships, use correlated query
      const rootRelationships = componentRels.filter(rel => rel.source === rootEntity);
      const selfReferentialRels = rootRelationships.filter(rel =>
        rel.source === rel.target && rel.source === rootEntity
      );

      // Check if this is a correlated query pattern
      const isCorrelatedPattern = selfReferentialRels.length >= 2;

      if (isCorrelatedPattern) {
        // Use the correlated multi-relationship resolver
        const relPart = selfReferentialRels.map(r => r.relation).sort().join('And');
        const queryName = `${rootEntityLower}sWith${relPart}`;

        // Build where clause for correlated query
        let whereClause = '';
        if (rootConditions.length > 0) {
          const whereFilters = rootConditions.map(cond => {
            const [, property] = cond.field.split('.');
            const operator = cond.operator;
            const value = cond.value;

            switch (operator) {
              case '=': return `${property}: "${value}"`;
              case '!=': return `${property}_not: "${value}"`;
              case 'contains': return `${property}_contains: "${value}"`;
              case 'beginsWith': return `${property}_starts_with: "${value}"`;
              case 'endsWith': return `${property}_ends_with: "${value}"`;
              case '<': return `${property}_lt: ${value}`;
              case '>': return `${property}_gt: ${value}`;
              case '<=': return `${property}_lte: ${value}`;
              case '>=': return `${property}_gte: ${value}`;
              case 'null': return `${property}: null`;
              case 'notNull': return `${property}_not: null`;
              default: return `${property}: "${value}"`;
            }
          });
          whereClause = `where: { ${whereFilters.join(', ')} }`;
        }

        // Generate correlated query
        const resultAlias = components.length > 1 ? `component${compIndex}` : queryName;
        query += `  # Correlated query: ${rootEntity} with ALL relationships: ${selfReferentialRels.map(r => r.relation).join(', ')}\n`;
        query += `  ${resultAlias}: ${queryName}(${whereClause ? whereClause + ', ' : ''}limit: 10) {\n`;
        query += `    id\n`;

        // Add root entity properties
        if (ontologyData && ontologyData.data && ontologyData.data[0]) {
          const rootEntityDef = ontologyData.data[0].entityTypes?.find(e => e.eType === rootEntity);
          if (rootEntityDef && rootEntityDef.properties) {
            rootEntityDef.properties
              .filter(prop => !rootEntityDef.metadata?.includes(prop))
              .slice(0, 3)
              .forEach(prop => {
                query += `    ${prop}\n`;
              });
          }
        }

        query += `  }\n`;
        return; // Skip normal nested query generation for this component
      }

      // Build where clause for root entity
      let whereClause = '';
      if (rootConditions.length > 0) {
        const whereFilters = rootConditions.map(cond => {
          const [, property] = cond.field.split('.');
          const operator = cond.operator;
          const value = cond.value;

          // Map operators to GraphQL filter syntax
          switch (operator) {
            case '=': return `${property}: "${value}"`;
            case '!=': return `${property}_not: "${value}"`;
            case 'contains': return `${property}_contains: "${value}"`;
            case 'beginsWith': return `${property}_starts_with: "${value}"`;
            case 'endsWith': return `${property}_ends_with: "${value}"`;
            case '<': return `${property}_lt: ${value}`;
            case '>': return `${property}_gt: ${value}`;
            case '<=': return `${property}_lte: ${value}`;
            case '>=': return `${property}_gte: ${value}`;
            case 'null': return `${property}: null`;
            case 'notNull': return `${property}_not: null`;
            default: return `${property}: "${value}"`;
          }
        });
        whereClause = `where: { ${whereFilters.join(', ')} }`;
      }

      // Start query from root entity
      const resultAlias = components.length > 1 ? `component${compIndex}` : rootEntityLower + 's';
      query += `  ${resultAlias}: ${rootEntityLower}s(${whereClause ? whereClause + ', ' : ''}limit: 10) {\n`;
      query += `    id\n`;

      // Add root entity properties
      if (ontologyData && ontologyData.data && ontologyData.data[0]) {
        const rootEntityDef = ontologyData.data[0].entityTypes?.find(e => e.eType === rootEntity);
        if (rootEntityDef && rootEntityDef.properties) {
          rootEntityDef.properties
            .filter(prop => !rootEntityDef.metadata?.includes(prop))
            .slice(0, 3)
            .forEach(prop => {
              query += `    ${prop}\n`;
            });
        }
      }

      // Group relationships by source entity (only for this component)
      const relationshipsBySource = {};
      componentRels.forEach(rel => {
        if (!relationshipsBySource[rel.source]) {
          relationshipsBySource[rel.source] = [];
        }
        relationshipsBySource[rel.source].push(rel);
      });

      // Add nested relationship resolvers for root entity
      const nestedRootRels = relationshipsBySource[rootEntity] || [];
      nestedRootRels.forEach(rel => {
        const relFieldName = rel.relation.toLowerCase();
        const targetConditions = propertyConditions.filter(cond => {
          const [entityType] = cond.field.split('.');
          return entityType === rel.target;
        });

        // Build where clause for relationship target
        let relWhereClause = '';
        if (targetConditions.length > 0) {
          const filters = targetConditions.map(cond => {
            const [, property] = cond.field.split('.');
            switch (cond.operator) {
              case '=': return `${property}: "${cond.value}"`;
              case '!=': return `${property}_not: "${cond.value}"`;
              case 'contains': return `${property}_contains: "${cond.value}"`;
              case '>': return `${property}_gt: ${cond.value}`;
              default: return `${property}: "${cond.value}"`;
            }
          });
          relWhereClause = `filter: { ${filters.join(', ')} }`;
        }

        query += `    # Relationship: ${rel.source} -[${rel.relation}]-> ${rel.target}\n`;
        query += `    ${relFieldName}(${relWhereClause ? relWhereClause + ', ' : ''}limit: 10) {\n`;
        query += `      id\n`;

        // Add target entity properties
        if (ontologyData && ontologyData.data && ontologyData.data[0]) {
          const targetEntityDef = ontologyData.data[0].entityTypes?.find(e => e.eType === rel.target);
          if (targetEntityDef && targetEntityDef.properties) {
            targetEntityDef.properties
              .filter(prop => !targetEntityDef.metadata?.includes(prop))
              .slice(0, 3)
              .forEach(prop => {
                query += `      ${prop}\n`;
              });
          }
        }

        // Recursively add nested relationships from target entity
        const nestedRelationships = relationshipsBySource[rel.target] || [];
        nestedRelationships.forEach(nestedRel => {
          const nestedFieldName = nestedRel.relation.toLowerCase();
          query += `      # Nested: ${nestedRel.source} -[${nestedRel.relation}]-> ${nestedRel.target}\n`;
          query += `      ${nestedFieldName}(limit: 10) {\n`;
          query += `        id\n`;

          // Add nested target properties
          if (ontologyData && ontologyData.data && ontologyData.data[0]) {
            const nestedTargetDef = ontologyData.data[0].entityTypes?.find(e => e.eType === nestedRel.target);
            if (nestedTargetDef && nestedTargetDef.properties) {
              nestedTargetDef.properties
                .filter(prop => !nestedTargetDef.metadata?.includes(prop))
                .slice(0, 3)
                .forEach(prop => {
                  query += `        ${prop}\n`;
                });
            }
          }

          query += `      }\n`;
        });

        query += `    }\n`;
      });

      query += `  }\n`;
    }); // End of components.forEach

    query += '}';
    return query;
  }

  // Generate a simple query structure for entity properties
  if (whereClause && entityTypes.size > 0) {
    let query = 'query {\n';
    entityTypes.forEach(entityType => {
      const entityLower = entityType.toLowerCase();
      query += `  ${entityLower}s(limit: 10) {\n`;
      query += `    id\n`;
      // Add entity properties
      if (ontologyData && ontologyData.data && ontologyData.data[0]) {
        const entity = ontologyData.data[0].entityTypes?.find(e => e.eType === entityType);
        if (entity && entity.properties) {
          entity.properties
            .filter(prop => !entity.metadata?.includes(prop))
            .forEach(prop => {
              query += `    ${prop}\n`;
            });
        }
      }
      query += `  }\n`;
    });
    query += '}';
    return query;
  }

  return '';
}

export default convertOntologyToQueryBuilderFields;
