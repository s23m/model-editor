let image;
let grayImage;
let blurImage;
let thresImage;

// Upload and store image for processing
let imgElement = document.getElementById("input-image");
let inputElement = document.getElementById("file-input");

// Initial values
const lowerThresholdSlider = document.getElementById("lowerThresholdSlider");
const upperThresholdSlider = document.getElementById("upperThresholdSlider");
const thresholdTypeDropdown = document.getElementById("thresholdTypeDropdown");
const lowerThresholdLabel = document.getElementById("lowerThresholdLabel");
const upperThresholdLabel = document.getElementById("upperThresholdLabel");

// Load image and apply gray, blur and threshold
inputElement.addEventListener("change", (e) => {
    imgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);

imgElement.onload = function () {
    let mat = cv.imread(imgElement);
    image = mat;

    grayImage = new cv.Mat();
    cv.cvtColor(image, grayImage, cv.COLOR_BGR2GRAY);

    blurImage = new cv.Mat();
    cv.GaussianBlur(grayImage, blurImage, new cv.Size(5, 5), 0);

    thresImage = new cv.Mat();
    cv.threshold(blurImage, thresImage, 200, 255, cv.THRESH_BINARY);
    cv.bitwise_not(thresImage, thresImage);

    cv.imshow("output-image", thresImage);
};

// Apply Threshold to current image 
// Default threshold inputs are 200, 255, cv.THRESH_BINARY which is 0
function applyThreshold() {
    const lowerThresholdValue = parseInt(lowerThresholdSlider.value);
    const upperThresholdValue = parseInt(upperThresholdSlider.value);
    const thresholdType = parseInt(thresholdTypeDropdown.value);


    lowerThresholdLabel.textContent = `Lower Threshold: ${lowerThresholdValue}`;
    upperThresholdLabel.textContent = `Upper Threshold: ${upperThresholdValue}`;

    thresImage.delete();
    thresImage = new cv.Mat();
    cv.threshold(blurImage, thresImage, lowerThresholdValue, upperThresholdValue, thresholdType);
    cv.bitwise_not(thresImage, thresImage);
    cv.imshow("output-image", thresImage);
}

// Attach event listeners to handle value changes
lowerThresholdSlider.addEventListener("input", applyThreshold);
upperThresholdSlider.addEventListener("input", applyThreshold);
thresholdTypeDropdown.addEventListener("change", applyThreshold);

// Initial function call to set the initial labels
applyThreshold();

// Detect shapes
function detect() {
    // Find contours
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    let finalImage = image;
    cv.findContours(thresImage, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    // Iterate through contours
    for (let i = 0; i < contours.size(); ++i) {

        console.log(contours.size() + "Shapes")

        // Approximate contour
        let contour = contours.get(i);
        let epsilon = 0.01 * cv.arcLength(contour, true);
        let approx = new cv.Mat();
        cv.approxPolyDP(contour, approx, epsilon, true);

        // Determine shape
        let shape;
        if (approx.rows == 3) {
            shape = "Triangle";
        } else if (approx.rows == 4) {
            let rect = cv.boundingRect(contour);
            let width = rect.width;
            let height = rect.height;

            // Check if square or rectangle
            let ratio = width / height;
            if (Math.abs(ratio - 1) < 0.1) {
                shape = "Square";
            } else {
                shape = "Rectangle";
            }
        } else if (approx.rows == 5) {
            shape = "Pentagon";
        } else {
            let ellipse = cv.fitEllipse(contour);
            let aspectRatio = ellipse.size.width / ellipse.size.height;
            if (aspectRatio >= 0.9 && aspectRatio <= 1.1) {
                shape = "Circle";
            } else {
                shape = "Oval";
            }
        }

        // Draw shape
        cv.drawContours(finalImage, contours, i, new cv.Scalar(0, 255, 0, 255), 2);
        cv.putText(finalImage, shape, new cv.Point(contour.data32S[0], contour.data32S[1]), cv.FONT_HERSHEY_SIMPLEX, 0.5, new cv.Scalar(255, 0, 0, 255), 2);

        contour.delete();
        approx.delete();
    }

    cv.imshow('output-image', finalImage);

    contours.delete();
    hierarchy.delete();
}