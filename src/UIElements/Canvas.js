import React from 'react';
import { getTreeVertexEmptyIcon, getTreeVertexFullIcon } from '../Config';
import { createSaveState } from '../Serialisation/NewFileManager';
import * as canvasDraw from "./CanvasDraw";
import { getContainerNameFromKey, getVertexData } from './ContainmentTree';
import { Tool } from './LeftMenu';

let selectMultiple = false;
let selectDown = false;
let savedObjects = [];
let mouseDownXY = []; // stores where the mouse button first gets held down
let mouseUpXY = []; // stores where the mouse is button is let go

let lastSelectWasCanvas = false;

// Current selected object
export let selectedCanvasObject = null;
export function setSelected(intersection) {
    selectedCanvasObject = intersection;
}
export function getSelected() {
    return this.selectedCanvasObject;
}

// Object selected after the first object
export let nextSelectedCanvasObject = null;
export function setNextSelected(intersection) {
    nextSelectedCanvasObject = intersection;
}
export function getNextSelected() {
    return this.nextSelectedCanvasObject;
}

export class Canvas extends React.Component {
    constructor(props) {
        super(props);
        this.canvasRef = React.createRef();

        this.state = {}
    }

    componentDidMount() {
        this.zoom = this.props.mainState.zoomLevel;
        this.tool = this.props.mainState.drawMode;

        document.getElementById("Canvas").addEventListener('dragenter', this.dragEnter);
        document.getElementById("Canvas").addEventListener('dragover', this.dragOver);
        document.getElementById("Canvas").addEventListener('dragleave', this.dragLeave);
        document.getElementById("Canvas").addEventListener('drop', this.drop);

    }

    componentWillUnmount() {
        document.getElementById("Canvas").removeEventListener('dragenter', this.dragEnter);
        document.getElementById("Canvas").removeEventListener('dragover', this.dragOver);
        document.getElementById("Canvas").removeEventListener('dragleave', this.dragLeave);
        document.getElementById("Canvas").removeEventListener('drop', this.drop);
    }

    componentDidUpdate() {
        this.zoom = this.props.mainState.zoomLevel;
        this.tool = this.props.mainState.drawMode;
    }

    dragEnter(e) {
        e.preventDefault();
    }

    dragOver(e) {
        e.preventDefault();
    }

    dragLeave(e) {
        return 0
    }

    drop(e) {
        if (canvasDraw.getCurrentGraph() <= 0) { // stops the user dragging and dropping without a graph being selected
            console.log("attempted to drag and drop vertex while there are no available graphs to draw on");
            window.alert("You need to create and select a graph first before you can start drawing!");

        }
        else {
            //Find the vertex object that was dragged
            let droppedSemanticID = e.dataTransfer.getData('text/plain');
            let droppedVertex = 0;
            for (let vert of getVertexData()) {
                if (vert.semanticIdentity.UUID === droppedSemanticID)
                    droppedVertex = vert;
            }
            //If Item is not vertex, droppedVertex will remain 0
            if (droppedVertex === 0) {
                window.alert("You can only drop vertex's on this graph");
                return;
            }
            //get canvas relative coordinates for where the object was dropped
            let mouseCoords = canvasDraw.getGraphXYFromMouseEvent(e)
            let newName = droppedVertex.text.replace(" " + getTreeVertexEmptyIcon(), "");
            newName = newName.replace(" " + getTreeVertexFullIcon(), "")
            let newColour;
            let visibilityCheck = false;

            //check if selected graph is located in the same package or not
            if (droppedVertex.parentContainerKey !== canvasDraw.getCurrentContainerKey()) {
                newColour = "#FFFFFF";
                visibilityCheck = true; //used to determine if the vertex has an origin package added
            }
            else {

                newColour = droppedVertex.colour;
            }


            //create the vertex object(size 30x15) and place it
            let canvasVert = canvasDraw.createVertex(mouseCoords[0], mouseCoords[1], droppedVertex.width, droppedVertex.height, newName,
                droppedVertex.content, newColour, droppedVertex.icons, droppedVertex.imageElements, droppedVertex.fontSize, droppedVertex.semanticIdentity)
            if (visibilityCheck === true) {
                //add origin package
                let originText = getContainerNameFromKey(droppedVertex.parentContainerKey)
                originText = originText.replace(" " + getTreeVertexEmptyIcon(), "")
                originText = originText.replace(" " + getTreeVertexFullIcon(), "")
                canvasVert.setOrigin(originText + " :: ")
            }
            canvasDraw.addObject(canvasVert)
            canvasDraw.drawAll()

            createSaveState()
            console.log('drop save')
        }

    }



    // prevent context (right-click) menu from appearing
    ocm = (e) => {
        e.preventDefault();
    };


