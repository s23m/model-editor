/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Vertex } from "../DataStructures/Vertex";
import { Arrow } from "../DataStructures/Arrow";
import { Tool } from "./LeftMenu";
import { Graph } from "../DataStructures/Graph";


// Core variables
let canvasElement;
let canvasContext;

// Mouse / Cursor
let mouseStartX;
let mouseStartY;

let previousObject;
let startX, startY, endX, endY;

let yRows = 70;

export var mouseOriginX;
export var mouseOriginY;

// Non zoomed in Width/Height (in pixels)
let canvasWidth;
let canvasHeight;

// Zoom and Pan
let zoom = 200.0;

// Renderable objects
export var currentObjects = new Graph();

export var savedArrows = [];

// The naming conventions here are terrible, but basically the render keys determine where
// a tree view element is placed in the graph while the model functions determine what's 
// actually being rendered

export let currentRenderKey = 0;
export let totalRenderKeys = 0

export let currentModel = 0;
export let totalModels = 0;

export function getCurrentRenderKey() {
    return currentRenderKey;
}

export function setNewRenderKey(newKey) {
    currentRenderKey = newKey;
}

export function getTotalRenderKeys() {
    return totalRenderKeys;
}

export function incrementTotalRenderKeys() {
    totalRenderKeys = totalRenderKeys += 1;
}

// --- Model Key Stuff --- //

export function getCurrentModel() {
    return currentModel;
}

export function setNewModel(newModel) {
    currentModel = newModel;
}

export function getTotalModels() {
    return totalModels;
}

export function incrementTotalModels() {
    totalModels = totalModels += 1;
}
// Arrow Path
export var arrowPath = [];
let lastX = 0;
let lastY = 0;

// Arrow moving
let startMoveX = 0;
let startMoveY = 0;

// Resize status
let resizing = false;

let arrowType = 0;
let firstArrowJoint = true;

let cancelDraw = false;

//Block Past location var
let past_location = [];
let past_size = [];
let selectedObject;
export var blockBeenSelected = false;

// Init
export function assignElement(elementID) {
    canvasElement = document.getElementById(elementID);
    canvasContext = canvasElement.getContext("2d");

    resetMouseOrigin();

}

export function getModelName() {
    let nameElement = document.getElementById("ModelName")

    if (nameElement === null) {
        return "Unnamed Graph"
    }
    if (nameElement.value === "" || nameElement.value === null || nameElement.value === undefined) {
        return "Unnamed Model"
    }
    return nameElement.value;
}

export function resetMouseOrigin() {
    try {
        let canvasRect = canvasElement.getBoundingClientRect();
        mouseOriginX = canvasRect.left;
        mouseOriginY = canvasRect.top;
        recalculateScale();
        clearCanvas();
    } catch {
        console.error("Failed to acquire canvas element");
    }
    drawAll()
}


// Core functions
export function drawAll() {
    updateArrows();
    clearCanvas();

    canvasContext.resetTransform();
    canvasContext.scale(getEffectiveZoom(), getEffectiveZoom());

    currentObjects.flatten().forEach((item) => {
        if (item !== null) {
            //console.log("HERE " + item.typeName)
            //Only render the objects which are in the currently selected containment

            if (item.getModelKey() === currentModel) {
                /*
                if (item.typeName === "Vertex"){
                    console.log("Item is set as present")
                    item.setPresent();
                }
                */
                item.draw(canvasContext);

            }

            /*
            else if (item.getModelKey() !== currentModel && item.typeName === "Vertex"){
                console.log("Item is sent away")
                item.setAway();
                //console.log("The item to not be rendered is" + item.typeName);
            }
            */

        }
    });

}

export function deleteElement(element) {

    if (element !== null) {
        if (!currentObjects.remove(element)) {
            console.error("Failed to delete object with UUID %s", element.semanticIdentity.UUID);
        }
    } else {
        console.error("Attempted to delete a null element");
    }

    drawAll()
}

//this is the same as the above, except when you're deleting a vertex with an arrow connected the edge connection code freaks out.
//this here deletes any arrows connected to the vertex before deleting the vertex to get around this
export function vertexDeleteElement(element) {
    //find the UUID of the vertex for arrow dest and source matching
    let selectedVertUUID = element.semanticIdentity.UUID;

    //Get the arrow UUID's
    let sourceUUIDs = currentObjects.ArrowUUIDSource(element);
    let destUUIDs = currentObjects.ArrowUUIDDest(element);
    //find an arrow with matching source/dest if they exist

    sourceUUIDs.forEach(element => currentObjects.remove(element.arrow));
    destUUIDs.forEach(element => currentObjects.remove(element.arrow))

    //Now that the arrows are out of the way, we're safe to delete the vertex (same code as above)
    if (element !== null) {
        if (!currentObjects.remove(element)) {
            console.error("Failed to delete object with UUID %s", element.semanticIdentity.UUID);
        }
    } else {
        console.error("Attempted to delete a null element");
    }

    drawAll()

}

export function updateRows() {
    yRows = document.getElementById("canvasRows").value;
    drawAll()
}

// Format co-ordinate so that the value aligns with a row
function findNearestGridY(y, top) {

    // distance to topmost top rowLine
    let slotHeight = canvasHeight / yRows * zoom / 100 * 200 / zoom;

    // which row to put it in
    let slot = Math.floor(y / slotHeight);

    // y co-ordinate of that row (if bottom then go up by row gap)
    return slotHeight * slot + (slotHeight / 2 * + top)
}

// Checks to see which side it should resize on
function checkResizeBounds(x, y) {
    // Iterate through all objects and only check vertices
    let currentObjectsFlattened = currentObjects.flatten();
    for (let i = 0; i < currentObjectsFlattened.length; i++) {
        let item = currentObjectsFlattened[i];

        if (item.constructor.name === "Vertex") {
            // Get vertex bounds
            // x1 y1 are the lower coordinates
            // x2 y2 are the upper coordinates
            // Note: x2 y2 are not width/height values

            //tolerance in px
            let tolerance = 10;

            let bounds = item.getBounds();
            let x1 = bounds[0];
            let y1 = bounds[1];
            let x2 = bounds[2];
            let y2 = bounds[3];

            let top = Math.abs(y1 - y) < tolerance;
            let bottom = Math.abs(y2 - y) < tolerance;
            let left = Math.abs(x1 - x) < tolerance;
            let right = Math.abs(x2 - x) < tolerance;
            let inYBounds = y > y1 && y < y2;
            let inXBounds = x > x1 && x < x2;

            if (right && inYBounds) {
                return [item, "right"];
            }

            if (top && left) {
                return [item, "topLeft"];
            } else if (top && right) {
                return [item, "topRight"];
            } else if (bottom && left) {
                return [item, "bottomLeft"];
            } else if (bottom && right) {
                return [item, "bottomRight"];
            } else if (left && inYBounds) {
                return [item, "left"];
            } if (right && inYBounds) {
                return [item, "right"];
            } else if (top && inXBounds) {
                return [item, "top"];
            } else if (bottom && inXBounds) {
                return [item, "bottom"];
            }
        }
    }

    // All else fails
    return [null, null];
}

export const distanceThreshold = 15;

