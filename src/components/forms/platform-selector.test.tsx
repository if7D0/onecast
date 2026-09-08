// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlatformSelector } from "./platform-selector";
import type { Platform } from "@/types/generation";

describe("PlatformSelector", () => {
  it("klik teks kartu ikut toggle (bukan cuma kotak kecil)", () => {
    const onChange = vi.fn();
    render(<PlatformSelector selected={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText("X (Twitter)"));
    expect(onChange).toHaveBeenCalledWith(["twitter"]);
  });

  it("klik kartu terpilih menghapusnya (bisa kosong)", () => {
    const onChange = vi.fn();
    render(<PlatformSelector selected={["twitter"]} onChange={onChange} />);
    fireEvent.click(screen.getByText("X (Twitter)"));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("menandai kartu terpilih dan sisanya tidak", () => {
    const selected: Platform[] = ["linkedin"];
    const { container } = render(<PlatformSelector selected={selected} onChange={() => {}} />);
    const boxes = container.querySelectorAll('[role="checkbox"]');
    expect(boxes).toHaveLength(4);
    expect(boxes[1].getAttribute("aria-checked")).toBe("true");
    expect(boxes[0].getAttribute("aria-checked")).toBe("false");
  });
});
