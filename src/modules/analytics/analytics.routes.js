import { Router } from "express";
import * as controller from "./analytics.controller.js";
import { recordRules, topQueryRules } from "./analytics.validation.js";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validate from "../../middlewares/validate.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/analytics/top:
 *   get:
 *     tags: [Analytics]
 *     summary: Top konten berdasarkan total views
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 50 }
 *         description: Jumlah top konten yang ditampilkan
 *       - in: query
 *         name: project_id
 *         schema: { type: integer }
 *         description: Filter berdasarkan project
 *     responses:
 *       200:
 *         description: Data top konten berhasil diambil
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
 *                         $ref: '#/components/schemas/TopContent'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/top", topQueryRules, validate, controller.getTopContents);

/**
 * @swagger
 * /api/analytics/content/{contentId}:
 *   get:
 *     tags: [Analytics]
 *     summary: Riwayat engagement sebuah konten
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema: { type: integer }
 *         description: ID konten
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - $ref: '#/components/parameters/OffsetQuery'
 *     responses:
 *       200:
 *         description: Riwayat engagement berhasil diambil
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
 *                         $ref: '#/components/schemas/Engagement'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/analytics/content/{contentId}/summary:
 *   get:
 *     tags: [Analytics]
 *     summary: Ringkasan total engagement sebuah konten
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema: { type: integer }
 *         description: ID konten
 *     responses:
 *       200:
 *         description: Ringkasan engagement berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/EngagementSummary'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/content/:contentId", controller.getByContent);
router.get("/content/:contentId/summary", controller.getSummary);

/**
 * @swagger
 * /api/analytics/engagements:
 *   post:
 *     tags: [Analytics]
 *     summary: Rekam data engagement konten
 *     description: Hanya **admin_social_media**, **owner**, dan **superadmin** yang dapat merekam engagement.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecordEngagementRequest'
 *     responses:
 *       201:
 *         description: Engagement berhasil direkam
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Engagement'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/engagements",
  authorize("superadmin", "owner", "admin_social_media"),
  recordRules,
  validate,
  controller.record,
);

export default router;
