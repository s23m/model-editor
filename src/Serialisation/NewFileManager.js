import {addObject, currentObjects, drawAll, getCurrentContainerKey, getTotalGraphs, getTotalContainerKeys as getTotalPackageKeys, 
    setCurrentObjects, setNewGraph, setNewContainerKey, setTotalGraphKeys, setTotalContainerKey, updateArrows} from "../UIElements/CanvasDraw"

import {setTranslationColumns, translationColumns} from "../UIElements/SemanticDomainEditor"

import {Vertex} from "../DataStructures/Vertex";
import {Arrow} from "../DataStructures/Arrow";
import {Cardinality} from "../DataStructures/Cardinality";
import {EdgeEnd} from "../DataStructures/EdgeEnd";
import {Graph} from "../DataStructures/Graph";
import { SemanticIdentity } from "../DataStructures/SemanticIdentity";
import { getDecoyPackageData, getDecoyGraphData, getDecoyVertexData, getPackageData, getGraphData, 
    getSelectedPackageKey, getTreeData, getVertexData, setDecoyPackageData, setDecoyGraphData, setDecoyVertexData, 
    setPackageData, setGraphData, setSelectedPackageKey, setTreeData, setVertexData } from "../UIElements/ContainmentTree";
import { getMaxSaveStates } from "../Config";

const lodash = require('lodash');


//Get all the data that needs to be saved, to restore a session
export function getSaveData() {
    
    let vertexObjects =  lodash.cloneDeep((currentObjects.flatten(true, false)));
    let arrowObjects = lodash.cloneDeep((currentObjects.flatten(false, true)));
    let treeData = JSON.parse(JSON.stringify(getTreeData()));
    let packageData = JSON.parse(JSON.stringify(getPackageData()));
    let decoyPackageData = JSON.parse(JSON.stringify(getDecoyPackageData()));
    let vertexData = JSON.parse(JSON.stringify(getVertexData()));
    let decoyVertexData = JSON.parse(JSON.stringify(getDecoyVertexData()));
    let graphObjects = JSON.parse(JSON.stringify(getGraphData()));
    let decoyGraphObjects = JSON.parse(JSON.stringify(getDecoyGraphData())) ;
    let totalContainerKeys = getTotalPackageKeys();
    let totalGraphs = getTotalGraphs();
    let currentGraph = getCurrentContainerKey();
    let currentKey = getCurrentContainerKey();
    let currentPackage = getSelectedPackageKey();

    let saveData = {

        translationColumns: translationColumns,

        vertices: vertexObjects,
        arrows: arrowObjects,
        tree: treeData,
        packages: packageData,
        dPackages: decoyPackageData,
        treeVertex: vertexData,
        dTreeVertex: decoyVertexData,
        graph: graphObjects,
        dGraph: decoyGraphObjects,
        containerKeys: totalContainerKeys,
        graphKeys: totalGraphs,
        currentKey: currentKey,
        currentGra: currentGraph,
        currentPack: currentPackage,

    };

    return saveData;
}


//Create the JSON file with the save data
export function save(){
    let JSONdata = getSaveData();
    let dataTransformed = JSON.stringify(JSONdata);
    let dataFile = new Blob([dataTransformed], {type: 'text/json'});
    //default file name
    let title = prompt("Please name your file", 's23m Graph')

    //Download the file
    let DLelement = document.createElement("a");
    DLelement.href = URL.createObjectURL(dataFile);
    DLelement.download = title + ".json";
    document.body.appendChild(DLelement);
    DLelement.click();
    document.body.removeChild(DLelement);

}

