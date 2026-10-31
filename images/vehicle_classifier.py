from ultralytics import YOLO

# Load pretrained YOLO model
vehicle_model = YOLO("yolo11n.pt")


def classify_vehicle(image):

    results = vehicle_model(
        image,
        verbose=False
    )

    vehicle_classes = {
        2: "Car",
        5: "Bus",
        7: "Truck"
    }

    detected_vehicles = []

    for result in results:

        for box in result.boxes:

            class_id = int(box.cls[0])
            confidence = float(box.conf[0])

            if class_id in vehicle_classes:

                detected_vehicles.append({
                    "vehicle_type": vehicle_classes[class_id],
                    "confidence": confidence
                })

    if not detected_vehicles:

        return "Not Classified", 0.0

    # Select highest-confidence vehicle
    best_vehicle = max(
        detected_vehicles,
        key=lambda x: x["confidence"]
    )

    return (
        best_vehicle["vehicle_type"],
        round(
            best_vehicle["confidence"] * 100,
            2
        )
    )