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
 *     summary: List semua portfolio
 *     description: Endpoint publik — tidak memerlukan autentikasi.
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
 *       Hanya konten dengan status **published** yang dapat ditambahkan ke portfolio.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePortfolioRequest'
 *     responses:
 *       201:
 *         description: Portfolio item berhasil ditambahkan
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
 *         description: Konten belum berstatus published
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
 *     description: Endpoint publik — tidak memerlukan autentikasi.
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
 *         description: Portfolio berhasil diperbarui
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
 *   delete:
 *     tags: [Portfolio]
 *     summary: Hapus portfolio item
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Portfolio item berhasil dihapus
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
