import { Router } from "express";
import * as controller from "./contents.controller.js";
import { createRules, updateRules } from "./contents.validation.js";
import authenticate from "#middlewares/authenticate.js";
import authorize from "#middlewares/authorize.js";
import validate from "#middlewares/validate.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/contents:
 *   get:
 *     tags: [Contents]
 *     summary: List semua konten
 *     description: |
 *       Mengambil daftar konten berdasarkan filter yang diberikan.
 *       - Dapat difilter berdasarkan `contract_id`, `status`, `platform_id`, `content_category_id`, `pillar_id`, dan/atau `priority`
 *       - Hanya menampilkan konten yang belum dihapus (`deleted_at IS NULL` dan `is_active = true`)
 *       - Secara default, jika `contract_id` tidak dikirim, konten dari kontrak yang terhapus/tidak aktif akan otomatis disembunyikan.
 *       - Jika `contract_id` dikirim (untuk tracking), konten dari kontrak tersebut tetap ditampilkan meskipun kontrak induknya sudah tidak aktif.
 *       - Response menyertakan `platform_name`, `category_name`, `pillar_name`, `contract_name`, `contract_code`
 *       - Diurutkan berdasarkan `due_date` terdekat (ASC, null di akhir)
 *       - Mendukung pagination via parameter `limit` dan `offset`
 *     parameters:
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - $ref: '#/components/parameters/OffsetQuery'
 *       - in: query
 *         name: contract_id
 *         schema: { type: integer }
 *         description: Filter berdasarkan kontrak
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/ContentStatus'
 *         description: Filter berdasarkan status konten
 *       - in: query
 *         name: platform_id
 *         schema: { type: integer }
 *         description: Filter berdasarkan platform
 *       - in: query
 *         name: content_category_id
 *         schema: { type: integer }
 *         description: Filter berdasarkan kategori konten
 *       - in: query
 *         name: pillar_id
 *         schema: { type: integer }
 *         description: Filter berdasarkan pillar
 *       - in: query
 *         name: priority
 *         schema:
 *           $ref: '#/components/schemas/ContentPriority'
 *         description: Filter berdasarkan prioritas
 *     responses:
 *       200:
 *         description: Daftar konten berhasil diambil
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
 *                         $ref: '#/components/schemas/Content'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags: [Contents]
 *     summary: Buat konten baru
 *     description: |
 *       Membuat konten baru yang dikaitkan ke kontrak tertentu.
 *       - `contract_id`, `platform_id`, `content_category_id`, dan `pillar_id` harus merujuk ke data yang valid
 *       - Status awal konten adalah **draft**
 *       - Tersedia untuk: **superadmin**, **owner**, **content_lead**, **content_editor**, **script_writer**
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateContentRequest'
 *     responses:
 *       201:
 *         description: Konten berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Content'
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
  authorize(
    "superadmin",
    "owner",
    "content_lead",
    "content_editor",
    "script_writer",
  ),
  createRules,
  validate,
  controller.create,
);

/**
 * @swagger
 * /api/contents/{id}:
 *   get:
 *     tags: [Contents]
 *     summary: Detail konten
 *     description: |
 *       Mengambil data lengkap satu konten beserta platform dan informasi kontrak terkait.
 *       - Response menyertakan `platform_name`, `category_name`, `pillar_name`, `contract_name`, `contract_code`
 *       - Hanya konten yang belum dihapus yang dapat diakses
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Data konten berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Content'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Contents]
 *     summary: Update konten
 *     description: |
 *       Memperbarui data konten yang ada.
 *       - Field yang tidak dikirim **tidak akan diubah** (partial update)
 *       - Perubahan `status` mengikuti alur workflow konten
 *       - Untuk publish konten yang sudah approved, gunakan **`PATCH /api/contents/{id}/publish`**
 *       - Tersedia untuk: **superadmin**, **owner**, **content_lead**, **content_editor**, **script_writer**
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateContentRequest'
 *     responses:
 *       200:
 *         description: Konten berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Content'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *   delete:
 *     tags: [Contents]
 *     summary: Hapus konten (Soft Delete)
 *     description: |
 *       Menonaktifkan konten tanpa menghapus datanya dari database.
 *       - Data konten tetap tersimpan untuk keperluan audit trail
 *       - Relasi data (tasks, task_outputs, task_comments, reviews, analytics) tetap terjaga
 *       - Konten yang dihapus tidak akan muncul di list `GET /api/contents`
 *       - Tersedia untuk: **superadmin**, **owner**, **content_lead**
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Konten berhasil dihapus
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

/**
 * @swagger
 * /api/contents/{id}/publish:
 *   patch:
 *     tags: [Contents]
 *     summary: Publish konten yang sudah approved
 *     description: |
 *       Mengubah status konten menjadi **published** dan mencatat waktu publish.
 *       - Konten **wajib berstatus `approved`** sebelum dapat dipublish
 *       - Field `published_at` diisi otomatis dengan waktu saat ini (tidak bisa di-overwrite)
 *       - Konten yang sudah published tidak dapat dikembalikan ke status sebelumnya melalui endpoint ini
 *       - Tersedia untuk: **superadmin**, **owner**, **content_lead**, **admin_social_media**
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Konten berhasil dipublish
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Content'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         description: Konten belum berstatus approved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/:id/publish",
  authorize("superadmin", "owner", "content_lead", "admin_social_media"),
  controller.publish,
);

router.get("/:id", controller.getById);
router.put(
  "/:id",
  authorize(
    "superadmin",
    "owner",
    "content_lead",
    "content_editor",
    "script_writer",
    "admin_social_media",
  ),
  updateRules,
  validate,
  controller.update,
);
router.delete(
  "/:id",
  authorize("superadmin", "owner", "content_lead"),
  controller.remove,
);
router.post(
  "/:id/restore",
  authorize("superadmin", "owner", "content_lead"),
  controller.restore,
);

export default router;