    // What happens if u click anywhere on the canvas
    mouseDown = (e, canvas) => {
        console.log(canvas);
        let position = canvasDraw.getGraphXYFromMouseEvent(e);
        let x = position[0]; let y = position[1];
        this.setState({
            startX: x,
            startY: y
        });

        //toggle shift key to move all connected
        if (e.shiftKey && !selectDown) {
            selectDown = true;
        }
        // If it was a left click
        if (e.button === 0 && !selectMultiple) {
            let intersection = canvasDraw.findIntersected(x, y);

            // If an object has already been selected, make the current intersection the second object
            if (selectedCanvasObject === null) {
            
                selectedCanvasObject = intersection
            } else {
                nextSelectedCanvasObject = intersection
            }

            // check if there's an object
            console.log(intersection);
            if (intersection !== null) {
                lastSelectWasCanvas = false;
                //if object is a box, move the object
                if (canvas.tool === Tool.Select && intersection.typeName === "Vertex") {
                    e.preventDefault();
                    // brings up the menu
                    this.props.setLeftMenu(canvasDraw.findIntersected(x, y));
                    canvasDraw.onMiddleClick(canvas, x, y, null, selectDown);

                    // Update the current object to the second object
                    if (nextSelectedCanvasObject !== null) {
                        selectedCanvasObject = nextSelectedCanvasObject;
                        nextSelectedCanvasObject = null
                    }

                } else {
                    if (nextSelectedCanvasObject !== null) {
                        // Check if the first selected object and the second selected object are edges
                        if (selectedCanvasObject.typeName === "Arrow" && nextSelectedCanvasObject.typeName === "Arrow") {
                            // Check if the selected objects are the same
                            if (selectedCanvasObject.path === nextSelectedCanvasObject.path) {
                                console.log('ya yeet lee likes feet')
                                return;
                            }

                            window.alert("Please deselect edge by using the save button or clicking on the canvas first.");
                            nextSelectedCanvasObject = null;
                            return;

                        } else {
                            selectedCanvasObject = nextSelectedCanvasObject;
                            nextSelectedCanvasObject = null
                        }
                    }
                    this.props.setLeftMenu(canvasDraw.findIntersected(x, y));
                    canvasDraw.saveBlockStates(canvas, x, y, 1);
                    canvasDraw.onLeftMousePress(canvas, x, y);
                }
                mouseDownXY[0] = x; mouseDownXY[1] = y; // store mousedownXY in the case that something was clicked
                console.log(mouseDownXY)
            }
            else { //clicked nothing
                this.props.setLeftMenu(canvasDraw.findIntersected(x, y));
                canvasDraw.saveBlockStates(canvas, x, y, 1);
                canvasDraw.onLeftMousePress(canvas, x, y);
                if (lastSelectWasCanvas === false) {
                    createSaveState()
                    console.log('creating save canvas');
                }
                lastSelectWasCanvas = true;
                selectedCanvasObject = null;
                nextSelectedCanvasObject = null;
            }

        }

        //toggles ctrl key to be active for selecting multiple.
        //detoggles in mouseup
        if (e.ctrlKey && !selectMultiple) {
            selectMultiple = true;
        }

        //mouse down
        if (e.button === 0 && selectMultiple) {
            
            let intersection = canvasDraw.findIntersected(x, y);
            // check if there's an object
            if (intersection === null) {
                this.props.setLeftMenu(intersection, false, savedObjects);
                savedObjects = [];
                selectMultiple = false;

            }
            if (intersection !== null) {
                // Remove dupes
                let foundEnd = 0;
                //start at 0
                while (foundEnd < savedObjects.length - 1) {
                    //stop @ second last one
                    //check RHS for duplicates
                    //found+1 because wanna look at box after the one we looking at
                    for (let ob = foundEnd + 1; ob < savedObjects.length; ob++) {
                        if (savedObjects[foundEnd].x === savedObjects[ob].x && savedObjects[foundEnd].y === savedObjects[ob].y) {
                            savedObjects.splice(ob); // if it's the same, delete it and slide array back one
                        }
                    }
                    foundEnd++;
                }
                //ideally want to push in the first object that has already been selected
                savedObjects.push(canvasDraw.findIntersected(x, y));
                canvasDraw.onMiddleClick(canvas, x, y, savedObjects)

                for (let i = 0; i < savedObjects.length; i++) {
                    this.props.setLeftMenu(savedObjects[i], selectMultiple);
                }

                mouseDownXY[0] = x; mouseDownXY[1] = y; // also store it in case of multiple objects

            }
        }




        // If it was a middle click
        if (e.button === 1) {
            e.preventDefault();
            // canvasDraw.onMiddleClick(canvas, x, y)
        }


    };

    mouseUp = (e, canvas) => {

        canvasDraw.solidifyObject();

        let position = canvasDraw.getGraphXYFromMouseEvent(e);
        let x = position[0]; let y = position[1];

        // If it was a left click
        if (e.button === 0) {
            if (canvas.tool === Tool.Select) {
                mouseUpXY[0] = x; mouseUpXY[1] = y;
                canvasDraw.drawAll()

            }
            else {
                canvasDraw.onLeftMouseRelease(canvas, x, y);



            }

        }

        // if it was a right click
        if (e.button === 2) {

            // deleted the old rightclick functionality and will leave this if statement here for when we implement right click menu - cooper


        }
        if (e.shiftKey && selectDown) {
            selectDown = false;
        }

        if (e.button === 1) {
            window.setTimeout(() => { canvasDraw.solidifyObject() }, 200)

        }
        if (canvasDraw.blockBeenSelected === true) {
            canvasDraw.checkCollision(selectedCanvasObject);
        }

    };

    mouseLeave() {
        canvasDraw.onMouseLeave()
    }

    render() {
        return <canvas ref={this.canvasRef} id="drawCanvas" onContextMenu={(e) => this.ocm(e)} onMouseDown={(e) => this.mouseDown(e, this)} onMouseUp={(e) => this.mouseUp(e, this)} onMouseLeave={(e) => this.mouseLeave(e, this)}>
            <p> HTML5 Canvas elements are not supported by your browser</p>
        </canvas>
    }

}

window.addEventListener("resize", canvasDraw.resetMouseOrigin);
