import cv2
import easyocr
import os
import re

IMAGE_PATH = "output/truck1_plate_crop_0.jpg"
OUTPUT_FOLDER = "output/truck_advanced_tests"

os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# ==========================================
# LOAD PLATE
# ==========================================

image = cv2.imread(IMAGE_PATH)

if image is None:
    print("ERROR: Plate crop not found!")
    exit()

print("Plate crop loaded successfully!")

# ==========================================
# CROP SMALL BORDER
# ==========================================

h, w = image.shape[:2]

# Remove a tiny border if present
x1 = max(0, int(w * 0.02))
x2 = min(w, int(w * 0.98))
y1 = max(0, int(h * 0.05))
y2 = min(h, int(h * 0.95))

plate = image[y1:y2, x1:x2]

# ==========================================
# UPSCALE
# ==========================================

plate = cv2.resize(
    plate,
    None,
    fx=15,
    fy=15,
    interpolation=cv2.INTER_CUBIC
)

cv2.imwrite(
    f"{OUTPUT_FOLDER}/01_upscaled.jpg",
    plate
)

# ==========================================
# GRAYSCALE
# ==========================================

gray = cv2.cvtColor(
    plate,
    cv2.COLOR_BGR2GRAY
)

# ==========================================
# CLAHE
# ==========================================

clahe = cv2.createCLAHE(
    clipLimit=1.5,
    tileGridSize=(8, 8)
)

clahe_img = clahe.apply(gray)

cv2.imwrite(
    f"{OUTPUT_FOLDER}/02_clahe.jpg",
    clahe_img
)

# ==========================================
# LIGHT DENOISING
# ==========================================

denoised = cv2.bilateralFilter(
    clahe_img,
    5,
    30,
    30
)

cv2.imwrite(
    f"{OUTPUT_FOLDER}/03_denoised.jpg",
    denoised
)

# ==========================================
# SHARPENING
# ==========================================

blur = cv2.GaussianBlur(
    denoised,
    (0, 0),
    1
)

sharp = cv2.addWeighted(
    denoised,
    1.3,
    blur,
    -0.3,
    0
)

cv2.imwrite(
    f"{OUTPUT_FOLDER}/04_sharp.jpg",
    sharp
)

# ==========================================
# THRESHOLD METHODS
# ==========================================

_, otsu = cv2.threshold(
    sharp,
    0,
    255,
    cv2.THRESH_BINARY + cv2.THRESH_OTSU
)

adaptive = cv2.adaptiveThreshold(
    sharp,
    255,
    cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv2.THRESH_BINARY,
    41,
    7
)

cv2.imwrite(
    f"{OUTPUT_FOLDER}/05_otsu.jpg",
    otsu
)

cv2.imwrite(
    f"{OUTPUT_FOLDER}/06_adaptive.jpg",
    adaptive
)

# ==========================================
# OCR
# ==========================================

print("Loading EasyOCR...")

reader = easyocr.Reader(
    ["en"],
    gpu=False
)

print("EasyOCR loaded successfully!")

allowlist = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"


def run_ocr(name, img):

    print("\n================================")
    print("METHOD:", name)
    print("================================")

    results = reader.readtext(
        img,
        detail=1,
        paragraph=False,
        allowlist=allowlist,
        decoder="beamsearch",
        beamWidth=10,
        width_ths=0.2,
        link_threshold=0.2,
        text_threshold=0.2,
        low_text=0.1,
        mag_ratio=1.5
    )

    if not results:
        print("No text detected")
        return

    for result in results:

        text = result[1]
        confidence = float(result[2])

        text = re.sub(
            r"[^A-Z0-9]",
            "",
            text.upper()
        )

        print(
            "Text:",
            text,
            "| Confidence:",
            round(confidence * 100, 2),
            "%"
        )


# ==========================================
# TEST
# ==========================================

run_ocr("15X UPSCALED", plate)

run_ocr("CLAHE", clahe_img)

run_ocr("DENOISED", denoised)

run_ocr("SHARPENED", sharp)

run_ocr("OTSU", otsu)

run_ocr("ADAPTIVE", adaptive)

# ==========================================
# DONE
# ==========================================

print("\n================================")
print("ADVANCED OCR TEST COMPLETED")
print("================================")

print("Processed images:")
print(OUTPUT_FOLDER)