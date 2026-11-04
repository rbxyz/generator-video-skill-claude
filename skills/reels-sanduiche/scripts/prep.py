#!/usr/bin/env python3
"""
Pré-processamento: recebe um vídeo e gera, em public/<nome>/:
  - original.mp4        vídeo normalizado (FPS fixo, com áudio)
  - pessoa_alpha.webm   só a pessoa, com canal alpha (VP9 yuva420p) — via Robust Video Matting
  - tracking.json       landmarks de pose/rosto por frame (coords normalizadas 0..1) — via MediaPipe
  - meta.json           fps, largura, altura, nº de frames

Uso:
  .venv/bin/python prep.py input/video.mp4 [--name cena01] [--fps 30] [--start 0] [--duration 0]
Roda 100% em CPU (lento mas funciona); com CUDA disponível usa GPU no RVM automaticamente.
"""
import argparse
import json
import subprocess
import sys
import urllib.request
from pathlib import Path

import cv2
import imageio_ffmpeg
import mediapipe as mp
import numpy as np
import torch
from mediapipe.tasks.python import BaseOptions, vision

ROOT = Path(__file__).resolve().parent
MODELS = ROOT / "models"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

POSE_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task"
RVM_URL = "https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_mobilenetv3_fp32.torchscript"
FACE_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task"

# Índices do MediaPipe Pose (33 pontos) que expomos com nome
POSE_POINTS = {
    "nose": 0, "leftEye": 2, "rightEye": 5, "leftEar": 7, "rightEar": 8,
    "leftShoulder": 11, "rightShoulder": 12, "leftElbow": 13, "rightElbow": 14,
    "leftWrist": 15, "rightWrist": 16, "leftIndex": 19, "rightIndex": 20,
    "leftHip": 23, "rightHip": 24,
}
# Pontos do Face Mesh (478) úteis para ancorar elementos
FACE_POINTS = {"forehead": 10, "chin": 152, "faceLeft": 234, "faceRight": 454, "mouth": 13}


def download(url: str, dest: Path) -> Path:
    if not dest.exists():
        dest.parent.mkdir(parents=True, exist_ok=True)
        print(f"baixando {dest.name}…")
        urllib.request.urlretrieve(url, dest)
    return dest


