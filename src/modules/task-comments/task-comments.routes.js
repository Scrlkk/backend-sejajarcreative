import { Router } from "express";
import * as controller from "./task-comments.controller.js";
import { createRules } from "./task-comments.validation.js";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validate from "../../middlewares/validate.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/task-comments/task/{taskId}:
 *   get:
 *     tags: ["Task Comments"]
 *     summary: List komentar per task
 *     description: |
 *       Mengambil semua komentar/diskusi untuk satu task.
 *       - Hanya dapat diakses oleh user yang telah login
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID task
 *     responses:
 *       200:
 *         description: Daftar komentar task
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
 *                         $ref: '#/components/schemas/TaskComment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/task/:taskId", controller.getByTask);

/**
 * @swagger
 * /api/task-comments:
 *   post:
 *     tags: ["Task Comments"]
 *     summary: Tambah komentar task
 *     description: |
 *       Menambahkan komentar/diskusi pada sebuah task.
 *       - `task_id` dan `message` wajib diisi
 *       - User yang login akan otomatis dicatat sebagai pembuat komentar
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskCommentRequest'
 *     responses:
 *       201:
 *         description: Komentar berhasil ditambahkan
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TaskComment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/",
  authorize(
    "superadmin",
    "owner",
    "content_lead",
    "content_editor",
    "script_writer",
    "admin_social_media",
  ),
  createRules,
  validate,
  controller.create,
);

/**
 * @swagger
 * /api/task-comments/{id}:
 *   delete:
 *     tags: ["Task Comments"]
 *     summary: Hapus komentar (Hard Delete)
 *     description: |
 *       Menghapus komentar secara permanen dari database.
 *       - Hanya superadmin, owner, dan content_lead yang dapat menghapus
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Komentar berhasil dihapus
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  "/:id",
  authorize("superadmin", "owner", "content_lead"),
  controller.remove,
);

export default router;
