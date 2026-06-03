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
 * /api/reviews/task-assignment/{assignmentId}:
 *   get:
 *     tags: [Reviews]
 *     summary: List review untuk task assignment
 *     description: |
 *       Mengambil semua riwayat review yang pernah diberikan untuk sebuah task assignment.
 *       - Diurutkan dari review terbaru (berdasarkan `reviewed_at`, null di akhir)
 *       - Satu task assignment dapat memiliki lebih dari satu review (riwayat revisi)
 *       - Response menyertakan `reviewer_name` dari relasi JOIN ke tabel users
 *       - Mendukung pagination via parameter `limit` dan `offset`
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema: { type: integer }
 *         description: ID task assignment
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
 *       404:
 *         description: Task assignment tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags: [Reviews]
 *     summary: Submit review untuk task assignment
 *     description: |
 *       Memberikan review terhadap hasil kerja dari sebuah task assignment.
 *       - Reviewer adalah user yang sedang login (`reviewer_id` diisi otomatis dari token)
 *       - Jika review berstatus **approved**:
 *         - Status task assignment berubah menjadi `done`
 *         - Status task induk berubah menjadi `done`
 *       - Jika review berstatus **revision**:
 *         - Status task assignment kembali menjadi `in_progress`
 *         - Worker perlu mengirimkan ulang hasil kerja sebelum dapat di-review kembali
 *       - Tersedia untuk: **superadmin**, **owner**, **content_lead**
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema: { type: integer }
 *         description: ID task assignment yang akan di-review
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
 *         description: Task assignment tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get("/task-assignment/:assignmentId", controller.getByTaskAssignment);
router.post(
  "/task-assignment/:assignmentId",
  authorize("superadmin", "owner", "content_lead"),
  createRules,
  validate,
  controller.create,
);

export default router;
