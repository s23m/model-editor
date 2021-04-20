/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { SemanticIdentity } from "./SemanticIdentity";
import {drawMarker, getDistance} from "../UIElements/CanvasDraw";
import * as ArrowProps from "./ArrowProperties";
import { EdgeEnd } from "./EdgeEnd";
import {Tool} from "../UIElements/LeftMenu";
import * as canvasDraw from "../UIElements/CanvasDraw"

export class Arrow {
    // Connects an arrow fromVertex to toVertex
    // pathData is an array of objects that can either be a:
    //      0) Vertex Data
    //         [0, UUID, xPercentage, yPercentage]
    //         The Percentage data is the relative percentage
    //              e.g. 0,0 represents top left, 1,1 bottom right etc
    //      1) Array containing an x and y element
    //         [1, x, y]
    constructor(objectsList, pathData, type, semanticIdentity) {
        this.typeName = "Arrow";

        if (semanticIdentity !== undefined || objectsList === null){
            this.semanticIdentity = semanticIdentity;
        } else {
            if (objectsList.length > 1) {
                this.semanticIdentity = new SemanticIdentity("Arrow from " + objectsList[0].semanticIdentity.UUID + " to " + objectsList[1].semanticIdentity.UUID, "", "", "", undefined, []);
            } else if (objectsList.length === 1) {
                this.semanticIdentity = new SemanticIdentity("Arrow connecting " + objectsList[0].semanticIdentity.UUID, "", "", "", undefined, []);
            } else {
                this.semanticIdentity = new SemanticIdentity("Arrow connecting 1 or less vertices", "", "", "", undefined, []);
            }
        }

        this.sourceEdgeEnd = new EdgeEnd(this.semanticIdentity.UUID);
        this.destEdgeEnd = new EdgeEnd(this.semanticIdentity.UUID);

        // Ensure there are at least 2 points
        if (pathData.length === 1) pathData.push(pathData[0]);
        // Save pathData for later
        this.pathData = pathData;

        this.sourceVertexUUID = null;
        this.destVertexUUID = null;
        this.updateAttachedVertices();

        // Construct Path
        this.rebuildPath();
        
        // Type

        this.lineColour = ArrowProps.LineColour.BLACK;
        this.lineType = ArrowProps.LineType.SOLID;

        if (type === Tool.Edge || type === Tool.Specialisation || type === Tool.Visibility) {
            this.sourceEdgeEnd.type = ArrowProps.EdgeEnd.NONE
        }else{
            console.log("Failed to find correct tool");
            this.sourceEdgeEnd.type = ArrowProps.EdgeEnd.NONE
        }

        if (type === Tool.Edge) {
            this.destEdgeEnd.type = ArrowProps.EdgeEnd.NONE
            this.typeName = "Edge";
        }else if (type === Tool.Specialisation){
            this.destEdgeEnd.type = ArrowProps.EdgeEnd.TRIANGLE
            this.typeName = "Specialisation";
        }else if (type === Tool.Visibility){
            this.destEdgeEnd.type = ArrowProps.EdgeEnd.ARROW;
            this.lineType = ArrowProps.LineType.DASHED
            this.typeName = "Visibility";
        }else{
            console.log("Failed to find correct tool");
            this.destEdgeEnd.type = ArrowProps.EdgeEnd.NONE
        }

        this.edgeType = type;

        this.selected = false;

        this.sourceIsNavigable = false;
        this.destIsNavigable = false;
        this.sourceIsAggregation = false;
        this.destIsAggregation = false;
    }

