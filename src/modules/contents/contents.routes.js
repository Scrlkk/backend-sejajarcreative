import { Router } from "express";
import * as controller from "./contents.controller.js";
import { createRules, updateRules } from "./contents.validation.js";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validate from "../../middlewares/validate.js";

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
 *       - Dapat difilter berdasarkan `contract_id`, `status`, dan/atau `content_type_id`
 *       - Hanya menampilkan konten yang belum dihapus (`deleted_at IS NULL`)
 *       - Response menyertakan daftar platform yang terkait (`platforms[]`)
 *       - Diurutkan berdasarkan `publish_date` terdekat (ASC, null di akhir)
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
 *         name: content_type_id
 *         schema: { type: integer }
 *         description: Filter berdasarkan jenis konten
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
 *       - `contract_id` dan `content_type_id` harus merujuk ke data yang valid
 *       - Field `platform_ids` opsional — berisi array ID platform yang ditargetkan
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
 *       - Response menyertakan `platforms[]`, `contract_name`, dan `type_name`
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
 *       - Field `platform_ids` jika dikirim akan **menggantikan** semua platform sebelumnya
 *       - Perubahan `status` mengikuti alur: `draft → in_review → approved → published`
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
 *       - Relasi data (tasks, task_assignments, reviews, analytics) tetap terjaga
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

export default router;
