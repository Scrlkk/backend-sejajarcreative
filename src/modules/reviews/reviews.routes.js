import { Router } from "express";
import * as controller from "./reviews.controller.js";
import { createRules } from "./reviews.validation.js";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validate from "../../middlewares/validate.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/reviews/content/{contentId}:
 *   get:
 *     tags: ["Reviews"]
 *     summary: List review per konten
 *     description: |
 *       Mengambil semua review untuk satu konten.
 *       - Hanya dapat diakses oleh user yang telah login
 *       - Mendukung pagination via parameter `limit` dan `offset`
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID konten
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - $ref: '#/components/parameters/OffsetQuery'
 *     responses:
 *       200:
 *         description: Daftar review konten
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
 *                         $ref: '#/components/schemas/Review'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/content/:contentId", controller.getByContent);

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     tags: ["Reviews"]
 *     summary: Kirim review konten
 *     description: |
 *       Mengirim review/feedback untuk sebuah konten.
 *       - `content_id` dan `feedback` wajib diisi
 *       - Reviewer akan otomatis tercatat sebagai user yang login
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReviewRequest'
 *     responses:
 *       201:
 *         description: Review berhasil dikirim
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Review'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/",
  authorize("superadmin", "owner", "content_lead"),
  createRules,
  validate,
  controller.create,
);

export default router;
