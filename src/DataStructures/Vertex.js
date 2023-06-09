/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { drawMarker, distanceThreshold, getCurrentGraph } from "../UIElements/CanvasDraw";
import { getGraphContainerKey } from "../UIElements/ContainmentTree";
import { SemanticIdentity} from "./SemanticIdentity";

//Images for static category
import Activity from '../Resources/S23M_Icons/Activity.png';
import Agent from '../Resources/S23M_Icons/Agent.png';
import BioSphere from '../Resources/S23M_Icons/BioSphere.png';
import Critical from '../Resources/S23M_Icons/Critical.png';
import Designed from '../Resources/S23M_Icons/Designed.png';
import Ecosystem from '../Resources/S23M_Icons/Ecosystem.png';
import Error from '../Resources/S23M_Icons/Error.png';
import Event from '../Resources/S23M_Icons/Event.png';
import Grow_n from '../Resources/S23M_Icons/Grow_n.png';
import Human from '../Resources/S23M_Icons/Human.png';
import Make_n from '../Resources/S23M_Icons/Make_n.png';
import Move_n from '../Resources/S23M_Icons/Move_n.png';
import Organic from '../Resources/S23M_Icons/Organic.png';
import Organisation from '../Resources/S23M_Icons/Organisation.png';
import Play_n from '../Resources/S23M_Icons/Play_n.png';
import Resource from '../Resources/S23M_Icons/Resource.png';
import SaaS_n from '../Resources/S23M_Icons/SaaS_n.png';
import Social from '../Resources/S23M_Icons/Social.png';
import Software from '../Resources/S23M_Icons/Software.png';
import Sustain_n from '../Resources/S23M_Icons/Sustain_n.png';
import Symbolic from '../Resources/S23M_Icons/Symbolic.png';
import Tacit_Knowledge from '../Resources/S23M_Icons/Tacit Knowledge.png';
import Team from '../Resources/S23M_Icons/Team.png';
import Trust from '../Resources/S23M_Icons/Trust.png';
import UI_Device from '../Resources/S23M_Icons/UI Device.png';
import { getIsStatic } from "../Config";
import { serverURL } from "../UIElements/MainView";


export var padding = 5;
export var defaultColour = "#FFD5A9";
export var defaultMinimumSize = 30;

export class Vertex {

    //As javascript doesnt have method overloading, newConstructor is used to access the secondary constructor when flagged 1 
    constructor({title = "unnamed", content, colour, x, y, width, height, semanticIdentity,newConstructor=0,loadedVertex=0}) {

        //This constructor is used to turn a vertex loaded from JSON.parse back into a vertex object
        if(newConstructor === 1){

            this.typeName = loadedVertex.typeName;
            this.semanticIdentity = loadedVertex.semanticIdentity;
            this.title = loadedVertex.title;
            this.content = loadedVertex.content;
            this.colour = loadedVertex.colour;
            this.x = loadedVertex.x;
            this.y = loadedVertex.y;
            this.icons = loadedVertex.icons;
            this.selected = false;
            this.imageElements = loadedVertex.imageElement;
            this.fontSize = 12;
            this.orignalVertex = loadedVertex.orignalVertex;
            this.originalUUID = loadedVertex.originalUUID; 
            this.Origin = loadedVertex.Origin; 
            this.width = loadedVertex.width;
            this.height = loadedVertex.height;
            this.realHeight = loadedVertex.realHeight;
            this.isAbstract = loadedVertex.isAbstract;
            this.vertexPath = loadedVertex.vertexPath;
            this.vertexGraphKey = loadedVertex.vertexGraphKey;
            this.vertexContainerKey = loadedVertex.vertexContainerKey;
            this.renderedx = loadedVertex.renderedx;
            this.renderedy = loadedVertex.renderedy;
            this.awayx = loadedVertex.awayx;
            this.awayy = loadedVertex.awayy;
            this.status = loadedVertex.status;

        }

        else{
            this.typeName = "Vertex";

            if (semanticIdentity !== undefined){
                this.semanticIdentity = semanticIdentity;
            } else {
                this.semanticIdentity = new SemanticIdentity(title,"","","", undefined ,[]);
            }

            this.title = title;


            if(content === undefined){
                this.content = ""
            }
            else{
            this.content = content;
            }

            this.colour = colour
            this.x = x;
            this.y = y;
            this.icons = [[],[],[]];
            this.selected = false;
            this.imageElements = {};
            this.fontSize = 12;
            this.orignalVertex = true; // bool to see if the selected vertex is the original
            this.Origin = "" //package the vertex originates from if needed
    

            // Note these values often change in runtime
            this.width = width;
            this.height = height;

            this.realHeight = height;

            // Make sure width and height meet a reasonable minimum
            this.width = Math.max(width, defaultMinimumSize);
            this.height = Math.max(height, defaultMinimumSize);

            this.isAbstract = false;

            //Store the path to your given vertex here
            this.vertexPath = "";

            // USed to decide where to render the object
            this.vertexGraphKey = getCurrentGraph();

            // Used to decide where the object goes in the tree
            this.vertexContainerKey = getGraphContainerKey(this.vertexGraphKey);


            // Used for moving vertices out of the way when they're not being rendered to prevent invisible overlap
            this.renderedx = x;
            this.renderedy = y;

            this.awayx = Math.floor(Math.random() * 2000000)+100000;
            this.awayy = Math.floor(Math.random() * 2000000)+100000;

            this.status = "present"
        }
        
    }

