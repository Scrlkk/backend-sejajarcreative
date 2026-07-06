import * as service from "./clients.service.js";
import { success, created } from "#utils/response.js";

export const getAll = async (req, res, next) => {
  try {
    success(res, await service.getAll(req.query));
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
    created(res, await service.create(req.body), "Client berhasil dibuat");
  } catch (e) {
    next(e);
  }
};
export const update = async (req, res, next) => {
  try {
    success(
      res,
      await service.update(+req.params.id, req.body),
      "Client diperbarui",
    );
  } catch (e) {
    next(e);
  }
};
export const remove = async (req, res, next) => {
  try {
    await service.remove(+req.params.id);
    success(res, null, "Client dihapus");
  } catch (e) {
    next(e);
  }
};

export const restore = async (req, res, next) => {
  try {
    success(res, await service.restore(+req.params.id), "Client diaktifkan kembali");
  } catch (e) {
    next(e);
  }
};
