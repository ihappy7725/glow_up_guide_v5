import io
import ipaddress
import json
import os
import socket
import sys
from pathlib import Path
from urllib.parse import urljoin, urlparse
from uuid import uuid4

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request, send_file
from openai import OpenAI
from PIL import Image
from collections import deque

load_dotenv()

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB

UPLOAD_DIR = Path(app.root_path) / "static" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# =========================
# Background removal
# =========================
REMBG_IMPORT_ERROR = ""
REMBG_SESSION = None

try:
    from rembg import new_session as new_rembg_session
    from rembg import remove as remove_background

    REMBG_AVAILABLE = True
except (ImportError, SystemExit) as error:
    new_rembg_session = None
    remove_background = None
    REMBG_AVAILABLE = False
    REMBG_IMPORT_ERROR = str(error) or error.__class__.__name__


# =========================
# URL / network helpers
# =========================
def is_safe_public_url(url: str) -> bool:
    """Allow only public HTTP(S) URLs and block local/private network targets."""
    try:
        parsed = urlparse(url)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname:
            return False

        hostname = parsed.hostname.lower()
        if hostname in {"localhost", "0.0.0.0"} or hostname.endswith(".local"):
            return False

        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        addresses = socket.getaddrinfo(hostname, port, proto=socket.IPPROTO_TCP)

        for address in addresses:
            ip = ipaddress.ip_address(address[4][0])
            if (
                ip.is_private
                or ip.is_loopback
                or ip.is_link_local
                or ip.is_reserved
                or ip.is_multicast
            ):
                return False

        return True
    except (ValueError, socket.gaierror, OSError):
        return False


def first_meta(soup: BeautifulSoup, selectors: list[tuple[str, dict]]) -> str:
    for tag_name, attrs in selectors:
        tag = soup.find(tag_name, attrs=attrs)
        if tag and tag.get("content"):
            value = tag.get("content", "").strip()
            if value:
                return value
    return ""


def download_public_image(url: str, max_bytes: int = 10 * 1024 * 1024, referer: str = "") -> bytes:
    """Download a public image without bypassing authentication or anti-bot controls."""
    if not is_safe_public_url(url):
        raise ValueError("Only public http/https image URLs are allowed.")

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/153.0 Safari/537.36"
        ),
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    }
    if referer and is_safe_public_url(referer):
        headers["Referer"] = referer

    response = requests.get(
        url,
        headers=headers,
        timeout=12,
        allow_redirects=True,
        stream=True,
    )
    response.raise_for_status()

    if not is_safe_public_url(response.url):
        raise ValueError("Image URL redirected to a non-public address.")

    content_type = response.headers.get("Content-Type", "").lower()
    if content_type and not content_type.startswith("image/"):
        raise ValueError("The URL did not return an image.")

    chunks = []
    total = 0
    for chunk in response.iter_content(chunk_size=64 * 1024):
        if not chunk:
            continue
        total += len(chunk)
        if total > max_bytes:
            raise ValueError("The image is larger than 10 MB.")
        chunks.append(chunk)

    image_bytes = b"".join(chunks)
    if not image_bytes:
        raise ValueError("The image was empty.")

    return image_bytes


def get_rembg_session():
    global REMBG_SESSION

    if not REMBG_AVAILABLE or new_rembg_session is None:
        raise RuntimeError("rembg is not available.")

    if REMBG_SESSION is None:
        # The first call may download the model once. The session is then reused.
        model_name = os.getenv("REMBG_MODEL", "u2net")
        REMBG_SESSION = new_rembg_session(model_name)

    return REMBG_SESSION


def save_cutout_png(source_bytes: bytes) -> str:
    if not REMBG_AVAILABLE or remove_background is None:
        raise RuntimeError("rembg is not available.")

    session = get_rembg_session()
    output_bytes = remove_background(source_bytes, session=session)

    # Verify that the result is really transparent.
    try:
        with Image.open(io.BytesIO(output_bytes)) as result_image:
            rgba = result_image.convert("RGBA")
            alpha = rgba.getchannel("A")
            min_alpha, max_alpha = alpha.getextrema()

            if min_alpha == 255:
                raise RuntimeError(
                    "Background removal returned a fully opaque image. "
                    "Try uploading the product image file directly."
                )

            output_buffer = io.BytesIO()
            rgba.save(output_buffer, format="PNG")
            verified_bytes = output_buffer.getvalue()
    except RuntimeError:
        raise
    except Exception as error:
        raise RuntimeError(f"Could not validate the cutout PNG: {error}") from error

    filename = f"cutout-{uuid4().hex}.png"
    destination = UPLOAD_DIR / filename
    destination.write_bytes(verified_bytes)
    return f"/static/uploads/{filename}"




