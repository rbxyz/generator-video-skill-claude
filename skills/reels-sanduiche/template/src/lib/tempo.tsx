import React from "react";
import { spring, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

/**
 * Tempo em SEGUNDOS da composição (absoluto). Não usamos <Sequence> nas cenas com tracking,
 * porque ele zera o frame e desalinha o tracking. Use <Janela> no lugar.
 */
export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  /** spring que começa no segundo `s` */
  const sp = (s: number, cfg: { damping?: number; mass?: number; stiffness?: number } = {}) =>
    spring({ frame: frame - Math.round(s * fps), fps, config: { damping: 14, ...cfg } });
  /** 0→1 linear/suave entre dois segundos */
  const ent = (a: number, b: number, ease = Easing.out(Easing.cubic)) =>
    interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  return { frame, fps, t, sp, ent };
};

/** Renderiza os filhos só entre os segundos [de, ate) sem mexer no frame. */
export const Janela: React.FC<{ de: number; ate: number; children: React.ReactNode }> = ({ de, ate, children }) => {
  const { t } = useTempo();
  return t >= de && t < ate ? <>{children}</> : null;
};
