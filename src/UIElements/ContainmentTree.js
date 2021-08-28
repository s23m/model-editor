/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 */

import React from 'react';
import TreeView from 'react-simple-jstree';

import { currentObjects, getModelName } from "./CanvasDraw";
import { drawAll } from "./CanvasDraw";

let focussed = false; //Decides whether or not to show the normal tree view or a focussed version
let currentlySelectedObject = null;
let lastSelectedObject = null;

// You could probably get away with not including this here, but it just makes it easier to access the tree
// data from any function you like. It still needs to be emptied in the constructor though
let treeData = [];

// I need this to store the folders. Initially, it has one folder simply titled 'Unnamed Folder'.
let folderData = [];

//This sets our first initial unnamed folder
let tempFolderObject = {
    text: "Unnamed Folder",
    children: treeData,
    data: null,
    state: {opened: true}
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
    
    let tempFolderThing = {
        text: folderName,
        children: [],
        data: null,
        state: {opened: true}
    }
    
    folderData.push(tempFolderThing);
    
    /*
   for(let folder in folderData){
       console.log("STATE OF FOLDER ARRAY: " + folder);
    }
    */
    
}

export class ContainmentTree extends React.Component {

    constructor(props) {
        super();

        treeData = []; 
        let i = 0;
        
        if (focussed === false){
            for (let vertex of currentObjects.flattenVertexNodes()) { //.rootVertices() <-- original
                
                if (i === 0){
                    treeData.push(vertex.toTreeViewElement(new Set(), "vertexFolder"));
                    treeData.push(vertex.toTreeViewElement(new Set(), "arrowFolder"));

                    //You need to make sure you update the folderData stuff after making a change to treeData
                    //folderData.forEach(thing => thing.children = treeData);
                    /*
                    for (let folder of folderData){
                        folder.children = treeData;
                        console.log("STATE OF FOLDER ARRAY: " + folder);
                    }
                    */
                   folderData[0].children = treeData;
                    
                    i += 1;
                }
                treeData.push(vertex.toTreeViewElement(new Set()));

                /*
                for (let folder of folderData){
                    folder.children = treeData;
                }
                */
                folderData[0].children = treeData;
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
                            if ((treeElement.text === currentlySelectedObject.title || currentlySelectedObject.title == "Unnamed Vertex")){

                                console.log("HERE: " + cont.text + " " + treeDat.text + " " + treeElement.text);
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

                                console.log('THE FOUND PATH IS: ' + CTreeObj.text + CVertexObj.text + CElementObj.text);

                                //console.log(container + " " + vertOrEdge + " " + objName);
                            }
                        }
                        b = 1;
                    }


                    
                    
                    ///for (let objects of treeDat.children){
                    ///    console.log('YA HERE' + objects);
                    ///}
                    
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

            /*
            for (let vertex of currentObjects.flattenVertexNodes()){
                //Look for our title of interest      
                treeData = [];
                //
                if (currentlySelectedObject.typeName === "Vertex"){
                    treeData.push(vertex.focusTreeViewElement(new Set(), currentlySelectedObject.title));
                }

                else{
                    treeData.push(vertex.focusTreeViewElement(new Set(), currentlySelectedObject.semanticIdentity.UUID));
                }
                
            }
            */
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

    }

    handleElementSelect(e, data) {
        if (data.selected.length === 1 && data.node.data !== null) {
            let UUID = data.node.data.semanticIdentity.UUID;
            for (let vertex of currentObjects.flatten(true, false)) {
                if (vertex.semanticIdentity.UUID === UUID) {
                    this.setState({
                        selectedVertex: vertex
                    });
                    this.props.setLeftMenu(this.state.selectedVertex);
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

        return (
            <div>
                <TreeView treeData={data} onChange={(e, data) => this.handleElementSelect(e, data)} />
                <br></br>
            </div>
        )
    }
}