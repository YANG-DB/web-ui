const initialState = {
  history: []
};

export function submitQuery(query) {
  return {
    type: "SUBMIT_QUERY",
    query
  };
}

export function storeResults(results) {
  return {
    type: "STORE_RESULTS",
    results
  };
}

export default (state = initialState, action) => {
  switch (action.type) {
    case "SUBMIT_QUERY":
      return {
        ...state,
        history: [
          ...state.history,
          {
            query: action.query
          }
        ]
      };
    case "STORE_RESULTS":
      return {
        ...state,
        history: state.history.map((h, i) =>
          i === state.history.length - 1 ? { ...h, results: action.results } : h
        )
      };
    default:
      return state;
  }
};
