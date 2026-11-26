// Direct client for a YangDB (Fuse) server. The mock backend stays in ./api.js.
//
// Base URL: REACT_APP_FUSE_URL, default "/fuse". In development "/fuse" goes
// through the dev proxy (src/setupProxy.js) to http://localhost:8888. Set it to an
// absolute URL such as "http://localhost:8888/fuse" to call Fuse directly (CORS is
// open on Fuse).
import { FuseError, toFuseError } from "../helpers/fuseError";
import {
  unwrapContent,
  unwrapRunResponse,
  unwrapPageResponse
} from "../helpers/unwrapRunResponse";

export const DEFAULT_PAGE_SIZE = 100;

export function fuseBaseUrl(env = process.env) {
  const url = (env.REACT_APP_FUSE_URL || "/fuse").trim();
  return url.replace(/\/+$/, "");
}

async function readBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

async function request(path, { method = "GET", params, form } = {}) {
  let url = `${fuseBaseUrl()}${path}`;
  if (params) {
    const qs = new URLSearchParams(dropEmpty(params)).toString();
    if (qs) url += `?${qs}`;
  }

  const init = { method, headers: { Accept: "application/json" } };
  if (form) {
    // Fuse reads run parameters as request parameters, not as a JSON body.
    init.headers["Content-Type"] = "application/x-www-form-urlencoded;charset=UTF-8";
    init.body = new URLSearchParams(dropEmpty(form)).toString();
  }

  let response;
  try {
    response = await fetch(url, init);
  } catch (e) {
    throw new FuseError(`Cannot reach Fuse at ${fuseBaseUrl()}: ${e.message}`, {
      details: e
    });
  }

  const body = await readBody(response);
  if (!response.ok) throw toFuseError(response.status, body);
  return body;
}

function dropEmpty(obj) {
  const out = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
      out[key] = String(obj[key]);
    }
  });
  return out;
}

function runParams(text, { ontology, pageSize = DEFAULT_PAGE_SIZE, cursorType } = {}) {
  return { query: text, ontology, pageSize, cursorType };
}

const fuse = {
  // Resolves true when Fuse answers its health check, false otherwise.
  async health() {
    try {
      await request("/health");
      return true;
    } catch (e) {
      return false;
    }
  },

  async listOntologies() {
    const list = unwrapContent(await request("/catalog/ontology"));
    // The catalog can hold entries without an id; they are not selectable.
    return (Array.isArray(list) ? list : []).filter(ont => ont && ont.ont);
  },

  async getOntology(id) {
    return unwrapContent(await request(`/catalog/ontology/${encodeURIComponent(id)}`));
  },

  // Runs a Cypher query and returns {queryId, cursorId, page, hasMore, ...}.
  async runCypher(text, opts) {
    return fuse.runLanguage("cypher", text, opts);
  },

  // Runs a query in any language Fuse registers (cypher, graphQL, sparql, ...).
  // An unknown language fails with a FuseError listing the available ones.
  async runLanguage(lang, text, opts) {
    const body = await request(`/query/${encodeURIComponent(lang)}/run`, {
      method: "POST",
      form: runParams(text, opts)
    });
    return unwrapRunResponse(body);
  },

  async nextPage(queryId, cursorId, pageSize = DEFAULT_PAGE_SIZE) {
    const body = await request(
      `/query/${encodeURIComponent(queryId)}/cursor/${encodeURIComponent(cursorId)}/nextPageData`,
      { params: { pageSize } }
    );
    return unwrapPageResponse(body, pageSize);
  },

  async getNeighbors(ontology, type, id) {
    const body = await request("/query/graph/api/getNeighbors", {
      params: { ontology, type, id }
    });
    return unwrapRunResponse(body);
  },

  // Frees a stored query. Every run stores one on the server.
  async deleteQuery(queryId) {
    if (!queryId) return false;
    return unwrapContent(
      await request(`/query/${encodeURIComponent(queryId)}`, { method: "DELETE" })
    );
  }
};

export default fuse;
