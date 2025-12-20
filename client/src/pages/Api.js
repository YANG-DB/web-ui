import React, { useState } from "react";
import styles from "../App.module.css";
import apiStyles from "./Api.module.css";

const API_ENDPOINTS = [
  {
    method: "GET",
    path: "/api/ontologies",
    description: "Get list of available ontologies",
    parameters: [],
    response: {
      ontologies: [
        { id: "dragons", name: "Dragons" },
        { id: "linkedin", name: "LinkedIn" }
      ]
    }
  },
  {
    method: "GET",
    path: "/api/ontology",
    description: "Get ontology data for a specific type",
    parameters: [
      { name: "type", type: "query", required: true, description: "Ontology type (dragons or linkedin)", example: "dragons" }
    ],
    response: {
      data: [
        {
          entities: ["Person", "Dragon", "Horse", "Guild", "Kingdom"],
          relationships: ["Own", "Fire", "Freeze", "MemberOf", "RegisteredIn"]
        }
      ]
    }
  },
  {
    method: "POST",
    path: "/api/results",
    description: "Execute a query and get results",
    parameters: [
      { name: "query", type: "body", required: true, description: "Query object with rules and combinator" },
      { name: "collapsed", type: "body", required: false, description: "Return collapsed results" }
    ],
    requestBody: {
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
    response: {
      requestId: "FR412104328929738752",
      data: {
        assignments: [],
        entities: [],
        relationships: [],
        pattern: { elements: [] }
      }
    }
  },
  {
    method: "POST",
    path: "/api/update",
    description: "Update/expand results for a specific node",
    parameters: [
      { name: "nodeId", type: "body", required: true, description: "ID of the node to expand" }
    ],
    requestBody: {
      nodeId: "Person_123"
    },
    response: {
      data: {
        entities: [],
        relationships: []
      }
    }
  },
  {
    method: "GET",
    path: "/api/schema",
    description: "Get list of saved schemas",
    parameters: [],
    response: {
      schemas: [
        { id: "1", label: "My Query 1", value: "{...}" }
      ]
    }
  },
  {
    method: "GET",
    path: "/api/schema/:id",
    description: "Get a specific schema by ID",
    parameters: [
      { name: "id", type: "path", required: true, description: "Schema ID", example: "1" }
    ],
    response: {
      id: "1",
      label: "My Query 1",
      value: "{...}"
    }
  },
  {
    method: "POST",
    path: "/api/schema",
    description: "Save a new schema",
    parameters: [
      { name: "label", type: "body", required: true, description: "Schema label/name" },
      { name: "value", type: "body", required: true, description: "Schema value/content" }
    ],
    requestBody: {
      label: "My New Query",
      value: '{"combinator":"and","rules":[]}'
    },
    response: {
      id: "2",
      label: "My New Query",
      value: '{"combinator":"and","rules":[]}'
    }
  },
  {
    method: "GET",
    path: "/api/structure",
    description: "Get database structure information",
    parameters: [],
    response: {
      entities: [],
      relationships: []
    }
  }
];

export default function Api() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [testRequest, setTestRequest] = useState("");
  const [testResponse, setTestResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTryIt = async (endpoint) => {
    setIsLoading(true);
    setTestResponse(null);

    try {
      let url = endpoint.path;
      let options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      // Add query parameters for GET requests
      if (endpoint.method === 'GET' && endpoint.parameters.length > 0) {
        const params = endpoint.parameters
          .filter(p => p.type === 'query' && p.example)
          .map(p => `${p.name}=${p.example}`)
          .join('&');
        if (params) url += '?' + params;
      }

      // Add request body for POST requests
      if (endpoint.method === 'POST' && endpoint.requestBody) {
        options.body = testRequest || JSON.stringify(endpoint.requestBody, null, 2);
      }

      const response = await fetch(url, options);
      const data = await response.json();
      setTestResponse({ status: response.status, data });
    } catch (error) {
      setTestResponse({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.row}>
      <div className={styles.column} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className={apiStyles.header}>
          <h1 className={apiStyles.title}>API Documentation</h1>
          <p className={apiStyles.subtitle}>Explore and test available API endpoints</p>
        </div>

        <div className={apiStyles.content}>
          {/* Endpoints List */}
          <div className={apiStyles.endpointsList}>
            {API_ENDPOINTS.map((endpoint, index) => (
              <div
                key={index}
                className={`${apiStyles.endpointCard} ${selectedEndpoint === index ? apiStyles.selected : ''}`}
                onClick={() => {
                  setSelectedEndpoint(index);
                  setTestRequest(endpoint.requestBody ? JSON.stringify(endpoint.requestBody, null, 2) : "");
                  setTestResponse(null);
                }}
              >
                <div className={apiStyles.endpointHeader}>
                  <span className={`${apiStyles.method} ${apiStyles[endpoint.method.toLowerCase()]}`}>
                    {endpoint.method}
                  </span>
                  <span className={apiStyles.path}>{endpoint.path}</span>
                </div>
                <p className={apiStyles.description}>{endpoint.description}</p>
              </div>
            ))}
          </div>

          {/* Endpoint Details */}
          {selectedEndpoint !== null && (
            <div className={apiStyles.endpointDetails}>
              <div className={apiStyles.detailsHeader}>
                <span className={`${apiStyles.methodLarge} ${apiStyles[API_ENDPOINTS[selectedEndpoint].method.toLowerCase()]}`}>
                  {API_ENDPOINTS[selectedEndpoint].method}
                </span>
                <h2 className={apiStyles.pathLarge}>{API_ENDPOINTS[selectedEndpoint].path}</h2>
              </div>

              <p className={apiStyles.descriptionLarge}>{API_ENDPOINTS[selectedEndpoint].description}</p>

              {/* Parameters */}
              {API_ENDPOINTS[selectedEndpoint].parameters.length > 0 && (
                <div className={apiStyles.section}>
                  <h3 className={apiStyles.sectionTitle}>Parameters</h3>
                  <table className={apiStyles.paramsTable}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Required</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {API_ENDPOINTS[selectedEndpoint].parameters.map((param, idx) => (
                        <tr key={idx}>
                          <td><code>{param.name}</code></td>
                          <td><span className={apiStyles.paramType}>{param.type}</span></td>
                          <td>{param.required ? <span className={apiStyles.required}>Yes</span> : 'No'}</td>
                          <td>{param.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Request Body */}
              {API_ENDPOINTS[selectedEndpoint].requestBody && (
                <div className={apiStyles.section}>
                  <h3 className={apiStyles.sectionTitle}>Request Body</h3>
                  <pre className={apiStyles.codeBlock}>
                    {JSON.stringify(API_ENDPOINTS[selectedEndpoint].requestBody, null, 2)}
                  </pre>
                </div>
              )}

              {/* Example Response */}
              <div className={apiStyles.section}>
                <h3 className={apiStyles.sectionTitle}>Example Response</h3>
                <pre className={apiStyles.codeBlock}>
                  {JSON.stringify(API_ENDPOINTS[selectedEndpoint].response, null, 2)}
                </pre>
              </div>

              {/* Try It Out */}
              <div className={apiStyles.section}>
                <h3 className={apiStyles.sectionTitle}>Try It Out</h3>

                {API_ENDPOINTS[selectedEndpoint].method === 'POST' && (
                  <div className={apiStyles.tryItSection}>
                    <label className={apiStyles.label}>Request Body:</label>
                    <textarea
                      className={apiStyles.requestInput}
                      value={testRequest}
                      onChange={(e) => setTestRequest(e.target.value)}
                      rows={10}
                      placeholder="Enter request body JSON..."
                    />
                  </div>
                )}

                <button
                  className={apiStyles.executeButton}
                  onClick={() => handleTryIt(API_ENDPOINTS[selectedEndpoint])}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Execute'}
                </button>

                {testResponse && (
                  <div className={apiStyles.responseSection}>
                    <div className={apiStyles.responseHeader}>
                      <span className={apiStyles.label}>Response:</span>
                      {testResponse.status && (
                        <span className={`${apiStyles.statusBadge} ${testResponse.status >= 200 && testResponse.status < 300 ? apiStyles.success : apiStyles.error}`}>
                          {testResponse.status}
                        </span>
                      )}
                    </div>
                    <pre className={apiStyles.codeBlock}>
                      {testResponse.error
                        ? testResponse.error
                        : JSON.stringify(testResponse.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedEndpoint === null && (
            <div className={apiStyles.placeholder}>
              <div className={apiStyles.placeholderIcon}>📚</div>
              <h2>Select an endpoint to view details</h2>
              <p>Click on any endpoint from the list to see parameters, request/response examples, and test it out</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
