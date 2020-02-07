function callApi(endpoint, method = "GET", body) {
  return fetch(endpoint, {
    method,
    body: body ? JSON.stringify(body) : null,
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(response => response.json())
    .catch(error => {
      console.error(error);
    });
}

export default {
  getResult: async function(query) {
    return await callApi("/api/results", "POST", { query });
  },
  updateResult: async function(nodeId) {
    return await callApi("/api/update", "POST", { nodeId });
  },
  getOntology: async function() {
    const ontology = await callApi("/api/ontology");
    return ontology && ontology.data[0];
  },
  getStructure: async function() {
    return await callApi("/api/structure");
  },
  getSchemaList: async function() {
    return await callApi("/api/schema");
  },
  getSchema: async function(schemaId) {
    return await callApi(`/api/schema/${schemaId}`);
  },
  saveSchema: async function(label, value) {
    return await callApi("/api/schema", "POST", {
      label,
      value
    });
  }
};
