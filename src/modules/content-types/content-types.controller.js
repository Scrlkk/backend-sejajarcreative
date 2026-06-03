import * as service from "./content-types.service.js";
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
    created(res, await service.create(req.body), "Content type dibuat");
  } catch (e) {
    next(e);
  }
};

export const update = async (req, res, next) => {
  try {
    success(
      res,
      await service.update(+req.params.id, req.body),
      "Content type diperbarui",
    );
  } catch (e) {
    next(e);
  }
};

export const remove = async (req, res, next) => {
  try {
    await service.remove(+req.params.id);
    success(res, null, "Content type dihapus");
  } catch (e) {
    next(e);
  }
};