    // Save a vertice's proper x and y coordinate for later rendering and then send the vertex somewhere else
    setAway(){
        if (this.status === "present"){
            this.renderedx = this.x;
            this.renderedy = this.y;

            this.x = this.awayx;
            this.y = this.awayy;

            this.status = "away"

        }
        
    }

    setPresent(){

        if (this.status === "away"){
            this.x = this.renderedx;
            this.y = this.renderedy;

            this.status = "present"
        }
        
    }

    setGraphKey(key){
        this.vertexGraphKey = key;
    }

    getGraphKey(){
        return this.vertexGraphKey;
    }


    getSemantic(){
        return this.SemanticIdentity
    }

    setSemantic(newSem){
        this.SemanticIdentity = newSem;
    }

    // Set the container key. Done in ContainmentTree.js
    setContainerKey(key){
        this.vertexContainerKey = key;
    }

    // Get the container key. Called in CanvasDraw.js
    getContainerKey(){
        return this.vertexContainerKey;
    }

    setPath(path){
        this.vertexPath = path;
    }

    getPath(){
        return this.vertexPath;
    }

    setSelected(selected) {
        this.selected = selected;
    }

    getColour(){
        return this.colour
    }

    setColour(colour){
        this.colour = colour;
    }

    setTitle(title) {
        this.title = title;
        this.semanticIdentity.name = title;
    }

    setContent(content) {
        this.content = content;
        this.semanticIdentity.description = content;
    }

    getAbstract(){
        return this.isAbstract
    }

    toggleAbstract(){
        this.isAbstract = !this.isAbstract
    }

    setOrigin(newOrigin){
        this.Origin = newOrigin;
    }
    getOrigin(){
        return this.Origin;
    }

    getContentAsString() {
        if (this.content !== null) {
            let mergedContent = "";
            
            for (let i = 0; i < this.content.length; i++) {
                mergedContent = mergedContent.concat(this.content[i]);
                if (i < this.content.length - 1) {
                    mergedContent = mergedContent.concat("\n");
                }
            }
            
            return mergedContent;

        } else {
            return "";
        }
    }

    setIcon(fileName) {
        let fileNames = this.icons[0];
        let Icons = this.icons[1];
        let Text = this.icons[2];

        let index = fileNames.indexOf(fileName);


        //icon not part of this vertex yet
        if (index === -1) {
            fileNames.push(fileName);
            Icons.push(true);
            Text.push(false);

        } else {
            Icons[index] = !Icons[index]
        }

        if (Text[index] === false && Icons[index] === false) {
            Icons.splice(index,1);
            Text.splice(index,1);
            fileNames.splice(index,1);
        }

        console.log('iconed')

    }

    setText(fileName) {
        let fileNames = this.icons[0];
        let icons = this.icons[1];
        let text = this.icons[2];

        let index = fileNames.indexOf(fileName);

        //icon not part of this vertex yet
        if (index === -1) {
            fileNames.push(fileName);
            icons.push(false);
            text.push(true);

        } else {
            text[index] = !text[index]
        }

        if (text[index] === false && icons[index] === false) {
            icons.splice(index,1);
            text.splice(index,1);
            fileNames.splice(index,1);
        }

    }

    isIconSet(fileName) {
        let index = this.icons[0].indexOf(fileName);
        if (index === -1) {
            return false;
        }
        return this.icons[1][index];
    }

    isTextSet(fileName) {
            let index = this.icons[0].indexOf(fileName);
            if (index === -1) {
                return false;
            } else {
                return this.icons[2][index];
            }
    }

