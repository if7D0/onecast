import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** OG generatif: kartu gelap + aksen, tanpa aset eksternal (self-contained). */
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 96,
        background: "#0a0a0f",
        color: "#fafafa",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignSelf: "flex-start",
          fontSize: 28,
          fontWeight: 700,
          color: "#22d3ee",
          marginBottom: 24,
        }}
      >
        Gratis &amp; open-source
      </div>
      <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.1 }}>
        Ubah satu konten jadi siap-post di semua platform
      </div>
      <div style={{ fontSize: 32, color: "#a1a1aa", marginTop: 24 }}>
        X • LinkedIn • Instagram • Newsletter — dalam &lt;5 menit
      </div>
    </div>,
    { ...size }
  );
}
