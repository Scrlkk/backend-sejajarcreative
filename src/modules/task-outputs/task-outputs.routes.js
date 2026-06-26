import { Router } from "express";
import * as controller from "./task-outputs.controller.js";
import { createRules } from "./task-outputs.validation.js";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validate from "../../middlewares/validate.js";
import { upload } from "../../config/upload.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/task-outputs/task/{taskId}:
 *   get:
 *     tags: ["Task Outputs"]
 *     summary: List output per task
 *     description: |
 *       Mengambil semua output/hasil pengerjaan untuk satu task.
 *       - Hanya dapat diakses oleh user yang telah login
 *       - Output dikembalikan beserta versi terbaru
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
 *         description: Daftar output task
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
 *                         $ref: '#/components/schemas/TaskOutput'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/task/:taskId", controller.getByTask);

/**
 * @swagger
 * /api/task-outputs/{id}:
 *   get:
 *     tags: ["Task Outputs"]
 *     summary: Detail output task
 *     description: |
 *       Mengambil detail satu output task berdasarkan ID-nya.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Detail output task
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TaskOutput'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:id", controller.getById);

/**
 * @swagger
 * /api/task-outputs:
 *   post:
 *     tags: ["Task Outputs"]
 *     summary: Kirim output task (dengan file upload)
 *     description: |
 *       Mengirim hasil/output pengerjaan task.
 *       - `task_id` wajib diisi
 *       - `caption` opsional sebagai caption konten
 *       - `hashtag` opsional
 *       - `file` opsional — upload file langsung (PNG, JPG, PDF, DOC, DOCX, MP4, MOV, WEBM)
 *         Maksimal ukuran file: 50 MB
 *       - Setiap output baru akan otomatis menambah versi
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - task_id
 *             properties:
 *               task_id:
 *                 type: integer
 *                 example: 1
 *               caption:
 *                 type: string
 *                 example: "Caption untuk Instagram Reels #Ramadan2025"
 *               hashtag:
 *                 type: string
 *                 example: "#Ramadan2025 #Produktif"
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File yang diupload (opsional)
 *     responses:
 *       201:
 *         description: Output task berhasil dikirim
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TaskOutput'
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
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        // Multer error (file too large, wrong type, etc.)
        return res.status(422).json({
          status: "error",
          message: err.message,
        });
      }
      next();
    });
  },
  createRules,
  validate,
  controller.create,
);

/**
 * @swagger
 * /api/task-outputs/{id}:
 *   delete:
 *     tags: ["Task Outputs"]
 *     summary: Hapus output task (Hard Delete)
 *     description: |
 *       Menghapus output task secara permanen dari database.
 *       - Hanya superadmin, owner, dan content_lead yang dapat menghapus
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Output task berhasil dihapus
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
  authorize(
    "superadmin",
    "owner",
    "content_lead",
    "content_editor",
    "script_writer",
    "admin_social_media",
  ),
  controller.remove,
);

export default router;