def color_distance(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2])


def save_quick_cutout_png(source_bytes: bytes) -> str:
    """Lightweight background removal optimized for e-commerce images on plain/light backgrounds."""
    try:
        with Image.open(io.BytesIO(source_bytes)) as im:
            im = im.convert('RGBA')

            max_side = 1200
            if max(im.size) > max_side:
                im.thumbnail((max_side, max_side))

            width, height = im.size
            pixels = im.load()

            # Estimate the background color from the four corners.
            corners = [
                pixels[0, 0],
                pixels[max(0, width - 1), 0],
                pixels[0, max(0, height - 1)],
                pixels[max(0, width - 1), max(0, height - 1)],
            ]
            bg = tuple(int(sum(c[i] for c in corners) / len(corners)) for i in range(3))

            visited = [[False] * height for _ in range(width)]
            queue = deque()

            def try_add(x, y):
                if 0 <= x < width and 0 <= y < height and not visited[x][y]:
                    r, g, b, a = pixels[x, y]
                    # Background-like if close to corner average or very bright neutral.
                    near_bg = color_distance((r, g, b), bg) <= 90
                    bright_neutral = (r >= 232 and g >= 232 and b >= 232 and max(r, g, b) - min(r, g, b) <= 34)
                    if a > 0 and (near_bg or bright_neutral):
                        visited[x][y] = True
                        queue.append((x, y))

            for x in range(width):
                try_add(x, 0)
                try_add(x, height - 1)
            for y in range(height):
                try_add(0, y)
                try_add(width - 1, y)

            transparent_count = 0
            while queue:
                x, y = queue.popleft()
                r, g, b, a = pixels[x, y]
                pixels[x, y] = (r, g, b, 0)
                transparent_count += 1

                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < width and 0 <= ny < height and not visited[nx][ny]:
                        nr, ng, nb, na = pixels[nx, ny]
                        near_bg = color_distance((nr, ng, nb), bg) <= 90
                        bright_neutral = (nr >= 232 and ng >= 232 and nb >= 232 and max(nr, ng, nb) - min(nr, ng, nb) <= 34)
                        if na > 0 and (near_bg or bright_neutral):
                            visited[nx][ny] = True
                            queue.append((nx, ny))

            # If almost nothing was removed, do a soft second pass for near-white pixels.
            if transparent_count / max(1, (width * height)) < 0.03:
                transparent_count = 0
                for x in range(width):
                    for y in range(height):
                        r, g, b, a = pixels[x, y]
                        if a == 0:
                            continue
                        bright_neutral = (r >= 242 and g >= 242 and b >= 242 and max(r, g, b) - min(r, g, b) <= 18)
                        if bright_neutral:
                            pixels[x, y] = (r, g, b, 0)
                            transparent_count += 1

            if transparent_count == 0:
                raise RuntimeError(
                    'Quick cutout could not detect a removable plain background. '
                    'Use a cleaner product image or upload a product image with a light background.'
                )

            bbox = im.getbbox()
            if bbox:
                im = im.crop(bbox)

            output_buffer = io.BytesIO()
            im.save(output_buffer, format='PNG')
            verified_bytes = output_buffer.getvalue()

    except RuntimeError:
        raise
    except Exception as error:
        raise RuntimeError(f'Quick cutout failed: {error}') from error

    filename = f'cutout-{uuid4().hex}.png'
    destination = UPLOAD_DIR / filename
    destination.write_bytes(verified_bytes)
    return f'/static/uploads/{filename}'


def save_best_cutout_png(source_bytes: bytes, prefer_ai: bool = False):
    """Use lightweight quick cutout first for better UX and cheaper deployment.
    Fall back to rembg only when explicitly preferred and available.
    """
    errors = []

    if prefer_ai and REMBG_AVAILABLE:
        try:
            return save_cutout_png(source_bytes), 'ai'
        except Exception as error:
            errors.append(str(error))

    try:
        return save_quick_cutout_png(source_bytes), 'quick'
    except Exception as error:
        errors.append(str(error))

    if REMBG_AVAILABLE:
        try:
            return save_cutout_png(source_bytes), 'ai'
        except Exception as error:
            errors.append(str(error))

    detail = ' | '.join(dict.fromkeys(errors)) or 'No cutout method succeeded.'
    raise RuntimeError(detail)


