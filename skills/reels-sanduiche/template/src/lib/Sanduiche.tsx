import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { useClip } from "./tracking";

export type Camera = {
  /** zoom da "câmera" (1 = enquadramento original) */
  escala?: number;
  /** ponto (px da composição) que fica fixo durante o zoom */
  origemX?: number;
  origemY?: number;
  /** deslocamento em px */
  x?: number;
  y?: number;
};

type Props = {
  /** camada 2: entre o fundo e a pessoa (o que fica "atrás" dela) */
  atras?: React.ReactNode;
  /** camada 4: por cima da pessoa (fica "na frente") */
  frente?: React.ReactNode;
  /** camada 5: HUD fixo, fora da câmera (legendas, lower thirds) */
  hud?: React.ReactNode;
  /** true = sem vídeo de fundo, para exportar com alpha */
  transparente?: boolean;
  camera?: Camera;
  /** som do vídeo original */
  audio?: boolean;
};

/**
 * Pilha de camadas:
 *   1. vídeo original (fundo)          ← some se transparente
 *   2. `atras`  (3D / texto)
 *   3. pessoa recortada (alpha)
 *   4. `frente`
 *   5. `hud` (não sofre a câmera)
 * As camadas 1–4 ficam dentro da "câmera" e se movem juntas.
 * Precisa estar dentro de <Clip clip="..." inicio={...}> (que carrega o tracking).
 */
export const Sanduiche: React.FC<Props> = ({
  atras,
  frente,
  hud,
  transparente = false,
  camera = {},
  audio = true,
}) => {
  const { clip, offset: inicio } = useClip();
  const { escala = 1, origemX, origemY, x = 0, y = 0 } = camera;
  const video: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" };

  return (
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <AbsoluteFill
          style={{
            transform: `translate(${x}px, ${y}px) scale(${escala})`,
            transformOrigin:
              origemX !== undefined && origemY !== undefined ? `${origemX}px ${origemY}px` : "50% 50%",
          }}
        >
          {/* cada camada em AbsoluteFill: elemento não-posicionado seria pintado
              por baixo das camadas absolutas, quebrando a ordem do sanduíche */}
          {transparente ? null : (
            <AbsoluteFill>
              <OffthreadVideo
                src={staticFile(`${clip}/original.mp4`)}
                trimBefore={inicio}
                muted={!audio}
                style={video}
              />
            </AbsoluteFill>
          )}
          <AbsoluteFill>{atras}</AbsoluteFill>
          <AbsoluteFill>
            <OffthreadVideo
              src={staticFile(`${clip}/pessoa_alpha.webm`)}
              trimBefore={inicio}
              transparent
              muted
              style={video}
            />
          </AbsoluteFill>
          <AbsoluteFill>{frente}</AbsoluteFill>
        </AbsoluteFill>
        <AbsoluteFill>{hud}</AbsoluteFill>
      </AbsoluteFill>
  );
};
