/**
 * Peças visuais reutilizáveis entre cenas.
 * Todas animam só pelo frame (via useTempo / props `p` de 0..1).
 */
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import { COR, FONTE } from "./tema";
import { useTempo } from "./tempo";
import { BlocoTexto3D, usePxToWorld, usePxUnit } from "./three";
import { useTracking, useTrackingEm } from "./tracking";

/** Pílula de texto (HUD). `p` = progresso da entrada (ex.: sp(segundo)). */
export const Pilula: React.FC<{
  children: React.ReactNode; p: number; escuro?: boolean; destaque?: boolean; tam?: number; style?: React.CSSProperties;
}> = ({ children, p, escuro, destaque, tam = 46, style }) => (
  <div
    style={{
      display: "inline-flex", alignItems: "center", gap: 18,
      padding: `${tam * 0.42}px ${tam * 0.7}px`, borderRadius: tam * 0.4,
      background: destaque ? COR.roxo : escuro ? COR.tinta : COR.creme,
      color: destaque ? COR.tinta : escuro ? COR.creme : COR.tinta,
      font: `800 ${tam}px ${FONTE.corpo}`, letterSpacing: -0.5, lineHeight: 1.1,
      boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
      opacity: Math.min(1, p * 1.5),
      transform: `translateY(${(1 - p) * 40}px) scale(${0.85 + 0.15 * p})`,
      ...style,
    }}
  >
    {/* conteúdo misto (texto + <span> colorido) deve vir embrulhado num <span> para não quebrar o flex */}
    {children}
  </div>
);

/** Anotação manuscrita revelada da esquerda p/ direita + sublinhado desenhado à mão. */
export const Anotacao: React.FC<{ texto: string; p: number; cor?: string; tam?: number; rot?: number }> = ({
  texto, p, cor = COR.roxo, tam = 76, rot = -4,
}) => (
  <div style={{ display: "inline-block", transform: `rotate(${rot}deg)`, opacity: p > 0 ? 1 : 0 }}>
    <div style={{ font: `700 ${tam}px ${FONTE.mao}`, color: cor, textShadow: "0 3px 14px rgba(0,0,0,0.55)",
      clipPath: `inset(-20% ${100 - Math.min(1, p * 1.6) * 100}% -20% -5%)` }}>
      {texto}
    </div>
    <svg width="100%" height="34" viewBox="0 0 400 34" preserveAspectRatio="none" style={{ display: "block", marginTop: -8 }}>
      <path d="M4 22 C 90 8, 200 30, 300 14 S 380 16, 396 10" fill="none" stroke={cor} strokeWidth="7"
        strokeLinecap="round" pathLength={1} strokeDasharray={1}
        strokeDashoffset={1 - interpolate(p, [0.5, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
    </svg>
  </div>
);

/**
 * Título 3D atrás da cabeça, ancorado na altura da testa no instante de entrada (não treme).
 * Use dentro de <Palco>. `dy` desloca a âncora (px); `largura` = fração da largura do quadro.
 */
export const Titulo3D: React.FC<{ linhas: string[]; de: number; dy?: number; largura?: number; cor?: string }> = ({
  linhas, de, dy = 60, largura = 0.88, cor = COR.roxo,
}) => {
  const { sp, fps, t } = useTempo();
  const { width } = useVideoConfig();
  const toWorld = usePxToWorld();
  const px = usePxUnit(-2);
  const testa = useTrackingEm("forehead", Math.round(de * fps));
  const [x, y, z] = toWorld(width / 2, testa.y + dy, -2);
  return (
    <BlocoTexto3D
      linhas={linhas} largura={width * largura * px} gap={22 * px} cor={cor}
      position={[x, y, z]} rotation={[0, Math.sin(t * 1.3) * 0.06, 0]}
      progresso={linhas.map((_, i) => sp(de + i * 0.12, { damping: 13 }))}
    />
  );
};

/** Cor chapada atrás da pessoa (escurece o fundo p/ dar contraste). */
export const Fundo: React.FC<{ opacidade: number; cor?: string }> = ({ opacidade, cor = COR.tinta }) => (
  <AbsoluteFill style={{ background: cor, opacity: opacidade }} />
);

/**
 * Número que acompanha o indicador da mão mais alta — p/ quando a pessoa conta nos dedos.
 * `marcas` = segundos em que cada contagem começa. Vai na camada `frente`.
 */
export const ContadorNaMao: React.FC<{ marcas: number[] }> = ({ marcas }) => {
  const { t, sp } = useTempo();
  const e = useTracking("leftIndex");
  const d = useTracking("rightIndex");
  const atual = marcas.filter((s) => t >= s).length;
  if (atual === 0) return null;
  const mao = e.visivel > 0.5 && (e.y < d.y || d.visivel < 0.5) ? e : d;
  const p = sp(marcas[atual - 1], { damping: 10 });
  const vis = interpolate(mao.visivel, [0.3, 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: mao.x - 60, top: Math.min(mao.y - 190, 1500), width: 120, height: 120,
      borderRadius: 60, background: COR.roxo, display: "flex", alignItems: "center", justifyContent: "center",
      font: `400 78px ${FONTE.titulo}`, color: COR.tinta, boxShadow: "0 0 0 8px rgba(140,130,242,0.35), 0 20px 40px #0007",
      transform: `scale(${p})`, opacity: vis }}>
      {atual}
    </div>
  );
};

/** Texto fixo no topo. Esconda (`visivel=false`) nos trechos com título 3D no topo. */
export const TextoFixo: React.FC<{ de: number; visivel?: boolean; children: React.ReactNode }> = ({ de, visivel = true, children }) => {
  const { sp, t } = useTempo();
  if (t < de || !visivel) return null;
  const p = sp(de, { damping: 18 });
  return (
    <div style={{ position: "absolute", top: 120, left: 0, right: 0, display: "flex", justifyContent: "center",
      opacity: p, transform: `translateY(${(1 - p) * -30}px)` }}>
      <div style={{ font: `800 32px ${FONTE.corpo}`, letterSpacing: 1.5, color: COR.creme, background: "rgba(14,13,20,0.78)",
        padding: "14px 26px", borderRadius: 12 }}>
        {children}
      </div>
    </div>
  );
};

/** Hash determinístico 0..1 — substitui Math.random(). */
export const rnd = (n: number, seed: number) => {
  const x = Math.sin(n * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
