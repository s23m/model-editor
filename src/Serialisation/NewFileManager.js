import {currentObjects, drawAll, getCurrentModel, getCurrentObjects, getCurrentRenderKey, getTotalModels, getTotalRenderKeys, setCurrentObjects, setNewModel, setNewRenderKey, setTotalModelKeys, setTotalRenderKey, updateArrows} from "../UIElements/CanvasDraw"
import {version} from "../UIElements/MainView"
import {setTranslationColumns, translationColumns} from "../UIElements/SemanticDomainEditor"
import {getModelName} from "../UIElements/CanvasDraw";

import {Vertex} from "../DataStructures/Vertex";
import {Arrow} from "../DataStructures/Arrow";
import {Cardinality} from "../DataStructures/Cardinality";
import {EdgeEnd} from "../DataStructures/EdgeEnd";
import {Graph} from "../DataStructures/Graph";
import { SemanticIdentity } from "../DataStructures/SemanticIdentity";
import { folderData, getDecoyFolderData, getDecoyModelData, getDecoyVertexData, getFolderData, getModelData, getSelectedFolderKey, getTreeData, getVertexData, setDecoyFolderData, setDecoyModelData, setDecoyVertexData, setFolderData, setModelData, setSelectedFolderKey, setTreeData, setVertexData } from "../UIElements/ContainmentTree";
import { CompassCalibrationOutlined } from "@material-ui/icons";

//Get all the data that needs to be saved, to restore a session
// .slice() is added to everything returning arrays as we just want the value, not a reference.
export function getSaveData() {
    let vertexObjects = currentObjects.flatten(true, false);
    let arrowObjects = currentObjects.flatten(false, true);
    let treeData = getTreeData().slice();
    let folderData = getFolderData().slice();
    let decoyFolderData = getDecoyFolderData().slice();

    let vertexData = getVertexData().slice();
    let decoyVertexData = getDecoyVertexData().slice();

    let modelObjects = getModelData().slice();
    let decoyModelObjects = getDecoyModelData().slice();

    let totalRenderKeys = getTotalRenderKeys();
    let totalModels = getTotalModels();

    let currentModel = getCurrentModel();
    let currentKey = getCurrentRenderKey();
    let currentFolder = getSelectedFolderKey();

    let saveData = {

        translationColumns: translationColumns,

        vertices: vertexObjects,
        arrows: arrowObjects,
        tree: treeData,
        packages: folderData,
        dPackages: decoyFolderData,
        treeVertex: vertexData,
        dTreeVertex: decoyVertexData,
        graph: modelObjects,
        dGrraph: decoyModelObjects,
        renderKeys: totalRenderKeys,
        modelKeys: totalModels,
        currentKey: currentKey,
        currentMod: currentModel,
        currentFol: currentFolder,
        


        "modelName":getModelName()
    };
    return saveData;
}

//Create the JSON file with the save data
export function save(){
    let JSONdata = getSaveData();
    let dataTransformed = JSON.stringify(JSONdata);
    let dataFile = new Blob([dataTransformed], {type: 'text/json'});
    //default file name
    let title = prompt("Please name your file", 's23m Model')

    //Download the file
    let DLelement = document.createElement("a");
    DLelement.href = URL.createObjectURL(dataFile);
    DLelement.download = title + ".json";
    document.body.appendChild(DLelement);
    DLelement.click();
    document.body.removeChild(DLelement);

}

//currently doesnt load arrows or semantic editor properties
export function load(jsonString){
    if (jsonString == null) return;
    let saveData = JSON.parse(jsonString);

    //TreeVertices need to convert semanticIdentity back to a sI object
    for(let vert of saveData.treeVertex){
        vert.semanticIdentity = new SemanticIdentity(vert.semanticIdentity.name,vert.semanticIdentity.description,vert.semanticIdentity.abbreviation,
            vert.semanticIdentity.shortAbbreviation,vert.semanticIdentity.UUID,vert.semanticIdentity.translations)
    }
    //Models and arrows need to be converted back to their explicit types
    var newVertices = [];
    var newArrows = [];

    //vertices
    for(let vert of saveData.vertices){
        console.log(vert)
        vert.semanticIdentity = new SemanticIdentity(vert.semanticIdentity.name,vert.semanticIdentity.description,vert.semanticIdentity.abbreviation,
            vert.semanticIdentity.shortAbbreviation,vert.semanticIdentity.UUID,vert.semanticIdentity.translations)
        //atm its a bit messy as vert constructor doesnt use destructuring so we can specifiy options, when it does this can be changed
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
        arrow = remakeArrow(arrow)
        newArrows.push(arrow)
    }

    setTranslationColumns(saveData.translationColumns)
    setFolderData(saveData.packages);
    setDecoyFolderData(saveData.dPackages);
    setVertexData(saveData.treeVertex);
    setDecoyVertexData(saveData.dTreeVertex);
    setModelData(saveData.graph)
    setDecoyModelData(saveData.dGrraph)
    setTreeData(saveData.tree)
    setTotalRenderKey(saveData.renderKeys)
    setTotalModelKeys(saveData.modelKeys)
    setCurrentObjects(new Graph(newVertices, newArrows));
    updateArrows()
    setSelectedFolderKey(1)
    setNewRenderKey(1)
    setNewModel(1)
    drawAll()



    console.log("load finished")

}

