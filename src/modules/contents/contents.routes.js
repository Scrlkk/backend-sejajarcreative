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
 *     parameters:
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - $ref: '#/components/parameters/OffsetQuery'
 *       - in: query
 *         name: project_id
 *         schema: { type: integer }
 *         description: Filter berdasarkan project
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/ContentStatus'
 *         description: Filter berdasarkan status konten
 *       - in: query
 *         name: pillar_id
 *         schema: { type: integer }
 *         description: Filter berdasarkan content pillar
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
 *   delete:
 *     tags: [Contents]
 *     summary: Hapus konten
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
