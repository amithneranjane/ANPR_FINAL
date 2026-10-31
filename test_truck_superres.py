import cv2
import easyocr
import os

# ==========================================
# SETTINGS
# ==========================================

IMAGE_PATH = "output/truck1_plate_crop_0.jpg"
OUTPUT_FOLDER = "output/truck_superres_tests"

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
# CREATE DIFFERENT ENHANCEMENTS
# ==========================================

# 1. Large upscale
upscaled = cv2.resize(
    image,
    None,
    fx=12,
    fy=12,
    interpolation=cv2.INTER_LANCZOS4
)

# 2. Grayscale
gray = cv2.cvtColor(
    upscaled,
    cv2.COLOR_BGR2GRAY
)

# 3. Contrast enhancement
clahe = cv2.createCLAHE(
    clipLimit=2.0,
    tileGridSize=(8, 8)
)

enhanced = clahe.apply(gray)

# 4. Sharpen
blurred = cv2.GaussianBlur(
    enhanced,
    (0, 0),
    2
)

sharpened = cv2.addWeighted(
    enhanced,
    2.0,
    blurred,
    -1.0,
    0
)

# ==========================================
# SAVE PROCESSED IMAGES
# ==========================================

cv2.imwrite(
    f"{OUTPUT_FOLDER}/1_upscaled_12x.jpg",
    upscaled
)

cv2.imwrite(
    f"{OUTPUT_FOLDER}/2_enhanced.jpg",
    enhanced
)

cv2.imwrite(
    f"{OUTPUT_FOLDER}/3_sharpened.jpg",
    sharpened
)

# ==========================================
# LOAD EASY OCR
# ==========================================

print("Loading EasyOCR...")

reader = easyocr.Reader(
    ["en"],
    gpu=False
)

print("EasyOCR loaded successfully!")

# ==========================================
# OCR FUNCTION
# ==========================================

def run_ocr(name, img):

    print("\n================================")
    print("METHOD:", name)
    print("================================")

    results = reader.readtext(
        img,
        detail=1,
        paragraph=False,
        allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        width_ths=0.3,
        text_threshold=0.3,
        low_text=0.2
    )

    if not results:
        print("No text detected")
        return

    for result in results:

        text = result[1]
        confidence = float(result[2])

        print(
            "Text:",
            text,
            "| Confidence:",
            round(confidence * 100, 2),
            "%"
        )


# ==========================================
# TEST OCR
# ==========================================

run_ocr(
    "12X UPSCALED",
    upscaled
)

run_ocr(
    "ENHANCED",
    enhanced
)

run_ocr(
    "SHARPENED",
    sharpened
)

# ==========================================
# FINISHED
# ==========================================

print("\n================================")
print("SUPER-RESOLUTION TEST COMPLETED")
print("================================")

print("Images saved in:")
print(OUTPUT_FOLDER)