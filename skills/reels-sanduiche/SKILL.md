---
name: reels-sanduiche
description: Edita Reels/Shorts verticais de "talking head" com efeito de camadas — textos e objetos 3D ATRÁS da pessoa, elementos que seguem mão/rosto, zoom de câmera e textos de tela sincronizados com a fala. Use quando o usuário enviar um vídeo de alguém falando para a câmera (pasta input/) e pedir para editar, animar, "colocar texto atrás da pessoa", gerar o vídeo a partir de um roteiro, ou criar um novo projeto desse tipo. Pipeline: Python (Robust Video Matting + MediaPipe + Whisper) para pré-processar e Remotion (React + three.js) para compor.
---

# Reels "sanduíche": pessoa recortada entre camadas

O efeito de "texto atrás da pessoa" é uma pilha de camadas montada com dados extraídos do vídeo **antes** da edição. O Remotion só compõe e anima: ele não recorta a pessoa nem rastreia o movimento. O trabalho pesado é feito uma vez por vídeo, no pré-processamento.

```
5. hud      textos de tela, legendas         (fora da câmera)
4. frente   elementos sobre a pessoa (ex.: número preso ao dedo)  ┐
3. pessoa   pessoa_alpha.webm (VP9 com alpha)                     │ dentro da "câmera"
2. atras    3D / metáfora visual / fundo escuro                   │ (zoom/dolly)
1. fundo    original.mp4                                          ┘
```

## Fluxo de trabalho

1. **Projeto.** Se ainda não existir, rode `bash <skill>/scripts/novo-projeto.sh <pasta>`. O script copia o `template/`, cria o venv (torch CPU ou CUDA, MediaPipe, faster-whisper), baixa as fontes, gera a fonte 3D e roda `npm i`.
2. **Pré-processar** (uma vez por vídeo):
   ```bash
   .venv/bin/python prep.py "input/<video>.mp4" --name <clip>   # opcional: --start s --duration s --fps 30
   .venv/bin/python transcrever.py <clip>
   ```
   Isso gera, em `public/<clip>/`:
   - `original.mp4`: vídeo normalizado a 30 fps, com áudio;
   - `pessoa_alpha.webm`: a pessoa recortada (RVM);
   - `tracking.json`: pose + rosto (MediaPipe Tasks) por frame, já suavizados;
   - `meta.json`;
   - `fala.json`: o tempo de cada palavra (Whisper).
3. **Validar** antes de escrever a cena. Faça um still da composição `Debug` (fundo escurecido + landmarks) e confira se o recorte está limpo e se os pontos caem no lugar certo.
4. **Escrever a cena** a partir do roteiro (veja `referencias/roteiro-para-cena.md`):
   - copie `src/cenas/_Modelo.tsx`;
   - preencha `M` com os tempos do `fala.json`;
   - escreva um bloco `{Atras, Frente, Hud}` por trecho do roteiro;
   - registre a composição no `Root.tsx`, usando `calculateMetadata` para a duração.
   As peças prontas ficam em `src/lib/componentes.tsx`: `Pilula`, `Anotacao`, `Titulo3D`, `Fundo`, `ContadorNaMao`, `TextoFixo` e `rnd`. O exemplo mínimo é `referencias/cena-minima.tsx`.
5. **Revisar com stills**: `npx remotion still src/index.ts <Comp> out.png --frame=N --scale=0.4` em 6 a 8 momentos-chave, juntados numa grade. Corrija e só então faça o render.
6. **Render**: `npx remotion render src/index.ts <Comp> out/<Comp>.mp4 --crf=18`.
   Para exportar com alpha para o Premiere/CapCut, use `transparente: true` e os parâmetros `--codec=prores --prores-profile=4444 --image-format=png --pixel-format=yuva444p10le`.

## Regras obrigatórias

1. **Determinismo.** Anime só com `useCurrentFrame()` ou `useTempo()`. **Nunca** use `useFrame` do R3F, `Math.random()` ou `Date.now()`. Para aleatoriedade, use um hash do índice: `rnd(n, seed)`.
2. **Sem `<Sequence>` em cena com tracking**: ele zera o frame e o tracking desalinha. Use `<Janela de={s} ate={s}>` (segundos absolutos).
3. **Toda camada dentro de `<AbsoluteFill>`.** Vídeo sem `position` é pintado por baixo das camadas absolutas, e o 3D acaba aparecendo na frente da pessoa.
4. **Âncoras fixas para títulos e zoom.** Use `useTrackingEm("forehead", frameDeEntrada)`. Deixe `useTracking` (que muda a cada frame) só para o que deve seguir o movimento.
5. **Lateralidade do MediaPipe.** `right*` é a direita DA PESSOA e aparece à ESQUERDA da tela. Para "a mão que está contando", escolha a mais alta (menor `y`) que tenha `visivel > 0.5`.
6. **FPS da composição igual ao do `meta.json`** (30). As coordenadas do tracking são normalizadas pelo vídeo de origem; `useCover()` converte para pixels da composição considerando o `object-fit: cover`.
7. **3D só dentro de `<Janela>`.** Cada `<Palco>` é um contexto WebGL, e sem GPU (`swangle`) ele custa caro.
8. **Área segura em 1080×1920.** Textos importantes entre y≈110 e y≈1650. Sobre o torso, use sempre pílula com fundo. Sem emoji (o Chromium headless não tem fonte para eles).
9. **Sincronia pela fala real**, não pelos tempos estimados do roteiro. Quando a fala divergir do roteiro, siga a fala e avise o usuário.
10. **Nada falso.** Não fabrique print de notícia, logo de veículo ou dado. Use uma metáfora visual ou um espaço reservado, e avise.
11. **Segurança.** Não use `torch.hub.load(trust_repo=True)`, que executa código do GitHub. O RVM é carregado como TorchScript (`torch.jit.load`).