// Find connectable for arrow within a threshold distance
function getConnectionDataForArrow(cursorX, cursorY) {
    const angleThreshold = 8;

    let nearest = null;
    let nearestDistance = 0;

    // Find nearest connectable
    currentObjects.flatten().forEach((item) => {
        if (item !== null) {
            if (item.constructor.name === "Vertex") {
                let sideData = item.getNearestSideFrom(cursorX, cursorY, lastX, lastY);
                // Only check if valid
                if (sideData !== null && sideData[0] < distanceThreshold) {
                    // Compare dist
                    if (nearest === null || sideData[0] < nearestDistance) {
                        nearest = [0, item.semanticIdentity.UUID, sideData[1], sideData[2]];
                        nearestDistance = sideData[0];
                    }
                }
            }
        }
    });

    // Set coordinates
    let coordinate = nearest;
    if (nearest === null) {
        coordinate = [1, cursorX, cursorY];
    }

    // If can't snap to right angles
    if (arrowPath.length < 1 || coordinate[0] === 0) return { coord: coordinate, snapped: nearest !== null, nearest: nearest };

    // Get angle
    let lastPathX = arrowPath[arrowPath.length - 1][1];
    let lastPathY = arrowPath[arrowPath.length - 1][2];
    let x = coordinate[1] - lastPathX;
    let y = coordinate[2] - lastPathY;

    // must be y,x check documentation if you dont believe me
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    // Make positive
    angle = (angle + 360) % 360;
    // Get relative
    let relAngle = angle % 90;

    // Check if it should snap to right angles
    if (relAngle > 90 - angleThreshold || relAngle < angleThreshold) {
        // Get length
        let l = getDistance(0, 0, x, y);

        // Choose angle
        let angles = [0, 90, 180, 270, 360];
        let nearestAngle = angles[0];
        for (let i = 1; i < angles.length; i++) {
            if (Math.abs(angles[i] - angle) < Math.abs(nearestAngle - angle)) {
                nearestAngle = angles[i];
            }
        }
        let nearestRad = nearestAngle * (Math.PI / 180);

        // Create vector
        let xv = l * Math.cos(nearestRad);
        let yv = l * Math.sin(nearestRad);

        // Create point (not vector sitting on 0,0)
        coordinate = [coordinate[0], lastPathX + xv, lastPathY + yv];


    }

    return { coord: coordinate, snapped: nearest !== null, nearest: nearest }
}

export function getSelectedObject(canvas) {
    return canvas.props.mainState.selectedObject
}

function resizeObjectOnMouseMove(e, resizeVars) {
    let coords = getGraphXYFromMouseEvent(e);

    resizeVars[0].expandSide(resizeVars[1], coords[0], coords[1], canvasContext);

    //grab object and arrows connected to it
    // update arrows
    updateA();
}

// Sets the objects uuid and adds it to the root of currentObjects
function addObject(object) {
    if (object === null || object === undefined) return;
    currentObjects.add(object);
}

// Sets the currentObjects value to a new one. WARNING it will override the current value without any checks
export function setCurrentObjects(newObjects) {
    currentObjects = newObjects;
    drawAll();
}

export function newFile() {
    // Confirm
    let r = window.confirm("Are you sure, this will clear the current canvas!");
    if (r === true) {
        console.log("Clearing canvas");
        window.location.reload();
    } else {
        console.log("User opted to not clear the canvas");
    }

    // Redraw
    drawAll(currentObjects);
}

function arrowToolSelected() {
    return arrowType === Tool.Visibility || arrowType === Tool.Edge || arrowType === Tool.Specialisation
}

export function getObjectFromUUID(UUID) {
    let foundObject;
    currentObjects.flatten().forEach((item) => {
        if (item.semanticIdentity.UUID === UUID) {
            foundObject = item;
        }
    });
    return foundObject;
}


function findNearestArrowPointIndex(x, y) {
    let nearestPointIndex = -1;
    // Nearest distance here is used as a tolerance variable
    let nearestDistance = 30;
    let cDist;
    let nearestArrow = null;

    currentObjects.flatten().forEach((item) => {
        if (item.constructor.name === "Arrow") {
            item.path.forEach((point) => {
                cDist = Math.hypot(x - point[0], y - point[1]);
                console.log(cDist);
                if (cDist < nearestDistance) {
                    nearestDistance = cDist;
                    nearestPointIndex = item.path.indexOf(point);
                    nearestArrow = item
                }
            });
        }
    });
    return [nearestPointIndex, nearestArrow]
}

function StickArrowToObject(connectionData, arrow, index) {
    // so the line sticks to object
    if (connectionData['snapped'] === false) {
        let coord = connectionData['coord'];
        // update the arrow
        arrow.path[index] = [coord[1], coord[2]]
    } else {
        let vertexUUID = connectionData['nearest'][1];
        let vertex = getObjectFromUUID(vertexUUID);

        if (vertex !== undefined) {
            arrow.path[index] = arrow.rebuildPath()
        }
    }
}

function moveArrowPointOnMouseMove(e, index, arrow) {
    let x, y;
    [x, y] = getGraphXYFromMouseEvent(e);
    let conData = getConnectionDataForArrow(x, y);
    arrow.pathData[index] = conData['nearest'];
    StickArrowToObject(conData, arrow, index);


}


// Event based functions
export function onLeftMousePress(canvas, x, y) {

    // Checks if your mouse is in range of the borders of a box to resize them
    let resizeVars = checkResizeBounds(x, y);
    if (canvas.tool === Tool.Vertex || canvas.tool === Tool.Select) {
        if (resizeVars[0] !== null) {
            if (resizeVars[0] === getSelectedObject(canvas)) {
                saveBlockStates(canvas, x, y);
                resizing = true;
                canvasElement.onmousemove = function (e) {
                    resizeObjectOnMouseMove(e, resizeVars);

                };
                return;
            }
        } else {
        }



        let intersection = findIntersected(x, y);
        if (canvas.tool === Tool.Vertex && intersection !== null) {
            //console.log("Selecting intersected Vertex");
            canvas.props.setLeftMenu(intersection);
            canvas.props.setMode(Tool.Select);
            cancelDraw = true;
            return;
        }

    }

    if (canvas.tool === Tool.Select) {
        let index, arrow;
        [index, arrow] = findNearestArrowPointIndex(x, y);
        console.log(index, arrow);
        if (arrow === getSelectedObject(canvas)) {
            if (index !== -1) {
                resizing = true;
                let func = function (e) {
                    moveArrowPointOnMouseMove(e, index, arrow)
                };


                canvasElement.addEventListener("mousemove", func);
                canvasElement.addEventListener("mouseup", () => {
                    canvasElement.removeEventListener("mousemove", func);
                    console.log("removed")
                })
            }
        }
    }


    mouseStartX = x;
    mouseStartY = y;



    // Enable example draw while user is deciding shape
    canvasElement.onmousemove = function (e) { onMouseMove(e, canvas) }


}

