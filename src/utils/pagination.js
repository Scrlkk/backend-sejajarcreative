import AppError from "./AppError.js";

export const paginate = (query = {}) => {
  const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 100);
  const offset = Math.max(Math.min(parseInt(query.offset) || 0, 10000000), 0);
  return { limit, offset };
};

/**
 * Get paginated data dengan total count
 * @param {Pool} pool
 * @param {object} query
 * @param {string} baseSql
 * @param {array} params
 * @returns {Promise<object>} { limit, offset, total, pages } }
 */
export const paginateWithCount = async (
  pool,
  query = {},
  baseSql,
  params = [],
) => {
  const { limit, offset } = paginate(query);

  try {

    const countSql = `SELECT COUNT(*) as total FROM (${baseSql}) AS _count`;
    const countResult = await pool.query(countSql, params);
    const total = parseInt(countResult.rows[0].total);


    const dataSql = `${baseSql} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const dataResult = await pool.query(dataSql, [...params, limit, offset]);

    return {
      data: dataResult.rows,
      pagination: {
        limit,
        offset,
        total,
        pages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
    };
  } catch (err) {
    throw new AppError("Pagination query failed: " + err.message, 500);
  }
};

/**
 * Helper untuk build WHERE clause dari query filters
 * Mencegah SQL injection dengan hanya accept known fields
 * @param {object} filters - Filter object
 * @param {object} allowedFilters - { fieldName: true/false }
 * @returns {object} - { whereClause, params }
 */
export const buildWhereClause = (filters = {}, allowedFilters = {}) => {
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  Object.entries(filters).forEach(([key, value]) => {
    if (!allowedFilters[key] || !value) return;

    if (Array.isArray(value)) {
      // IN clause
      const placeholders = value.map(() => `$${paramIndex++}`).join(",");
      conditions.push(`${key} IN (${placeholders})`);
      params.push(...value);
    } else if (typeof value === "object") {
      // Range query (e.g., { $gte: 10, $lte: 20 })
      if (value.$gte) {
        conditions.push(`${key} >= $${paramIndex++}`);
        params.push(value.$gte);
      }
      if (value.$lte) {
        conditions.push(`${key} <= $${paramIndex++}`);
        params.push(value.$lte);
      }
    } else {
      // Simple equality
      conditions.push(`${key} = $${paramIndex++}`);
      params.push(value);
    }
  });

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return { whereClause, params };
};
