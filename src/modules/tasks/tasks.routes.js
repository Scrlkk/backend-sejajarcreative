import { Router } from "express";
import * as controller from "./tasks.controller.js";
import { createRules, updateRules } from "./tasks.validation.js";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validate from "../../middlewares/validate.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: List semua task
 *     parameters:
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - $ref: '#/components/parameters/OffsetQuery'
 *       - in: query
 *         name: project_id
 *         schema: { type: integer }
 *         description: Filter berdasarkan project
 *       - in: query
 *         name: assigned_to
 *         schema: { type: integer }
 *         description: Filter berdasarkan user yang ditugaskan
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/TaskStatus'
 *         description: Filter berdasarkan status task
 *     responses:
 *       200:
 *         description: Daftar task berhasil diambil
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
 *                         $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags: [Tasks]
 *     summary: Buat task baru
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskRequest'
 *     responses:
 *       201:
 *         description: Task berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Task'
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
  authorize("superadmin", "owner", "content_lead"),
  createRules,
  validate,
  controller.create,
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Detail task
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Data task berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Tasks]
 *     summary: Update task / ubah status
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskRequest'
 *     responses:
 *       200:
 *         description: Task berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Tasks]
 *     summary: Hapus task
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Task berhasil dihapus
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
  authorize("superadmin", "owner", "content_lead"),
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