    getBounds() {
        return [this.x, this.y, this.x+this.width, this.y+this.realHeight-padding];
    }

    expandSide(side, x, y,canvasContext) {
        let ex = 0;
        let ey = 0;

        let pad = (this.hasContent() ? padding*4 : padding*2);

        switch (side) {
            case "topLeft":
                ey += this.y + this.height;
                this.y = y;
                this.height = ey-this.y;
                ex += this.x + this.width;
                this.x = x;
                this.width = ex-this.x;
                break;

            case "topRight":
                ey += this.y + this.height;
                this.y = y;
                this.height = ey-this.y;
                this.width = x-this.x;
                break;

            case "bottomLeft":

                this.height = y-this.y  - this.iconAreaHeight - this.contentHeight - pad;
                ex += this.x + this.width;
                this.x = x;
                this.width = ex-this.x;
                break;

            case "bottomRight":

                this.height = y - this.y - this.iconAreaHeight - this.contentHeight - pad;
                this.width = x-this.x;
                break;

            case "left":
                ex += this.x + this.width;
                this.x = x;
                this.width = ex-this.x;
                break;

            case "right":
                this.width = x-this.x;
                break;

            case "top":
                ey += this.y + this.height;
                this.y = y;
                this.height = ey-this.y;
                break;

            case "bottom":
                this.height = y-this.y  - this.iconAreaHeight - this.contentHeight - pad;
                break;

            default:
                break;
        }


        this.height = Math.max(this.height,12+padding);
        this.draw(canvasContext)
    }


    increaseWidthIfNecessary(canvasContext, possibleWidth) {
        if (possibleWidth > this.width) {
            this.width = possibleWidth;
        }

    }

    hasContent() {
        return !(this.content[0] === "" && this.content.length === 1)
    }


