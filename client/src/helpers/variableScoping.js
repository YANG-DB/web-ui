/**
 * Variable Scoping Manager
 * Handles entity variable generation, context tracking, and scope resolution
 * for Cypher-like variable scoping in the Visual Query Builder
 */

class VariableScopingManager {
  constructor() {
    this.variableCounters = {};
    this.variableRegistry = {};
    this.contextHierarchy = {
      root: {
        id: 'root',
        parentId: null,
        localVariables: [],
        inheritedVariables: [],
        children: []
      }
    };
  }

  /**
   * Generate a new variable for an entity type
   * @param {string} entityType - e.g., "Person", "Dragon"
   * @param {string} ruleId - ID of the rule creating this variable
   * @param {string} contextId - ID of the context
   * @param {string} role - "source" or "target"
   * @returns {Object} Variable metadata
   */
  generateVariable(entityType, ruleId, contextId, role) {
    // Increment counter for this entity type
    if (!this.variableCounters[entityType]) {
      this.variableCounters[entityType] = 0;
    }
    this.variableCounters[entityType]++;

    // Generate alias (e.g., "p1", "d2")
    const prefix = entityType.charAt(0).toLowerCase();
    const alias = `${prefix}${this.variableCounters[entityType]}`;
    const variableId = `${entityType}(${alias})`;

    // Register variable
    const variable = {
      id: variableId,
      entityType,
      alias,
      ruleId,
      contextId,
      role,
      usages: [{ ruleId, role }]
    };

    this.variableRegistry[variableId] = variable;

    return variable;
  }

  /**
   * Create a new context for a relationship pattern
   * @param {string} contextId - Unique context ID
   * @param {string} parentContextId - Parent context ID
   * @param {Object} sourceVariable - Source entity variable
   * @param {Object} targetVariable - Target entity variable
   */
  createPatternContext(contextId, parentContextId, sourceVariable, targetVariable) {
    const localVariables = [sourceVariable.id, targetVariable.id];
    const inheritedVariables = this.getInheritedVariables(parentContextId);

    this.contextHierarchy[contextId] = {
      id: contextId,
      parentId: parentContextId,
      localVariables,
      inheritedVariables,
      children: []
    };

    // Update parent's children
    if (parentContextId && this.contextHierarchy[parentContextId]) {
      this.contextHierarchy[parentContextId].children.push(contextId);
    }
  }

  /**
   * Create a new context for a nested group
   * @param {string} contextId - Unique context ID
   * @param {string} parentContextId - Parent context ID
   */
  createGroupContext(contextId, parentContextId) {
    const inheritedVariables = this.getAvailableVariables(parentContextId);

    this.contextHierarchy[contextId] = {
      id: contextId,
      parentId: parentContextId,
      localVariables: [],
      inheritedVariables,
      children: []
    };

    // Update parent's children
    if (parentContextId && this.contextHierarchy[parentContextId]) {
      this.contextHierarchy[parentContextId].children.push(contextId);
    }
  }

  /**
   * Get all variables available in a given context
   * Includes inherited + local variables
   * @param {string} contextId - Context ID
   * @returns {Array<string>} Array of variable IDs
   */
  getAvailableVariables(contextId) {
    if (!contextId || !this.contextHierarchy[contextId]) {
      return [];
    }

    const context = this.contextHierarchy[contextId];
    const inherited = context.inheritedVariables || [];
    const local = context.localVariables || [];

    return [...inherited, ...local];
  }

  /**
   * Get inherited variables from parent contexts
   * @param {string} contextId - Context ID
   * @returns {Array<string>} Array of variable IDs
   */
  getInheritedVariables(contextId) {
    if (!contextId || contextId === 'root') {
      return [];
    }

    return this.getAvailableVariables(contextId);
  }

  /**
   * Get variable metadata by ID
   * @param {string} variableId - e.g., "Person(p1)"
   * @returns {Object} Variable metadata
   */
  getVariable(variableId) {
    return this.variableRegistry[variableId];
  }

  /**
   * Record a usage of a variable (e.g., in a property condition)
   * @param {string} variableId - Variable ID
   * @param {string} ruleId - Rule ID using this variable
   * @param {string} usageType - "filter-reference", "return", etc.
   */
  recordVariableUsage(variableId, ruleId, usageType) {
    if (this.variableRegistry[variableId]) {
      this.variableRegistry[variableId].usages.push({
        ruleId,
        role: usageType
      });
    }
  }

  /**
   * Get all variables of a specific entity type
   * @param {string} entityType - e.g., "Person"
   * @returns {Array<Object>} Array of variable metadata
   */
  getVariablesByType(entityType) {
    return Object.values(this.variableRegistry).filter(
      v => v.entityType === entityType
    );
  }

  /**
   * Check if a variable ID exists
   * @param {string} variableId - e.g., "Person(p1)"
   * @returns {boolean}
   */
  hasVariable(variableId) {
    return !!this.variableRegistry[variableId];
  }

  /**
   * Reset the entire scoping state
   */
  reset() {
    this.variableCounters = {};
    this.variableRegistry = {};
    this.contextHierarchy = {
      root: {
        id: 'root',
        parentId: null,
        localVariables: [],
        inheritedVariables: [],
        children: []
      }
    };
  }

  /**
   * Get a summary of the current scoping state for debugging
   * @returns {Object}
   */
  getDebugInfo() {
    return {
      variableCount: Object.keys(this.variableRegistry).length,
      contextCount: Object.keys(this.contextHierarchy).length,
      variables: Object.keys(this.variableRegistry),
      contexts: Object.keys(this.contextHierarchy)
    };
  }
}

export default VariableScopingManager;
