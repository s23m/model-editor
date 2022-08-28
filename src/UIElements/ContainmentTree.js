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
import {VertexNode} from "../DataStructures/Graph.js"
import { ContactsOutlined } from '@material-ui/icons';
import { LeftMenu, LeftMenuType } from './LeftMenu';
import { MainProgramClass } from './MainView';
import { SemanticIdentity } from "../DataStructures/SemanticIdentity.js";
//import { remove,toTreeViewElement } from "../DataStructures/Graph";
//import { ContactsOutlined, Remove } from '@material-ui/icons';


//import {currentRenderKey} from './CanvasDraw';

// I need to export this so I can access it in the left menu and then set it to the correct vertex;
export var someVertexPath = "";

let focussed = false; //leftover from a depricated feature, should always be false until removed fully- Lachlan
let currentlySelectedObject = null; //The currently selected object
//let lastSelectedObject = null; // The last selected object

let showingVertPath = false;

// You could probably get away with not including this here, but it just makes it easier to access the tree
// data from any function you like. It still needs to be emptied in the constructor though
let treeData = [];

// I need this to store the folders. Initially, it has one folder simply titled 'Unnamed Folder'.
export let folderData = [];

// used to store Vertex objects in tree data (Used to create the vertex objects in CanvasDraw/currentObjects)
let vertexData = [];
let decoyVertexData = [] //here because of how old team did folder indexing

//used as a container to seperate "root" folders and subfolders so that only the root folders are pushed to root.children in the constructor - Lachlan
let folderDataRoot = [];

//This variable will be used to store the "selected folder" for creating new folders or models
// As renderKey is tied too many methods related to syncing data between canvas and tree/ creating data in tree control of the current renderkey 
//has been taken away from the user and will always be set to the parent folder of the selected model (this happens in elementSelect on a model click) - Lachlan
let selectedFolderKey = 0;

// This is to do with getting the data indexing to be
let decoyFolderData = [];

// An array for holding model names
export let modelObjects = [];

let decoyModelObjects = []; // doing the same data referencing as folder data because currently the data being referenced in the models is the model beforehand which
                            // i dont tink is intended. - cooper

let folderAltered = false;
let modelAltered = false;
let vertexAltered = false //not sure if I need this? but leaving here for now incase I do need it referenced somewhere since folder andm odels have it -Lachlan

// created a boolean which whill tell the leftmenu that the containment tree needs to update
export var treeNeedsUpdate = 0;



export function setSelectedFolderKey(newKey){
    selectedFolderKey = newKey;
}

export function getSelectedFolderKey(){
    return selectedFolderKey;
}


export function getFolderData(){
    return folderData;
}

export function getVertexData(){
    return vertexData;
}

//returns a concated array of the folders and vertex(containers)
export function getContainerData(){
    return folderData.concat(vertexData);
}

export function setFolderData(newFolderData){
    folderData = newFolderData;
}

export function getModelData(){
    return modelObjects;
}

//This function is used to load the first available model and canvas from the modelObjects array
//Used to fix thye tree/canvas desync bug when deleting - Lachlan
function loadFirstModel(){
    //set selected model/render key to the 1st available as so a canvas isnt loaded for a nonexistant model
    setNewRenderKey(modelObjects[0].data.renderKey)
    setNewModel(modelObjects[0].data.modelKey)
    setSelectedFolderKey(modelObjects[0].data.renderKey)

    //taken from handleElementSelect for loading the new models canvas
    for (let item of currentObjects.flatten()){
        if (item.typeName === "Vertex" && item.getModelKey() === getCurrentModel()){
            item.setPresent();
        }
        else if (item.getModelKey() !== getCurrentModel() && item.typeName === "Vertex"){
            item.setAway();
        }
    }
    drawAll()
    document.getElementById("SelectedFolder").value = getContainerData().find(folder => { return folder.renderKey === getSelectedFolderKey()}).text
    document.getElementById("SelectedContainer").value = getContainerData().find(folder => { return folder.renderKey === getCurrentRenderKey()}).text
    document.getElementById("SelectedModel").value = modelObjects.find(model => { return model.modelKey === getCurrentModel()}).text
}


