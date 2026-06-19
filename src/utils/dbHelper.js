import AppError from "./AppError.js";

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
    "is_active",
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
  ],
  "core.content_reviews": ["notes", "status"],
  "core.task_outputs": ["caption", "hashtag", "file_url"],
  "core.task_comments": ["message"],
  "core.pillars": ["pillar_name", "description", "is_active"],
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

export const buildUpdateQuery = (table, id, fields) => {
  const keys = validateUpdateFields(table, fields);
  const values = keys.map((k) => fields[k]);
  const set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");

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
