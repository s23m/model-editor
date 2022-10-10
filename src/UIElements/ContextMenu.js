import React from 'react';
import {getPackageData,getGraphData,getSelectedPackageKey,setSelectedPackageKey,handleGraphRebase,handleRenamePackage, handleAddGraph, getGraphNameFromKey,
    handleAddPackage, handleDeletePackage, handleDeleteGraph, handleRenameGraph} from "./ContainmentTree"
import { setNewContainerKey, getCurrentGraph, setNewGraph, findIntersected, getGraphXYFromMouseEvent, getObjectFromUUID, getCurrentObjects,
     currentObjects, drawAll, updateVertex} from "./CanvasDraw";
import {handleAddVertex, handleDeleteVertex, getVertexData} from "./ContainmentTree";
import { createSaveState } from '../Serialisation/NewFileManager';
import { getGraphIcon, getPackageIcon, getTreeVertexEmptyIcon, getTreeVertexFullIcon } from '../Config';

//Name of the right clicked item where "Default" is a non-object such as empty canvas space
let rightClickedItem = "Default"; 
// Index of selected item
let rightClickedItemKey = 0; 
// the canvas object which was right clicked
let rightClickedObject; 
//Which menu type to return based on the selected item
let menuType = "Default"; 

//Right click menu component used to access certain function of program
export class ContextMenu extends React.Component {

    state = {
        xPos: "0px",
        yPos: "0px",
        showMenu: false
    }

    componentDidMount() {
        document.addEventListener("click", this.handleClick);
        document.addEventListener("contextmenu", this.handleContextMenu);
        document.addEventListener("keypress", this.handleKey);

    }

    componentWillUnmount() {
        document.removeEventListener("click", this.handleClick);
        document.removeEventListener("contextmenu", this.handleContextMenu);
        document.removeEventListener("keypress", this.handleKey);
    }

    //The handle click method will check which menu option has been clicked and call the relevant method
    handleClick = (e) => {
        //ignore clicks if context menu closed
        if (this.state.showMenu) {
            
            //If Move graph was selected, create a new context menu with available package
            if(e.target.id === "MoveGraph"){
                menuType = "MoveGraph";
                this.setState({showMenu: true})
            }
            else if(menuType === 'MoveGraph' && e.target.id.includes("Package")){
                let newPackageKey = e.target.id.replace("Package",'')
                handleGraphRebase(rightClickedItemKey,parseInt(newPackageKey));
                this.setState({showMenu: false})
                this.props.setLeftMenuToTree();
            }
            else if(e.target.id === "Rename"){
                menuType = "Rename";
                this.setState({showMenu: true})
            }
            else if(e.target.id === "RenameVertex"){
                menuType = "RenameVertex";
                this.setState({showMenu: true})
            }
            else if(e.target.id === "RenameGraph"){
                menuType = "RenameGraph";
                this.setState({showMenu: true})
            }
            else if(e.target.id === "AddVertex"){
                menuType = "AddVertex";
                this.setState({showMenu: true})
            }
            else if(e.target.id === "AddGraph"){
                menuType = "AddGraph";
                this.setState({showMenu: true})
            }
            else if(e.target.id === "AddPackage"){
                menuType = "AddPackage";
                this.setState({showMenu: true})
            }
            else if(e.target.id === "DeletePackage"){
                menuType = "DeletePackage";
                this.setState({showMenu: true})
            }
            else if(e.target.id === "DeleteVertex"){
                menuType = "DeleteVertex";
                this.setState({showMenu: true})
            }
            else if(e.target.id === "DeleteGraph"){
                menuType = "DeleteGraph";
                this.setState({showMenu: true})
            }
            else if(e.target.id === "DeleteVertexConfirmed"){
                for(let vertex of getVertexData()){
                    if(vertex.containerKey === rightClickedItemKey){
                        handleDeleteVertex(vertex.semanticIdentity.UUID)
                    }
                }
                this.setState({showMenu: false})
                this.props.setLeftMenuToTree();
                createSaveState();
            }
            else if(e.target.id === "DeletePackageConfirmed"){
                for(let packages of getPackageData()){
                    if(packages.containerKey === rightClickedItemKey){
                        handleDeletePackage(rightClickedItemKey)
                    }
                }
                this.setState({showMenu: false})
                this.props.setLeftMenuToTree();
                createSaveState();
            }
            else if(e.target.id === "DeleteGraphConfirmed"){
                for(let graph of getGraphData()){
                    if(graph.graphKey === rightClickedItemKey){
                        handleDeleteGraph(rightClickedItemKey)
                    }
                }
                this.setState({showMenu: false})
                this.props.setLeftMenuToTree();
                createSaveState();
            }
            //The Empty Else ifs prevent the context menu closing when certain targets are clicked
            else if(e.target.id === "RenameBox" || e.target.id === "CMSelected"){ 
            }
            else if(e.target.id === "RenameVertexBox" || e.target.id === "CMSelected"){
            }
            else if(e.target.id === "RenameGraphBox" || e.target.id === "CMSelected"){
            }
            else if(e.target.id === "VertexNameBox" || e.target.id === "CMSelected"){
            }
            else if(e.target.id === "GraphNameBox" || e.target.id === "CMSelected"){ 
            }
            else if(e.target.id === "PackageNameBox" || e.target.id === "CMSelected"){ 
            }
            else if(e.target.id === "Create-Graph"){
                menuType = "AddContainerGraph";
                this.setState({showMenu: true})
            }
            else if(e.target.id === "Bi-Nav"){
                menuType = "Bi-Nav";
                this.setState({showMenu: true})
            }
            else if(menuType === 'Bi-Nav' && e.target.id.includes("Nav")){
                let keys = e.target.id.replace("Nav",'');

                setNewGraph(parseInt(keys[0]));
                setNewContainerKey(keys[1]); // automatically sets the containerkey to be the same as the graph as this was causing issues - cooper
                setSelectedPackageKey(keys[1]);
                for (let item of currentObjects.flatten()){
                    if (item.typeName === "Vertex" && item.getGraphKey() === getCurrentGraph()){
                        item.setPresent();
                    }
                    else if (item.getGraphKey() !== getCurrentGraph() && item.typeName === "Vertex"){
                        item.setAway();
                    }
                }
                drawAll();
                this.props.setLeftMenuToTree();

                this.setState({showMenu: false})
            }

            else{this.setState({ showMenu: false });}
            
        }
    }

