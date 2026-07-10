import pool from "#config/database.js";

const ROLE_PRIORITY = [
  "superadmin",
  "owner",
  "content_lead",
  "content_editor",
  "script_writer",
  "admin_social_media",
];

export const fetchRoleNamesByUserId = async (userId, db = pool) => {
  const { rows } = await db.query(
    `SELECT r.role_name
     FROM core.user_roles ur
     JOIN core.roles r ON r.id = ur.role_id
     WHERE ur.user_id = $1
     ORDER BY r.role_name`,
    [userId],
  );
  return rows.map((r) => r.role_name);
};

export const pickPrimaryRole = (roles) => {
  if (!roles?.length) return null;
  for (const name of ROLE_PRIORITY) {
    if (roles.includes(name)) return name;
  }
  return roles[0];
};

export const resolveRoleId = async (roleName, db = pool) => {
  const { rows } = await db.query(
    "SELECT id FROM core.roles WHERE role_name = $1",
    [roleName],
  );
  return rows[0]?.id ?? null;
};

export const assignUserRole = async (userId, roleName, db = pool) => {
  const roleId = await resolveRoleId(roleName, db);
  if (!roleId) return null;
  await db.query(
    `INSERT INTO core.user_roles (user_id, role_id) VALUES ($1, $2)
     ON CONFLICT (user_id, role_id) DO NOTHING`,
    [userId, roleId],
  );
  return roleName;
};
