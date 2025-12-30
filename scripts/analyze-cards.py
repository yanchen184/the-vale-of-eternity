#!/usr/bin/env python3
"""
Card Image Analyzer for The Vale of Eternity
Extracts card information from images using OCR and image processing.

Usage:
    python analyze-cards.py [--input-dir PATH] [--output FILE] [--verbose]

@version 1.0.0
"""

import os
import sys
import json
import re
import argparse
import logging
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field, asdict
from enum import Enum

try:
    from PIL import Image, ImageEnhance, ImageFilter
except ImportError:
    print("Error: Pillow not installed. Run: pip install Pillow")
    sys.exit(1)

try:
    import pytesseract
except ImportError:
    print("Error: pytesseract not installed. Run: pip install pytesseract")
    print("Also ensure Tesseract OCR is installed on your system.")
    sys.exit(1)


# ============================================
# Configuration
# ============================================

# Default paths
DEFAULT_INPUT_DIR = Path(r"D:\claude-mode\the-vale-of-eternity\src\cards\base")
DEFAULT_OUTPUT_FILE = Path(r"D:\claude-mode\the-vale-of-eternity\scripts\extracted-cards.json")

# Tesseract configuration for Windows
# Update this path if Tesseract is installed elsewhere
TESSERACT_CMD_WINDOWS = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Card image regions (relative to 200px wide card)
# These are approximate regions based on the card layout
CARD_REGIONS = {
    "cost": (5, 35, 35, 75),           # Left side, top area
    "score": (165, 255, 195, 290),     # Right side, bottom area
    "name": (10, 165, 190, 195),       # Center, below image
    "effect_icon": (10, 200, 45, 235), # Left side, effect area
    "effect_text": (45, 200, 190, 260) # Right of icon, effect area
}


# ============================================
# Enums and Data Classes
# ============================================

class EffectSymbol(str, Enum):
    """Effect type symbols found on cards"""
    INSTANT = "INSTANT"      # Lightning bolt - triggered once when tamed
    PERMANENT = "PERMANENT"  # Infinity symbol - always active
    SCORING = "SCORING"      # Hourglass - calculated at game end
    NONE = "NONE"            # No effect


class Element(str, Enum):
    """Card element types"""
    FIRE = "FIRE"
    WATER = "WATER"
    EARTH = "EARTH"
    WIND = "WIND"
    DRAGON = "DRAGON"


@dataclass
class CardEffect:
    """Represents a card effect"""
    type: str
    symbol: str
    description: str


@dataclass
class ExtractedCard:
    """Extracted card data from image"""
    filename: str
    name: str = ""
    cost: Optional[int] = None
    score: Optional[int] = None
    element: Optional[str] = None
    effect_type: str = "NONE"
    effect_description: str = ""
    raw_text: str = ""
    confidence: float = 0.0
    errors: list = field(default_factory=list)


# ============================================
# Image Processing Functions
# ============================================

def setup_tesseract() -> bool:
    """Configure Tesseract OCR path for the system"""
    if sys.platform == "win32":
        if os.path.exists(TESSERACT_CMD_WINDOWS):
            pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD_WINDOWS
            return True
        else:
            # Try common installation paths
            common_paths = [
                r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
                r"C:\Tesseract-OCR\tesseract.exe",
            ]
            for path in common_paths:
                if os.path.exists(path):
                    pytesseract.pytesseract.tesseract_cmd = path
                    return True
            return False
    return True  # Linux/Mac usually have tesseract in PATH


def preprocess_image(image: Image.Image, region_type: str = "general") -> Image.Image:
    """
    Preprocess image for better OCR results.

    Args:
        image: PIL Image to process
        region_type: Type of region being processed (affects preprocessing)

    Returns:
        Preprocessed PIL Image
    """
    # Convert to RGB if necessary
    if image.mode != "RGB":
        image = image.convert("RGB")

    # Convert to grayscale
    gray = image.convert("L")

    # Increase contrast
    enhancer = ImageEnhance.Contrast(gray)
    enhanced = enhancer.enhance(2.0)

    # Apply sharpening
    sharpened = enhanced.filter(ImageFilter.SHARPEN)

    # For number regions, apply additional processing
    if region_type in ["cost", "score"]:
        # Increase size for better digit recognition
        width, height = sharpened.size
        sharpened = sharpened.resize((width * 3, height * 3), Image.Resampling.LANCZOS)

        # Binarize for cleaner digits
        threshold = 128
        sharpened = sharpened.point(lambda x: 255 if x > threshold else 0)

    return sharpened


