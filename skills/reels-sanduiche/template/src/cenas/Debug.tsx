import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Sanduiche } from "../lib/Sanduiche";
import { Clip, Ponto, useClip, useTracking } from "../lib/tracking";

const PONTOS: Ponto[] = [
  "nose", "forehead", "chin", "leftShoulder", "rightShoulder", "leftElbow", "rightElbow",
  "leftWrist", "rightWrist", "leftIndex", "rightIndex",
];

const Marca: React.FC<{ p: Ponto }> = ({ p }) => {
  const t = useTracking(p);
  return (
    <div style={{ position: "absolute", left: t.x - 10, top: t.y - 10, width: 20, height: 20,
      borderRadius: 10, background: t.visivel > 0.5 ? "#8C82F2" : "#ff4d4d", border: "3px solid white" }}>
      <span style={{ position: "absolute", left: 26, top: -6, color: "white", font: "600 22px sans-serif",
        textShadow: "0 1px 4px #000" }}>{p}</span>
    </div>
  );
};

const Info = () => {
  const frame = useCurrentFrame();
  const { offset } = useClip();
  return <div style={{ position: "absolute", left: 30, top: 30, color: "white", font: "700 36px monospace",
    textShadow: "0 2px 6px #000" }}>frame origem {frame + offset}</div>;
};

/** Vídeo inteiro com o fundo escurecido atrás da pessoa + landmarks: valida matte e tracking. */
export const Debug: React.FC<{ clip: string }> = ({ clip }) => (
  <Clip clip={clip}>
    <Sanduiche
      atras={<AbsoluteFill style={{ background: "rgba(20,10,60,0.75)" }} />}
      frente={<AbsoluteFill>{PONTOS.map((p) => <Marca key={p} p={p} />)}</AbsoluteFill>}
      hud={<Info />}
    />
  </Clip>
);
