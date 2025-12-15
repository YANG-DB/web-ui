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

  // Add entity type fields
  if (entityTypes && entityTypes.length > 0) {
    entityTypes.forEach(entity => {
      // Add a field for the entity type itself
      fields.push({
        name: entity.eType,
        label: entity.name || entity.eType,
        inputType: 'select',
        values: [
          { name: entity.eType, label: entity.name || entity.eType }
        ],
        operators: ['=', '!=']
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

  // Add relationship pattern fields (Entity1 -[Relation]-> Entity2)
  if (relationshipTypes && relationshipTypes.length > 0) {
    relationshipTypes.forEach(rel => {
      rel.ePairs.forEach(pair => {
        const relationshipField = {
          name: `relationship:${pair.eTypeA}-[${rel.rType}]->${pair.eTypeB}`,
          label: `${pair.eTypeA} -[${rel.rType}]-> ${pair.eTypeB}`,
          inputType: 'select',
          values: [
            { name: 'exists', label: 'Exists' },
            { name: 'not_exists', label: 'Does Not Exist' }
          ],
          operators: ['='],
          defaultOperator: '=',
          defaultValue: 'exists'
        };
        fields.push(relationshipField);

        // Add relationship property fields if the relationship has properties
        if (rel.properties && rel.properties.length > 0) {
          rel.properties
            .filter(prop => !rel.metadata?.includes(prop))
            .forEach(propName => {
              const propType = propertyTypeMap[propName] || 'string';
              const fieldName = `relationship:${pair.eTypeA}-[${rel.rType}]->${pair.eTypeB}.${propName}`;

              fields.push({
                name: fieldName,
                label: `${pair.eTypeA} -[${rel.rType}]-> ${pair.eTypeB} > ${propName}`,
                inputType: typeToInputType[propType] || 'text',
                operators: typeToOperators[propType] || typeToOperators.string,
                valueSources: ['value']
              });
            });
        }
      });
    });
  }

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
      // Check if it's a relationship rule
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

  // Generate query with relationship patterns
  if (relationships.length > 0) {
    let query = 'query {\n';
    relationships.forEach(rel => {
      query += `  # Pattern: ${rel.source} -[${rel.relation}]-> ${rel.target}\n`;
      query += `  ${rel.source.toLowerCase()}s {\n`;
      query += `    id\n`;
      query += `    ${rel.relation.toLowerCase()} {\n`;
      query += `      ... on ${rel.target} {\n`;
      query += `        id\n`;
      if (rel.property) {
        query += `        ${rel.property}\n`;
      }
      query += `      }\n`;
      query += `    }\n`;
      query += `  }\n`;
    });
    query += '}';
    return query;
  }

  // Generate a simple query structure for entity properties
  if (whereClause) {
    return `query {\n  ${Array.from(entityTypes).join(', ')} {\n    where: ${whereClause}\n  }\n}`;
  }

  return '';
}

export default convertOntologyToQueryBuilderFields;
