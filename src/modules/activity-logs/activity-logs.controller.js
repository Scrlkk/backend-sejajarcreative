import * as service from "./activity-logs.service.js";
import { success } from "#utils/response.js";

export const getAll = async (req, res, next) => {
  try {
    success(res, await service.getAll(req.query), "Activity logs diambil");
  } catch (e) {
    next(e);
  }
};