//aligning lines when large box moved
export function checkArrowsConnectedToBox(Object) {
    // check arrows which one matches the box that was moved by its ID 

    // check how much the box has changed
    let objectID;

    let arrowArray = [];

    resizing = true;
    objectID = Object.semanticIdentity.UUID;
    console.log(objectID);
    currentObjects.flatten().forEach((item) => {
        if (item.constructor.name === "Arrow") {
            let conData = 0;
            //If the object is connected to destination
            if (objectID === item.destVertexUUID) {
                arrowArray.push(item);

                // get connection data calcs min dist to travel and hopefully it's straight up
                // first object destination y is less than object y
                if (item.path[0][1] < Object.y) {
                    conData = getConnectionDataForArrow(item.path[0][0], Object.y);
                }
                else {
                    conData = getConnectionDataForArrow(item.path[0][0], Object.y + Object.height);
                }
                item.pathData[1] = conData['nearest'];
                console.log("dest one")
                StickArrowToObject(conData, item, 1);

                //If the object is connected to Source
            } else if (objectID === item.sourceVertexUUID) {
                arrowArray.push(item);
                if (item.path[1][1] < Object.y) {
                    conData = getConnectionDataForArrow(item.path[1][0], Object.y);
                }
                else {
                    conData = getConnectionDataForArrow(item.path[1][0], Object.y + Object.height);
                }
                item.pathData[0] = conData['nearest'];
                console.log("source one");
                StickArrowToObject(conData, item, 0);

            }
        }

    });

    resizing = false;


}

export function checkHorizArrowsConnectedToBox(Object) {
    let objectID;

    let arrowArray = [];

    resizing = true;
    objectID = Object.semanticIdentity.UUID;
    console.log(objectID);
    currentObjects.flatten().forEach((item) => {
        if (item.constructor.name === "Arrow") {
            let conData = 0;
            //If the object is connected to destination
            if (objectID === item.destVertexUUID) {
                arrowArray.push(item);

                if (item.path[0][0] < Object.x) {
                    conData = getConnectionDataForArrow(Object.x + 1, item.path[0][1]);
                }
                else {
                    conData = getConnectionDataForArrow(Object.x + Object.width - 1, item.path[0][1]);
                }
                item.pathData[1] = conData['nearest'];
                console.log("dest one")
                StickArrowToObject(conData, item, 1);

                //If the object is connected to Source
            } else if (objectID === item.sourceVertexUUID) {
                arrowArray.push(item);
                if (item.path[1][0] < Object.x) {
                    conData = getConnectionDataForArrow(Object.x + 1, item.path[0][1]);
                }
                else {
                    conData = getConnectionDataForArrow(Object.x + Object.width - 1, item.path[0][1]);
                }
                item.pathData[0] = conData['nearest'];
                console.log("source one");
                StickArrowToObject(conData, item, 0);

            }
        }

    });

    resizing = false;


}


//save the position of the clicked variable as global
export function saveBlockStates(canvas, x, y) {
    selectedObject = getSelectedObject(canvas);
    if (getSelectedObject(canvas) === null) {
        selectedObject = findIntersected(x, y);
    }
    if (selectedObject !== null) {
        blockBeenSelected = true;

        //console.log("Block States Have been Saved");
        past_location = [selectedObject.x, selectedObject.y];
        past_size = [selectedObject.width, selectedObject.height];
    }
}

export function setArrowType(type) {
    arrowType = type
}

//make sure boxes don't collide
export function checkCollision(canvas, x, y) {
    //console.log("Collision Tests:");
    let object = selectedObject;
    let CollideCount = 0;
    //console.log(past_size);
    // for loop to check all boxes in the list
    if (currentObjects.flatten() !== null && object !== null) {
        currentObjects.flatten().forEach((item) => {
            if (item.constructor.name === "Vertex") {
                //make sure coords are > coords of box u just placed + its width
                if (object.x === item.x && object.y === item.y) {
                    //console.log("collides with itself");
                }
                // error of 10 pixels for item's height
                else if ((object.y > (item.y + item.height + 10)) || (object.x > (item.x + item.width))
                    || (item.x > (object.x + object.width)) || (item.y > (object.y + object.height + 10))) {
                    //console.log("NoCollide");
                }
                else {
                    // revert to past stored location
                    object.x = past_location[0];
                    object.y = past_location[1];
                    object.width = past_size[0];
                    object.height = past_size[1];
                    CollideCount++;
                    //console.log("Collided");
                }
            }
        });
        // as long as never collided, change to new location
        if (CollideCount === 0) {
            past_location = [object.x, object.y];
            past_size = [object.width, object.height]
            //console.log(CollideCount);
        }
        blockBeenSelected = false;
        drawAll(currentObjects);
    }
}


export function onRightMouseRelease(canvas, x, y) {
    let ET = findIntersected(x, y);
    if (arrowToolSelected() && ET !== null) {
        // Create

        let newObject = createObject(canvas, mouseStartX, mouseStartY, x, y);

        // Reset path
        arrowPath = [];
        firstArrowJoint = true;

        addObject(newObject);

        // Disable example draw
        canvasElement.onmousemove = null;
        drawAll(currentObjects);

        canvas.props.setLeftMenu(newObject)
        canvas.props.setMode(Tool.Select);
    }
}

export function updateA() {
    let conData = 0;
    currentObjects.flatten().forEach((item) => {
        if (item.constructor.name === "Arrow") {

            conData = getConnectionDataForArrow(item.path[1][0], item.path[1][1]);
            item.pathData[1] = conData['nearest'];
            StickArrowToObject(conData, item, 0);


        }
    });
}
export function compareSizesToMoveAll(Object) {

    //for loop to get all the arrows
    //for loop to check destination and source
    //if object ID is equal 
    //find whichever one is not the currently selected block
    // if it's smaller move it else do nothing

    let objectID;
    let verticalArray = [];
    let horizontalArray = [];
    let box;
    let boxArray = [];

    objectID = Object.semanticIdentity.UUID;
    console.log(objectID);
    currentObjects.flatten().forEach((item) => {
        if (item.constructor.name === "Arrow") {

            //If the object is connected to destination
            if (objectID === item.destVertexUUID) {
                box = getObjectFromUUID(item.sourceVertexUUID);
                if ((box.height + 10) * box.width < (Object.height + 10) * Object.width) {
                    boxArray.push(box);

                }
                //check if arrow is on top/ below
                if (item.path[0][1] < Object.y || item.path[0][1] > Object.y + Object.height + 10) {
                    //push to vertical array
                    verticalArray.push(item);
                }
                //check if arrow is left/ right
                else if (item.path[0][0] < Object.x || item.path[0][0] > Object.x + Object.width) {
                    //push to horizontal array
                    horizontalArray.push(item);
                }



            }
            //If the object is connected to Source
            else if (objectID === item.sourceVertexUUID) {
                box = getObjectFromUUID(item.destVertexUUID);
                if ((box.height + 10) * box.width < (Object.height + 10) * Object.width) {
                    boxArray.push(box);
                }
                //check if arrow is on top/ below
                if (item.path[1][1] < Object.y || item.path[1][1] > Object.y + Object.height + 10) {
                    //push to vertical array
                    verticalArray.push(item);

                }
                //check if arrow is left/ right
                else if (item.path[1][0] < Object.x || item.path[1][0] > Object.x + Object.width) {
                    //push to horizontal array
                    horizontalArray.push(item);
                }

            }
        }

    });
    return [boxArray, verticalArray, horizontalArray];
}

export function checkBoxSizesAndReturnBigBox(first, second) {
    if ((first.width) * (first.height + 10) <= (second.width) * (second.height + 10)) {
        return [second, first];
    } else {
        return [first, second];
    }
}

