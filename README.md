# glow up guide — V3

Flask fashion styling MVP with a neutral white / black / beige visual system and sky-blue accents.

## V3 changes

- Removed hot pink / neon green / heavy black section backgrounds.
- Kept the sky/cloud visual language as the main accent.
- Product images must successfully become transparent cutouts before new imported items are saved.
- Legacy non-cutout wardrobe items are checked again when dropped onto the mannequin.
- Product image URL requests send the source product page as a Referer when available.
- `/api/health` exposes rembg availability, Python version, and rembg import errors.

## Python requirement for rembg

Use Python 3.11, 3.12, or 3.13. Python 3.12 is recommended for this project.

Check:

```powershell
python --version
```

If needed with Conda/Miniforge:

```powershell
conda create -n glowguide python=3.12
conda activate glowguide
pip install -r requirements.txt
```

## Run

```powershell
python app.py
```

Then open:

http://127.0.0.1:5000

## Font

The CSS expects this local path:

`static/fonts/Slabo13px-Regular.ttf`

Place your own font file there locally. The downloadable project does not include font binaries.

## Cutout troubleshooting

Open this URL while Flask is running:

`http://127.0.0.1:5000/api/health`

Expected:

```json
{
  "ok": true,
  "rembg_available": true
}
```

If `rembg_available` is false, reinstall dependencies in a supported Python environment and restart Flask.

When a shopping site's image CDN blocks server-side downloads, use the product image upload field instead. Uploaded files are sent directly to Flask and are more reliable than hot-linked image URLs.


## Closet deletion

- Hover a My Closet card and click the × button to delete it.
- Deleting an item also removes its live layers from the current Style Lab canvas.
- Saved Looks are intentionally preserved as historical snapshots.
- If the item uses a generated `/static/uploads/cutout-*.png`, the server also removes that generated PNG.
- If you delete every item, the closet stays empty after refresh; demo items do not automatically return.


## V5 design restoration

The interface has been restored to the original soft sky / cream / glassy Mac-desktop visual direction. V4 functionality remains: automatic background removal on save, retry-before-drop for legacy non-cutout items, wardrobe deletion, saved looks, profile, and AI chat.

The font file is intentionally not bundled. Put your own `Slabo13px-Regular.ttf` in `static/fonts/`.
