#!/usr/bin/env python3
"""Transcreve public/<clip>/original.mp4 com timestamps por palavra -> public/<clip>/fala.json
Uso: .venv/bin/python transcrever.py <clip> [--modelo small]
O roteiro de cena usa esses tempos para sincronizar textos de tela com a fala.
"""
import argparse
import json
from pathlib import Path

import subprocess

import imageio_ffmpeg
import numpy as np
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parent

ap = argparse.ArgumentParser()
ap.add_argument("clip")
ap.add_argument("--modelo", default="small")
args = ap.parse_args()

out = ROOT / "public" / args.clip
meta = out / "meta.json"
fps = json.loads(meta.read_text())["fps"] if meta.exists() else 30
model = WhisperModel(args.modelo, device="cpu", compute_type="int8", download_root=str(ROOT / "models" / "whisper"))
pcm = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-v", "error", "-i", str(out / "original.mp4"),
                      "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True, check=True).stdout
audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
segs, _ = model.transcribe(audio, language="pt", word_timestamps=True, vad_filter=True)

palavras, frases = [], []
for s in segs:
    frases.append({"ini": round(s.start, 2), "fim": round(s.end, 2), "texto": s.text.strip()})
    for w in s.words:
        palavras.append({"ini": round(w.start, 2), "fim": round(w.end, 2), "f": round(w.start * fps), "p": w.word.strip()})
    print(f"[{s.start:6.2f} → {s.end:6.2f}] {s.text.strip()}")

(out / "fala.json").write_text(json.dumps({"fps": fps, "frases": frases, "palavras": palavras}, ensure_ascii=False, indent=1))
print(f"{len(palavras)} palavras -> {out / 'fala.json'}")
