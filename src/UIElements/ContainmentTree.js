/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 */

import React from 'react';
import TreeView from 'react-simple-jstree';

import { currentObjects, setNewContainerKey as setNewPackageKey, getTotalContainerKeys, incrementTotalContainerKeys, 
    getCurrentGraph, setNewGraph as setNewGraphKey, getTotalGraphs, incrementTotalGraphs as incrementTotalGraph} from "./CanvasDraw";

import { drawAll } from "./CanvasDraw";
import {VertexNode} from "../DataStructures/Graph.js"
import { SemanticIdentity } from "../DataStructures/SemanticIdentity.js";
import { createSaveState } from '../Serialisation/NewFileManager';
import {getGraphIcon, getPackageIcon, getTreeVertexEmptyIcon, getTreeVertexFullIcon, initialObjects} from '../Config.js';

// Accesor for tree data
let treeData = [];

// Stores data for packages
let packageData = [];

// The decoy packages something to do with past teams indexing? can probably refactor and remove them? - Lachlan
let decoyPackageData = [];

// Stores data for Vertex's (Tree)
let vertexData = [];

// The decoy Vertex something to do with past teams indexing? can probably refactor and remove them? - Lachlan
let decoyVertexData = [] 

// Stores data for Graphs
let graphObjects = [];

// The decoy Graph something to do with past teams indexing? can probably refactor and remove them? - Lachlan
let decoyGraphObjects = [];

//used as a container for sorting root from subPackages when pushing Packages to root.
let packageDataRoot = [];

//Index of Currently Selected Container by user
let selectedContainerKey = 0;



export function setSelectedPackageKey(newKey){
    selectedContainerKey = newKey;
}

export function getSelectedPackageKey(){
    return selectedContainerKey;
}

export function getTreeData(){
    return treeData;
}

export function setTreeData(newTreeData){
    treeData = newTreeData;
}

export function getPackageData(){
    return packageData;
}

export function setPackageData(newPackageData){
    packageData = newPackageData;
}

export function getDecoyPackageData(){
    return decoyPackageData
}

