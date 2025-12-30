# Card Analysis Scripts

This directory contains Python scripts for analyzing and exporting card data from The Vale of Eternity game.

## Scripts

### 1. `export-cards-json.py` (Recommended)

Exports card data from existing TypeScript files to JSON format. This is the most reliable method as it uses the source of truth (TypeScript definitions).

**Usage:**
```bash
# Using default output path
python export-cards-json.py

# Specify custom output file
python export-cards-json.py --output my-cards.json
```

**Output:** `cards-database.json` containing all 70 cards with:
- Card ID, name (English and Chinese)
- Cost and score
- Element type
- Effects with type, description, and values
- Image filename and existence check
- Statistics summary

### 2. `analyze-cards.py`

Analyzes card images using OCR (Optical Character Recognition) to extract card information. Useful for verifying image content or processing new card images.

**Prerequisites:**
1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Install Tesseract OCR:
   - **Windows:** Download from https://github.com/UB-Mannheim/tesseract/wiki
   - **Mac:** `brew install tesseract`
   - **Linux:** `sudo apt install tesseract-ocr`

**Usage:**
```bash
# Analyze all cards in default directory
python analyze-cards.py

# Analyze a single card
python analyze-cards.py --single 200px-Hestia.webp

# Verbose output
python analyze-cards.py --verbose

# Custom paths
python analyze-cards.py --input-dir /path/to/images --output /path/to/output.json
```

## Output Format

### cards-database.json

```json
{
  "version": "2.0.0",
  "totalCards": 70,
  "cards": {
    "F001": {
      "name": "Hestia",
      "nameTw": "赫斯提亞",
      "cost": 0,
      "score": 0,
      "element": "FIRE",
      "effects": [
        {
          "type": "PERMANENT",
          "effectType": "INCREASE_STONE_LIMIT",
          "description": "Your stone limit increases by 2.",
          "descriptionTw": "你的石頭上限增加 2。",
          "value": 2,
          "target": null
        }
      ],
      "flavorText": "Guardian of hearth and home.",
      "flavorTextTw": "家與爐火的守護者，賜予你更多承載力量的空間。",
      "imageUrl": "200px-Hestia.webp",
      "imageExists": true
    }
  },
  "statistics": {
    "byElement": { "FIRE": 15, "WATER": 15, ... },
    "byCost": { "0": 5, "1": 8, ... },
    "byEffectType": { "NONE": 10, "GAIN_STONES": 15, ... },
    "imagesFound": 70,
    "imagesMissing": 0
  }
}
```

## Effect Types

| Type | Symbol | Description |
|------|--------|-------------|
| INSTANT | Lightning | Triggered once when card is tamed |
| PERMANENT | Infinity | Always active while on field |
| SCORING | Hourglass | Calculated during score phase |
| NONE | - | No effect, score only |

## Card Elements

| Element | Prefix | Color |
|---------|--------|-------|
| FIRE | F | Red/Orange |
| WATER | W | Blue |
| EARTH | E | Green |
| WIND | A | Purple |
| DRAGON | D | Gold |

## File Structure

```
scripts/
├── README.md              # This file
├── requirements.txt       # Python dependencies
├── analyze-cards.py       # OCR-based image analyzer
├── export-cards-json.py   # TypeScript to JSON exporter
├── cards-database.json    # Generated card database
└── extracted-cards.json   # OCR extraction results (if generated)
```
