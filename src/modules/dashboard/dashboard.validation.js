import { query, param } from "express-validator";
import { ALL_CHART_METRICS } from "./dashboard.charts.router.js";
import { WIDGET_NAMES } from "./dashboard.widgets.service.js";

export const chartsRules = [
  query("metric")
    .notEmpty()
    .withMessage("Parameter metric wajib diisi")
    .isIn(ALL_CHART_METRICS)
    .withMessage(`Metric harus salah satu dari: ${ALL_CHART_METRICS.join(", ")}`),
  query("from")
    .optional()
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage("Format from harus YYYY-MM-DD"),
  query("to")
    .optional()
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage("Format to harus YYYY-MM-DD"),
  query("limit").optional().isInt({ min: 1, max: 100 }),
];

export const widgetRules = [
  param("name")
    .isIn(WIDGET_NAMES)
    .withMessage(`Widget harus salah satu dari: ${WIDGET_NAMES.join(", ")}`),
  query("limit").optional().isInt({ min: 1, max: 50 }),
  query("month")
    .optional()
    .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
    .withMessage("Format month harus YYYY-MM dengan bulan 01-12 (contoh: 2026-06)"),
];

export { ALL_CHART_METRICS as CHART_METRICS };