    handleKey = (e) => {
        if(e.key === 'Enter'){
            if(menuType === "Rename"){
                let newName = document.getElementById("RenameBox").value
                handleRenamePackage(newName,rightClickedItemKey)
                try{
                this.props.setLeftMenuToTree();
                }
                catch(e){ //Not sure why theres an error here as it performs the method, then says the method doesnt exists, doesnt trigger on other uses of method either.-Lachlan
                    //believe the issue is enter key event is fireing twice, will fix later, not a critical/detrimental or performance effecting issue - Lachlan
                }
                this.setState({ showMenu: false })
                createSaveState();
            }
            else if(menuType === "RenameGraph"){
                let newName = document.getElementById("RenameGraphBox").value
                handleRenameGraph(newName,rightClickedItemKey)
                try{
                this.props.setLeftMenuToTree();
                }
                catch(e){ 
                    console.log(e)
                }
                this.setState({ showMenu: false })
                createSaveState();
            }
            else if(menuType === "RenameVertex"){
                let newName = document.getElementById("RenameVertexBox").value
                rightClickedObject.text = newName;
                rightClickedObject.data.text = newName;
                try{
                this.props.setLeftMenuToTree();
                }
                catch(e){ 
                    console.log(e)
                }
                updateVertex(rightClickedObject);
                this.setState({ showMenu: false })
                drawAll()
                createSaveState();
            }
            else if(menuType === "AddVertex"){
                
                let vertexName = document.getElementById("VertexNameBox").value;
                handleAddVertex(vertexName, getSelectedPackageKey());
                try{
                this.props.setLeftMenuToTree();
                }
                catch(e){
                    console.log(e);
                }
                this.setState({showMenu: false});
                createSaveState();
            }
            else if(menuType === "AddGraph"){
                
                let graphName = document.getElementById("GraphNameBox").value;
                handleAddGraph(graphName, getSelectedPackageKey());
                try{
                this.props.setLeftMenuToTree();
                }
                catch(e){
                    console.log(e);
                }
                this.setState({showMenu: false});
                createSaveState();
            }
            else if(menuType === "AddPackage"){
                
                let packageName = document.getElementById("PackageNameBox").value;
                handleAddPackage(packageName, getSelectedPackageKey());
                try{
                this.props.setLeftMenuToTree();
                }
                catch(e){
                    console.log(e);
                }
                this.setState({showMenu: false});
                createSaveState();
            }
        }
    }

    
    handleContextMenu = (e) => {
        e.preventDefault();//prevent default stops the regular contextmenu from appearing

        /*as alot of the "data" is in the back end and not in the html element displayed,
         we need to simulate a left click to actually select what were right clicking on in the background 
         */
        e.target.click();

        menuType = "Default"; //reset the menu type
        rightClickedItem = "Default" //reset the selected item
        rightClickedItemKey = 0 //reset the index
        rightClickedObject = null; // reset the object
        


        //If target is tree node
        if(e.target.className === "jstree-anchor jstree-hovered jstree-clicked"){
            //if target is existing package, load the package menu
            if(e.target.text.includes(getPackageIcon())){
                for(let packages of getPackageData()){
                    if(e.target.text === packages.text){
                        menuType = "Package"
                        rightClickedItem = e.target.text;
                        rightClickedItemKey = getSelectedPackageKey();
                    }
                }
            }

            //if target is existing graph, load graph menu
            if(e.target.text.includes(getGraphIcon())){
                for(let graph of getGraphData()){
                    if(e.target.text === graph.text){
                        menuType = "Graph"
                        rightClickedItem = e.target.text;
                        rightClickedItemKey = getCurrentGraph();
                    }
                }
            }
            //if target is existing vertex load vertex menu
            if(e.target.text.includes(getTreeVertexEmptyIcon()) || e.target.text.includes(getTreeVertexFullIcon())){
                for(let vertex of getVertexData()){
                    if(e.target.text === vertex.text){
                        menuType = "Vertex"
                        rightClickedObject = vertex;
                        rightClickedItem = e.target.text;
                        rightClickedItemKey = getSelectedPackageKey();

                    }
                }
            }

            if(e.target.text === "Root"){
                
                menuType = "Root"
                rightClickedItem = e.target.text;
                rightClickedItemKey = getSelectedPackageKey();
            }
            
        }

        
        // if target exists within the canvas
        if(e.target.id ==="drawCanvas"){
            let position = getGraphXYFromMouseEvent(e);
            let x = position[0]; let y = position[1];
            rightClickedObject = findIntersected(x, y);
            if(rightClickedObject !== null){
                if(rightClickedObject.typeName === "Vertex"){
                    rightClickedItem = rightClickedObject.title
                    if(rightClickedObject.isContainer === true){
                        menuType = "Container"
                    }
                    else{
                        menuType = "CanvasVertex"
                    }
                    
                }
                else if(rightClickedObject.typeName === "Arrow"){
                    let source = getObjectFromUUID(rightClickedObject.sourceVertexUUID);
                    let dest = getObjectFromUUID(rightClickedObject.destVertexUUID);
                    let sourceName = source.title;
                    let destName = dest.title;
                    rightClickedItem = "Arrow from " + sourceName + " to " + destName
                    menuType = "Arrow"
                }
            }
            
        }
        this.setState({
            xPos: `${e.pageX}px`,
            yPos: `${e.pageY}px`,
            showMenu: true,
          });
        
    };
    

