import { ImageResponse } from "next/og";
import { APP_NAME, PARENT_BRAND } from "@/lib/config";

export const alt = `${APP_NAME}: the brand-deal CRM for small creators`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COLS = ["Pitched", "Negotiating", "Signed", "Delivered", "Paid"];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #0b0d13 0%, #1a1326 60%, #3a1608 100%)",
          color: "#f4efe4",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 40, fontWeight: 800 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#f4efe4", display: "flex" }} />
          <span>
            {APP_NAME}
            <span style={{ color: "#ff6b35" }}>.</span>
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1.02, letterSpacing: -3, display: "flex", flexWrap: "wrap" }}>
            Stop losing track of your&nbsp;<span style={{ color: "#ff8d5f" }}>brand deals.</span>
          </div>
          <div style={{ marginTop: 28, fontSize: 32, color: "#a8aebb", display: "flex" }}>
            Pitch to paid, deadlines, overdue alerts. Free for 3 deals.
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {COLS.map((c, i) => (
            <div
              key={c}
              style={{
                display: "flex",
                padding: "10px 22px",
                borderRadius: 999,
                fontSize: 24,
                fontWeight: 700,
                background: i === 4 ? "#2ed19a" : "rgba(255,255,255,0.1)",
                color: i === 4 ? "#0b0d13" : "#f4efe4",
              }}
            >
              {c}
            </div>
          ))}
          <div style={{ marginLeft: "auto", fontSize: 24, color: "#a8aebb", display: "flex" }}>A {PARENT_BRAND} product</div>
        </div>
      </div>
    ),
    size,
  );
}