# =========================
# Product metadata
# =========================
def scrape_product_metadata(url: str) -> dict:
    """Best-effort public metadata extraction from a product-detail page."""
    if not is_safe_public_url(url):
        return {
            "ok": False,
            "needs_manual": True,
            "message": "Only public http/https product URLs are allowed.",
            "url": url,
        }

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (compatible; GlowUpGuide/1.0; "
            "+local-development-fashion-organizer)"
        )
    }

    try:
        response = requests.get(url, headers=headers, timeout=8, allow_redirects=True)
        response.raise_for_status()

        if not is_safe_public_url(response.url):
            raise ValueError("Redirected to a non-public URL.")

        soup = BeautifulSoup(response.text, "html.parser")

        title = first_meta(
            soup,
            [
                ("meta", {"property": "og:title"}),
                ("meta", {"name": "twitter:title"}),
            ],
        )
        if not title and soup.title:
            title = soup.title.get_text(" ", strip=True)

        image = first_meta(
            soup,
            [
                ("meta", {"property": "og:image"}),
                ("meta", {"name": "twitter:image"}),
            ],
        )
        if image:
            image = urljoin(response.url, image)

        brand = first_meta(
            soup,
            [
                ("meta", {"property": "product:brand"}),
                ("meta", {"name": "brand"}),
                ("meta", {"itemprop": "brand"}),
            ],
        )

        parsed = urlparse(response.url)
        platform = parsed.netloc.replace("www.", "")

        result = {
            "ok": bool(title),
            "needs_manual": not bool(title and image),
            "name": title[:180] if title else "",
            "brand": brand[:100] if brand else "",
            "image": image,
            "category": "",
            "platform": platform,
            "url": response.url,
        }

        if result["needs_manual"]:
            result["message"] = (
                "The page did not expose enough public metadata. "
                "Please complete the item manually."
            )

        return result

    except (requests.RequestException, ValueError) as error:
        return {
            "ok": False,
            "needs_manual": True,
            "message": (
                "Automatic extraction was unavailable for this page. "
                "Please enter the item details manually."
            ),
            "detail": str(error),
            "url": url,
        }


def clean_context(value, max_chars=5000):
    if value is None:
        return ""
    if isinstance(value, (dict, list)):
        text = json.dumps(value, ensure_ascii=False)
    else:
        text = str(value)
    return text[:max_chars]


# =========================
# Page
# =========================
@app.get("/")
def index():
    return render_template("index.html")


# =========================
# Product API
# =========================
@app.post("/api/product")
def product_api():
    payload = request.get_json(silent=True) or {}
    url = str(payload.get("url", "")).strip()

    if not url:
        return jsonify({"ok": False, "message": "A product URL is required."}), 400

    return jsonify(scrape_product_metadata(url))


# =========================
# Automatic cutout API
# =========================
@app.post("/api/auto-cutout")
def auto_cutout_api():
    """Create a transparent PNG from either an uploaded image or a public image URL."""
    try:
        if "image" in request.files:
            image_file = request.files["image"]
            source_bytes = image_file.read()
            if not source_bytes:
                return jsonify({"ok": False, "message": "The uploaded image is empty."}), 400
            prefer_ai = str(request.form.get("prefer_ai", "false")).lower() == "true"
        else:
            payload = request.get_json(silent=True) or {}
            image_url = str(payload.get("image_url", "")).strip()
            referer = str(payload.get("referer", "")).strip()
            prefer_ai = bool(payload.get("prefer_ai", False))
            if not image_url:
                return jsonify({"ok": False, "message": "An image or image URL is required."}), 400
            source_bytes = download_public_image(image_url, referer=referer)

        cutout_url, cutout_mode = save_best_cutout_png(source_bytes, prefer_ai=prefer_ai)
        return jsonify({
            "ok": True,
            "cutout_url": cutout_url,
            "cutout_mode": cutout_mode,
            "rembg_available": REMBG_AVAILABLE,
        })

    except (requests.RequestException, ValueError, RuntimeError) as error:
        return jsonify({"ok": False, "message": str(error)}), 400
    except Exception as error:
        app.logger.exception("Automatic cutout failed")
        return (
            jsonify(
                {
                    "ok": False,
                    "message": "Automatic background removal failed.",
                    "detail": str(error),
                }
            ),
            500,
        )