    toggleNavigable(side){
        if(side === 0) {
            this.sourceIsNavigable = !this.sourceIsNavigable;
        }else if(side === 1){
            this.destIsNavigable = !this.destIsNavigable;
        }
        if(this.sourceIsAggregation){
            this.sourceIsNavigable = true;
        }
        if(this.destIsAggregation){
            this.destIsNavigable = true;
        }

        if(this.sourceIsNavigable && this.destIsNavigable){
            if(this.sourceIsAggregation){
                this.sourceEdgeEnd.type = ArrowProps.EdgeEnd.FILLED_DIAMOND;
                this.destEdgeEnd.type = ArrowProps.EdgeEnd.ARROW;
            }
            else if(this.destIsAggregation){
                this.sourceEdgeEnd.type = ArrowProps.EdgeEnd.ARROW;
                this.destEdgeEnd.type = ArrowProps.EdgeEnd.FILLED_DIAMOND;
            }else{
                this.sourceEdgeEnd.type = ArrowProps.EdgeEnd.NONE;
                this.destEdgeEnd.type = ArrowProps.EdgeEnd.NONE;
            }
        }else if(this.sourceIsNavigable){
            if(this.sourceIsAggregation){
                this.sourceEdgeEnd.type = ArrowProps.EdgeEnd.FILLED_DIAMOND;
                this.destEdgeEnd.type = ArrowProps.EdgeEnd.NONE;
            }else {
                this.sourceEdgeEnd.type = ArrowProps.EdgeEnd.ARROW;
                this.destEdgeEnd.type = ArrowProps.EdgeEnd.NONE;
            }
        }else if(this.destIsNavigable){
            if(this.destIsAggregation){
                this.destEdgeEnd.type = ArrowProps.EdgeEnd.FILLED_DIAMOND;
                this.sourceEdgeEnd.type = ArrowProps.EdgeEnd.NONE;
            }else {
                this.destEdgeEnd.type = ArrowProps.EdgeEnd.ARROW;
                this.sourceEdgeEnd.type = ArrowProps.EdgeEnd.NONE;
            }
        }else{
            this.sourceEdgeEnd.type = ArrowProps.EdgeEnd.NONE;
            this.destEdgeEnd.type = ArrowProps.EdgeEnd.NONE;
        }

    }

    toggleAggregation(side){
        if(side === 0){
            this.sourceIsAggregation = !this.sourceIsAggregation;
            if(this.destIsAggregation && this.sourceIsAggregation){
                this.destIsAggregation = false;
            }
        }else{
            this.destIsAggregation = !this.destIsAggregation;
            if(this.destIsAggregation && this.sourceIsAggregation){
                this.sourceIsAggregation = false;
            }
        }


        if(this.sourceIsAggregation) {
            this.sourceEdgeEnd.type = ArrowProps.EdgeEnd.FILLED_DIAMOND;
            if(this.destIsNavigable){
                this.destEdgeEnd.type = ArrowProps.EdgeEnd.ARROW;
            }else{
                this.destEdgeEnd.type = ArrowProps.EdgeEnd.NONE
            }
        }else if(this.destIsAggregation){
            this.destEdgeEnd.type = ArrowProps.EdgeEnd.FILLED_DIAMOND;
            if(this.sourceIsNavigable){
                this.sourceEdgeEnd.type = ArrowProps.EdgeEnd.ARROW;
            }else{
                this.sourceEdgeEnd.type = ArrowProps.EdgeEnd.NONE
            }
        }else{
            // this updates the arrow heads so they are correct
            this.toggleNavigable(100)
        }
    }

    getNavigable(side){
        if(side === 0){
            return this.sourceIsNavigable;
        }else{
            return this.destIsNavigable;
        }

    }

    getAggregation(side){
        if(side === 0){
            return this.sourceIsAggregation
        }else{
            return this.destIsAggregation
        }

    }

    trimPath(){
        this.pathData = [this.pathData[0], this.pathData[this.pathData.length-1]];
        this.path = [this.path[0], this.path[this.path.length-1]];
    }

    // Rebuilds path from cached pathData
    rebuildPath() {

        let connectedObjectUUIDs = this.getObjectUUIDList();
        let objects = [];

        connectedObjectUUIDs.forEach((UUID) => {
            objects.push(canvasDraw.getObjectFromUUID(UUID))
        });

        // X, Y data for path
        this.path = [];

        for (let i = 0; i < this.pathData.length; i++) {
            // Check if its case 0 or 1
            let pathItem = this.pathData[i];

            //If the first element of a PathItem is 0, the second element contains the UUID of an object
            if (pathItem[0] === 0) {
                this.path.push(this.getZerothCasePathItem(objects, pathItem));
            }
            //If the first element is 1, the next two elements are the X and Y points, respectively
            else if (pathItem[0] === 1) {
                this.path.push([pathItem[1], pathItem[2]]);
            } else {
                console.error("Invalid PathData case, wrong case", pathItem);
            }
        }
    }

    // Gets pathItem from object (hopefully a vertex) based on UUID
    getZerothCasePathItem(objects, pathItem) {
        for (let i = 0; i < objects.length; i++) {
            if (objects[i] !== null && objects[i] !== undefined) {
                if (objects[i].semanticIdentity.UUID === pathItem[1]) {
                    let x = pathItem[2]*objects[i].width + objects[i].x;
                    let y = pathItem[3]*objects[i].realHeight + objects[i].y;
                    return [x, y]
                }
            }
        }

        console.error("Could not find vertex to connect for pathItem", pathItem);
        return null;
    }

