import { Router } from "express";
import * as controller from "./content-types.controller.js";
import { createRules, updateRules } from "./content-types.validation.js";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validate from "../../middlewares/validate.js";

const router = Router();

/**
 * @swagger
 * /api/content-categories:
 *   get:
 *     tags: ["Content Categories"]
 *     summary: List semua content type
 *     description: |
 *       Mengambil daftar semua jenis konten yang tersedia di sistem.
 *       - Endpoint ini **tidak memerlukan autentikasi** (publik)
 *       - Digunakan saat membuat konten baru untuk memilih jenis kontennya
 *       - Contoh jenis konten: Reels, Feed Photo, Story, Carousel, Thread, dll
 *       - Mendukung pagination via parameter `limit` dan `offset`
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - $ref: '#/components/parameters/OffsetQuery'
 *     responses:
 *       200:
 *         description: Daftar content type berhasil diambil
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
 *                         $ref: '#/components/schemas/ContentCategory'
 *   post:
 *     tags: ["Content Categories"]
 *     summary: Tambah content type baru
 *     description: |
 *       Mendaftarkan jenis konten baru ke dalam sistem.
 *       - `type_name` harus unik — tidak boleh duplikat dengan content type yang sudah ada
 *       - Hanya **superadmin** dan **owner** yang dapat menambah content type baru
 *       - Content type yang ditambahkan akan tersedia untuk dipilih saat membuat konten
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateContentCategoryRequest'
 *     responses:
 *       201:
 *         description: Content type berhasil ditambahkan
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ContentCategory'
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
  authorize("superadmin", "owner", "content_lead"),
  createRules,
  validate,
  controller.create,
);

/**
 * @swagger
 * /api/content-categories/{id}:
 *   get:
 *     tags: ["Content Categories"]
 *     summary: Detail content type
 *     description: |
 *       Mengambil data satu jenis konten berdasarkan ID-nya.
 *       - Endpoint ini **tidak memerlukan autentikasi** (publik)
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Data content type berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ContentCategory'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: ["Content Categories"]
 *     summary: Update nama content type
 *     description: |
 *       Memperbarui nama jenis konten yang ada.
 *       - `type_name` yang baru harus tetap unik
 *       - Hanya **superadmin** dan **owner** yang dapat mengubah content type
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateContentCategoryRequest'
 *     responses:
 *       200:
 *         description: Content type berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ContentCategory'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *   delete:
 *     tags: ["Content Categories"]
 *     summary: Hapus content type (Hard Delete)
 *     description: |
 *       Menghapus jenis konten secara permanen dari database.
 *       - Content type yang dihapus **tidak dapat dipulihkan**
 *       - Pastikan tidak ada konten aktif yang menggunakan content type ini sebelum dihapus
 *       - Hanya **superadmin** dan **owner** yang dapat menghapus content type
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Content type berhasil dihapus
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
  authorize("superadmin", "owner", "content_lead"),
  updateRules,
  validate,
  controller.update,
);
router.delete(
  "/:id",
  authenticate,
  authorize("superadmin", "owner", "content_lead"),
  controller.remove,
);

export default router;
