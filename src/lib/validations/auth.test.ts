import { describe, expect, it } from "vitest";
import { loginSchema, NAME_MAX, PASSWORD_MAX, PASSWORD_MIN, registerSchema } from "./auth";

describe("loginSchema", () => {
  it("menerima email + password valid", () => {
    expect(
      loginSchema.safeParse({ email: "user@example.com", password: "rahasia123" }).success
    ).toBe(true);
  });

  it("menolak email tidak valid dan password kosong", () => {
    expect(loginSchema.safeParse({ email: "bukan-email", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });

  it("menolak password melebihi batas bcrypt (72)", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.co", password: "x".repeat(PASSWORD_MAX + 1) }).success
    ).toBe(false);
    expect(
      loginSchema.safeParse({ email: "a@b.co", password: "x".repeat(PASSWORD_MAX) }).success
    ).toBe(true);
  });
});

describe("registerSchema", () => {
  const valid = {
    name: "Tester",
    email: "t@example.com",
    password: "r".repeat(PASSWORD_MIN),
    confirmPassword: "r".repeat(PASSWORD_MIN),
  };

  it("menerima data valid", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("menolak konfirmasi berbeda", () => {
    expect(registerSchema.safeParse({ ...valid, confirmPassword: "beda1234" }).success).toBe(false);
  });

  it("menolak password pendek dan nama kepanjangan", () => {
    expect(
      registerSchema.safeParse({ ...valid, password: "x", confirmPassword: "x" }).success
    ).toBe(false);
    expect(registerSchema.safeParse({ ...valid, name: "n".repeat(NAME_MAX + 1) }).success).toBe(
      false
    );
  });
});
