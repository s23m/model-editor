import cv2
import numpy as np
from matplotlib import pyplot as plt

# reading image
img = cv2.imread('input.png')

# converting image into grayscale image
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# setting threshold of gray image
_, threshold = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)

# using a findContours() function
contours, _ = cv2.findContours(
	threshold, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

# initialise mask
mask = np.ones(img.shape[:2], dtype="uint8") * 255

i = 0
# loop over contours
for contour in contours:

	# here we are ignoring first counter because
	# findcontour function detects whole image as shape
	if i == 0:
		i = 1
		continue    

	# cv2.approxPloyDP() function to approximate the shape
	approx = cv2.approxPolyDP(
		contour, 0.01 * cv2.arcLength(contour, True), True)
	
	# using drawContours() function.            thickness=cv2.FILLED            args to fill shape
	cv2.drawContours(mask, [contour], 0, (0, 255, 0), 1)
	#get coordinets or somethin herhe for each traced object
	#if rectangel: store in rectangle list with coordos

# displaying the image after drawing contours
img = cv2.bitwise_and(img, img, mask=mask)
cv2.imshow("Mask", mask)

cv2.waitKey(0)
cv2.destroyAllWindows()