//line intersect
export function lineIntersect(canvas, x, y, secondObject) {
    endX = 0;
    endY = 0;

    startX = 0;
    startY = 0;

    console.log("\n \n arrow path: " + arrowPath + "\n\n");
    arrowPath = [];

    //previous object is below
    if (previousObject.y > y && previousObject.x + previousObject.width > x) {
        console.log("\n\n\n prev object was below \n\n\n");
        startY = previousObject.y;
        startX = previousObject.x + (0.5 * previousObject.width);

        endY = secondObject.y + secondObject.height + 10;
        endX = secondObject.x + (0.5 * secondObject.width);

    }
    // previous object is above
    else if (previousObject.y < y && previousObject.x + previousObject.width > x && previousObject.x < x) {
        console.log("\n\n\n prev object was above \n\n\n");
        startY = previousObject.y + previousObject.height + 10; //+ means go to bottom
        startX = previousObject.x + (0.5 * previousObject.width);

        endY = secondObject.y;
        endX = secondObject.x + (0.5 * secondObject.width);
    }
    //previous object is left of //if you click higher it counts as above

    //sizes based on Total Area
    let blockPre = previousObject.height + previousObject.width;
    let blockSec = secondObject.height + secondObject.width;

    //previous object is below
    if (previousObject.y > (secondObject.y + secondObject.height + 10)) {
        //console.log("\n\n\n prev object was below \n\n\n");
        //if previous is inside second range
        if ((previousObject.x > secondObject.x) && ((previousObject.x + previousObject.width) < (secondObject.x + secondObject.width))) {
            startY = previousObject.y;
            startX = previousObject.x + (0.5 * previousObject.width);

            endY = startY - (startY - (secondObject.y + secondObject.height + 10));
            endX = startX;
        }
        //if second is inside previous range
        else if ((previousObject.x < secondObject.x) && ((previousObject.x + previousObject.width) > (secondObject.x + secondObject.width))) {
            startY = secondObject.y + secondObject.height + 10;
            startX = secondObject.x + (0.5 * secondObject.width);

            endY = startY + (previousObject.y - startY);
            endX = startX;
        }
        //If pre is downLeft of sec extend whichever box is bigger horizontally and fit
        else if ((previousObject.x < secondObject.x) && ((previousObject.x + previousObject.width) < (secondObject.x + secondObject.width))) {
            if (blockPre <= blockSec) {
                secondObject.width = secondObject.width + (secondObject.x - previousObject.x);
                secondObject.x = previousObject.x;

                startY = previousObject.y;
                startX = secondObject.x + previousObject.width / 2;
                endY = secondObject.y + secondObject.height;
                endX = startX;
                //second obj is changing size
                checkArrowsConnectedToBox(secondObject);

            }
            if (blockPre >= blockSec) {
                previousObject.width = previousObject.width + ((secondObject.x + secondObject.width) - (previousObject.x + previousObject.width));
                previousObject.x = previousObject.x;

                startY = secondObject.y + secondObject.height;
                startX = secondObject.x + secondObject.width / 2;
                endY = previousObject.y;
                endX = startX;
                //prev obj is changing size

                //this one works
                checkArrowsConnectedToBox(previousObject);
            }
        }
        //If pre is downright of sec extend whichever box is better horizontally and fit
        else if (previousObject.x > secondObject.x) {
            if (blockPre <= blockSec) {
                secondObject.width = secondObject.width + ((previousObject.x + previousObject.width) - (secondObject.x + secondObject.width));

                startY = previousObject.y;
                startX = previousObject.x + previousObject.width / 2;
                endY = secondObject.y + secondObject.height;
                endX = startX;
                //second obj is changing size

                checkArrowsConnectedToBox(secondObject, endX - startX, endY - startY);
            }
            if (blockPre >= blockSec) {
                previousObject.width = previousObject.width + (previousObject.x - secondObject.x);
                previousObject.x = secondObject.x;

                startY = secondObject.y + secondObject.height;
                startX = secondObject.x + secondObject.width / 2;
                endY = previousObject.y;
                endX = startX;
                //prev obj is changing size

                checkArrowsConnectedToBox(previousObject);
            }
        }
    }
    // previous object is above
    else if (previousObject.y + previousObject.height + 10 < secondObject.y) {
        //console.log("\n\n\n prev object was above \n\n\n");
        //if previous is inside second range
        if ((previousObject.x > secondObject.x) && ((previousObject.x + previousObject.width) < (secondObject.x + secondObject.width))) {
            startY = previousObject.y + previousObject.height;
            startX = previousObject.x + (0.5 * previousObject.width);

            endY = startY - (startY - (secondObject.y));
            endX = startX;
        }
        //if second is inside previous range
        else if ((previousObject.x < secondObject.x) && ((previousObject.x + previousObject.width) > (secondObject.x + secondObject.width))) {
            startY = secondObject.y;
            startX = secondObject.x + (0.5 * secondObject.width);

            endY = startY + previousObject.height + (previousObject.y - startY);
            endX = startX;
        }
        //If pre is upLeft of sec extend whichever box is better horizontally and fit
        else if ((previousObject.x < secondObject.x) && ((previousObject.x + previousObject.width) < (secondObject.x + secondObject.width))) {
            if (blockPre <= blockSec) {
                secondObject.width = secondObject.width + (secondObject.x - previousObject.x);
                secondObject.x = previousObject.x;

                startY = previousObject.y + previousObject.height;
                startX = secondObject.x + previousObject.width / 2;
                endY = secondObject.y;
                endX = startX;
                //second obj is changing size

                //fixed
                checkArrowsConnectedToBox(secondObject);
            }
            if (blockPre >= blockSec) {
                previousObject.width = previousObject.width + ((secondObject.x + secondObject.width) - (previousObject.x + previousObject.width));
                previousObject.x = previousObject.x;

                startY = secondObject.y;
                startX = secondObject.x + secondObject.width / 2;
                endY = previousObject.y + previousObject.height;
                endX = startX;
                //previous obj is changing size

                checkArrowsConnectedToBox(previousObject);
            }
        }
        //If pre is upright of sec extend whichever box is bigger horizontally and fit
        else if (previousObject.x > secondObject.x) {
            if (blockPre <= blockSec) {
                secondObject.width = secondObject.width + ((previousObject.x + previousObject.width) - (secondObject.x + secondObject.width));

                startY = previousObject.y + previousObject.height;
                startX = previousObject.x + previousObject.width / 2;
                endY = secondObject.y;
                endX = startX;
                //previous obj is changing size

                //this one is fixed
                checkArrowsConnectedToBox(secondObject);
            }
            if (blockPre >= blockSec) {
                previousObject.width = previousObject.width + (previousObject.x - secondObject.x);
                previousObject.x = secondObject.x;

                startY = secondObject.y;
                startX = secondObject.x + secondObject.width / 2;
                endY = previousObject.y + previousObject.height;
                endX = startX;

                //second obj is changing size

                checkArrowsConnectedToBox(previousObject);
            }
        }

    }


    //previous object is left 
    else if (previousObject.x + previousObject.width < secondObject.x) {

        //Previous is smaller
        if (previousObject.y > secondObject.y && previousObject.y + previousObject.height + 10 < secondObject.y + secondObject.height + 10) {
            startY = previousObject.y + (previousObject.height + 10) / 2;
            startX = previousObject.x + previousObject.width;

            endX = secondObject.x;
            endY = startY;

        }
        //Second is smaller
        else if (secondObject.y > previousObject.y && secondObject.y + secondObject.height + 10 < previousObject.y + previousObject.height + 10) {
            startY = secondObject.y + (secondObject.height + 10) / 2;
            startX = secondObject.x;

            endX = previousObject.x + previousObject.width;
            endY = startY;

        }
        //Top Left and peeking
        else if (previousObject.y + previousObject.height + 10 > secondObject.y && secondObject.y > previousObject.y) {
            if (blockPre <= blockSec) {
                secondObject.height = secondObject.height + (secondObject.y - previousObject.y);
                secondObject.y = previousObject.y;

                startY = previousObject.y + (previousObject.height + 10) / 2;
                startX = previousObject.x + previousObject.width;
                endX = secondObject.x;
                endY = startY;

                checkHorizArrowsConnectedToBox(secondObject);

                console.log("m");
            }

            if (blockPre >= blockSec) {
                let increase = previousObject.height + 10 + ((secondObject.y + secondObject.height) - (previousObject.y + previousObject.height));
                //looks at x coord and y coord and @ that coord checks if there's a box
                //resizeVars[0] returns the box if there is a
                //resizeVars[1] is which side/corner of the box that its coords are expected to be at (else null)
                let resizeVars = checkResizeBounds(previousObject.x + previousObject.width, previousObject.y + previousObject.height + 10);
                console.log(resizeVars);
                resizeVars[0].expandSide(resizeVars[1], previousObject.x + previousObject.width, previousObject.y + increase, canvasContext);


                startY = secondObject.y + (secondObject.height + 10) / 2;
                startX = secondObject.x;

                endX = previousObject.x + previousObject.width;
                endY = startY;

                checkHorizArrowsConnectedToBox(previousObject);

                console.log("n");
            }
        }
        //Bottom Left and peeking
        else if (secondObject.y + secondObject.height + 10 > previousObject.y && previousObject.y + previousObject.height + 10 > secondObject.y + secondObject.height + 10) {
            if (blockPre <= blockSec) {

                let increase = secondObject.y + secondObject.height + 10 + ((previousObject.y + previousObject.height + 10) - (secondObject.y + secondObject.height + 10));

                let resizeVars = checkResizeBounds(secondObject.x + secondObject.width, secondObject.y + secondObject.height + 10);
                console.log(resizeVars);
                resizeVars[0].expandSide(resizeVars[1], secondObject.x + secondObject.width, increase, canvasContext);


                startY = previousObject.y + (previousObject.height + 10) / 2;
                startX = secondObject.x;

                endX = previousObject.x + previousObject.width;
                endY = startY;

                checkHorizArrowsConnectedToBox(secondObject);

                console.log("o");
            }

            if (blockPre >= blockSec) {
                previousObject.height = previousObject.height + 10 + (previousObject.y - secondObject.y);
                previousObject.y = secondObject.y;

                startY = secondObject.y + (secondObject.height + 10) / 2;
                startX = secondObject.x;

                endX = previousObject.x + previousObject.width;
                endY = startY;

                checkHorizArrowsConnectedToBox(previousObject);

                console.log("p");
            }
        }




    }

    //Previous object is right side
    else if (previousObject.x > (secondObject.x + secondObject.width)) {

        //Previous is smaller and on inside
        if (previousObject.y > secondObject.y && previousObject.y + previousObject.height < secondObject.y + secondObject.height) {
            startY = previousObject.y + (previousObject.height + 10) / 2;
            startX = previousObject.x;

            endX = secondObject.x + secondObject.width;
            endY = startY;

        }
        //Second is smaller and on inside
        else if (secondObject.y > previousObject.y && secondObject.y + secondObject.height < previousObject.y + previousObject.height) {
            startY = secondObject.y + (secondObject.height + 10) / 2;
            startX = secondObject.x + secondObject.width;

            endX = previousObject.x;
            endY = startY;

            console.log("r");
        }
        //Top Right and peeking
        else if (previousObject.y + previousObject.height + 10 > secondObject.y && secondObject.y > previousObject.y) {
            if (blockPre <= blockSec) {
                secondObject.height = secondObject.height + 10 + (secondObject.y - previousObject.y);
                secondObject.y = previousObject.y;

                startY = previousObject.y + (previousObject.height + 10) / 2;
                startX = previousObject.x;

                endX = secondObject.x + secondObject.width;
                endY = startY;

                checkHorizArrowsConnectedToBox(secondObject);

                console.log("s");
            }

            if (blockPre >= blockSec) {
                previousObject.height = previousObject.height + 10 + ((secondObject.y + secondObject.height + 10) - (previousObject.y + previousObject.height + 10));

                startX = secondObject.x + secondObject.width;
                startY = secondObject.y + (secondObject.height + 10) / 2;

                endX = previousObject.x;
                endY = startY;

                checkHorizArrowsConnectedToBox(previousObject);

                console.log("t");
            }

        }
        //Bottom Left and peeking
        else if (secondObject.y + secondObject.height + 10 < previousObject.y + previousObject.height + 10 && previousObject.y < secondObject.y + secondObject.height + 10) {
            if (blockPre <= blockSec) {
                let increase = secondObject.height + 10 + ((previousObject.y + previousObject.height + 10) - (secondObject.y + secondObject.height + 10));
                let resizeVars = checkResizeBounds(secondObject.x + secondObject.width, secondObject.y + secondObject.height + 10);
                console.log(resizeVars);
                resizeVars[0].expandSide(resizeVars[1], secondObject.x + secondObject.width, secondObject.y + increase, canvasContext);


                startY = previousObject.y + (previousObject.height + 10) / 2;
                startX = previousObject.x;

                endX = secondObject.x + secondObject.width;
                endY = startY;

                checkHorizArrowsConnectedToBox(secondObject);

                console.log("u");
            }

            if (blockPre >= blockSec) {
                let increase = previousObject.height + 10 + (previousObject.y - secondObject.y);
                let resizeVars = checkResizeBounds(previousObject.x + previousObject.width, previousObject.y + previousObject.height + 10);
                console.log(resizeVars);
                resizeVars[0].expandSide(resizeVars[1], previousObject.x + previousObject.width, previousObject.y + increase, canvasContext);

                previousObject.y = secondObject.y;


                startX = previousObject.x;
                startY = secondObject.y + (secondObject.height + 10) / 2;

                endX = secondObject.x + secondObject.width;
                endY = startY;

                checkHorizArrowsConnectedToBox(previousObject);

                console.log("v");
            }
        }


    }

    arrowPath.push(getConnectionDataForArrow(startX, startY).coord);


    let newObject = createObject(canvas, startX, startY, endX, endY);



    return newObject;



}
//
export function collectMehBox(boxes, arrows, bigbox, item, index) {

    //console.log("runningcollect");
    if (bigbox.semanticIdentity.UUID === item.destVertexUUID) {
        let box = getObjectFromUUID(item.sourceVertexUUID);
        if ((bigbox.y) * index + (box.y) * (1 - index) > (box.y + box.height + 10) * index + (bigbox.y + bigbox.height + 10) * (1 - index)) {
            boxes.push(box);
            arrows.push(item);
        }


    } else if (bigbox.semanticIdentity.UUID === item.sourceVertexUUID) {
        let box = getObjectFromUUID(item.destVertexUUID);
        if ((bigbox.y) * index + (box.y) * (1 - index) > (box.y + box.height + 10) * index + (bigbox.y + bigbox.height + 10) * (1 - index)) {
            boxes.push(box);
            arrows.push(item);
        }
    }
    return [boxes, arrows];
}
//Will arrange boxes and arrows in linked order above or below the big box.
//Bigbox - The larger important box
//boxes - list of all the boxes being moved
//arrows - arrows connect to the above boxes
//index - denotes the side that boxes are connected to 
export function arrangeboxesandarrows(bigbox, boxes, arrows, index) {
    //index = 1 = up
    if (boxes.length >= 2) {
        let b = 0;
        let x = bigbox.x;
        let y = bigbox.y + (bigbox.height + 30) * (1 - index);
        for (b; b < boxes.length; b++) {
            boxes[b].x = x;
            boxes[b].y = y - ((boxes[b].height + 30) * index);
            x = x + boxes[b].width + 20;

            if (boxes[b].x + boxes[b].width > bigbox.x + bigbox.width) {
                bigbox.width = bigbox.width + boxes[b].width
            }
        }
        b = 0;
        for (b; b < boxes.length; b++) {
            console.log(arrows[b]);
            let conData = getConnectionDataForArrow(boxes[b].x + boxes[b].width / 2, bigbox.y + (bigbox.height + 10) * (1 - index));
            arrows[b].pathData[1] = conData['nearest'];
            StickArrowToObject(conData, arrows[b], 1);
        }
    }
}
//
export function collectsidebox(boxes, arrows, bigbox, item, index) {

    if (bigbox.semanticIdentity.UUID === item.destVertexUUID) {
        let box = getObjectFromUUID(item.sourceVertexUUID);
        if ((bigbox.x) * index + (box.x) * (1 - index) > (box.x + box.width) * index + (bigbox.x + bigbox.width) * (1 - index)) {
            boxes.push(box);
            arrows.push(item);
        }


    } else if (bigbox.semanticIdentity.UUID === item.sourceVertexUUID) {
        let box = getObjectFromUUID(item.destVertexUUID);
        if ((bigbox.x) * index + (box.x) * (1 - index) > (box.x + box.width) * index + (bigbox.x + bigbox.width) * (1 - index)) {
            boxes.push(box);
            arrows.push(item);
        }
    }
    return [boxes, arrows];
}
export function arrangeboxesandarrowshorizontal(bigbox, boxes, arrows, index) {
    //index = 0 = right
    if (boxes.length >= 2) {
        let b = 0;
        let x = bigbox.x + (bigbox.width + 30) * (1 - index);
        let y = bigbox.y;
        for (b; b < boxes.length; b++) {
            boxes[b].x = x - ((boxes[b].width + 30) * index);
            boxes[b].y = y;
            y = y + boxes[b].height + 20;
            //extending box
            if (boxes[b].y + boxes[b].height + 10 > bigbox.y + bigbox.height + 10) {
                bigbox.height = bigbox.height + boxes[b].height;
            }
        }
        b = 0;
        for (b; b < boxes.length; b++) {
            console.log(arrows[b]);
            let conData = getConnectionDataForArrow(bigbox.x + (bigbox.width) * (1 - index), boxes[b].y + (boxes[b].height + 10) / 2);
            arrows[b].pathData[1] = conData['nearest'];
            StickArrowToObject(conData, arrows[b], 1);
        }
    }
}