def extract_region(image: Image.Image, region: tuple) -> Image.Image:
    """Extract a specific region from the card image"""
    return image.crop(region)


def detect_effect_symbol(image: Image.Image) -> str:
    """
    Detect the effect symbol from the effect icon region.

    Symbols:
    - Lightning bolt (zigzag): INSTANT effect (triggered on tame)
    - Infinity symbol (horizontal 8): PERMANENT effect (always active)
    - Hourglass: SCORING effect (calculated at end)
    """
    # Get the effect icon region
    icon_region = CARD_REGIONS["effect_icon"]
    icon_img = extract_region(image, icon_region)

    # Preprocess for symbol detection
    processed = preprocess_image(icon_img, "symbol")

    # Try OCR to detect symbols
    # These unicode characters might be detected
    text = pytesseract.image_to_string(processed, config="--psm 10 --oem 3")
    text = text.strip().lower()

    # Check for known symbols or their OCR representations
    if any(char in text for char in ["z", "n", "~", "lightning"]):
        return EffectSymbol.INSTANT.value
    elif any(char in text for char in ["8", "o", "infinity", "oo"]):
        return EffectSymbol.PERMANENT.value
    elif any(char in text for char in ["hourglass", "timer", "x"]):
        return EffectSymbol.SCORING.value

    return EffectSymbol.NONE.value


def extract_number(image: Image.Image, region: tuple) -> Optional[int]:
    """Extract a number from a specific region of the card"""
    try:
        region_img = extract_region(image, region)
        processed = preprocess_image(region_img, "number")

        # Use PSM 10 for single character, PSM 7 for single line
        config = "--psm 10 --oem 3 -c tessedit_char_whitelist=0123456789"
        text = pytesseract.image_to_string(processed, config=config)

        # Extract digits
        digits = re.findall(r"\d+", text)
        if digits:
            return int(digits[0])
        return None
    except Exception as e:
        logging.warning(f"Failed to extract number: {e}")
        return None


def extract_text(image: Image.Image, region: tuple, lang: str = "eng") -> str:
    """Extract text from a specific region of the card"""
    try:
        region_img = extract_region(image, region)
        processed = preprocess_image(region_img, "text")

        # PSM 6 for uniform block of text
        config = f"--psm 6 --oem 3 -l {lang}"
        text = pytesseract.image_to_string(processed, config=config)

        return text.strip()
    except Exception as e:
        logging.warning(f"Failed to extract text: {e}")
        return ""


def detect_element_from_color(image: Image.Image) -> Optional[str]:
    """
    Detect card element based on dominant colors.

    Color associations:
    - Red/Orange: FIRE
    - Blue/Cyan: WATER
    - Green/Brown: EARTH
    - Purple/Pink: WIND
    - Gold/Yellow: DRAGON
    """
    # Get corner region for element detection (usually has element icon)
    corner = image.crop((170, 5, 195, 30))

    # Calculate average color
    pixels = list(corner.getdata())
    if not pixels:
        return None

    r_avg = sum(p[0] for p in pixels) / len(pixels)
    g_avg = sum(p[1] for p in pixels) / len(pixels)
    b_avg = sum(p[2] for p in pixels) / len(pixels)

    # Determine element based on color
    if r_avg > 180 and g_avg < 100 and b_avg < 100:
        return Element.FIRE.value
    elif b_avg > 150 and r_avg < 100:
        return Element.WATER.value
    elif g_avg > 150 and r_avg < 150 and b_avg < 100:
        return Element.EARTH.value
    elif r_avg > 150 and b_avg > 150 and g_avg < 150:
        return Element.WIND.value
    elif r_avg > 200 and g_avg > 150 and b_avg < 100:
        return Element.DRAGON.value

    return None


# ============================================
# Card Name Extraction from Filename
# ============================================

def extract_name_from_filename(filename: str) -> str:
    """
    Extract card name from filename.
    Example: '200px-Hestia.webp' -> 'Hestia'
    """
    # Remove extension
    name = Path(filename).stem

    # Remove size prefix (e.g., '200px-')
    name = re.sub(r"^\d+px-", "", name)

    # Convert camelCase or concatenated words to spaces
    # e.g., 'BurningSkull' -> 'Burning Skull'
    name = re.sub(r"([a-z])([A-Z])", r"\1 \2", name)

    # Handle special cases
    name = name.replace("spirit", " Spirit")
    name = name.replace("giant", " Giant")
    name = name.replace("golem", " Golem")
    name = name.replace("queen", " Queen")
    name = name.replace("exalted", " Exalted")
    name = name.replace("soldier", " Soldier")
    name = name.replace("maiden", " Maiden")
    name = name.replace("skull", " Skull")
    name = name.replace("egg", " Egg")
    name = name.replace("onna", "-onna")

    # Clean up multiple spaces
    name = " ".join(name.split())

    return name.title()


