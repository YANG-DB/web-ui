import React, { useCallback, useState, useEffect } from "react";
import { Resizable } from "re-resizable";
import { connect } from "react-redux";
import { submitQuery, storeResults, cacheQuery } from "../reducers/research";
import { VisualQueryBuilder, Results } from "../components";
import apiService from "../services/api";
import { generateMockGraphData } from "../helpers/mockGraphGenerators";
import styles from "../App.module.css";
import researchStyles from "./Research.module.css";

function Research({
  submitQuery,
  storeResults,
  results,
  lastQuery,
  cacheQuery
}) {
  const [ontologies, setOntologies] = useState([]);
  const [selectedOntology, setSelectedOntology] = useState('dragons');
  const [useMockData, setUseMockData] = useState(false);

  // Load available ontologies on mount
  useEffect(() => {
    apiService.getOntologies().then(data => {
      setOntologies(data.ontologies);
      setUseMockData(false); // Server is available
    }).catch(error => {
      console.error("Failed to load ontologies list:", error);
      console.warn("Server unavailable - switching to mock data mode");
      setUseMockData(true); // Use mock data when server is down
      // Use default ontologies
      setOntologies([
        { id: 'dragons', name: 'Dragons' },
        { id: 'linkedin', name: 'LinkedIn' }
      ]);
    });
  }, []);

  // Helper to detect which template was used based on query structure
  const detectTemplateIndex = useCallback((query, ontologyType) => {
    if (!query || !query.rules || query.rules.length === 0) {
      return -1; // No template, return empty data
    }

    const firstRule = query.rules[0];

    if (ontologyType === 'dragons') {
      // Template 0: Person.firstName notNull
      if (firstRule.field === 'Person.firstName' && firstRule.operator === 'notNull') return 0;

      // Template 1: Dragon.color =
      if (firstRule.field === 'Dragon.color' && firstRule.operator === '=') return 1;

      // Template 2: Person.firstName notNull AND Person.lastName notNull
      if (query.rules.length >= 2 &&
          firstRule.field === 'Person.firstName' &&
          query.rules[1].field === 'Person.lastName') return 2;

      // Template 3: Dragon.color OR condition
      if (query.combinator === 'or' && firstRule.field === 'Dragon.color') return 3;

      // Template 4: Person.firstName AND gender condition
      if (firstRule.field === 'Person.firstName' && query.rules.length > 1) {
        const hasGenderRule = query.rules.some(r =>
          r.combinator === 'or' || (r.rules && r.rules.some(sr => sr.field === 'Person.gender'))
        );
        if (hasGenderRule) return 4;
      }

      // Template 5: Person Own Dragon
      if (firstRule.field === 'Person' && firstRule.operator === 'Own') return 5;

      // Template 6: Person MemberOf Guild
      if (firstRule.field === 'Person' && firstRule.operator === 'MemberOf') return 6;

      // Template 7: Person Know Person with firstName George
      if (firstRule.field === 'Person' && firstRule.operator === 'Know' && query.rules.length >= 2) {
        const hasGeorge = query.rules.some(r => r.field === 'Person.firstName' && r.value === 'George');
        if (hasGeorge) return 7;
      }

      // Template 8: Multi-relationship complex query
      if (firstRule.field === 'Person' && firstRule.operator === 'OriginatedIn') return 8;

    } else if (ontologyType === 'linkedin') {
      // Template 0: Person.name notNull
      if (firstRule.field === 'Person.name' && firstRule.operator === 'notNull') return 0;

      // Template 1: Company.name =
      if (firstRule.field === 'Company.name' && firstRule.operator === '=') return 1;

      // Template 2: Person.name AND email contains
      if (query.rules.length >= 2 &&
          firstRule.field === 'Person.name' &&
          query.rules[1].field === 'Person.email') return 2;

      // Template 3: Company.industry OR condition
      if (query.combinator === 'or' && firstRule.field === 'Company.industry') return 3;

      // Template 4: Person.name AND title contains
      if (firstRule.field === 'Person.name' && query.rules.length > 1) {
        const hasTitleRule = query.rules.some(r =>
          r.combinator === 'or' || (r.rules && r.rules.some(sr => sr.field === 'Person.title'))
        );
        if (hasTitleRule) return 4;
      }

      // Template 5: Person WorksAt Company
      if (firstRule.field === 'Person' && firstRule.operator === 'WorksAt') return 5;

      // Template 6: Person ConnectedTo Person
      if (firstRule.field === 'Person' && firstRule.operator === 'ConnectedTo' &&
          firstRule.value === 'Person' && query.rules.length === 1) return 6;

      // Template 7: Person Founded Company
      if (firstRule.field === 'Person' && firstRule.operator === 'Founded') return 7;

      // Template 8: Person ConnectedTo Person with name John Smith
      if (firstRule.field === 'Person' && firstRule.operator === 'ConnectedTo' && query.rules.length >= 2) {
        const hasJohn = query.rules.some(r => r.field === 'Person.name' && r.value === 'John Smith');
        if (hasJohn) return 8;
      }

      // Template 9: Multi-relationship LinkedIn query
      if (firstRule.field === 'Person' && firstRule.operator === 'WorksAt' && query.rules.length >= 2) {
        const hasIndustry = query.rules.some(r => r.field === 'Company.industry');
        if (hasIndustry) return 9;
      }
    }

    return 0; // Default to template 0
  }, []);

  const onSubmit = useCallback(query => {
    console.log("========== QUERY SUBMISSION START ==========");
    console.log("Visual query submitted:", query);
    console.log("useMockData:", useMockData);
    console.log("selectedOntology:", selectedOntology);
    submitQuery(query);

    if (useMockData) {
      // Generate mock data based on query
      const templateIndex = detectTemplateIndex(query, selectedOntology);
      console.log("🎯 Detected template index:", templateIndex, "for ontology:", selectedOntology);

      const mockData = generateMockGraphData(selectedOntology, templateIndex, 15);
      console.log("📊 Generated mock data:", mockData);
      console.log("  - Entities count:", mockData.entities.length);
      console.log("  - Relationships count:", mockData.relationships.length);

      // Format mock data to match expected structure
      // Create pattern from unique entity types in the mock data
      const uniqueTypes = [...new Set(mockData.entities.map(e => e.eTag[0]))];
      const pattern = {
        elements: uniqueTypes.map(eTag => ({ eTag }))
      };

      const mockResults = {
        data: {
          assignments: [{
            entities: mockData.entities,
            relationships: mockData.relationships
          }],
          pattern: pattern
        }
      };

      console.log("✅ Formatted mock results:", mockResults);
      console.log("  - Total assignments:", mockResults.data.assignments.length);
      console.log("  - Assignment 0 entities:", mockResults.data.assignments[0].entities.length);
      console.log("  - Assignment 0 relationships:", mockResults.data.assignments[0].relationships.length);

      storeResults(mockResults);
      console.log("✅ Mock results stored in Redux");
    } else {
      // Use real API
      console.log("📡 Calling real API...");
      apiService.getResult(query).then(results => {
        console.log("✅ API results received:", results);
        storeResults(results);
      }).catch(error => {
        console.error("❌ Error fetching results:", error);
        // Fallback to mock data on error
        console.warn("⚠️ API error - falling back to mock data");
        const templateIndex = detectTemplateIndex(query, selectedOntology);
        console.log("🎯 Detected template index (fallback):", templateIndex);

        const mockData = generateMockGraphData(selectedOntology, templateIndex, 15);
        console.log("📊 Generated fallback mock data:", mockData);

        // Create pattern from unique entity types in the mock data
        const uniqueTypes = [...new Set(mockData.entities.map(e => e.eTag[0]))];
        const pattern = {
          elements: uniqueTypes.map(eTag => ({ eTag }))
        };

        const mockResults = {
          data: {
            assignments: [{
              entities: mockData.entities,
              relationships: mockData.relationships
            }],
            pattern: pattern
          }
        };

        console.log("✅ Formatted fallback mock results:", mockResults);
        storeResults(mockResults);
        console.log("✅ Fallback mock results stored in Redux");
      });
    }
    console.log("========== QUERY SUBMISSION END ==========");
  }, [submitQuery, storeResults, useMockData, selectedOntology, detectTemplateIndex]);

  return (
    <div className={styles.row}>
      <div className={styles.column} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className={researchStyles.ontologySelector}>
          <label htmlFor="research-ontology-select">Ontology: </label>
          <select
            id="research-ontology-select"
            value={selectedOntology}
            onChange={(e) => setSelectedOntology(e.target.value)}
          >
            {ontologies.map(ont => (
              <option key={ont.id} value={ont.id}>
                {ont.name}
              </option>
            ))}
          </select>

          <label style={{ marginLeft: '20px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={useMockData}
              onChange={(e) => setUseMockData(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Use Mock Data</span>
          </label>
        </div>
        <Resizable
          defaultSize={{
            height: '40%',
            width: '100%'
          }}
          minHeight={200}
          maxHeight="80%"
          enable={{
            top: false,
            right: false,
            bottom: true,
            left: false,
            topRight: false,
            bottomRight: false,
            bottomLeft: false,
            topLeft: false
          }}
          handleStyles={{
            bottom: {
              height: '12px',
              bottom: '-6px',
              cursor: 'row-resize',
              background: 'linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.05) 40%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 60%, transparent 100%)',
              zIndex: 10
            }
          }}
          handleComponent={{
            bottom: (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  pointerEvents: 'none'
                }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '6px',
                    background: '#6a6a6a',
                    borderRadius: '3px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  className="resize-handle-bar"
                />
              </div>
            )
          }}
          style={{ marginBottom: '10px' }}
        >
          <VisualQueryBuilder onSubmit={onSubmit} ontologyType={selectedOntology} />
        </Resizable>
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <Results results={results} />
        </div>
      </div>
      {/* Aggregates/Trends panel removed */}
    </div>
  );
}

export default connect(
  state => ({
    lastQuery: state.research.lastQuery,
    results:
      state.research.history[state.research.history.length - 1] &&
      state.research.history[state.research.history.length - 1].results
  }),
  { submitQuery, storeResults, cacheQuery }
)(Research);