# Backward-compatible endpoint for the previous version.
@app.post("/api/remove-background")
def remove_background_api():
    if not REMBG_AVAILABLE:
        return jsonify({"ok": False, "message": "rembg is not installed."}), 501

    if "image" not in request.files:
        return jsonify({"ok": False, "message": "Upload an image file."}), 400

    source_bytes = request.files["image"].read()
    if not source_bytes:
        return jsonify({"ok": False, "message": "The uploaded image is empty."}), 400

    try:
        output_bytes = remove_background(source_bytes)
        return send_file(
            io.BytesIO(output_bytes),
            mimetype="image/png",
            as_attachment=False,
            download_name="cutout.png",
        )
    except Exception as error:
        app.logger.exception("Background removal failed")
        return jsonify({"ok": False, "message": "Background removal failed.", "detail": str(error)}), 500


# =========================
# Generated cutout cleanup API
# =========================
@app.post("/api/delete-cutout")
def delete_cutout_api():
    """Delete only cutout PNG files generated inside static/uploads."""
    payload = request.get_json(silent=True) or {}
    image_url = str(payload.get("image_url", "")).strip()

    parsed_path = urlparse(image_url).path
    expected_prefix = "/static/uploads/"

    # External images, demo SVGs and unrelated static files are never deleted.
    if not parsed_path.startswith(expected_prefix):
        return jsonify({"ok": True, "deleted": False})

    filename = Path(parsed_path).name

    # Only files created by save_cutout_png() are eligible for deletion.
    if not filename.startswith("cutout-") or not filename.endswith(".png"):
        return jsonify({"ok": False, "message": "This file is not a generated cutout."}), 400

    destination = (UPLOAD_DIR / filename).resolve()
    upload_root = UPLOAD_DIR.resolve()

    if destination.parent != upload_root:
        return jsonify({"ok": False, "message": "Invalid cutout path."}), 400

    try:
        if destination.exists():
            destination.unlink()
            return jsonify({"ok": True, "deleted": True})

        return jsonify({"ok": True, "deleted": False})
    except OSError as error:
        app.logger.exception("Could not delete generated cutout")
        return jsonify({"ok": False, "message": str(error)}), 500


# =========================
# OpenAI fashion chat API
# =========================
@app.post("/api/chat")
def chat_api():
    payload = request.get_json(silent=True) or {}
    message = str(payload.get("message", "")).strip()

    if not message:
        return jsonify({"ok": False, "message": "Please enter a fashion question."}), 400

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return (
            jsonify(
                {
                    "ok": False,
                    "message": (
                        "OPENAI_API_KEY is not configured. "
                        "Add it to your .env file and restart Flask."
                    ),
                }
            ),
            503,
        )

    profile = clean_context(payload.get("profile", {}), 4500)
    outfit = clean_context(payload.get("outfit", []), 4500)

    instructions = """
You are Glow Up Guide, a practical fashion styling assistant inside a digital wardrobe app.
Give concise, specific styling advice. Consider silhouette, proportion, color harmony,
occasion, comfort, and the user's saved preferences. Never claim that you can see an outfit
unless outfit data or an image was actually provided. Avoid body-shaming. Focus on styling
goals, fit, balance, and user preference. When useful, suggest 2-4 concrete changes.
""".strip()

    user_input = f"""
USER STYLE PROFILE:
{profile or "No profile saved."}

CURRENT DIGITAL OUTFIT:
{outfit or "No outfit pieces selected."}

QUESTION:
{message}
""".strip()

    try:
        client = OpenAI(api_key=api_key)
        response = client.responses.create(
            model=os.getenv("OPENAI_MODEL", "gpt-5.5"),
            instructions=instructions,
            input=user_input,
            max_output_tokens=450,
        )

        answer = (response.output_text or "").strip()
        if not answer:
            answer = "I couldn't produce a styling answer this time. Please try again."

        return jsonify({"ok": True, "answer": answer})

    except Exception as error:
        app.logger.exception("OpenAI request failed")
        return (
            jsonify(
                {
                    "ok": False,
                    "message": "The fashion assistant request failed.",
                    "detail": str(error),
                }
            ),
            502,
        )


# =========================
# Health check
# =========================
@app.get("/api/health")
def health():
    return jsonify(
        {
            "ok": True,
            "quick_cutout_available": True,
            "rembg_available": REMBG_AVAILABLE,
            "rembg_error": REMBG_IMPORT_ERROR,
            "python_version": sys.version.split()[0],
            "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
        }
    )


if __name__ == "__main__":
    app.run(debug=True)
