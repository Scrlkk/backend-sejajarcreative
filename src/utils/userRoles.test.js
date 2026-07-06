import { describe, it, expect, vi } from "vitest";
import {
  pickPrimaryRole,
  fetchRoleNamesByUserId,
  resolveRoleId,
} from "./userRoles";

describe("userRoles utilities", () => {
  describe("pickPrimaryRole", () => {
    it("should return null for empty roles list", () => {
      expect(pickPrimaryRole([])).toBeNull();
      expect(pickPrimaryRole(null)).toBeNull();
    });

    it("should pick priority role correctly", () => {
      expect(pickPrimaryRole(["script_writer", "owner"])).toBe("owner");
      expect(pickPrimaryRole(["content_editor", "superadmin"])).toBe("superadmin");
      expect(pickPrimaryRole(["admin_social_media", "script_writer"])).toBe("script_writer");
    });

    it("should fallback to the first role if none match priority list", () => {
      expect(pickPrimaryRole(["custom_role", "other_role"])).toBe("custom_role");
    });
  });

  describe("fetchRoleNamesByUserId", () => {
    it("should fetch role names and return them as an array", async () => {
      const mockDb = {
        query: vi.fn().mockResolvedValue({
          rows: [{ role_name: "admin" }, { role_name: "editor" }],
        }),
      };

      const result = await fetchRoleNamesByUserId(1, mockDb);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT r.role_name"),
        [1]
      );
      expect(result).toEqual(["admin", "editor"]);
    });
  });

  describe("resolveRoleId", () => {
    it("should return the id of the resolved role", async () => {
      const mockDb = {
        query: vi.fn().mockResolvedValue({
          rows: [{ id: 5 }],
        }),
      };

      const result = await resolveRoleId("superadmin", mockDb);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT id FROM core.roles"),
        ["superadmin"]
      );
      expect(result).toBe(5);
    });

    it("should return null if role is not found", async () => {
      const mockDb = {
        query: vi.fn().mockResolvedValue({
          rows: [],
        }),
      };

      const result = await resolveRoleId("unknown", mockDb);
      expect(result).toBeNull();
    });
  });
});
