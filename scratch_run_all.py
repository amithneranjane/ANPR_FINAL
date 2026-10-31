import cv2
import numpy as np
import easyocr
import re
from ultralytics import YOLO
from scratch_improved_pipeline import (
    preprocess_plate,
    clean_alphanumeric,
    is_valid_indian_format,
    strip_border_artifacts,
    normalize_by_indian_pattern,
    INDIAN_STATE_CODES
)

model = YOLO("runs/detect/train/weights/best.pt")
reader = easyocr.Reader(['en'], gpu=False)

def run_anpr_on_image(image_path):
    img = cv2.imread(image_path)
    if img is None:
        return {"error": f"Could not load {image_path}"}
        
    res = model(img)
    best_plate_crop = None
    yolo_box = None
    
    # Get highest confidence plate box
    for r in res:
        for box in r.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            # add small margin (padding ~ 4%)
            pad_x = max(2, int((x2 - x1) * 0.04))
            pad_y = max(2, int((y2 - y1) * 0.04))
            px1 = max(0, x1 - pad_x)
            py1 = max(0, y1 - pad_y)
            px2 = min(img.shape[1], x2 + pad_x)
            py2 = min(img.shape[0], y2 + pad_y)
            crop = img[py1:py2, px1:px2]
            if crop.size > 0:
                best_plate_crop = crop
                yolo_box = (px1, py1, px2, py2)
                break
        if best_plate_crop is not None:
            break
            
    if best_plate_crop is None:
        return {"plate_number": "Not Detected", "confidence": 0, "status": "Detection Failed"}
        
    versions = preprocess_plate(best_plate_crop)
    
    # Run EasyOCR on each version
    all_raw_detections = []
    
    for method_name, proc_img in versions.items():
        try:
            detections = reader.readtext(
                proc_img,
                detail=1,
                paragraph=False,
                allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
                contrast_ths=0.1,
                adjust_contrast=0.5
            )
        except Exception:
            continue
            
        if not detections:
            continue
            
        # Sort detections in reading order (top-to-bottom, left-to-right)
        # Using y center and x center
        parsed = []
        for bbox, text, conf in detections:
            clean = clean_alphanumeric(text)
            if not clean or clean == "IND" or len(clean) < 2:
                continue
            ys = [p[1] for p in bbox]
            xs = [p[0] for p in bbox]
            cy = sum(ys) / len(ys)
            cx = sum(xs) / len(xs)
            parsed.append({
                "clean": clean,
                "conf": float(conf),
                "cy": cy,
                "cx": cx
            })
            
        if not parsed:
            continue
            
        # Group into lines by vertical separation
        h_img = proc_img.shape[0]
        line_threshold = h_img * 0.35
        
        # Sort primarily by cy, then cx
        parsed.sort(key=lambda item: item["cy"])
        lines = []
        current_line = [parsed[0]]
        
        for item in parsed[1:]:
            if abs(item["cy"] - current_line[0]["cy"]) < line_threshold:
                current_line.append(item)
            else:
                lines.append(current_line)
                current_line = [item]
        lines.append(current_line)
        
        # Sort each line left-to-right
        combined_text_parts = []
        confs = []
        for line in lines:
            line.sort(key=lambda item: item["cx"])
            line_str = "".join(item["clean"] for item in line)
            combined_text_parts.append(line_str)
            confs.extend(item["conf"] for item in line)
            
        full_merged = "".join(combined_text_parts)
        avg_conf = sum(confs) / max(len(confs), 1)
        
        all_raw_detections.append({
            "text": full_merged,
            "conf": avg_conf,
            "method": method_name,
            "individual_parts": [p["clean"] for p in parsed]
        })

    # Now evaluate and score candidates
    candidate_scores = {}
    
    for det in all_raw_detections:
        raw_text = det["text"]
        conf = det["conf"]
        method = det["method"]
        
        # Candidate generation:
        # 1. Raw text
        # 2. Stripped border artifacts (leading/trailing noise)
        # 3. Normalized by Indian pattern
        text_variants = strip_border_artifacts(raw_text)
        
        # Also include individual parts if raw text had multiple parts
        for part in det["individual_parts"]:
            if len(part) >= 6:
                text_variants.extend(strip_border_artifacts(part))
                
        # Also if MH14 or TN45 was split
        # Check permutations of parts
        parts = [p for p in det["individual_parts"] if p not in ["IND"] and len(p) >= 2]
        if len(parts) >= 2:
            import itertools
            for perm in itertools.permutations(parts[:3]):
                joined = "".join(perm)
                text_variants.extend(strip_border_artifacts(joined))

        text_variants = list(dict.fromkeys(text_variants))

        for v in text_variants:
            v_clean = clean_alphanumeric(v)
            if len(v_clean) < 4:
                continue
                
            norm_v = normalize_by_indian_pattern(v_clean)
            
            for cand in [v_clean, norm_v]:
                if not cand or len(cand) < 4:
                    continue
                    
                if cand not in candidate_scores:
                    candidate_scores[cand] = {
                        "text": cand,
                        "raw_confidences": [conf],
                        "methods": [method],
                        "format_valid": is_valid_indian_format(cand),
                        "has_state_code": cand[:2] in INDIAN_STATE_CODES,
                        "len": len(cand)
                    }
                else:
                    candidate_scores[cand]["raw_confidences"].append(conf)
                    if method not in candidate_scores[cand]["methods"]:
                        candidate_scores[cand]["methods"].append(method)

    if not candidate_scores:
        return {"plate_number": "Not Recognized", "confidence": 0, "status": "OCR Failed"}

    # Scoring algorithm
    scored_list = []
    for cand, data in candidate_scores.items():
        base_conf = max(data["raw_confidences"])
        mean_conf = sum(data["raw_confidences"]) / len(data["raw_confidences"])
        
        # Method agreement bonus
        method_count = len(data["methods"])
        agreement_bonus = min(0.35, (method_count - 1) * 0.08) if method_count > 1 else 0.0
        
        # Format bonus
        format_bonus = 0.0
        if data["format_valid"]:
            format_bonus += 0.35
        elif data["has_state_code"] and 8 <= data["len"] <= 10:
            format_bonus += 0.20
        elif data["has_state_code"]:
            format_bonus += 0.10
            
        # Length realism
        if 8 <= data["len"] <= 10:
            format_bonus += 0.10
        elif data["len"] < 6:
            format_bonus -= 0.30
            
        # Final combined score
        score = (base_conf * 0.4) + (mean_conf * 0.2) + agreement_bonus + format_bonus
        
        # Boosted confidence calculation
        final_conf = min(0.999, max(base_conf, mean_conf + (agreement_bonus * 0.5)))
        if data["format_valid"]:
            final_conf = min(0.999, max(final_conf, 0.85 + (agreement_bonus * 0.3)))
            
        scored_list.append({
            "text": cand,
            "score": score,
            "confidence": round(final_conf * 100, 2),
            "methods": data["methods"],
            "format_valid": data["format_valid"]
        })

    # Sort candidates by score descending
    scored_list.sort(key=lambda x: x["score"], reverse=True)
    best = scored_list[0]
    
    return {
        "plate_number": best["text"],
        "confidence": best["confidence"],
        "method": best["methods"][0] if best["methods"] else "Multi-Method",
        "methods_count": len(best["methods"]),
        "format_valid": best["format_valid"],
        "all_top": [(c["text"], c["score"], c["confidence"]) for c in scored_list[:3]]
    }

print("Running validation on all 6 target images...")
test_cases = [
    ("bus1.jpg", "images/bus1.jpg", "IN45N3729 / TN45N3729"),
    ("car.jpg", "images/car.jpg", "TN63BY7954"),
    ("car2.jpg", "images/car2.jpg", "MH47TC0964"),
    ("car3.jpg", "images/car3.jpg", "MH14GN9239"),
    ("car4.jpg", "images/car4.jpg", "BR28AE1922"),
    ("toll_difficult.jpg", "evidence/original/2026-10-07_22-24-54_Screenshot_2026-10-07_222308.jpg", "HR26LF7571 / HR26...")
]

for name, path, exp in test_cases:
    out = run_anpr_on_image(path)
    print(f"\n{name:18s} (Expected: {exp})")
    print(f"  Result Plate : {out.get('plate_number')}")
    print(f"  Confidence   : {out.get('confidence')}%")
    print(f"  Valid Format : {out.get('format_valid')}")
    print(f"  Methods Agree: {out.get('methods_count')}")
    print(f"  Top 3        : {out.get('all_top')}")
