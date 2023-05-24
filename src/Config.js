//Icons used for Treeview objects
const packageIcon = "📁";
const treeVertexEmptyIcon = "🟧";
const treeVertexFullIcon = "📂";
const diagramIcon = '📈';

export function getPackageIcon(){
    return packageIcon;
}

export function getTreeVertexEmptyIcon(){
    return treeVertexEmptyIcon;
}

export function getTreeVertexFullIcon(){
    return treeVertexFullIcon;
}

export function getDiagramIcon(){
    return diagramIcon;
}

//How many times you can undo/redo from an action
//Save states limited as its all stored in memeory (save states are relativley small though and only scale to be a few kilobytes per object though)
const maxSaveStates = 20;

export function getMaxSaveStates(){
    return maxSaveStates;
}

//true to use static implementation of category selector, false to use dynamic
const isStatic = true;

export function getIsStatic(){
    return isStatic;
}
            
            
