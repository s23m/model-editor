# S23M Model Editor

## Image Recognition Research Project
Python program utilising TensorFlow to load a pre-trained model and have it run object detection on input images, recognising elements and overlaying the results on an output image.

### How to Use
There are 4 global variables that should be configured prior to running the script, namely:
- **PATH_TO_CFG** The path to the pipeline.config file of the model you wish to use
- **PATH_TO_CKPT** The path to the checkpoint folder of the model you wish to use
- **PATH_TO_LABELS** The path to the label_map.pbtxt file
- **IMAGE_PATHS** Paths to any input images. This is what the model will find detections on. Multiple images can be used, just specify each path separated by a comma

Assuming no code changes have been made, these variables can be found on lines 18, 19, 20, and 21.

Once the variables have been configured, open a terminal and navigate to where the script is located and type:

`python plot_object_detection_checkpoint.py`

And hit ENTER.

The program will output its results as PNG images files in the same directory that the script is located.

GitHub limits file sizes to 25MB, so our model wasn't able to be added to this repository. If you wish to use the custom-trained model by Synergetics as a base, it can be downloaded from Google Drive [here](https://drive.google.com/file/d/1E3RnWxH-0rTIHQCcaNqazkhN8TxOahHY/view?usp=drive_link). If the link is unavailable for any reason, reach out to Jack Girard at n11252511@qut.edu.au.