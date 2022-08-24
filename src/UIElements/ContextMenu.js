import { ClickAwayListener } from '@material-ui/core';
import React from 'react';
import {getFolderData,setFolderData,getModelData,getSelectedFolderKey,setSelectedFolderKey,handleModelRebase,handleRenameFolder, handleAddModel} from "./ContainmentTree"
import {getCurrentRenderKey, setNewRenderKey, getCurrentModel, setNewModel, findIntersected, getGraphXYFromMouseEvent, getObjectFromUUID, getCurrentObjects,setCurrentObjects,
    linkContainer,updateLinkedContainers, currentObjects} from "./CanvasDraw";
import {setLeftMenuToTree} from "./LeftMenu"
import { ContactsOutlined, LocalConvenienceStoreOutlined } from '@material-ui/icons';
import {getSemanticIdentity} from "../DataStructures/Vertex"
let rightClickedItem = "Default"; //Name of the right clicked item where "Default" is a non-object such as empty canvas space
let rightClickedItemType = "None"
let rightClickedItemKey = 0; // Identifying key of selected item needed to use relating methods eg. selectedFolderKey, ModelKey,VertexKey.
let menuType = "Default"; //Which menu type to return based on the selected item and what operations are available to it
let rightClickedObject; // the canvas object which was right clicked

//Right click menu component used to access certain function of program
export class ContextMenu extends React.Component {
    constructor(props){ // added the constructer to drag props in from MainView class (setLeftMenuToTree function)
        super(props);
    }
    
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

    //The handle click method will check which option has been clicked and call the relevant method
    handleClick = (e) => {
        //ignore clicks if context menu closed
        if (this.state.showMenu) {
            //console.log(e.target.id)
            
            //If Move model was selected, create a new context menu with available folders
            if(e.target.id === "MoveModel"){
                menuType = "MoveModel";
                this.setState({showMenu: true})
            }
            else if(menuType === 'MoveModel' && e.target.id.includes("Folder")){
                let newFolderKey = e.target.id.replace("Folder",'')
                //console.log(newFolderKey) 
                handleModelRebase(rightClickedItemKey,parseInt(newFolderKey));
                console.log("model ", rightClickedItemKey, " moved to folder id ",newFolderKey)
                this.setState({showMenu: false})
                this.props.setLeftMenuToTree();
            }
            else if(e.target.id === "Rename"){
                menuType = "Rename";
                this.setState({showMenu: true})
            }
            else if(e.target.id === "RenameBox" || e.target.id === "CMSelected"){ //This prevents the context menu closing when certain targets are clicked
            }
            else if(e.target.id === "Create-Graph"){
                menuType = "AddContainerModel";
                this.setState({showMenu: true})
            }
            else if(menuType === 'AddContainerModel' && e.target.id.includes("Folder")){
                console.log(rightClickedObject)  
                let newFolderKey = e.target.id.replace("Folder",'')
                handleAddModel(rightClickedObject.title,parseInt(newFolderKey),rightClickedObject.semanticIdentity)
            }
            else if(e.target.id === "LinkContainer"){
                menuType = "LinkContainer";
                this.setState({showMenu: true})
                console.log(getCurrentObjects().rootVertices)
            }

            
            else{this.setState({ showMenu: false });}
            
        }
    }

