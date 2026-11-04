import React, { createContext, useContext, useEffect, useState } from "react";
import {
  cancelRender,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/** Pontos disponíveis no tracking.json (gerados pelo prep.py). */
export type Ponto =
  | "nose" | "leftEye" | "rightEye" | "leftEar" | "rightEar"
  | "leftShoulder" | "rightShoulder" | "leftElbow" | "rightElbow"
  | "leftWrist" | "rightWrist" | "leftIndex" | "rightIndex"
  | "leftHip" | "rightHip"
  | "forehead" | "chin" | "faceLeft" | "faceRight" | "mouth";

type Landmark = { x: number; y: number; z: number; v: number };
type FrameData = Record<Ponto, Landmark>;

export type Meta = {
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
};

type Ctx = { clip: string; meta: Meta; frames: FrameData[]; offset: number };
const TrackingCtx = createContext<Ctx | null>(null);

/**
 * Carrega public/<clip>/tracking.json + meta.json uma vez por aba de render.
 * `offset` = frame do vídeo de origem que corresponde ao frame 0 da composição.
 */
export const Clip: React.FC<{
  /** pasta em public/ gerada pelo prep.py */
  clip: string;
  /** frame do vídeo de origem onde a cena começa */
  inicio?: number;
  children: React.ReactNode;
}> = ({ clip, inicio: offset = 0, children }) => {
  const [data, setData] = useState<Omit<Ctx, "offset"> | null>(null);
  const [handle] = useState(() => delayRender(`tracking ${clip}`));

  useEffect(() => {
    Promise.all([
      fetch(staticFile(`${clip}/tracking.json`)).then((r) => r.json()),
      fetch(staticFile(`${clip}/meta.json`)).then((r) => r.json()),
    ])
      .then(([frames, meta]) => {
        setData({ clip, frames, meta });
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [clip, handle]);

  if (!data) return null;
  return <TrackingCtx.Provider value={{ ...data, offset }}>{children}</TrackingCtx.Provider>;
};

export const useClip = (): Ctx => {
  const c = useContext(TrackingCtx);
  if (!c) throw new Error("useTracking precisa estar dentro de <Clip>");
  return c;
};

/**
 * Converte coordenada normalizada do vídeo de origem (0..1) para pixel da composição,
 * considerando que o vídeo é desenhado com object-fit: cover.
 */
export const useCover = () => {
  const { meta } = useClip();
  const { width: W, height: H } = useVideoConfig();
  const s = Math.max(W / meta.width, H / meta.height);
  const ox = (W - meta.width * s) / 2;
  const oy = (H - meta.height * s) / 2;
  return (x: number, y: number) => ({ x: ox + x * meta.width * s, y: oy + y * meta.height * s });
};

export type PontoTela = { x: number; y: number; z: number; visivel: number };

/**
 * Posição de um landmark NO FRAME ATUAL, em pixels da composição.
 * `atraso` (frames) lê o tracking de N frames antes, útil para "rastro"/inércia.
 */
export const useTracking = (ponto: Ponto, atraso = 0): PontoTela => {
  const frame = useCurrentFrame();
  const { frames, offset } = useClip();
  const cover = useCover();
  const i = Math.max(0, Math.min(frames.length - 1, frame + offset - atraso));
  const lm = frames[i]?.[ponto] ?? { x: 0.5, y: 0.5, z: 0, v: 0 };
  const p = cover(lm.x, lm.y);
  return { x: p.x, y: p.y, z: lm.z, visivel: lm.v };
};

/** Lê um ponto num frame específico (absoluto da composição) — p/ âncoras fixas. */
export const useTrackingEm = (ponto: Ponto, frameFixo: number): PontoTela => {
  const { frames, offset } = useClip();
  const cover = useCover();
  const i = Math.max(0, Math.min(frames.length - 1, frameFixo + offset));
  const lm = frames[i]?.[ponto] ?? { x: 0.5, y: 0.5, z: 0, v: 0 };
  const p = cover(lm.x, lm.y);
  return { x: p.x, y: p.y, z: lm.z, visivel: lm.v };
};
