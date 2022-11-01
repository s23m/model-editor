import { handleAddGraph, handleAddPackage, handleAddVertex } from "./UIElements/ContainmentTree";

//Icons used for Treeview objects
const packageIcon = "📁";
const treeVertexEmptyIcon = "🟧";
const treeVertexFullIcon = "📂";
const graphIcon = '📈';

export function getPackageIcon(){
    return packageIcon;
}

export function getTreeVertexEmptyIcon(){
    return treeVertexEmptyIcon;
}

export function getTreeVertexFullIcon(){
    return treeVertexFullIcon;
}

export function getGraphIcon(){
    return graphIcon;
}

//How many times you can undo/redo from an action
//Save states limited as its all stored in memeory (save states are relativley small though and only scale to be a few kilobytes per object though)
const maxSaveStates = 20;

export function getMaxSaveStates(){
    return maxSaveStates;
}

//Objects inititally created
export function initialObjects(){
    handleAddPackage("Package");
    handleAddGraph("Graph",1) 
    handleAddPackage("SubPackage",1)
    handleAddVertex("Vertex",1)
    handleAddVertex("Vertex 2",1)
    handleAddPackage("Package 2")
    handleAddGraph("Graph 2",5)
    handleAddVertex("Vertex 3",5)

}

//true to use static implementation of category selector, false to use dynamic
const isStatic = true;

export function getIsStatic(){
    return isStatic;
}
            
            
