/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { CollectionsBookmarkOutlined, ContactSupportOutlined } from "@material-ui/icons";
import { currentObjects, getModelName, createVertex } from "../UIElements/CanvasDraw";
import {SemanticIdentity} from "./SemanticIdentity";



export class VertexNode {
    constructor(vertex) {
        this.vertex = vertex;
        this.children = new Set();
        this.typeName = "VertexNode";

        //The path of this particular vertex node for displaying on the tree view element
        this.cleanObjectPath = (getModelName(),"/","Vertices")
        this.vertexObjectPath = (getModelName(),"/","Vertices")
    }

    add(node) {
        this.children.add(node);
    }

    remove(traversedVertices, node) {
        console.log("remove is called")
        let isRemoved = false;
        traversedVertices.add(this);

        //Remove from the current vertex
        isRemoved = this.children.has(node);
        this.children.delete(node);

        //Continue to remove from anywhere deeper in the tree
        for (let child of this.children) {
            if (!traversedVertices.has(child)) {
                traversedVertices.add(child);
                isRemoved = child.remove(traversedVertices, node);
            }
        }

        return isRemoved;
    }

    getVertexNode(traversedVertices, vertex, recursive = true) {
        for (let child of this.children) {
            if (!traversedVertices.has(child)) {
                traversedVertices.add(child);

                if (child.vertex.semanticIdentity.UUID === vertex.semanticIdentity.UUID) {
                    return child;
                } else if (recursive) {
                    let node = child.getVertexNode(traversedVertices, vertex);
                    if (node !== null) {
                        return node;
                    }
                }
            }
        }

        return null;
    }

    //Remove from just the children of this object, without removing from deeper in the tree
    removeFromChildren(node) {
        if (this.children.has(node)) {
            this.children.delete(node);
            return true;

        } else {
            return false;
        }
    }

    flatten(traversedVertices) {
        var flattenedArray = [];

        for (let childNode of this.children) {
            if (!traversedVertices.has(childNode)) {
                traversedVertices.add(childNode);
                flattenedArray.push(childNode.vertex);

                if (childNode !== null) {
                    flattenedArray.push(...childNode.flatten(traversedVertices));
                }
            }
        }

        return flattenedArray;
    }

    flattenVertexNodes(traversedVertices) {
        var flattenedArray = [];

        for (let childNode of this.children) {
            if (!traversedVertices.has(childNode)) {
                traversedVertices.add(childNode);
                flattenedArray.push(childNode);

                if (childNode !== null) {
                    flattenedArray.push(...childNode.flattenVertexNodes(traversedVertices));
                }
            }
        }

        return flattenedArray;
    }

