import requests
import os

# ==========================================
# SETTINGS
# ==========================================

API_URL = "http://127.0.0.1:5000/predict"

IMAGE_FOLDER = "images"

IMAGE_FILES = [
    "bus1.jpg",
    "car.jpg",
    "car2.jpg",
    "car3.jpg",
    "car4.jpg",
    "car5.jpg",
    "car6.jpg",
    "car7.jpg",
    "car8.jpg",
    "car9.jpg",
    "car10.jpg",
    "truck1.jpg"
]


# ==========================================
# EXPECTED PLATES
# ==========================================
# IMPORTANT:
# Enter the actual plate numbers here.
# These are used ONLY to calculate actual
# correctness, not just OCR confidence.

EXPECTED_PLATES = {
    "bus1.jpg": "N3729",

    "car.jpg": "7462812954",

    "car2.jpg": "MH47TC0964",

    "car3.jpg": "MH14GN9239",

    "car4.jpg": "BR284E1922",

    "car5.jpg": "",

    "car6.jpg": "",

    "car7.jpg": "",

    "car8.jpg": "",

    "car9.jpg": "",

    "car10.jpg": "",

    "truck1.jpg": ""
}


# ==========================================
# START
# ==========================================

print()
print("=" * 60)
print("        ANPR ALL IMAGE /predict TEST")
print("=" * 60)

results = []


# ==========================================
# TEST ALL IMAGES
# ==========================================

for image_name in IMAGE_FILES:

    image_path = os.path.join(
        IMAGE_FOLDER,
        image_name
    )

    print()
    print("-" * 60)
    print("Testing:", image_name)

    if not os.path.exists(image_path):

        print("ERROR: Image not found")

        results.append({
            "image": image_name,
            "plate": "FILE NOT FOUND",
            "confidence": 0,
            "status": "File Error",
            "correct": False
        })

        continue


    try:

        with open(
            image_path,
            "rb"
        ) as image_file:

            response = requests.post(
                API_URL,
                files={
                    "image": (
                        image_name,
                        image_file,
                        "image/jpeg"
                    )
                },
                timeout=120
            )


        if response.status_code != 200:

            print(
                "API ERROR:",
                response.status_code
            )

            print(response.text)

            results.append({
                "image": image_name,
                "plate": "API ERROR",
                "confidence": 0,
                "status": "API Error",
                "correct": False
            })

            continue


        data = response.json()


        plate = str(
            data.get(
                "plate_number",
                "Not Recognized"
            )
        ).upper()


        confidence = float(
            data.get(
                "ocr_confidence",
                0
            )
        )


        status = data.get(
            "status",
            "Unknown"
        )


        method = data.get(
            "best_method",
            "None"
        )


        print(
            "Plate:",
            plate
        )

        print(
            "Confidence:",
            confidence
        )

        print(
            "Status:",
            status
        )

        print(
            "Method:",
            method
        )


        # ==================================
        # CHECK ACTUAL CORRECTNESS
        # ==================================

        expected = EXPECTED_PLATES.get(
            image_name,
            ""
        )


        if expected:

            expected = expected.upper()

            if plate == expected:

                correct = True

                print(
                    "Actual Match: YES"
                )

            else:

                correct = False

                print(
                    "Actual Match: NO"
                )

                print(
                    "Expected:",
                    expected
                )

        else:

            # No ground-truth entered yet

            correct = None

            print(
                "Actual Match: NOT CHECKED"
            )


        results.append({

            "image": image_name,

            "plate": plate,

            "confidence": confidence,

            "status": status,

            "method": method,

            "expected": expected,

            "correct": correct

        })


    except Exception as error:

        print(
            "ERROR:",
            error
        )

        results.append({

            "image": image_name,

            "plate": "ERROR",

            "confidence": 0,

            "status": "Test Error",

            "method": "None",

            "expected": "",

            "correct": False

        })


# ==========================================
# CALCULATE RESULTS
# ==========================================

total = len(results)

recognized = sum(
    1
    for r in results
    if r["status"] == "Recognized"
)

low_confidence = sum(
    1
    for r in results
    if r["status"] == "Low Confidence"
)

failed = sum(
    1
    for r in results
    if r["status"] in [
        "OCR Failed",
        "Detection Failed"
    ]
)


# ==========================================
# ACTUAL MATCH CALCULATION
# ==========================================

checked_results = [
    r
    for r in results
    if r["expected"] != ""
]

correct = sum(
    1
    for r in checked_results
    if r["correct"] is True
)

checked_total = len(
    checked_results
)


if checked_total > 0:

    actual_accuracy = (
        correct /
        checked_total
    ) * 100

else:

    actual_accuracy = 0


# ==========================================
# OCR RECOGNITION RATE
# ==========================================

recognition_rate = (
    recognized /
    total
) * 100


# ==========================================
# FINAL RESULTS
# ==========================================

print()
print("=" * 60)
print("              FINAL TEST RESULTS")
print("=" * 60)

print(
    "Total Images Tested :",
    total
)

print(
    "Recognized          :",
    recognized
)

print(
    "Low Confidence      :",
    low_confidence
)

print(
    "Failed              :",
    failed
)

print(
    "OCR Recognition Rate:",
    round(
        recognition_rate,
        2
    ),
    "%"
)

print()
print(
    "Ground Truth Checked:",
    checked_total
)

print(
    "Correct Matches     :",
    correct
)

print(
    "Actual Accuracy     :",
    round(
        actual_accuracy,
        2
    ),
    "%"
)


# ==========================================
# IMAGE-WISE RESULTS
# ==========================================

print()
print("=" * 60)
print("              IMAGE-WISE RESULTS")
print("=" * 60)

for r in results:

    print()
    print(
        "Image:",
        r["image"]
    )

    print(
        "Detected:",
        r["plate"]
    )

    print(
        "Confidence:",
        r["confidence"]
    )

    print(
        "Status:",
        r["status"]
    )

    print(
        "Method:",
        r["method"]
    )

    if r["expected"]:

        print(
            "Expected:",
            r["expected"]
        )

        print(
            "Correct:",
            "YES" if r["correct"]
            else "NO"
        )


print()
print("=" * 60)
print("             ALL IMAGE TEST COMPLETED")
print("=" * 60)