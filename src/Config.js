import { handleAddGraph, handleAddPackage, handleAddVertex } from "./UIElements/ContainmentTree";

//Icons used for Treeview objects
let packageIcon = "📁";
let treeVertexEmptyIcon = "🟧";
let treeVertexFullIcon = "📂";
let graphIcon = '📈';

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

//Objects inititally created
export function initialObjects(){
    handleAddPackage("Package");
    handleAddGraph("Graph",1) 
    handleAddPackage("Subfolder",1)
    handleAddVertex("Vertex",1)
    handleAddVertex("Vertex 2",1)
    handleAddPackage("Package 2")
    handleAddGraph("Graph 2",4)
    handleAddVertex("Vertex 3",4)
    

}


            
            
