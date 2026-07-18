#!/usr/bin/env python3
"""Generate lightweight, high-fidelity derivatives for storefront photos."""

from __future__ import annotations

import io
import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageFile, ImageOps, JpegImagePlugin, UnidentifiedImageError

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "media" / "items"
OUTPUT_ROOT = ROOT / "media" / "optimized"
MANIFEST_PATH = OUTPUT_ROOT / "manifest.json"
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
VARIANTS = {
    "card": {"max_edge": 960},
    "dialog": {"max_edge": 1600},
}
GENERATED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# Phone exports and messaging apps sometimes leave a few trailing bytes missing
# even though the visible image data is intact.
ImageFile.LOAD_TRUNCATED_IMAGES = True


def iter_sources() -> list[Path]:
    if not SOURCE_DIR.exists():
        return []
    return sorted(
        path
        for path in SOURCE_DIR.rglob("*")
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
    )


def output_path(source: Path, variant: str, extension: str) -> Path:
    relative = source.relative_to(SOURCE_DIR)
    return OUTPUT_ROOT / variant / relative.parent / f"{relative.name}{extension}"


def jpeg_source_settings(opened: Image.Image) -> dict[str, Any]:
    settings: dict[str, Any] = {}

    quantization = getattr(opened, "quantization", None)
    if quantization:
        settings["qtables"] = quantization

    try:
        sampling = JpegImagePlugin.get_sampling(opened)
    except (AttributeError, ValueError):
        sampling = -1
    if sampling in (0, 1, 2):
        settings["subsampling"] = sampling

    return settings


def encode_jpeg(
    image: Image.Image,
    source_settings: dict[str, Any],
    icc_profile: bytes | None,
) -> bytes:
    buffer = io.BytesIO()
    save_options: dict[str, Any] = {
        "format": "JPEG",
        "optimize": True,
        "progressive": True,
    }

    if source_settings.get("qtables"):
        # Reuse the phone JPEG's own quantization tables and chroma sampling
        # rather than assigning a new arbitrary quality level.
        save_options.update(source_settings)
    else:
        save_options.update({"quality": 94, "subsampling": 0})

    if icc_profile:
        save_options["icc_profile"] = icc_profile

    image.convert("RGB").save(buffer, **save_options)
    return buffer.getvalue()


def encode_alpha_webp(image: Image.Image, icc_profile: bytes | None) -> bytes:
    buffer = io.BytesIO()
    save_options: dict[str, Any] = {
        "format": "WEBP",
        "lossless": True,
        "quality": 90,
        "method": 6,
        "exact": True,
    }
    if icc_profile:
        save_options["icc_profile"] = icc_profile
    image.convert("RGBA").save(buffer, **save_options)
    return buffer.getvalue()


def encode_source_variants(source: Path) -> dict[str, tuple[str, bytes]]:
    with Image.open(source) as opened:
        if getattr(opened, "is_animated", False):
            opened.seek(0)

        source_format = (opened.format or "").upper()
        icc_profile = opened.info.get("icc_profile")
        source_settings = jpeg_source_settings(opened) if source_format == "JPEG" else {}
        base = ImageOps.exif_transpose(opened)
        has_alpha = "A" in base.getbands() or "transparency" in base.info

        encoded: dict[str, tuple[str, bytes]] = {}
        for variant, settings in VARIANTS.items():
            resized = base.copy()
            max_edge = settings["max_edge"]
            resized.thumbnail((max_edge, max_edge), Image.Resampling.LANCZOS)

            if has_alpha:
                encoded[variant] = (".webp", encode_alpha_webp(resized, icc_profile))
            else:
                encoded[variant] = (
                    ".jpg",
                    encode_jpeg(resized, source_settings, icc_profile),
                )

        return encoded


def write_if_changed(path: Path, content: bytes) -> bool:
    if path.exists() and path.read_bytes() == content:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)
    return True


def write_manifest(manifest: dict[str, dict[str, str]]) -> bool:
    payload = json.dumps(
        {"version": 2, "images": manifest},
        ensure_ascii=False,
        indent=2,
        sort_keys=True,
    ).encode("utf-8") + b"\n"
    return write_if_changed(MANIFEST_PATH, payload)


def remove_stale_outputs(expected: set[Path]) -> int:
    removed = 0
    if not OUTPUT_ROOT.exists():
        return removed

    for path in sorted(OUTPUT_ROOT.rglob("*")):
        if (
            path.is_file()
            and path != MANIFEST_PATH
            and path.suffix.lower() in GENERATED_EXTENSIONS
            and path not in expected
        ):
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
            encoded_variants = encode_source_variants(source)
        except (OSError, UnidentifiedImageError, ValueError) as error:
            skipped.append((relative_source, str(error)))
            print(f"Warning: skipped {relative_source}: {error}")
            continue

        processed += 1
        original_bytes += source.stat().st_size
        manifest[original_key] = {}

        for variant, (extension, encoded) in encoded_variants.items():
            destination = output_path(source, variant, extension)
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
