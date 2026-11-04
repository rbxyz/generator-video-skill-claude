# Problemas já encontrados (e a correção)

| Sintoma | Causa | Correção |
|---|---|---|
| Texto "atrás" aparece NA FRENTE da pessoa; a pessoa parece sumir | `<OffthreadVideo>` sem `position`: elementos estáticos são pintados por baixo dos `position:absolute` | Cada camada do sanduíche dentro de `<AbsoluteFill>` (já feito em `Sanduiche.tsx`) |
| Elemento 3D/HTML "desgruda" da mão depois de um tempo | `<Sequence>` zera `useCurrentFrame()` e o tracking passa a ler o frame errado | Use `<Janela de ate>` (não altera o frame) |
| Render com frames diferentes entre execuções ou flicker | `useFrame` do R3F, `Math.random()`, `Date.now()` | Tudo derivado do frame; aleatório = hash do índice |
| Título tremendo junto com a cabeça | Ancorado em `useTracking` (muda todo frame) | `useTrackingEm(ponto, frameDeEntrada)` para âncoras |
| `torch.hub.load(..., trust_repo=True)` bloqueado / arriscado | Executa código Python baixado do GitHub | Usar o **TorchScript** oficial do RVM (`torch.jit.load`), só pesos + grafo |
| `TypeError: open() got an unexpected keyword argument 'metadata_errors'` no faster-whisper | Versão do PyAV incompatível | Decodificar o áudio com o ffmpeg (imageio-ffmpeg) para PCM 16 kHz e passar o array |
| `mp.solutions` não existe | MediaPipe ≥ 1.x removeu a API legada | Usar MediaPipe **Tasks** (`PoseLandmarker`, `FaceLandmarker`) com arquivos `.task` |
| Não há fontes no `three/examples/fonts` | O pacote three recente não traz mais as fontes | `tools/ttf2typeface.py` converte TTF → typeface JSON |
| `ffmpeg`/`ffprobe` ausentes no sistema | — | `imageio-ffmpeg` (Python) e `npx remotion ffprobe` (o Remotion traz o próprio ffmpeg) |
| WebGL não renderiza sem GPU | Chromium headless sem GL | `Config.setChromiumOpenGlRenderer("swangle")` |
| Emoji aparece como quadrado | Chromium headless sem fonte de emoji | Desenhar (SVG) ou usar ↓ → |
| Texto 3D cortado no topo durante o zoom | A câmera escala ao redor do nariz e empurra o topo para fora | Diminuir a `largura` e baixar o `dy` dos títulos nos trechos com zoom |
| Pílulas do topo cobrindo o título 3D | Os dois disputam a mesma faixa (y 100–500) | Nos trechos com 3D, mover as pílulas para baixo (y ≥ 1050) ou esconder o texto fixo |
| Render estoura a RAM | Muitas abas do Chromium | `Config.setConcurrency(2-3)` e só montar `<Palco>` dentro de `<Janela>` |

## Validação do recorte (sem Remotion)

```bash
FF=$(.venv/bin/python -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
$FF -y -f lavfi -i color=c=0x00ff00:s=<W>x<H> -c:v libvpx-vp9 -i public/<clip>/pessoa_alpha.webm \
  -filter_complex "[0][1]overlay=shortest=1,select=eq(n\,45)" -frames:v 1 /tmp/matte.png
```
(O `-c:v libvpx-vp9` antes do `-i` é obrigatório: o decoder nativo do ffmpeg ignora o alpha.)

## Desempenho medido (CPU de 8 núcleos, sem GPU, 7 GB de RAM)

- `prep.py`: ~6 fps em 464×832 (66s de vídeo ≈ 6 min)
- `transcrever.py` (whisper small int8): ~1 min para 66s
- `remotion render` 1080×1920, 1981 frames, até 2 canvases WebGL: ~6 min
