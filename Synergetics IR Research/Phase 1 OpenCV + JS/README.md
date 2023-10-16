# S23M Model Editor

## Image Recognition Research Project
Implementation of OpenCV JavaScript library to attempt to recognise shapes in given image files.

### How to Use
Open `index.html` and wait for OpenCV.js to load. There is an indicator at the top of the page to display whether the library is loaded or not.

Click `Upload Image` on the right side of the screen and choose an image file to load. There are some sample images in `/images`. The uploaded image will be previewed in the upper half of the page and used as input for the detection algorithm.

Choose threshold type to be applied to the input image. Current options are:
- Binary
- Binary Inverted
- Truncation
- To-Zero
- To-Zero Inverted
- Mask
- Otsu
- Triangle

Choose upper and lower threshold boundaries using the corresponding sliders. Changes will be applied immediately to the input image.

Once you are ready to run the shape detection algorithm, click `Detect Shapes` and the result will be displayed underneath the uploaded input image.