export function shiftBoxes(secondObject) {
    //if box is within horizontal bounds

    let upBoxes = [];
    let upArrows = [];
    let downBoxes = [];
    let downArrows = [];
    let leftBoxes = [];
    let leftArrows = [];
    let rightBoxes = [];
    let rightArrows = [];
    let [bigBox, smallBox] = checkBoxSizesAndReturnBigBox(previousObject, secondObject);

    //grab all arrows connected to either object
    //Index 0 means down index 1 means up

    currentObjects.flatten().forEach((item) => {
        if (item.constructor.name === "Arrow") {
            //get the big box because it has all the arrows connected
            if (bigBox.y + bigBox.height + 10 < smallBox.y && smallBox.x > bigBox.x && smallBox.x + smallBox.width < bigBox.x + bigBox.width) {
                [downBoxes, downArrows] = collectMehBox(downBoxes, downArrows, bigBox, item, 0);


            } else if (bigBox.y > (smallBox.y + smallBox.height + 10) && smallBox.x > bigBox.x && smallBox.x + smallBox.width < bigBox.x + bigBox.width) {
                [upBoxes, upArrows] = collectMehBox(upBoxes, upArrows, bigBox, item, 1);

            } else if (bigBox.x > smallBox.x + smallBox.width && smallBox.y > bigBox.y && smallBox.y + smallBox.height + 10 < bigBox.y + bigBox.height + 10) {
                console.log("left ran");
                [leftBoxes, leftArrows] = collectsidebox(leftBoxes, leftArrows, bigBox, item, 1);

            } else if (bigBox.x + bigBox.width < smallBox.x && smallBox.y > bigBox.y && smallBox.y + smallBox.height + 10 < bigBox.y + bigBox.height + 10) {
                console.log("right ran");
                [rightBoxes, rightArrows] = collectsidebox(rightBoxes, rightArrows, bigBox, item, 0);
            }
        }
    });
    //Do stuff to boxes
    //1 = up
    //0 = down
    arrangeboxesandarrows(bigBox, downBoxes, downArrows, 0);
    arrangeboxesandarrows(bigBox, upBoxes, upArrows, 1);

    arrangeboxesandarrowshorizontal(bigBox, leftBoxes, leftArrows, 1);
    arrangeboxesandarrowshorizontal(bigBox, rightBoxes, rightArrows, 0);

    //console.log(downboxes.length);



}

