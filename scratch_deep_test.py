import cv2
import easyocr
import numpy as np
import os
import re

reader = easyocr.Reader(['en'], gpu=False)

def test_single_crop(crop, name):
    print(f"\n{'='*60}\nTesting Crop: {name} (shape: {crop.shape})\n{'='*60}")
    
    # Generate preprocessing variations
    h, w = crop.shape[:2]
    # Target height around 140px
    scale = max(2.0, min(10.0, 140.0 / max(h, 1)))
    new_w = int(w * scale)
    new_h = int(h * scale)
    
    if len(crop.shape) == 3:
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    else:
        gray = crop
        
    upscaled = cv2.resize(gray, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
    lanczos = cv2.resize(gray, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)
    
    # Unsharp mask
    gaussian = cv2.GaussianBlur(upscaled, (0, 0), 2.0)
    unsharp = cv2.addWeighted(upscaled, 1.8, gaussian, -0.8, 0)
    
    # CLAHE
    clahe_2 = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(upscaled)
    clahe_3 = cv2.createCLAHE(clipLimit=3.5, tileGridSize=(8, 8)).apply(upscaled)
    
    # Denoised
    denoised = cv2.fastNlMeansDenoising(clahe_2, None, 10, 7, 21)
    
    # Sharpened
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    sharp = cv2.filter2D(clahe_2, -1, kernel)
    
    # Otsu & Otsu Inv
    blur = cv2.GaussianBlur(clahe_2, (3, 3), 0)
    _, otsu = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    otsu_inv = cv2.bitwise_not(otsu)
    
    # Adaptive
    adaptive = cv2.adaptiveThreshold(clahe_2, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 13, 2)
    adaptive_inv = cv2.bitwise_not(adaptive)
    
    # Morph close / open
    k_morph = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    morph_close = cv2.morphologyEx(otsu, cv2.MORPH_CLOSE, k_morph)
    morph_open = cv2.morphologyEx(otsu, cv2.MORPH_OPEN, k_morph)

    versions = {
        "Upscaled": upscaled,
        "Lanczos": lanczos,
        "Unsharp": unsharp,
        "CLAHE_2": clahe_2,
        "CLAHE_3": clahe_3,
        "Denoised": denoised,
        "Sharpened": sharp,
        "Otsu": otsu,
        "Otsu_Inv": otsu_inv,
        "Adaptive": adaptive,
        "Adaptive_Inv": adaptive_inv,
        "Morph_Close": morph_close,
        "Morph_Open": morph_open
    }
    
    for vname, vimg in versions.items():
        res = reader.readtext(vimg, detail=1, allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
        if res:
            items = [(t, round(c, 3)) for _, t, c in res]
            print(f"  {vname:14s}: {items}")

# 1. Test toll crop
toll_crop = cv2.imread('evidence/plates/2026-10-07_22-24-54_Screenshot_2026-10-07_222308_plate.jpg')
if toll_crop is not None:
    test_single_crop(toll_crop, "Toll Gate Crop")

# 2. Test car.jpg crop
from ultralytics import YOLO
model = YOLO("runs/detect/train/weights/best.pt")
car_img = cv2.imread("images/car.jpg")
res_car = model(car_img)
for r in res_car:
    for box in r.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        test_single_crop(car_img[y1:y2, x1:x2], "car.jpg Crop")
