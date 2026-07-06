import { Router } from "express";
import * as controller from "./notifications.controller.js";
import { getAllRules, idRule } from "./notifications.validation.js";
import authenticate from "#middlewares/authenticate.js";
import validate from "#middlewares/validate.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     tags: ["Notifications"]
 *     summary: List notifikasi user yang login
 *     description: |
 *       Mengambil daftar notifikasi milik user yang sedang login.
 *       - Otomatis hanya mengembalikan notifikasi user sendiri
 *       - Filter opsional `is_read` (true/false)
 *       - Diurutkan dari yang terbaru
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - $ref: '#/components/parameters/OffsetQuery'
 *       - in: query
 *         name: is_read
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Filter status baca
 *     responses:
 *       200:
 *         description: Daftar notifikasi
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/", getAllRules, validate, controller.getMyNotifications);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     tags: ["Notifications"]
 *     summary: Jumlah notifikasi belum dibaca
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Jumlah unread
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
 *                         unread:
 *                           type: integer
 *                           example: 5
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/unread-count", controller.getUnreadCount);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     tags: ["Notifications"]
 *     summary: Tandai semua notifikasi sudah dibaca
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Semua notifikasi ditandai sudah dibaca
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
 *                         updated:
 *                           type: boolean
 *                           example: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch("/read-all", controller.markAllAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     tags: ["Notifications"]
 *     summary: Detail notifikasi
 *     description: |
 *       Mengambil detail satu notifikasi.
 *       - Hanya bisa mengakses notifikasi milik sendiri
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Detail notifikasi
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Notification'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:id", idRule, validate, controller.getById);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     tags: ["Notifications"]
 *     summary: Tandai notifikasi sudah dibaca
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Notifikasi ditandai sudah dibaca
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Notification'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch("/:id/read", idRule, validate, controller.markAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     tags: ["Notifications"]
 *     summary: Hapus notifikasi
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Notifikasi dihapus
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete("/:id", idRule, validate, controller.remove);

export default router;
