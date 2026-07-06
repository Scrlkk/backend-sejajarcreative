import { Router } from "express";
import * as controller from "./contracts.controller.js";
import { createRules, updateRules } from "./contracts.validation.js";
import authenticate from "#middlewares/authenticate.js";
import authorize from "#middlewares/authorize.js";
import validate from "#middlewares/validate.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/contracts:
 *   get:
 *     tags: [Contracts]
 *     summary: List kontrak aktif atau terhapus
 *     description: |
 *       Mengambil daftar semua kontrak di sistem.
 *       - Secara default hanya menampilkan kontrak dengan `is_active = true` dan belum dihapus.
 *       - Jika parameter `status = deleted` dikirim, backend akan mengembalikan kontrak yang telah di-soft-delete (`is_active = false`).
 *       - Kontrak disaring agar hanya menyertakan kontrak milik client yang masih aktif.
 *       - Dapat difilter berdasarkan `client_id` dan/atau `status`.
 *       - Mendukung pagination via parameter `limit` dan `offset`.
 *       - Diurutkan dari kontrak terbaru (ID terbesar terlebih dahulu).
 *     parameters:
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - $ref: '#/components/parameters/OffsetQuery'
 *       - in: query
 *         name: client_id
 *         schema: { type: integer }
 *         description: Filter berdasarkan ID klien
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter berdasarkan status kontrak (misal 'active', 'completed', 'cancelled', 'overdue', atau 'deleted' untuk mengambil kontrak terhapus)
 *     responses:
 *       200:
 *         description: Daftar kontrak berhasil diambil
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
 *                         $ref: '#/components/schemas/Contract'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags: [Contracts]
 *     summary: Buat kontrak baru
 *     description: |
 *       Membuat kontrak baru yang dikaitkan ke client tertentu.
 *       - Hanya **superadmin** dan **owner** yang dapat membuat kontrak
 *       - `client_id` harus merujuk ke client yang aktif
 *       - Status awal kontrak adalah **planning**
 *       - Field `created_by` diisi otomatis dari token login yang aktif
 *       - `start_date` tidak boleh lebih besar dari `end_date`
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateContractRequest'
 *     responses:
 *       201:
 *         description: Kontrak berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Contract'
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
  authorize("superadmin", "owner"),
  createRules,
  validate,
  controller.create,
);

/**
 * @swagger
 * /api/contracts/{id}:
 *   get:
 *     tags: [Contracts]
 *     summary: Detail kontrak
 *     description: |
 *       Mengambil data lengkap satu kontrak beserta informasi client dan pembuat kontrak.
 *       - Hanya kontrak yang masih aktif yang dapat diakses
 *       - Response menyertakan `client_name` dan `created_by_name` dari relasi JOIN
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Data kontrak berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Contract'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Contracts]
 *     summary: Update kontrak
 *     description: |
 *       Memperbarui data kontrak yang ada.
 *       - Hanya **superadmin** dan **owner** yang dapat mengubah kontrak
 *       - Field yang tidak dikirim **tidak akan diubah** (partial update)
 *       - Field `status` dapat diubah sesuai alur: `planning → ongoing → review → completed`
 *       - Field `is_active` tidak bisa diubah langsung lewat endpoint ini — gunakan endpoint delete/restore
 *       - Minimal harus ada 1 field yang diupdate
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateContractRequest'
 *     responses:
 *       200:
 *         description: Kontrak berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Contract'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *   delete:
 *     tags: [Contracts]
 *     summary: Non-aktifkan kontrak (Soft Delete)
 *     description: |
 *       Menonaktifkan kontrak tanpa menghapus datanya dari database.
 *       - Data kontrak tetap tersimpan untuk keperluan audit trail
 *       - Relasi data (contents, tasks, dll) tetap terjaga dan tidak terputus
 *       - Kontrak yang dinonaktifkan tidak akan muncul di list `GET /api/contracts`
 *       - Hanya **superadmin** dan **owner** yang dapat menonaktifkan kontrak
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Kontrak berhasil dinonaktifkan
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
router.delete("/:id", authorize("superadmin", "owner"), controller.remove);
router.post("/:id/restore", authorize("superadmin", "owner"), controller.restore);

export default router;
