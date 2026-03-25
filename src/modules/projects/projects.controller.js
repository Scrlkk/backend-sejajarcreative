import * as service from "./projects.service.js";
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
    created(res, await service.create(req.body, req.user.id), "Project dibuat");
  } catch (e) {
    next(e);
  }
};
export const update = async (req, res, next) => {
  try {
    success(
      res,
      await service.update(+req.params.id, req.body),
      "Project diperbarui",
    );
  } catch (e) {
    next(e);
  }
};
export const remove = async (req, res, next) => {
  try {
    await service.remove(+req.params.id);
    success(res, null, "Project dihapus");
  } catch (e) {
    next(e);
  }
};
export const getMembers = async (req, res, next) => {
  try {
    success(res, await service.getMembers(+req.params.id));
  } catch (e) {
    next(e);
  }
};
export const addMember = async (req, res, next) => {
  try {
    created(
      res,
      await service.addMember(+req.params.id, req.body),
      "Member ditambahkan",
    );
  } catch (e) {
    next(e);
  }
};
export const removeMember = async (req, res, next) => {
  try {
    await service.removeMember(+req.params.id, +req.params.userId);
    success(res, null, "Member dihapus");
  } catch (e) {
    next(e);
  }
};
