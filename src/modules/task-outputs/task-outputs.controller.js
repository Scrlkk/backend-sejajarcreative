import * as service from "./task-outputs.service.js";
import { success, created } from "#utils/response.js";
import fs from "fs";
import path from "path";
import { UPLOAD_DIR } from "#config/upload.js";

const getFileSizeString = (fileUrl) => {
  if (!fileUrl) return null;
  const filename = fileUrl.split("/").pop();
  const filePath = path.join(UPLOAD_DIR, filename);
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const bytes = stats.size;
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  } catch (err) {
    console.error("Failed to read file size:", err.message);
  }
  return null;
};

const enrichOutput = (output) => {
  if (!output) return null;
  return {
    ...output,
    file_size: getFileSizeString(output.file_url),
  };
};

export const getByTask = async (req, res, next) => {
  try {
    const list = await service.getByTask(+req.params.taskId, req.query);
    success(res, list.map(enrichOutput));
  } catch (e) {
    next(e);
  }
};

export const getById = async (req, res, next) => {
  try {
    const item = await service.getById(+req.params.id);
    success(res, enrichOutput(item));
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
    const createdItem = await service.create(data, req.user);
    created(res, enrichOutput(createdItem), "Task output berhasil dibuat");
  } catch (e) {
    next(e);
  }
};

export const remove = async (req, res, next) => {
  try {
    await service.remove(+req.params.id, req.user);
    success(res, null, "Task output berhasil dihapus");
  } catch (e) {
    next(e);
  }
};

export const update = async (req, res, next) => {
  try {
    const data = await service.update(+req.params.id, req.body, req.user);
    success(res, enrichOutput(data), "Task output berhasil diperbarui");
  } catch (e) {
    next(e);
  }
};
