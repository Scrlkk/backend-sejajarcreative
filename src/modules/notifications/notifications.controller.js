import * as service from "./notifications.service.js";
import { success, created } from "../../utils/response.js";

export const getMyNotifications = async (req, res, next) => {
  try {
    success(
      res,
      await service.getMyNotifications(req.user.id, req.query),
      "Notifikasi diambil",
    );
  } catch (e) {
    next(e);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    success(res, await service.getUnreadCount(req.user.id), "Unread count");
  } catch (e) {
    next(e);
  }
};

export const getById = async (req, res, next) => {
  try {
    success(
      res,
      await service.getById(+req.params.id, req.user.id),
      "Notifikasi diambil",
    );
  } catch (e) {
    next(e);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    success(
      res,
      await service.markAsRead(+req.params.id, req.user.id),
      "Notifikasi ditandai sudah dibaca",
    );
  } catch (e) {
    next(e);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    success(
      res,
      await service.markAllAsRead(req.user.id),
      "Semua notifikasi ditandai sudah dibaca",
    );
  } catch (e) {
    next(e);
  }
};

export const remove = async (req, res, next) => {
  try {
    success(
      res,
      await service.remove(+req.params.id, req.user.id),
      "Notifikasi dihapus",
    );
  } catch (e) {
    next(e);
  }
};
