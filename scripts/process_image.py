import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter


def main() -> None:
    source_path = "croppeddriftwoodphoto1.jpg"
    output_path = "photo_57_2026-07-07_19-43-48.png"

    source_bgr = cv2.imread(source_path, cv2.IMREAD_COLOR)
    if source_bgr is None:
        raise RuntimeError(f"Could not read {source_path}")

    height, width = source_bgr.shape[:2]
    mask = np.zeros((height, width), np.uint8)
    bg_model = np.zeros((1, 65), np.float64)
    fg_model = np.zeros((1, 65), np.float64)

    # Keep a generous rectangle so no plant pixels are clipped.
    rect = (10, 10, max(width - 20, 1), max(height - 20, 1))
    cv2.grabCut(source_bgr, mask, rect, bg_model, fg_model, 7, cv2.GC_INIT_WITH_RECT)

    fg_mask = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    fg_mask = cv2.medianBlur(fg_mask, 5)
    kernel = np.ones((3, 3), np.uint8)
    fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    fg_mask = cv2.GaussianBlur(fg_mask, (5, 5), 0)

    source_rgba = cv2.cvtColor(source_bgr, cv2.COLOR_BGR2RGBA)
    source_rgba[:, :, 3] = fg_mask
    cutout = Image.fromarray(source_rgba, mode="RGBA")

    polished = cutout.convert("RGB")
    polished = ImageEnhance.Brightness(polished).enhance(1.08)
    polished = ImageEnhance.Contrast(polished).enhance(1.12)
    polished = ImageEnhance.Color(polished).enhance(1.18)
    polished = polished.filter(ImageFilter.UnsharpMask(radius=1.2, percent=120, threshold=2))

    result = polished.convert("RGBA")
    result.putalpha(cutout.split()[-1])
    result.save(output_path, format="PNG", optimize=True)
    print(f"Saved {output_path} at {result.size}")


if __name__ == "__main__":
    main()
