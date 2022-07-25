/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 */

import React from 'react';
import TreeView from 'react-simple-jstree';




import { currentObjects, getModelName, getCurrentRenderKey, setNewRenderKey, 
    getTotalRenderKeys, incrementTotalRenderKeys, 
    getCurrentModel, setNewModel, getTotalModels, incrementTotalModels, decreaseTotalModels, decreaseTotalRenderKeys, deleteElement} from "./CanvasDraw";

import { drawAll } from "./CanvasDraw";
//import { remove,toTreeViewElement } from "../DataStructures/Graph";
//import { ContactsOutlined, Remove } from '@material-ui/icons';


//import {currentRenderKey} from './CanvasDraw';

// I need to export this so I can access it in the left menu and then set it to the correct vertex;
export var someVertexPath = "";

let focussed = false; //Decides whether or not to show the normal tree view or a focussed version
let currentlySelectedObject = null; //The currently selected object
//let lastSelectedObject = null; // The last selected object

let showingVertPath = false;

// You could probably get away with not including this here, but it just makes it easier to access the tree
// data from any function you like. It still needs to be emptied in the constructor though
let treeData = [];

// I need this to store the folders. Initially, it has one folder simply titled 'Unnamed Folder'.
let folderData = [];

// This is to do with getting the data indexing to be
let decoyFolderData = [];



// An array for holding model names
let modelObjects = [];
let decoyModelObjects = []; // doing the same data referencing as folder data because currently the data being referenced in the models is the model beforehand which
                            // i dont tink is intended. - cooper
// A function to be called in the left menu to 
// 1. Return the name of the currently selected vertex for displaying purposes and
// 2. Set the 'focussed' keyword to true
export function displayFocussedTreeView(selectedThing){

    if(focussed === true){
        focussed = false;
    }

    else if (focussed === false){
        focussed = true;
        //lastSelectedObject = currentlySelectedObject;
        currentlySelectedObject = selectedThing;
    }
    
}

/** 
function render_on_add_folder_or_container() {
    const data = this.state.data;
    
    return (
        <div>
            <TreeView treeData={data} onChange={(e, data) => this.handleElementSelect(e, data)} />
            <br></br>
        </div>
    )
}
*/

let folderAltered = false;
let modelAltered = false;



export function handleAddFolder(folderName){
    //Create a new folder using the known node type

    incrementTotalRenderKeys();

    let tempFolderThing = {
        text: folderName + " &#128193",
        children: treeData[getTotalRenderKeys()],
        data: NaN,
        state: {opened: true},
        type: "Folder",
        renderKey: getTotalRenderKeys()
    }

    decoyFolderData.push(tempFolderThing)

    let folderThing2 = {
        text: folderName + " &#128193",
        children: treeData[getTotalRenderKeys()],
        data: decoyFolderData[folderData.length],
        state: {opened: true},
        type: "Folder",
        renderKey: getTotalRenderKeys()
    }
    
    //console.log("theActualData: " + folderData.length)
    folderData.push(folderThing2);
    //console.log("Folder data apparent: " + folderData[folderData.length-1].data)
    //console.log(folderData)
    //console.log(folderThing2.renderKey)

    folderAltered = true;
    
}

// Function to remove a folder in the tree
export function handleDeleteFolder(selectedRenderKey){ // changing the deleting functions to delete based on renderkey & modelkeys - cooper
    if(folderData.length > 1){ //cannot delete folder if it is the only one excluding root - Lachlan
        for (let i = 0; i < folderData.length; i++){
            if (folderData[i].renderKey === selectedRenderKey){
                deleteFolderChildren(folderData[i]);
                decoyFolderData.splice(i,1); // have to delete from this array as well because this is where folders obtain the data of themselves 
                folderData.splice(i,1); 
            }
        }
    
    folderAltered = true;
    }
    else{console.log("Cannot delete only folder")}
    
}

