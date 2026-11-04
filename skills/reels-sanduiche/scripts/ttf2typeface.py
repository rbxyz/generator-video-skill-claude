#!/usr/bin/env python3
"""Converte TTF/OTF -> typeface JSON (formato do FontLoader do three.js), usado no texto 3D.
Uso: .venv/bin/python tools/ttf2typeface.py assets/fonts/Anton-Regular.ttf src/fonts/anton.typeface.json
"""
import json
import string
import sys

from fontTools.pens.basePen import BasePen
from fontTools.ttLib import TTFont

CHARS = string.ascii_letters + string.digits + " .,:;!?-+&@#%/()'\"ÁÀÂÃÉÊÍÓÔÕÚÇáàâãéêíóôõúç"


class TypefacePen(BasePen):
    def __init__(self, glyphset):
        super().__init__(glyphset)
        self.cmds = []

    def _moveTo(self, p):
        self.cmds += ["m", p[0], p[1]]

    def _lineTo(self, p):
        self.cmds += ["l", p[0], p[1]]

    def _qCurveToOne(self, c, p):  # typeface: ponto final primeiro, depois controle
        self.cmds += ["q", p[0], p[1], c[0], c[1]]

    def _curveToOne(self, c1, c2, p):
        self.cmds += ["b", p[0], p[1], c1[0], c1[1], c2[0], c2[1]]

    def _closePath(self):
        self.cmds += ["z"]


def fmt(v):
    return str(round(v)) if isinstance(v, (int, float)) else v


def main(src, dst):
    font = TTFont(src)
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    glyphs = {}
    for ch in CHARS:
        name = cmap.get(ord(ch))
        if not name:
            continue
        pen = TypefacePen(gs)
        gs[name].draw(pen)
        nums = [v for v in pen.cmds if not isinstance(v, str)]
        glyphs[ch] = {
            "ha": gs[name].width,
            "x_min": min(nums[0::2]) if nums else 0,
            "x_max": max(nums[0::2]) if nums else 0,
            "o": " ".join(fmt(v) for v in pen.cmds),
        }
    head, hhea, post = font["head"], font["hhea"], font["post"]
    out = {
        "glyphs": glyphs,
        "familyName": font["name"].getDebugName(1),
        "ascender": hhea.ascent,
        "descender": hhea.descent,
        "underlinePosition": post.underlinePosition,
        "underlineThickness": post.underlineThickness,
        "boundingBox": {"xMin": head.xMin, "yMin": head.yMin, "xMax": head.xMax, "yMax": head.yMax},
        "resolution": head.unitsPerEm,
        "original_font_information": {},
    }
    with open(dst, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    print(f"{len(glyphs)} glifos -> {dst}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
