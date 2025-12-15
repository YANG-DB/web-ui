/**
 * Converts Dragons ontology format to GraphQL SDL (Schema Definition Language)
 */

const typeMapping = {
  string: 'String',
  text: 'String',
  int: 'Int',
  float: 'Float',
  date: 'String',
  datetime: 'String',
  geo_point: 'String',
  array: '[String]'
};

export function convertOntologyToGraphQL(ontologyData) {
  if (!ontologyData || !ontologyData.data || !ontologyData.data[0]) {
    return generateDefaultSchema();
  }

  const ontology = ontologyData.data[0];
  const { entityTypes, relationshipTypes, properties } = ontology;

  let schema = `# Generated from ${ontology.ont || 'Unknown'} Ontology\n\n`;

  // Create a map of property types
  const propertyTypeMap = {};
  if (properties) {
    properties.forEach(prop => {
      propertyTypeMap[prop.pType] = typeMapping[prop.type] || 'String';
    });
  }

  // Track union types we need to create
  const unionTypes = new Set();

  // Generate entity types
  if (entityTypes && entityTypes.length > 0) {
    entityTypes.forEach(entity => {
      schema += `type ${entity.eType} {\n`;

      if (entity.properties && entity.properties.length > 0) {
        entity.properties.forEach(propName => {
          const propType = propertyTypeMap[propName] || 'String';
          // Don't make metadata fields required
          const isRequired = !entity.metadata?.includes(propName);
          schema += `  ${propName}: ${propType}${isRequired ? '!' : ''}\n`;
        });
      }

      // Add relationships as fields
      if (relationshipTypes && relationshipTypes.length > 0) {
        // Group relationships by name to avoid duplicates
        const relationshipFields = {};

        relationshipTypes.forEach(rel => {
          rel.ePairs.forEach(pair => {
            if (pair.eTypeA === entity.eType) {
              const fieldName = rel.rType.toLowerCase();
              if (!relationshipFields[fieldName]) {
                relationshipFields[fieldName] = new Set();
              }
              relationshipFields[fieldName].add(pair.eTypeB);
            }
            // For bidirectional relationships
            if (!rel.directional && pair.eTypeB === entity.eType) {
              const fieldName = rel.rType.toLowerCase();
              if (!relationshipFields[fieldName]) {
                relationshipFields[fieldName] = new Set();
              }
              relationshipFields[fieldName].add(pair.eTypeA);
            }
          });
        });

        // Output unique relationship fields
        Object.keys(relationshipFields).forEach(fieldName => {
          const targetTypes = Array.from(relationshipFields[fieldName]).sort();
          if (targetTypes.length === 1) {
            schema += `  ${fieldName}: [${targetTypes[0]}]\n`;
          } else {
            // Multiple target types - create a union type
            const unionName = targetTypes.join('Or');
            unionTypes.add({ name: unionName, types: targetTypes });
            schema += `  ${fieldName}: [${unionName}]\n`;
          }
        });
      }

      schema += `}\n\n`;
    });
  }

  // Generate union types
  if (unionTypes.size > 0) {
    unionTypes.forEach(union => {
      schema += `union ${union.name} = ${union.types.join(' | ')}\n\n`;
    });
  }

  // Generate Query type
  schema += `type Query {\n`;
  if (entityTypes && entityTypes.length > 0) {
    entityTypes.forEach(entity => {
      const entityLower = entity.eType.toLowerCase();
      schema += `  ${entityLower}(id: ID!): ${entity.eType}\n`;
      schema += `  ${entityLower}s(limit: Int = 10, offset: Int = 0): [${entity.eType}]\n`;
    });
  }
  schema += `}\n\n`;

  // Generate Mutation type
  schema += `type Mutation {\n`;
  if (entityTypes && entityTypes.length > 0) {
    entityTypes.forEach(entity => {
      const entityLower = entity.eType.toLowerCase();
      schema += `  create${entity.eType}(input: Create${entity.eType}Input!): ${entity.eType}\n`;
      schema += `  update${entity.eType}(id: ID!, input: Update${entity.eType}Input!): ${entity.eType}\n`;
      schema += `  delete${entity.eType}(id: ID!): Boolean\n`;
    });
  }
  schema += `}\n\n`;

  // Generate Input types for mutations
  if (entityTypes && entityTypes.length > 0) {
    entityTypes.forEach(entity => {
      // Create input
      schema += `input Create${entity.eType}Input {\n`;
      if (entity.properties && entity.properties.length > 0) {
        entity.properties
          .filter(prop => !entity.metadata?.includes(prop))
          .forEach(propName => {
            const propType = propertyTypeMap[propName] || 'String';
            schema += `  ${propName}: ${propType}\n`;
          });
      }
      schema += `}\n\n`;

      // Update input (all fields optional)
      schema += `input Update${entity.eType}Input {\n`;
      if (entity.properties && entity.properties.length > 0) {
        entity.properties
          .filter(prop => !entity.metadata?.includes(prop))
          .forEach(propName => {
            const propType = propertyTypeMap[propName] || 'String';
            schema += `  ${propName}: ${propType}\n`;
          });
      }
      schema += `}\n\n`;
    });
  }

  return schema;
}

function generateDefaultSchema() {
  return `# Default GraphQL Schema
# Load an ontology to generate schema automatically

type Query {
  hello: String
}

type Mutation {
  updateHello(message: String!): String
}
`;
}

export default convertOntologyToGraphQL;
