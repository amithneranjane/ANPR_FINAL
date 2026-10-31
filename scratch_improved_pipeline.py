import cv2
import numpy as np
import easyocr
import re
from ultralytics import YOLO

# Valid 2-letter state codes in India (including IN for Bharat/interstate plates)
INDIAN_STATE_CODES = {
    "AN", "AP", "AR", "AS", "BR", "CH", "CG", "DD", "DL", "DN",
    "GA", "GJ", "HR", "HP", "JH", "JK", "KA", "KL", "LA", "LD",
    "MP", "MH", "MN", "ML", "MZ", "NL", "OD", "OR", "PB", "PY",
    "RJ", "SK", "TN", "TR", "TS", "UK", "UA", "UP", "WB", "IN"
}

# Common OCR confusion dictionaries
CHAR_TO_DIGIT = {
    "O": "0", "D": "0", "Q": "0",
    "I": "1", "L": "1", "T": "1", "J": "1",
    "Z": "2",
    "E": "3",
    "A": "4",
    "S": "5",
    "G": "6", "b": "6",
    "B": "8",
    "g": "9", "q": "9",
}

DIGIT_TO_CHAR = {
    "0": "O",
    "1": "I",
    "2": "Z",
    "3": "E",
    "4": "A",
    "5": "S",
    "6": "G",
    "7": "T",
    "8": "B",
}

def clean_alphanumeric(text):
    if not text:
        return ""
    text = str(text).upper()
    return re.sub(r"[^A-Z0-9]", "", text)

def is_valid_indian_format(plate):
    if not plate or len(plate) < 7 or len(plate) > 11:
        return False
    state = plate[:2]
    if state not in INDIAN_STATE_CODES:
        return False
    # Standard formats:
    # 1. XX 00 XX 0000 (e.g. MH47TC0964, TN63BY7954, BR28AE1922, HR26LF7571)
    if re.fullmatch(r"^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$", plate):
        return True
    # 2. XX 00 0000 (no series letters)
    if re.fullmatch(r"^[A-Z]{2}[0-9]{1,2}[0-9]{4}$", plate):
        return True
    # 3. Bharat series: 00BH0000XX
    if re.fullmatch(r"^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$", plate):
        return True
    return False

def strip_border_artifacts(raw_text):
    """
    Toll camera images often have plate borders, frames, or screws
    that OCR misreads as a leading or trailing symbol (e.g. F, E, 9, 1, ').
    """
    text = clean_alphanumeric(raw_text)
    if not text or len(text) < 5:
        return [text] if text else []
    
    candidates = [text]
    
    # Check if stripping leading 1 character reveals a valid State code
    if len(text) >= 8:
        candidate_lead = text[1:]
        if candidate_lead[:2] in INDIAN_STATE_CODES:
            candidates.append(candidate_lead)
            
    # Check if stripping leading 2 characters (e.g. "9F" or "IN" on European style)
    if len(text) >= 9:
        candidate_lead2 = text[2:]
        if candidate_lead2[:2] in INDIAN_STATE_CODES:
            candidates.append(candidate_lead2)

    # Check if stripping trailing 1 character
    if len(text) >= 8:
        candidate_tail = text[:-1]
        if candidate_tail[:2] in INDIAN_STATE_CODES:
            candidates.append(candidate_tail)
            
    # Check if stripping both leading and trailing 1 character
    if len(text) >= 9:
        candidate_both = text[1:-1]
        if candidate_both[:2] in INDIAN_STATE_CODES:
            candidates.append(candidate_both)

    return list(dict.fromkeys(candidates))

