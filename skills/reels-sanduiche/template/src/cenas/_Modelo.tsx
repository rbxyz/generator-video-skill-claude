/**
 * MODELO DE CENA — copie para src/cenas/<Nome>.tsx.
 * 1. Preencha M com os tempos (s) tirados de public/<clip>/fala.json.
 * 2. Escreva um bloco por trecho do roteiro (Atras / Frente / Hud).
 * 3. Liste os blocos em BLOCOS. Registre a composição no Root.tsx.
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { Sanduiche, type Camera } from "../lib/Sanduiche";
import { COR, FONTE } from "../lib/tema";
import { Janela, useTempo } from "../lib/tempo";
import { Palco } from "../lib/three";
import { Clip, useTracking, useTrackingEm } from "../lib/tracking";
import { Anotacao, ContadorNaMao, Fundo, Pilula, TextoFixo, Titulo3D } from "../lib/componentes";

// ── marcas da fala (segundos) — comente a palavra de cada uma
const M = {
  palavraChave: 2.8, // "<palavra de impacto>"
  fimGancho: 4.6,
  cta: 60.0,
  fim: 999,
};

// ── blocos
const Gancho = {
  Atras: () => {
    const { ent } = useTempo();
    return (
      <>
        <Fundo opacidade={0.6 * ent(M.palavraChave - 0.2, M.palavraChave + 0.3)} />
        <Palco><Titulo3D linhas={["TÍTULO"]} de={M.palavraChave} /></Palco>
      </>
    );
  },
  Hud: () => {
    const { sp } = useTempo();
    return (
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 1180 }}>
          <Pilula p={sp(M.palavraChave + 0.8)} destaque tam={72} style={{ fontFamily: FONTE.titulo, fontWeight: 400 }}>
            SUBTÍTULO
          </Pilula>
        </div>
      </AbsoluteFill>
    );
  },
};

/** Exemplo de elemento preso à mão (vai em `Frente`). */
export const SegueMao: React.FC = () => {
  const mao = useTracking("rightIndex");
  return <div style={{ position: "absolute", left: mao.x - 50, top: mao.y - 160, width: 100, height: 100,
    borderRadius: 50, background: COR.roxo, opacity: mao.visivel > 0.5 ? 1 : 0 }} />;
};

type Bloco = { de: number; ate: number; Atras?: React.FC; Frente?: React.FC; Hud?: React.FC };
const BLOCOS: Bloco[] = [
  { de: 0, ate: M.fimGancho, ...Gancho },
  // { de: M.fimGancho, ate: ..., ...Fato },
];

const useCamera = (): Camera => {
  const { t, fps } = useTempo();
  const nariz = useTrackingEm("nose", Math.round(M.cta * fps));
  if (t >= M.cta) {
    const e = interpolate(t, [M.cta, M.cta + 2.5], [1, 1.3], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
    return { escala: e, origemX: nariz.x, origemY: nariz.y };
  }
  return { escala: 1 };
};

const camada = (k: "Atras" | "Frente" | "Hud") =>
  BLOCOS.map((b, i) => {
    const C = b[k];
    return C ? <Janela key={i} de={b.de} ate={b.ate}><C /></Janela> : null;
  });

// Outras peças prontas em ../lib/componentes: <Anotacao>, <ContadorNaMao marcas={[...]}> (camada Frente),
// <TextoFixo de={s} visivel={...}>, rnd(n, seed). Exemplo de bloco com perguntas contadas nos dedos:
export const ExemploPerguntas = {
  Frente: () => <ContadorNaMao marcas={[10.0, 12.5, 15.0]} />,
  Hud: () => {
    const { sp, ent } = useTempo();
    return (
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 1150, display: "flex", flexDirection: "column", gap: 20 }}>
          <Pilula p={sp(10.0)} tam={40}><span>Pergunta 1?</span></Pilula>
          <Anotacao texto="anotação à mão" p={ent(11, 12, Easing.linear)} />
        </div>
      </AbsoluteFill>
    );
  },
};

const Corpo: React.FC<{ transparente?: boolean }> = ({ transparente }) => (
  <Sanduiche transparente={transparente} camera={useCamera()}
    atras={<>{camada("Atras")}</>} frente={<>{camada("Frente")}</>}
    hud={<>{camada("Hud")}<TextoFixo de={M.fimGancho}>TEXTO FIXO DO TOPO</TextoFixo></>} />
);

export const Modelo: React.FC<{ clip: string; transparente?: boolean }> = ({ clip, transparente }) => (
  <Clip clip={clip}><Corpo transparente={transparente} /></Clip>
);