# ============================================
# Main Analysis Functions
# ============================================

def analyze_card_image(image_path: Path, verbose: bool = False) -> ExtractedCard:
    """
    Analyze a single card image and extract all information.

    Args:
        image_path: Path to the card image
        verbose: Whether to print detailed progress

    Returns:
        ExtractedCard with extracted information
    """
    card = ExtractedCard(filename=image_path.name)

    try:
        # Load image
        image = Image.open(image_path)

        if image.mode != "RGB":
            image = image.convert("RGB")

        # Extract name from filename (most reliable method)
        card.name = extract_name_from_filename(image_path.name)

        if verbose:
            logging.info(f"Processing: {card.name}")

        # Extract cost (top-left number)
        card.cost = extract_number(image, CARD_REGIONS["cost"])

        # Extract score (bottom-right number)
        card.score = extract_number(image, CARD_REGIONS["score"])

        # Detect element from colors
        card.element = detect_element_from_color(image)

        # Detect effect type from symbol
        card.effect_type = detect_effect_symbol(image)

        # Extract effect text
        effect_text = extract_text(image, CARD_REGIONS["effect_text"])
        card.effect_description = effect_text

        # Get full card text for reference
        full_text = pytesseract.image_to_string(image, config="--psm 6 --oem 3")
        card.raw_text = full_text.strip()

        # Calculate confidence based on successful extractions
        fields_extracted = sum([
            bool(card.name),
            card.cost is not None,
            card.score is not None,
            bool(card.element),
            bool(card.effect_description)
        ])
        card.confidence = fields_extracted / 5.0

    except Exception as e:
        card.errors.append(str(e))
        logging.error(f"Error analyzing {image_path}: {e}")

    return card


def analyze_all_cards(
    input_dir: Path,
    output_file: Path,
    verbose: bool = False
) -> dict:
    """
    Analyze all card images in a directory.

    Args:
        input_dir: Directory containing card images
        output_file: Path to save JSON output
        verbose: Whether to print detailed progress

    Returns:
        Dictionary of extracted card data
    """
    results = {}

    # Get all webp images
    image_files = sorted(input_dir.glob("*.webp"))

    if not image_files:
        logging.warning(f"No .webp files found in {input_dir}")
        return results

    logging.info(f"Found {len(image_files)} card images to analyze")

    # Process each image
    for i, image_path in enumerate(image_files, 1):
        if verbose:
            print(f"[{i}/{len(image_files)}] Analyzing {image_path.name}...")

        card = analyze_card_image(image_path, verbose)

        # Generate card ID from name
        card_id = generate_card_id(card.name, card.element)

        # Convert to dictionary format
        results[card_id] = {
            "name": card.name,
            "cost": card.cost,
            "score": card.score,
            "element": card.element,
            "effects": [{
                "type": card.effect_type,
                "description": card.effect_description
            }] if card.effect_description else [],
            "confidence": card.confidence,
            "filename": card.filename,
            "raw_text": card.raw_text if verbose else None
        }

        # Remove None values
        results[card_id] = {k: v for k, v in results[card_id].items() if v is not None}

    # Save to JSON
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    logging.info(f"Results saved to {output_file}")

    return results


def generate_card_id(name: str, element: Optional[str]) -> str:
    """
    Generate a card ID based on name and element.
    Format: X### where X is element initial
    """
    element_prefixes = {
        "FIRE": "F",
        "WATER": "W",
        "EARTH": "E",
        "WIND": "A",  # Air
        "DRAGON": "D"
    }

    prefix = element_prefixes.get(element, "U")  # U for Unknown

    # Create a simple hash from name
    name_hash = abs(hash(name.lower())) % 1000

    return f"{prefix}{name_hash:03d}"


# ============================================
# Alternative: Use Existing Data + Image Verification
# ============================================

