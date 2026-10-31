import cv2
import easyocr
import os

# ==========================================
# SETTINGS
# ==========================================

IMAGE_PATH = "output/truck1_plate_crop_0.jpg"
OUTPUT_FOLDER = "output/truck_char_tests"

os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# ==========================================
# LOAD PLATE CROP
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
    fx=8,
    fy=8,
    interpolation=cv2.INTER_CUBIC
)

# ==========================================
# GRAYSCALE
# ==========================================

gray = cv2.cvtColor(upscaled, cv2.COLOR_BGR2GRAY)

# ==========================================
# DENOISE
# ==========================================

gray = cv2.bilateralFilter(
    gray,
    9,
    75,
    75
)

# ==========================================
# THRESHOLD
# ==========================================

_, binary = cv2.threshold(
    gray,
    0,
    255,
    cv2.THRESH_BINARY + cv2.THRESH_OTSU
)

# ==========================================
# MORPHOLOGY
# ==========================================

kernel = cv2.getStructuringElement(
    cv2.MORPH_RECT,
    (3, 3)
)

morphology = cv2.morphologyEx(
    binary,
    cv2.MORPH_CLOSE,
    kernel
)

# ==========================================
# SAVE IMAGES
# ==========================================

cv2.imwrite(
    f"{OUTPUT_FOLDER}/upscaled.jpg",
    upscaled
)

cv2.imwrite(
    f"{OUTPUT_FOLDER}/gray.jpg",
    gray
)

cv2.imwrite(
    f"{OUTPUT_FOLDER}/binary.jpg",
    binary
)

cv2.imwrite(
    f"{OUTPUT_FOLDER}/morphology.jpg",
    morphology
)

# ==========================================
# LOAD OCR
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

def detect_text(method, image):

    print("\n================================")
    print("METHOD:", method)
    print("================================")

    results = reader.readtext(
        image,
        detail=1,
        paragraph=False,
        allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        width_ths=0.3,
        link_threshold=0.2,
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
# RUN OCR
# ==========================================

detect_text("UPCALED", upscaled)

detect_text("GRAYSCALE", gray)

detect_text("BINARY", binary)

detect_text("MORPHOLOGY", morphology)

# ==========================================
# FINISHED
# ==========================================

print("\n================================")
print("CHARACTER OCR TEST COMPLETED")
print("================================")

print("Images saved in:")
print(OUTPUT_FOLDER)