//Replace current editor "state" with data from file
export function load(jsonString){
    if (jsonString == null) return;
    let saveData = JSON.parse(jsonString);

    //TreeVertices need to convert semanticIdentity back to a sI object
    for(let vert of saveData.treeVertex){
        vert.semanticIdentity = new SemanticIdentity(vert.semanticIdentity.name,vert.semanticIdentity.description,vert.semanticIdentity.abbreviation,
            vert.semanticIdentity.shortAbbreviation,vert.semanticIdentity.UUID,vert.semanticIdentity.translations)
    }
    //vertexs and arrows need to be converted back to their explicit types
    var newVertices = [];
    var newArrows = [];

    //vertices
    for(let vert of saveData.vertices){
        setSelectedPackageKey(vert.vertexContainerKey)
        setNewContainerKey(vert.vertexContainerKey)
        setNewGraph(vert.vertexGraphKey)
        vert.semanticIdentity = new SemanticIdentity(vert.semanticIdentity.name,vert.semanticIdentity.description,vert.semanticIdentity.abbreviation,
            vert.semanticIdentity.shortAbbreviation,vert.semanticIdentity.UUID,vert.semanticIdentity.translations)
        vert = new Vertex ({newConstructor: 1,loadedVertex: vert})
        newVertices.push(vert)
    }

    //arrows
    function remakeSemantic(semantic){
        return new SemanticIdentity(semantic.name, semantic.description, semantic.abbreviation, semantic.shortAbbreviation, semantic.UUID, semantic.translations);
    }
    function remakeCardinality(cardinality){
        return new Cardinality(cardinality.numLowerBound, cardinality.numUpperBound, cardinality.attachedToUUID, cardinality.isVisible, remakeSemantic(cardinality.semanticIdentity));
    }
    function remakeEdge(edge){
        return new EdgeEnd(edge.attachedToUUID, edge.headType, remakeCardinality(edge.cardinality), edge.label, remakeSemantic(edge.semanticIdentity));
    }
    function remakeArrow(arrow){
        var newArrow = new Arrow(newVertices, arrow.pathData, arrow.edgeType, remakeSemantic(arrow.semanticIdentity));
            newArrow.sourceEdgeEnd = remakeEdge(arrow.sourceEdgeEnd);
            newArrow.destEdgeEnd = remakeEdge(arrow.destEdgeEnd);
            return newArrow;
    }
    for(let arrow of saveData.arrows){
        setSelectedPackageKey(arrow.arrowContainerKey)
        setNewContainerKey(arrow.arrowContainerKey)
        setNewGraph(arrow.arrowGraphKey)
        arrow = remakeArrow(arrow)
        newArrows.push(arrow)
    }

    setTranslationColumns(saveData.translationColumns)
    setPackageData(saveData.packages);
    setDecoyPackageData(saveData.dPackages);
    setVertexData(saveData.treeVertex);
    setDecoyVertexData(saveData.dTreeVertex);
    setGraphData(saveData.graph)
    setDecoyGraphData(saveData.dGrraph)
    setTreeData(saveData.tree)
    setTotalContainerKey(saveData.containerKeys)
    setTotalGraphKeys(saveData.graphKeys)
    setCurrentObjects(new Graph(newVertices, newArrows));
    updateArrows()
    setSelectedPackageKey(1)
    setNewContainerKey(1)
    setNewGraph(1)
    drawAll()


    console.log("load finished")

}