export function onLeftMouseRelease(canvas, x, y) {


    if (cancelDraw) {
        cancelDraw = false;
        return;
    }

    if (resizing === true) {
        resizing = false;
        canvasElement.onmousemove = null;
        return
    }

    // Disable example draw
    canvasElement.onmousemove = null;

    if (arrowToolSelected()) {

        if (getConnectionDataForArrow(x, y).snapped && !firstArrowJoint) {
            // Create
            let secondObject = findIntersected(x, y);
            let newObject = null;

            //2 separate objects - box and vertex (border)
            if (previousObject !== null && secondObject !== null && savedArrows !== null) {
                //console.log("\n the new one \n");
                newObject = lineIntersect(canvas, x, y, secondObject);
                for (let j = 0; j < savedArrows.length; j++) {
                    //delete arrow if duplicate for straight arrows (doesn't work)
                    for (let k = 1 + j; k < savedArrows.length; k++) {
                        if (savedArrows[j][0][0] === savedArrows[k][0][0] && savedArrows[j][0][1] === savedArrows[k][0][1] && savedArrows[j][1][0] === savedArrows[k][1][0] && savedArrows[j][1][1] === savedArrows[k][1][1]) {
                            let removethis = findIntersected(savedArrows[j][0][0], savedArrows[j][0][1]);
                            deleteElement(removethis);
                        }
                    }
                }
            } else {
                //console.log("\n the old one \n");
                //newObject = createObject(canvas, mouseStartX, mouseStartY, x, y);
            }

            // Reset path
            arrowPath = [];
            firstArrowJoint = true;


            if (newObject !== null) {
                addObject(newObject);
            }


            drawAll(currentObjects);



            //converting all arrows to savedArrows array
            let i = 0;
            currentObjects.flatten().forEach((item) => {
                if (item.constructor.name === "Arrow") {
                    savedArrows[i] = item.path;
                    i++;
                }

            });

            if (newObject !== null) {
                canvas.props.setLeftMenu(newObject);
            }

            canvas.props.setMode(Tool.Select);
            if (previousObject !== null && secondObject !== null) {
                shiftBoxes(secondObject);
            }
            previousObject = null;


        } else {
            //maybe here where we can disable compound lines

            //save object here
            previousObject = findIntersected(x, y);
            //console.log("previousObject has been saved");
            //where they first put in coords for first click

            arrowPath.push(getConnectionDataForArrow(x, y).coord);
            lastX = x;
            lastY = y;
            canvasElement.onmousemove = function (e) {
                onMouseMove(e, canvas)
            };
            firstArrowJoint = false;
        }

    }

    if (canvas.tool === Tool.Vertex) {
        let newObject = createObject(canvas, mouseStartX, mouseStartY, x, y);
        addObject(newObject);

        canvas.props.setLeftMenu(newObject);
        canvas.props.setMode(Tool.Select);
    }
    if (canvas.tool === Tool.Artifact) {
        let newObject = createArtifact(canvas, mouseStartX, mouseStartY);
        addObject(newObject);

        canvas.props.setLeftMenu(newObject);
        canvas.props.setMode(Tool.Select);
    }
    if (canvas.tool === Tool.Container) {
        let newObject = createContainer(canvas, mouseStartX, mouseStartY);
        newObject.setColour("#FFFFFF");
        addObject(newObject);
        canvas.props.setLeftMenu(newObject);
        canvas.props.setMode(Tool.Select);
    }




    drawAll(currentObjects);

}

