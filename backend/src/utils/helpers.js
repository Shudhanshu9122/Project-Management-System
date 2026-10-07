// Wraps an async route handler so a rejected promise reaches the error
// middleware instead of becoming an unhandled rejection.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// `%` and `_` are LIKE wildcards. Search text is data, so neutralize them and
// the escape character itself, then pair with ESCAPE '\' in the query.
function escapeLike(value) {
  return String(value).replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Builds the SET clause of a dynamic UPDATE.
 *
 * `columns` is a fixed [[payloadField, columnName], ...] list declared in the
 * controller, so the column names in the emitted SQL can never come from a
 * request. Values are always bound as parameters.
 */
function buildSet(payload, columns, startIndex = 1) {
  const clauses = [];
  const values = [];
  let index = startIndex;

  for (const [field, column] of columns) {
    if (payload[field] === undefined) continue;
    clauses.push(`${column} = $${index}`);
    values.push(payload[field]);
    index += 1;
  }

  return { clauses, values };
}

// totalPages is never 0 so the client's page indicator stays valid when a
// filtered list has no rows.
function paginationMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

module.exports = { asyncHandler, escapeLike, buildSet, paginationMeta };
