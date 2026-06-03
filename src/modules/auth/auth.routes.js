import { Router } from "express";
import * as controller from "./auth.controller.js";
import { loginRules, refreshRules } from "./auth.validation.js";
import authenticate from "../../middlewares/authenticate.js";
import validate from "../../middlewares/validate.js";
import { loginLimiter, refreshLimiter } from "../../middlewares/rateLimiter.js";

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     description: |
 *       Autentikasi user menggunakan email dan password.
 *       - Mengembalikan **access token** (berlaku singkat) dan **refresh token** (berlaku 7 hari)
 *       - Access token digunakan sebagai Bearer Token di semua endpoint yang membutuhkan autentikasi
 *       - User yang tidak aktif (`is_active = false`) tidak dapat login
 *       - User yang belum memiliki role tidak dapat login
 *       - Rate limit: **5 percobaan per 15 menit** per IP
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login berhasil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Email atau password salah
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post("/login", loginLimiter, loginRules, validate, controller.login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Perbarui access token
 *     description: |
 *       Gunakan refresh token yang masih valid untuk mendapatkan access token baru.
 *       - Refresh token lama akan **langsung dihapus** (token rotation)
 *       - Refresh token baru akan diterbitkan bersamaan dengan access token baru
 *       - Refresh token yang sudah expired atau tidak ditemukan akan ditolak
 *       - Rate limit: **10 percobaan per 15 menit** per IP
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Token berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         accessToken:  { type: string }
 *                         refreshToken: { type: string }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/refresh",
  refreshLimiter,
  refreshRules,
  validate,
  controller.refresh,
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user
 *     description: |
 *       Mengakhiri sesi login dengan menghapus refresh token dari database.
 *       - Refresh token yang dikirim akan dihapus permanen dari database
 *       - Access token yang masih aktif tetap valid hingga expired secara alami
 *       - Untuk keamanan penuh, hapus access token dari sisi client setelah logout
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Logout berhasil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post("/logout", refreshRules, validate, controller.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Data user yang sedang login
 *     description: |
 *       Mengembalikan informasi user berdasarkan access token yang aktif.
 *       - Tidak melakukan query tambahan ke database — data diambil langsung dari payload JWT
 *       - Berguna untuk memvalidasi status login di sisi client
 *       - Jika token expired, akan mengembalikan error 401
 *     responses:
 *       200:
 *         description: Data user berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserProfile'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/me", authenticate, controller.me);

export default router;
