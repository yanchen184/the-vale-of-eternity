#!/usr/bin/env python3
"""
Card Data Exporter for The Vale of Eternity
Exports card data from existing TypeScript files to JSON format.

This script parses the TypeScript card definition files and generates
a comprehensive JSON file that can be used for reference or validation.

Usage:
    python export-cards-json.py [--output FILE]

@version 1.0.0
"""

import os
import sys
import json
import re
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field, asdict


# ============================================
# Configuration
# ============================================

PROJECT_ROOT = Path(r"D:\claude-mode\the-vale-of-eternity")
CARDS_DIR = PROJECT_ROOT / "src" / "data" / "cards"
IMAGES_DIR = PROJECT_ROOT / "src" / "cards" / "base"
DEFAULT_OUTPUT = PROJECT_ROOT / "scripts" / "cards-database.json"


# ============================================
# Data Classes
# ============================================

@dataclass
class CardData:
    """Complete card data structure"""
    id: str
    name: str
    nameTw: str
    element: str
    cost: int
    baseScore: int
    effectType: str
    effectTrigger: str
    effectValue: Optional[int] = None
    effectTarget: Optional[str] = None
    effectDescription: str = ""
    effectDescriptionTw: str = ""
    flavorText: str = ""
    flavorTextTw: str = ""
    imageUrl: str = ""
    imageExists: bool = False


# ============================================
# TypeScript Parser
# ============================================

def parse_typescript_cards(file_path: Path) -> list[dict]:
    """
    Parse card definitions from a TypeScript file.

    Args:
        file_path: Path to the TypeScript file

    Returns:
        List of card data dictionaries
    """
    cards = []

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Find all card objects in the array
    # Pattern matches objects within the array
    card_pattern = re.compile(
        r"\{\s*"
        r"id:\s*['\"]([^'\"]+)['\"],?\s*"
        r"name:\s*['\"]([^'\"]+)['\"],?\s*"
        r"nameTw:\s*['\"]([^'\"]+)['\"],?\s*"
        r"element:\s*Element\.(\w+),?\s*"
        r"cost:\s*(\d+),?\s*"
        r"baseScore:\s*(\d+),?\s*"
        r"effectType:\s*EffectType\.(\w+),?\s*"
        r"effectTrigger:\s*EffectTrigger\.(\w+),?\s*"
        r"(?:effectValue:\s*(\d+),?\s*)?"
        r"(?:effectTarget:\s*Element\.(\w+),?\s*)?"
        r"effectDescription:\s*['\"]([^'\"]*)['\"],?\s*"
        r"effectDescriptionTw:\s*['\"]([^'\"]*)['\"],?\s*"
        r"(?:flavorText:\s*['\"]([^'\"]*)['\"],?\s*)?"
        r"(?:flavorTextTw:\s*['\"]([^'\"]*)['\"],?\s*)?"
        r"(?:imageUrl:\s*['\"]([^'\"]*)['\"],?\s*)?"
        r"\}",
        re.MULTILINE | re.DOTALL
    )

    matches = card_pattern.findall(content)

    for match in matches:
        card = {
            "id": match[0],
            "name": match[1],
            "nameTw": match[2],
            "element": match[3],
            "cost": int(match[4]),
            "baseScore": int(match[5]),
            "effectType": match[6],
            "effectTrigger": match[7],
            "effectValue": int(match[8]) if match[8] else None,
            "effectTarget": match[9] if match[9] else None,
            "effectDescription": match[10],
            "effectDescriptionTw": match[11],
            "flavorText": match[12] if len(match) > 12 and match[12] else "",
            "flavorTextTw": match[13] if len(match) > 13 and match[13] else "",
            "imageUrl": match[14] if len(match) > 14 and match[14] else "",
        }
        cards.append(card)

    return cards


def parse_cards_simple(file_path: Path) -> list[dict]:
    """
    Simpler parser that extracts cards using a more flexible approach.
    """
    cards = []

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Split into individual card blocks
    # Find content between { and },
    blocks = re.findall(r"\{([^{}]+)\}", content, re.DOTALL)

    for block in blocks:
        # Skip if it doesn't look like a card (must have id field)
        if "id:" not in block:
            continue

        card = {}

        # Extract each field
        patterns = {
            "id": r"id:\s*['\"]([^'\"]+)['\"]",
            "name": r"name:\s*['\"]([^'\"]+)['\"]",
            "nameTw": r"nameTw:\s*['\"]([^'\"]+)['\"]",
            "element": r"element:\s*Element\.(\w+)",
            "cost": r"cost:\s*(\d+)",
            "baseScore": r"baseScore:\s*(\d+)",
            "effectType": r"effectType:\s*EffectType\.(\w+)",
            "effectTrigger": r"effectTrigger:\s*EffectTrigger\.(\w+)",
            "effectValue": r"effectValue:\s*(\d+)",
            "effectTarget": r"effectTarget:\s*Element\.(\w+)",
            "effectDescription": r"effectDescription:\s*['\"]([^'\"]*)['\"]",
            "effectDescriptionTw": r"effectDescriptionTw:\s*['\"]([^'\"]*)['\"]",
            "flavorText": r"flavorText:\s*['\"]([^'\"]*)['\"]",
            "flavorTextTw": r"flavorTextTw:\s*['\"]([^'\"]*)['\"]",
            "imageUrl": r"imageUrl:\s*['\"]([^'\"]*)['\"]",
        }

        for field, pattern in patterns.items():
            match = re.search(pattern, block)
            if match:
                value = match.group(1)
                # Convert numeric fields
                if field in ["cost", "baseScore", "effectValue"]:
                    value = int(value)
                card[field] = value

        # Only add if we got essential fields
        if "id" in card and "name" in card:
            cards.append(card)

    return cards


