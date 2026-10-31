import re

# ==========================================
# OCR RESULTS FROM YOUR 12 TEST IMAGES
# ==========================================

ocr_results = {
    "bus1.jpg": [
        ("TN45", 99.86),
        ("N3729", 89.97)
    ],

    "car.jpg": [
        ("762842954", 32.09)
    ],

    "car2.jpg": [
        ("MH47TC0964", 99.68)
    ],

    "car3.jpg": [
        ("MHIL", 61.11),
        ("IND", 99.99),
        ("GN", 92.36),
        ("9239", 100.0)
    ],

    "car4.jpg": [
        ("BR2BAE1922", 56.52)
    ],

    "car5.jpg": [],

    "car6.jpg": [
        ("HR2GCEZ6T4", 35.23)
    ],

    "car7.jpg": [
        ("HHO1DB6198", 87.38)
    ],

    "car8.jpg": [
        ("IHBI2002884", 15.62)
    ],

    "car9.jpg": [
        ("HRLOK3879", 90.78)
    ],

    "car10.jpg": [
        ("K", 99.41),
        ("8025", 12.09),
        ("45", 66.97),
        ("IND", 99.99)
    ],

    "truck1.jpg": [
        ("KA32AA9BIA", 8.14)
    ]
}


# ==========================================
# CLEAN OCR TEXT
# ==========================================

def clean_text(text):

    text = text.upper()

    # Remove spaces and special characters
    text = re.sub(r"[^A-Z0-9]", "", text)

    return text


# ==========================================
# REMOVE COMMON NON-PLATE TEXT
# ==========================================

def is_irrelevant(text):

    unwanted = [
        "IND",
        "INDIA"
    ]

    return text in unwanted


# ==========================================
# CHECK POSSIBLE INDIAN PLATE FORMAT
# ==========================================

def is_possible_plate(text):

    text = clean_text(text)

    # Normal Indian registration pattern:
    # 2 letters + 1-2 digits + 1-3 letters + 1-4 digits
    pattern = r"^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$"

    if re.match(pattern, text):
        return True

    return False


# ==========================================
# PROCESS RESULTS
# ==========================================

print("\n==========================================")
print("       OCR POST-PROCESSING TEST")
print("==========================================")

for image_name, detections in ocr_results.items():

    print("\n------------------------------------------")
    print("IMAGE:", image_name)
    print("------------------------------------------")

    if not detections:

        print("Result: OCR Failed")
        continue

    candidates = []

    for text, confidence in detections:

        cleaned = clean_text(text)

        if is_irrelevant(cleaned):
            continue

        print(
            "Detected:",
            cleaned,
            "| Confidence:",
            round(confidence, 2),
            "%"
        )

        if is_possible_plate(cleaned):

            candidates.append(
                (cleaned, confidence)
            )

    if candidates:

        # Highest confidence valid candidate
        best = max(
            candidates,
            key=lambda x: x[1]
        )

        print("\nPossible Plate:", best[0])
        print(
            "Confidence:",
            round(best[1], 2),
            "%"
        )

        if best[1] >= 70:

            print("Validation: VALID / HIGH CONFIDENCE")

        else:

            print("Validation: VALID FORMAT / LOW CONFIDENCE")

    else:

        print("\nPossible Plate: Not Found")
        print("Validation: INVALID / UNCERTAIN")


# ==========================================
# FINISHED
# ==========================================

print("\n==========================================")
print("       VALIDATION TEST COMPLETED")
print("==========================================")