def verify_cards_with_existing_data(
    input_dir: Path,
    existing_data_path: Path,
    output_file: Path,
    verbose: bool = False
) -> dict:
    """
    Verify card images against existing TypeScript card data.
    This is more reliable than pure OCR extraction.

    Args:
        input_dir: Directory containing card images
        existing_data_path: Path to existing card data (JSON export)
        output_file: Path to save verification results
        verbose: Whether to print detailed progress

    Returns:
        Dictionary with verification results
    """
    # Load existing data if available
    existing_data = {}
    if existing_data_path.exists():
        with open(existing_data_path, "r", encoding="utf-8") as f:
            existing_data = json.load(f)

    results = {}
    image_files = sorted(input_dir.glob("*.webp"))

    for image_path in image_files:
        name = extract_name_from_filename(image_path.name)

        # Try to match with existing data
        matched_card = None
        for card_id, card_data in existing_data.items():
            if card_data.get("name", "").lower() == name.lower():
                matched_card = card_data
                matched_card["id"] = card_id
                break

        if matched_card:
            results[matched_card["id"]] = {
                **matched_card,
                "image_file": image_path.name,
                "verified": True
            }
        else:
            # Fallback to OCR extraction
            card = analyze_card_image(image_path, verbose)
            card_id = generate_card_id(card.name, card.element)
            results[card_id] = {
                "name": card.name,
                "cost": card.cost,
                "score": card.score,
                "effects": [{
                    "type": card.effect_type,
                    "description": card.effect_description
                }] if card.effect_description else [],
                "image_file": image_path.name,
                "verified": False,
                "confidence": card.confidence
            }

    # Save results
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    return results


# ============================================
# CLI Entry Point
# ============================================

def main():
    """Main entry point for the card analyzer"""
    parser = argparse.ArgumentParser(
        description="Analyze card images and extract information using OCR"
    )
    parser.add_argument(
        "--input-dir", "-i",
        type=Path,
        default=DEFAULT_INPUT_DIR,
        help=f"Directory containing card images (default: {DEFAULT_INPUT_DIR})"
    )
    parser.add_argument(
        "--output", "-o",
        type=Path,
        default=DEFAULT_OUTPUT_FILE,
        help=f"Output JSON file (default: {DEFAULT_OUTPUT_FILE})"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Print detailed progress information"
    )
    parser.add_argument(
        "--single", "-s",
        type=str,
        help="Analyze a single card image (filename only)"
    )

    args = parser.parse_args()

    # Setup logging
    log_level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s - %(levelname)s - %(message)s"
    )

    # Check Tesseract installation
    if not setup_tesseract():
        logging.error(
            "Tesseract OCR not found. Please install it:\n"
            "  Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki\n"
            "  Mac: brew install tesseract\n"
            "  Linux: sudo apt install tesseract-ocr"
        )
        sys.exit(1)

    logging.info("Tesseract OCR configured successfully")

    # Verify input directory
    if not args.input_dir.exists():
        logging.error(f"Input directory not found: {args.input_dir}")
        sys.exit(1)

    # Single card analysis
    if args.single:
        single_path = args.input_dir / args.single
        if not single_path.exists():
            logging.error(f"Card image not found: {single_path}")
            sys.exit(1)

        card = analyze_card_image(single_path, verbose=True)
        print("\n" + "=" * 50)
        print(f"Card Analysis Results: {card.name}")
        print("=" * 50)
        print(f"  Filename: {card.filename}")
        print(f"  Name: {card.name}")
        print(f"  Cost: {card.cost}")
        print(f"  Score: {card.score}")
        print(f"  Element: {card.element}")
        print(f"  Effect Type: {card.effect_type}")
        print(f"  Effect: {card.effect_description}")
        print(f"  Confidence: {card.confidence:.0%}")
        if card.errors:
            print(f"  Errors: {card.errors}")
        print("\nRaw OCR Text:")
        print("-" * 50)
        print(card.raw_text)
        return

    # Batch analysis
    logging.info(f"Starting batch analysis of {args.input_dir}")
    results = analyze_all_cards(args.input_dir, args.output, args.verbose)

    # Print summary
    print("\n" + "=" * 50)
    print("Analysis Complete")
    print("=" * 50)
    print(f"  Total cards analyzed: {len(results)}")

    # Calculate average confidence
    confidences = [c.get("confidence", 0) for c in results.values()]
    if confidences:
        avg_confidence = sum(confidences) / len(confidences)
        print(f"  Average confidence: {avg_confidence:.0%}")

    # Count by element
    elements = {}
    for card in results.values():
        elem = card.get("element", "Unknown")
        elements[elem] = elements.get(elem, 0) + 1

    print("\n  Cards by element:")
    for elem, count in sorted(elements.items()):
        print(f"    {elem}: {count}")

    print(f"\n  Results saved to: {args.output}")


if __name__ == "__main__":
    main()