def check_image_exists(image_url: str) -> bool:
    """Check if the card image exists"""
    if not image_url:
        return False
    image_path = IMAGES_DIR / image_url
    return image_path.exists()


def export_all_cards(output_path: Path) -> dict:
    """
    Export all cards from TypeScript files to JSON.

    Args:
        output_path: Path to save the JSON output

    Returns:
        Dictionary containing all card data
    """
    all_cards = {}

    # Find all card definition files
    card_files = [
        CARDS_DIR / "fire-cards.ts",
        CARDS_DIR / "water-cards.ts",
        CARDS_DIR / "earth-cards.ts",
        CARDS_DIR / "wind-cards.ts",
        CARDS_DIR / "dragon-cards.ts",
    ]

    for card_file in card_files:
        if not card_file.exists():
            print(f"Warning: Card file not found: {card_file}")
            continue

        print(f"Parsing: {card_file.name}")
        cards = parse_cards_simple(card_file)

        for card in cards:
            card_id = card.get("id", "")
            if card_id:
                # Check if image exists
                image_url = card.get("imageUrl", "")
                card["imageExists"] = check_image_exists(image_url)

                # Convert to output format
                all_cards[card_id] = {
                    "name": card.get("name", ""),
                    "nameTw": card.get("nameTw", ""),
                    "cost": card.get("cost", 0),
                    "score": card.get("baseScore", 0),
                    "element": card.get("element", ""),
                    "effects": [{
                        "type": map_effect_trigger(card.get("effectTrigger", "NONE")),
                        "effectType": card.get("effectType", "NONE"),
                        "description": card.get("effectDescription", ""),
                        "descriptionTw": card.get("effectDescriptionTw", ""),
                        "value": card.get("effectValue"),
                        "target": card.get("effectTarget"),
                    }] if card.get("effectType", "NONE") != "NONE" else [],
                    "flavorText": card.get("flavorText", ""),
                    "flavorTextTw": card.get("flavorTextTw", ""),
                    "imageUrl": card.get("imageUrl", ""),
                    "imageExists": card.get("imageExists", False),
                }

    # Save to JSON
    output_data = {
        "version": "2.0.0",
        "totalCards": len(all_cards),
        "cards": all_cards,
        "statistics": generate_statistics(all_cards)
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    return output_data


def map_effect_trigger(trigger: str) -> str:
    """Map effect trigger to symbol type"""
    mapping = {
        "ON_TAME": "INSTANT",      # Lightning bolt
        "PERMANENT": "PERMANENT",  # Infinity
        "ON_SCORE": "SCORING",     # Hourglass
        "NONE": "NONE"
    }
    return mapping.get(trigger, "NONE")


def generate_statistics(cards: dict) -> dict:
    """Generate statistics about the card collection"""
    stats = {
        "byElement": {},
        "byCost": {},
        "byEffectType": {},
        "imagesFound": 0,
        "imagesMissing": 0
    }

    for card_id, card in cards.items():
        # Count by element
        element = card.get("element", "Unknown")
        stats["byElement"][element] = stats["byElement"].get(element, 0) + 1

        # Count by cost
        cost = str(card.get("cost", 0))
        stats["byCost"][cost] = stats["byCost"].get(cost, 0) + 1

        # Count by effect type
        effects = card.get("effects", [])
        if effects:
            effect_type = effects[0].get("effectType", "NONE")
        else:
            effect_type = "NONE"
        stats["byEffectType"][effect_type] = stats["byEffectType"].get(effect_type, 0) + 1

        # Count images
        if card.get("imageExists"):
            stats["imagesFound"] += 1
        else:
            stats["imagesMissing"] += 1

    return stats


# ============================================
# Main Entry Point
# ============================================

def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Export card data from TypeScript to JSON"
    )
    parser.add_argument(
        "--output", "-o",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Output JSON file (default: {DEFAULT_OUTPUT})"
    )

    args = parser.parse_args()

    print("=" * 50)
    print("Card Data Exporter")
    print("=" * 50)
    print(f"Project root: {PROJECT_ROOT}")
    print(f"Cards directory: {CARDS_DIR}")
    print(f"Images directory: {IMAGES_DIR}")
    print(f"Output file: {args.output}")
    print()

    # Check directories exist
    if not CARDS_DIR.exists():
        print(f"Error: Cards directory not found: {CARDS_DIR}")
        sys.exit(1)

    # Export cards
    data = export_all_cards(args.output)

    # Print summary
    print()
    print("=" * 50)
    print("Export Complete")
    print("=" * 50)
    print(f"  Total cards: {data['totalCards']}")
    print()
    print("  Cards by element:")
    for elem, count in sorted(data["statistics"]["byElement"].items()):
        print(f"    {elem}: {count}")
    print()
    print("  Cards by cost:")
    for cost, count in sorted(data["statistics"]["byCost"].items(), key=lambda x: int(x[0])):
        print(f"    Cost {cost}: {count}")
    print()
    print(f"  Images found: {data['statistics']['imagesFound']}")
    print(f"  Images missing: {data['statistics']['imagesMissing']}")
    print()
    print(f"  Output saved to: {args.output}")


if __name__ == "__main__":
    main()
