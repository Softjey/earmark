// YouTube thumbnail (1280×720) for the final intro: render with `pnpm --dir video thumbnail`.
import { AbsoluteFill, Img, staticFile } from "remotion";
import { LogoMark } from "./components/Icons";
import { C, SANS } from "./theme";

const STROKE: React.CSSProperties = { WebkitTextStroke: "10px #000", paintOrder: "stroke fill" };

export function Thumbnail() {
  return (
    <AbsoluteFill style={{ background: "#0B1411", fontFamily: SANS }}>
      {/* the edited "sad" photo (media/sad-edit.py), credited in media/CREDITS.md */}
      <Img
        src={staticFile("v8/rl-happy-sad.jpg")}
        style={{ position: "absolute", left: -60, top: 0, height: 720, width: 760, objectFit: "cover", objectPosition: "50% 25%" }}
      />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(11,20,17,0) 30%, rgba(11,20,17,0.95) 56%, #0B1411 70%)" }} />
      <div style={{ position: "absolute", left: 560, right: 50, top: 70, color: "#fff", fontWeight: 700, lineHeight: 0.95, textTransform: "uppercase" }}>
        <div style={{ fontSize: 66, letterSpacing: -1, ...STROKE }}>Lewandowski</div>
        <div style={{ fontSize: 112, letterSpacing: -3, color: "#FF5A4E", ...STROKE }}>got</div>
        <div style={{ fontSize: 112, letterSpacing: -3, color: "#FF5A4E", ...STROKE }}>scammed</div>
        <div style={{ fontSize: 44, marginTop: 34, color: "#FFD60A", letterSpacing: -0.5, ...STROKE }}>We made it impossible.</div>
      </div>
      <div style={{ position: "absolute", right: 46, bottom: 40, display: "flex", alignItems: "center", gap: 14, background: "#fff", padding: "12px 22px", borderRadius: 16 }}>
        <LogoMark size={44} />
        <span style={{ fontSize: 40, fontWeight: 700, color: C.ink, letterSpacing: -1 }}>Earmark</span>
      </div>
      <div style={{ position: "absolute", left: 30, bottom: 34, background: "#FFD60A", color: "#000", fontWeight: 700, fontSize: 26, padding: "6px 16px", letterSpacing: 1 }}>
        500 000 zł · FAKE FUNDRAISER
      </div>
    </AbsoluteFill>
  );
}
