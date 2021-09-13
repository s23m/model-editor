/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 */

import React from 'react';
import TreeView from 'react-simple-jstree';

import { currentObjects, getModelName, getCurrentRenderKey, setNewRenderKey, getTotalRenderKeys, incrementTotalRenderKeys, currentRenderKey} from "./CanvasDraw";
import { drawAll } from "./CanvasDraw";

//import {currentRenderKey} from './CanvasDraw';

// I need to export this so I can access it in the left menu and then set it to the correct vertex;
export var someVertexPath = "";

let focussed = false; //Decides whether or not to show the normal tree view or a focussed version
let currentlySelectedObject = null; //The currently selected object
let lastSelectedObject = null; // The last selected object

let showingVertPath = false;

// You could probably get away with not including this here, but it just makes it easier to access the tree
// data from any function you like. It still needs to be emptied in the constructor though
let treeData = [[],[],[]];

// I need this to store the folders. Initially, it has one folder simply titled 'Unnamed Folder'.
let folderData = [];

// This is so that when you click on some tree view element you're able to see some clearer data on the 
// the folder ||| REDUNDANT 
let folderObjects = [];

//This sets our first initial unnamed folder
let tempFolderObject = {
    text: "Unnamed Folder",
    children: treeData[0],
    data: folderData[0],
    state: {opened: true},
    type: "Folder",
    renderkey: 0
};

folderData.push(tempFolderObject);

// A function to be called in the left menu to 
// 1. Return the name of the currently selected vertex for displaying purposes and
// 2. Set the 'focussed' keyword to true
export function displayFocussedTreeView(selectedThing){

    if(focussed === true){
        focussed = false;
        return;
    }

    else if (focussed === false){
        focussed = true;
        lastSelectedObject = currentlySelectedObject;
        currentlySelectedObject = selectedThing;
    }
    
}

export function handleAddFolder(folderName){
    //Create a new folder using the known node type
    incrementTotalRenderKeys();
    let tempFolderThing = {
        text: folderName,
        children: [treeData[getTotalRenderKeys()]],
        data: folderData[folderData.length - 1],
        state: {opened: true},
        type: "Folder",
        renderkey: getTotalRenderKeys()
    }
    
    folderData.push(tempFolderThing);

    //console.log("Folder data is :" + folderData[1].text)
    
    /*
   for(let folder in folderData){
       console.log("STATE OF FOLDER ARRAY: " + folder);
    }
    */
    
}

// Function to remove a folder in the tree
export function handleDeleteFolder(folderName){
    for (let i = 0; i < folderData.length; i++){
        if (folderData[i].text === folderName){
            folderData.splice(i,1); 
        }
    }
}

// This is a function to display the path of a given vertex
// It's called in the left menu of a vertex
export function showVertexPath(theObject){

    if (currentObjects.flatten().length > 0){
        currentlySelectedObject = theObject;
        if (showingVertPath === false){
            showingVertPath = true;
            return;
        }
    
        else if (showingVertPath === true){
            showingVertPath = false;
            return;
        }
    }

    //console.log("AND HERE");
    /*
    currentlySelectedObject = theObject;

    let highestLevel = getModelName();
    let nextLevel = "";
    let vertexOrEdge = "";
    let actualObject = "";

    let b = 0;
    //First, we need to actually determine where the vertex is
    //Take a look at our containor
    for (let cont of folderData){
        //Take a look at the children of the containors (arrows and such)                
        for (let treeDat of cont.children){
            //Why is the vertex folder coming up as undefined?????
            if(b === 0){
                //console.log("SECOND LAYER: " + treeDat.children);
                for (let treeElement of treeDat.children){
                    if ((treeElement.text === currentlySelectedObject.title || currentlySelectedObject.title === "Unnamed Vertex")){

                        nextLevel = cont.text;

                        vertexOrEdge = "Vertices";

                        actualObject = currentlySelectedObject.title;
                    }
                }
                b = 1;
            }
            
        }
        
        console.log(highestLevel +"::"+ nextLevel +"::"+ vertexOrEdge +"::"+ actualObject);
    }
    */
}

export class ContainmentTree extends React.Component {

