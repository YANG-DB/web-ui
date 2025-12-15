import React, { useMemo } from 'react';

/**
 * Custom value editor for relationship operators
 * Displays target entities when a relationship operator is selected
 * Falls back to default input for regular property fields
 */
export default function RelationshipValueEditor({
  field,
  operator,
  value,
  handleOnChange,
  fieldData,
  ontology,
  type,
  inputType,
  values
}) {
  // Check if this is a relationship operator
  const isRelationshipOperator = useMemo(() => {
    if (!operator || !ontology || !ontology.data || !ontology.data[0]) {
      return false;
    }

    const { relationshipTypes } = ontology.data[0];
    if (!relationshipTypes) {
      return false;
    }

    return relationshipTypes.some(r => r.rType === operator);
  }, [operator, ontology]);

  const targetEntities = useMemo(() => {
    // Only compute target entities if this is a relationship operator
    if (!isRelationshipOperator) {
      return null;
    }

    const { relationshipTypes } = ontology.data[0];
    const relationship = relationshipTypes.find(r => r.rType === operator);

    if (relationship) {
      const targets = [];
      // Find all target entities where this entity is the source
      relationship.ePairs.forEach(pair => {
        if (pair.eTypeA === field) {
          targets.push({
            name: pair.eTypeB,
            label: pair.eTypeB
          });
        }
      });

      if (targets.length > 0) {
        return targets;
      }
    }

    return null;
  }, [field, operator, ontology, isRelationshipOperator]);

  // If this is NOT a relationship operator, use default input
  if (!isRelationshipOperator) {
    // Use the inputType from fieldData to determine the input element
    const inputTypeToUse = inputType || fieldData?.inputType || 'text';

    return (
      <input
        type={inputTypeToUse}
        value={value || ''}
        onChange={(e) => handleOnChange(e.target.value)}
        style={{
          background: 'var(--dark-two)',
          border: '1px solid #4a4a4a',
          borderRadius: '3px',
          color: 'white',
          padding: '6px 10px',
          fontSize: '13px',
          minWidth: '150px'
        }}
      />
    );
  }

  // For relationship operators, show dropdown of target entities
  return (
    <select
      value={value || (targetEntities && targetEntities.length > 0 ? targetEntities[0].name : '')}
      onChange={(e) => handleOnChange(e.target.value)}
      style={{
        background: 'var(--dark-two)',
        border: '1px solid #4a4a4a',
        borderRadius: '3px',
        color: 'white',
        padding: '6px 10px',
        fontSize: '13px'
      }}
    >
      {targetEntities && targetEntities.map(entity => (
        <option key={entity.name} value={entity.name}>
          {entity.label}
        </option>
      ))}
    </select>
  );
}
