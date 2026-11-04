#!/usr/bin/env bash
# Cria um projeto de Reels a partir do template da skill.
# Uso: bash <skill>/scripts/novo-projeto.sh <pasta-destino>
# Idempotente: pode rodar de novo numa pasta existente para completar o que faltar.
set -euo pipefail

SKILL="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="${1:?informe a pasta de destino}"
mkdir -p "$DEST"
cd "$DEST"

echo "→ template"
cp -rn "$SKILL/template/." .
[ -f .gitignore ] || mv gitignore .gitignore 2>/dev/null || true
rm -f gitignore
mkdir -p input public/fonts tools out
cp -n "$SKILL/scripts/prep.py" "$SKILL/scripts/transcrever.py" .
cp -n "$SKILL/scripts/ttf2typeface.py" tools/

echo "→ Python (venv + torch CPU + mediapipe + whisper)"
if [ ! -x .venv/bin/python ]; then python3 -m venv .venv; fi
.venv/bin/pip install -q --upgrade pip
if ! .venv/bin/python -c "import torch" 2>/dev/null; then
  if command -v nvidia-smi >/dev/null; then .venv/bin/pip install -q torch torchvision
  else .venv/bin/pip install -q torch torchvision --index-url https://download.pytorch.org/whl/cpu; fi
fi
.venv/bin/pip install -q -r "$SKILL/scripts/requirements.txt"

echo "→ fontes (Anton / Inter / Caveat, Google Fonts OFL)"
GF=https://github.com/google/fonts/raw/main/ofl
[ -f public/fonts/Anton-Regular.ttf ] || curl -sSLf -o public/fonts/Anton-Regular.ttf "$GF/anton/Anton-Regular.ttf"
[ -f public/fonts/Inter.ttf ]         || curl -sSLf -o public/fonts/Inter.ttf "$GF/inter/Inter%5Bopsz,wght%5D.ttf"
[ -f public/fonts/Caveat.ttf ]        || curl -sSLf -o public/fonts/Caveat.ttf "$GF/caveat/Caveat%5Bwght%5D.ttf"
[ -f src/fonts/anton.typeface.json ]  || .venv/bin/python tools/ttf2typeface.py public/fonts/Anton-Regular.ttf src/fonts/anton.typeface.json

echo "→ Node"
npm i --no-audit --no-fund
npx tsc -p . >/dev/null && echo "typecheck ok"

echo
echo "Pronto. Próximos passos:"
echo "  1. coloque o vídeo em input/"
echo "  2. .venv/bin/python prep.py input/<video>.mp4 --name <clip>"
echo "  3. .venv/bin/python transcrever.py <clip>"
echo "  4. troque \"CLIP\" por <clip> em src/Root.tsx e confira: npx remotion still src/index.ts Debug /tmp/d.png --frame=30 --scale=0.4"