    render() {
        const { showMenu, yPos, xPos } = this.state;
        if (showMenu){
            if(menuType === "Default"){
                return (

                //options are given classnames to identify what has been selected
                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected">Default</div>   

                    </div>
                )
            }
            else if(menuType === "Package"){
                return (

                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected"><b>{rightClickedItem}</b></div>   
                    <div className="CMitem" id="Rename"> Rename</div>
                    <div className="CMitem" id="AddVertex"> Add Vertex</div>
                    <div className="CMitem" id="AddGraph"> Add Graph</div>
                    <div className="CMitem" id="AddPackage"> Add Package</div>
                    <div className="CMitem" id="DeletePackage"> Delete Package</div>
                    </div>
                )
            }
            else if(menuType === "Root"){
                return (

                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected"><b>{rightClickedItem}</b></div>   
                    <div className="CMitem" id="AddPackage"> Add Package</div>
                    </div>
                )
            }
            else if(menuType === "DeletePackage"){
                return (

                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected"><b>Are you sure you wish to delete: {rightClickedItem}</b></div>   
                    <div className="CMitem" id="DeletePackageConfirmed"> Yes, Delete this package</div>
                    <div className="CMitem" id="DeletePackageCancel"> No</div>
                    </div>
                )
            }
            else if(menuType === "DeleteGraph"){
                return (

                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected"><b>Are you sure you wish to delete: {rightClickedItem}</b></div>   
                    <div className="CMitem" id="DeleteGraphConfirmed"> Yes, Delete this graph</div>
                    <div className="CMitem" id="DeleteGraphCancel"> No</div>
                    </div>
                )
            }
            else if(menuType === "DeleteVertex"){
                return (

                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected"><b>Are you sure you wish to delete: {rightClickedItem}</b></div>   
                    <div className="CMitem" id="DeleteVertexConfirmed"> Yes, Delete this vertex</div>
                    <div className="CMitem" id="DeleteVertexCancel"> No</div>
                    </div>
                )
            }
            else if(menuType === "Graph"){
                return (

                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected"> <b>{rightClickedItem}</b> </div>   
                    <div className="CMitem" id="RenameGraph"> Rename </div>
                    <div className="CMitem" id="MoveGraph"> Move To </div>
                    <div className="CMitem" id="DeleteGraph"> Delete Graph </div>
                    </div>
                )
            }
            else if(menuType === "MoveGraph"){

                let renderedOutput = getPackageData().map(item => <div className="CMitem" id={"Package"+ item.containerKey} key={item.text}> {item.text} </div>);

                return (

                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected"> Move "<b>{rightClickedItem}</b>" To:</div>   
                    <div>{renderedOutput}</div>
                    </div>
                )
            }
            else if(menuType === "Rename"){
                return (

                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected"> <b>{rightClickedItem}</b> </div>   
                    <input className="CMText" id="RenameBox" type="text" name="renameItem" placeholder='New Name'/>
                    </div>
                )
            }
            else if(menuType === "RenameGraph"){
                return (

                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected"> <b>{rightClickedItem}</b> </div>   
                    <input className="CMText" id="RenameGraphBox" type="text" name="renameItem" placeholder='New Name'/>
                    </div>
                )
            }
            else if(menuType === "RenameVertex"){
                return (

                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected"> <b>{rightClickedItem}</b> </div>   
                    <input className="CMText" id="RenameVertexBox" type="text" name="renameItem" placeholder='New Name'/>
                    </div>
                )
            }
            else if(menuType === "AddVertex"){
                return (

                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected"> <b>{rightClickedItem}</b> </div>   
                    <input className="CMText" id="VertexNameBox" type="text" name="nameVertex" placeholder='Vertex Name'/>
                    </div>
                )
            }
            else if(menuType === "AddPackage"){
                return (

                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected"> <b>{rightClickedItem}</b> </div>   
                    <input className="CMText" id="PackageNameBox" type="text" name="namePackage" placeholder='Package Name'/>
                    </div>
                )
            }
            else if(menuType === "AddGraph"){
                return (

                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected"> <b>{rightClickedItem}</b> </div>   
                    <input className="CMText" id="GraphNameBox" type="text" name="nameGraph" placeholder='Graph Name'/>
                    </div>
                )
            }
            else if(menuType === "Vertex"){
                return (

                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected"> <b>{rightClickedItem}</b> </div>
                    <div className="CMitem" id="Bi-Nav"> Naviagte </div>   
                    <div className="CMitem" id="RenameVertex"> Rename</div>
                    <div className="CMitem" id="AddVertex"> Add Vertex</div>
                    <div className="CMitem" id="AddGraph"> Add Graph</div>
                    <div className="CMitem" id="AddPackage"> Add Package</div>
                    <div className="CMitem" id="DeleteVertex"> Delete Vertex </div>
                    </div>
                )
            }

            else if(menuType === "Arrow"){
                return (

                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected"> <b>{rightClickedItem}</b> </div>   
                    <div className="CMitem" id="Auto-Layout"> Auto-Layout option (not implemented) </div>
                    </div>
                )
            }
            else if(menuType === "CanvasVertex"){
                return (

                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected"> <b>{rightClickedItem}</b> </div>   
                    <div className="CMitem" id="Auto-Layout"> Auto-Layout option (not implemented) </div>
                    <div className="CMitem" id="Bi-Nav"> Naviagte </div>
                    </div>
                )
            }
           
            else if(menuType === "Bi-Nav"){

                let matchingContainers = [];
                let matchingGraphs = [];
                let matchingUUID = 0;

                matchingUUID = rightClickedObject.originalUUID;
                //If undefined, then a treeview vertex is selected
                if(matchingUUID === undefined){
                    matchingUUID = rightClickedObject.semanticIdentity.UUID
                }

                for(let vert of getCurrentObjects().rootVertices){
                    if(vert.vertex.originalUUID === matchingUUID){
                        matchingContainers.push(vert)
                    }
                }
                for(let graph of getGraphData()){
                    if(graph.semanticIdentity.UUID === matchingUUID){
                        matchingGraphs.push(graph)
                    }
                }

                let renderedContainers = matchingContainers.map(item => <div className="CMitem" id={'Nav'+ item.vertex.vertexGraphKey + " " + item.vertex.vertexContainerKey} key={'Nav'+ item.vertex.semanticIdentity.UUID + " " + item.vertex.awayx}> {getGraphNameFromKey(item.vertex.vertexGraphKey)} / {item.vertex.title} </div>)
                let renderedGraphs = matchingGraphs.map(item => <div className="CMitem" id={'Nav'+ item.graphKey + " " + item.containerKey} key={'Nav'+ item.semanticIdentity.UUID}> {item.text}</div>)
                

                return (

                //options are given classnames to identify what has been selected
                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected"> <b>{rightClickedItem}</b> also appears at:</div>   
                    <div>{renderedContainers}</div>
                    <div>{renderedGraphs}</div>
                    </div>
                )
            }
        }
    else return null;
  }
}
