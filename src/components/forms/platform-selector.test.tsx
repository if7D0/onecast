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

  it("checkbox bisa difokus keyboard (tanpa tabindex -1)", () => {
    const { container } = render(<PlatformSelector selected={[]} onChange={() => {}} />);
    const boxes = container.querySelectorAll('[role="checkbox"]');
    for (const box of boxes) {
      expect(box.getAttribute("tabindex")).not.toBe("-1");
    }
  });

  it("aktivasi keyboard toggle tepat sekali (tanpa double-fire label)", () => {
    const onChange = vi.fn();
    const { container } = render(<PlatformSelector selected={[]} onChange={onChange} />);
    const box = container.querySelector('[role="checkbox"]') as HTMLElement;
    // e.detail === 0 meniru aktivasi keyboard (Enter/Space).
    fireEvent.click(box, { detail: 0 });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(["twitter"]);
  });
});
