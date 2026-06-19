import * as service from "./dashboard.service.js";
import { success } from "../../utils/response.js";

export const getSummary = async (req, res, next) => {
  try {
    success(res, await service.getSummary(req.user), "Dashboard summary diambil");
  } catch (e) {
    next(e);
  }
};

export const getSystem = async (req, res, next) => {
  try {
    success(res, await service.getSystem(), "Dashboard system diambil");
  } catch (e) {
    next(e);
  }
};

export const getCharts = async (req, res, next) => {
  try {
    success(res, await service.getCharts(req.user, req.query), "Dashboard chart diambil");
  } catch (e) {
    next(e);
  }
};

export const getWidget = async (req, res, next) => {
  try {
    success(
      res,
      await service.getWidgets(req.user, req.params.name, req.query),
      "Dashboard widget diambil",
    );
  } catch (e) {
    next(e);
  }
};
