import cv2
import easyocr
import os

CROP_FOLDER = "output/all_plate_crops"

reader = easyocr.Reader(["en"], gpu=False)

files = [
    "bus1_plate_0.jpg",
    "car_plate_0.jpg",
    "car2_plate_0.jpg",
    "car3_plate_0.jpg",
    "car4_plate_0.jpg",
    "car5_plate_0.jpg",
    "car6_plate_0.jpg",
    "car7_plate_0.jpg",
    "car8_plate_0.jpg",
    "car9_plate_0.jpg",
    "car10_plate_0.jpg",
    "truck1_plate_0.jpg"
]

print("\n==========================================")
print("       OCR TEST ON ALL PLATE CROPS")
print("==========================================")

for filename in files:

    path = os.path.join(CROP_FOLDER, filename)

    print("\n------------------------------------------")
    print("Image:", filename)

    if not os.path.exists(path):
        print("ERROR: Crop not found")
        continue

    image = cv2.imread(path)

    if image is None:
        print("ERROR: Could not read image")
        continue

    # Upscale crop
    upscaled = cv2.resize(
        image,
        None,
        fx=6,
        fy=6,
        interpolation=cv2.INTER_CUBIC
    )

    results = reader.readtext(
        upscaled,
        detail=1,
        paragraph=False,
        allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    )

    if not results:
        print("OCR: Not Recognized")
        continue

    for result in results:

        text = result[1]
        confidence = float(result[2]) * 100

        print("OCR:", text)
        print("Confidence:", round(confidence, 2), "%")

print("\n==========================================")
print("       ALL CROPS OCR TEST COMPLETED")
print("==========================================")