    handleKey = (e) => {
        if(e.key === 'Enter'){
            if(menuType === "Rename"){
                let newName = document.getElementById("RenameBox").value
                handleRenameFolder(newName,rightClickedItemKey)
                console.log("menu change")
                try{
                this.props.setLeftMenuToTree();
                }
                catch(e){ //Not sure why theres an error here as it performs the method, then says the method doesnt exists, doesnt trigger on other uses of method either.-Lachlan
                    console.log(e)
                }
                console.log("menu change fin")
                this.setState({ showMenu: false })
            }
    }
        /*if(e.key === 'Enter'){
            console.log("enter pressed")
        }
        */
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

        //console.log(e.target.className)

        //If target is tree node
        if(e.target.className === "jstree-anchor jstree-hovered jstree-clicked"){
            //console.log("clicked a tree object")
            //if target is existing folder, load the folder menu
            if(e.target.text.includes("📁")){
                for(let folder of getFolderData()){
                    if(e.target.text === folder.text){
                        //console.log("matching folder found")
                        menuType = "Folder"
                        rightClickedItem = e.target.text;
                        rightClickedItemKey = getSelectedFolderKey();
                    }
                }
            }

            //if target is existing model, load model menu
            if(e.target.text.includes("📈")){
                for(let model of getModelData()){
                    if(e.target.text === model.text){
                        //console.log("matching model found")
                        menuType = "Model"
                        rightClickedItem = e.target.text;
                        rightClickedItemKey = getCurrentModel();
                    }
                }
            }
            
        }
        // if target exists within the canvas
        else if(e.target.id ==="drawCanvas"){
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
                        menuType = "Vertex"
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
            else if(menuType === "Folder"){
                return (

                //options are given classnames to identify what has been selected
                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected">{rightClickedItem}</div>   
                    <div className="CMitem" id="Rename"> Rename</div>
                    </div>
                )
            }
            else if(menuType === "Model"){
                return (

                //options are given classnames to identify what has been selected
                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected"> {rightClickedItem} </div>   
                    <div className="CMitem" id="Navigate"> Navigate (not implemented) </div>
                    <div className="CMitem" id="MoveModel"> Move To </div>
                    </div>
                )
            }
            else if(menuType === "MoveModel"){

                let renderedOutput = getFolderData().map(item => <div className="CMitem" id={'Folder'+ item.renderKey} key={item.text}> {item.text} </div>);

                return (

                //options are given classnames to identify what has been selected
                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected"> Move "{rightClickedItem}" To:</div>   
                    <div>{renderedOutput}</div>
                    </div>
                )
            }
            else if(menuType === "Rename"){
                return (

                //options are given classnames to identify what has been selected
                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected"> {rightClickedItem} </div>   
                    <input className="CMText" id="RenameBox" type="text" name="renameItem" placeholder='new Name'/>
                    
                    </div>
                )
            }
            else if(menuType === "Arrow"){
                return (

                //options are given classnames to identify what has been selected
                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected"> {rightClickedItem} </div>   
                    <div className="CMitem" id="Auto-Layout"> Auto-Layout option (not implemented) </div>
                    </div>
                )
            }
            else if(menuType === "Vertex"){
                return (

                //options are given classnames to identify what has been selected
                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected"> {rightClickedItem} </div>   
                    <div className="CMitem" id="Auto-Layout"> Auto-Layout option (not implemented) </div>
                    </div>
                )
            }
            else if(menuType === "Container"){
                return (

                //options are given classnames to identify what has been selected
                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected"> {rightClickedItem} </div>
                    <div className="CMitem" id="Create-Graph"> Create Graph </div>   
                    <div className="CMitem" id="LinkContainer"> Link Container </div> 
                    <div className="CMitem" id="Auto-Layout"> Auto-Layout option (not implemented) </div>
                    </div>
                )
            }
            else if(menuType === "LinkContainer"){
                console.log(getCurrentObjects().rootVertices)
                let vertices = Array.from(getCurrentObjects().rootVertices)
                console.log(vertices)
                
                let renderedOutput = vertices.map(item => <div className="CMitem" id={'Vertex'+ item.vertex.semanticIdentity.UUID} key={'Vertex'+ item.vertex.semanticIdentity.UUID}> {item.vertex.title} </div>);
                
                console.log(renderedOutput)

                return (

                //options are given classnames to identify what has been selected
                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected"> {rightClickedItem} </div>
                    <div>{renderedOutput}</div>
                    </div>
                    
                )
            }
            else if(menuType === "AddContainerModel"){
                
                let renderedOutput = getFolderData().map(item => <div className="CMitem" id={'Folder'+ item.renderKey} key={item.text}> {item.text} </div>);

                return (

                //options are given classnames to identify what has been selected
                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMSelected" id="CMSelected"> Create Model in:</div>   
                    <div>{renderedOutput}</div>
                    </div>
                )
            }
        }
    else return null;
  }
}
