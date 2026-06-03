import { Router } from "express";
import * as controller from "./task-assignments.controller.js";
import { createRules, updateRules } from "./task-assignments.validation.js";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validate from "../../middlewares/validate.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/task-assignments:
 *   get:
 *     tags: [Task Assignments]
 *     summary: List penugasan task
 *     description: |
 *       Mengambil daftar penugasan task beserta informasi user yang ditugaskan.
 *       - Dapat difilter berdasarkan `task_id`, `assigned_to`, dan/atau `status`
 *       - Hanya menampilkan penugasan yang belum dihapus (`deleted_at IS NULL`)
 *       - Response menyertakan `assignee_name` dan `task_title` dari relasi JOIN
 *       - Mendukung pagination via parameter `limit` dan `offset`
 *     parameters:
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - $ref: '#/components/parameters/OffsetQuery'
 *       - in: query
 *         name: task_id
 *         schema: { type: integer }
 *         description: Filter berdasarkan ID task
 *       - in: query
 *         name: assigned_to
 *         schema: { type: integer }
 *         description: Filter berdasarkan ID user yang ditugaskan
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/TaskStatus'
 *         description: Filter berdasarkan status penugasan
 *     responses:
 *       200:
 *         description: Daftar penugasan task berhasil diambil
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
 *                         $ref: '#/components/schemas/TaskAssignment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags: [Task Assignments]
 *     summary: Buat penugasan task
 *     description: |
 *       Menugaskan seorang user untuk mengerjakan sebuah task dengan role tertentu.
 *       - `assigned_to` harus merujuk ke user yang aktif (`is_active = true`)
 *       - `assignment_role` menentukan jenis pekerjaan: `scriptwriter`, `content_editor`, atau `social_media_admin`
 *       - Status awal penugasan adalah **pending**
 *       - Field `notes_from_admin`, `script_text`, dan `file_url` bersifat opsional
 *       - Tersedia untuk: **superadmin**, **owner**, **content_lead**
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskAssignmentRequest'
 *     responses:
 *       201:
 *         description: Penugasan berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TaskAssignment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get("/", controller.getAll);
router.post(
  "/",
  authorize("superadmin", "owner", "content_lead"),
  createRules,
  validate,
  controller.create,
);

/**
 * @swagger
 * /api/task-assignments/{id}:
 *   get:
 *     tags: [Task Assignments]
 *     summary: Detail penugasan task
 *     description: |
 *       Mengambil data lengkap satu penugasan task beserta informasi user dan task terkait.
 *       - Response menyertakan `assignee_name`, `task_title`, dan `content_id`
 *       - Hanya penugasan yang belum dihapus yang dapat diakses
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Data penugasan task berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TaskAssignment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Task Assignments]
 *     summary: Update penugasan task / ubah status
 *     description: |
 *       Memperbarui data penugasan task atau mengubah statusnya.
 *       - Field yang tidak dikirim **tidak akan diubah** (partial update)
 *       - Alur status penugasan: `pending → in_progress → review → done`
 *       - Status `done` diset otomatis oleh sistem ketika review disetujui (**approved**)
 *       - Ketika status berubah ke `review` atau `done`, field `submitted_at` akan diisi otomatis
 *       - Tersedia untuk: **superadmin**, **owner**, **content_lead**, **content_editor**, **script_writer**, **admin_social_media**
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskAssignmentRequest'
 *     responses:
 *       200:
 *         description: Penugasan task berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TaskAssignment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *   delete:
 *     tags: [Task Assignments]
 *     summary: Hapus penugasan task (Soft Delete)
 *     description: |
 *       Menonaktifkan penugasan task tanpa menghapus datanya dari database.
 *       - Data penugasan tetap tersimpan untuk keperluan audit trail
 *       - Relasi data (reviews) tetap terjaga dan tidak terputus
 *       - Penugasan yang dihapus tidak akan muncul di list `GET /api/task-assignments`
 *       - Tersedia untuk: **superadmin**, **owner**, **content_lead**
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Penugasan task berhasil dihapus
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
router.get("/:id", controller.getById);
router.put(
  "/:id",
  authorize("superadmin", "owner", "content_lead", "content_editor", "script_writer", "admin_social_media"),
  updateRules,
  validate,
  controller.update,
);
router.delete(
  "/:id",
  authorize("superadmin", "owner", "content_lead"),
  controller.remove,
);

export default router;