//parent key is for dictating subfolders where 0 is root, else pKey is a folder renderKey - Lachlan
export function handleAddFolder(folderName, parentKey = 0){
    //Create a new folder using the known node type

    incrementTotalRenderKeys();

    let tempFolderThing = {
        text: folderName + " 📁", //If icon is changed, youll have to change the folder icon in context menu too
        children: treeData[getTotalRenderKeys()],
        data: NaN,
        state: {opened: true},
        type: "Folder",
        renderKey: getTotalRenderKeys(),
        parentRenderKey: parentKey
    }

    decoyFolderData.push(tempFolderThing)

    let folderThing2 = {
        text: folderName + " 📁", //If icon is changed, youll have to change the folder icon in context menu too
        children: treeData[getTotalRenderKeys()],
        data: decoyFolderData[folderData.length],
        state: {opened: true},
        type: "Folder",
        renderKey: getTotalRenderKeys(),
        parentRenderKey: parentKey
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
    console.log("below is the selected render key")
    console.log(selectedRenderKey)
    if(folderData.length > 1){ //cannot delete folder if it is the only one excluding root - Lachlan
        for (let i = 0; i < folderData.length; i++){
            if (folderData[i].renderKey === selectedRenderKey){
                console.log("below is folderdata")
                console.log(folderData)
                deleteFolderChildren(folderData[i]);
                decoyFolderData.splice(i,1); // have to delete from this array as well because this is where folders obtain the data of themselves 
                folderData.splice(i,1); 
            }
        }
    
    folderAltered = true;
    }
    else{console.log("Cannot delete only folder")}
    
    loadFirstModel()
}

function deleteFolderChildren(selectedFolder){ // function for deleting all the children of a folder.
    let folderChildren = selectedFolder.children;
    for (let i = 0; i < folderChildren.length; i++){
        if (folderChildren.type === "Folder"){
            let selectedRenderKey = folderChildren[i].renderKey;
            handleDeleteFolder(selectedRenderKey);

        }
        else if (folderChildren.type === "Model"){
            let selectedModelKey = folderChildren[i].modelKey;
            handleDeleteModel(selectedModelKey);
        }
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


export function handleRenameFolder(newName,rKey){
    if(newName !== ""){
        for (let i = 0; i < folderData.length; i++){
            if (folderData[i].renderKey === rKey){
                folderData[i].text = newName + " 📁";
                break;
            }
        }
    }
    else{
        console.log("Cannot have empty name")
    }
}

export function handleAddVertex(vertexName, parentKey = 0){
    //Create a new folder using the known node type

    incrementTotalRenderKeys();

    let tempVertexThing = {
        text: vertexName + " 🟧", //If icon is changed, youll have to change the folder icon in context menu too
        children: treeData[getTotalRenderKeys()],
        data: NaN,
        state: {opened: true},
        type: "treeVertex",
        renderKey: getTotalRenderKeys(),
        parentRenderKey: parentKey,
        content: "",
        colour: "#FFD5A9",
        icons: [[],[],[]],
        imageElements: {},
        fontSize: 12
    }

    decoyVertexData.push(tempVertexThing)

    let vertexThing2 = {
        text: vertexName + " 🟧", //If icon is changed, youll have to change the folder icon in context menu too
        children: treeData[getTotalRenderKeys()],
        data: decoyVertexData[vertexData.length],
        state: {opened: true},
        type: "treeVertex",
        renderKey: getTotalRenderKeys(),
        parentRenderKey: parentKey,
        content: "",
        colour: "#FFD5A9",
        icons: [[],[],[]],
        imageElements: {},
        fontSize: 12
    }
    

    vertexData.push(vertexThing2);
    console.log(vertexData)

    vertexAltered = true;
    
}



// Added optional parameter render key, atm used to handle create a model with no folder selected - Lachlan
//initial "children" are to prevent erros caused by children initialy not being iterable - Lachlan
export function handleAddModel(modelName, rKey=getSelectedFolderKey(), semanticID=undefined){
    incrementTotalModels();
    let sID = undefined;
    let icon = " 📈"; //If icon is changed, youll have to change toe folder icon in context menu too
    
    if (semanticID !== undefined){
        sID = semanticID;
        icon = " ⛶"; //If icon is changed, youll have to change toe folder icon in context menu too
    } else {
        sID = new SemanticIdentity(modelName,"","","", undefined ,[]);
    }
    
    let decoyModelThing = {
        text: modelName + icon,
        children: [],
        data: NaN,
        state: {opened: true},
        type: "Model",
        renderKey: rKey,
        modelKey: getTotalModels(),
        semanticIdentity: sID
    }
    decoyModelObjects.push(decoyModelThing);


    let tempModelThing = {
        text: modelName + icon,
        children: [],
        data: decoyModelObjects[modelObjects.length],
        state: {opened: true},
        type: "Model",
        renderKey: rKey,
        modelKey: getTotalModels(),
        semanticIdentity: sID
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

    loadFirstModel()
}

export function handleRenameModel(newName,mKey){
    for (let i = 0; i < modelObjects.length; i++){
        if (modelObjects[i].modelKey === mKey){
            modelObjects[i].text = newName + " 📈";
            break;
        }
    }
}


export function getModelRenderKey(selectedModelKey){ // this function is to fetch the renderkey of the selected model to ensure verticies get created with the correct renderkey -- cooper
    for(let i = 0; i < modelObjects.length; i++){
        if (modelObjects[i].modelKey === selectedModelKey){
            return modelObjects[i].renderKey
        }
    }
}

//Function for changing the parent folder of a model - Lachlan
export function handleModelRebase(mKey,newRkey){
    console.log("Rebase test")
    console.log(modelObjects)
    for(let model of modelObjects){
        if(model.modelKey === mKey){
           for(let objectFolders of model.children){  
                let objects = objectFolders.children
                for(let object of objects){
                    object.renderkey = newRkey;
                    if(object.data.typeName === "Vertex"){
                    object.data.vertexRenderKey = newRkey;
                    }
                    else{
                    object.data.arrowRenderKey = newRkey;
                    }
                }
            } 
            console.log(model)
            model.renderKey = newRkey;
            console.log(model)
        }
    }
    console.log(modelObjects)
    treeNeedsUpdate = 1;
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

//function used for determineing which folders are owned by a higher folder - Lachlan
function determineSubFolders(parsedRenderKey){
    let returnArray = []
    for (let folder of getContainerData()){
        if(folder.parentRenderKey === parsedRenderKey)
        returnArray.push(folder)
    }
    //console.log("subfolder return")
    //console.log(returnArray)
    return returnArray
}

export function getModelNameFromKey(key){
    let model = modelObjects.find(model => model.modelKey === key)
    return model.text
}



let initialFolderAdded = false;
export class ContainmentTree extends React.Component {

    componentDidMount() {
        
    }
    componentDidUpdate(){}
    
    componentWillUnmount() {
        
    }
    

    constructor(props) {
        super(props);

        treeData = []; 
        //let i = 0;
        //console.log("props")
        //console.log(props)
        

        
        if (initialFolderAdded === false){
            setNewRenderKey(1);
            setNewModel(1);
            setSelectedFolderKey(1);
            handleAddFolder("Folder");
            //The initial folder has render key 1, the initial model needs this to be specified as nothing is selected
            handleAddModel("Model",1) 
            initialFolderAdded = true;
            handleAddFolder("Subfolder",getCurrentRenderKey())
            handleAddVertex("new Vertex",getCurrentRenderKey())
        }
        

            // Push the model objects in. --- I moved the position of these for loops outside of the vertex for loop as it was creating a few problems - cooper
        for (let model of modelObjects){
            treeData.push(model);           
            
        }
        for (let folder of getContainerData()){ // this for loop is to define the ownership of the models - cooper
                //folder.children = determineOwnership(folder.renderKey)  
                //folder.children = determineSubFolders(folder.renderKey)
                let canvasItems = determineOwnership(folder.renderKey) 
                let subFolderItems = determineSubFolders(folder.renderKey)
                let combinedItems = canvasItems.concat(subFolderItems)
                //console.log("test")
                //console.log("treedata");
                //console.log(treeData);
                //console.log(combinedItems)
                folder.children = combinedItems;

            }
            console.log(getContainerData())
               // treeData.push(vertex.toTreeViewElement(new Set())); --- not too sure what the point of this .push was - cooper   
            
        for (let folder of getContainerData()){ // this for loop is to define the ownership of the vertices & arrows - cooper
            let vertex = new VertexNode() 
            
            //Disableing canvas vertex's appearing in treeview - Lachlan
            /*
            if (vertex.toTreeViewElement("Vertex Folder", folder.renderKey) !== undefined){ // modelkey is redundant now for storing things in treeview 
                //console.log("a vertexorarrow: ",vertex)                                                                           // as things need to be stored under the folder - cooper
                folder.children.push(vertex.toTreeViewElement("Vertex Folder", folder.renderKey))
            }
            */

            if (vertex.toTreeViewElement("Arrow Folder", folder.renderKey) !== undefined){
                 //console.log("a vertexorarrow: ",vertex)
                folder.children.push(vertex.toTreeViewElement("Arrow Folder", folder.renderKey))
            }  
            
        }

        folderDataRoot = [];
        for (let folder of getContainerData()){
            if(folder.parentRenderKey ===0){
                folderDataRoot.push(folder)
            }

        }



            
            
            //console.log(currentObjects);
            //console.log(treeData);
            //console.log(currentObjects.flatten())
        

        
        
        this.state = {
            data: {
                core: {
                    data: [
                        { text: getModelName(), 
                        children: folderDataRoot, state: { opened: true }, 
                        root: true},
                    ]
                }
            },
            selectedVertex: null
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
            for (let cont of getContainerData()){
                console.log("below is folderData")
                console.log(getContainerData())
                //console.log("This is active test ". cont)
                //console.log("folder text: " + cont.text)
                //Take a look at the children of the containers (arrows and such)
                for (let treeDat of cont.children){
                    console.log("below is treeDat")
                    console.log(treeDat)
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


    //Function called when an object in treeview is clicked
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
            //console.log(folderData);
            console.log(data.node.data)

            

            if(data.node.type === "Vertex Folder"){
                //console.log("You clicked a vertex folder")
            }

            else if(data.node.data.type === "Folder" || data.node.data.type === "treeVertex" ){
                //console.log("Clicked Folder: " + data.node.data.text)
                //setNewRenderKey(data.node.data.renderKey)
                setSelectedFolderKey(data.node.data.renderKey)
                

                //console.log("The render key is now " + data.node.data.renderKey);


            }

            else if (data.node.data.type === "Model"){
                //console.log("The selected model is: " + data.node.data.text)
                //console.log("The current folder is: " + data.node.data.renderKey)
                setNewModel(data.node.data.modelKey);
                //console.log("The model key is now " + getCurrentModel()); // there were issues here with camelCasing causing no modelKey to be selected- cooper
                //setNewRenderKey(data.node.data.renderKey)
                setNewRenderKey(data.node.data.renderKey); // automatically sets the renderkey to be the same as the models as this was causing issues - cooper
                setSelectedFolderKey(data.node.data.renderKey)
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

                        //The following is required to change canvas to the selected vertex's model preventing desync issues of tree and canvas - Lachlan
                    
                        setNewRenderKey(vertex.vertexRenderKey);
                        setNewModel(vertex.vertexModelKey); 
                        setSelectedFolderKey(vertex.vertexRenderKey)
                        
                        for (let item of currentObjects.flatten()){
                            if (item.typeName === "Vertex" && item.getModelKey() === getCurrentModel()){
                                item.setPresent();
                            }
                            else if (item.getModelKey() !== getCurrentModel() && item.typeName === "Vertex"){
                                item.setAway();
                            }
                        }
                    

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

        //If the user clicks the root folder       -Lachlan
        try{
            if(data.node.original.root === true){
                //console.log("This is root")
                setSelectedFolderKey(0) //renderkey 0 will be used for root
            }
        }
        catch(e){
            //console.log("This is not root")
        }

        //used to update the currently selected model/folders fields - Lachlan
        if(getSelectedFolderKey() === 0){
            document.getElementById("SelectedFolder").value = "Root"
        }
        else{
        document.getElementById("SelectedFolder").value = getContainerData().find(folder => { return folder.renderKey === getSelectedFolderKey()}).text
        }
        document.getElementById("SelectedContainer").value = getContainerData().find(folder => { return folder.renderKey === getCurrentRenderKey()}).text
        document.getElementById("SelectedModel").value = modelObjects.find(model => { return model.modelKey === getCurrentModel()}).text
        //console.log(modelObjects)

    }

    handleContextMenu(){
        console.log("CM triggered for tree")
    }



    render() {
        const data = this.state.data;
        console.log(treeData)
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
                <TreeView treeData={data} onChange={(e, data) => this.handleElementSelect(e, data)} className="treeview" draggable="true" />

            </div>
        )
    }
}