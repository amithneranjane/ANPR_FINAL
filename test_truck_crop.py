from ultralytics import YOLO
import cv2
import os

# Load YOLO number plate model
model = YOLO("runs/detect/train/weights/best.pt")

# Input image
image_path = "images/truck1.jpg"

# Read image
image = cv2.imread(image_path)

if image is None:
    print("Image not found!")
    exit()

# Detect number plate
results = model(image)

# Create output folder
os.makedirs("output", exist_ok=True)

found = False

for result in results:

    boxes = result.boxes

    if boxes is None:
        continue

    for i, box in enumerate(boxes):

        x1, y1, x2, y2 = map(int, box.xyxy[0])

        confidence = float(box.conf[0])

        print("Plate detected")
        print("Coordinates:", x1, y1, x2, y2)
        print("Confidence:", confidence)

        # Crop plate
        plate = image[y1:y2, x1:x2]

        # Save crop
        output_path = f"output/truck1_plate_crop_{i}.jpg"

        cv2.imwrite(output_path, plate)

        print("Saved:", output_path)

        found = True

if not found:
    print("No number plate detected!")