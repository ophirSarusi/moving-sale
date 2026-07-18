#!/usr/bin/env python3
"""Generate lightweight WebP derivatives for storefront item photos."""

from __future__ import annotations

import io
import json
from pathlib import Path

from PIL import Image, ImageFile, ImageOps, UnidentifiedImageError

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "media" / "items"
OUTPUT_ROOT = ROOT / "media" / "optimized"
MANIFEST_PATH = OUTPUT_ROOT / "manifest.json"
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
VARIANTS = {
    "card": {"max_edge": 640, "quality": 78},
    "dialog": {"max_edge": 1280, "quality": 82},
}

# Phone exports and messaging apps sometimes leave a few trailing bytes missing
# even though the visible image data is intact. Pillow can safely decode those
# minor truncations instead of aborting the entire optimization batch.
ImageFile.LOAD_TRUNCATED_IMAGES = True


def iter_sources() -> list[Path]:
    if not SOURCE_DIR.exists():
        return []
    return sorted(
        path
        for path in SOURCE_DIR.rglob("*")
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
    )


def output_path(source: Path, variant: str) -> Path:
    relative = source.relative_to(SOURCE_DIR)
    return OUTPUT_ROOT / variant / relative.parent / f"{relative.name}.webp"


def encode_variant(source: Path, max_edge: int, quality: int) -> bytes:
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened)
        if getattr(image, "is_animated", False):
            image.seek(0)
        image.thumbnail((max_edge, max_edge), Image.Resampling.LANCZOS)

        has_alpha = "A" in image.getbands() or "transparency" in image.info
        image = image.convert("RGBA" if has_alpha else "RGB")

        buffer = io.BytesIO()
        image.save(
            buffer,
            format="WEBP",
            quality=quality,
            method=6,
            exact=has_alpha,
        )
        return buffer.getvalue()


def write_if_changed(path: Path, content: bytes) -> bool:
    if path.exists() and path.read_bytes() == content:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)
    return True


def write_manifest(manifest: dict[str, dict[str, str]]) -> bool:
    payload = json.dumps(
        {"version": 1, "images": manifest},
        ensure_ascii=False,
        indent=2,
        sort_keys=True,
    ).encode("utf-8") + b"\n"
    return write_if_changed(MANIFEST_PATH, payload)


def remove_stale_outputs(expected: set[Path]) -> int:
    removed = 0
    if not OUTPUT_ROOT.exists():
        return removed

    for path in sorted(OUTPUT_ROOT.rglob("*.webp")):
        if path not in expected:
            path.unlink()
            removed += 1

    for directory in sorted(
        (path for path in OUTPUT_ROOT.rglob("*") if path.is_dir()),
        reverse=True,
    ):
        try:
            directory.rmdir()
        except OSError:
            pass

    return removed


def main() -> None:
    sources = iter_sources()
    expected: set[Path] = set()
    manifest: dict[str, dict[str, str]] = {}
    changed = 0
    processed = 0
    skipped: list[tuple[str, str]] = []
    original_bytes = 0
    optimized_bytes = 0

    for source in sources:
        relative_source = source.relative_to(SOURCE_DIR).as_posix()
        original_key = f"media/items/{relative_source}"

        try:
            encoded_variants = {
                variant: encode_variant(source, **settings)
                for variant, settings in VARIANTS.items()
            }
        except (OSError, UnidentifiedImageError, ValueError) as error:
            skipped.append((relative_source, str(error)))
            print(f"Warning: skipped {relative_source}: {error}")
            continue

        processed += 1
        original_bytes += source.stat().st_size
        manifest[original_key] = {}

        for variant, encoded in encoded_variants.items():
            destination = output_path(source, variant)
            expected.add(destination)
            manifest[original_key][variant] = destination.relative_to(ROOT).as_posix()
            optimized_bytes += len(encoded)
            changed += int(write_if_changed(destination, encoded))

    changed += int(write_manifest(manifest))
    removed = remove_stale_outputs(expected)
    print(
        f"Processed {processed}/{len(sources)} originals into {len(expected)} derivatives; "
        f"updated {changed}, removed {removed}, skipped {len(skipped)}."
    )
    if original_bytes:
        ratio = optimized_bytes / original_bytes
        print(
            f"Originals: {original_bytes / 1_048_576:.1f} MiB; "
            f"all derivatives: {optimized_bytes / 1_048_576:.1f} MiB "
            f"({ratio:.0%} of original bytes across both sizes)."
        )


if __name__ == "__main__":
    main()
