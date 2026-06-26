import * as service from "./contracts.service.js";
import { success, created } from "../../utils/response.js";

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
    created(res, await service.create(req.body, req.user.id), "Contract dibuat");
  } catch (e) {
    next(e);
  }
};

export const update = async (req, res, next) => {
  try {
    success(res, await service.update(+req.params.id, req.body, req.user.id), "Contract diperbarui");
  } catch (e) {
    next(e);
  }
};

export const remove = async (req, res, next) => {
  try {
    await service.remove(+req.params.id, req.user.id);
    success(res, null, "Contract dihapus");
  } catch (e) {
    next(e);
  }
};

export const restore = async (req, res, next) => {
  try {
    success(res, await service.restore(+req.params.id, req.user.id), "Contract diaktifkan kembali");
  } catch (e) {
    next(e);
  }
};
