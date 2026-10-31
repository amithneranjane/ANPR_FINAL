import requests
import os

# ==========================================
# SETTINGS
# ==========================================

API_URL = "http://127.0.0.1:5000/predict"

IMAGE_FOLDER = "images"

images = [
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
# COUNTERS
# ==========================================

total = 0
recognized = 0
low_confidence = 0
failed = 0

results = []

# ==========================================
# TEST ALL IMAGES
# ==========================================

print("\n==========================================")
print("       ANPR ALL IMAGE TEST")
print("==========================================")

for image_name in images:

    image_path = os.path.join(
        IMAGE_FOLDER,
        image_name
    )

    print("\nTesting:", image_name)

    if not os.path.exists(image_path):

        print("ERROR: Image not found")

        failed += 1

        results.append({
            "image": image_name,
            "status": "File Not Found"
        })

        continue

    try:

        with open(image_path, "rb") as image:

            response = requests.post(
                API_URL,
                files={
                    "image": image
                }
            )

        if response.status_code == 200:

            data = response.json()

            status = data.get(
                "status",
                "Unknown"
            )

            plate = data.get(
                "plate_number",
                "N/A"
            )

            confidence = data.get(
                "ocr_confidence",
                0
            )

            print("Plate:", plate)
            print("Confidence:", confidence)
            print("Status:", status)

            total += 1

            if status == "Recognized":

                recognized += 1

            elif status == "Low Confidence":

                low_confidence += 1

            else:

                failed += 1

            results.append({
                "image": image_name,
                "plate": plate,
                "confidence": confidence,
                "status": status
            })

        else:

            print(
                "API Error:",
                response.status_code
            )

            failed += 1

    except Exception as e:

        print("Error:", e)

        failed += 1


# ==========================================
# CALCULATE RATE
# ==========================================

if total > 0:

    recognition_rate = (
        recognized / total
    ) * 100

else:

    recognition_rate = 0


# ==========================================
# FINAL REPORT
# ==========================================

print("\n\n==========================================")
print("           FINAL TEST RESULTS")
print("==========================================")

print("Total Images Tested :", total)
print("Recognized           :", recognized)
print("Low Confidence       :", low_confidence)
print("Failed               :", failed)

print(
    "Recognition Rate     :",
    round(recognition_rate, 2),
    "%"
)

print("==========================================")

print("\nIMAGE-WISE RESULTS")
print("------------------------------------------")

for result in results:

    print(result)