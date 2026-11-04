import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useVideoConfig } from "remotion";
import type { ThreeElements } from "@react-three/fiber";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import antonJson from "../fonts/anton.typeface.json";

/** Câmera padrão de todas as cenas (perspectiva, olhando para z=0). */
export const CAMERA = { fov: 30, z: 20 };

/**
 * Converte pixel da composição -> coordenada do mundo 3D no plano de profundidade `z`.
 * Assim um objeto em pxToWorld(mao.x, mao.y) aparece exatamente sobre a mão.
 */
export const usePxToWorld = () => {
  const { width: W, height: H } = useVideoConfig();
  return (px: number, py: number, z = 0): [number, number, number] => {
    const dist = CAMERA.z - z;
    const h = 2 * dist * Math.tan((CAMERA.fov * Math.PI) / 360);
    const w = (h * W) / H;
    return [(px / W - 0.5) * w, -(py / H - 0.5) * h, z];
  };
};

/** Quantas unidades 3D equivalem a 1px no plano z (p/ dimensionar coisas em px). */
export const usePxUnit = (z = 0) => {
  const { height: H } = useVideoConfig();
  return (2 * (CAMERA.z - z) * Math.tan((CAMERA.fov * Math.PI) / 360)) / H;
};

/** Canvas 3D já com câmera e luzes padrão. Use dentro de `atras` ou `frente`. */
export const Palco: React.FC<{ children: React.ReactNode; luzes?: boolean }> = ({
  children,
  luzes = true,
}) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ fov: CAMERA.fov, position: [0, 0, CAMERA.z], near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
    >
      {luzes ? (
        <>
          <ambientLight intensity={0.55} />
          <directionalLight position={[4, 6, 10]} intensity={2.2} />
          <directionalLight position={[-6, -2, 4]} intensity={0.8} color="#B9B2FF" />
          <pointLight position={[0, 0, 6]} intensity={30} distance={30} color="#ffffff" />
        </>
      ) : null}
      {children}
    </ThreeCanvas>
  );
};

const fonte = new FontLoader().parse(antonJson as never);

/** Texto 3D extrudado (fonte Anton), centralizado na origem do grupo. */
export const Texto3D: React.FC<
  {
    texto: string;
    tamanho?: number;
    profundidade?: number;
    cor?: string;
    /** se informado, escala o texto para ter exatamente essa largura (unidades 3D) */
    largura?: number;
  } & ThreeElements["group"]
> = ({ texto, tamanho = 1, profundidade = 0.3, cor = "#8C82F2", largura, ...group }) => {
  const geo = useMemo(() => {
    const g = new TextGeometry(texto, {
      font: fonte,
      size: tamanho,
      depth: profundidade,
      curveSegments: 6,
      bevelEnabled: true,
      bevelThickness: profundidade * 0.15,
      bevelSize: tamanho * 0.02,
      bevelSegments: 3,
    });
    g.center();
    g.computeBoundingBox();
    return g;
  }, [texto, tamanho, profundidade]);
  const bb = geo.boundingBox!;
  const k = largura ? largura / (bb.max.x - bb.min.x) : 1;
  return (
    <group {...group}>
      <mesh geometry={geo} scale={k}>
        <meshStandardMaterial color={cor} metalness={0.35} roughness={0.3} />
      </mesh>
    </group>
  );
};

export { THREE };

/**
 * Bloco de várias linhas 3D, cada linha esticada para a mesma `largura` (estilo editorial justificado).
 * Centralizado no grupo. `progresso` (0..1 por linha) anima a entrada: sobe girando no eixo X.
 */
export const BlocoTexto3D: React.FC<
  {
    linhas: string[];
    largura: number;
    gap?: number;
    cor?: string;
    profundidade?: number;
    progresso?: number[];
  } & ThreeElements["group"]
> = ({ linhas, largura, gap = 0.12, cor = "#8C82F2", profundidade = 0.6, progresso, ...group }) => {
  const geos = useMemo(
    () =>
      linhas.map((l) => {
        const g = new TextGeometry(l, {
          font: fonte, size: 1, depth: profundidade, curveSegments: 6,
          bevelEnabled: true, bevelThickness: profundidade * 0.15, bevelSize: 0.02, bevelSegments: 3,
        });
        g.center();
        g.computeBoundingBox();
        const bb = g.boundingBox!;
        const k = largura / (bb.max.x - bb.min.x);
        return { g, k, h: (bb.max.y - bb.min.y) * k };
      }),
    [linhas.join("|"), largura, profundidade],
  );
  const total = geos.reduce((s, x) => s + x.h, 0) + gap * (geos.length - 1);
  let y = total / 2;
  return (
    <group {...group}>
      {geos.map(({ g, k, h }, i) => {
        const cy = y - h / 2;
        y -= h + gap;
        const p = progresso?.[i] ?? 1;
        return (
          <group key={i} position={[0, cy - (1 - p) * h * 1.2, 0]} rotation={[(1 - p) * -1.3, 0, 0]} scale={Math.max(0.0001, 0.7 + 0.3 * p)}>
            <mesh geometry={g} scale={k}>
              <meshStandardMaterial color={cor} metalness={0.35} roughness={0.3} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
