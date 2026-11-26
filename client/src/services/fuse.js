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

async function request(path, { method = "GET", params, form, json } = {}) {
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
  } else if (json !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(json);
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

// Fuse 0.9.1 fails when two queries are created at the same time ("failed building the
// cursor request ... zip file closed", returned inside a 200). Query runs therefore go
// through this queue, one at a time. See "Fuse-side asks" in docs/UX_AND_FUSE_PLAN.md.
let queue = Promise.resolve();
export function serialized(task) {
  const run = queue.then(task, task);
  queue = run.catch(() => null);
  return run;
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
    const body = await serialized(() =>
      request(`/query/${encodeURIComponent(lang)}/run`, { method: "POST", form: runParams(text, opts) })
    );
    return unwrapRunResponse(body);
  },

  // Runs a V1 query (the JSON query language Fuse runs natively, see helpers/queryToV1).
  // `query` is {name, ont, elements}; pageSize and cursorType go in the query string.
  async runV1(query, { pageSize = DEFAULT_PAGE_SIZE, cursorType } = {}) {
    const body = await serialized(() =>
      request("/query/v1/run", { method: "POST", params: { pageSize, cursorType }, json: query })
    );
    return unwrapRunResponse(body);
  },

  // The V1 query JSON Schema the server publishes (yang-db #197). Resolves null when this
  // Fuse has no such endpoint (0.9.1 and earlier answer 404).
  async getV1Schema() {
    try {
      return unwrapContent(await request("/query/v1/schema"));
    } catch (error) {
      if (error instanceof FuseError && error.status === 404) return null;
      throw error;
    }
  },

  async nextPage(queryId, cursorId, pageSize = DEFAULT_PAGE_SIZE) {
    const body = await request(
      `/query/${encodeURIComponent(queryId)}/cursor/${encodeURIComponent(cursorId)}/nextPageData`,
      { params: { pageSize } }
    );
    return unwrapPageResponse(body, pageSize);
  },

  async getNeighbors(ontology, type, id) {
    const body = await serialized(() =>
      request("/query/graph/api/getNeighbors", { params: { ontology, type, id } })
    );
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