export function importLoad(jsonString){
    //load the file
    if (jsonString == null) return;
    let saveData = JSON.parse(jsonString);
    //prompt user to name the new package



    //Models and folders,treevertex's need to be given new keys
    //arrows and vertex's will need new keys to match their updated parent keys
    let folderKeyMap = [];
    let modelKeyMap = [];
    let renderKeys = getTotalRenderKeys();
    let modelKeys = getTotalModels();

    console.log(saveData)

    //assign a new key for each package/vertex
    for(let folder of saveData.packages){
        renderKeys++;
        let folderKey = {originalKey: folder.renderKey, originalParentKey: folder.parentRenderKey, newKey: renderKeys, newParentKey: 0}
        folderKeyMap.push(folderKey)
    }
    for(let vert of saveData.treeVertex){
        renderKeys++;
        let folderKey = {originalKey: vert.renderKey, originalParentKey: vert.parentRenderKey, newKey: renderKeys, newParentKey: 0}
        folderKeyMap.push(folderKey)
    }
    for(let model of saveData.graph){
        modelKeys++;
        let modelKey = {originalModeltKey: model.modelKey, originalKey: model.renderKey, newModelKey: modelKeys, newKey: 0}
        modelKeyMap.push(modelKey)
    }

    //assign new relative parent keys
    for(let packages of folderKeyMap){
        for(let packagesCompare of folderKeyMap){
            if(packages.originalParentKey === packagesCompare.originalKey){
                packages.newParentKey = packagesCompare.newKey;
            }
        }
    }

    for(let models of modelKeyMap){
        for(let packages of folderKeyMap){
            if(models.originalKey === packages.originalKey){
                models.newKey = packages.originalKey;
            }
        }
    }

    console.log(folderKeyMap)
    console.log(modelKeyMap)


    //assign the new keys to the vertex's model's and packages

    for(let i = 0; i < saveData.packages.length; i++){
        saveData.packages[i].renderKey = folderKeyMap[i].newKey;
        saveData.packages[i].parentRenderKey = folderKeyMap[i].newParentKey;

        saveData.dPackages[i].renderKey = folderKeyMap[i].newKey;
        saveData.dPackages[i].parentRenderKey = folderKeyMap[i].newParentKey;
    }

    for(let i = saveData.packages.length; i < saveData.packages.length + saveData.treeVertex.length; i++){
        saveData.treeVertex[i - saveData.packages.length].renderKey = folderKeyMap[i].newKey;
        saveData.treeVertex[i - saveData.packages.length].parentRenderKey = folderKeyMap[i].newParentKey;

        saveData.dTreeVertex[i - saveData.packages.length].renderKey = folderKeyMap[i].newKey;
        saveData.dTreeVertex[i - saveData.packages.length].parentRenderKey = folderKeyMap[i].newParentKey;
    }

    //assign the new keys to vertex's and arrows

    




    //recreat vertex/arrow objects as in load()

    //models,folders,tree verts need to be added to current data
    //vertex's and arrows add to current data
    //set the new currentkeys and currentmodels
    //update arrows drawall
     

 return;
}

//Loads saveData in memory (not from json string)
function loadDirect(saveData){

    setTranslationColumns(saveData.translationColumns)
    setFolderData(saveData.packages);
    setDecoyFolderData(saveData.dPackages);
    setVertexData(saveData.treeVertex);
    setDecoyVertexData(saveData.dTreeVertex);
    setModelData(saveData.graph)
    setDecoyModelData(saveData.dGrraph)
    setTreeData(saveData.tree)
    setTotalRenderKey(saveData.renderKeys)
    setTotalModelKeys(saveData.modelKeys)
    setCurrentObjects(new Graph(saveData.vertices, saveData.arrow));
    updateArrows()
    setSelectedFolderKey(saveData.currentFol)
    setNewRenderKey(saveData.currentKey)
    setNewModel(saveData.currentMod)
    drawAll()

}

// index 0 is the most recent change
let saveStates = []
let currentState = 0
//Save states limit as its all stored in memeory (save states are relativley small though and only scale to be a few kilobytes per object though)
let maxSavedStates = 10; //Could probably get away with a limit in the range of 20-50 for really large model "depositories"

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
    console.log('end')
    console.log(saveStates)
}

//I beleive the first part of the if statement can be deleted as part 2 covers it ie.there will never be 11 savestates, but havent tested yet
export function undo(){
    if(currentState < (maxSavedStates - 1) && saveStates[currentState + 1] !== undefined && saveStates.length !== 0){
        currentState ++
        loadDirect(saveStates[currentState])
    }
    console.log(currentState)
}

export function redo(){
    if(currentState > 0 && saveStates.length !== 0){
        currentState --
        loadDirect(saveStates[currentState])
    }
    console.log(currentState)
}