    constructor(props) {
        super();

        treeData = [[],[],[]]; 
        let i = 0;
        
        if (focussed === false){
            for (let vertex of currentObjects.flattenVertexNodes()) { //.rootVertices() <-- original

                let renderIndex = 0;

                //Look at the render key of the object and determine where to put it
                //GET THIS TO WORK WITH THINGS OTHER THAN VERTICES
                if (vertex.vertex.getRenderKey() !== undefined){
                    renderIndex = vertex.vertex.getRenderKey();
                }
                
                
                if (i === 0){

                    //console.log("Object's key: " + vertex.typeName)
                    //The zero here should be renderIndex

                    treeData[renderIndex].push(vertex.toTreeViewElement(new Set(), "vertexFolder"));
                    treeData[renderIndex].push(vertex.toTreeViewElement(new Set(), "arrowFolder"));

                    //You need to make sure you update the folderData stuff after making a change to treeData
                    
                    for (let folder of folderData){
                        if (folder.renderkey === renderIndex){
                            folder.children = treeData[renderIndex];  
                        }

                        //console.log("This is folder: " + folder.text)
                    }
                    
                    //folderData[0].children = treeData;
                    
                    i += 1;
                }
                treeData[renderIndex].push(vertex.toTreeViewElement(new Set()));

                /*
                for (let folder of folderData){
                    folder.children = treeData;
                }
                */
                //folderData[0].children = treeData;
            }
        }

        
        else if (focussed === true){
            let overallContainer = getModelName();
            let container = [];
            let vertOrEdge = [];
            let objName = [];

            let b = 0;
            //First, we need to actually determine where the vertex is
            //Take a look at our containor
            for (let cont of folderData){
                //Take a look at the children of the containors (arrows and such)                
                for (let treeDat of cont.children){
                    //Why is the vertex folder coming up as undefined?????
                    if(b === 0){
                        //console.log("SECOND LAYER: " + treeDat.children);
                        for (let treeElement of treeDat.children){
                            if ((treeElement.text === currentlySelectedObject.title)){

                                //Push the matched container object
                                let CTreeObj = {
                                    text: cont.text,
                                    children: vertOrEdge,
                                    data: null,
                                    state: {opened: true}
                                }
                                container.push(CTreeObj);

                                //Push the proper vertex or edge folder
                                let CVertexObj = {
                                    text: "Vertices",
                                    children: objName,
                                    data: null,
                                    state: {opened: true}
                                }
                                vertOrEdge.push(CVertexObj);

                                //Push the proper tree element object
                                let CElementObj = {
                                    text: currentlySelectedObject.title,
                                    children: [],
                                    data: null,
                                    state: {opened: true}
                                }
                                objName.push(CElementObj);

                            
                            }
                        }
                        b = 1;
                    }
                    
                }
                
                
            }
            
            //Set the tree to show the matched path
            this.state = {
                data: {
                    core: {
                        data: [
                            { text: getModelName(), 
                            children: container, state: { opened: true } },
                        ]
                    }
                },
                selectedVertex: null
            }

        }

        if (focussed === false){
            this.state = {
                data: {
                    core: {
                        data: [
                            { text: getModelName(), 
                            children: folderData, state: { opened: true } },
                        ]
                    }
                },
                selectedVertex: null
            }
        }

        if(showingVertPath === true){

            let highestLevel = getModelName();
            let nextLevel = "";
            let vertexOrEdge = "";
            let actualObject = "";
        
            let b = 0;
            //First, we need to actually determine where the vertex is
            //Take a look at our containor
            for (let cont of folderData){
                //Take a look at the children of the containors (arrows and such)                
                for (let treeDat of cont.children){
                    //Why is the vertex folder coming up as undefined?????
                    if(b === 0){
                        //console.log("SECOND LAYER: " + treeDat.children);
                        for (let treeElement of treeDat.children){
                            if ((treeElement.text === currentlySelectedObject.title || currentlySelectedObject.title === "Unnamed Vertex")){
        
                                nextLevel = cont.text;
        
                                vertexOrEdge = "Vertices";
        
                                actualObject = currentlySelectedObject.title;
                            }
                        }
                        b = 1;
                    }
                    
                }
                someVertexPath = highestLevel +"::"+ nextLevel +"::"+ vertexOrEdge +"::"+ actualObject;
            }
        }

    }

    handleElementSelect(e, data) {

        //If the user selects a folder, switch the current render key to that folder
        if(data.node.data.type == "Folder"){
            console.log("The render key is now" + data.node.data.renderkey);
            setNewRenderKey(data.node.data.renderkey)


        }
        
       //console.log("The data is: " + data.node.data);

        if (data.selected.length === 1 && data.node.data !== null && data.node.data.type === null) {
            let UUID = data.node.data.semanticIdentity.UUID;
            for (let vertex of currentObjects.flatten(true, false)) {
                if (vertex.semanticIdentity.UUID === UUID) {
                    this.setState({
                        selectedVertex: vertex
                    });
                    this.props.setLeftMenu(this.state.selectedVertex);

                    // Set the current render key to whatever object the person has clicked from
                    // the tree view
                    
                    //console.log("The old render key is: " + currentRenderKey);
                    //this.currentRenderKey = this.state.selectedVertex.getRenderKey();
                    //console.log("The new render key is: " + currentRenderKey);
                    

                    //currentRenderKey = 1; 
                    console.log("Render old key is " + getCurrentRenderKey());
                    //setNewRenderKey(this.state.selectedVertex.getRenderKey());
                    console.log("The new render key is : " + getCurrentRenderKey());
                    //currentRenderKey = 1;
                    
                    //console.log("The selected object is: " + this.state.selectedVertex.getRenderKey())
                }
            }
            
        } else {
            this.setState({
                selectedVertex: null
            });
        }
        

        drawAll();
    }



    render() {
        const data = this.state.data;
        
        /*
        if (this.state.selectedObject !== null){
            console.log("The old render key is: " + currentRenderKey);
            currentRenderKey = this.state.selectedObject.getRenderKey();
            console.log("The new render key is: " + currentRenderKey);
        }
        */
        

        return (
            <div>
                <TreeView treeData={data} onChange={(e, data) => this.handleElementSelect(e, data)} />
                <br></br>
            </div>
        )
    }
}