import {addObject, currentObjects, drawAll, getCurrentModel, getCurrentObjects, getCurrentRenderKey, getTotalModels, getTotalRenderKeys, 
    setCurrentObjects, setNewModel, setNewRenderKey, setTotalModelKeys, setTotalRenderKey, updateArrows} from "../UIElements/CanvasDraw"

import {setTranslationColumns, translationColumns} from "../UIElements/SemanticDomainEditor"

import {Vertex} from "../DataStructures/Vertex";
import {Arrow} from "../DataStructures/Arrow";
import {Cardinality} from "../DataStructures/Cardinality";
import {EdgeEnd} from "../DataStructures/EdgeEnd";
import {Graph} from "../DataStructures/Graph";
import { SemanticIdentity } from "../DataStructures/SemanticIdentity";
import { getDecoyFolderData, getDecoyModelData, getDecoyVertexData, getFolderData, getModelData, getSelectedFolderKey, getTreeData, getVertexData, setDecoyFolderData, setDecoyModelData, setDecoyVertexData, setFolderData, setModelData, setSelectedFolderKey, setTreeData, setVertexData } from "../UIElements/ContainmentTree";


//Get all the data that needs to be saved, to restore a session
// .slice() only creates a shallow copy of arrays which means that it copies literal values but only makes referneces to arrays and objects.
// turning the object into a string and back into an object creates a deep copy which is an actual standalone copy and not an array of references
export function getSaveData() {
    let vertexObjects = currentObjects.flatten(true, false);
    let arrowObjects = currentObjects.flatten(false, true);
    let treeData = JSON.parse(JSON.stringify(getTreeData()))
    let folderData = JSON.parse(JSON.stringify(getFolderData()))
    let decoyFolderData = JSON.parse(JSON.stringify(getDecoyFolderData()))

    let vertexData = JSON.parse(JSON.stringify(getVertexData()));
    let decoyVertexData = JSON.parse(JSON.stringify(getDecoyVertexData()));

    let modelObjects = JSON.parse(JSON.stringify(getModelData()));
    let decoyModelObjects = JSON.parse(JSON.stringify(getDecoyModelData())) 

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
        dGraph: decoyModelObjects,
        renderKeys: totalRenderKeys,
        modelKeys: totalModels,
        currentKey: currentKey,
        currentMod: currentModel,
        currentFol: currentFolder,
        



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

//Import a package or save file into root
export function importLoad(jsonString){
    //load the file
    if (jsonString == null) return;
    let saveData = JSON.parse(jsonString);

    //Models and folders,treevertex's need to be given new keys
    //arrows and vertex's will need new keys to match their updated parent keys
    let folderKeyMap = [];
    let modelKeyMap = [];
    let renderKeys = getTotalRenderKeys();
    let modelKeys = getTotalModels();



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
        let modelKey = {originalModelKey: model.modelKey, originalKey: model.renderKey, newModelKey: modelKeys, newKey: 0}
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
                models.newKey = packages.newKey;
            }
        }
    }



    //assign the new keys to the vertex's, model's and packages

    for(let i = 0; i < saveData.packages.length; i++){
        saveData.packages[i].renderKey = folderKeyMap[i].newKey;
        saveData.packages[i].parentRenderKey = folderKeyMap[i].newParentKey;

        saveData.packages[i].data.renderKey = folderKeyMap[i].newKey;
        saveData.packages[i].data.parentRenderKey = folderKeyMap[i].newParentKey;

        saveData.dPackages[i].renderKey = folderKeyMap[i].newKey;
        saveData.dPackages[i].parentRenderKey = folderKeyMap[i].newParentKey;
    }

    for(let i = saveData.packages.length; i < saveData.packages.length + saveData.treeVertex.length; i++){
        saveData.treeVertex[i - saveData.packages.length].renderKey = folderKeyMap[i].newKey;
        saveData.treeVertex[i - saveData.packages.length].parentRenderKey = folderKeyMap[i].newParentKey;

        saveData.treeVertex[i - saveData.packages.length].data.renderKey = folderKeyMap[i].newKey;
        saveData.treeVertex[i - saveData.packages.length].data.parentRenderKey = folderKeyMap[i].newParentKey;

        saveData.dTreeVertex[i - saveData.packages.length].renderKey = folderKeyMap[i].newKey;
        saveData.dTreeVertex[i - saveData.packages.length].parentRenderKey = folderKeyMap[i].newParentKey;
    }

    for(let i =0; i< saveData.graph.length; i++){
        saveData.graph[i].renderKey = modelKeyMap[i].newKey
        saveData.graph[i].modelKey = modelKeyMap[i].newModelKey

        saveData.graph[i].data.renderKey = modelKeyMap[i].newKey
        saveData.graph[i].data.modelKey = modelKeyMap[i].newModelKey

        saveData.dGraph[i].renderKey = modelKeyMap[i].newKey
        saveData.dGraph[i].modelKey = modelKeyMap[i].newModelKey
    }

    //assign the new keys to vertex's and arrows
    for(let packages of folderKeyMap){
        for(let vertex of saveData.vertices){
            if(vertex.vertexRenderKey === packages.originalKey){
                vertex.vertexRenderKey = packages.newKey;
            }
        }

        for(let arrow of saveData.arrows){
            if(arrow.arrowRenderKey === packages.originalKey){
                arrow.arrowRenderKey = packages.newKey;
            }
        }
            
    }

    for(let models of modelKeyMap){
        for(let vertex of saveData.vertices){
            if(vertex.vertexModelKey === models.originalModelKey){
                vertex.vertexModelKey = models.newModelKey;
            }
        }

        for(let arrow of saveData.arrows){
            if(arrow.arrowModelKey === models.originalModelKey){
                arrow.arrowModelKey = models.newModelKey;
            }
        }
    }
    
    console.log(saveData.arrows)



    //recreat vertex/arrow objects as in load()

    var newVertices = [];
    var newArrows = [];
    for(let vert of saveData.vertices){
        vert.semanticIdentity = new SemanticIdentity(vert.semanticIdentity.name,vert.semanticIdentity.description,vert.semanticIdentity.abbreviation,
            vert.semanticIdentity.shortAbbreviation,vert.semanticIdentity.UUID,vert.semanticIdentity.translations)
        //atm its a bit messy as vert constructor doesnt use destructuring so we can specifiy options, when it does this can be changed
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
            newArrow.setRenderKey(arrow.arrowRenderKey)
            newArrow.setModelKey(arrow.arrowModelKey)
            newArrow.sourceEdgeEnd = remakeEdge(arrow.sourceEdgeEnd);
            newArrow.destEdgeEnd = remakeEdge(arrow.destEdgeEnd);
            return newArrow;
    }

    for(let arrow of saveData.arrows){
        arrow = remakeArrow(arrow)
        newArrows.push(arrow)
    }


    //models,folders,tree verts need to be added to current data

    setFolderData(getFolderData().concat(saveData.packages))
    setDecoyFolderData(getDecoyFolderData().concat(saveData.dPackages))

    setVertexData(getVertexData().concat(saveData.treeVertex))
    setDecoyVertexData(getDecoyVertexData().concat(saveData.dTreeVertex))

    setModelData(getModelData().concat(saveData.graph)) 
    setDecoyModelData(getDecoyModelData().concat(saveData.dGraph))


    //vertex's and arrows add to current data

    console.log(getCurrentObjects())
    console.log(newVertices)

    for(let vertex of newVertices){
        addObject(vertex)
    }
    for(let arrow of newArrows){
        addObject(arrow)
    }

    //reset current keys to reload a few things eg. turn any loaded vertices invisible is they were present in save

    setSelectedFolderKey(getSelectedFolderKey())
    setNewRenderKey(getCurrentRenderKey())
    setNewModel(getCurrentModel())
    //set the new latest index's
    setTotalRenderKey(renderKeys)
    setTotalModelKeys(modelKeys)
    //update arrows drawall
    updateArrows()
    drawAll()

    console.log(getCurrentObjects())
     

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
    setCurrentObjects(new Graph(saveData.vertices, saveData.arrows));
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