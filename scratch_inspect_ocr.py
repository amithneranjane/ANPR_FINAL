import cv2
import easyocr
import numpy as np
import os
import re

reader = easyocr.Reader(['en'], gpu=False)

def inspect_image(img_path, label):
    print(f"\n{'='*50}\nINSPECTING: {label} ({img_path})\n{'='*50}")
    img = cv2.imread(img_path)
    if img is None:
        print("ERROR: Image could not be loaded!")
        return
    print(f"Original shape: {img.shape}")
    
    # 1. Raw read
    res_raw = reader.readtext(img, detail=1)
    print("--- RAW EASYOCR ---")
    for b, t, c in res_raw:
        print(f"  bbox={b} | text='{t}' | conf={c:.4f}")

    # 2. Upscale (fx=4, fy=4) grayscale
    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img
    h, w = gray.shape[:2]
    scale = max(2.0, min(8.0, 300.0 / max(h, 1)))
    upscaled = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    
    # Contrast enhancement (CLAHE)
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8)).apply(upscaled)
    res_clahe = reader.readtext(clahe, detail=1)
    print("--- CLAHE EASYOCR ---")
    for b, t, c in res_clahe:
        print(f"  bbox={b} | text='{t}' | conf={c:.4f}")
        
    # Sharpen
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    sharp = cv2.filter2D(clahe, -1, kernel)
    res_sharp = reader.readtext(sharp, detail=1)
    print("--- SHARPENED EASYOCR ---")
    for b, t, c in res_sharp:
        print(f"  bbox={b} | text='{t}' | conf={c:.4f}")

    # Denoised
    denoised = cv2.fastNlMeansDenoising(upscaled, None, 10, 7, 21)
    res_denoised = reader.readtext(denoised, detail=1)
    print("--- DENOISED EASYOCR ---")
    for b, t, c in res_denoised:
        print(f"  bbox={b} | text='{t}' | conf={c:.4f}")

    # Otsu
    blurred = cv2.GaussianBlur(clahe, (3, 3), 0)
    otsu = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    res_otsu = reader.readtext(otsu, detail=1)
    print("--- OTSU EASYOCR ---")
    for b, t, c in res_otsu:
        print(f"  bbox={b} | text='{t}' | conf={c:.4f}")

    # Otsu Inverted (in case white plate black text vs black plate white text)
    otsu_inv = cv2.bitwise_not(otsu)
    res_otsu_inv = reader.readtext(otsu_inv, detail=1)
    print("--- OTSU INVERTED EASYOCR ---")
    for b, t, c in res_otsu_inv:
        print(f"  bbox={b} | text='{t}' | conf={c:.4f}")

inspect_image('evidence/plates/2026-10-07_22-24-54_Screenshot_2026-10-07_222308_plate.jpg', 'Toll Plate Crop')
