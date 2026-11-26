import { FuseError, findFuseError } from "./fuseError";

// Fuse wraps every answer in a {requestId, elapsed, data} envelope.
export function unwrapContent(body) {
  if (body && typeof body === "object" && "data" in body && "requestId" in body) {
    return body.data;
  }
  return body;
}

function countAssignments(page) {
  return page && Array.isArray(page.assignments) ? page.assignments.length : 0;
}

// A run (`/fuse/query/:lang/run`) returns the query resource, whose first cursor
// holds the first page. The UI wants that page's data, which is the shape
// `extractResults` already parses: {queryId, cursorId, assignments, ...}.
//
// Returns {queryId, cursorId, page, hasMore, requestedPageSize, actualPageSize}.
// Throws a FuseError when the response carries one.
export function unwrapRunResponse(body) {
  const error = findFuseError(body);
  if (error) throw error;

  const query = unwrapContent(body);
  if (!query || typeof query !== "object") {
    throw new FuseError("Empty response from Fuse");
  }

  const cursor = (query.cursorResourceInfos || [])[0];
  if (!cursor) {
    throw new FuseError("Fuse returned no cursor for the query", { details: body });
  }
  const pageInfo = (cursor.pageResourceInfos || [])[0];
  const page = (pageInfo && pageInfo.data) || null;

  const requestedPageSize = pageInfo ? pageInfo.requestedPageSize : null;
  const actualPageSize = pageInfo
    ? pageInfo.actualPageSize != null
      ? pageInfo.actualPageSize
      : countAssignments(page)
    : 0;

  return {
    queryId: query.resourceId || (page && page.queryId) || null,
    cursorId: cursor.resourceId || (page && page.cursorId) || null,
    page,
    hasMore: requestedPageSize > 0 && actualPageSize >= requestedPageSize,
    requestedPageSize,
    actualPageSize
  };
}

// `nextPageData` returns the page data directly inside the envelope.
// Returns {page, hasMore, actualPageSize}.
export function unwrapPageResponse(body, requestedPageSize) {
  const error = findFuseError(body);
  if (error) throw error;

  let page = unwrapContent(body);
  // Tolerate a page resource ({data, actualPageSize}) as well as bare page data.
  let actualPageSize = null;
  if (page && page.assignments == null && page.data && typeof page.data === "object") {
    actualPageSize = page.actualPageSize;
    page = page.data;
  }
  if (actualPageSize == null) actualPageSize = countAssignments(page);

  return {
    page: page || null,
    hasMore: requestedPageSize > 0 && actualPageSize >= requestedPageSize,
    actualPageSize
  };
}

export default unwrapRunResponse;
