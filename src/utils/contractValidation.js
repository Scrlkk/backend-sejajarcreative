import AppError from "./AppError.js";

export const checkContractStatusByContentId = async (db, contentId, customMessage = null) => {
  const res = await db.query(
    `SELECT co.status 
     FROM core.contracts co
     JOIN core.contents c ON c.contract_id = co.id
     WHERE c.id = $1`,
    [contentId]
  );
  const status = res.rows[0]?.status;
  if (status && ["completed", "cancelled"].includes(status.toLowerCase())) {
    throw new AppError(
      customMessage || "Kontrak telah selesai atau dibatalkan, tidak dapat mengubah rencana konten",
      400
    );
  }
};

export const checkContractStatusByTaskId = async (db, taskId, customMessage = null) => {
  const res = await db.query(
    `SELECT co.status 
     FROM core.contracts co
     JOIN core.contents c ON c.contract_id = co.id
     JOIN core.tasks t ON t.content_id = c.id
     WHERE t.id = $1`,
    [taskId]
  );
  const status = res.rows[0]?.status;
  if (status && ["completed", "cancelled"].includes(status.toLowerCase())) {
    throw new AppError(
      customMessage || "Kontrak terkait telah selesai atau dibatalkan, tidak dapat memodifikasi tugas",
      400
    );
  }
};