function deleteFolderChildren(selectedFolder){ // function for deleting all the children of a folder.
    let folderChildren = selectedFolder.children;
    for (let i = 0; i < folderChildren.length; i++){
         let selectedModelKey = folderChildren[i].modelKey;
         handleDeleteModel(selectedModelKey);
    }
}

function deleteModelChildren(selectedModel){ // function for deleting all the children of the model.
    if(selectedModel.children.length > 0){
        let verticesFolder = selectedModel.children;
        for (let i = 0; i < verticesFolder.length; i++){ // had to make a nested for loop due to the encompassing 'vertices' folder
            let vertices = verticesFolder[i].children;
            for (let v = 0; v < vertices.length; v++){
                if (vertices[v].modelkey === selectedModel.modelKey){
                    let chosenObject = vertices[v].data
                    deleteElement(chosenObject);
                }
            }    
        }
    }   
}
// Added optional parameter render key, atm used to handle create a model with no folder selected - Lachlan
//initial "children" are to prevent erros caused by children initialy not being iterable - Lachlan
export function handleAddModel(modelName, rKey=getCurrentRenderKey()){
    incrementTotalModels();
    let decoyModelThing = {
        text: modelName + " &#128200",
        children: ["Vertices &#128193","Arrows &#128193"],
        data: NaN,
        state: {opened: true},
        type: "Model",
        renderKey: rKey,
        modelKey: getTotalModels()
    }
    decoyModelObjects.push(decoyModelThing);


    let tempModelThing = {
        text: modelName + " &#128200",
        children: ["Vertices &#128193","Arrows &#128193"],
        data: decoyModelObjects[modelObjects.length],
        state: {opened: true},
        type: "Model",
        renderKey: rKey,
        modelKey: getTotalModels()
    };
 
    modelObjects.push(tempModelThing);
    console.log(modelObjects)

    modelAltered = true;


}

export function handleDeleteModel(selectedModelKey){

    for (let i = 0; i < modelObjects.length; i++){
        if (modelObjects[i].modelKey === selectedModelKey){
            console.log("model deleted below")
            console.log(modelObjects[i])
            deleteModelChildren(modelObjects[i]);
            modelObjects.splice(i, 1);
            decoyModelObjects.splice(i, 1);
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

        }
    
        else if (showingVertPath === true){
            showingVertPath = false;

        }
    }

}

// This function is used to determine which object should be owned by which folder object.
// Works by taking a look at the children of the treeData array and seeing if their render 
// key matches the one parsed to the function
function determineOwnership(parsedRenderKey){
    let returnArray = []
    let i = 0
    for (let vertexOrArrow of treeData){
        if(vertexOrArrow !== undefined){
            //console.log("treeData object name: " + vertexOrArrow.text)

            if (vertexOrArrow.type === "Model"){
                if (vertexOrArrow.renderKey === parsedRenderKey){
                    returnArray.push(treeData[i])
                }
                
            }
/*
            for (let child of vertexOrArrow.children){
                // Check if the render key of the child matches 
                if (child.renderKey === parsedRenderKey){
                    //console.log("Matched tree data: " + treeData[i])
                    returnArray.push(treeData[i])
                    break
                }
            }
            */
        }
        i += 1
    }

    return returnArray
}

let initialFolderAdded = false;
export class ContainmentTree extends React.Component {

