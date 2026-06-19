import * as service from "./reviews.service.js";
import { success, created } from "../../utils/response.js";

export const getByContent = async (req, res, next) => {
  try {
    success(res, await service.getByContent(+req.params.contentId, req.query));
  } catch (e) {
    next(e);
  }
};

export const create = async (req, res, next) => {
  try {
    const review = await service.create(req.user.id, req.body);
    created(res, review, "Review berhasil dikirim");
  } catch (e) {
    next(e);
  }
};
