import fs from "fs";
import path from "path";
import pool from "#config/database.js";
import AppError from "#utils/AppError.js";
import { pickPrimaryRole } from "#utils/userRoles.js";
import { UPLOAD_DIR } from "#config/upload.js";

const STORAGE_LIMIT_MB =
  parseInt(process.env.STORAGE_LIMIT_MB, 10) || 2048;

const getDirSizeBytes = async (dirPath) => {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const sizes = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          return getDirSizeBytes(fullPath);
        } else if (entry.isFile()) {
          const stat = await fs.promises.stat(fullPath);
          return stat.size;
        }
        return 0;
      }),
    );
    return sizes.reduce((sum, s) => sum + s, 0);
  } catch {
    return 0;
  }
};

export const getStorageUsage = async () => {
  const usedBytes = await getDirSizeBytes(UPLOAD_DIR);
  const usedMb = Math.round((usedBytes / (1024 * 1024)) * 100) / 100;
  const limitMb = STORAGE_LIMIT_MB;
  const usedPercent =
    limitMb > 0 ? Math.round((usedMb / limitMb) * 1000) / 10 : 0;

  return {
    used_mb: usedMb,
    limit_mb: limitMb,
    used_percent: usedPercent,
  };
};


export const getSessionStats = async () => {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::int AS active_sessions,
       COUNT(DISTINCT rt.user_id)::int AS online_users
     FROM auth.refresh_tokens rt
     JOIN core.users u ON u.id = rt.user_id
     WHERE rt.expires_at > NOW()
       AND u.is_active = true
       AND u.deleted_at IS NULL`,
  );

  return {
    active: rows[0].active_sessions,
    online_users: rows[0].online_users,
  };
};

export const getRoleBreakdown = async () => {
  const { rows: roleRows } = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM core.roles
     WHERE role_name != 'superadmin'`,
  );

  const { rows: breakdown } = await pool.query(
    `SELECT r.role_name AS role,
            COUNT(DISTINCT ur.user_id)::int AS count
     FROM core.roles r
     LEFT JOIN core.user_roles ur ON ur.role_id = r.id
     LEFT JOIN core.users u
       ON u.id = ur.user_id
      AND u.is_active = true
      AND u.deleted_at IS NULL
     WHERE r.role_name != 'superadmin'
     GROUP BY r.role_name
     ORDER BY r.role_name`,
  );

  return {
    total: roleRows[0].total,
    breakdown,
  };
};

/**
 * Menghitung semua user aktif termasuk superadmin & owner.
 * Digunakan hanya untuk summary superadmin (total akun di sistem).
 * Owner summary menggunakan query berbeda yang exclude superadmin & owner.
 */
export const getTotalActiveUsers = async () => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM core.users
     WHERE is_active = true AND deleted_at IS NULL`,
  );
  return rows[0].total;
};

export const parseDateRange = (query = {}, defaultDays = 30) => {
  // Jika 'to' tidak dikirim → gunakan akhir hari ini (23:59:59.999Z)
  // agar simetris dengan 'from' yang menggunakan awal hari (00:00:00.000Z)
  const toRaw = query.to
    ? new Date(`${query.to}T23:59:59.999Z`)
    : (() => {
        const d = new Date();
        d.setUTCHours(23, 59, 59, 999);
        return d;
      })();

  const from = query.from
    ? new Date(`${query.from}T00:00:00.000Z`)
    : new Date(toRaw.getTime() - defaultDays * 24 * 60 * 60 * 1000);

  if (Number.isNaN(from.getTime()) || Number.isNaN(toRaw.getTime())) {
    throw new AppError("Rentang tanggal tidak valid", 422);
  }

  // Guard: from tidak boleh lebih besar dari to
  if (from > toRaw) {
    throw new AppError("Parameter 'from' tidak boleh lebih besar dari 'to'", 422);
  }

  // Geser ke awal hari berikutnya sebagai eksklusif upper bound
  const end = new Date(toRaw);
  end.setUTCDate(end.getUTCDate() + 1);
  end.setUTCHours(0, 0, 0, 0);

  return { from, to: end };
};

export const resolvePrimaryRole = (user, queryRole = null) => {
  const roles = user.roles?.length
    ? user.roles
    : user.role
      ? [user.role]
      : [];
  if (queryRole && roles.includes(queryRole)) {
    return queryRole;
  }
  return pickPrimaryRole(roles);
};
