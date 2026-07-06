import AppError from "./AppError.js";

export const paginate = (query = {}) => {
  const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 100);
  const offset = Math.max(Math.min(parseInt(query.offset) || 0, 10000000), 0);
  return { limit, offset };
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