def normalize_by_indian_pattern(plate):
    """
    Apply position-specific letter/digit correction ONLY when it fits
    standard Indian registration structure (XX 00 XX 0000).
    """
    text = clean_alphanumeric(plate)
    if len(text) < 7 or len(text) > 11:
        return text

    # Try standard 10-char pattern: 2 letters, 2 digits, 2 letters, 4 digits
    # or 9-char: 2 letters, 2 digits, 1 letter, 4 digits
    for pat_type in [10, 9]:
        if len(text) == pat_type:
            chars = list(text)
            
            # Position 0, 1: State code letters
            for i in [0, 1]:
                if chars[i].isdigit() and chars[i] in DIGIT_TO_CHAR:
                    chars[i] = DIGIT_TO_CHAR[chars[i]]
                    
            state = "".join(chars[:2])
            # Special case for TN vs IN / TH / TM
            if state in ["IN", "TH", "TM", "7N", "TK"] and "TN" in INDIAN_STATE_CODES:
                # keep state or check context
                pass

            # Position 2, 3: District digits
            # In 10-char: pos 2, 3 digits; pos 4, 5 letters; pos 6, 7, 8, 9 digits
            # In 9-char:  pos 2, 3 digits; pos 4 letter;      pos 5, 6, 7, 8 digits
            if pat_type == 10:
                digit_positions = [2, 3, 6, 7, 8, 9]
                letter_positions = [0, 1, 4, 5]
            else:
                digit_positions = [2, 3, 5, 6, 7, 8]
                letter_positions = [0, 1, 4]
                
            for idx in digit_positions:
                if chars[idx] in CHAR_TO_DIGIT:
                    chars[idx] = CHAR_TO_DIGIT[chars[idx]]
                    
            for idx in letter_positions:
                if chars[idx].isdigit() and chars[idx] in DIGIT_TO_CHAR:
                    chars[idx] = DIGIT_TO_CHAR[chars[idx]]
                    
            cand = "".join(chars)
            if is_valid_indian_format(cand):
                return cand

    return text

def deskew_plate(gray):
    """
    Detect plate tilt angle and rotate to horizontal.
    """
    try:
        # Edge detection
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, 50, minLineLength=gray.shape[1] // 3, maxLineGap=10)
        if lines is not None:
            angles = []
            for line in lines:
                x1, y1, x2, y2 = line[0]
                if x2 != x1:
                    angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
                    if abs(angle) < 25: # small tilt
                        angles.append(angle)
            if angles:
                median_angle = float(np.median(angles))
                if abs(median_angle) > 1.5:
                    h, w = gray.shape[:2]
                    M = cv2.getRotationMatrix2D((w // 2, h // 2), median_angle, 1.0)
                    rotated = cv2.warpAffine(gray, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
                    return rotated
    except Exception:
        pass
    return gray

def preprocess_plate(crop):
    """
    Generate diverse, optimized preprocessing variations for EasyOCR.
    """
    if len(crop.shape) == 3:
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    else:
        gray = crop

    # Deskew if tilted
    gray = deskew_plate(gray)

    h, w = gray.shape[:2]
    # Optimal character height for EasyOCR is ~100-140px
    target_h = 120
    scale = max(2.0, min(10.0, float(target_h) / max(h, 1)))
    new_w = int(w * scale)
    new_h = int(h * scale)

    # 1. Upscaled Bicubic & Lanczos
    upscaled = cv2.resize(gray, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
    lanczos = cv2.resize(gray, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)

    # 2. Unsharp Masking
    gaussian = cv2.GaussianBlur(upscaled, (0, 0), 2.0)
    unsharp = cv2.addWeighted(upscaled, 1.8, gaussian, -0.8, 0)

    # 3. CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe_2 = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(upscaled)
    clahe_3 = cv2.createCLAHE(clipLimit=3.5, tileGridSize=(8, 8)).apply(upscaled)

    # 4. Sharpening
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    sharpened = cv2.filter2D(clahe_2, -1, kernel)

    # 5. Denoised
    denoised = cv2.fastNlMeansDenoising(clahe_2, None, 10, 7, 21)

    # 6. Otsu thresholding & inverted
    blur = cv2.GaussianBlur(clahe_2, (3, 3), 0)
    _, otsu = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    otsu_inv = cv2.bitwise_not(otsu)

    # 7. Adaptive thresholding
    adaptive = cv2.adaptiveThreshold(clahe_2, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 13, 2)
    adaptive_inv = cv2.bitwise_not(adaptive)

    # 8. Morphology Close & Open
    k_morph = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    morph_close = cv2.morphologyEx(otsu, cv2.MORPH_CLOSE, k_morph)
    morph_open = cv2.morphologyEx(otsu, cv2.MORPH_OPEN, k_morph)

    return {
        "CLAHE": clahe_2,
        "CLAHE_High": clahe_3,
        "Sharpened": sharpened,
        "Denoised": denoised,
        "Otsu": otsu,
        "Otsu_Inv": otsu_inv,
        "Adaptive": adaptive,
        "Adaptive_Inv": adaptive_inv,
        "Morph_Close": morph_close,
        "Morph_Open": morph_open,
        "Unsharp": unsharp,
        "Upscaled": upscaled,
        "Lanczos": lanczos,
    }

print("Pipeline module test ready!")
