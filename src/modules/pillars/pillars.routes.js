import { Router } from "express";
import * as controller from "./pillars.controller.js";
import { createRules, updateRules } from "./pillars.validation.js";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validate from "../../middlewares/validate.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/pillars:
 *   get:
 *     tags: [Pillars]
 *     summary: List content pillars aktif
 *     description: |
 *       Mengambil daftar content pillar yang masih aktif di sistem.
 *       - Hanya menampilkan pillar dengan `is_active = true`
 *       - Pillar yang dinonaktifkan tidak akan muncul di list ini
 *       - Mendukung pagination via parameter `limit` dan `offset`
 *       - Dapat diakses oleh semua user yang sudah login
 *     parameters:
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - $ref: '#/components/parameters/OffsetQuery'
 *     responses:
 *       200:
 *         description: Daftar content pillar berhasil diambil
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
 *                         $ref: '#/components/schemas/Pillar'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags: [Pillars]
 *     summary: Buat content pillar baru
 *     description: |
 *       Membuat content pillar baru untuk mengelompokkan jenis konten secara tematik.
 *       - `pillar_name` harus unik — tidak boleh duplikat dengan pillar yang sudah ada
 *       - Pillar baru langsung aktif (`is_active = true`) setelah dibuat
 *       - Tersedia untuk: **superadmin**, **owner**, **content_lead**
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePillarRequest'
 *     responses:
 *       201:
 *         description: Pillar berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Pillar'
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
 * /api/pillars/{id}:
 *   get:
 *     tags: [Pillars]
 *     summary: Detail content pillar
 *     description: |
 *       Mengambil data lengkap satu content pillar berdasarkan ID-nya.
 *       - Hanya pillar yang masih aktif (`is_active = true`) yang dapat diakses
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Data pillar berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Pillar'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Pillars]
 *     summary: Update content pillar
 *     description: |
 *       Memperbarui data content pillar yang ada.
 *       - Field yang tidak dikirim **tidak akan diubah** (partial update)
 *       - `pillar_name` jika diubah harus tetap unik
 *       - Tersedia untuk: **superadmin**, **owner**, **content_lead**
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePillarRequest'
 *     responses:
 *       200:
 *         description: Pillar berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Pillar'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *   delete:
 *     tags: [Pillars]
 *     summary: Non-aktifkan content pillar (Soft Delete)
 *     description: |
 *       Menonaktifkan content pillar tanpa menghapus datanya dari database.
 *       - Data pillar tetap tersimpan untuk keperluan audit trail
 *       - Relasi data (tasks) yang menggunakan pillar ini tetap terjaga
 *       - Pillar yang dinonaktifkan tidak akan muncul di list `GET /api/pillars`
 *       - Tersedia untuk: **superadmin**, **owner**, **content_lead**
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Pillar berhasil dinonaktifkan
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
