import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "white",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24">
          <circle cx="8" cy="12" r="5.5" fill="#1a1a1a" />
          <circle
            cx="16"
            cy="12"
            r="5.5"
            fill="#cbf74f"
            stroke="#1a1a1a"
            strokeWidth="1"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