    has(traversedVertices, node) {
        //Search for object in children
        if (this.children.has(node)) {
            return true;

        } else {

            //Search for object in children of children
            for (let child of this.children) {
                if (!traversedVertices.has(child)) {
                    traversedVertices.add(child);
                    if (child.has(traversedVertices, node)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    toTreeViewElement(returnOption, parsedRenderKey) { //added the model key parameter to we can specifiy what models vertexes belong to
        //console.log("toTreeViewElement called successfully")
        //Pretty much everything that's currently on the canvas is searched and then converted into the tree appropriate struct in the below if else statements.
        //Then, the vertices and arrows folder nodes can display their appropriate children.
        let ArrowChildren = [];
        let VertexChildren = [];
    

        //These are no longer needed due to rework of assigning model children - Lachlan
        /*
        let verticies = []; // need to store the 'verticies folder' in an array for it to be iterable in a for loop - cooper
        let arrows = []; // same issue as vertices not being iterable - Lachlan
        */
        


        //Check which folder we're sticking these things into
        if (returnOption === "Vertex Folder"){                  // they had a different spelling for vertex folder :DDDDD - cooper
            //All objects currently on the canvas (excluding things like folders which only exist as tree view elements)
            for(let i = 0; i < currentObjects.flatten().length; i++){
                

                //We onlt want the vertices in this folder
                if (currentObjects.flatten()[i].typeName === "Vertex" && currentObjects.flatten()[i].getRenderKey() === parsedRenderKey){
                    //Set the append the name of the path to include the vertex name
                    if(currentObjects.flatten()[i].title === ""){
                        this.setVertexTreePath("Unnamed Vertex");
                    }

                    else{
                        this.setVertexTreePath(currentObjects.flatten()[i].title);
                    }
                
                


                    //Create the appropriate struct for a tree view element from the vertex data
                    let tempTreeObj = {
                        text: currentObjects.flatten()[i].title,
                        children: [],
                        data: currentObjects.flatten()[i],
                        renderkey: currentObjects.flatten()[i].getRenderKey(),
                        modelkey: currentObjects.flatten()[i].getModelKey(),
                        state: {opened: false}
                    };

                    //So you don't have vertices that are completely blank in the tree, looks kinda weird
                    if (tempTreeObj.text === ""){
                        tempTreeObj.text = "Unnamed Vertex";
                    }
                    
                    //Finally, push to children. Makes it look like the following:
                    //
                    //  Vertex --+
                    //           |
                    //           +-- Unnamed Vertex   
                    
                    VertexChildren.push(tempTreeObj);

                
            }
        }

            return{
                text: "Vertices &#128193",
                children: VertexChildren,
                data: null,
                state: { opened: true },
                type: "Vertex Folder"
            }
        }

        //No longer necessary due to the rework of assigning model children - Lachlan
            /*
            let verticiesObject = { // push the vertex folder into an array of vertex folders - cooper
                text: "Vertices",
                children: VertexChildren,
                data: null,
                state: { opened: true },
                type: "Vertex Folder"
            }
            verticies.push(verticiesObject)
            //vertices folder
            return verticies
                
            
        }
        */

        //same typo as above if statement but for arrows
        else if (returnOption === "Arrow Folder"){ //same thing but arrows folder - Lachlan
            for(let i = 0; i < currentObjects.flatten().length; i++){

                if (currentObjects.flatten()[i].typeName !== "Vertex" && currentObjects.flatten()[i].getRenderKey() === parsedRenderKey){
                    //console.log("arrow key")
                    //console.log(currentObjects.flatten()[i].getModelKey())

                        // Find the source and destination vertex as Keith defined in spec
                        let ourSourceEnd = currentObjects.flatten()[i].pathData[1][1]
                        let ourDestEnd = currentObjects.flatten()[i].pathData[0][1]

                        let textSource = "N/A"
                        let textDest = "N/A"
                        let finalString = "N/A"

                        // Looking through all of the current objects and matching the uuids
                        for (let j = 0; j <currentObjects.flatten().length; j++){
                        
                            let someObject = currentObjects.flatten()[j]
                            
                            if (someObject.typeName === "Vertex"){
                            
                                if (ourSourceEnd === someObject.semanticIdentity.UUID){
                                    
                                    textDest = someObject.title
                                }

                                else if (ourDestEnd === someObject.semanticIdentity.UUID){
                                    
                                    textSource = someObject.title
                                }
                            }
                            
                        }

                        //this array stores whether source/destination is Navigable/Aggregation so we can display the required icons in the tree
                        //array is ordered source nav, dest nav, source agg, dest agg 
                        //if adding more properties, such ass a dotted arrow, just increase array size and adjust the if statements for constructing icon
                        let treeAppearanceSwitches = [false,false,false,false]
                        treeAppearanceSwitches[0] = currentObjects.flatten()[i].getNavigable(0)
                        treeAppearanceSwitches[1] = currentObjects.flatten()[i].getNavigable(1)
                        treeAppearanceSwitches[2] = currentObjects.flatten()[i].getAggregation(0)
                        treeAppearanceSwitches[3] = currentObjects.flatten()[i].getAggregation(1)
                        
                        //unicode icon of the arrow properties/relations we want to display
                        let arrowIcon = "";

                        if(treeAppearanceSwitches[2] === true){
                            arrowIcon = "&#9670"
                            }
                        else if(treeAppearanceSwitches[0] === true){
                            arrowIcon = "&#10229"
                        }

                        arrowIcon += "&#8213"

                        if(treeAppearanceSwitches[3] === true){
                            arrowIcon += "&#9670"
                            }
                        else if(treeAppearanceSwitches[1] === true){
                            arrowIcon += "&#10230"
                        }

                        finalString = textSource + " " + arrowIcon + " " + textDest

                        let tempTreeObj = {
                            text: currentObjects.flatten()[i].typeName + " - " + finalString,
                            children: [],
                            data: currentObjects.flatten()[i],
                            renderkey: currentObjects.flatten()[i].getRenderKey(),
                            modelkey: currentObjects.flatten()[i].getModelKey(),
                            state: {opened: false}
                        };

                        ArrowChildren.push(tempTreeObj);
                    
                    
                }

            }

            console.log(ArrowChildren.length)

            if(ArrowChildren.length === 0){
                return;
            }
            else{
            return {
                text: "Relations ⭲",
                children: ArrowChildren,
                data: null,
                state: { opened: true },
                type: "Arrow Folder"
            }
        }
            
        }
    

        //No longer necessary due to the rework of assigning model children - Lachlan
            /*
            let arrowsObject = { //create the arrows folder as an object to push to the arrows array - Lachlan
                text: "Arrows",
                children: ArrowChildren,
                data: null,
                state: { opened: true },
                type: "Arrow Folder"
            }

            arrows.push(arrowsObject)
            //vertices folder
            return arrows
        }
            */
            
        
        //This down here is for vertex heirarchy stuff, not really needed anymore.
        /*
        if (!traversed) {
            traversedVertices.add(this);
            
            for (let child of this.children) {
                //children.push(child.toTreeViewElement(traversedVertices));
            }
            
        }

        let text = this.vertex.title;

        if (text === null || text === "") {
            text = "Unnamed Vertex";
        }

        return {
            text: text,
            children: children,
            data: this.vertex,
            state: { opened: true }
        };
        */
    }
    
    setTreeViewElement(folderTitle){ //For when you want to make a folder type of element
        let fakeChildren = [];
        return{
            text: folderTitle,
            children: fakeChildren,
            state: {opened: true}
        };
    }

    //this function sets the path of a particular vertex node so that you can 
    //1. Display that item's path in the actual vertex (if you want)
    //2. Show a tree view that only contains the path to a desired vertex 
    setVertexTreePath(treePath){
        this.vertexObjectPath = this.cleanObjectPath + "/" + treePath;
    }

    //Return the vertice's object path
    returnVertexTreePath(){
        return this.vertexObjectPath;
    }

}

class ArrowEdge {
    constructor(flattenedVertexNodes, arrow) {
        this.arrow = arrow;
        this.updateVertices(flattenedVertexNodes);
    }

    updateVertices(flattenedVertexNodes) {
        this.sourceVertexNodeObject = null;
        this.destVertexNodeObject = null;

        if (this.arrow !== null) {
            let isSourceFound = this.arrow.sourceVertexUUID === null;
            let isDestFound = this.arrow.destVertexUUID === null;

            for (let vertexNode of flattenedVertexNodes) {
                if (isSourceFound && isDestFound) {
                    break;
                }

                if (vertexNode !== null) {
                    if (vertexNode.vertex.semanticIdentity.UUID === this.arrow.sourceVertexUUID) {
                        this.sourceVertexNodeObject = vertexNode;
                        isSourceFound = true;

                    } else if (vertexNode.vertex.semanticIdentity.UUID === this.arrow.destVertexUUID) {
                        this.destVertexNodeObject = vertexNode;
                        isDestFound = true;
                    }
                }
            }
        
        }
    }

    set sourceVertexNode(vertexNode) {
        this.sourceVertexNodeObject = vertexNode;

        if (vertexNode !== null) {
            this.arrow.sourceVertexUUID = vertexNode.vertex.semanticIdentity.UUID;
        } else {
            this.arrow.sourceVertexUUID = null;
        }
    }

    get sourceVertexNode() {
        return this.sourceVertexNodeObject;
    }

    get sourceVertex() {
        if (this.sourceVertexNodeObject !== null) {
            return this.sourceVertexNodeObject.vertex;
        } else {
            return null;
        }
    }

    set destVertexNode(vertexNode) {
        this.destVertexNodeObject = vertexNode;

        if (vertexNode !== null) {
            this.arrow.destVertexUUID = vertexNode.vertex.semanticIdentity.UUID;
        } else {
            this.arrow.destVertexUUID = null;
        }
    }

    get destVertexNode() {
        return this.destVertexNodeObject;
    }

    get destVertex() {
        if (this.destVertexNodeObject !== null) {
            return this.destVertexNodeObject.vertex;
        } else {
            return null;
        }
    }
}

//Supply with an array/set of Vertex objects or Arrow objects (NOT ArrowEdge objects)
export class Graph {
    constructor(vertexArrayFlattened, arrowArrayFlattened) {
        this.rootVertices = new Set();
        if (vertexArrayFlattened !== undefined) {
            this.add(vertexArrayFlattened);
        }

        this.arrows = new Set();
        if (arrowArrayFlattened !== undefined) {
            this.add(arrowArrayFlattened);
        }
    }

    add(objects) {
        if (!Array.isArray(objects)) {
            objects = [objects];
        }

        for (let object of objects) {
            switch (object.typeName) {
                case "Vertex":
                    console.log("add vert trigs")
                    this.addVertex(object);               
                    break;
                case "Arrow":
                    this.addArrow(object);
                    break;
                case "VertexNode":
                    this.rootVertices.add(object);
                    break;
                case "ArrowEdge":
                    this.arrows.add(object);
                    break;
                default:
                    console.error("Attempted to add object to unknown type %s to Graph", object.typeName)
                    console.log(object)
                    console.log(object.constructor)
                    break;
            }
        }
    }

    addVertex(vertex) {
        if (this.getVertexNode(vertex) === null) { // if its the original vertex
            vertex.originalUUID = vertex.semanticIdentity.UUID; 
            vertex = new VertexNode(vertex);
            this.rootVertices.add(vertex);
        } else { // else its a copy of the original
            console.log("a copy vertex was attempted")
            
            let newTitle = ":: " + vertex.title
            vertex.title = newTitle
            vertex.originalVertex = false;
            /* For now im going to give the copies their own unique semantic UUID, as a lot of stuff in the program hinges off of vertex items
            having their own unique sID. as a work around i've created a value in the vertex object to store the sID of the original vertex so that
            any functions that require the original UUID of the original vertex can still be used. - cooper*/
            vertex.originalUUID = vertex.semanticIdentity.UUID; 
            let sID = new SemanticIdentity(vertex.title,"","","", undefined ,[]) 
            vertex.semanticIdentity = sID;
            vertex = new VertexNode(vertex);

           
            this.rootVertices.add(vertex);
            console.log(vertex)
        }
    }

    //NOTE: Graph direction is inverted, flowing from the dest to source of arrows
    //This is intentional behaviour of the modelling spec
    addArrow(arrow) {
        if (this.getArrowEdge(arrow) === null) {
            arrow = new ArrowEdge(this.flattenVertexNodes(), arrow);
            this.arrows.add(arrow);

            if (arrow.destVertexNode !== null && arrow.sourceVertexNode !== null) {
                arrow.destVertexNode.add(arrow.sourceVertexNode);

                //If the destination of the arrow is currently a root vertex,
                //search for if the destination has any other possible roots,
                //and remove from the root ONLY IF another root is found
                //This retains an entry point for the graph even if there is a cycle back to root
                if (this.rootVertices.has(arrow.sourceVertexNode)) {
                    let isAnotherRoot = false;

                    for (let vertexNode of this.rootVertices) {
                        if (vertexNode.vertex.semanticIdentity.UUID === arrow.sourceVertex.semanticIdentity.UUID) {
                            continue;
                        }

                        if (vertexNode.has(new Set(), arrow.sourceVertexNode)) {
                            isAnotherRoot = true;
                        }
                    }

                    if (isAnotherRoot) {
                        this.rootVertices.delete(arrow.sourceVertexNode);
                    }
                }
            }

        } else {
            console.error("Attempted to add duplicate arrow");
        }
    }

    //A way of returning the arrow UUID's associated with the deleted vertex. For some reason the source and ending
    //UUID data isn't being saved properly upstream, so this is a way around that.
    ArrowUUIDSource(object){
        object = this.getVertexNode(object);
        //first index is source, second is destination
        let returnArray = [];

        //Match an arrow
        let i = 0;
        for (let arrow of this.arrows) {
            if (arrow.sourceVertexNode !== null && arrow.sourceVertex.semanticIdentity.UUID === object.vertex.semanticIdentity.UUID) {
                returnArray[i] = arrow;
                i += 1;
            }
        }

        return returnArray;
    }

    ArrowUUIDDest(object){
        object = this.getVertexNode(object);
        //first index is source, second is destination
        let returnArray = [];

        //Match an arrow
        let i = 0;
        for (let arrow of this.arrows) {
            if (arrow.destVertexNode !== null && arrow.destVertex.semanticIdentity.UUID === object.vertex.semanticIdentity.UUID) {
                returnArray[i] = arrow;
                i += 1;
            }
        }

        return returnArray;
    }

    //Removes and object while shifting it's children's position in the tree
    remove(object) {
        console.log("remove 2 is called")
        //By this point rootVertices doesnt actually contain the vertex we want to delete which makes the isRemoved Logic hard to follow as has returns true when the item is present- Lachlan
        console.log(this.rootVertices)
        if (object.typeName === "Vertex") {
            let newobject = this.getVertexNode(object);
            let isRemoved = this.rootVertices.has(newobject);
            console.log(isRemoved)


            //Remove from the root
            this.rootVertices.delete(newobject);
            for (let child of newobject.children) {
                this.rootVertices.add(child);
            }
            //console.log("It removes from the root fine")

            
            //Remove from anywhere deeper in the tree
            let traversedVertices = new Set();
            for (let vertexNode of this.rootVertices) {
                if (!traversedVertices.has(vertexNode)) {
                    traversedVertices.add(vertexNode);
                    vertexNode.remove(traversedVertices, newobject);
                    console.log(isRemoved)
                }
            }
            
            if (isRemoved) {
                //Remove the vertex from being the source or dest of any arrow
                for (let arrow of this.arrows) {
                    if (arrow.sourceVertexNode !== null && arrow.sourceVertex.semanticIdentity.UUID === newobject.vertex.semanticIdentity.UUID) {
                        arrow.sourceVertexNode = null;
                    }
                    
                    if (arrow.destVertexNode !== null && arrow.destVertex.semanticIdentity.UUID === newobject.vertex.semanticIdentity.UUID) {
                        arrow.destVertexNode = null;
                    }
                }
            }
            

            return isRemoved;

        } else if (object.typeName === "Arrow") {
            let newobject = this.getArrowEdge(object);

            if (newobject !== null) {
                this.arrows.delete(newobject);
                //IF arrow has a sourceVertex AND destVertex
                if (newobject.sourceVertexNode !== null && newobject.destVertexNode !== null) {
                    //IF there is no other arrow from sourceVertex to destVertex, remove the sourceVertex from the children of destVertex
                    //AND move the sourceVertex to root, if there is no other arrow with the same sourceVertex
                    let isEquivalentArrow = false;
                    let isArrowWithSameSource = false;
                    
                    for (let arrow of this.arrows) {
                        let isEquivalentSource = arrow.sourceVertexNode !== null && arrow.sourceVertex.semanticIdentity.UUID === newobject.sourceVertex.semanticIdentity.UUID;
                        let isEquivalentDest = arrow.destVertexNode !== null && arrow.destVertex.semanticIdentity.UUID === newobject.destVertex.semanticIdentity.UUID;
                        
                        if (isEquivalentSource && isEquivalentDest) {
                            isEquivalentArrow = true;
                        }
                        if (isEquivalentSource && arrow.destVertexNode !== null) {
                            isArrowWithSameSource = true;
                        }
                    }
                    
                    if (!isEquivalentArrow) {
                        newobject.destVertexNode.removeFromChildren(newobject.sourceVertexNode);
                    }
                    if (!isArrowWithSameSource) {
                        this.add(newobject.sourceVertexNode);
                    }

                    //Remove vertex from the root if removing this arrow has resolved a cycle
                    if (newobject.sourceVertexNode.has(new Set(), newobject.destVertexNode)) {
                        this.rootVertices.delete(newobject.destVertexNode);
                    }
                }

                return true;
            }

        } else {
            if (object !== null) {
                console.error("Attempted to remove object of invalid type %s to Graph", object.typeName);
            } else {
                console.error("Attempted to remove null from Graph");
            }
        }

        return false;
    }

    has(object) {
        //Search for object in root vertices
        if (this.rootVertices.has(object)) {
            return true;

        } else {
            let traversedVertices = new Set();

            //Search for object in children of root vertices
            for (let vertex of this.rootVertices) {
                if (!traversedVertices.has(vertex)) {
                    traversedVertices.add(vertex);
                    if (vertex.has(traversedVertices, object)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    getVertexNode(vertex) {
        let traversedVertices = new Set();

        for (let rootNode of this.rootVertices) {
            if (!traversedVertices.has(rootNode)) {
                traversedVertices.add(rootNode);
                if (rootNode.vertex.semanticIdentity.UUID === vertex.semanticIdentity.UUID) {
                    return rootNode;
                } else {
                    let node = rootNode.getVertexNode(traversedVertices, vertex);
                    if (node !== null) {
                        return node;
                    }
                }
            }
        }

        return null;
    }

    getArrowEdge(arrow) {
        for (let arrowEdge of this.arrows) {
            if (arrowEdge.arrow.semanticIdentity.UUID === arrow.semanticIdentity.UUID) {
                return arrowEdge;
            }
        }

        return null;
    }

    flatten(doFlattenVertices = true, doFlattenArrows = true) {
        let verticesSet = new Set();
        let arrowsSet = new Set();

        let traversedVertices = new Set();

        if (doFlattenVertices) {
            for (let vertexNode of this.rootVertices) {
                if (!traversedVertices.has(vertexNode)) {
                    traversedVertices.add(vertexNode);
                    verticesSet.add(vertexNode.vertex);
    
                    if (vertexNode !== null) {
                        for (let child of vertexNode.flatten(traversedVertices)) {
                            verticesSet.add(child);
                        }
                    }
                }
            }
        }
        
        if (doFlattenArrows) {
            for (let arrowEdge of this.arrows) {
                arrowsSet.add(arrowEdge.arrow);
            }
        }

        let flattenedArray = Array.from(verticesSet);
        return flattenedArray.concat(Array.from(arrowsSet));
    }

    flattenVertexNodes() {
        var verticesSet = new Set();
        let traversedVertices = new Set();

        for (let vertexNode of this.rootVertices) {
            if (!traversedVertices.has(vertexNode)) {
                traversedVertices.add(vertexNode);
                verticesSet.add(vertexNode);

                if (vertexNode !== null) {
                    for (let child of vertexNode.flattenVertexNodes(traversedVertices)) {
                        verticesSet.add(child);
                    }
                }
            }
        }

        return Array.from(verticesSet);
    }
}