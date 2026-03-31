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
 *     tags: [Reviews]
 *     summary: List semua review untuk konten tertentu
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema: { type: integer }
 *         description: ID konten yang akan dilihat reviewnya
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - $ref: '#/components/parameters/OffsetQuery'
 *     responses:
 *       200:
 *         description: Daftar review berhasil diambil
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
 *   post:
 *     tags: [Reviews]
 *     summary: Submit review untuk konten
 *     description: |
 *       Setelah review disubmit, status konten akan otomatis diperbarui:
 *       - `approved` → status konten menjadi `approved`
 *       - `revision` → status konten kembali ke `draft`
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema: { type: integer }
 *         description: ID konten yang akan di-review
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
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get("/content/:contentId", controller.getByContent);
router.post(
  "/content/:contentId",
  authorize("superadmin", "owner", "content_lead"),
  createRules,
  validate,
  controller.create,
);

export default router;
