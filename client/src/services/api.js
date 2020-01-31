function callApi(endpoint, method = "GET", body) {
  return fetch(endpoint, {
    method,
    body: body ? JSON.stringify(body) : null,
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(response => response.json())
    .then(data => {
      return data;
    })
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
    return ontology.data[0];
  },
  getStructure: async function() {
    return await callApi("/api/structure");
  }
};