## API do template (`src/lib/`)

| Arquivo | Exporta | Uso |
|---|---|---|
| `tracking.tsx` | `Clip`, `useTracking(ponto, atraso?)`, `useTrackingEm(ponto, frame)`, `useCover()`, `useClip()`, tipo `Ponto` | `<Clip clip="x" inicio={frameOrigem}>` carrega o tracking. Os hooks devolvem `{x, y, z, visivel}` em px da composição. |
| `Sanduiche.tsx` | `Sanduiche`, tipo `Camera` | `<Sanduiche atras frente hud camera={{escala, origemX, origemY, x, y}} transparente audio />` |
| `tempo.tsx` | `useTempo()` → `{frame, fps, t, sp(s,cfg), ent(a,b,ease)}`, `Janela` | `sp(2.82)` = spring que começa em 2,82s; `ent(a,b)` = 0→1 entre dois segundos |
| `three.tsx` | `Palco`, `usePxToWorld()`, `usePxUnit(z)`, `Texto3D`, `BlocoTexto3D`, `CAMERA` | `toWorld(px, py, z)` posiciona em pixels; `BlocoTexto3D` deixa todas as linhas com a mesma largura e anima a entrada por `progresso[]` |
| `componentes.tsx` | `Pilula`, `Anotacao`, `Titulo3D`, `Fundo`, `ContadorNaMao`, `TextoFixo`, `rnd` | Peças visuais prontas, animadas pelo frame |
| `tema.ts` | `COR`, `FONTE` (+ carregamento das fontes) | Paleta e fontes num lugar só (Anton para títulos, Inter para corpo, Caveat para anotações manuscritas) |

Pontos de tracking:
- **pose:** `nose`, `leftEye`/`rightEye`, `leftEar`/`rightEar`, `leftShoulder`/`rightShoulder`, `leftElbow`/`rightElbow`, `leftWrist`/`rightWrist`, `leftIndex`/`rightIndex`, `leftHip`/`rightHip`;
- **rosto:** `forehead`, `chin`, `faceLeft`, `faceRight`, `mouth`.

Para adicionar um ponto, inclua o índice em `POSE_POINTS`/`FACE_POINTS` no `prep.py`, rode de novo e adicione o nome ao tipo `Ponto`.

## Receitas rápidas

- **Título atrás da cabeça:** `<Palco><Titulo3D .../></Palco>`, com `de` = o segundo da palavra-chave e `dy` ≈ +40 a +110 (ancorado na testa). Use `largura` 0,86–0,92, ou 0,66–0,7 quando houver zoom.
- **Objeto orbitando a mão, passando na frente e atrás:** renderize o mesmo objeto em dois `<Palco>` (um em `atras`, outro em `frente`) e mostre em cada um só quando `sin(ângulo)` for menor ou maior que 0. Veja `referencias/cena-minima.tsx`.
- **Corte seco ou plano fechado:** a câmera devolve `{escala: 1.28, origemX: nariz.x, origemY: nariz.y}` no intervalo, sem interpolação.
- **Dolly in final:** interpole a `escala` de 1 a 1,3 com `Easing.inOut(Easing.cubic)`, com âncora no nariz no início do CTA.
- **Metáfora "dados sumindo":** grade/tabela em CSS 3D (`perspective` + `rotateX`) que rola com aceleração `p^5` até a linha-limite e depois desintegra as células com `opacity`, `translate` e `blur`, cada uma com atraso de `rnd()`.
- **Anotação manuscrita:** texto Caveat revelado com `clip-path` + SVG de sublinhado com `strokeDashoffset`.

## Ambiente e limitações

- Funciona sem GPU e sem ffmpeg no sistema: `imageio-ffmpeg` cobre o Python, e o Remotion traz o próprio ffmpeg (`npx remotion ffprobe`).
- Tempos medidos (8 núcleos, sem GPU), para um vídeo de 66s:
  - `prep.py`: cerca de 6 min;
  - Whisper small: cerca de 1 min;
  - render 1080×1920: cerca de 6 min.
- O recorte do RVM é ótimo para pessoas. Para objetos, troque por SAM 2. Para oclusão parcial (objeto atrás do braço e na frente do corpo), adicione um mapa de profundidade (Depth Anything V2) ao `prep.py`.
- Problemas já resolvidos estão em `referencias/troubleshooting.md`. Consulte antes de depurar.

## Portabilidade (outras plataformas)

A skill não depende de recursos exclusivos do Claude Code: é shell, Python e Node.
- **Outro agente/LLM:** use este `SKILL.md` como prompt de sistema ou contexto, e as pastas `scripts/`, `template/` e `referencias/` como anexos ou arquivos do repositório.
- **Prompt do usuário depois do setup:** "Cena de Xs: <o que acontece, em que palavra, onde>". O modelo só escreve `src/cenas/<Nome>.tsx` e registra a composição no `Root.tsx`.
