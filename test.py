import cv2
import numpy as np

# Load clear vehicle image
image = cv2.imread("images/car.jpg")

# Original image
original = cv2.resize(image, (600, 400))

# Create simulated low-resolution image
low_res = cv2.resize(original, (150, 100))

# Upscale back to original size
upscaled = cv2.resize(
    low_res, (600, 400),
    interpolation=cv2.INTER_CUBIC
)

# Convert to grayscale
gray = cv2.cvtColor(upscaled, cv2.COLOR_BGR2GRAY)

# Reduce noise
denoised = cv2.bilateralFilter(gray, 9, 75, 75)

# Improve contrast using CLAHE
clahe = cv2.createCLAHE(
    clipLimit=2.0,
    tileGridSize=(8, 8)
)
enhanced = clahe.apply(denoised)

# Convert enhanced image back to BGR
enhanced_color = cv2.cvtColor(
    enhanced, cv2.COLOR_GRAY2BGR
)

# Display images
cv2.imshow("Original Image", original)
cv2.imshow("Low Resolution Image", upscaled)
cv2.imshow("Enhanced Low Resolution Image", enhanced_color)

cv2.waitKey(0)
cv2.destroyAllWindows()