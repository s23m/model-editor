import React from 'react';
import * as canvasDraw from "./CanvasDraw";
import { Tool } from './LeftMenu';

var movingAllowed = false;
var selectMultiple = false;
var selectdown = false;
var savedObjects = [];

export class Canvas extends React.Component {
    constructor(props) {
        super();
        this.canvasRef = React.createRef();

        this.state = {}
    }

    componentWillReceiveProps(nextProps, nextContext) {
        this.zoom = nextProps.mainState.zoomLevel;
        this.tool = nextProps.mainState.drawMode;

    }

    componentDidMount() {
        this.zoom = this.props.mainState.zoomLevel;
        this.tool = this.props.mainState.drawMode;

    }

    // prevent context (right-click) menu from appearing
    ocm = (e) => {
        e.preventDefault();
    };
    // What happens if u click anywhere on the canvas
    mouseDown = (e, canvas) => {
        let position = canvasDraw.getGraphXYFromMouseEvent(e);
        let x = position[0]; let y = position[1];
        this.setState({
            startX: x,
            startY: y
        });

        //toggle shift key to move all connected
        if (e.shiftKey && !selectdown) {
            selectdown = true;
        }
        // If it was a left click
        if (e.button === 0 && !selectMultiple) {
            let intersection = canvasDraw.findIntersected(x, y);
            // check if there's an object
            if (intersection !== null) {
                //if object is a box, move the object
                if (canvas.tool === Tool.Select && intersection.constructor.name === "Vertex") {
                    e.preventDefault();
                    // brings up the menu
                    this.props.setLeftMenu(canvasDraw.findIntersected(x, y));
                    canvasDraw.onMiddleClick(canvas, x, y,null,selectdown);
                    console.log(selectdown);

                } else {
                    this.props.setLeftMenu(canvasDraw.findIntersected(x, y));
                    canvasDraw.saveBlockStates(canvas, x, y, 1);
                    canvasDraw.onLeftMousePress(canvas, x, y);
                }

              } else { //clicked nothing
            this.props.setLeftMenu(canvasDraw.findIntersected(x, y));
            canvasDraw.saveBlockStates(canvas, x, y, 1);
            canvasDraw.onLeftMousePress(canvas, x, y);
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
                //console.log(selectMultiple);
                // Remove dupes
                let foundend = 0;
                //start at 0
                while (foundend < savedObjects.length-1){
                    //stop @ second last one
                    //check RHS for duplicates
                    //found+1 because wanna look at box after the one we looking at
                    for (let ob = foundend+1; ob < savedObjects.length; ob++){
                        if(savedObjects[foundend].x === savedObjects[ob].x && savedObjects[foundend].y === savedObjects[ob].y ){
                            savedObjects.splice(ob); // if it's the same, delete it and slide array back one
                        }
                    }
                    foundend++;
                }
                //ideally want to push in the first object that has already been selected
                console.log(savedObjects);
                savedObjects.push(canvasDraw.findIntersected(x, y));
                canvasDraw.onMiddleClick(canvas, x, y, savedObjects)
                
                for(let i = 0; i <savedObjects.length; i++) {
                    this.props.setLeftMenu(savedObjects[i], selectMultiple);
                }
                

            }
        }




        // If it was a middle click
        if (e.button === 1) {
            e.preventDefault();
            canvasDraw.onMiddleClick(canvas, x, y)
        }


    };

    mouseUp = (e, canvas) =>{

        canvasDraw.solidifyObject();

        let position = canvasDraw.getGraphXYFromMouseEvent(e);
        let x = position[0]; let y = position[1];

        // If it was a left click
        if (e.button === 0) {
            if (canvas.tool === Tool.Select) {
                canvasDraw.drawAll()
            }
			else {
                canvasDraw.onLeftMouseRelease(canvas, x, y);
            }

        }

        // if it was a right click
        if (e.button === 2) {

            if (movingAllowed) {
                canvasDraw.solidifyObject(); 
                movingAllowed = false;
            }
            if (canvasDraw.arrowPath.length !== 0) {
                canvasDraw.onRightMouseRelease(canvas, x, y)
            }
			
        }
		if (e.shiftKey && selectdown) {
            selectdown = false;
        }

        if (e.button === 1) {
            window.setTimeout(() => {canvasDraw.solidifyObject()},200)

        }
		if (canvasDraw.blockBeenSelected === true){
			canvasDraw.checkCollision(canvas, x, y);
		}
		
    };

    mouseLeave() {
        canvasDraw.onMouseLeave()
    }

    render() {
        return <canvas ref={this.canvasRef} id="drawCanvas" onContextMenu={(e) => this.ocm(e)} onMouseDown={(e) => this.mouseDown(e, this)} onMouseUp={(e) => this.mouseUp(e, this)} onMouseLeave={(e) => this.mouseLeave(e,this)}>
                <p> HTML5 Canvas elements are not supported by your browser</p>
            </canvas>
    }

}

window.addEventListener("resize",canvasDraw.resetMouseOrigin);
