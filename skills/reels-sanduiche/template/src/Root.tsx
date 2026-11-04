import React from "react";
import { Composition, staticFile } from "remotion";
import { Debug } from "./cenas/Debug";
import "./lib/tema";
// import { MinhaCena } from "./cenas/MinhaCena";

const W = 1080;
const H = 1920;
const FPS = 30; // mesmo FPS do prep.py (meta.json)

/** Duração = duração do clip pré-processado. */
const duracaoDoClip = async ({ props }: { props: { clip: string } }) => {
  const meta = await fetch(staticFile(`${props.clip}/meta.json`)).then((r) => r.json());
  return { durationInFrames: meta.durationInFrames as number, fps: meta.fps as number };
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Debug" component={Debug} width={W} height={H} fps={FPS} durationInFrames={1}
      defaultProps={{ clip: "CLIP" }} calculateMetadata={duracaoDoClip} />
    {/*
    <Composition id="MinhaCena" component={MinhaCena} width={W} height={H} fps={FPS} durationInFrames={1}
      defaultProps={{ clip: "CLIP", transparente: false }} calculateMetadata={duracaoDoClip} />
    */}
  </>
);
