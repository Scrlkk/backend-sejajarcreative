import AppError from "#utils/AppError.js";
import { resolvePrimaryRole } from "./dashboard.helpers.js";
import { getReviewsListWidget } from "./dashboard.content-lead.service.js";
import * as staffService from "./dashboard.staff.service.js";
import * as phase6Service from "./dashboard.phase6.service.js";

const WIDGET_ACCESS = {
  "reviews-list": ["content_lead", "superadmin"],
  "upcoming-deadlines": ["script_writer", "content_editor", "admin_social_media", "superadmin"],
  "recent-comments": ["content_lead", "script_writer", "content_editor", "admin_social_media", "superadmin"],
  "pillars_usage": ["script_writer", "superadmin"],
  "latest-tasks": ["content_editor", "superadmin"],
  "tasks-by-status": ["content_editor", "admin_social_media", "superadmin"],
  "tasks-title-priority": ["content_editor", "superadmin"],
  "calendar": ["superadmin", "owner", "content_lead", "script_writer", "content_editor", "admin_social_media"],
  "system-logs-summary": ["superadmin", "owner"],
};

export const getWidget = async (user, name, query = {}) => {
  const role = resolvePrimaryRole(user, query.role);
  const allowed = WIDGET_ACCESS[name];

  if (!allowed) {
    throw new AppError(`Widget "${name}" tidak dikenali`, 404);
  }

  if (!allowed.includes(role)) {
    throw new AppError(
      `Widget "${name}" tidak tersedia untuk role "${role}"`,
      403,
    );
  }

  switch (name) {
    case "reviews-list":
      return getReviewsListWidget(role === "superadmin" ? null : user.id, query);
    case "upcoming-deadlines":
      // superadmin: null → lihat semua task; staff: userId → task miliknya
      return staffService.getUpcomingDeadlinesWidget(
        role === "superadmin" ? null : user.id,
        query
      );
    case "recent-comments":
      return staffService.getRecentCommentsWidget(
        (role === "superadmin" || role === "content_lead") ? null : user.id,
        query
      );
    case "pillars_usage":
      return staffService.getPillarsUsageWidget(
        role === "superadmin" ? null : user.id
      );
    case "latest-tasks":
      return staffService.getLatestTasksWidget(
        role === "superadmin" ? null : user.id,
        query
      );
    case "tasks-by-status":
      return staffService.getTasksByStatusWidget(
        role === "superadmin" ? null : user.id
      );
    case "tasks-title-priority":
      return staffService.getTasksTitlePriorityWidget(
        role === "superadmin" ? null : user.id,
        query
      );
    case "calendar":
      return phase6Service.getCalendarWidget(role, user.id, query);
    case "system-logs-summary":
      return phase6Service.getSystemLogsSummaryWidget();
    default:
      throw new AppError(`Widget "${name}" belum diimplementasi`, 501);
  }
};

export const WIDGET_NAMES = Object.keys(WIDGET_ACCESS);
