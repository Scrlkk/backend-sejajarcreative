import * as service from "./task-outputs.service.js";
import { success, created } from "../../utils/response.js";

export const getByTask = async (req, res, next) => {
  try {
    success(res, await service.getByTask(+req.params.taskId, req.query));
  } catch (e) {
    next(e);
  }
};

export const getById = async (req, res, next) => {
  try {
    success(res, await service.getById(+req.params.id));
  } catch (e) {
    next(e);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = { ...req.body };
    // If a file was uploaded, construct the file_url
    if (req.file) {
      data.file_url = `/uploads/${req.file.filename}`;
    }
    created(res, await service.create(data), "Task output berhasil dibuat");
  } catch (e) {
    next(e);
  }
};

export const remove = async (req, res, next) => {
  try {
    await service.remove(+req.params.id);
    success(res, null, "Task output berhasil dihapus");
  } catch (e) {
    next(e);
  }
};