//Import a package or save file into root
export function importLoad(jsonString){
    //load the file
    if (jsonString == null) return;
    let saveData = JSON.parse(jsonString);

    //Graph and containers,treevertex's need to be given new keys
    //arrows and vertex's will need new keys to match their updated parent keys
    let packageKeyMap = [];
    let graphKeyMap = [];
    // list of arrows that have already updated. Used to stop arrows updating multiple times due to newkeys overlapping with oldkey numbers.
    let arrowUpdated = []; 
    let containerKeys = getTotalPackageKeys();
    let graphKeys = getTotalGraphs();

    //assign a new key for each package/vertex
    for(let container of saveData.packages){
        containerKeys++;
        let containerKey = {originalKey: container.containerKey, originalParentKey: container.parentContainerKey, newKey: containerKeys, newParentKey: 0}
        packageKeyMap.push(containerKey)
    }
    for(let vert of saveData.treeVertex){
        containerKeys++;
        let containerKey = {originalKey: vert.containerKey, originalParentKey: vert.parentContainerKey, newKey: containerKeys, newParentKey: 0}
        packageKeyMap.push(containerKey)
    }
    for(let graph of saveData.graph){
        graphKeys++;
        let graphKey = {originalGraphKey: graph.graphKey, originalKey: graph.containerKey, newGraphKey: graphKeys, newKey: 0}
        graphKeyMap.push(graphKey)
    }

    //assign new relative parent keys
    for(let packages of packageKeyMap){
        for(let packagesCompare of packageKeyMap){
            if(packages.originalParentKey === packagesCompare.originalKey){
                packages.newParentKey = packagesCompare.newKey;
            }
        }
    }

    for(let graphs of graphKeyMap){
        for(let packages of packageKeyMap){
            if(graphs.originalKey === packages.originalKey){
                graphs.newKey = packages.newKey;
            }
        }
    }



    //assign the new keys to the vertex's, graph's and packages
    for(let i = 0; i < saveData.packages.length; i++){
        saveData.packages[i].containerKey = packageKeyMap[i].newKey;
        saveData.packages[i].parentContainerKey = packageKeyMap[i].newParentKey;

        saveData.packages[i].data.containerKey = packageKeyMap[i].newKey;
        saveData.packages[i].data.parentContainerKey = packageKeyMap[i].newParentKey;

        saveData.dPackages[i].containerKey = packageKeyMap[i].newKey;
        saveData.dPackages[i].parentContainerKey = packageKeyMap[i].newParentKey;
    }

    for(let i = saveData.packages.length; i < saveData.packages.length + saveData.treeVertex.length; i++){
        saveData.treeVertex[i - saveData.packages.length].containerKey = packageKeyMap[i].newKey;
        saveData.treeVertex[i - saveData.packages.length].parentContainerKey = packageKeyMap[i].newParentKey;

        saveData.treeVertex[i - saveData.packages.length].data.containerKey = packageKeyMap[i].newKey;
        saveData.treeVertex[i - saveData.packages.length].data.parentContainerKey = packageKeyMap[i].newParentKey;

        saveData.dTreeVertex[i - saveData.packages.length].containerKey = packageKeyMap[i].newKey;
        saveData.dTreeVertex[i - saveData.packages.length].parentContainerKey = packageKeyMap[i].newParentKey;
    }

    for(let i =0; i< saveData.graph.length; i++){
        saveData.graph[i].containerKey = graphKeyMap[i].newKey
        saveData.graph[i].graphKey = graphKeyMap[i].newGraphKey

        saveData.graph[i].data.containerKey = graphKeyMap[i].newKey
        saveData.graph[i].data.graphKey = graphKeyMap[i].newGraphKey

        saveData.dGraph[i].containerKey = graphKeyMap[i].newKey
        saveData.dGraph[i].graphKey = graphKeyMap[i].newGraphKey
    }

    //assign the new keys to vertex's and arrows
    for(let packages of packageKeyMap){
        
        for(let vertex of saveData.vertices){
            if(vertex.vertexContainerKey === packages.originalKey){
                vertex.vertexContainerKey = packages.newKey;
            }
        }

        for(let arrow of saveData.arrows){
            if(arrow.arrowContainerKey === packages.originalKey && !arrowUpdated.includes(arrow)){
                arrow.arrowContainerKey = packages.newKey;
                arrowUpdated.push(arrow);
            }
        }
            
    }

    for(let graphs of graphKeyMap){
        for(let vertex of saveData.vertices){
            if(vertex.vertexGraphKey === graphs.originalGraphKey){
                vertex.vertexGraphKey = graphs.newGraphKey;
            }
        }

        for(let arrow of saveData.arrows){
            if(arrow.arrowGraphKey === graphs.originalGraphKey){
                arrow.arrowGraphKey = graphs.newGraphKey;
            }
        }
    }
    

    //recreat vertex/arrow objects as in load()

    var newVertices = [];
    var newArrows = [];
    for(let vert of saveData.vertices){
        vert.semanticIdentity = new SemanticIdentity(vert.semanticIdentity.name,vert.semanticIdentity.description,vert.semanticIdentity.abbreviation,
            vert.semanticIdentity.shortAbbreviation,vert.semanticIdentity.UUID,vert.semanticIdentity.translations)
        vert = new Vertex ({newConstructor: 1,loadedVertex: vert})
        newVertices.push(vert)
    }

    function remakeSemantic(semantic){
        return new SemanticIdentity(semantic.name, semantic.description, semantic.abbreviation, semantic.shortAbbreviation, semantic.UUID, semantic.translations);
    }

    function remakeCardinality(cardinality){
        return new Cardinality(cardinality.numLowerBound, cardinality.numUpperBound, cardinality.attachedToUUID, cardinality.isVisible, remakeSemantic(cardinality.semanticIdentity));
    }
 
    function remakeEdge(edge){
        return new EdgeEnd(edge.attachedToUUID, edge.headType, remakeCardinality(edge.cardinality), edge.label, remakeSemantic(edge.semanticIdentity));
    }

    function remakeArrow(arrow){
        var newArrow = new Arrow(newVertices, arrow.pathData, arrow.edgeType, remakeSemantic(arrow.semanticIdentity));
            newArrow.setContainerKey(arrow.arrowContainerKey)
            newArrow.setGraphKey(arrow.arrowGraphKey)
            newArrow.sourceEdgeEnd = remakeEdge(arrow.sourceEdgeEnd);
            newArrow.destEdgeEnd = remakeEdge(arrow.destEdgeEnd);
            return newArrow;
    }

    for(let arrow of saveData.arrows){
        arrow = remakeArrow(arrow)
        newArrows.push(arrow)
    }


    //graphs,containers,tree verts need to be added to current data

    setPackageData(getPackageData().concat(saveData.packages))
    setDecoyPackageData(getDecoyPackageData().concat(saveData.dPackages))

    setVertexData(getVertexData().concat(saveData.treeVertex))
    setDecoyVertexData(getDecoyVertexData().concat(saveData.dTreeVertex))

    setGraphData(getGraphData().concat(saveData.graph)) 
    setDecoyGraphData(getDecoyGraphData().concat(saveData.dGraph))


    //vertex's and arrows add to current data


    for(let vertex of newVertices){
        addObject(vertex)
    }
    for(let arrow of newArrows){
        addObject(arrow)
    }

    //reset current keys to reload a few things eg. turn any loaded vertices invisible is they were present in save

    setSelectedPackageKey(getSelectedPackageKey())
    setNewContainerKey(getCurrentContainerKey())
    setNewGraph(getCurrentContainerKey())
    //set the new latest index's
    setTotalContainerKey(containerKeys)
    setTotalGraphKeys(graphKeys)
    //update arrows drawall
    updateArrows()
    drawAll()

     

 return;
}

