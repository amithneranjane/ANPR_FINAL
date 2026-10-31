import os
import cv2

for f in sorted(os.listdir('images')):
    if f.lower().endswith(('.jpg', '.png')):
        img = cv2.imread(os.path.join('images', f))
        print(f"{f}: shape={img.shape if img is not None else None}")
