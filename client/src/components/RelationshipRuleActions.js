import React, { useMemo } from 'react';

/**
 * Custom action buttons for relationship rules
 * Adds a "+" button next to the remove button for relationship rules
 */
export default function RelationshipRuleActions({
  level,
  path,
  ruleOrGroup,
  schema,
  handleOnClick,
  className,
  ontology,
  onExpandRelationship
}) {
  // Check if this is a relationship operator rule
  const isRelationshipRule = useMemo(() => {
    // Only apply to rules, not groups
    if (!ruleOrGroup || 'rules' in ruleOrGroup) {
      return false;
    }

    const rule = ruleOrGroup;

    // Check if already expanded
    if (rule._expanded) {
      return false;
    }

    // Check if this has a relationship operator
    if (!rule.operator || !ontology || !ontology.data || !ontology.data[0]) {
      return false;
    }

    const { relationshipTypes } = ontology.data[0];
    if (!relationshipTypes) {
      return false;
    }

    const relationship = relationshipTypes.find(r => r.rType === rule.operator);

    // Show + button if it's a relationship rule with a field selected
    // Value might be empty initially but will be set by the dropdown
    return relationship && rule.field;
  }, [ruleOrGroup, ontology]);

  return (
    <>
      {isRelationshipRule && (
        <button
          type="button"
          className={className}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onExpandRelationship) {
              onExpandRelationship(ruleOrGroup.id, path);
            }
          }}
          title="Expand relationship to query target entity"
          style={{
            background: 'var(--highlight)',
            borderColor: 'var(--highlight)',
            marginRight: '4px'
          }}
        >
          +
        </button>
      )}
      <button
        type="button"
        className={className}
        onClick={handleOnClick}
        title="Remove rule"
      >
        ×
      </button>
    </>
  );
}
