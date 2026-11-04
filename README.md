# generator-video-skill-claude

Skill de agente para editar vídeos verticais (Reels/Shorts/TikTok) de alguém falando para a câmera. Com ela você coloca **textos e objetos 3D atrás da pessoa**, cria elementos que **seguem a mão e o rosto**, faz zoom de câmera e sincroniza os textos de tela com a fala, tudo a partir de um roteiro ou de um prompt.

```
hud      textos de tela
frente   elementos sobre a pessoa (presos à mão)
pessoa   recorte com alpha  ← Robust Video Matting
atras    3D / texto / fundo  ← @remotion/three
fundo    vídeo original
```

O Remotion só compõe e anima. O que viabiliza o efeito é o pré-processamento, feito uma vez por vídeo:
- **recorte da pessoa:** RVM;
- **landmarks de pose e rosto:** MediaPipe;
- **tempo de cada palavra:** Whisper.

Depois disso, cada cena é um componente React curto.

## Instalação da skill

**Claude Code**

Para um projeto, copie a pasta para `.claude/skills/` do projeto:
```bash
cp -r skills/reels-sanduiche <seu-projeto>/.claude/skills/
```
Para todos os projetos, copie para `~/.claude/skills/`:
```bash
cp -r skills/reels-sanduiche ~/.claude/skills/
```

**Outras plataformas:** `SKILL.md` segue o formato aberto de Agent Skills (frontmatter + markdown + pastas de apoio). Onde esse formato não for suportado, use o `SKILL.md` como instrução de sistema e anexe `scripts/`, `template/` e `referencias/`.

## Uso

```bash
# 1. criar um projeto (venv com torch/mediapipe/whisper, fontes, npm)
bash skills/reels-sanduiche/scripts/novo-projeto.sh meu-reels
cd meu-reels

# 2. pré-processar o vídeo
.venv/bin/python prep.py input/video.mp4 --name clip01
.venv/bin/python transcrever.py clip01

# 3. pedir a cena ao agente, por exemplo:
#    "Cena de 8s: título 'LANÇAMENTO' em 3D surge atrás da pessoa quando ela diz 'novo',
#     uma esfera orbita a mão direita e no final a câmera dá um dolly in."

# 4. preview e render
npx remotion studio
npx remotion render src/index.ts <Composicao> out/video.mp4 --crf=18
```

Funciona sem GPU e sem ffmpeg instalado no sistema. Em CPU, um vídeo de cerca de 1 minuto leva uns 6 min no pré-processamento e uns 6 min no render.

## Estrutura

```
skills/reels-sanduiche/
├── SKILL.md            fluxo, regras obrigatórias, API do template, receitas
├── scripts/            prep.py, transcrever.py, ttf2typeface.py, novo-projeto.sh
├── template/           projeto Remotion base (sanduíche, tracking, 3D, componentes)
└── referencias/        roteiro → cena, cena mínima, troubleshooting
```

## Créditos

- [Remotion](https://www.remotion.dev): render em React. Verifique a licença para uso comercial em empresas.
- [Robust Video Matting](https://github.com/PeterL1n/RobustVideoMatting) (GPL-3.0): o modelo é baixado em tempo de execução.
- [MediaPipe](https://ai.google.dev/edge/mediapipe), [faster-whisper](https://github.com/SYSTRAN/faster-whisper), [three.js](https://threejs.org).
- Fontes: Anton, Inter e Caveat (Google Fonts, OFL), baixadas pelo `novo-projeto.sh`.
