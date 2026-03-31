import { Router } from "express";
import * as controller from "./projects.controller.js";
import {
  createRules,
  updateRules,
  memberRules,
} from "./projects.validation.js";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validate from "../../middlewares/validate.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/projects:
 *   get:
 *     tags: [Projects]
 *     summary: List semua project
 *     parameters:
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - $ref: '#/components/parameters/OffsetQuery'
 *       - in: query
 *         name: client_id
 *         schema: { type: integer }
 *         description: Filter berdasarkan client
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/ProjectStatus'
 *         description: Filter berdasarkan status project
 *     responses:
 *       200:
 *         description: Daftar project berhasil diambil
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
 *                         $ref: '#/components/schemas/Project'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags: [Projects]
 *     summary: Buat project baru
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProjectRequest'
 *     responses:
 *       201:
 *         description: Project berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Project'
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
  authorize("superadmin", "owner"),
  createRules,
  validate,
  controller.create,
);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Detail project
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Data project berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Project'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Projects]
 *     summary: Update project
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProjectRequest'
 *     responses:
 *       200:
 *         description: Project berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Project'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Projects]
 *     summary: Hapus project
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Project berhasil dihapus
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
  authorize("superadmin", "owner"),
  updateRules,
  validate,
  controller.update,
);
router.delete("/:id", authorize("superadmin", "owner"), controller.remove);

/**
 * @swagger
 * /api/projects/{id}/members:
 *   get:
 *     tags: [Projects]
 *     summary: List anggota project
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Daftar anggota project berhasil diambil
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
 *                         $ref: '#/components/schemas/ProjectMember'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   post:
 *     tags: [Projects]
 *     summary: Tambah anggota ke project
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddMemberRequest'
 *     responses:
 *       201:
 *         description: Anggota berhasil ditambahkan
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ProjectMember'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 * /api/projects/{id}/members/{userId}:
 *   delete:
 *     tags: [Projects]
 *     summary: Hapus anggota dari project
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *         description: ID user yang akan dihapus dari project
 *     responses:
 *       200:
 *         description: Anggota berhasil dihapus
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
router.get("/:id/members", controller.getMembers);
router.post(
  "/:id/members",
  authorize("superadmin", "owner", "content_lead"),
  memberRules,
  validate,
  controller.addMember,
);
router.delete(
  "/:id/members/:userId",
  authorize("superadmin", "owner", "content_lead"),
  controller.removeMember,
);

export default router;