    getObjectUUIDList(){
        let output = [];
            this.pathData.forEach((item) => {
                let index = this.pathData.indexOf(item);
                if(item == null){
                    this.pathData[index] = [1,this.path[index][0],this.path[index][1]]
                }
                if (this.pathData[index][0] === 0) {
                    output.push(item[1])
                }
            });
        return output
    }

    updateAttachedVertices() {
        var pathStart = this.pathData[0];
        var pathEnd = this.pathData[this.pathData.length - 1];

        if (pathStart[0] === 0) {
            this.sourceVertexUUID = pathStart[1];
        } else {
            this.sourceVertexUUID = null;
        }

        if (pathEnd[0] === 0) {
            this.destVertexUUID = pathEnd[1];
        } else {
            this.destVertexUUID = null;
        }
    }

    setSelected(selected) {
        this.selected = selected;
    }

    updateSourceCardinality(lowerBound, upperBound, visibility) {
        this.sourceEdgeEnd.updateCardinality(lowerBound, upperBound, visibility);
    }

    getSourceCardinalityVisibility() {
        return this.sourceEdgeEnd.cardinality.isVisible;
    }

    toggleSourceCardinalityVisibility() {
        this.sourceEdgeEnd.cardinality.toggleVisibility();
    }

    getSourceCardinalityLowerBound() {
        return this.sourceEdgeEnd.cardinality.lowerBound;
    }

    getSourceCardinalityUpperBound() {
        return this.sourceEdgeEnd.cardinality.upperBound;
    }

    updateDestCardinality(lowerBound, upperBound, visibility) {
        this.destEdgeEnd.updateCardinality(lowerBound, upperBound, visibility);
    }

    getDestCardinalityVisibility() {
        return this.destEdgeEnd.cardinality.isVisible;
    }

    toggleDestCardinalityVisibility() {
        this.destEdgeEnd.cardinality.toggleVisibility();
    }

    getDestCardinalityLowerBound() {
        return this.destEdgeEnd.cardinality.lowerBound;
    }

    getDestCardinalityUpperBound() {
        return this.destEdgeEnd.cardinality.upperBound;
    }

    setStartLabel(label) {
        this.sourceEdgeEnd.label = label;
    }

    setEndLabel(label) {
        this.destEdgeEnd.label = label;
    }

    setLineColour(lineColour) {
        let val = ArrowProps.StringNameToLineColour[lineColour];
        if (val !== undefined) {
            this.lineColour = val;
        } else {
            console.log("Attempted to assign invalid lineColour: %s", lineColour);
        }
    }

    setLineType(lineType) {
        let val = ArrowProps.StringToLineType[lineType];
        if (val !== undefined) {
            this.lineType = val;
        } else {
            console.log("Attempted to assign invalid lineType: %s", lineType);
        }
    }

    // Creates nodes for an algorithmn to path find around a vertex
    createPathNodesForVertex(vertex, nodeIndex, d) {
        // Set ids
        let topLeft     = nodeIndex++;
        let top         = nodeIndex++;
        let topRight    = nodeIndex++;
        let right       = nodeIndex++;
        let bottomRight = nodeIndex++;
        let bottom      = nodeIndex++;
        let bottomLeft  = nodeIndex++;
        let left        = nodeIndex++;

        // Create nodes for: fromVertex
        let vertexNodes = [];
        vertexNodes.push([topLeft,     vertex.x-d,              vertex.y+vertex.height+d, [left, top]]);               // Top    Left
        vertexNodes.push([top,         vertex.x+vertex.width/2, vertex.y+vertex.height+d, [topLeft, topRight]]);       // Top
        vertexNodes.push([topRight,    vertex.x+vertex.width+d, vertex.y+vertex.height+d, [top, right]]);              // Top    Right
        vertexNodes.push([right,       vertex.x+vertex.width+d, vertex.y+vertex.height/2, [topRight, bottomRight]]);   //        Right
        vertexNodes.push([bottomRight, vertex.x+vertex.width+d, vertex.y-d,               [right, bottom]]);           // Bottom Right
        vertexNodes.push([bottom,      vertex.x+vertex.width/2, vertex.y-d,               [bottomRight, bottomLeft]]); // Bottom
        vertexNodes.push([bottomLeft,  vertex.x-d,              vertex.y-d,               [bottomRight, left]]);       // Bottom Left
        vertexNodes.push([left,        vertex.x-d,              vertex.y+vertex.height/2, [bottomLeft, topLeft]]);     //        Left
        return [nodeIndex, vertexNodes];
    }

