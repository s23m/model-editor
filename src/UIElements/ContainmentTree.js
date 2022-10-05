/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 */

import React from 'react';
import TreeView from 'react-simple-jstree';

import { currentObjects, setNewRenderKey, 
    getTotalRenderKeys, incrementTotalRenderKeys, 
    getCurrentModel, setNewModel, getTotalModels, incrementTotalModels, deleteElement} from "./CanvasDraw";

import { drawAll } from "./CanvasDraw";
import {VertexNode} from "../DataStructures/Graph.js"
import { SemanticIdentity } from "../DataStructures/SemanticIdentity.js";
import { createSaveState } from '../Serialisation/NewFileManager';

// I need to export this so I can access it in the left menu and then set it to the correct vertex;
export var someVertexPath = "";

let currentlySelectedObject = null; //The currently selected object

let showingVertPath = false;

// Accesor for tree data
let treeData = [];

// I need this to store the folders. Initially, it has one folder simply titled 'Unnamed Folder'.
export let folderData = [];

// used to store Vertex objects in tree data (Used to create the vertex objects in CanvasDraw/currentObjects)
export let vertexData = [];
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


// created a boolean which whill tell the leftmenu that the containment tree needs to update
export var treeNeedsUpdate = 0;



export function setSelectedFolderKey(newKey){
    selectedFolderKey = newKey;
}

export function getSelectedFolderKey(){
    return selectedFolderKey;
}

export function getTreeData(){
    return treeData;
}

export function setTreeData(newTreeData){
    treeData = newTreeData;
}

export function getFolderData(){
    return folderData;
}

export function setFolderData(newFolderData){
    folderData = newFolderData;
}

export function getDecoyFolderData(){
    return decoyFolderData
}

export function setDecoyFolderData(newData){
    decoyFolderData = newData;
}

export function getVertexData(){
    return vertexData;
}

export function setVertexData(newData){
    vertexData = newData;
}

export function getDecoyVertexData(){
    return decoyVertexData
}

export function setDecoyVertexData(newData){
    decoyVertexData = newData;
}

//returns a concated array of the folders and vertex(containers)
export function getContainerData(){
    return folderData.concat(vertexData);
}

export function getModelData(){
    return modelObjects;
}

export function setModelData(newData){
    modelObjects = newData;
}
export function getDecoyModelData(){
    return decoyModelObjects;
}
export function setDecoyModelData(newData){
    decoyModelObjects = newData;
}

//This function is used to load the first available model and canvas from the modelObjects array
//Used to fix thye tree/canvas desync bug when deleting - Lachlan
function loadFirstModel(){
    //set selected model/render key to the 1st available as so a canvas isnt loaded for a nonexistant model
    // if there is atleast one or more items inside of modelObjects set the renderkey to the first object, else set the renderkey and model keys to 1.
    console.log("below is modelObjects")
    console.log(modelObjects)
    if(modelObjects.length > 0){
        setNewRenderKey(modelObjects[0].data.renderKey)
        setNewModel(modelObjects[0].data.modelKey)
        setSelectedFolderKey(modelObjects[0].data.renderKey)
    }
    else{
        setNewRenderKey(1)
        setNewModel(-1)
        setSelectedFolderKey(1)
    }

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
        typeName: "Folder",
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
        typeName: "Folder",
        renderKey: getTotalRenderKeys(),
        parentRenderKey: parentKey
    }
    

    folderData.push(folderThing2);


    
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
    
    }
    else{console.log("Cannot delete only folder")}
    
    loadFirstModel()
}

