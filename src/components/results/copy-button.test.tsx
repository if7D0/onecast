// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CopyButton } from "./copy-button";

const writeText = vi.fn();

function mockClipboard(ok: boolean) {
  writeText.mockReset();
  writeText.mockImplementation(() =>
    ok ? Promise.resolve() : Promise.reject(new Error("denied"))
  );
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
}

describe("CopyButton", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("menampilkan status Disalin setelah copy sukses", async () => {
    mockClipboard(true);
    render(<CopyButton text="halo" />);
    fireEvent.click(screen.getByRole("button", { name: /salin/i }));
    expect(await screen.findByText("Disalin")).toBeDefined();
    expect(writeText).toHaveBeenCalledWith("halo");
  });

  it("tetap Salin bila clipboard gagal total", async () => {
    mockClipboard(false);
    // Matikan fallback execCommand agar jalur gagal total teruji.
    const exec = document.execCommand;
    // execCommand deprecated tapi masih ada di tipe DOM — override sementara.
    document.execCommand = () => false;
    render(<CopyButton text="halo" />);
    fireEvent.click(screen.getByRole("button", { name: /salin/i }));
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText("Disalin")).toBeNull();
    document.execCommand = exec;
  });
});
