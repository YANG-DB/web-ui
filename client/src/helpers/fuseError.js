// Normalizes the error shapes Fuse (YangDB) returns into one FuseError.
//
// Fuse reports errors as {errorCode, errorDescription}. They arrive either as the
// body of a non-2xx response (sometimes inside a {requestId, elapsed, data} envelope),
// or inside a 200 response, as `data.error`, `cursorResourceInfos[].error` or
// `pageResourceInfos[].error`.

export class FuseError extends Error {
  constructor(description, { code = null, status = null, details = null } = {}) {
    super(description || "Unknown Fuse error");
    this.name = "FuseError";
    this.code = code;
    this.description = this.message;
    this.status = status;
    this.details = details;
  }
}

function isErrorObject(value) {
  return (
    value != null &&
    typeof value === "object" &&
    (value.errorCode != null || value.errorDescription != null)
  );
}

function fromErrorObject(error, status) {
  return new FuseError(error.errorDescription || error.errorCode, {
    code: error.errorCode || null,
    status,
    details: error
  });
}

// Returns the first Fuse error found in a response body, or null.
export function findFuseError(body, status = null) {
  if (body == null || typeof body !== "object") return null;

  if (isErrorObject(body)) return fromErrorObject(body, status);
  if (isErrorObject(body.error)) return fromErrorObject(body.error, status);

  const data = body.data;
  if (data == null || typeof data !== "object") return null;
  if (isErrorObject(data)) return fromErrorObject(data, status);
  if (isErrorObject(data.error)) return fromErrorObject(data.error, status);

  for (const cursor of data.cursorResourceInfos || []) {
    if (isErrorObject(cursor && cursor.error)) return fromErrorObject(cursor.error, status);
    for (const page of (cursor && cursor.pageResourceInfos) || []) {
      if (isErrorObject(page && page.error)) return fromErrorObject(page.error, status);
    }
  }
  return null;
}

// Builds a FuseError for a failed HTTP response. `body` is the parsed JSON body,
// or the raw text when the body was not JSON.
export function toFuseError(status, body) {
  const found = findFuseError(body, status);
  if (found) return found;

  let description;
  if (typeof body === "string" && body.trim()) {
    description = body.trim();
  } else if (body && typeof body === "object" && body.message) {
    description = body.message;
  } else {
    description = `Fuse request failed with status ${status}`;
  }
  return new FuseError(description, { status, details: body });
}