    constructor(props) {
        super(props);

        treeData = []; 
        //let i = 0;
        
        if (initialFolderAdded === false){
            setNewRenderKey(1);
            setNewModel(1);
            handleAddFolder("This is an initial container");
            //The initial folder has render key 1, the initial model needs this to be specified as nothing is selected
            handleAddModel("This is an initial model",1) 
            initialFolderAdded = true;
        }
        
        if (focussed === false){

              // Push the model objects in. --- I moved the position of these for loops outside of the vertex for loop as it was creating a few problems - cooper
            for (let model of modelObjects){
                treeData.push(model);           
                
            }
            for (let folder of folderData){ // this for loop is to define the ownership of the models - cooper
                for (let folder of folderData){
                    folder.children = determineOwnership(folder.renderKey)   
                }
                   // treeData.push(vertex.toTreeViewElement(new Set())); --- not too sure what the point of this .push was - cooper   
                }
            for (let folder of folderData){ // this for loop is to define the ownership of the vertices & arrows - cooper
                for (let model of treeData){

                    for (let vertex of currentObjects.flattenVertexNodes()){

                        //Reverted the graph fix for the iteration problem caused by directly assigning model children as manually assigning the vertex folder 
                        //to index 0 and the arrow folder to index 1 (creating an interable by default) fixes this issue and prevents the folders overwriting eachother - Lachlan
                        //removed alot of the weird renames and unnesecary logic and changed it so that multiples vert/arrow folders can exist in a parent folder ie. one set per model 
                        //and that verts/arrows are added only where they share a matching modelkey - Lachlan

                        if (vertex.toTreeViewElement("Vertex Folder", folder.renderKey, model.modelKey) !== undefined && model.renderKey === folder.renderKey){
                        //console.log("a vertexorarrow: ",vertex)
                            model.children[0] = vertex.toTreeViewElement("Vertex Folder", folder.renderKey, model.modelKey)

                        }

                        if (vertex.toTreeViewElement("Arrow Folder", folder.renderKey, model.modelKey) !== undefined && model.renderKey === folder.renderKey){
                             //console.log("a vertexorarrow: ",vertex)
                            model.children[1] = vertex.toTreeViewElement("Arrow Folder", folder.renderKey, model.modelKey)
                        }
                            
                        //console.log(model.text," children: ",model.children)
                        break; //break exists as for loop is leftover and useless but we need the "vertex" object to be able to call toTreeviewElement and currentObjects isnt always indexable
                    }
                }


            }



            
            
            //console.log(currentObjects);
            //console.log(treeData);
            //console.log(currentObjects.flatten())
        }

        
        else if (focussed === true){
            //let overallContainer = getModelName();
            let container = [];
            let vertOrEdge = [];
            let objName = [];

            let b = 0;
            //First, we need to actually determine where the vertex is
            //Take a look at our container
            for (let cont of folderData){
                //console.log("folder text: " + cont.text)
                //Take a look at the children of the containers (arrows and such)
                for (let treeDat of cont.children){
                    //console.log("treeDat text: " + treeDat.text)
                    //Why is the vertex folder coming up as undefined?????
                    //console.log(treeDat.children)
                    if(b === 0){
                        //console.log("SECOND LAYER: " + treeDat.children);
                        for (let treeElement of treeDat.children){
                            //console.log("Vertices text: " + treeElement)
                            if ((treeElement.text === currentlySelectedObject.title)){
                                
                                //console.log("A match was had")
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
                                    text: "Vertices " ,
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

                                b = 1;

                            
                            }
                        }
                        
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
            /*
            let highestLevel = getModelName();
            let nextLevel = "";
            let vertexOrEdge = "";
            let actualObject = "";
        
            let b = 0;
            //First, we need to actually determine where the vertex is
            //Take a look at our container
            for (let cont of folderData){
                //Take a look at the children of the containers (arrows and such)
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
            */

            let highestLevel = getModelName();
            let nextLevel = "";
            let vertexOrEdge = "";
            let actualObject = "";

            let b = 0;
            //First, we need to actually determine where the vertex is
            //Take a look at our container
            for (let cont of folderData){
                //console.log("This is active test ". cont)
                //console.log("folder text: " + cont.text)
                //Take a look at the children of the containers (arrows and such)
                for (let treeDat of cont.children){
                    //console.log("treeDat text: " + treeDat.text) 
                    //console.log("num of rkeys is:", getTotalRenderKeys())
                    //console.log(folderData)
                    //Why is the vertex folder coming up as undefined?????
                    //console.log(cont.children)
                    if(b === 0){
                        //console.log("SECOND LAYER: " + treeDat.children);
                        for (let treeElement of treeDat.children){
                            //console.log("Vertices text: " + treeElement)
                                if ((treeElement.text === currentlySelectedObject.title)){
                                    
                                    nextLevel = cont.text;
                                    
                                    vertexOrEdge = "Vertices"
                                    
                                    actualObject = currentlySelectedObject.title

                                    someVertexPath = highestLevel +"::"+ nextLevel +"::"+ vertexOrEdge +"::"+ actualObject;
                                    b = 1;

                                
                                }

                        }
                        
                    }
                    
                }
                
            }
        }

        if (folderAltered === true){

           // this.forceUpdate()

            folderAltered = false
        }

    }



    handleElementSelect(e, data) {

        //console.log("Selected Length: " + data.selected.length)

        // Try catch used to catch error whe selecting a treeview item with no data type eg. root
        
        try{
            //console.log("Selected Data 1: " + data.node.data)
            //console.log("Selected type 1: " + data.node.original.type)
            //console.log("Selected text 1: " + data.node.text)
            //console.log(data.node)
            //console.log("Selected Type 2: " + data.node.data.type)
            //console.log("Selected Name 2: " + data.node.data.text)
            console.log(folderData);
            console.log(modelObjects);
            

            if(data.node.type === "Vertex Folder"){
                //console.log("You clicked a vertex folder")
            }

            else if(data.node.data.type === "Folder"){
                //console.log("Clicked Folder: " + data.node.data.text)
                setNewRenderKey(data.node.data.renderKey)
                //console.log("The render key is now " + data.node.data.renderKey);


            }

            else if (data.node.data.type === "Model"){
                //console.log("The selected model is: " + data.node.data.text)
                //console.log("The current folder is: " + data.node.data.renderKey)
                setNewModel(data.node.data.modelKey);
                //console.log("The model key is now " + getCurrentModel()); // there were issues here with camelCasing causing no modelKey to be selected- cooper
                //setNewRenderKey(data.node.data.renderKey)
                setNewRenderKey(data.node.data.renderKey); // automatically sets the renderkey to be the same as the models as this was causing issues - cooper
                //console.log("The render key is now " + data.node.data.renderKey);
                // Move everything away
                for (let item of currentObjects.flatten()){
                    if (item.typeName === "Vertex" && item.getModelKey() === getCurrentModel()){
                        //console.log("Item is set as present")
                        item.setPresent();
                    }

                    else if (item.getModelKey() !== getCurrentModel() && item.typeName === "Vertex"){
                        //console.log("Item is sent away")
                        item.setAway();
                        //console.log("The item to not be rendered is" + item.typeName);
                    }
                }
            }
            
        //console.log("The data is: " + data.node.data);

            else if (data.selected.length === 1 && data.node.data !== null && data.node.data.type === undefined) {
                let UUID = data.node.data.semanticIdentity.UUID;
                //console.log("UUID: " + UUID)
                for (let vertex of currentObjects.flatten()) {
                    if (vertex.semanticIdentity.UUID === UUID) {
                        //setNewRenderKey(vertex.getRenderKey())
                        //setNewModel(vertex.getModelKey())
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
                        //console.log("Render old key is " + getCurrentRenderKey());
                        //setNewRenderKey(this.state.selectedVertex.getRenderKey());
                        //console.log("The new render key is : " + getCurrentRenderKey());
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
        catch(e){
            //console.log(e instanceof TypeError)
            //console.log("If True,a null type error has been caught, If the selected object should be selectable, this is an issue")
        }

        //used to update the currently selected model/folders fields - Lachlan
        document.getElementById("SelectedContainer").value = folderData.find(folder => { return folder.renderKey === getCurrentRenderKey()}).text
        document.getElementById("SelectedModel").value = modelObjects.find(model => { return model.modelKey === getCurrentModel()}).text
        //console.log(modelObjects)

    }



    render() {
        const data = this.state.data;
        //console.log(data)
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

            </div>
        )
    }
}