def normalize(src: Path, dst: Path, fps: int, start: float, duration: float) -> None:
    cmd = [FFMPEG, "-v", "error", "-y"]
    if start:
        cmd += ["-ss", str(start)]
    cmd += ["-i", str(src)]
    if duration:
        cmd += ["-t", str(duration)]
    # dimensões pares + FPS constante: evita drift entre vídeo, matte e tracking
    cmd += ["-vf", f"fps={fps},scale=trunc(iw/2)*2:trunc(ih/2)*2,setsar=1",
            "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(dst)]
    subprocess.run(cmd, check=True)


def smooth(series: list, alpha: float = 0.5) -> list:
    """EMA simples por ponto, preenchendo buracos com o último valor visto."""
    out, last = [], None
    for v in series:
        if v is None:
            out.append(last)
            continue
        if last is None:
            last = v
        else:
            last = {k: last[k] * (1 - alpha) + v[k] * alpha if k != "v" else v[k] for k in v}
        out.append(dict(last))
    # preenche o começo (antes da 1ª detecção) com a 1ª detecção
    first = next((x for x in out if x is not None), None)
    return [x if x is not None else first for x in out]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("video", type=Path)
    ap.add_argument("--name", default=None)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--start", type=float, default=0)
    ap.add_argument("--duration", type=float, default=0)
    ap.add_argument("--downsample", type=float, default=0,
                    help="downsample_ratio do RVM (0 = automático)")
    args = ap.parse_args()

    name = args.name or "cena"
    out = ROOT / "public" / name
    out.mkdir(parents=True, exist_ok=True)

    original = out / "original.mp4"
    print("1/3 normalizando vídeo…")
    normalize(args.video, original, args.fps, args.start, args.duration)

    cap = cv2.VideoCapture(str(original))
    W, H = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    # ---- modelos
    device = "cuda" if torch.cuda.is_available() else "cpu"
    torch.set_num_threads(max(1, torch.get_num_threads()))
    # modelo TorchScript oficial (só pesos + grafo; não executa código do repositório)
    rvm = torch.jit.load(str(download(RVM_URL, MODELS / "rvm_mobilenetv3_fp32.torchscript")), map_location=device).eval()
    if device == "cpu":
        rvm = torch.jit.freeze(rvm)
    # RVM recomenda downsample tal que o lado menor fique ~256-512 no modelo
    ds = args.downsample or min(1.0, 512 / max(W, H))

    pose = vision.PoseLandmarker.create_from_options(vision.PoseLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=str(download(POSE_URL, MODELS / "pose_landmarker_full.task"))),
        running_mode=vision.RunningMode.VIDEO, num_poses=1))
    face = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=str(download(FACE_URL, MODELS / "face_landmarker.task"))),
        running_mode=vision.RunningMode.VIDEO, num_faces=1))

    # encoder VP9 com alpha, recebendo RGBA cru pelo stdin
    alpha_path = out / "pessoa_alpha.webm"
    enc = subprocess.Popen([
        FFMPEG, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}",
        "-r", str(args.fps), "-i", "-", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
        "-b:v", "0", "-crf", "20", "-deadline", "good", "-cpu-used", "4", "-row-mt", "1",
        "-auto-alt-ref", "0", str(alpha_path)], stdin=subprocess.PIPE)

    print(f"2/3 matting + tracking ({W}x{H}, {total} frames, {device})…")
    rec = [None] * 4
    pose_raw, face_raw = [], []
    i = 0
    with torch.inference_mode():
        while True:
            ok, bgr = cap.read()
            if not ok:
                break
            rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

            # --- RVM (recorrente: estável entre frames, sem "piscar")
            src = torch.from_numpy(rgb).to(device).permute(2, 0, 1).float().div(255).unsqueeze(0)
            fgr, pha, *rec = rvm(src, *rec, ds)
            # usa a cor original (fgr do RVM pode dessaturar levemente) + alpha do RVM
            a = (pha[0, 0].clamp(0, 1).cpu().numpy() * 255).astype(np.uint8)
            enc.stdin.write(np.dstack([rgb, a]).tobytes())

            # --- MediaPipe
            ts = int(i * 1000 / args.fps)
            img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            pr = pose.detect_for_video(img, ts)
            if pr.pose_landmarks:
                lm = pr.pose_landmarks[0]
                pose_raw.append({k: {"x": lm[j].x, "y": lm[j].y, "z": lm[j].z, "v": lm[j].visibility}
                                 for k, j in POSE_POINTS.items()})
            else:
                pose_raw.append(None)
            fr = face.detect_for_video(img, ts)
            if fr.face_landmarks:
                lm = fr.face_landmarks[0]
                face_raw.append({k: {"x": lm[j].x, "y": lm[j].y, "z": lm[j].z, "v": 1.0}
                                 for k, j in FACE_POINTS.items()})
            else:
                face_raw.append(None)

            i += 1
            if i % 30 == 0:
                print(f"  {i}/{total}", flush=True)

    enc.stdin.close()
    enc.wait()
    cap.release()

    print("3/3 suavizando e salvando tracking…")
    names = list(POSE_POINTS) + list(FACE_POINTS)
    per_point = {}
    for k in POSE_POINTS:
        per_point[k] = smooth([p[k] if p else None for p in pose_raw])
    for k in FACE_POINTS:
        per_point[k] = smooth([f[k] if f else None for f in face_raw])
    empty = {"x": 0.5, "y": 0.5, "z": 0.0, "v": 0.0}
    r = lambda d: {kk: round(vv, 4) for kk, vv in (d or empty).items()}
    frames = [{k: r(per_point[k][n]) for k in names} for n in range(i)]

    (out / "tracking.json").write_text(json.dumps(frames, separators=(",", ":")))
    meta = {"fps": args.fps, "width": W, "height": H, "durationInFrames": i,
            "points": names, "source": str(args.video)}
    (out / "meta.json").write_text(json.dumps(meta, indent=2))
    print(f"ok → {out}  ({i} frames)")


if __name__ == "__main__":
    sys.exit(main())
