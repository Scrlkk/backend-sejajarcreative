import { Router } from "express";
import * as controller from "./analytics.controller.js";
import { recordRules, topContentsRules } from "./analytics.validation.js";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validate from "../../middlewares/validate.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/analytics/top:
 *   get:
 *     tags: [Analytics]
 *     summary: Top konten berdasarkan total views
 *     description: |
 *       Mengambil daftar konten dengan performa terbaik berdasarkan akumulasi data engagement.
 *       - Diurutkan berdasarkan `total_views` terbanyak, kemudian `total_likes` sebagai tiebreaker
 *       - Data diambil dari semua rekaman engagement yang pernah dicatat
 *       - Dapat difilter berdasarkan `contract_id` untuk melihat top konten per kontrak
 *       - Maksimal 50 item dapat ditampilkan dalam satu request
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 50 }
 *         description: Jumlah top konten yang ditampilkan (maks 50)
 *       - in: query
 *         name: contract_id
 *         schema: { type: integer }
 *         description: Filter berdasarkan kontrak
 *     responses:
 *       200:
 *         description: Data top konten berhasil diambil
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
 *                         $ref: '#/components/schemas/TopContent'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/top", topContentsRules, validate, controller.getTopContents);

/**
 * @swagger
 * /api/analytics/content/{contentId}:
 *   get:
 *     tags: [Analytics]
 *     summary: Riwayat engagement sebuah konten
 *     description: |
 *       Mengambil semua rekaman data engagement untuk konten tertentu.
 *       - Setiap baris mewakili satu sesi pencatatan engagement (likes dan views pada waktu tertentu)
 *       - Diurutkan dari rekaman terbaru (`recorded_at` DESC)
 *       - Untuk mendapatkan total akumulasi, gunakan **`GET /api/analytics/content/{contentId}/summary`**
 *       - Mendukung pagination via parameter `limit` dan `offset`
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema: { type: integer }
 *         description: ID konten
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - $ref: '#/components/parameters/OffsetQuery'
 *     responses:
 *       200:
 *         description: Riwayat engagement berhasil diambil
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
 *                         $ref: '#/components/schemas/Engagement'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/analytics/content/{contentId}/summary:
 *   get:
 *     tags: [Analytics]
 *     summary: Ringkasan total engagement sebuah konten
 *     description: |
 *       Mengambil data agregat (total) engagement untuk sebuah konten.
 *       - Mengembalikan `total_likes` dan `total_views` dari semua rekaman yang ada
 *       - Juga menyertakan `total_records`, `first_recorded`, dan `last_recorded`
 *       - Akan mengembalikan 404 jika belum ada rekaman engagement untuk konten ini
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema: { type: integer }
 *         description: ID konten
 *     responses:
 *       200:
 *         description: Ringkasan engagement berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/EngagementSummary'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/content/:contentId", controller.getByContent);
router.get("/content/:contentId/summary", controller.getSummary);

/**
 * @swagger
 * /api/analytics/engagements:
 *   post:
 *     tags: [Analytics]
 *     summary: Rekam data engagement konten
 *     description: |
 *       Mencatat data engagement (likes dan views) dari platform sosial media untuk sebuah konten.
 *       - Setiap pemanggilan endpoint ini akan **menambah satu baris rekaman baru** (bukan menggantikan data lama)
 *       - Nilai `likes` dan `views` tidak boleh negatif
 *       - `content_id` harus merujuk ke konten yang valid
 *       - Tersedia untuk: **superadmin**, **owner**, **admin_social_media**
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecordEngagementRequest'
 *     responses:
 *       201:
 *         description: Data engagement berhasil direkam
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Engagement'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/engagements",
  authorize("superadmin", "owner", "admin_social_media"),
  recordRules,
  validate,
  controller.record,
);

router.delete(
  "/content/:contentId",
  authorize("superadmin", "owner", "admin_social_media"),
  controller.deleteByContent,
);

export default router;
