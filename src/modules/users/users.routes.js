import { Router } from "express";
import * as controller from "./users.controller.js";
import { createRules, updateRules } from "./users.validation.js";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validate from "../../middlewares/validate.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: List semua user aktif
 *     description: |
 *       Mengambil daftar semua user yang masih aktif di sistem.
 *       - Hanya menampilkan user dengan `is_active = true` dan belum dihapus
 *       - User yang dinonaktifkan tidak akan muncul di list ini
 *       - Akses terbatas hanya untuk **superadmin** dan **owner**
 *       - Mendukung pagination via parameter `limit` dan `offset`
 *     parameters:
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - $ref: '#/components/parameters/OffsetQuery'
 *     responses:
 *       200:
 *         description: Daftar user berhasil diambil
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
 *                         $ref: '#/components/schemas/UserProfile'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   post:
 *     tags: [Users]
 *     summary: Buat user baru
 *     description: |
 *       Membuat akun user baru di sistem.
 *       - Hanya **superadmin** yang dapat membuat user baru
 *       - Password akan di-hash sebelum disimpan ke database
 *       - Email harus unik — tidak boleh duplikat dengan user yang sudah ada
 *       - Field `role` wajib diisi dan harus sesuai dengan role yang tersedia
 *       - User baru langsung aktif (`is_active = true`) setelah dibuat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: User berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserProfile'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         description: Email sudah digunakan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get("/", authorize("superadmin", "owner"), controller.getAll);
router.post(
  "/",
  authorize("superadmin"),
  createRules,
  validate,
  controller.create,
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Detail user berdasarkan ID
 *     description: |
 *       Mengambil data lengkap satu user berdasarkan ID-nya.
 *       - Hanya user dengan `is_active = true` yang bisa diakses
 *       - Akses terbatas hanya untuk **superadmin** dan **owner**
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Data user berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserProfile'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Users]
 *     summary: Update data user
 *     description: |
 *       Memperbarui data user yang ada.
 *       - Hanya **superadmin** yang dapat mengubah data user lain
 *       - Field yang tidak dikirim **tidak akan diubah** (partial update)
 *       - Jika field `role` dikirim, role lama akan **diganti** (bukan ditambahkan)
 *       - Jika field `password` dikirim, akan langsung di-hash ulang
 *       - Minimal harus ada 1 field yang diupdate
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: User berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserProfile'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *   delete:
 *     tags: [Users]
 *     summary: Non-aktifkan user (Soft Delete)
 *     description: |
 *       Menonaktifkan user tanpa menghapus datanya dari database.
 *       - Data user tetap tersimpan untuk keperluan audit trail
 *       - User yang dinonaktifkan **tidak dapat login** kembali
 *       - Relasi data (contracts, tasks, dll) tetap terjaga dan tidak terputus
 *       - User yang dinonaktifkan tidak akan muncul di list `GET /api/users`
 *       - Gunakan **`POST /api/users/{id}/restore`** untuk mengaktifkan kembali
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: User berhasil dinonaktifkan
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
router.get("/:id", authorize("superadmin", "owner"), controller.getById);
router.put(
  "/:id",
  authorize("superadmin"),
  updateRules,
  validate,
  controller.update,
);
router.delete("/:id", authorize("superadmin"), controller.remove);

/**
 * @swagger
 * /api/users/{id}/restore:
 *   post:
 *     tags: [Users]
 *     summary: Aktifkan kembali user yang dinonaktifkan
 *     description: |
 *       Memulihkan akun user yang sebelumnya dinonaktifkan.
 *       - User akan dapat login kembali setelah di-restore
 *       - Semua data dan relasi user tetap utuh — tidak ada yang hilang
 *       - Hanya **superadmin** yang dapat melakukan restore user
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: User berhasil diaktifkan kembali
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserProfile'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post("/:id/restore", authorize("superadmin"), controller.restore);

export default router;
