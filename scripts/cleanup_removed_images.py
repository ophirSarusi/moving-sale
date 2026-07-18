#!/usr/bin/env python3
"""Delete item photos whose references were removed from data/items.json."""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path, PurePosixPath
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
ITEMS_FILE = ROOT / "data" / "items.json"
SOURCE_ROOT = ROOT / "media" / "items"
OPTIMIZED_ROOT = ROOT / "media" / "optimized"
OPTIMIZED_VARIANTS = ("thumb", "card", "dialog")
SOURCE_PREFIX = PurePosixPath("media/items")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--before-ref",
        required=True,
        help="Git commit before the content change.",
    )
    return parser.parse_args()


def load_items_payload(text: str) -> Any:
    return json.loads(text)


def item_records(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        records = payload
    elif isinstance(payload, dict) and isinstance(payload.get("items"), list):
        records = payload["items"]
    else:
        return []
    return [record for record in records if isinstance(record, dict)]


def normalize_image_reference(value: Any) -> PurePosixPath | None:
    if not isinstance(value, str):
        return None

    cleaned = value.strip().replace("\\", "/")
    if not cleaned or "://" in cleaned or cleaned.startswith(("data:", "blob:")):
        return None

    cleaned = cleaned.removeprefix("./").lstrip("/")
    path = PurePosixPath(cleaned)
    if ".." in path.parts or not path.is_relative_to(SOURCE_PREFIX):
        return None
    return path


def collect_image_references(payload: Any) -> set[PurePosixPath]:
    references: set[PurePosixPath] = set()
    for item in item_records(payload):
        images = item.get("images")
        if not isinstance(images, list):
            continue
        for value in images:
            normalized = normalize_image_reference(value)
            if normalized is not None:
                references.add(normalized)
    return references


def load_previous_payload(before_ref: str) -> Any | None:
    result = subprocess.run(
        ["git", "show", f"{before_ref}:data/items.json"],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print("Previous data/items.json is unavailable; skipping media deletion.")
        return None
    return load_items_payload(result.stdout)


def remove_file(path: Path) -> bool:
    try:
        path.unlink()
    except FileNotFoundError:
        return False
    return True


def delete_removed_reference(reference: PurePosixPath) -> list[Path]:
    relative_source = reference.relative_to(SOURCE_PREFIX)
    deleted: list[Path] = []

    source_path = SOURCE_ROOT.joinpath(*relative_source.parts)
    if remove_file(source_path):
        deleted.append(source_path)

    for variant in OPTIMIZED_VARIANTS:
        derivative = (
            OPTIMIZED_ROOT
            / variant
            / Path(*relative_source.parent.parts)
            / f"{relative_source.name}.webp"
        )
        if remove_file(derivative):
            deleted.append(derivative)

    return deleted


def main() -> None:
    args = parse_args()
    previous_payload = load_previous_payload(args.before_ref)
    if previous_payload is None:
        return

    current_payload = load_items_payload(ITEMS_FILE.read_text(encoding="utf-8"))
    previous_references = collect_image_references(previous_payload)
    current_references = collect_image_references(current_payload)

    removed_references = previous_references - current_references
    if not removed_references:
        print("No image references were removed.")
        return

    deleted: list[Path] = []
    for reference in sorted(removed_references, key=str):
        # A reference still present in another item remains in current_references
        # and therefore never reaches this deletion branch.
        deleted.extend(delete_removed_reference(reference))

    if deleted:
        print(f"Deleted {len(deleted)} unreferenced image files:")
        for path in deleted:
            print(f"- {path.relative_to(ROOT)}")
    else:
        print("Removed references had no matching files in the repository.")


if __name__ == "__main__":
    main()
