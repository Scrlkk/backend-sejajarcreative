import { describe, it, expect } from "vitest";
import { paginate, buildWhereClause } from "./pagination";

describe("pagination utilities", () => {
  describe("paginate", () => {
    it("should return default limit 20 and offset 0", () => {
      const res = paginate({});
      expect(res.limit).toBe(20);
      expect(res.offset).toBe(0);
    });

    it("should clamp limit between 1 and 100", () => {
      expect(paginate({ limit: -1 }).limit).toBe(1);
      expect(paginate({ limit: 0 }).limit).toBe(20);
      expect(paginate({ limit: 150 }).limit).toBe(100);
      expect(paginate({ limit: 50 }).limit).toBe(50);
    });

    it("should parse string values correctly", () => {
      const res = paginate({ limit: "30", offset: "10" });
      expect(res.limit).toBe(30);
      expect(res.offset).toBe(10);
    });
  });

  describe("buildWhereClause", () => {
    it("should build empty where clause when no filters provided", () => {
      const { whereClause, params } = buildWhereClause({}, { category: true });
      expect(whereClause).toBe("");
      expect(params).toEqual([]);
    });

    it("should ignore unallowed filters", () => {
      const { whereClause, params } = buildWhereClause({ evil: "hack" }, { category: true });
      expect(whereClause).toBe("");
      expect(params).toEqual([]);
    });

    it("should build equality condition correctly", () => {
      const { whereClause, params } = buildWhereClause(
        { category: "social" },
        { category: true }
      );
      expect(whereClause).toBe("WHERE category = $1");
      expect(params).toEqual(["social"]);
    });

    it("should build IN condition correctly", () => {
      const { whereClause, params } = buildWhereClause(
        { status: ["draft", "review"] },
        { status: true }
      );
      expect(whereClause).toBe("WHERE status IN ($1,$2)");
      expect(params).toEqual(["draft", "review"]);
    });

    it("should build range query correctly", () => {
      const { whereClause, params } = buildWhereClause(
        { age: { $gte: 18, $lte: 30 } },
        { age: true }
      );
      expect(whereClause).toBe("WHERE age >= $1 AND age <= $2");
      expect(params).toEqual([18, 30]);
    });
  });
});
