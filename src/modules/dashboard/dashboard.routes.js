import { Router } from "express";
import * as controller from "./dashboard.controller.js";
import { chartsRules, widgetRules } from "./dashboard.validation.js";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validate from "../../middlewares/validate.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Ringkasan KPI dashboard (per role)
 *     description: |
 *       Mengembalikan kartu metric dashboard berdasarkan role user yang login.
 *       - **superadmin:** total user, user online, breakdown role (tanpa superadmin), session aktif
 *       - **owner:** kontrak aktif, revenue, user (exclude superadmin/owner), konten published, client total
 *       - **content_lead:** kontrak aktif, total konten, konten on_progress & published
 *       - Role lain akan ditambahkan di fase berikutnya
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary dashboard
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DashboardSummary'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       501:
 *         description: Role belum didukung
 */
router.get("/summary", controller.getSummary);

/**
 * @swagger
 * /api/dashboard/system:
 *   get:
 *     tags: [Dashboard]
 *     summary: Metric sistem (superadmin)
 *     description: |
 *       Uptime server, penggunaan storage upload, dan statistik session.
 *       - Storage dihitung dari folder `UPLOAD_DIR`
 *       - Limit dari env `STORAGE_LIMIT_MB` (default 2048 MB)
 *       - Hanya **superadmin**
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System metrics
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DashboardSystem'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/system", authorize("superadmin"), controller.getSystem);

/**
 * @swagger
 * /api/dashboard/charts:
 *   get:
 *     tags: [Dashboard]
 *     summary: Data grafik dashboard (per role)
 *     description: |
 *       Mengembalikan data agregat untuk grafik dashboard.
 *       - Akses metric dicek per role (403 jika metric tidak sesuai role)
 *       - Parameter `metric` wajib
 *       - Parameter `from` dan `to` (YYYY-MM-DD) opsional, default 30 hari terakhir
 *
 *       **Metric owner / superadmin:**
 *       - `engagement`, `contracts_revenue`, `contracts_by_status`, `users_by_tasks`
 *       - `clients_total`, `clients_new`, `clients_by_active_contracts`, `clients_by_completed_contracts`
 *
 *       **Metric content_lead / superadmin:**
 *       - `content_timeline` — status + created_at
 *       - `content_by_status_date` — agregat konten per status & tanggal
 *       - `pillars_usage` — pillar paling dipakai (donut chart)
 *
 *       **Metric script_writer / content_editor / admin_social_media / superadmin:**
 *       - `tasks_by_status` — count task per status milik user login
 *       - `comments_revision` — komentar terbaru pada task berstatus revision (script_writer & content_editor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: metric
 *         required: true
 *         schema:
 *           type: string
 *           enum:
 *             - engagement
 *             - contracts_revenue
 *             - contracts_by_status
 *             - users_by_tasks
 *             - clients_total
 *             - clients_new
 *             - clients_by_active_contracts
 *             - clients_by_completed_contracts
 *             - content_timeline
 *             - content_by_status_date
 *             - pillars_usage
 *             - tasks_by_status
 *             - comments_revision
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Jumlah item (hanya berlaku untuk metric `comments_revision`)
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal awal (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal akhir (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Data chart
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       501:
 *         description: Role belum didukung
 */
router.get("/charts", chartsRules, validate, controller.getCharts);

/**
 * @swagger
 * /api/dashboard/widgets/{name}:
 *   get:
 *     tags: [Dashboard]
 *     summary: Widget dashboard (per role)
 *     description: |
 *       Mengembalikan data list widget dashboard.
 *       - `reviews-list` — review konten (content_lead, superadmin)
 *       - `upcoming-deadlines` — task mendekati deadline (script_writer, content_editor, admin_social_media, superadmin).
 *         **Termasuk task overdue** (deadline sudah lewat tapi belum selesai). superadmin melihat semua task tanpa filter assigned_to.
 *       - `recent-comments` — komentar terbaru (script_writer, content_editor, admin_social_media, superadmin).
 *         superadmin melihat semua komentar tanpa filter assigned_to.
 *       - `pillars_usage` — pillar usage user (script_writer, superadmin)
 *       - `latest-tasks` — task terbaru aktif (content_editor, superadmin)
 *       - `tasks-by-status` — task grouped by status (content_editor, admin_social_media, superadmin)
 *       - `tasks-title-priority` — title + priority task (content_editor, superadmin)
 *       - `calendar` — konten & task bulan ini, scope per role (semua role, `?month=YYYY-MM`)
 *       - `system-logs-summary` — ringkasan activity log + storage + session (superadmin, owner)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *           enum:
 *             - reviews-list
 *             - upcoming-deadlines
 *             - recent-comments
 *             - pillars_usage
 *             - latest-tasks
 *             - tasks-by-status
 *             - tasks-title-priority
 *             - calendar
 *             - system-logs-summary
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}$'
 *           example: '2026-06'
 *         description: Bulan kalender (YYYY-MM) — hanya untuk widget `calendar`
 *     responses:
 *       200:
 *         description: Data widget
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get("/widgets/:name", widgetRules, validate, controller.getWidget);

export default router;
