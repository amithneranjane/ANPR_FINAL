import cv2
import easyocr
import re

IMAGE_PATH = "images/car3.jpg"

print("Loading EasyOCR...")
reader = easyocr.Reader(["en"], gpu=False)

image = cv2.imread(IMAGE_PATH)

if image is None:
    print("ERROR: car3.jpg not found")
    exit()

print("Running YOLO plate detection...")

from ultralytics import YOLO

model = YOLO("runs/detect/train/weights/best.pt")

results = model(image)

plate = None

for result in results:
    for box in result.boxes:

        x1, y1, x2, y2 = map(
            int,
            box.xyxy[0]
        )

        x1 = max(0, x1)
        y1 = max(0, y1)
        x2 = min(image.shape[1], x2)
        y2 = min(image.shape[0], y2)

        plate = image[y1:y2, x1:x2]

        if plate.size > 0:
            break

    if plate is not None:
        break


if plate is None:

    print("Number plate not detected")
    exit()


print("Plate detected!")

# ==========================================
# UPSCALE
# ==========================================

gray = cv2.cvtColor(
    plate,
    cv2.COLOR_BGR2GRAY
)

upscaled = cv2.resize(
    gray,
    None,
    fx=8,
    fy=8,
    interpolation=cv2.INTER_CUBIC
)


# ==========================================
# DIFFERENT OCR VERSIONS
# ==========================================

clahe_obj = cv2.createCLAHE(
    clipLimit=2.0,
    tileGridSize=(8, 8)
)

clahe = clahe_obj.apply(upscaled)


sharpen_kernel = (
    __import__("numpy").array([
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0]
    ])
)

sharpened = cv2.filter2D(
    upscaled,
    -1,
    sharpen_kernel
)


_, otsu = cv2.threshold(
    upscaled,
    0,
    255,
    cv2.THRESH_BINARY +
    cv2.THRESH_OTSU
)


methods = {

    "UPSCALED": upscaled,

    "CLAHE": clahe,

    "SHARPENED": sharpened,

    "OTSU": otsu

}


# ==========================================
# OCR
# ==========================================

all_text = []

for method_name, processed in methods.items():

    print()
    print("=" * 45)
    print("METHOD:", method_name)
    print("=" * 45)

    detections = reader.readtext(
        processed,
        detail=1,
        paragraph=False,
        allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    )

    for detection in detections:

        text = detection[1].upper()

        confidence = float(detection[2])

        text = re.sub(
            r"[^A-Z0-9]",
            "",
            text
        )

        if not text:
            continue

        if text == "IND":
            continue

        print(
            "Text:",
            text,
            "| Confidence:",
            round(confidence * 100, 2),
            "%"
        )

        all_text.append({
            "text": text,
            "confidence": confidence,
            "method": method_name
        })


# ==========================================
# COMBINE OCR PARTS
# ==========================================

print()
print("=" * 45)
print("COMBINING OCR RESULTS")
print("=" * 45)

# Remove IND and very short noise

valid = [

    x for x in all_text

    if len(x["text"]) >= 2

    and x["text"] != "IND"

]


# Print everything found

for item in valid:

    print(
        item["text"],
        "->",
        round(
            item["confidence"] * 100,
            2
        ),
        "%"
    )


# ==========================================
# LOOK FOR COMPLETE PLATE
# ==========================================

complete_candidates = []

for item in valid:

    text = item["text"]

    # Indian registration-like format

    pattern = (
        r"^[A-Z]{2}"
        r"[0-9]{1,2}"
        r"[A-Z]{1,3}"
        r"[0-9]{1,4}$"
    )

    if re.match(pattern, text):

        complete_candidates.append(item)


# ==========================================
# FINAL RESULT
# ==========================================

print()
print("=" * 45)
print("FINAL RESULT")
print("=" * 45)


if complete_candidates:

    best = max(
        complete_candidates,
        key=lambda x: x["confidence"]
    )

    print(
        "Complete plate found:",
        best["text"]
    )

    print(
        "Confidence:",
        round(
            best["confidence"] * 100,
            2
        ),
        "%"
    )

else:

    # Try combining detected pieces

    pieces = []

    for item in valid:

        text = item["text"]

        if len(text) >= 2:

            pieces.append(text)


    combined = "".join(pieces)


    print(
        "Combined candidate:",
        combined
    )

print()
print("TEST COMPLETED")