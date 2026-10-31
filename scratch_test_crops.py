import cv2
import easyocr
import numpy as np
from ultralytics import YOLO

model = YOLO("runs/detect/train/weights/best.pt")
reader = easyocr.Reader(['en'], gpu=False)

def test_crop_ocr(image_name, expected):
    img = cv2.imread(f"images/{image_name}")
    if img is None:
        print(f"Could not load {image_name}")
        return
    results = model(img)
    print(f"\n{'='*60}\n{image_name} (Expected: {expected})\n{'='*60}")
    for res in results:
        for box in res.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            plate = img[y1:y2, x1:x2]
            print(f"Crop shape: {plate.shape}, bbox: ({x1},{y1},{x2},{y2})")
            
            # Test various preprocessings:
            # 1. Raw plate
            r_raw = reader.readtext(plate, detail=1)
            print("  [Raw]:", [(t, round(c, 3)) for _, t, c in r_raw])
            
            # 2. Scaled gray
            gray = cv2.cvtColor(plate, cv2.COLOR_BGR2GRAY)
            h, w = gray.shape[:2]
            # scale so height is around 120-150px
            target_h = 120
            scale = max(2.0, target_h / max(h, 1))
            scaled = cv2.resize(gray, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)
            r_scaled = reader.readtext(scaled, detail=1)
            print("  [Scaled]:", [(t, round(c, 3)) for _, t, c in r_scaled])
            
            # 3. CLAHE
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(scaled)
            r_clahe = reader.readtext(clahe, detail=1)
            print("  [CLAHE]:", [(t, round(c, 3)) for _, t, c in r_clahe])
            
            # 4. Sharpen
            kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
            sharp = cv2.filter2D(scaled, -1, kernel)
            r_sharp = reader.readtext(sharp, detail=1)
            print("  [Sharp]:", [(t, round(c, 3)) for _, t, c in r_sharp])
            
            # 5. Denoise
            denoised = cv2.fastNlMeansDenoising(scaled, None, 10, 7, 21)
            r_denoised = reader.readtext(denoised, detail=1)
            print("  [Denoised]:", [(t, round(c, 3)) for _, t, c in r_denoised])

            # 6. Otsu
            blurred = cv2.GaussianBlur(clahe, (3, 3), 0)
            otsu = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
            r_otsu = reader.readtext(otsu, detail=1)
            print("  [Otsu]:", [(t, round(c, 3)) for _, t, c in r_otsu])
            
            # 7. Adaptive
            adaptive = cv2.adaptiveThreshold(clahe, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
            r_adap = reader.readtext(adaptive, detail=1)
            print("  [Adaptive]:", [(t, round(c, 3)) for _, t, c in r_adap])

for name, exp in [
    ("bus1.jpg", "IN45N3729"),
    ("car.jpg", "TN63BY7954"),
    ("car2.jpg", "MH47TC0964"),
    ("car3.jpg", "MH14GN9239"),
    ("car4.jpg", "BR28AE1922"),
]:
    test_crop_ocr(name, exp)