    draw(canvasContext) {

        // Icon height in px
        let iconHeight = 20;
        let iconPadding = 2;
        let iconListLen = this.icons[0].length;

        // check for width increases
        for (let i = 0; i < this.icons[0].length; i++) {

            if (this.icons[1][i] === true) {
                if (this.icons[2][i] === true) {
                    this.increaseWidthIfNecessary(canvasContext, iconHeight + canvasContext.measureText("<< " + this.icons[0][i] + " >>").width);
                }
            }else{
                if (this.icons[2][i] === true) {
                    this.increaseWidthIfNecessary(canvasContext, canvasContext.measureText("<< " + this.icons[0][i] + " >>").width);
                }
            }
        }
        this.increaseWidthIfNecessary(canvasContext, canvasContext.measureText(this.title + this.Origin).width);

        for (let i = 0; i < this.content.length; i++) {
            this.increaseWidthIfNecessary(canvasContext, canvasContext.measureText(this.content[i]).width + padding*2);
        }

        // Font size
        padding = 5;
        // Set font settings
        if(this.is)
        canvasContext.font = this.fontSize+"px Segoe UI";
        canvasContext.fontSize = this.fontSize;


        // Find the maximum width of text and size the class accordingly
        let measuredNameText = canvasContext.measureText(this.title + this.Origin).width;
        let maxWidth = Math.max(measuredNameText + padding*2, this.width);
        this.contentHeight = 0;

        // Iterate over all content text lines
        for (let i = 0; i < this.content.length; i++) {
            let measuredText = canvasContext.measureText(this.content[i]);
            maxWidth = Math.max(maxWidth, measuredText.width, measuredNameText);
            this.contentHeight += this.fontSize+padding;
        }

        if(!this.hasContent()){
            this.contentHeight = 0
        }

        if (maxWidth > this.width) {
            this.width = maxWidth
        }

        // Configure drawing for shadows
        // And generally make it look nice
        canvasContext.shadowOffsetX = 2.0; canvasContext.shadowOffsetY = 2.0;
        this.iconAreaHeight = (iconHeight + (iconPadding * 2)) * iconListLen;

        // Update rect height
        // Use this to force text to fit
        if (this.content[0] !== "") {
            this.realHeight = padding * 4 + this.height + this.iconAreaHeight + this.contentHeight;
        }else{
            this.realHeight = padding * 2 + this.height + this.iconAreaHeight
        }

        // Draw rect
        
        canvasContext.fillStyle = this.colour;
        canvasContext.fillRect(this.x, this.y, this.width, this.realHeight);
        canvasContext.strokeRect(this.x, this.y, this.width, this.realHeight);


        if (this.content[0] !== "") {
            canvasContext.strokeRect(this.x, this.y, this.width, this.height+this.iconAreaHeight+padding*2);
        }

        // Draw selected markers if rect is selected
        if (this.selected) {
            canvasContext.fillStyle = "#000000";
            drawMarker(this.x, this.y);
            drawMarker(this.x+this.width, this.y);
            drawMarker(this.x, this.y+this.realHeight);
            drawMarker(this.x+this.width, this.y+this.realHeight);
        }

        // Draw Icons by filename
        let yPos = this.y + iconPadding;
        let xPos = this.x + this.width + iconPadding;

        function loadImage(imageElement) {
            let sh = imageElement.height;
            let sw = imageElement.width;
            let scale = iconHeight / sh;
            canvasContext.drawImage(imageElement, xPos-(iconPadding*2)-(sw*scale), yPos, sw * scale, sh * scale);
            yPos += iconHeight + (iconPadding * 2); // What's the point of this line? yPos should be out of scope when this method is run

        }

        for (let i = 0; i < this.icons[0].length; i++) {

            if (this.icons[1][i] === true) {
                if (this.icons[2][i] === true) {
                    this.increaseWidthIfNecessary(canvasContext, iconHeight + canvasContext.measureText("<< " + this.icons[0][i] + " >>").width);
                }

                let element = this.imageElements[this.icons[0][i]];

                
                if (element === undefined) {

                    let imageElement = new Image();
                    imageElement.crossOrigin = "anonymous";

                    if(getIsStatic() === false){
                    imageElement.src = serverURL + "/icons/" + this.icons[0][i];
                    }
                    else{

                    switch(this.icons[0][i]){
                        case 'Activity.png':
                            imageElement.src = Activity
                            break;
                        case 'Agent.png':
                            imageElement.src = Agent
                            break;
                        case 'BioSphere.png':
                            imageElement.src = BioSphere
                            break;
                        case 'Critical.png':
                            imageElement.src = Critical
                            break;
                        case 'Designed.png':
                            imageElement.src = Designed
                            break;
                        case 'Ecosystem.png':
                            imageElement.src = Ecosystem
                            break;    
                        case 'Error.png':
                            imageElement.src = Error
                            break;

                        case 'Event.png':
                            imageElement.src = Event
                            break;
                        case 'Grow_n.png':
                            imageElement.src = Grow_n
                            break;
                        case 'Human.png':
                            imageElement.src = Human
                            break;
                        case 'Make_n.png':
                            imageElement.src = Make_n
                            break;
                        case 'Move_n.png':
                            imageElement.src = Move_n
                            break;
                        case 'Organic.png':
                            imageElement.src = Organic
                            break;
                        case 'Organisation.png':
                            imageElement.src = Organisation
                            break;
                        case 'Play_n.png':
                            imageElement.src = Play_n
                            break;
                        case 'Resource.png':
                            imageElement.src = Resource
                            break;
                        case 'SaaS_n.png':
                            imageElement.src = SaaS_n
                            break;
                        case 'Social.png':
                            imageElement.src = Social
                            break;
                        case 'Software.png':
                            imageElement.src = Software
                            break;
                        case 'Sustain_n.png':
                            imageElement.src = Sustain_n
                            break;
                        case 'Symbolic.png':
                            imageElement.src = Symbolic
                            break;
                        case 'Tacit Knowledge.png':
                            imageElement.src = Tacit_Knowledge
                            break;
                        case 'Team.png':
                            imageElement.src = Team
                            break;
                        case 'Trust.png':
                            imageElement.src = Trust
                            break;
                        case 'UI Device.png':
                            imageElement.src = UI_Device
                            break;
                        default:
                            imageElement.src = Activity
                            break;

                    }
                }
                    

                    imageElement.onload = () => {
                        loadImage(imageElement);
                        this.imageElements[this.icons[0][i]] = imageElement
                    };
                } else {
                    loadImage(element)
                }
            } else {
                yPos += iconHeight + (iconPadding * 2);
            }
            
        } 

        // Reset color for text
        canvasContext.fillStyle = "#000000";

        // Draw Height for text that will be increased to draw downward
        let dy = padding+this.fontSize;

        // Disable shadows for text
        canvasContext.shadowOffsetX = 0.0; canvasContext.shadowOffsetY = 0.0;

        let txPos = this.x + iconPadding;
        let tyPos = this.y + iconHeight;

        for (let i = 0; i < this.icons[0].length; i++) {
            if (this.icons[2][i] === true) {
                if (this.icons[1][i] !== true) {
                    this.increaseWidthIfNecessary(canvasContext, canvasContext.measureText("<< " + this.icons[0][i] + " >>").width);
                }

                let name = "<< " + this.icons[0][i].slice(0, -4) + " >>";
                if (this.icons[0][i].slice(-6, -4) === "_n") {
                    name = "";
                }

                canvasContext.fillText(name, txPos, tyPos);
            }
            tyPos += iconHeight + (iconPadding * 2);
        }

        // Draw name
        this.increaseWidthIfNecessary(canvasContext, canvasContext.measureText(this.Origin + this.title).width);

        if(this.isAbstract) {
            canvasContext.font = "italic " + this.fontSize + "px Segoe UI";
        }else{
            canvasContext.font = this.fontSize + "px Segoe UI";
        }

        canvasContext.fillText(this.Origin + this.title , this.x+padding, this.y+dy+this.iconAreaHeight);
        dy = padding*2 +this.height + this.contentHeight;

        canvasContext.font = this.fontSize+"px Segoe UI";

        // Draw text
        for (let i = 0; i < this.content.length; i++) {
            this.increaseWidthIfNecessary(canvasContext, canvasContext.measureText(this.content[i]).width + padding*2);
            canvasContext.fillText(this.content[i], this.x+padding, this.y+dy+this.iconAreaHeight);
            dy += this.fontSize + padding;
        }

        canvasContext.strokeStyle = "black"
    }

