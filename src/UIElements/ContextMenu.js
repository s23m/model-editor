import { ClickAwayListener } from '@material-ui/core';
import React from 'react';
import {getFolderData,getModelData,getSelectedFolderKey,setSelectedFolderKey} from "./ContainmentTree"
import {getCurrentRenderKey, setNewRenderKey, getCurrentModel, setNewModel, } from "./CanvasDraw";

let rightClickedItem = "Default"; //Name of the right clicked item where "Default" is a non-object such as empty canvas space
let rightClickedItemKey = 0; // Identifying key of selected item needed to use relating methods eg. selectedFolderKey, ModelKey,VertexKey.
let menuType = "Default"; //Which menu type to return based on the selected item and what operations are available to it

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
    }

    componentWillUnmount() {
        document.removeEventListener("click", this.handleClick);
        document.removeEventListener("contextmenu", this.handleContextMenu);
    }

    //The handle click method will check which option has been clicked and call the relevant method
    handleClick = (e) => {
        if (this.state.showMenu) {
            
            
            
            
            this.setState({ showMenu: false });
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

        console.log(e.target.className)

        //If target is tree node
        if(e.target.className === "jstree-anchor jstree-hovered jstree-clicked"){
            console.log("clicked a tree object")
            //if target is existing folder, load the folder menu
            if(e.target.text.includes("📁")){
                for(let folder of getFolderData()){
                    if(e.target.text === folder.text){
                        console.log("matching folder found")
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
                        console.log("matching model found")
                        menuType = "Model"
                        rightClickedItem = e.target.text;
                        rightClickedItemKey = getCurrentModel();
                    }
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
                    <div className="CMitem">Default</div>   

                    </div>
                )
            }

            if(menuType === "Folder"){
                return (

                //options are given classnames to identify what has been selected
                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMitem">{rightClickedItem}</div>   
                    </div>
                )
            }

            if(menuType === "Model"){
                return (

                //options are given classnames to identify what has been selected
                    <div className="ContextMenu" style={{top: yPos,left: xPos,}}>
                    <div className="CMitem">{rightClickedItem}</div>   
                    <div className="CMitem" id="Navigate">Navigate</div>
                    <div className="CMitem" id="Move">Move To</div>
                    </div>
                )
            }
        }

    else return null;

  }
}