function onMouseMove(e, canvas) {
    let position = getGraphXYFromMouseEvent(e);

    // Redraw Existing Objects
    drawAll(currentObjects);

    // Draw the new object
    let newObject = createObject(canvas, mouseStartX, mouseStartY, position[0], position[1]);

    canvasContext.globalAlpha = 0.75;
    if (newObject !== null) {
        newObject.draw(canvasContext);
    }
    canvasContext.globalAlpha = 1.0;
}

export function onMiddleClick(canvas, x, y, savedObjects = null, shiftDown = false) {
    // for arrows
    startMoveX = x;
    startMoveY = y;
    // selecting the object based on coordinate
    // if it doesnt find an object dont run it

    let selectedObject = findIntersected(x, y);

    //compareSizesToMoveAll returns any connected vertices to the selected along with the arrows themselves to be updated
    let [friendObject, arrowsVert, arrowsHoriz] = compareSizesToMoveAll(selectedObject);

        //If the selected block has a friend (connected by arrow) it will begin to try and identify friends of friends
    if (friendObject !== null || friendObject.length >= 1) {
        let ObjectsToCheck = friendObject;
        let nextObjects = [];

        //For loop to check all the closest friends (connected directly to selected )
        for (let n = 0; n < ObjectsToCheck.length; n++) {
            let [newfriendObject, newarrowsVert, newarrowsHoriz] = compareSizesToMoveAll(ObjectsToCheck[n]);
            if (newfriendObject !== null) {

                //for loop to check for duplicates and remove if any
                for (let nf = 0; nf < newfriendObject.length; nf++) {
                    console.log(ObjectsToCheck.length)
                    for (let of = 0; of < ObjectsToCheck.length; of++) {
                        //doesn't get run?:
                        if (newfriendObject[nf].semanticIdentity.UUID === ObjectsToCheck[of].semanticIdentity.UUID) {
                            newfriendObject.splice(nf, 1);
                        }
                    }
                }
                //Adds the objects that are connected to the friends to the friend list.
                if (newfriendObject.length >= 1) {
                    for (let p = 0; p < newfriendObject.length; p++) {
                        nextObjects.push(newfriendObject[p]);
                        friendObject.push(newfriendObject[p]);
                    }

                } 
            }
           
        }
        //Updates the friendlist to begin a new search. 
        ObjectsToCheck = nextObjects; 



    }
    let F = [];
    if (friendObject !== null) {
        let i = 0;
        for (i; i < friendObject.length; i++) {
            F.push([x - friendObject[i].x, y - friendObject[i].y]); //distance from mouse to actual object's x, y
            //console.log(F);
        }
    }

    let S = []; //previous coords
    if (savedObjects !== null) {
        let i = 0;
        for (i; i < savedObjects.length; i++) {
            S.push([x - savedObjects[i].x, y - savedObjects[i].y]);
            //console.log(F);
        }
    }

    if (selectedObject !== null) {
        saveBlockStates(canvas, x, y);
        // check the distance between the mouse and the object
        let saveDisX = x - selectedObject.x;
        let saveDisY = y - selectedObject.y;


        canvasElement.onmousemove = function (e) { moveObject(e, selectedObject, friendObject, F, savedObjects, S, saveDisX, saveDisY, arrowsVert, arrowsHoriz, shiftDown) }
    }

}

export function onMouseLeave() {
    canvasElement.onmousemove = {};
    firstArrowJoint = true;
    drawAll()
}

// moving objects in respect to cursor values saveDisX, saveDisY
// friends = the smaller boxes that are connected to the bigger box
function moveObject(e, object, friends, F, savedObjects = null, S, saveDisX, saveDisY, arrowsVert, arrowsHoriz, shiftDown) {
    if (object != null) {
        if (object.constructor.name === "Vertex") {
            let position = getGraphXYFromMouseEvent(e);
            let x = position[0] - saveDisX;
            let y = position[1] - saveDisY;

            //for loop iterate through all boxes assume they not empty
            if (shiftDown) {
                if (friends !== null) {
                    let i = 0;
                    //check friends' previous location and cursors location
                    for (i; i < friends.length; i++) {
                        friends[i].x = position[0] - F[i][0];
                        friends[i].y = position[1] - F[i][1];
                    }
                }
            }

            if (savedObjects !== null) {
                let i = 0;
                //check friends' previous location and cursors location
                for (i; i < savedObjects.length; i++) {
                    savedObjects[i].x = position[0] - S[i][0];
                    savedObjects[i].y = position[1] - S[i][1];
                }
            }



            if (arrowsVert !== null) {
                let conData = 0;
                let j = 0;

                for (j; j < arrowsVert.length; j++) {
                    // source = one that's been clicked
                    arrowsVert[j].path[1][0] = arrowsVert[j].path[0][0];
                    conData = getConnectionDataForArrow(arrowsVert[j].path[1][0], arrowsVert[j].path[1][1]);



                    if (conData['nearest'] !== null) {

                        arrowsVert[j].pathData[1] = conData['nearest'];
                        StickArrowToObject(conData, arrowsVert[j], 0);
                        //console.log(arrowsVert[j].path);
                    } else {
                        //delete arrow                        
                        deleteElement(arrowsVert[j]);
                    }
                }
            }

            if (arrowsHoriz !== null) {
                let conData = 0;
                let k = 0;
                for (k; k < arrowsHoriz.length; k++) {
                    // source = one that's been clicked
                    arrowsHoriz[k].path[1][1] = arrowsHoriz[k].path[0][1];
                    conData = getConnectionDataForArrow(arrowsHoriz[k].path[1][0], arrowsHoriz[k].path[1][1]);

                    if (conData['nearest'] !== null) {

                        arrowsHoriz[k].pathData[1] = conData['nearest'];
                        StickArrowToObject(conData, arrowsHoriz[k], 0);
                        //console.log(arrowsHoriz[k].path);
                    } else {
                        //delete arrow
                        deleteElement(arrowsHoriz[k]);
                    }
                }
            }

            object.x = x;
            object.y = y;

            updateArrows();


        } else if (object.constructor.name === "Arrow") {
            return;

        }
    }
}
export function updateArrows() {
    let flattenedObjects = currentObjects.flatten();
    flattenedObjects.forEach((item) => {
        if (item !== null) {
            if (item.constructor.name === "Arrow") {
                item.rebuildPath();
            }
        }
    });
}

