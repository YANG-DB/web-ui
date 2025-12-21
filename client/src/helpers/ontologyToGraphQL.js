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

      // Add relationships as resolver fields with filtering
      if (relationshipTypes && relationshipTypes.length > 0) {
        // Group relationships by name to avoid duplicates
        const relationshipFields = {};

        relationshipTypes.forEach(rel => {
          rel.ePairs.forEach(pair => {
            if (pair.eTypeA === entity.eType) {
              const fieldName = rel.rType.toLowerCase();
              if (!relationshipFields[fieldName]) {
                relationshipFields[fieldName] = {
                  relType: rel.rType,
                  targets: new Set(),
                  hasProperties: rel.properties && rel.properties.length > 0
                };
              }
              relationshipFields[fieldName].targets.add(pair.eTypeB);
            }
            // For bidirectional relationships
            if (!rel.directional && pair.eTypeB === entity.eType) {
              const fieldName = rel.rType.toLowerCase();
              if (!relationshipFields[fieldName]) {
                relationshipFields[fieldName] = {
                  relType: rel.rType,
                  targets: new Set(),
                  hasProperties: rel.properties && rel.properties.length > 0
                };
              }
              relationshipFields[fieldName].targets.add(pair.eTypeA);
            }
          });
        });

        // Output unique relationship fields with resolver arguments
        Object.keys(relationshipFields).forEach(fieldName => {
          const fieldData = relationshipFields[fieldName];
          const targetTypes = Array.from(fieldData.targets).sort();

          schema += `  # Relationship: ${fieldData.relType}\n`;

          if (targetTypes.length === 1) {
            schema += `  ${fieldName}(\n`;
            schema += `    filter: ${targetTypes[0]}FilterInput\n`;
            schema += `    limit: Int = 10\n`;
            schema += `    offset: Int = 0\n`;
            schema += `  ): [${targetTypes[0]}]\n`;
          } else {
            // Multiple target types - create a union type
            const unionName = targetTypes.join('Or');
            unionTypes.add({ name: unionName, types: targetTypes });
            schema += `  ${fieldName}(\n`;
            schema += `    limit: Int = 10\n`;
            schema += `    offset: Int = 0\n`;
            schema += `  ): [${unionName}]\n`;
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

  // Generate Query type with relationship resolvers
  schema += `type Query {\n`;
  if (entityTypes && entityTypes.length > 0) {
    entityTypes.forEach(entity => {
      const entityLower = entity.eType.toLowerCase();
      schema += `  # Basic entity queries\n`;
      schema += `  ${entityLower}(id: ID!): ${entity.eType}\n`;
      schema += `  ${entityLower}s(where: ${entity.eType}FilterInput, limit: Int = 10, offset: Int = 0): [${entity.eType}]\n`;
      schema += `\n`;
    });

    // Add relationship-based join queries
    if (relationshipTypes && relationshipTypes.length > 0) {
      schema += `  # Relationship join queries\n`;

      relationshipTypes.forEach(rel => {
        rel.ePairs.forEach(pair => {
          const sourceType = pair.eTypeA;
          const targetType = pair.eTypeB;
          const relName = rel.rType;
          const queryName = `${sourceType.toLowerCase()}${relName}${targetType}`;

          schema += `  # Query ${sourceType} entities and their ${relName} ${targetType} relationships\n`;
          schema += `  ${queryName}(\n`;
          schema += `    sourceId: ID\n`;
          schema += `    targetId: ID\n`;
          schema += `    limit: Int = 10\n`;
          schema += `    offset: Int = 0\n`;
          schema += `  ): [${sourceType}${relName}${targetType}Result]\n`;
          schema += `\n`;
        });
      });

      // Add correlated multi-relationship queries
      // These enforce that ALL specified relationships must exist (non-empty)
      schema += `  # Correlated multi-relationship queries (enforce non-empty relations)\n`;

      // Group relationships by source entity type
      const relsBySource = {};
      relationshipTypes.forEach(rel => {
        rel.ePairs.forEach(pair => {
          const sourceType = pair.eTypeA;
          if (!relsBySource[sourceType]) {
            relsBySource[sourceType] = [];
          }
          relsBySource[sourceType].push({
            relType: rel.rType,
            targetType: pair.eTypeB
          });
        });
      });

      // For entities with multiple relationships, create correlated queries
      Object.entries(relsBySource).forEach(([sourceType, rels]) => {
        // Only create correlated queries for entities with 2+ relationships
        if (rels.length >= 2) {
          // Create queries for common relationship combinations
          // Example: dragonsWithFireAndFreeze
          const relNames = rels.map(r => r.relType).sort();

          // For self-referential relationships (Dragon->Dragon), create combined queries
          const selfRels = rels.filter(r => r.targetType === sourceType);
          if (selfRels.length >= 2) {
            const relPart = selfRels.map(r => r.relType).join('And');
            const queryName = `${sourceType.toLowerCase()}sWith${relPart}`;
            const sourceLower = sourceType.toLowerCase();

            schema += `  # Query ${sourceType} entities that have ALL of: ${selfRels.map(r => r.relType).join(', ')}\n`;
            schema += `  ${queryName}(\n`;
            schema += `    where: ${sourceType}FilterInput\n`;
            schema += `    limit: Int = 10\n`;
            schema += `    offset: Int = 0\n`;
            schema += `  ): [${sourceType}]\n`;
            schema += `\n`;
          }
        }
      });
    }
  }
  schema += `}\n\n`;

  // Generate relationship result types for join queries
  if (relationshipTypes && relationshipTypes.length > 0) {
    schema += `# Relationship join result types\n`;
    relationshipTypes.forEach(rel => {
      rel.ePairs.forEach(pair => {
        const sourceType = pair.eTypeA;
        const targetType = pair.eTypeB;
        const relName = rel.rType;
        const resultTypeName = `${sourceType}${relName}${targetType}Result`;

        schema += `type ${resultTypeName} {\n`;
        schema += `  source: ${sourceType}!\n`;
        schema += `  relationship: ${relName}Relationship!\n`;
        schema += `  target: ${targetType}!\n`;
        schema += `}\n\n`;
      });
    });

    // Generate relationship edge types
    schema += `# Relationship edge types with properties\n`;
    const uniqueRelationships = new Set();
    relationshipTypes.forEach(rel => {
      if (!uniqueRelationships.has(rel.rType)) {
        uniqueRelationships.add(rel.rType);
        schema += `type ${rel.rType}Relationship {\n`;
        schema += `  type: String!\n`;

        // Add relationship properties if they exist
        if (rel.properties && rel.properties.length > 0) {
          rel.properties.forEach(propName => {
            const propType = propertyTypeMap[propName] || 'String';
            schema += `  ${propName}: ${propType}\n`;
          });
        }

        schema += `}\n\n`;
      }
    });
  }

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

  // Generate Input types for mutations and filters
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

      // Filter input for relationship resolvers
      schema += `input ${entity.eType}FilterInput {\n`;
      if (entity.properties && entity.properties.length > 0) {
        entity.properties
          .filter(prop => !entity.metadata?.includes(prop))
          .forEach(propName => {
            const propType = propertyTypeMap[propName] || 'String';
            // Add common filter operators
            schema += `  ${propName}: ${propType}\n`;
            schema += `  ${propName}_not: ${propType}\n`;
            if (propType === 'String') {
              schema += `  ${propName}_contains: ${propType}\n`;
              schema += `  ${propName}_starts_with: ${propType}\n`;
              schema += `  ${propName}_ends_with: ${propType}\n`;
            }
            if (propType === 'Int' || propType === 'Float') {
              schema += `  ${propName}_gt: ${propType}\n`;
              schema += `  ${propName}_gte: ${propType}\n`;
              schema += `  ${propName}_lt: ${propType}\n`;
              schema += `  ${propName}_lte: ${propType}\n`;
            }
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
