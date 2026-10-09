

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}



function escapeLike(value) {
  return String(value).replace(/[\\%_]/g, (char) => `\\${char}`);
}


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



function paginationMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

module.exports = { asyncHandler, escapeLike, buildSet, paginationMeta };
