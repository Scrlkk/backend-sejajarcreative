import * as service from "./contents.service.js";
import { success, created } from "#utils/response.js";

export const getAll = async (req, res, next) => {
  try {
    success(res, await service.getAll(req.query, req.user));
  } catch (e) {
    next(e);
  }
};
export const getById = async (req, res, next) => {
  try {
    success(res, await service.getById(+req.params.id, req.user));
  } catch (e) {
    next(e);
  }
};
export const create = async (req, res, next) => {
  try {
    created(res, await service.create(req.body, req.user), "Konten berhasil dibuat");
  } catch (e) {
    next(e);
  }
};
export const update = async (req, res, next) => {
  try {
    success(
      res,
      await service.update(+req.params.id, req.body, req.user),
      "Konten berhasil diperbarui",
    );
  } catch (e) {
    next(e);
  }
};
export const remove = async (req, res, next) => {
  try {
    await service.remove(+req.params.id, req.user);
    success(res, null, "Konten berhasil dihapus");
  } catch (e) {
    next(e);
  }
};

export const publish = async (req, res, next) => {
  try {
    success(res, await service.publish(+req.params.id, req.user), "Konten dipublish");
  } catch (e) {
    next(e);
  }
};

export const restore = async (req, res, next) => {
  try {
    success(res, await service.restore(+req.params.id, req.user), "Konten berhasil direstore");
  } catch (e) {
    next(e);
  }
};
