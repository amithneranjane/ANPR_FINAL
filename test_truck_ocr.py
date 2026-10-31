import cv2
import easyocr
import os
import re

# ==========================================
# SETTINGS
# ==========================================

IMAGE_PATH = "output/truck1_plate_crop_0.jpg"
OUTPUT_FOLDER = "output/truck_ocr_tests"

os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# ==========================================
# LOAD IMAGE
# ==========================================

image = cv2.imread(IMAGE_PATH)

if image is None:
    print("ERROR: Plate crop not found!")
    exit()

print("Plate crop loaded successfully!")

# ==========================================
# UPSCALE
# ==========================================

upscaled = cv2.resize(
    image,
    None,
    fx=5,
    fy=5,
    interpolation=cv2.INTER_CUBIC
)

# ==========================================
# GRAYSCALE
# ==========================================

gray = cv2.cvtColor(upscaled, cv2.COLOR_BGR2GRAY)

# ==========================================
# CONTRAST ENHANCEMENT
# ==========================================

clahe = cv2.createCLAHE(
    clipLimit=2.0,
    tileGridSize=(8, 8)
)

enhanced = clahe.apply(gray)

# ==========================================
# SHARPENING
# ==========================================

blur = cv2.GaussianBlur(enhanced, (0, 0), 3)

sharpened = cv2.addWeighted(
    enhanced,
    1.5,
    blur,
    -0.5,
    0
)

# ==========================================
# OTSU THRESHOLD
# ==========================================

_, otsu = cv2.threshold(
    sharpened,
    0,
    255,
    cv2.THRESH_BINARY + cv2.THRESH_OTSU
)

# ==========================================
# ADAPTIVE THRESHOLD
# ==========================================

adaptive = cv2.adaptiveThreshold(
    sharpened,
    255,
    cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv2.THRESH_BINARY,
    31,
    11
)

# ==========================================
# SAVE PROCESSED IMAGES
# ==========================================

cv2.imwrite(
    f"{OUTPUT_FOLDER}/1_upscaled.jpg",
    upscaled
)

cv2.imwrite(
    f"{OUTPUT_FOLDER}/2_gray.jpg",
    gray
)

cv2.imwrite(
    f"{OUTPUT_FOLDER}/3_enhanced.jpg",
    enhanced
)

cv2.imwrite(
    f"{OUTPUT_FOLDER}/4_sharpened.jpg",
    sharpened
)

cv2.imwrite(
    f"{OUTPUT_FOLDER}/5_otsu.jpg",
    otsu
)

cv2.imwrite(
    f"{OUTPUT_FOLDER}/6_adaptive.jpg",
    adaptive
)

# ==========================================
# LOAD EASYOCR
# ==========================================

print("Loading EasyOCR...")

reader = easyocr.Reader(
    ['en'],
    gpu=False
)

print("EasyOCR loaded successfully!")

# ==========================================
# OCR FUNCTION
# ==========================================

def run_ocr(name, img):

    results = reader.readtext(
        img,
        detail=1,
        paragraph=False,
        allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    )

    print("\n------------------------------")
    print("METHOD:", name)

    if not results:
        print("No text detected")
        return

    for result in results:

        text = result[1]
        confidence = float(result[2])

        print("Text:", text)
        print("Confidence:", round(confidence * 100, 2), "%")


# ==========================================
# RUN ALL METHODS
# ==========================================

run_ocr("Upscaled", upscaled)

run_ocr("Grayscale", gray)

run_ocr("Enhanced", enhanced)

run_ocr("Sharpened", sharpened)

run_ocr("Otsu", otsu)

run_ocr("Adaptive Threshold", adaptive)

# ==========================================
# FINISHED
# ==========================================

print("\n================================")
print("OCR TEST COMPLETED")
print("================================")
print("Processed images saved in:")
print(OUTPUT_FOLDER)