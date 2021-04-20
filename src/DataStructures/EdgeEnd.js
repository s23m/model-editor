/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { SemanticIdentity } from "./SemanticIdentity";
import { Cardinality } from "./Cardinality";
import * as ArrowProps from "./ArrowProperties";

// Object that contains all the parts of an arrow ending including:
// Head type
// Cardinality
// Label
//
// Used in the Arrow class
export class EdgeEnd {
    constructor(attachedToUUID, headType = ArrowProps.EdgeEnd.NONE, cardinality, label = "", semanticIdentity) {
        this.attachedToUUID = attachedToUUID;
        this.typeName = "EdgeEnd";

        if (semanticIdentity !== undefined){
            this.semanticIdentity = semanticIdentity;
        } else {
            this.semanticIdentity = new SemanticIdentity(this.toString(), this.getDescription())
        }
        
        this.headType = headType;
        
        if (cardinality !== undefined){
            this.cardinality = cardinality;
        } else {
            this.cardinality = new Cardinality(1, 1, this.semanticIdentity.UUID);
        }

        this.label = label;
    }

    set type(newType){
        this.headType = newType;
        this.semanticIdentity.name = this.toString();
    }

    get type(){
        return this.headType;
    }

    toString(){
        return `${this.type} type Edge End`;
    }

    getDescription(){
        return `Edge end of ${this.attachedToUUID}`;
    }

    updateCardinality(lowerBound, upperBound, visibility){
        this.cardinality.lowerBound = lowerBound;
        this.cardinality.upperBound = upperBound;
        this.cardinality.visibility = visibility;
    }

    drawLines(canvasContext, points, strokeColour, fillColour) {
        canvasContext.strokeStyle = strokeColour;
        if (fillColour !== undefined) {
            canvasContext.fillStyle = fillColour;
        }

        canvasContext.beginPath();
        canvasContext.moveTo(points[0].X, points[0].Y);
        for (let i = 1; i < points.length; i++) {
            canvasContext.lineTo(points[i].X, points[i].Y)
        }
        
        if (fillColour !== undefined) {
            canvasContext.closePath();
            canvasContext.fill();
        }
        canvasContext.stroke();

        canvasContext.fillStyle = "#000"
        canvasContext.strokeStyle = "#000";
    }

    drawArrowEnd(canvasContext, x, y, angle, lineColour) {
        //Constants
        const strokeLength = 7;
        const angleFromLine = Math.PI/6;
        const angleInverted = angle + Math.PI;

        //Generate points for the arrowhead
        var arrowPoints = [];
        arrowPoints.push({
            X: x + strokeLength * Math.cos(angleInverted - angleFromLine),
            Y: y + strokeLength * Math.sin(angleInverted - angleFromLine)
        });
        arrowPoints.push({
            X: x,
            Y: y
        });
        arrowPoints.push({
            X: x + strokeLength * Math.cos(angleInverted + angleFromLine),
            Y: y + strokeLength * Math.sin(angleInverted + angleFromLine)
        });

        //Arrowhead drawing
        this.drawLines(canvasContext, arrowPoints, lineColour)
    }

    drawTriangleEnd(canvasContext, x, y, angle, lineColour, fillColour = "#FFF") {
        //Constants
        const sideLength = 7;
        const deg30 = Math.PI / 6;
        const angleInverted = angle + Math.PI;

        //Generate points for the triangle
        var trianglePoints = [];
        trianglePoints.push({
            X: x,
            Y: y
        });
        trianglePoints.push({
            X: x + sideLength * Math.cos(angleInverted - deg30),
            Y: y + sideLength * Math.sin(angleInverted - deg30)
        });
        trianglePoints.push({
            X: x + sideLength * Math.cos(angleInverted + deg30),
            Y: y + sideLength * Math.sin(angleInverted + deg30)
        });
        trianglePoints.push({
            X: x,
            Y: y
        });

        //Triangle drawing
        this.drawLines(canvasContext, trianglePoints, lineColour, fillColour);
    }

    drawDiamondEnd(canvasContext, x, y, angle, lineColour, fillColour = "#FFF") {
        //Constants
        const sideLength = 7;
        const deg20 = Math.PI / 9;
        const angleInverted = angle + Math.PI;

        //Generate points for the diamond
        var diamondPoints = [];
        diamondPoints.push({
            X: x,
            Y: y
        });
        diamondPoints.push({
            X: x + sideLength * Math.cos(angleInverted - deg20),
            Y: y + sideLength * Math.sin(angleInverted - deg20)
        });
        diamondPoints.push({
            X: x + sideLength * 2 * Math.cos(angleInverted),
            Y: y + sideLength * 2 * Math.sin(angleInverted)
        });
        diamondPoints.push({
            X: x + sideLength * Math.cos(angleInverted + deg20),
            Y: y + sideLength * Math.sin(angleInverted + deg20)
        });
        diamondPoints.push({
            X: x,
            Y: y
        });

        //Diamond drawing
        this.drawLines(canvasContext, diamondPoints, lineColour, fillColour);
    }

    draw(canvasContext, x, y, angle, lineColour){
        switch (this.type) {
            case ArrowProps.EdgeEnd.NONE:
                break;
            case ArrowProps.EdgeEnd.ARROW:
                this.drawArrowEnd(canvasContext, x, y, angle, lineColour);
                break;
            case ArrowProps.EdgeEnd.TRIANGLE:
                this.drawTriangleEnd(canvasContext, x, y, angle, lineColour);
                break;
            case ArrowProps.EdgeEnd.FILLED_TRIANGLE:
                this.drawTriangleEnd(canvasContext, x, y, angle, lineColour, lineColour);
                break;
            case ArrowProps.EdgeEnd.DIAMOND:
                this.drawDiamondEnd(canvasContext, x, y, angle, lineColour);
                break;
            case ArrowProps.EdgeEnd.FILLED_DIAMOND:
                this.drawDiamondEnd(canvasContext, x, y, angle, lineColour, lineColour);
                break;
            default:
                console.log("EdgeEnd had unexpected type: %s", this.type);
        }
    }
}