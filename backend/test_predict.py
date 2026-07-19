import requests
import cv2
import numpy as np

# create a blank image and save it
img = np.zeros((200, 200, 3), dtype=np.uint8)
cv2.imwrite("blank.jpg", img)

with open("blank.jpg", "rb") as f:
    res = requests.post("http://127.0.0.1:5000/api/predict", files={"image": f})

print("Status:", res.status_code)
print("Response:", res.text)