    drawStartHead(canvasContext) {
        let lineAngle = Math.atan2(this.getSY() - this.getNSY(), this.getSX() - this.getNSX());
        this.sourceEdgeEnd.draw(canvasContext, this.getSX(), this.getSY(), lineAngle, this.lineColour);
    }

    drawEndHead(canvasContext) {
        let lineAngle = Math.atan2(this.getEY() - this.getNEY(), this.getEX() - this.getNEX());
        this.destEdgeEnd.draw(canvasContext, this.getEX(), this.getEY(), lineAngle, this.lineColour);
    }

    isPathSegmentLR(startIndex,endIndex){
        let indexSx = this.path[startIndex][0];
        let indexEx = this.path[endIndex][0];
        let indexSy = this.path[startIndex][1];
        let indexEy = this.path[endIndex][1];

        return Math.abs(indexSx-indexEx) > Math.abs(indexSy-indexEy)
    }

    getTextOffsets(canvasContext, sourceText, destText, sourceCtext, destCtext) {
        let sourceTextWidth = canvasContext.measureText(sourceText).width;
        let destTextWidth = canvasContext.measureText(destText).width;
        let sourceCtextWidth = canvasContext.measureText(sourceCtext).width;
        let destCtextWidth = canvasContext.measureText(destCtext).width;
        let textHeight = 15;
        // 'M' is the widest possible character
        let charWidth = canvasContext.measureText("M").width;

        let sxOffset;
        let syOffset;
        let exOffset;
        let eyOffset;

        let sxOffsetc;
        let syOffsetc;
        let exOffsetc;
        let eyOffsetc;

        let sxFlip = true;
        let syFlip = true;
        let exFlip = true;
        let eyFlip = true;

        // true if arrow is landscape, false if arrow is portrait;
        let E1index = this.path.length-2;
        let E2index = this.path.length-1;

        let startLRArrow = this.isPathSegmentLR(0,1);
        let endLRArrow = this.isPathSegmentLR(E1index,E2index);

        let SSX = this.path[0][0];
        let SSY = this.path[0][1];
        let SEX = this.path[1][0];
        let SEY = this.path[1][1];

        let ESX = this.path[E1index][0];
        let ESY = this.path[E1index][1];
        let EEX = this.path[E2index][0];
        let EEY = this.path[E2index][1];

        if (startLRArrow) {
            if (SSX > SEX) {
                sxFlip = !sxFlip;
            }
        } else {
            if (SSY > SEY) {
                syFlip = !syFlip;
            }
        }

        if (endLRArrow) {
            if (ESX > EEX) {
                exFlip = !exFlip;
            }
        } else {
            if (ESY > EEY) {
                eyFlip = !eyFlip;
            }
        }


        if (sxFlip) {
            sxOffset = charWidth/2;
            if (startLRArrow) {
                sxOffsetc = charWidth/2;
            } else {
                sxOffsetc = -1*(sourceCtextWidth+charWidth/2)
            }
        } else {
            sxOffset = -1*(sourceTextWidth+charWidth/2);
            if (startLRArrow) {
                sxOffsetc = -1*(sourceCtextWidth+charWidth/2)
            } else {
                sxOffsetc = charWidth/2;
            }
        }
        

        if (syFlip) {
            syOffset = textHeight;
            if (startLRArrow) {
                syOffsetc = -1*(textHeight/2)
            } else {
                syOffsetc = syOffset;
            }
        } else {
            syOffset = -1*(textHeight/2);
            if (startLRArrow) {
                syOffsetc = syOffset;
            } else {
                syOffsetc = -1*(textHeight/2)
            }
        }


        //if true arrow moves more in x than in y
        exFlip = !exFlip;
        eyFlip = !eyFlip;

        if (exFlip) {
            exOffset = charWidth/2;
            if (endLRArrow) {
                exOffsetc = charWidth/2;
            } else {
                exOffsetc = -1*(destCtextWidth+charWidth/2)
            }
        } else {
            exOffset = -1*(destTextWidth+charWidth/2);
            if (endLRArrow) {
                exOffsetc = -1*(destCtextWidth+charWidth/2)
            } else {
                exOffsetc = charWidth/2;
            }
        }


        if (eyFlip) {
            eyOffset = textHeight;
            if (endLRArrow) {
                eyOffsetc = -1*(textHeight/2);
            } else {
                eyOffsetc = eyOffset;
            }
        } else {
            eyOffset = -1*(textHeight/2);
            if (endLRArrow) {
                eyOffsetc = textHeight;
            } else {
                eyOffsetc = eyOffset;
            }
        }


        return [sxOffset,syOffset,exOffset,eyOffset,sxOffsetc,syOffsetc,exOffsetc,eyOffsetc]
    }



