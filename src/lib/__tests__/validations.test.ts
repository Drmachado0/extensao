import { describe, it, expect } from "vitest";
import { usernameSchema, hashtagSchema, commentSchema, dailyLimitSchema } from "../validations";

describe("Validations", () => {
  describe("usernameSchema", () => {
    it("should accept valid usernames", () => {
      expect(usernameSchema.safeParse("testuser").success).toBe(true);
      expect(usernameSchema.safeParse("test_user").success).toBe(true);
      expect(usernameSchema.safeParse("test.user").success).toBe(true);
    });

    it("should reject invalid usernames", () => {
      expect(usernameSchema.safeParse("").success).toBe(false);
      expect(usernameSchema.safeParse("a".repeat(31)).success).toBe(false);
      expect(usernameSchema.safeParse("test@user").success).toBe(false);
      expect(usernameSchema.safeParse(".test").success).toBe(false);
      expect(usernameSchema.safeParse("test.").success).toBe(false);
    });
  });

  describe("hashtagSchema", () => {
    it("should accept valid hashtags", () => {
      expect(hashtagSchema.safeParse("test").success).toBe(true);
      expect(hashtagSchema.safeParse("#test").success).toBe(true);
      expect(hashtagSchema.safeParse("test123").success).toBe(true);
    });

    it("should add # prefix if missing", () => {
      const result = hashtagSchema.safeParse("test");
      if (result.success) {
        expect(result.data).toBe("#test");
      }
    });

    it("should reject invalid hashtags", () => {
      expect(hashtagSchema.safeParse("").success).toBe(false);
      expect(hashtagSchema.safeParse("test#").success).toBe(false);
      expect(hashtagSchema.safeParse("test@").success).toBe(false);
    });
  });

  describe("commentSchema", () => {
    it("should accept valid comments", () => {
      expect(commentSchema.safeParse("Nice post!").success).toBe(true);
      expect(commentSchema.safeParse("a").success).toBe(true);
    });

    it("should reject empty or too long comments", () => {
      expect(commentSchema.safeParse("").success).toBe(false);
      expect(commentSchema.safeParse("   ").success).toBe(false);
      expect(commentSchema.safeParse("a".repeat(2201)).success).toBe(false);
    });
  });

  describe("dailyLimitSchema", () => {
    it("should accept valid limits", () => {
      expect(dailyLimitSchema.safeParse(0).success).toBe(true);
      expect(dailyLimitSchema.safeParse(100).success).toBe(true);
      expect(dailyLimitSchema.safeParse(1000).success).toBe(true);
    });

    it("should reject invalid limits", () => {
      expect(dailyLimitSchema.safeParse(-1).success).toBe(false);
      expect(dailyLimitSchema.safeParse(1001).success).toBe(false);
      expect(dailyLimitSchema.safeParse(1.5).success).toBe(false);
    });
  });
});
