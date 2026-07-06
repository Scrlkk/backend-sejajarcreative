import AppError from "./AppError.js";
import pool from "#config/database.js";

export const ALLOWED_UPDATE_FIELDS = {
  "core.users": ["full_name", "email", "password"],
  "core.contracts": [
    "contract_name",
    "contract_code",
    "status",
    "description",
    "start_date",
    "end_date",
    "revenue",
    "lead_by",
  ],
  "core.tasks": ["title", "description", "status", "deadline", "assigned_to"],
  "core.clients": [
    "client_name",
    "company_name",
    "contact_email",
    "contact_phone",
  ],
  "core.contents": [
    "title",
    "description",
    "status",
    "platform_id",
    "content_category_id",
    "pillar_id",
    "content_url",
    "objective",
    "target_audience",
    "due_date",
    "priority",
    "published_at",
    "format",
    "scheduled_at",
  ],
  "core.content_reviews": ["notes", "status"],
  "core.task_outputs": ["caption", "hashtag", "file_url"],
  "core.task_comments": ["message"],
  "core.pillars": ["pillar_name", "description", "is_active"],
  "core.platforms": ["platform_name", "color_key", "is_active"],
  "core.content_category": ["type_name", "color_key", "is_active"],
  "public.portfolio_items": ["is_featured", "display_order"],
};

export const validateUpdateFields = (table, fields) => {
  const allowed = ALLOWED_UPDATE_FIELDS[table];
  if (!allowed) {
    throw new AppError(`Table ${table} tidak dikonfigurasi untuk update`, 500);
  }

  const keys = Object.keys(fields).filter((k) => allowed.includes(k));
  if (keys.length === 0) {
    throw new AppError("Tidak ada field valid untuk diupdate", 422);
  }

  return keys;
};

export const TABLES_WITH_UPDATED_AT = [
  "core.users",
  "core.contracts",
  "core.tasks",
  "core.clients",
  "core.contents",
  "core.content_reviews",
  "core.pillars",
  "core.platforms",
  "core.content_category",
  "public.portfolio_items",
];

export const buildUpdateQuery = (table, id, fields) => {
  const keys = validateUpdateFields(table, fields);
  const values = keys.map((k) => fields[k]);
  let set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");

  if (TABLES_WITH_UPDATED_AT.includes(table)) {
    set += ", updated_at = now()";
  }

  return {
    sql: `UPDATE ${table} SET ${set} WHERE id = $${keys.length + 1} RETURNING *`,
    params: [...values, id],
  };
};

export const updateByIdWithWhitelist = async (pool, table, id, fields) => {
  const { sql, params } = buildUpdateQuery(table, id, fields);

  const { rows } = await pool.query(sql, params);
  if (!rows[0]) {
    throw new AppError("Data tidak ditemukan", 404);
  }

  return rows[0];
};

export const isFieldAllowed = (table, field) => {
  const allowed = ALLOWED_UPDATE_FIELDS[table];
  return allowed ? allowed.includes(field) : false;
};

export const runInTransaction = async (action, dbPool = pool) => {
  const client = await dbPool.connect();
  try {
    await client.query("BEGIN");
    const result = await action(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
