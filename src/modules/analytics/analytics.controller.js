import * as service from "./analytics.service.js";
import { success, created } from "../../utils/response.js";

export const record = async (req, res, next) => {
  try {
    created(res, await service.record(req.body), "Engagement berhasil direkam");
  } catch (e) {
    next(e);
  }
};

export const getByContent = async (req, res, next) => {
  try {
    success(res, await service.getByContent(+req.params.contentId, req.query));
  } catch (e) {
    next(e);
  }
};

export const getSummary = async (req, res, next) => {
  try {
    success(res, await service.getSummary(+req.params.contentId));
  } catch (e) {
    next(e);
  }
};

export const getTopContents = async (req, res, next) => {
  try {
    success(res, await service.getTopContents(req.query));
  } catch (e) {
    next(e);
  }
};

export const deleteByContent = async (req, res, next) => {
  try {
    success(res, await service.deleteByContent(+req.params.contentId), "Data engagement berhasil dihapus");
  } catch (e) {
    next(e);
  }
};
