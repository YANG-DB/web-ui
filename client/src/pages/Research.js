import React, { useCallback, useState, useEffect, useRef } from "react";
import { Resizable } from "re-resizable";
import { connect } from "react-redux";
import { submitQuery, storeResults, cacheQuery } from "../reducers/research";
import { VisualQueryBuilder, Results } from "../components";
import apiService from "../services/api";
import fuse, { fuseBaseUrl } from "../services/fuse";
import queryToCypher from "../helpers/queryToCypher";
import queryToV1 from "../helpers/queryToV1";
import normalizeFuseResult, { appendFuseResult, resolveOntologyId } from "../helpers/normalizeFuseResult";
import { generateMockGraphData } from "../helpers/mockGraphGenerators";
import styles from "../App.module.css";
import researchStyles from "./Research.module.css";

// Page size for Fuse runs (graph view).
const PAGE_SIZE = 100;

function RunStatus({ run, elapsed, onLoadMore }) {
  if (run.running) {
    return (
      <div className={researchStyles.runStatus} role="status">
        <span className={researchStyles.spinner} aria-hidden="true" /> Running… {(elapsed / 1000).toFixed(1)}s
      </div>
    );
  }
  if (run.error) {
    return (
      <div className={researchStyles.runError} role="alert">
        <strong>Query failed:</strong> {run.error}
      </div>
    );
  }
  if (run.count == null) return null;
  return (
    <div className={researchStyles.runStatus} role="status">
      {run.count} result{run.count === 1 ? '' : 's'}{run.language ? ` (${run.language === 'v1' ? 'V1' : 'Cypher'})` : ''}
      {run.hasMore && (
        <button className={researchStyles.loadMore} onClick={onLoadMore} disabled={run.loadingMore}>
          {run.loadingMore ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  );
}

function Research({
  submitQuery,
  storeResults,
  results,
  lastQuery,
  cacheQuery
}) {
  const [ontologies, setOntologies] = useState([]);
  const [selectedOntology, setSelectedOntology] = useState('dragons');
  // Backends: "fuse" (YangDB), "mock" (server.js, falls back to generated data),
  // "generated" (client-side sample data, no server needed).
  const [backend, setBackend] = useState(null);
  const [fuseUp, setFuseUp] = useState(null);
  const [fuseOntologyIds, setFuseOntologyIds] = useState([]);
  // The builder waits for the ontology list, so it never asks Fuse for an unresolved id.
  const [ontologiesReady, setOntologiesReady] = useState(false);
  const [notice, setNotice] = useState(null);
  const [language, setLanguage] = useState('cypher');
  const [run, setRun] = useState({ running: false });
  const [elapsed, setElapsed] = useState(0);
  const lastQueryId = useRef(null);
  const [queryBuilderCollapsed, setQueryBuilderCollapsed] = useState(false);
  const [resultsCollapsed, setResultsCollapsed] = useState(false);

  // Pick the backend once on mount: Fuse when it answers, otherwise the mock server,
  // otherwise generated data.
  useEffect(() => {
    let cancelled = false;
    fuse.health().then(up => {
      if (cancelled) return;
      setFuseUp(up);
      if (up) {
        setBackend('fuse');
        return;
      }
      apiService.getOntologies()
        .then(() => !cancelled && setBackend('mock'))
        .catch(() => !cancelled && setBackend('generated'));
      setNotice(`Fuse is not reachable at ${fuseBaseUrl()}, so mock data is shown. Start Fuse and pick it above.`);
    });
    return () => { cancelled = true; };
  }, []);

  // Keep the connection dot current.
  useEffect(() => {
    const timer = setInterval(() => fuse.health().then(setFuseUp), 15000);
    return () => clearInterval(timer);
  }, []);

  // Ontology list for the selected backend.
  useEffect(() => {
    if (!backend) return;
    let cancelled = false;
    setOntologiesReady(false);
    const fallback = [
      { id: 'dragons', name: 'Dragons' },
      { id: 'linkedin', name: 'LinkedIn' },
      { id: 'flights', name: 'Flights' }
    ];
    const pick = list => {
      if (cancelled) return;
      setOntologies(list);
      setOntologiesReady(true);
      setSelectedOntology(current =>
        list.some(o => o.id === current) ? current : (list.find(o => o.id === 'dragons') || list[0] || { id: current }).id
      );
    };

    if (backend === 'fuse') {
      fuse.listOntologies().then(list => {
        if (cancelled) return;
        setFuseOntologyIds(list.map(o => o.ont));
        setNotice(null);
        pick(list.map(o => ({ id: o.ont.toLowerCase(), name: o.ont })));
      }).catch(error => {
        if (cancelled) return;
        setNotice(`Could not load ontologies from Fuse: ${error.message}`);
        pick([]);
      });
    } else if (backend === 'mock') {
      apiService.getOntologies().then(data => pick(data.ontologies)).catch(() => pick(fallback));
    } else {
      pick(fallback);
    }
    return () => { cancelled = true; };
  }, [backend]);

  // Where the builder loads the selected ontology from.
  const loadOntology = useCallback(type => {
    if (backend === 'fuse') {
      return fuse.getOntology(resolveOntologyId(fuseOntologyIds, type) || type);
    }
    return apiService.getOntology(type);
  }, [backend, fuseOntologyIds]);

  // Elapsed timer while a query runs.
  useEffect(() => {
    if (!run.running) return;
    const started = Date.now();
    setElapsed(0);
    const timer = setInterval(() => setElapsed(Date.now() - started), 100);
    return () => clearInterval(timer);
  }, [run.running]);

  const forgetQuery = useCallback(() => {
    if (lastQueryId.current) {
      fuse.deleteQuery(lastQueryId.current).catch(() => null);
      lastQueryId.current = null;
    }
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

      // Template 8: Person Own Dragon plus more conditions (multi-relationship)
      if (firstRule.field === 'Person' && firstRule.operator === 'Own' && query.rules.length > 1) return 8;

      // Template 5: Person Own Dragon
      if (firstRule.field === 'Person' && firstRule.operator === 'Own') return 5;

      // Template 6: Person MemberOf Guild
      if (firstRule.field === 'Person' && firstRule.operator === 'MemberOf') return 6;

      // Template 7: Person Know Person with a firstName condition
      if (firstRule.field === 'Person' && firstRule.operator === 'Know' && query.rules.length >= 2) {
        const hasName = query.rules.some(r => r.field === 'Person.firstName');
        if (hasName) return 7;
      }

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
    } else if (ontologyType === 'flights') {
      // Template 0: Flight.flightNum notNull
      if (firstRule.field === 'Flight.flightNum' && firstRule.operator === 'notNull') return 0;

      // Template 1: Flight.carrier =
      if (firstRule.field === 'Flight.carrier' && firstRule.operator === '=') return 1;

      // Template 2: Flight.flightDelay = true
      if (firstRule.field === 'Flight.flightDelay' && firstRule.operator === '=') return 2;

      // Template 3: Flight price range (avgTicketPrice > AND <)
      if (query.rules.length >= 2 &&
          firstRule.field === 'Flight.avgTicketPrice' &&
          query.rules[1].field === 'Flight.avgTicketPrice') return 3;

      // Template 4: Flight.carrier OR condition
      if (query.combinator === 'or' && firstRule.field === 'Flight.carrier') return 4;

      // Template 5: Flight OriginAirport Airport
      if (firstRule.field === 'Flight' && firstRule.operator === 'OriginAirport') return 5;

      // Template 6: Flight DestinationAirport Airport
      if (firstRule.field === 'Flight' && firstRule.operator === 'DestinationAirport') return 6;

      // Template 7: Flight OperatedBy Carrier
      if (firstRule.field === 'Flight' && firstRule.operator === 'OperatedBy') return 7;

      // Template 8: Airport ConnectsTo Airport
      if (firstRule.field === 'Airport' && firstRule.operator === 'ConnectsTo') return 8;

      // Template 9: Complex flight query with relationships
      if (firstRule.field === 'Flight' && firstRule.operator === 'OriginAirport' && query.rules.length >= 2) {
        const hasCountry = query.rules.some(r => r.field === 'Airport.country');
        if (hasCountry) return 9;
      }
    }

    return 0; // Default to template 0
  }, []);

  const onSubmit = useCallback((query, meta = {}) => {
    submitQuery(query);

    if (backend === 'fuse') {
      const ontology = resolveOntologyId(fuseOntologyIds, selectedOntology) || selectedOntology;
      let request;
      try {
        request = language === 'v1'
          ? fuse.runV1(queryToV1(query, meta.ontology, { ont: ontology }), { pageSize: PAGE_SIZE })
          : fuse.runCypher(queryToCypher(query, meta.ontology), { ontology, pageSize: PAGE_SIZE });
      } catch (error) {
        // queryToV1 throws when V1 cannot express the query
        setRun({ running: false, error: error.message });
        return;
      }
      forgetQuery();
      setRun({ running: true });
      request.then(result => {
        lastQueryId.current = result.queryId;
        storeResults(normalizeFuseResult(result.page));
        setRun({
          running: false,
          count: result.actualPageSize,
          hasMore: result.hasMore,
          queryId: result.queryId,
          cursorId: result.cursorId,
          language
        });
      }).catch(error => {
        storeResults(normalizeFuseResult(null));
        setRun({ running: false, error: error.message });
      });
      return;
    }

    setRun({ running: false });
    if (backend === 'generated') {
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
  }, [submitQuery, storeResults, backend, fuseOntologyIds, selectedOntology, language, forgetQuery, detectTemplateIndex]);

  const loadMore = useCallback(() => {
    const { queryId, cursorId } = run;
    setRun(current => ({ ...current, loadingMore: true }));
    fuse.nextPage(queryId, cursorId, PAGE_SIZE).then(next => {
      storeResults(appendFuseResult(results, next.page));
      setRun(current => ({
        ...current,
        loadingMore: false,
        count: current.count + next.actualPageSize,
        hasMore: next.hasMore
      }));
    }).catch(error => {
      setRun(current => ({ ...current, loadingMore: false, error: error.message }));
    });
  }, [run, results, storeResults]);

  const changeBackend = useCallback(next => {
    forgetQuery();
    setRun({ running: false });
    setNotice(null);
    setBackend(next);
  }, [forgetQuery]);

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

          <label htmlFor="research-backend-select" className={researchStyles.spaced}>Backend: </label>
          <select
            id="research-backend-select"
            value={backend || ''}
            onChange={(e) => changeBackend(e.target.value)}
          >
            {!backend && <option value="">Connecting…</option>}
            <option value="fuse">Fuse</option>
            <option value="mock">Mock server</option>
            <option value="generated">Generated sample</option>
          </select>
          <span
            className={researchStyles.statusDot}
            data-status={fuseUp === null ? 'unknown' : fuseUp ? 'up' : 'down'}
            title={fuseUp ? `Fuse is up (${fuseBaseUrl()})` : `Fuse is not reachable (${fuseBaseUrl()})`}
            aria-label={fuseUp ? 'Fuse connected' : 'Fuse not connected'}
            role="img"
          />

          {backend === 'fuse' && (
            <>
              <label htmlFor="research-language-select" className={researchStyles.spaced}>Language: </label>
              <select
                id="research-language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="cypher">Cypher</option>
                <option value="v1">V1</option>
              </select>
            </>
          )}
        </div>
        {notice && <div className={researchStyles.notice} role="status">{notice}</div>}

        {!queryBuilderCollapsed && (
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
              bottom: !resultsCollapsed,
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
            style={{
              marginBottom: '10px',
              position: 'relative',
              overflow: 'auto',
              flex: resultsCollapsed ? 1 : undefined
            }}
          >
            <button
              onClick={() => setQueryBuilderCollapsed(true)}
              className={researchStyles.collapseButton}
              title="Collapse Query Builder"
            >
              ▲
            </button>
            {backend && ontologiesReady ? (
              <VisualQueryBuilder
                onSubmit={onSubmit}
                ontologyType={selectedOntology}
                loadOntology={loadOntology}
                backendLabel={backend === 'fuse' ? 'Fuse server' : 'mock server'}
              />
            ) : (
              <div className={researchStyles.runStatus}>Connecting to Fuse…</div>
            )}
          </Resizable>
        )}

        {queryBuilderCollapsed && (
          <div className={researchStyles.collapsedPanel}>
            <span>Query Builder</span>
            <button
              onClick={() => setQueryBuilderCollapsed(false)}
              className={researchStyles.expandButton}
              title="Expand Query Builder"
            >
              ▼
            </button>
          </div>
        )}

        {!resultsCollapsed && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
            <button
              onClick={() => setResultsCollapsed(true)}
              className={researchStyles.collapseButton}
              title="Collapse Results"
            >
              ▼
            </button>
            <RunStatus run={run} elapsed={elapsed} onLoadMore={loadMore} />
            <Results results={results} />
          </div>
        )}

        {resultsCollapsed && (
          <div className={researchStyles.collapsedPanel}>
            <span>Results</span>
            <button
              onClick={() => setResultsCollapsed(false)}
              className={researchStyles.expandButton}
              title="Expand Results"
            >
              ▲
            </button>
          </div>
        )}
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