function deleteFolderChildren(selectedFolder){ // function for deleting all the children of a folder.
    let folderChildren = selectedFolder.children;
    for (let i = 0; i < folderChildren.length; i++){
        if (folderChildren[i].type === "Folder"){
            let selectedRenderKey = folderChildren[i].renderKey;
            handleDeleteFolder(selectedRenderKey);

        }
        else if (folderChildren[i].type === "Model"){
            let selectedModelKey = folderChildren[i].modelKey;
            handleDeleteModel(selectedModelKey);
        }
        else if (folderChildren[i].type === "treeVertex"){
            let selectedUUID = folderChildren[i].semanticIdentity.UUID;
            handleDeleteVertex(selectedUUID);
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
                folderData[i].data.text = newName + " 📁";
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
    let sID = new SemanticIdentity(vertexName,"","","", undefined ,[])

    let tempVertexThing = {
        text: vertexName + " 🟧", //If icon is changed, youll have to change the folder icon in context menu too
        children: treeData[getTotalRenderKeys()],
        data: NaN,
        state: {opened: true},
        type: "treeVertex",
        typeName: "VertexNode",
        originalVertex: true,
        renderKey: getTotalRenderKeys(),
        parentRenderKey: parentKey,
        content: "content",
        colour: "#FFD5A9",
        height: 50,
        width: 70,
        icons: [[],[],[]],
        imageElements: {},
        fontSize: 12,
        semanticIdentity: sID
    }

    decoyVertexData.push(tempVertexThing)

    let vertexThing2 = {
        text: vertexName + " 🟧", //If icon is changed, youll have to change the folder icon in context menu too
        children: treeData[getTotalRenderKeys()],
        data: decoyVertexData[vertexData.length],
        state: {opened: true},
        type: "treeVertex",
        typeName: "VertexNode",
        originalVertex: true,
        renderKey: getTotalRenderKeys(),
        parentRenderKey: parentKey,
        content: "",
        colour: "#FFD5A9",
        height: 50,
        width: 70,
        icons: [[],[],[]],
        imageElements: {},
        fontSize: 12,
        semanticIdentity: sID
    }
    

    vertexData.push(vertexThing2);
    //console.log(vertexData)


    return vertexThing2
    
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

    if(rKey <= 0) return //stops the creation of models in the root or otherwise non-existent folders
    
    let decoyModelThing = {
        text: modelName + icon,
        children: [],
        data: NaN,
        state: {opened: true},
        type: "Model",
        typeName: "Model",
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
        typeName: "Model",
        renderKey: rKey,
        modelKey: getTotalModels(),
        semanticIdentity: sID
    };
 
    modelObjects.push(tempModelThing);
    //console.log(modelObjects)

}

export function handleDeleteVertex(selectedUUID){
    for(let vertex of currentObjects.flatten()){
        if(vertex.originalUUID === selectedUUID){
            currentObjects.remove(vertex)
        }
    }
    for(let i = 0; i < vertexData.length; i++){
        if(vertexData[i].semanticIdentity.UUID === selectedUUID){
            vertexData.splice(i, 1)
            decoyVertexData.splice(i, 1)
        }
    }
    drawAll();
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
            modelObjects[i].data.text = newName + " 📈";
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
    createSaveState();
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

export function getFolderNameFromKey(key){
    let folder = getContainerData().find(folder => folder.renderKey === key)
    return folder.text
}



let initialFolderAdded = false;
export class ContainmentTree extends React.Component {

    componentDidMount() {
        document.getElementById("LowerPanel").addEventListener('dragstart', this.dragStart);
    }
    componentDidUpdate(){
    }
    
    componentWillUnmount() {
        document.getElementById("LowerPanel").removeEventListener('dragstart', this.dragStart);
    }

    dragStart(e) {
        //console.log(e)
        //When we have a better method of getting data without the click, Use the new method to assign the data value - Lachlan
        e.target.click();
        let vertData = 0;
        for(let folder of getContainerData()){
            if(getSelectedFolderKey() === folder.renderKey)
            vertData = folder;
        }

        let data = vertData;
        console.log('drag starts...');
        //Prevents errors when a folder or model is dragged etc. 
        if(vertData.type === "treeVertex"){
        e.dataTransfer.setData('text/plain',data.semanticIdentity.UUID)
        //console.log(data.semanticIdentity.UUID)
        }
        else{
            console.log("This object has no drag/drop feature")
        }
     }
    

    constructor(props) {
        super(props);

        treeData = []; 
        //let i = 0;
        //console.log("props")
        //console.log(props)
        

        
        if (initialFolderAdded === false){
            handleAddFolder("Package"); //The initial folder has render key 1, the initial model needs this to be specified as nothing is selected
            handleAddModel("Graph",1) 
            handleAddFolder("Subfolder",1)
            handleAddVertex("Vertex",1)
            handleAddFolder("Package 2")
            handleAddModel("Graph 2",4)
            handleAddVertex("Vertex 2",4)
            setNewRenderKey(1);
            setNewModel(1);
            setSelectedFolderKey(1);
            initialFolderAdded = true;
            createSaveState();
        }
        

            // Push the model objects in. --- I moved the position of these for loops outside of the vertex for loop as it was creating a few problems - cooper
        for (let model of modelObjects){
            treeData.push(model);           
            
        }
        for (let folder of getContainerData()){ // this for loop is to define the ownership of the models - cooper
                let canvasItems = determineOwnership(folder.renderKey) 
                let subFolderItems = determineSubFolders(folder.renderKey)
                let combinedItems = canvasItems.concat(subFolderItems)
                folder.children = combinedItems;
                

            }
               // treeData.push(vertex.toTreeViewElement(new Set())); --- not too sure what the point of this .push was - cooper   
            
        for (let folder of getContainerData()){ // this for loop is to define the ownership of the vertices & arrows - cooper
            let vertex = new VertexNode() 


            if (vertex.toTreeViewElement("Arrow Folder", folder.renderKey) !== undefined){
                folder.children.push(vertex.toTreeViewElement("Arrow Folder", folder.renderKey))
            }  
            
        }

        for(let vert of getVertexData()){
            if(vert.children.length === 0){
                vert.text = vert.text.replace(" 🟧","");
                vert.text = vert.text.replace(" 📂","");
                vert.text = vert.text + " 🟧"
            }
            else{
                vert.text = vert.text.replace(" 🟧","");
                vert.text = vert.text.replace(" 📂","");
                vert.text = vert.text + " 📂"
            }
        }

        folderDataRoot = [];
        for (let folder of getContainerData()){
            if(folder.parentRenderKey ===0){
                folderDataRoot.push(folder)
            }

        }

        this.state = {
            data: {
                core: {
                    data: [
                        { text: "Root", 
                        children: folderDataRoot, state: { opened: true }, 
                        root: true},
                    ]
                }
            },
            selectedVertex: null
        }



        if(showingVertPath === true){

            let highestLevel = "Root";
            let nextLevel = "";
            let vertexOrEdge = "";
            let actualObject = "";

            let b = 0;
            //First, we need to actually determine where the vertex is
            //Take a look at our container
            for (let cont of getContainerData()){
                for (let treeDat of cont.children){
                    if(b === 0){
                        for (let treeElement of treeDat.children){
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
    }

    //Function called when an object in treeview is clicked
    handleElementSelect(e, data) {

        // Try catch used to catch undefined data type eg. root
        try{
            console.log(data.node)

            if(data.node.data.type === "Folder" || data.node.data.type === "treeVertex" ){
                setSelectedFolderKey(data.node.data.renderKey)
            }

            else if (data.node.data.type === "Model"){
                setNewModel(data.node.data.modelKey);
                setNewRenderKey(data.node.data.renderKey);
                setSelectedFolderKey(data.node.data.renderKey)
                // Move everything away
                for (let item of currentObjects.flatten()){
                    if (item.typeName === "Vertex" && item.getModelKey() === getCurrentModel()){
                        item.setPresent();
                    }

                    else if (item.getModelKey() !== getCurrentModel() && item.typeName === "Vertex"){
                        item.setAway();
                    }
                }
            }
            
            else if (data.selected.length === 1 && data.node.data !== null && data.node.data.type === undefined) {
                let UUID = data.node.data.semanticIdentity.UUID;
                for (let vertex of currentObjects.flatten()) {
                    if (vertex.semanticIdentity.UUID === UUID) {
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
                    }
                }
            } 
            else {
                this.setState({
                    selectedVertex: null
                });
            }
            drawAll();
        }
        catch(e){
            //console.log("If True,a null type error has been caught, If the selected object should be selectable, this is an issue")
        }

        //If the user clicks the root folder
        try{
            if(data.node.original.root === true){
                setSelectedFolderKey(0) //renderkey 0 will be used for root
            }
        }
        catch(e){
        }


    }

    handleContextMenu(){
        console.log("CM triggered for tree")
    }



    render() {
        const data = this.state.data;
        return (
            <div>
                <TreeView treeData={data} onChange={(e, data) => this.handleElementSelect(e, data)} className="treeview" id="treeview" draggable="true" />

            </div>
        )
    }
}