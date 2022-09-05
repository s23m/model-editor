import {currentObjects, drawAll, getCurrentObjects, getTotalModels, getTotalRenderKeys, setCurrentObjects, setNewModel, setNewRenderKey, setTotalModelKeys, setTotalRenderKey, updateArrows} from "../UIElements/CanvasDraw"
import {version} from "../UIElements/MainView"
import {setTranslationColumns, translationColumns} from "../UIElements/SemanticDomainEditor"
import {getModelName} from "../UIElements/CanvasDraw";

import {Vertex} from "../DataStructures/Vertex";
import {Arrow} from "../DataStructures/Arrow";
import {Cardinality} from "../DataStructures/Cardinality";
import {EdgeEnd} from "../DataStructures/EdgeEnd";
import {Graph} from "../DataStructures/Graph";
import { SemanticIdentity } from "../DataStructures/SemanticIdentity";
import { getDecoyFolderData, getDecoyModelData, getDecoyVertexData, getFolderData, getModelData, getTreeData, getVertexData, setDecoyFolderData, setDecoyModelData, setDecoyVertexData, setFolderData, setModelData, setSelectedFolderKey, setTreeData, setVertexData } from "../UIElements/ContainmentTree";

//Get all the data that needs to be saved, to restore a session
export function getSaveData() {
    let vertexObjects = currentObjects.flatten(true, false);
    let arrowObjects = currentObjects.flatten(false, true);
    let treeData = getTreeData();
    let folderData = getFolderData();
    let decoyFolderData = getDecoyFolderData();

    let vertexData = getVertexData();
    let decoyVertexData = getDecoyVertexData();

    let modelObjects = getModelData();
    let decoyModelObjects = getDecoyModelData();

    let totalRenderKeys = getTotalRenderKeys();
    let totalModels = getTotalModels();


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
    let title = "s23m model";

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

    


    //Models and arrows need to be converted back to their explicit types

    var newVertices = [];
    var newArrows = [];

    for(let vert of saveData.vertices){
        console.log(vert)
        //atm its a bit messy as vert constructor doesnt use destructuring so we can specifiy options, when it does this can be changed
        vert = new Vertex (0,0,0,0,0,0,0,0,1,vert)
        newVertices.push(vert)
    }
 


    setFolderData(saveData.packages);
    setDecoyFolderData(saveData.dPackages);
    setVertexData(saveData.treeVertex);
    setDecoyVertexData(saveData.dTreeVertex);
    setModelData(saveData.graph)
    setDecoyModelData(saveData.dGrraph)
    setTreeData(saveData.tree)
    setTotalRenderKey(saveData.renderKeys)
    setTotalModelKeys(saveData.modelKeys)
    setSelectedFolderKey(1)
    setNewRenderKey(1)
    setNewModel(1)


    
    setCurrentObjects(new Graph(newVertices, newArrows));
    updateArrows()
    drawAll()



console.log("load finished")

}