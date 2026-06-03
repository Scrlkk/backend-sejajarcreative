import { Router } from "express";
import * as controller from "./platforms.controller.js";
import { createRules, updateRules } from "./platforms.validation.js";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validate from "../../middlewares/validate.js";

const router = Router();

/**
 * @swagger
 * /api/platforms:
 *   get:
 *     tags: [Platforms]
 *     summary: List semua platform
 *     description: |
 *       Mengambil daftar semua platform sosial media yang tersedia di sistem.
 *       - Endpoint ini **tidak memerlukan autentikasi** (publik)
 *       - Digunakan saat membuat atau mengedit konten untuk memilih platform tujuan
 *       - Mendukung pagination via parameter `limit` dan `offset`
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - $ref: '#/components/parameters/OffsetQuery'
 *     responses:
 *       200:
 *         description: Daftar platform berhasil diambil
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
 *                         $ref: '#/components/schemas/Platform'
 *   post:
 *     tags: [Platforms]
 *     summary: Tambah platform baru
 *     description: |
 *       Mendaftarkan platform sosial media baru ke dalam sistem.
 *       - `platform_name` harus unik — tidak boleh duplikat dengan platform yang sudah ada
 *       - Hanya **superadmin** dan **owner** yang dapat menambah platform baru
 *       - Platform yang ditambahkan akan tersedia untuk dipilih saat membuat konten
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePlatformRequest'
 *     responses:
 *       201:
 *         description: Platform berhasil ditambahkan
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Platform'
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
  authenticate,
  authorize("superadmin", "owner"),
  createRules,
  validate,
  controller.create,
);

/**
 * @swagger
 * /api/platforms/{id}:
 *   get:
 *     tags: [Platforms]
 *     summary: Detail platform
 *     description: |
 *       Mengambil data satu platform berdasarkan ID-nya.
 *       - Endpoint ini **tidak memerlukan autentikasi** (publik)
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Data platform berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Platform'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Platforms]
 *     summary: Update nama platform
 *     description: |
 *       Memperbarui nama platform yang ada.
 *       - `platform_name` yang baru harus tetap unik
 *       - Hanya **superadmin** dan **owner** yang dapat mengubah platform
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePlatformRequest'
 *     responses:
 *       200:
 *         description: Platform berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Platform'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *   delete:
 *     tags: [Platforms]
 *     summary: Hapus platform (Hard Delete)
 *     description: |
 *       Menghapus platform secara permanen dari database.
 *       - Platform yang dihapus **tidak dapat dipulihkan**
 *       - Pastikan platform tidak lagi digunakan oleh konten aktif sebelum dihapus
 *       - Hanya **superadmin** dan **owner** yang dapat menghapus platform
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Platform berhasil dihapus
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
  authenticate,
  authorize("superadmin", "owner"),
  updateRules,
  validate,
  controller.update,
);
router.delete(
  "/:id",
  authenticate,
  authorize("superadmin", "owner"),
  controller.remove,
);

export default router;
