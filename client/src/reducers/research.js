import apiService from "../services/api";
import { slateToQuery } from "../helpers";

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

export function collapseResults() {
  return (dispatch, getState) => {
    dispatch({
      type: "COLLAPSE_PENDING"
    });
    const history = getState().research.history;
    const query = slateToQuery(history[history.length - 1].query);
    apiService.getCollapsedResult(query).then(collapsedResults => {
      dispatch({
        type: "COLLAPSED_RESULTS",
        collapsedResults
      });
    });
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
    case "COLLAPSE_PENDING":
      return {
        ...state,
        history: state.history.map((h, i) =>
          i === state.history.length - 1
            ? { ...h, collapsedResults: "LOADING" }
            : h
        )
      };
    case "COLLAPSED_RESULTS":
      return {
        ...state,
        history: state.history.map((h, i) =>
          i === state.history.length - 1
            ? { ...h, collapsedResults: action.collapsedResults }
            : h
        )
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
