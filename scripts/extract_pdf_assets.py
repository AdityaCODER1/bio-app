#!/usr/bin/env python3
"""
Extract high-DPI NCERT PDF page renders (WebP) and cropped figure diagrams (PNG).

Usage:
  .venv/bin/python3 scripts/extract_pdf_assets.py
  .venv/bin/python3 scripts/extract_pdf_assets.py --chapter ch09
  .venv/bin/python3 scripts/extract_pdf_assets.py --inspect b11newchapter.pdf
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import pymupdf
from PIL import Image, ImageChops, ImageOps

REPO_ROOT = Path(__file__).resolve().parent.parent
CROPS_FILE = REPO_ROOT / "scripts" / "diagram_crops.json"
PUBLIC_DIAGRAMS = REPO_ROOT / "public" / "diagrams"
PUBLIC_PDF_PAGES = REPO_ROOT / "public" / "pdf-pages"


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def inspect_pdf(pdf_name: str) -> None:
    pdf_path = REPO_ROOT / pdf_name
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")
    doc = pymupdf.open(pdf_path)
    print(f"PDF: {pdf_name} | Pages: {len(doc)} | SHA256: {sha256_file(pdf_path)}")
    for idx, page in enumerate(doc, start=1):
        print(f"\n--- Page {idx} ({page.rect.width:.1f} x {page.rect.height:.1f} pt) ---")
        for b in page.get_text("blocks"):
            x0, y0, x1, y1, txt, *_ = b
            clean = " ".join(txt.split())
            if any(k in clean for k in ("Figure", "Fig.", "TABLE", "Table", "SUMMARY", "EXERCISES")) or (
                len(clean) < 60 and any(ch.isdigit() for ch in clean[:6])
            ):
                print(f"  TXT ({x0:.0f},{y0:.0f},{x1:.0f},{y1:.0f}): {clean[:90]}")
        for img in page.get_image_info(xrefs=True):
            bb = img["bbox"]
            w, h = bb[2] - bb[0], bb[3] - bb[1]
            if 35 < w < 520 and 35 < h < 620:
                print(f"  IMG ({bb[0]:.0f},{bb[1]:.0f},{bb[2]:.0f},{bb[3]:.0f})")


def trim_whitespace_with_padding(img: Image.Image, pad: int = 16) -> Image.Image:
    rgb = img.convert("RGB")
    bg = Image.new("RGB", rgb.size, (255, 255, 255))
    diff = ImageChops.difference(rgb, bg)
    # Ignore near-white pixels (watermark or JPEG noise) only at strict threshold 248+
    gray = diff.convert("L").point(lambda p: 255 if p > 8 else 0)
    bbox = gray.getbbox()
    if not bbox:
        return rgb
    cropped = rgb.crop(bbox)
    return ImageOps.expand(cropped, border=pad, fill=(255, 255, 255))


def extract_chapter(chapter_id: str, spec: dict, pages_only: bool = False) -> None:
    pdf_path = REPO_ROOT / spec["pdf"]
    if not pdf_path.exists():
        raise FileNotFoundError(f"Missing PDF for {chapter_id}: {pdf_path}")

    doc = pymupdf.open(pdf_path)

    # 1. Render full PDF pages as WebP for fast Original NCERT PDF Page Peek
    page_dir = PUBLIC_PDF_PAGES / chapter_id
    page_dir.mkdir(parents=True, exist_ok=True)
    page_matrix = pymupdf.Matrix(2.0, 2.0)
    for page_idx in range(len(doc)):
        out_webp = page_dir / f"page-{page_idx + 1:02d}.webp"
        pix = doc[page_idx].get_pixmap(matrix=page_matrix, alpha=False)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        img.save(out_webp, format="WEBP", quality=86, method=4)

    print(f"[{chapter_id}] Rendered {len(doc)} PDF pages -> {page_dir.relative_to(REPO_ROOT)}")

    if pages_only:
        return

    # 2. Crop high-DPI NCERT figures
    diag_dir = PUBLIC_DIAGRAMS / chapter_id
    diag_dir.mkdir(parents=True, exist_ok=True)
    crop_matrix = pymupdf.Matrix(3.0, 3.0)

    for entry in spec.get("diagrams", []):
        page_num = int(entry["page"])
        x0, y0, x1, y1 = entry["rect"]
        clip = pymupdf.Rect(x0, y0, x1, y1)
        pix = doc[page_num - 1].get_pixmap(matrix=crop_matrix, clip=clip, alpha=False)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        cleaned = trim_whitespace_with_padding(img, pad=18)
        out_png = diag_dir / f"{entry['id']}.png"
        cleaned.save(out_png, format="PNG", optimize=True)
        print(
            f"  cropped {entry['id']}.png (p.{page_num}) -> {cleaned.width}x{cleaned.height}px"
        )


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract NCERT PDF pages and diagram crops.")
    parser.add_argument("--chapter", help="Process only a specific chapterId (e.g. ch08)")
    parser.add_argument("--pages-only", action="store_true", help="Only render full PDF pages")
    parser.add_argument("--inspect", help="Inspect bounding boxes of a root PDF file")
    args = parser.parse_args()

    if args.inspect:
        inspect_pdf(args.inspect)
        return

    manifest = json.loads(CROPS_FILE.read_text(encoding="utf-8"))
    targets = [args.chapter] if args.chapter else list(manifest.keys())
    for cid in targets:
        if cid not in manifest:
            raise KeyError(f"Chapter '{cid}' not found in {CROPS_FILE}")
        extract_chapter(cid, manifest[cid], pages_only=args.pages_only)


if __name__ == "__main__":
    main()
