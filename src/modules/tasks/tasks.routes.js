import { Router } from "express";
import * as controller from "./tasks.controller.js";
import { createRules, updateRules } from "./tasks.validation.js";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validate from "../../middlewares/validate.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: List semua task
 *     description: |
 *       Mengambil daftar task beserta informasi konten, kontrak, dan pillar terkait.
 *       - Dapat difilter berdasarkan `content_id`, `contract_id`, `pillar_id`, dan/atau `status`
 *       - Filter `contract_id` bekerja melalui JOIN ke tabel contents (task tidak langsung punya contract_id)
 *       - Hanya menampilkan task yang belum dihapus (`deleted_at IS NULL` dan `is_active = true`)
 *       - Secara default, jika `content_id` atau `contract_id` tidak dikirim, task dari konten/kontrak yang terhapus/tidak aktif akan disembunyikan.
 *       - Jika `content_id` atau `contract_id` dikirim (untuk tracking), task tersebut tetap ditampilkan meskipun induknya sudah tidak aktif.
 *       - Diurutkan berdasarkan `due_date` terdekat (ASC, null di akhir)
 *       - Mendukung pagination via parameter `limit` dan `offset`
 *     parameters:
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - $ref: '#/components/parameters/OffsetQuery'
 *       - in: query
 *         name: content_id
 *         schema: { type: integer }
 *         description: Filter berdasarkan ID konten
 *       - in: query
 *         name: contract_id
 *         schema: { type: integer }
 *         description: Filter berdasarkan ID kontrak (via relasi konten)
 *       - in: query
 *         name: pillar_id
 *         schema: { type: integer }
 *         description: Filter berdasarkan ID content pillar
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/TaskStatus'
 *         description: Filter berdasarkan status task
 *     responses:
 *       200:
 *         description: Daftar task berhasil diambil
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
 *                         $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags: [Tasks]
 *     summary: Buat task baru
 *     description: |
 *       Membuat task baru yang dikaitkan ke konten dan content pillar tertentu.
 *       - `content_id` dan `pillar_id` harus merujuk ke data yang valid
 *       - Status awal task adalah **`to_do`**
 *       - `start_date` tidak boleh lebih besar dari `due_date`
 *       - Tersedia untuk: **superadmin**, **owner**, **content_lead**
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskRequest'
 *     responses:
 *       201:
 *         description: Task berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Task'
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
 * /api/tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Detail task
 *     description: |
 *       Mengambil data lengkap satu task beserta informasi konten, pillar, dan kontrak terkait.
 *       - Response menyertakan `content_title`, `pillar_name`, `contract_name`
 *       - Hanya task yang belum dihapus yang dapat diakses
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Data task berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Tasks]
 *     summary: Update task / ubah status
 *     description: |
 *       Memperbarui data task atau mengubah statusnya.
 *       - Field yang tidak dikirim **tidak akan diubah** (partial update)
 *       - Alur status task: `to_do → on_progress → review → revision / approved → scheduled / published`
 *       - Status `overdue` diset oleh sistem jika deadline terlewat
 *       - `start_date` tidak boleh lebih besar dari `due_date`
 *       - Tersedia untuk: **superadmin**, **owner**, **content_lead**
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskRequest'
 *     responses:
 *       200:
 *         description: Task berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *   delete:
 *     tags: [Tasks]
 *     summary: Hapus task (Soft Delete)
 *     description: |
 *       Menonaktifkan task tanpa menghapus datanya dari database.
 *       - Data task tetap tersimpan untuk keperluan audit trail
 *       - Relasi data (task_outputs, task_comments, reviews) tetap terjaga dan tidak terputus
 *       - Task yang dihapus tidak akan muncul di list `GET /api/tasks`
 *       - Tersedia untuk: **superadmin**, **owner**, **content_lead**
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Task berhasil dihapus
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
  authorize("superadmin", "owner", "content_lead"),
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