    // Checks if it intersects with point
    intersects(x, y) {
        if (x < this.x) return false;
        if (y < this.y) return false;
        if (x > this.x+this.width) return false;
        return y <= this.y + this.realHeight;

    }

    // Gets the nearest side, in Arrow compatible x,y percentage values
    // Also returns a threshold distance
    // Parameters are the cursor X and Y coordinates
    // Return value:
    //      [threshold, xRel, yRel]
    //
    // If threshold is -1, xRel and yRel are equal to cursorX, cursorY
    // This only happens when cursor shouldn't connect to vertex
    getNearestSideFrom(cursorX, cursorY) {

        // Else
        return this.getNearestSide(cursorX, cursorY);
    }

    getNearestSide(cursorX, cursorY) {
        // Create possibilities
        let sides = [];

        // If can connect to top/bottom
        if (cursorX > this.x && cursorX < this.x+this.width) {
            let xPercentage = (cursorX-this.x)/this.width;

            sides.push([Math.abs(cursorY-(this.y)), xPercentage, 0]);
            sides.push([Math.abs(cursorY-(this.y+this.realHeight)), xPercentage, 1]);
        }

        // If can connect to left/right
        else if (cursorY > this.y && cursorY < this.y+(this.realHeight)) {
            let yPercentage = (cursorY-this.y)/(this.realHeight);

            sides.push([Math.abs(cursorX-(this.x)), 0, yPercentage]);
            sides.push([Math.abs(cursorX-(this.x+this.width)), 1, yPercentage]);
        }

        // Can't connect

        let goodSide = false;

        sides.forEach((side) => {
            if(side[0] < distanceThreshold){
                goodSide = true;
            }
        });

        if(goodSide === false && cursorX > this.x && cursorX < this.x + this.width && cursorY > this.y && cursorY < this.y+this.realHeight){
                // click was inside the vertex but not in tolerance
                let yPercentage = (cursorY-this.y)/(this.realHeight);
                let xPercentage = (cursorX-this.x)/this.width;

                // find closest side
                let rightDist = Math.abs(xPercentage-1)*this.width;
                let topDist = yPercentage*this.realHeight;
                let leftDist = xPercentage*this.width;
                let bottomDist = yPercentage*this.realHeight;

                let closestIndex = 0;
                let closestDistance = leftDist;
                let distArrays = [leftDist,rightDist,topDist,bottomDist];

                // no need to go through leftDist here as its already set as shortest
                for(let i = 1; i< distArrays.length-1; i++){
                    if(distArrays[i] < closestDistance){
                        closestDistance = distArrays[i];
                        closestIndex = i;
                    }
                }

                if ( closestIndex === 0 ){
                    return [0, 0, yPercentage]
                }
                if ( closestIndex === 1 ){
                    return [0, 1, yPercentage]
                }
                if ( closestIndex === 2 ){
                    return [0, xPercentage, 0]
                }
                if ( closestIndex === 3 ){
                    return [0, xPercentage, 1]
                }
        }

        if(sides.length === 0){
            return null
        }

        // Return side with shortest distance
        let shortest = sides[0];
        for (let i = 1; i < sides.length; i++) {
            if (sides[i][0] < shortest[0]) {
                shortest = sides[i];
            }
        }
        return shortest;
    }

}