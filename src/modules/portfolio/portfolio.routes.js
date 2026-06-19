import { Router } from "express";
import * as controller from "./portfolio.controller.js";
import { createRules, updateRules } from "./portfolio.validation.js";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validate from "../../middlewares/validate.js";

const router = Router();

/**
 * @swagger
 * /api/portfolio:
 *   get:
 *     tags: [Portfolio]
 *     summary: List semua portfolio item
 *     description: |
 *       Mengambil daftar konten yang dipajang di portfolio publik perusahaan.
 *       - Endpoint ini **tidak memerlukan autentikasi** (publik)
 *       - Dapat difilter berdasarkan `is_featured` untuk menampilkan hanya konten unggulan
 *       - Diurutkan berdasarkan `display_order` (ASC, null di akhir), kemudian `created_at` terbaru
 *       - Response menyertakan detail konten: `title`, `content_url`, `published_at`, `contract_name`, `category_name`
 *       - Mendukung pagination via parameter `limit` dan `offset`
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - $ref: '#/components/parameters/OffsetQuery'
 *       - in: query
 *         name: is_featured
 *         schema: { type: boolean }
 *         description: Filter hanya portfolio yang difeatured
 *     responses:
 *       200:
 *         description: Daftar portfolio berhasil diambil
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
 *                         $ref: '#/components/schemas/PortfolioItem'
 *   post:
 *     tags: [Portfolio]
 *     summary: Tambah konten ke portfolio
 *     description: |
 *       Menambahkan konten yang sudah dipublish ke dalam tampilan portfolio publik.
 *       - Konten **wajib berstatus `published`** sebelum dapat ditambahkan ke portfolio
 *       - Setiap konten hanya dapat muncul **satu kali** di portfolio (unique constraint)
 *       - Field `is_featured` menentukan apakah konten ditampilkan sebagai unggulan
 *       - Field `display_order` menentukan urutan tampil (angka kecil = lebih atas)
 *       - Hanya **superadmin** dan **owner** yang dapat mengelola portfolio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePortfolioRequest'
 *     responses:
 *       201:
 *         description: Konten berhasil ditambahkan ke portfolio
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PortfolioItem'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         description: Konten belum berstatus published atau sudah ada di portfolio
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 * /api/portfolio/{id}:
 *   get:
 *     tags: [Portfolio]
 *     summary: Detail portfolio item
 *     description: |
 *       Mengambil data lengkap satu portfolio item berdasarkan ID-nya.
 *       - Endpoint ini **tidak memerlukan autentikasi** (publik)
 *       - Response menyertakan detail konten terkait: `title`, `content_url`, `published_at`, `contract_name`
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Data portfolio berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PortfolioItem'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Portfolio]
 *     summary: Update portfolio item
 *     description: |
 *       Memperbarui pengaturan tampilan portfolio item.
 *       - Hanya field `is_featured` dan `display_order` yang dapat diubah
 *       - Konten yang ditampilkan (`content_id`) tidak dapat diganti — hapus dan buat item baru jika perlu
 *       - Hanya **superadmin** dan **owner** yang dapat mengelola portfolio
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePortfolioRequest'
 *     responses:
 *       200:
 *         description: Portfolio item berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PortfolioItem'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *   delete:
 *     tags: [Portfolio]
 *     summary: Hapus portfolio item (Hard Delete)
 *     description: |
 *       Menghapus konten dari tampilan portfolio secara permanen.
 *       - Hanya data **portfolio item** yang dihapus — konten asli tetap ada di database
 *       - Portfolio item yang dihapus **tidak dapat dipulihkan**
 *       - Untuk menambahkannya kembali, gunakan **`POST /api/portfolio`**
 *       - Hanya **superadmin** dan **owner** yang dapat menghapus portfolio item
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Portfolio item berhasil dihapus dari portfolio
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
