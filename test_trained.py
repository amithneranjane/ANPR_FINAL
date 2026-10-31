from ultralytics import YOLO
import cv2

# Load your trained number plate model
model = YOLO("runs/detect/train/weights/best.pt")

# Load vehicle image
image = cv2.imread("images/car.jpg")

if image is None:
    print("Image not found!")
    exit()

# Detect number plate
results = model(image)

# Draw detection results
output = results[0].plot()

# Show result
cv2.imshow("Number Plate Detection", output)

cv2.waitKey(0)
cv2.destroyAllWindows()