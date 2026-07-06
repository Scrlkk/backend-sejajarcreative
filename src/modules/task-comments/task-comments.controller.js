import * as service from "./task-comments.service.js";
import { success, created } from "#utils/response.js";

export const getByTask = async (req, res, next) => {
  try {
    success(res, await service.getByTask(+req.params.taskId, req.query));
  } catch (e) {
    next(e);
  }
};

export const create = async (req, res, next) => {
  try {
    created(
      res,
      await service.create(req.body, req.user.id),
      "Komentar berhasil dibuat",
    );
  } catch (e) {
    next(e);
  }
};

export const remove = async (req, res, next) => {
  try {
    await service.remove(+req.params.id);
    success(res, null, "Komentar berhasil dihapus");
  } catch (e) {
    next(e);
  }
};
