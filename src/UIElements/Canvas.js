import React from 'react';
import * as canvasDraw from "./CanvasDraw";
import { Tool } from './LeftMenu';

var movingAllowed = false;


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

        // If it was a left click
        if (e.button === 0) {
			this.props.setLeftMenu(canvasDraw.findIntersected(x, y));
			canvasDraw.saveBlockStates(canvas,x,y,1);
            canvasDraw.onLeftMousePress(canvas, x, y);
        }

        // If it was a middle click
        if (e.button === 1) {
            e.preventDefault();
            canvasDraw.onMiddleClick(canvas, x, y)
        }

        // function to move the box with right click
        function rightClickDrag (e){
            let newCoords = canvasDraw.getGraphXYFromMouseEvent(e);
            let x2 = newCoords[0];
            let y2 = newCoords[1];
            let dist = Math.hypot(x, y, x2, y2);

            if (dist > 10 && movingAllowed) {
                canvasDraw.onMiddleClick(canvas, x, y);
            }
        }

        //If it was a right click to move the box
        if (e.button === 2) {
		//blue select
			this.props.setLeftMenu(canvasDraw.findIntersected(x, y));
            movingAllowed = true;
            document.addEventListener("mousemove", rightClickDrag, { once: true })
            
        }
    };

    mouseUp = (e, canvas) =>{

        canvasDraw.solidifyObject();

        let position = canvasDraw.getGraphXYFromMouseEvent(e);
        let x = position[0]; let y = position[1];

        // If it was a left click
        if (e.button === 0) {
            if(canvas.tool === Tool.Select){
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
