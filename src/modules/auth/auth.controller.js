import * as authService from "./auth.service.js";
import { success } from "../../utils/response.js";

const getExtra = (req) => ({
  ip: req.ip || null,
  ua: req.get("user-agent") || null,
});

export const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body.email, req.body.password, getExtra(req));
    success(res, data, "Login berhasil");
  } catch (e) {
    next(e);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const data = await authService.refresh(req.body.refresh_token);
    success(res, data, "Token diperbarui");
  } catch (e) {
    next(e);
  }
};

export const logout = async (req, res, next) => {
  try {
    await authService.logout(req.body.refresh_token, getExtra(req));
    success(res, null, "Logout berhasil");
  } catch (e) {
    next(e);
  }
};

export const me = (req, res) => success(res, req.user);