export function setDecoyPackageData(newData){
    decoyPackageData = newData;
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

//returns a concated array of the folders and vertex (Tree
export function getContainerData(){
    return packageData.concat(vertexData);
}

export function getGraphData(){
    return graphObjects;
}

export function setGraphData(newData){
    graphObjects = newData;
}
export function getDecoyGraphData(){
    return decoyGraphObjects;
}
export function setDecoyGraphData(newData){
    decoyGraphObjects = newData;
}




/**
 * Loads the First available/oldest Graph
 */
function loadFirstGraph(){
    //Load first Graph
    if(graphObjects.length > 0){
        setNewPackageKey(graphObjects[0].data.renderKey)
        setNewGraphKey(graphObjects[0].data.modelKey)
        setSelectedPackageKey(graphObjects[0].data.renderKey)
    }
    //set keys to (none selected) values
    else{
        setNewPackageKey(0)
        setNewGraphKey(-1)
        setSelectedPackageKey(0)
    }
    //load the model to canvas
    for (let item of currentObjects.flatten()){
        if (item.typeName === "Vertex" && item.getModelKey() === getCurrentGraph()){
            item.setPresent();
        }
        else if (item.getModelKey() !== getCurrentGraph() && item.typeName === "Vertex"){
            item.setAway();
        }
    }
    drawAll()
}


/**
 * Create a Package in Treeview
 * @param {string} packageName Name of new Package
 * @param {number} parentKey Index of Parent, Defaults to 0 ("Root")
 */
export function handleAddPackage(packageName, parentKey = 0){

    incrementTotalContainerKeys();

    let tempFolderThing = {
        text: packageName + " " + getPackageIcon(), 
        children: treeData[getTotalContainerKeys()],
        data: NaN,
        state: {opened: true},
        type: "Package",
        typeName: "Package",
        renderKey: getTotalContainerKeys(),
        parentRenderKey: parentKey
    }

    decoyPackageData.push(tempFolderThing)

    let folderThing2 = {
        text: packageName + " " + getPackageIcon(), 
        children: treeData[getTotalContainerKeys()],
        data: decoyPackageData[packageData.length],
        state: {opened: true},
        type: "Package",
        typeName: "Package",
        renderKey: getTotalContainerKeys(),
        parentRenderKey: parentKey
    }
    
    packageData.push(folderThing2);
}
/**
 * Create a Vertex in Treeview
 * @param {string} vertexName 
 * @param {number} parentKey 
 * @returns Created Vertex Object
 */
export function handleAddVertex(vertexName, parentKey = 0){
    //Create a new folder using the known node type

    incrementTotalContainerKeys();
    let sID = new SemanticIdentity(vertexName,"","","", undefined ,[])

    let tempVertexThing = {
        text: vertexName + " " + getTreeVertexEmptyIcon(), 
        children: treeData[getTotalContainerKeys()],
        data: NaN,
        state: {opened: true},
        type: "treeVertex",
        typeName: "VertexNode",
        originalVertex: true,
        renderKey: getTotalContainerKeys(),
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

    decoyVertexData.push(tempVertexThing)

    let vertexThing2 = {
        text: vertexName + " " + getTreeVertexEmptyIcon(), //If icon is changed, youll have to change the folder icon in context menu too
        children: treeData[getTotalContainerKeys()],
        data: decoyVertexData[vertexData.length],
        state: {opened: true},
        type: "treeVertex",
        typeName: "VertexNode",
        originalVertex: true,
        renderKey: getTotalContainerKeys(),
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
    return vertexThing2
}

/**
 * @param {number} selectedRenderKey 
 */
export function handleDeletePackage(selectedRenderKey){ 
    for (let i = 0; i < packageData.length; i++){
        if (packageData[i].renderKey === selectedRenderKey){
            deletePackageChildren(packageData[i]);
            decoyPackageData.splice(i,1); 
            packageData.splice(i,1); 
        }
    }
    //set index to first graph
    loadFirstGraph()
}
/**
 * Delete a vertex From Treedata, and appearances on graphs
 * @param {*} selectedUUID 
 */
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

function deletePackageChildren(selectedFolder){
    let folderChildren = selectedFolder.children;
    for (let i = 0; i < folderChildren.length; i++){
        if (folderChildren[i].type === "Package"){
            let selectedRenderKey = folderChildren[i].renderKey;
            handleDeletePackage(selectedRenderKey);
        }
        else if (folderChildren[i].type === "Graph"){
            let selectedModelKey = folderChildren[i].modelKey;
            handleDeleteGraph(selectedModelKey);
        }
        else if (folderChildren[i].type === "treeVertex"){
            let selectedUUID = folderChildren[i].semanticIdentity.UUID;
            handleDeleteVertex(selectedUUID);
        }
    }
}


export function handleRenameFolder(newName,rKey){
    if(newName !== ""){
        for (let i = 0; i < packageData.length; i++){
            if (packageData[i].renderKey === rKey){
                packageData[i].text = newName + " " + getPackageIcon();
                packageData[i].data.text = newName + " " + getPackageIcon();
                break;
            }
        }
    }
    else{
        console.log("Cannot have empty name")
    }
}



/**
 * Add Graph to Treeview
 * @param {string} graphName 
 * @param {number} rKey 
 */
export function handleAddGraph(graphName, rKey=getSelectedPackageKey()){
    //stops the creation of models in the root or otherwise non-existent folders
    if(rKey <= 0) return 

    incrementTotalGraph();
    
    let decoyModelThing = {
        text: graphName + " " + getGraphIcon(),
        children: [],
        data: NaN,
        state: {opened: true},
        type: "Graph",
        typeName: "Graph",
        renderKey: rKey,
        modelKey: getTotalGraphs(),
    }

    decoyGraphObjects.push(decoyModelThing);

    let tempModelThing = {
        text: graphName + " " + getGraphIcon(),
        children: [],
        data: decoyGraphObjects[graphObjects.length],
        state: {opened: true},
        type: "Graph",
        typeName: "Graph",
        renderKey: rKey,
        modelKey: getTotalGraphs(),
    };
 
    graphObjects.push(tempModelThing);
}

export function handleDeleteGraph(selectedGraphKey){
    for (let i = 0; i < graphObjects.length; i++){
        if (graphObjects[i].modelKey === selectedGraphKey){
            graphObjects.splice(i, 1);
            decoyGraphObjects.splice(i, 1);
        }
    }
    loadFirstGraph()
}

export function handleRenameGraph(newName,gKey){
    for (let i = 0; i < graphObjects.length; i++){
        if (graphObjects[i].modelKey === gKey){
            graphObjects[i].text = newName + " " + getGraphIcon();
            graphObjects[i].data.text = newName + " " + getGraphIcon();
            break;
        }
    }
}

/**
 * 
 * @param {number} selectedGraphKey 
 * @returns {number} The Key of The Graphs Parent Container
 */
export function getGraphRenderKey(selectedGraphKey){ 
    for(let i = 0; i < graphObjects.length; i++){
        if (graphObjects[i].modelKey === selectedGraphKey){
            return graphObjects[i].renderKey
        }
    }
}

/**
 * Changes the Parent Container of a Graph
 * @param {number} gKey 
 * @param {number} newkey 
 */
export function handleModelRebase(gKey,newkey){
    for(let graph of graphObjects){
        if(graph.modelKey === gKey){
           for(let objectFolders of graph.children){  
                let objects = objectFolders.children
                for(let object of objects){
                    object.renderkey = newkey;
                    if(object.data.typeName === "Vertex"){
                    object.data.vertexRenderKey = newkey;
                    }
                    else{
                    object.data.arrowRenderKey = newkey;
                    }
                }
            } 
            graph.renderKey = newkey;
        }
    }
    createSaveState();
}





/**
 * Determines Children for a Container
 * @param {number} parsedContainerKey 
 * @returns Array of Container's children
 */
function determineOwnership(parsedContainerKey){
    let returnArray = []
    let i = 0
    for (let vertexOrArrow of treeData){
        if(vertexOrArrow !== undefined){
            if (vertexOrArrow.type === "Graph"){
                if (vertexOrArrow.renderKey === parsedContainerKey){
                    returnArray.push(treeData[i])
                }
            }
        }
        i += 1
    }

    return returnArray
}

/**
 * Determines SubContainers for a Container
 * @param {*} parsedContainerKey 
 * @returns Array of Container's SubContainer's
 */
function determineSubFolders(parsedContainerKey){
    let returnArray = []
    for (let Container of getContainerData()){
        if(Container.parentRenderKey === parsedContainerKey)
        returnArray.push(Container)
    }
    return returnArray
}

export function getModelNameFromKey(key){
    let model = graphObjects.find(model => model.modelKey === key)
    return model.text
}

export function getContainerNameFromKey(key){
    let folder = getContainerData().find(folder => folder.renderKey === key)
    return folder.text
}

//Flag for when the editor is first opened or a new file is loaded.
let initialPackageAdded = false;

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
        //click required as JStree requires a "Selecting a node" to bring data forward. (Element only stores name)
        e.target.click();
        let vertData = 0;
        for(let folder of getContainerData()){
            if(getSelectedPackageKey() === folder.renderKey)
            vertData = folder;
        }
        let data = vertData;
        //Prevents errors when a folder or model is dragged etc. 
        if(vertData.type === "treeVertex"){
        e.dataTransfer.setData('text/plain',data.semanticIdentity.UUID)
        }
        else{
            console.log("This object has no drag/drop feature")
        }
     }
    

    constructor(props) {
        super(props);

        treeData = []; 

        if (initialPackageAdded === false){
            initialObjects()

            setNewPackageKey(1);
            setNewGraphKey(1);
            setSelectedPackageKey(1);
            initialPackageAdded = true;
            createSaveState();
        }
        

        // Push the model objects in
        for (let model of graphObjects){
            treeData.push(model);           
            
        }
        //define owenerships
        for (let folder of getContainerData()){ 
            let canvasItems = determineOwnership(folder.renderKey) 
            let subFolderItems = determineSubFolders(folder.renderKey)
            let combinedItems = canvasItems.concat(subFolderItems)
            folder.children = combinedItems;
                

        }

        //define ownership of canvas arrows   
        for (let folder of getContainerData()){ 
            let vertex = new VertexNode() 
            if (vertex.toTreeViewElement("Arrow Folder", folder.renderKey) !== undefined){
                folder.children.push(vertex.toTreeViewElement("Arrow Folder", folder.renderKey))
            }  
            
        }
        //determine if vertex's are empty or not
        for(let vert of getVertexData()){
            if(vert.children.length === 0){
                vert.text = vert.text.replace(" " + getTreeVertexEmptyIcon(),"");
                vert.text = vert.text.replace(" " + getTreeVertexFullIcon(),"");
                vert.text = vert.text + " " + getTreeVertexEmptyIcon();
            }
            else{
                vert.text = vert.text.replace(" " + getTreeVertexEmptyIcon(),"");
                vert.text = vert.text.replace(" " + getTreeVertexFullIcon(),"");
                vert.text = vert.text + " " + getTreeVertexFullIcon()
            }
        }

        //Determine which folders are root folders
        packageDataRoot = [];
        for (let folder of getContainerData()){
            if(folder.parentRenderKey ===0){
                packageDataRoot.push(folder)
            }

        }

        //Set the TreeData
        this.state = {
            data: {
                core: {
                    data: [
                        { text: "Root", 
                        children: packageDataRoot, state: { opened: true }, 
                        root: true},
                    ]
                }
            },
            selectedVertex: null
        }
    }

    /**
     * Function called when Treeview Element is clicked
     * @param {*} e The target element
     * @param {*} data The treeNodes data
     */
    handleElementSelect(e, data) {

        //catch undefined data type eg. root
        try{
            if(data.node.data.type === "Package" || data.node.data.type === "treeVertex" ){
                setSelectedPackageKey(data.node.data.renderKey)
            }

            else if (data.node.data.type === "Graph"){
                setNewGraphKey(data.node.data.modelKey);
                setNewPackageKey(data.node.data.renderKey);
                setSelectedPackageKey(data.node.data.renderKey)
                // Move everything away
                for (let item of currentObjects.flatten()){
                    if (item.typeName === "Vertex" && item.getModelKey() === getCurrentGraph()){
                        item.setPresent();
                    }
                    else if (item.getModelKey() !== getCurrentGraph() && item.typeName === "Vertex"){
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
                        setNewPackageKey(vertex.vertexRenderKey);
                        setNewGraphKey(vertex.vertexModelKey); 
                        setSelectedPackageKey(vertex.vertexRenderKey)
                        
                        for (let item of currentObjects.flatten()){
                            if (item.typeName === "Vertex" && item.getModelKey() === getCurrentGraph()){
                                item.setPresent();
                            }
                            else if (item.getModelKey() !== getCurrentGraph() && item.typeName === "Vertex"){
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
            console.log("If True,a null type error has been caught, If the selected object should be selectable, this is an issue")
        }
        //If the user clicks the root folder
        try{
            if(data.node.original.root === true){
                setSelectedPackageKey(0) //renderkey 0 will be used for root
            }
        }
        catch(e){
        }


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