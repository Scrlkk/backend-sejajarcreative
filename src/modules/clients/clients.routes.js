import { Router } from "express";
import * as controller from "./clients.controller.js";
import { createRules, updateRules } from "./clients.validation.js";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validate from "../../middlewares/validate.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/clients:
 *   get:
 *     tags: [Clients]
 *     summary: List semua client aktif
 *     description: |
 *       Mengambil daftar semua client yang masih aktif.
 *       - Hanya menampilkan client dengan `is_active = true` dan belum dihapus
 *       - Client yang dinonaktifkan via soft delete tidak akan muncul
 *       - Mendukung pagination via parameter `limit` dan `offset`
 *       - Dapat diakses oleh semua user yang sudah login
 *     parameters:
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - $ref: '#/components/parameters/OffsetQuery'
 *     responses:
 *       200:
 *         description: Daftar client berhasil diambil
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
 *                         $ref: '#/components/schemas/Client'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags: [Clients]
 *     summary: Tambah client baru
 *     description: |
 *       Mendaftarkan client baru ke dalam sistem.
 *       - Hanya **superadmin** dan **owner** yang dapat menambah client
 *       - Field `client_name` wajib diisi, field lainnya opsional
 *       - Client baru langsung aktif (`is_active = true`) setelah dibuat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClientRequest'
 *     responses:
 *       201:
 *         description: Client berhasil ditambahkan
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Client'
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
 * /api/clients/{id}:
 *   get:
 *     tags: [Clients]
 *     summary: Detail client
 *     description: |
 *       Mengambil data lengkap satu client berdasarkan ID-nya.
 *       - Hanya client yang masih aktif yang dapat diakses
 *       - Dapat diakses oleh semua user yang sudah login
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Data client berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Client'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Clients]
 *     summary: Update data client
 *     description: |
 *       Memperbarui informasi client yang ada.
 *       - Hanya **superadmin** dan **owner** yang dapat mengubah data client
 *       - Field yang tidak dikirim **tidak akan diubah** (partial update)
 *       - Minimal harus ada 1 field yang diupdate
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClientRequest'
 *     responses:
 *       200:
 *         description: Client berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Client'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *   delete:
 *     tags: [Clients]
 *     summary: Non-aktifkan client (Soft Delete)
 *     description: |
 *       Menonaktifkan client tanpa menghapus datanya dari database.
 *       - Data client tetap tersimpan untuk keperluan audit trail
 *       - Relasi data (contracts, dll) tetap terjaga dan tidak terputus
 *       - Client yang dinonaktifkan tidak akan muncul di list `GET /api/clients`
 *       - Hanya **superadmin** yang dapat menghapus client
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Client berhasil dinonaktifkan
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
  authorize("superadmin", "owner"),
  updateRules,
  validate,
  controller.update,
);
router.delete("/:id", authorize("superadmin", "owner"), controller.remove);
router.post("/:id/restore", authorize("superadmin", "owner"), controller.restore);

export default router;
