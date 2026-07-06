import { Router } from "express";
import * as controller from "./activity-logs.controller.js";
import { getAllRules } from "./activity-logs.validation.js";
import authenticate from "#middlewares/authenticate.js";
import authorize from "#middlewares/authorize.js";
import validate from "#middlewares/validate.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/activity-logs:
 *   get:
 *     tags: ["Activity Logs"]
 *     summary: List activity logs
 *     description: |
 *       Mengambil log aktivitas user di sistem.
 *       - Hanya dapat diakses oleh **superadmin** dan **owner**
 *       - Mendukung filter berdasarkan `user_id`, `action`, `table_name`, `record_id`
 *       - Mendukung pagination via `limit` dan `offset`
 *       - Action types: CREATE, UPDATE, DELETE, PUBLISH, LOGIN, LOGOUT
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - $ref: '#/components/parameters/OffsetQuery'
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE, PUBLISH, LOGIN, LOGOUT]
 *         description: Filter by action type
 *       - in: query
 *         name: table_name
 *         schema:
 *           type: string
 *         description: Filter by table name (e.g. core.contents, core.tasks)
 *       - in: query
 *         name: record_id
 *         schema:
 *           type: integer
 *         description: Filter by record ID
 *     responses:
 *       200:
 *         description: Daftar activity log
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
 *                         $ref: '#/components/schemas/ActivityLog'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  "/",
  authorize("superadmin", "owner"),
  getAllRules,
  validate,
  controller.getAll,
);

export default router;
