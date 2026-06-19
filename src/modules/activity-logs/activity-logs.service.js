import pool from "../../config/database.js";
import { paginate } from "../../utils/pagination.js";

const LOG_SELECT = `
  SELECT al.id, al.user_id, u.full_name AS user_name, al.action,
         al.table_name, al.record_id, al.old_values, al.new_values,
         al.ip_address, al.user_agent, al.created_at
  FROM audit.activity_logs al
  LEFT JOIN core.users u ON u.id = al.user_id
  WHERE 1=1
`;

export const getAll = async (query) => {
  const { limit, offset } = paginate(query);
  const params = [];
  let sql = LOG_SELECT;
  let idx = 1;

  if (query.user_id) {
    sql += ` AND al.user_id = $${idx++}`;
    params.push(query.user_id);
  }
  if (query.action) {
    sql += ` AND al.action = $${idx++}`;
    params.push(query.action);
  }
  if (query.table_name) {
    sql += ` AND al.table_name = $${idx++}`;
    params.push(query.table_name);
  }
  if (query.record_id) {
    sql += ` AND al.record_id = $${idx++}`;
    params.push(query.record_id);
  }

  sql += ` ORDER BY al.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);

  const { rows } = await pool.query(sql, params);
  return rows;
};
