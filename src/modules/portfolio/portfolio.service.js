import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";

export const getAll = async (query) => {
  const { limit, offset } = paginate(query);
  let sql = `
    SELECT
      pi.id, pi.is_featured, pi.display_order, pi.created_at,
      c.id AS content_id, c.title, c.content_url, c.description,
      c.published_at, c.status,
      co.contract_name, cc.type_name AS category_name
    FROM public.portfolio_items pi
    JOIN core.contents c ON c.id = pi.content_id AND c.deleted_at IS NULL AND c.is_active = true
    JOIN core.contracts co ON co.id = c.contract_id AND co.deleted_at IS NULL AND co.is_active = true
    JOIN core.content_category cc ON cc.id = c.content_category_id
    WHERE 1=1
  `;
  const params = [];
  let idx = 1;
  if (query.is_featured !== undefined) {
    sql += ` AND pi.is_featured = $${idx++}`;
    params.push(query.is_featured === "true");
  }
  sql += ` ORDER BY pi.display_order ASC NULLS LAST, pi.created_at DESC
           LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);
  const { rows } = await pool.query(sql, params);
  return rows;
};

export const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT
       pi.id, pi.is_featured, pi.display_order, pi.created_at,
       c.id AS content_id, c.title, c.content_url, c.description,
       c.published_at, c.status,
       co.contract_name, cc.type_name AS category_name
     FROM public.portfolio_items pi
     JOIN core.contents c ON c.id = pi.content_id AND c.deleted_at IS NULL AND c.is_active = true
     JOIN core.contracts co ON co.id = c.contract_id AND co.deleted_at IS NULL AND co.is_active = true
     JOIN core.content_category cc ON cc.id = c.content_category_id
     WHERE pi.id = $1`,
    [id],
  );
  if (!rows[0]) throw new AppError("Portfolio item not found", 404);
  return rows[0];
};

export const create = async ({ content_id, is_featured, display_order }) => {
  const { rows: contentRows } = await pool.query(
    "SELECT id, status FROM core.contents WHERE id = $1 AND deleted_at IS NULL",
    [content_id],
  );
  if (!contentRows[0]) throw new AppError("Content not found", 404);
  if (contentRows[0].status !== "published")
    throw new AppError(
      "Hanya konten dengan status published yang dapat ditambahkan ke portfolio",
      422,
    );

  const { rows } = await pool.query(
    `INSERT INTO public.portfolio_items (content_id, is_featured, display_order)
     VALUES ($1,$2,$3) RETURNING *`,
    [content_id, is_featured ?? false, display_order ?? null],
  );
  return rows[0];
};

export const update = async (id, fields) => {
  const allowedFields = ["is_featured", "display_order"];
  const keys = Object.keys(fields).filter((k) => allowedFields.includes(k));
  if (!keys.length)
    throw new AppError("Tidak ada field valid untuk diupdate", 422);

  const values = keys.map((k) => fields[k]);
  const set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const { rows } = await pool.query(
    `UPDATE public.portfolio_items SET ${set}, updated_at = now() WHERE id = $${keys.length + 1} RETURNING *`,
    [...values, id],
  );
  if (!rows[0]) throw new AppError("Portfolio item not found", 404);
  return rows[0];
};

export const remove = async (id) => {
  const { rowCount } = await pool.query(
    "DELETE FROM public.portfolio_items WHERE id = $1",
    [id],
  );
  if (!rowCount) throw new AppError("Portfolio item not found", 404);
};
