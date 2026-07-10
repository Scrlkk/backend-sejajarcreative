import { describe, it, expect } from "vitest";
import { paginate } from "./pagination";

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
});