//Loads saveData in memory (not from json string)
function loadDirect(saveData){

    setTranslationColumns(saveData.translationColumns)
    setPackageData(saveData.packages);
    setDecoyPackageData(saveData.dPackages);
    setVertexData(saveData.treeVertex);
    setDecoyVertexData(saveData.dTreeVertex);
    setGraphData(saveData.graph)
    setDecoyGraphData(saveData.dGrraph)
    setTreeData(saveData.tree)
    setTotalContainerKey(saveData.containerKeys)
    setTotalGraphKeys(saveData.graphKeys)
    setCurrentObjects(new Graph(saveData.vertices, saveData.arrows));
    updateArrows()
    setSelectedPackageKey(saveData.currentCon)
    setNewContainerKey(saveData.currentKey)
    setNewGraph(saveData.currentGra)
    drawAll()

}

// index 0 is the most recent change
let saveStates = []
let currentState = 0
//Save states limit as its all stored in memeory (save states are relativley small though and only scale to be a few kilobytes per object though)
let maxSavedStates = getMaxSaveStates(); 

export function getsaveStates(){
    return saveStates;
}


export function createSaveState(){

    //This line is needed as some of the variables in saveData
    let newData = Object.assign({}, getSaveData());
    //Remove everything infront of the current state if not most recent eg. When the user has hit undo and then does an action
    if(currentState !== 0){
        for(let i = 0; i < currentState; i++){
            saveStates.shift()
        }
        currentState = 0;
    }
    //push the chnage to saveStates and remove the oldest state if above threshold
    saveStates.unshift(newData)
    if(saveStates.length > maxSavedStates){
        saveStates.pop()
    }
    console.log("saveStates")
    console.log(saveStates)
}


export function undo(){
    if(currentState < (maxSavedStates - 1) && saveStates[currentState + 1] !== undefined && saveStates.length !== 0){
        currentState ++
        loadDirect(saveStates[currentState])
    }
}

export function redo(){
    if(currentState > 0 && saveStates.length !== 0){
        currentState --
        loadDirect(saveStates[currentState])
    }
}