// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CONTENT_MAX, ContentInput } from "./content-input";

describe("ContentInput", () => {
  it("menampilkan counter karakter", () => {
    render(<ContentInput value="halo" onChange={() => {}} />);
    expect(screen.getByText(`4/${CONTENT_MAX}`)).toBeDefined();
  });

  it("memotong input textarea ke batas maksimal", () => {
    const onChange = vi.fn();
    render(<ContentInput value="" onChange={onChange} />);
    const area = screen.getByLabelText("Konten sumber");
    fireEvent.change(area, { target: { value: "x".repeat(CONTENT_MAX + 100) } });
    expect(onChange).toHaveBeenCalledWith("x".repeat(CONTENT_MAX));
  });

  it("menolak tipe file selain .txt/.md", () => {
    const onChange = vi.fn();
    render(<ContentInput value="" onChange={onChange} />);
    const input = document.getElementById("content-file") as HTMLInputElement;
    const file = new File(["x"], "dokumen.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByRole("alert").textContent).toMatch(/\.txt/);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("menolak file lebih dari 200 KB", () => {
    const onChange = vi.fn();
    render(<ContentInput value="" onChange={onChange} />);
    const input = document.getElementById("content-file") as HTMLInputElement;
    const file = new File(["x".repeat(200 * 1024 + 1)], "besar.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByRole("alert").textContent).toMatch(/200 KB/);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("membaca file .txt valid ke konten", async () => {
    const onChange = vi.fn();
    render(<ContentInput value="" onChange={onChange} />);
    const input = document.getElementById("content-file") as HTMLInputElement;
    const file = new File(["isi dari file"], "catatan.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith("isi dari file"));
    expect(screen.getByText("catatan.txt")).toBeDefined();
  });
});
