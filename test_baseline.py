import requests

test_files = [
    ('bus1.jpg', 'images/bus1.jpg'),
    ('car.jpg', 'images/car.jpg'),
    ('car2.jpg', 'images/car2.jpg'),
    ('car3.jpg', 'images/car3.jpg'),
    ('car4.jpg', 'images/car4.jpg'),
    ('toll_difficult.jpg', 'evidence/original/2026-10-07_22-24-54_Screenshot_2026-10-07_222308.jpg')
]

for name, path in test_files:
    try:
        with open(path, 'rb') as f:
            r = requests.post('http://127.0.0.1:5000/predict', files={'image': (name, f, 'image/jpeg')})
        d = r.json()
        print(f"{name:18s} -> plate={d.get('plate_number')} | conf={d.get('ocr_confidence')}% | method={d.get('best_method')} | status={d.get('status')}")
    except Exception as e:
        print(f"{name:18s} -> ERROR: {e}")
