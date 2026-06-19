import pool from "../../config/database.js";

export const getStaffSummary = async (userId) => {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status = 'to_do')::int AS to_do,
       COUNT(*) FILTER (WHERE status = 'on_progress')::int AS on_progress,
       COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
       COUNT(*) FILTER (WHERE status = 'revision')::int AS revision
     FROM core.tasks
     WHERE assigned_to = $1 AND deleted_at IS NULL`,
    [userId]
  );

  const summary = rows[0] || { total: 0, to_do: 0, on_progress: 0, approved: 0, revision: 0 };

  return {
    tasks: {
      total: summary.total,
      to_do: summary.to_do,
      on_progress: summary.on_progress,
      approved: summary.approved,
      revision: summary.revision,
    }
  };
};

export const getUpcomingDeadlinesWidget = async (userId, query = {}) => {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);

  // userId = null → superadmin: tampilkan semua task (tanpa filter assigned_to)
  if (userId === null) {
    const { rows } = await pool.query(
      `SELECT t.id, t.title, t.status, t.deadline,
              c.title AS content_title,
              u.full_name AS assigned_to_name
       FROM core.tasks t
       JOIN core.contents c ON c.id = t.content_id
       LEFT JOIN core.users u ON u.id = t.assigned_to
       WHERE t.deleted_at IS NULL
         AND c.deleted_at IS NULL
         AND c.is_active = true
         AND t.status NOT IN ('published', 'approved')
         AND t.deadline IS NOT NULL
       ORDER BY t.deadline ASC
       LIMIT $1`,
      [limit]
    );
    return { widget: "upcoming-deadlines", tasks: rows };
  }

  const { rows } = await pool.query(
    `SELECT t.id, t.title, t.status, t.deadline, c.title AS content_title
     FROM core.tasks t
     JOIN core.contents c ON c.id = t.content_id
     WHERE t.assigned_to = $1
       AND t.deleted_at IS NULL
       AND c.deleted_at IS NULL
       AND c.is_active = true
       AND t.status NOT IN ('published', 'approved')
       AND t.deadline IS NOT NULL
     ORDER BY t.deadline ASC
     LIMIT $2`,
    [userId, limit]
  );
  return {
    widget: "upcoming-deadlines",
    tasks: rows,
  };
};

export const getRecentCommentsWidget = async (userId, query = {}) => {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 50);

  // userId = null → superadmin: semua komentar pada semua task
  if (userId === null) {
    const { rows } = await pool.query(
      `SELECT
         tc.id,
         tc.task_id,
         t.title AS task_title,
         tc.user_id,
         u.full_name AS user_name,
         tc.message,
         tc.created_at,
         assignee.full_name AS assigned_to_name
       FROM core.task_comments tc
       JOIN core.tasks t ON t.id = tc.task_id
       LEFT JOIN core.users u ON u.id = tc.user_id
       LEFT JOIN core.users assignee ON assignee.id = t.assigned_to
       WHERE tc.deleted_at IS NULL
         AND t.deleted_at IS NULL
       ORDER BY tc.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return { widget: "recent-comments", comments: rows };
  }

  const { rows } = await pool.query(
    `SELECT
       tc.id,
       tc.task_id,
       t.title AS task_title,
       tc.user_id,
       u.full_name AS user_name,
       tc.message,
       tc.created_at
     FROM core.task_comments tc
     JOIN core.tasks t ON t.id = tc.task_id
     LEFT JOIN core.users u ON u.id = tc.user_id
     WHERE t.assigned_to = $1
       AND tc.deleted_at IS NULL
       AND t.deleted_at IS NULL
     ORDER BY tc.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return {
    widget: "recent-comments",
    comments: rows,
  };
};

export const getPillarsUsageWidget = async (userId) => {
  // userId = null → superadmin: semua pillar tanpa filter assigned_to
  const { rows } = userId !== null
    ? await pool.query(
        `SELECT
           p.id,
           p.pillar_name,
           COUNT(DISTINCT c.id)::int AS count
         FROM core.pillars p
         JOIN core.contents c ON c.pillar_id = p.id AND c.deleted_at IS NULL AND c.is_active = true
         JOIN core.tasks t ON t.content_id = c.id AND t.deleted_at IS NULL
         WHERE p.is_active = true
           AND t.assigned_to = $1
         GROUP BY p.id, p.pillar_name
         ORDER BY count DESC, p.pillar_name ASC`,
        [userId]
      )
    : await pool.query(
        `SELECT
           p.id,
           p.pillar_name,
           COUNT(c.id)::int AS count
         FROM core.pillars p
         LEFT JOIN core.contents c ON c.pillar_id = p.id AND c.deleted_at IS NULL AND c.is_active = true
         WHERE p.is_active = true
         GROUP BY p.id, p.pillar_name
         ORDER BY count DESC, p.pillar_name ASC`
      );

  const total = rows.reduce((sum, row) => sum + row.count, 0);

  const pillars = rows
    .filter((row) => row.count > 0)
    .map((row) => ({
      id: row.id,
      pillar_name: row.pillar_name,
      count: row.count,
      percent: total > 0 ? Math.round((row.count / total) * 1000) / 10 : 0,
    }));

  return {
    widget: "pillars_usage",
    total_contents: total,
    pillars,
  };
};

export const getLatestTasksWidget = async (userId, query = {}) => {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);

  // userId = null → superadmin: semua task aktif tanpa filter assigned_to
  if (userId === null) {
    const { rows } = await pool.query(
      `SELECT t.id, t.title, t.status, t.deadline, t.created_at,
              c.title AS content_title,
              u.full_name AS assigned_to_name
       FROM core.tasks t
       JOIN core.contents c ON c.id = t.content_id
       LEFT JOIN core.users u ON u.id = t.assigned_to
       WHERE t.status IN ('to_do', 'on_progress', 'review', 'revision', 'overdue')
         AND t.deleted_at IS NULL
         AND c.deleted_at IS NULL
         AND c.is_active = true
       ORDER BY t.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return { widget: "latest-tasks", tasks: rows };
  }

  const { rows } = await pool.query(
    `SELECT t.id, t.title, t.status, t.deadline, t.created_at, c.title AS content_title
     FROM core.tasks t
     JOIN core.contents c ON c.id = t.content_id
     WHERE t.assigned_to = $1
       AND t.status IN ('to_do', 'on_progress', 'review', 'revision', 'overdue')
       AND t.deleted_at IS NULL
       AND c.deleted_at IS NULL
       AND c.is_active = true
     ORDER BY t.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return {
    widget: "latest-tasks",
    tasks: rows,
  };
};

export const getTasksByStatusWidget = async (userId) => {
  // userId = null → superadmin: semua task, tanpa filter assigned_to
  const { rows } = userId !== null
    ? await pool.query(
        `SELECT status, COUNT(*)::int AS count
         FROM core.tasks
         WHERE assigned_to = $1 AND deleted_at IS NULL
         GROUP BY status
         ORDER BY status ASC`,
        [userId]
      )
    : await pool.query(
        `SELECT status, COUNT(*)::int AS count
         FROM core.tasks
         WHERE deleted_at IS NULL
         GROUP BY status
         ORDER BY status ASC`
      );
  return {
    widget: "tasks-by-status",
    statuses: rows,
  };
};

export const getTasksTitlePriorityWidget = async (userId, query = {}) => {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);

  // userId = null → superadmin: semua task
  const { rows } = userId !== null
    ? await pool.query(
        `SELECT t.id, t.title, c.priority
         FROM core.tasks t
         JOIN core.contents c ON c.id = t.content_id
         WHERE t.assigned_to = $1
           AND t.deleted_at IS NULL
           AND c.deleted_at IS NULL
           AND c.is_active = true
         ORDER BY t.created_at DESC
         LIMIT $2`,
        [userId, limit]
      )
    : await pool.query(
        `SELECT t.id, t.title, c.priority,
                u.full_name AS assigned_to_name
         FROM core.tasks t
         JOIN core.contents c ON c.id = t.content_id
         LEFT JOIN core.users u ON u.id = t.assigned_to
         WHERE t.deleted_at IS NULL
           AND c.deleted_at IS NULL
           AND c.is_active = true
         ORDER BY t.created_at DESC
         LIMIT $1`,
        [limit]
      );
  return {
    widget: "tasks-title-priority",
    tasks: rows,
  };
};

export const getTasksByStatusChart = async (userId) => {
  // userId = null → superadmin: semua task tanpa filter assigned_to
  const { rows } = userId !== null
    ? await pool.query(
        `SELECT status, COUNT(*)::int AS count
         FROM core.tasks
         WHERE assigned_to = $1 AND deleted_at IS NULL
         GROUP BY status
         ORDER BY status ASC`,
        [userId]
      )
    : await pool.query(
        `SELECT status, COUNT(*)::int AS count
         FROM core.tasks
         WHERE deleted_at IS NULL
         GROUP BY status
         ORDER BY status ASC`
      );
  return {
    metric: "tasks_by_status",
    series: rows,
  };
};

export const getCommentsRevisionChart = async (userId, query = {}) => {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);

  // userId = null → superadmin: semua komentar pada task berstatus revision
  if (userId === null) {
    const { rows } = await pool.query(
      `SELECT
         tc.id,
         tc.task_id,
         t.title AS task_title,
         tc.user_id,
         u.full_name AS user_name,
         tc.message,
         tc.created_at,
         assignee.full_name AS assigned_to_name
       FROM core.task_comments tc
       JOIN core.tasks t ON t.id = tc.task_id
       LEFT JOIN core.users u ON u.id = tc.user_id
       LEFT JOIN core.users assignee ON assignee.id = t.assigned_to
       WHERE t.status = 'revision'
         AND tc.deleted_at IS NULL
         AND t.deleted_at IS NULL
       ORDER BY tc.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return { metric: "comments_revision", comments: rows };
  }

  const { rows } = await pool.query(
    `SELECT
       tc.id,
       tc.task_id,
       t.title AS task_title,
       tc.user_id,
       u.full_name AS user_name,
       tc.message,
       tc.created_at
     FROM core.task_comments tc
     JOIN core.tasks t ON t.id = tc.task_id
     LEFT JOIN core.users u ON u.id = tc.user_id
     WHERE t.assigned_to = $1
       AND t.status = 'revision'
       AND tc.deleted_at IS NULL
       AND t.deleted_at IS NULL
     ORDER BY tc.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return {
    metric: "comments_revision",
    comments: rows,
  };
};

export const getSocialMediaSummary = async (userId) => {
  const [countsResult, scheduledResult, publishedResult] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'to_do')::int AS to_do,
         COUNT(*) FILTER (WHERE status = 'on_progress')::int AS on_progress,
         COUNT(*) FILTER (WHERE status = 'scheduled')::int AS scheduled,
         COUNT(*) FILTER (WHERE status = 'revision')::int AS revision,
         COUNT(*) FILTER (WHERE status = 'published')::int AS published
       FROM core.tasks
       WHERE assigned_to = $1 AND deleted_at IS NULL`,
      [userId]
    ),
    pool.query(
      `SELECT t.id, t.title, t.deadline, c.title AS content_title
       FROM core.tasks t
       JOIN core.contents c ON c.id = t.content_id
       WHERE t.assigned_to = $1
         AND t.status = 'scheduled'
         AND t.deleted_at IS NULL
       ORDER BY t.deadline ASC NULLS LAST
       LIMIT 10`,
      [userId]
    ),
    pool.query(
      `SELECT t.id, t.title, t.deadline, c.title AS content_title
       FROM core.tasks t
       JOIN core.contents c ON c.id = t.content_id
       WHERE t.assigned_to = $1
         AND t.status = 'published'
         AND t.deleted_at IS NULL
       ORDER BY t.updated_at DESC
       LIMIT 10`,
      [userId]
    ),
  ]);

  const counts = countsResult.rows[0] || {
    total: 0, to_do: 0, on_progress: 0, scheduled: 0, revision: 0, published: 0,
  };

  return {
    tasks: {
      total: counts.total,
      to_do: counts.to_do,
      on_progress: counts.on_progress,
      scheduled: counts.scheduled,
      revision: counts.revision,
      published: counts.published,
    },
    scheduled_list: scheduledResult.rows,
    published_list: publishedResult.rows,
  };
};