    drawLabelsAndCardinalities(canvasContext) {
        let sourceCardText = this.sourceEdgeEnd.cardinality.toString();
        let destCardText = this.destEdgeEnd.cardinality.toString();
        let Offsets = this.getTextOffsets(canvasContext,this.sourceEdgeEnd.label,this.destEdgeEnd.label,sourceCardText,destCardText);

        canvasContext.fillStyle = "#000";

        //draw source text
        canvasContext.fillText(this.sourceEdgeEnd.label, this.getSX() + Offsets[0], this.getSY() + Offsets[1]);

        //draw destination text
        canvasContext.fillText(this.destEdgeEnd.label, this.getEX() + Offsets[2], this.getEY() + Offsets[3]);

        //draw source cardinality
        if (this.getSourceCardinalityVisibility()) {
            canvasContext.fillText(sourceCardText, this.getSX() + Offsets[4], this.getSY() + Offsets[5]);
        }

        //draw destination cardinality
        if (this.getDestCardinalityVisibility()) {
            canvasContext.fillText(destCardText, this.getEX() + Offsets[6], this.getEY() + Offsets[7]);
        }
    }

    draw(canvasContext) {
        let dashLength = 5;

        switch (this.lineType) {
            case ArrowProps.LineType.SOLID:
                canvasContext.setLineDash([]);
                break;
            case ArrowProps.LineType.DASHED:
                canvasContext.setLineDash([dashLength, dashLength]);
                break;
            default:
                console.log("Arrow had invalid lineType: %s", this.lineType);
        }

        // Draw
        canvasContext.strokeStyle = this.lineColour;

        // Draw Lines
        for (let i = 0; i < this.path.length-1; i++) {
            let from = this.path[i];
            let to = this.path[i+1];

            canvasContext.beginPath();
            canvasContext.moveTo(from[0], from[1]);
            canvasContext.lineTo(to[0], to[1]);
            canvasContext.stroke();
        }

        canvasContext.strokeStyle = "#000";
        canvasContext.setLineDash([]);

        this.drawStartHead(canvasContext);
        this.drawEndHead(canvasContext);
        //store which labels were flipped and in which direction (x/y)
        this.drawLabelsAndCardinalities(canvasContext);

        if (this.selected) {
            for (let i = 0; i < this.path.length; i++) {
                let pos = this.path[i];
                drawMarker(pos[0], pos[1]);
            }
        }
    }

    intersects(cx, cy) {
        for (let i = 0; i < this.path.length-1; i++) {
            let from = this.path[i];
            let to = this.path[i+1];

            if (this.intersectsSegment(cx, cy, from, to)) return true;
        }
        return false;
    }

    // Checks if it intersects with one of the line segments
    intersectsSegment(cx, cy, from, to) {
        let m = getDistance(cx, cy, from[0], from[1]);
        let n = getDistance(cx, cy, to[0], to[1]);
        let l = getDistance(from[0], from[1], to[0], to[1]);

        let threshold = 1;

        return (m+n-threshold < l);
    }

    // Get first x/y
    getSX() {
        return this.path[0][0];
    }
    getSY() {
        return this.path[0][1];
    }

    // Get second x/y
    getNSX() {
        return this.path[1][0];
    }
    getNSY() {
        return this.path[1][1];
    }

    // Get second last x/y
    getNEX() {
        let index = this.path.length-2;
        if (index < 0) index = 0;
        return this.path[index][0];
    }
    getNEY() {
        let index = this.path.length-2;
        if (index < 0) index = 0;
        return this.path[index][1];
    }

    // Get last x/y
    getEX() {
        return this.path[this.path.length-1][0];
    }
    getEY() {
        return this.path[this.path.length-1][1];
    }
}