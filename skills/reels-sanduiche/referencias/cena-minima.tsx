/**
 * Prompt de teste:
 * "Cena de 8s: título 'TÍTULO' em 3D surge atrás da pessoa no frame 30,
 *  uma esfera orbita a mão direita, no final a câmera dá um dolly in."
 */
import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Sanduiche } from "../lib/Sanduiche";
import { Palco, Texto3D, usePxToWorld, usePxUnit } from "../lib/three";
import { Clip, useTracking, useTrackingEm } from "../lib/tracking";
import { COR } from "../lib/tema";

const ROXO = COR.roxo;


export type CenaMinimaProps = { clip: string; inicio: number; transparente?: boolean };

const Titulo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const toWorld = usePxToWorld();
  const px = usePxUnit(-2);
  // âncora fixa: altura da testa no momento em que o título entra (não treme com a cabeça)
  const testa = useTrackingEm("forehead", 30);

  const s = spring({ frame: frame - 30, fps, config: { damping: 14, mass: 0.9 } });
  const [x, y, z] = toWorld(width / 2, testa.y + 40, -2);

  return (
    <group position={[x, y + (1 - s) * -3, z]} rotation={[(1 - s) * -1.2, Math.sin(frame / 45) * 0.12, 0]}>
      <Texto3D texto="TÍTULO" largura={width * 0.94 * px} profundidade={0.6} cor={ROXO} scale={0.6 + 0.4 * s} />
    </group>
  );
};

/** Esfera em órbita da mão. `lado` decide em qual camada ela aparece. */
const Orbita: React.FC<{ lado: "atras" | "frente" }> = ({ lado }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const toWorld = usePxToWorld();
  const px = usePxUnit(0);
  const mao = useTracking("rightWrist");
  const dedo = useTracking("rightIndex");

  // centro entre pulso e indicador (meio da mão)
  const [cx, cy] = toWorld((mao.x + dedo.x) / 2, (mao.y + dedo.y) / 2, 0);
  const a = (frame / 40) * Math.PI * 2;
  const r = 170 * px;
  const pos: [number, number, number] = [cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.3, Math.sin(a) * r];

  const entrada = spring({ frame: frame - 60, fps, config: { damping: 12 } });
  const vis = interpolate(mao.visivel, [0.3, 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const naFrente = pos[2] > 0;
  if ((lado === "frente") !== naFrente) return null;

  return (
    <mesh position={pos} scale={entrada * vis}>
      <sphereGeometry args={[40 * px, 48, 48]} />
      <meshStandardMaterial color={ROXO} emissive={ROXO} emissiveIntensity={0.25} metalness={0.5} roughness={0.15} />
    </mesh>
  );
};

/** Dolly in nos últimos 2s, centrado no rosto (âncora fixa p/ não tremer). */
const useDolly = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const ini = durationInFrames - 2 * fps;
  const rosto = useTrackingEm("nose", ini);
  const escala = interpolate(frame, [ini, durationInFrames - 1], [1, 1.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  return { escala, origemX: rosto.x, origemY: rosto.y };
};

const Corpo: React.FC<{ transparente?: boolean }> = ({ transparente }) => {
  const camera = useDolly();
  return (
    <Sanduiche
      transparente={transparente}
      camera={camera}
      atras={
        <Palco>
          <Titulo />
          <Orbita lado="atras" />
        </Palco>
      }
      frente={
        <Palco>
          <Orbita lado="frente" />
        </Palco>
      }
    />
  );
};

export const CenaMinima: React.FC<CenaMinimaProps> = ({ clip, inicio, transparente }) => (
  <Clip clip={clip} inicio={inicio}>
    <Corpo transparente={transparente} />
  </Clip>
);