export function solidifyObject() {
    canvasElement.onmousemove = null;
}

// Zoom and pan
export function setZoom(newZoom) {
    zoom = newZoom;

    resetMouseOrigin();

    drawAll();
}

// Useful for debugging
export function drawMarker(xpos, ypos) {
    const radius = 2;
    const lineWidth = 0.5;
    const strokeColour = "#007ACC";
    const fillColour = "#007ACC55";

    let oldLineWidth = canvasContext.lineWidth;
    canvasContext.lineWidth = lineWidth;
    let oldStrokeStyle = canvasContext.strokeStyle;
    canvasContext.strokeStyle = strokeColour;
    let oldFillStyle = canvasContext.fillStyle;
    canvasContext.fillStyle = fillColour;

    canvasContext.globalAlpha = 1.0;
    canvasContext.beginPath();
    canvasContext.arc(xpos, ypos, radius, 0, Math.PI * 2, false);
    canvasContext.fill();
    canvasContext.stroke();
    canvasContext.closePath();

    canvasContext.lineWidth = oldLineWidth;
    canvasContext.strokeStyle = oldStrokeStyle;
    canvasContext.fillStyle = oldFillStyle;
}

// Gets the distance between x1, y1 and x2, y2
export function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Finds the object that is intersected with the cursor, returns null if no objects are intersected
export function findIntersected(x, y) {
    let selectedItem = null;
    currentObjects.flatten().forEach((item) => {
        if (item !== null) {
            if (item.intersects(x, y)) {
                //console.log("Intersection detected with ", item.constructor.name);
                selectedItem = item;
            }
        }
    });
    return selectedItem;
}

function createArtifact(canvas, x1, y1) {
    let newPath;
    let currentObjectsFlattened = currentObjects.flatten();

    if (canvas.tool === Tool.Artifact) {
        // Get positions
        let pos = orderCoordinates(x1, y1, x1 + 450, y1 + 50);
        let vy1 = findNearestGridY(pos[1], 0);
        let vy2 = findNearestGridY(pos[3], 0);

        // Add vertex
        return new Vertex("", [""], pos[0], findNearestGridY(y1, 1), pos[2] - pos[0], vy2 - vy1);

    }
    return null;
}

function createContainer(canvas, x1, y1) {
    let newPath;
    let currentObjectsFlattened = currentObjects.flatten();

    if (canvas.tool === Tool.Container) {
        // Get positions
        let pos = orderCoordinates(x1, y1, x1 + 100, y1 + 60);
        let vy1 = findNearestGridY(pos[1], 0);
        let vy2 = findNearestGridY(pos[3], 0);

        // Add vertex
        return new Vertex("", [""], pos[0], findNearestGridY(y1, 1), pos[2] - pos[0], vy2 - vy1);

    }
    return null;
}

function createObject(canvas, x1, y1, x2, y2) {
    let newPath;
    let currentObjectsFlattened = currentObjects.flatten();

    if (canvas.tool === "Vertex") {
        // Get positions
        let pos = orderCoordinates(x1, y1, x2 + 10, y2);
        let vy1 = findNearestGridY(pos[1], 0);
        let vy2 = findNearestGridY(pos[3], 0);

        // Add vertex
        return new Vertex("", [""], pos[0], findNearestGridY(y1, 1), pos[2] - pos[0], vy2 - vy1);

    } else if (arrowToolSelected()) {
        // Generate path

        newPath = arrowPath.concat([getConnectionDataForArrow(x2, y2).coord]);

        // Check if first path connects to a vertex, and ignore if it doesn't
        // Should be 0 if the connectable connects to a vertex
        //
        //
        //because createObject is always running when moving mouse
        //
        // if current mouse pos is not over a box, don't create arrow
        // if removed here, it is still removed in another function 
        //let intersection = findIntersected(x2, y2);
        if (newPath[0][0] !== 0) {
            return null;
        }

        // Create arrow
        let arrow = new Arrow(currentObjectsFlattened, newPath, arrowType);
        arrow.rebuildPath(currentObjectsFlattened);
        return arrow;
    }

    return null;
}

export function getGraphXYFromMouseEvent(e) {
    resetMouseOrigin();

    let x = (e.clientX - mouseOriginX) / getEffectiveZoom();
    let y = (e.clientY - mouseOriginY) / getEffectiveZoom();

    return [x, y];
}

export function getDownload() {

    let DLelement = document.createElement("a");
    DLelement.href = canvasElement.toDataURL("image/png").replace(/^data:image\/[^;]/, 'data:application/octet-stream');
    DLelement.download = "Graph.png";
    document.body.appendChild(DLelement);
    DLelement.click();

}

function orderCoordinates(sx, sy, ex, ey) {
    // This code also ensures x1 < x2 and y1 < y2
    let x1 = Math.min(sx, ex);
    let y1 = Math.min(sy, ey);
    let x2 = Math.max(sx, ex);
    let y2 = Math.max(sy, ey);

    return [x1, y1, x2, y2];
}

// Gets the effective (percentage) zoom from the current zoom
function getEffectiveZoom() {
    return zoom / 100;
}

// This should be used whenever the window itself resizes
function recalculateScale() {
    // Adjusts the aspect ratio so it is 1:1 instead of matching the windows.
    // Also removes blurry rendering
    //let dpi = window.devicePixelRatio;
    let canvasContainer = document.getElementsByClassName("Canvas")[0];
    let styleHeight = +getComputedStyle(canvasContainer).getPropertyValue("height").slice(0, -2);
    let styleWidth = +getComputedStyle(canvasContainer).getPropertyValue("width").slice(0, -2);

    canvasElement.setAttribute('height', styleHeight * getEffectiveZoom());
    canvasElement.setAttribute('width', styleWidth * getEffectiveZoom());

    // Configurable
    canvasWidth = canvasElement.width;
    canvasHeight = canvasElement.height;
}

function clearCanvas() {
    // Fill base canvas
    canvasContext.fillStyle = "#ffffff";
    canvasContext.fillRect(0, 0, canvasWidth, canvasHeight);
}
