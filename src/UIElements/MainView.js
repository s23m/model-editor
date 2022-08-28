/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import React from 'react';
import '../App.css';
import * as canvasDraw from "./CanvasDraw";
import * as fileManager from '../Serialisation/FileManager';
import {DropdownButton,Dropdown} from "react-bootstrap";

import {Canvas} from './Canvas';
import {LeftMenu, LeftMenuType, StringToLeftMenuType, Tool} from './LeftMenu';

// Semantic domain editor
import SemanticDomainEditor from "./SemanticDomainEditor";
import {resetRows} from "./SemanticDomainEditor";

//Adding folders to the tree view
import {handleAddFolder, handleDeleteModel, handleAddModel,handleRenameFolder, getSelectedFolderKey, handleRenameModel} from './ContainmentTree';
import { handleDeleteFolder } from './ContainmentTree';

import { showVertexPath } from './ContainmentTree';
import { someVertexPath } from './ContainmentTree';
import { ContextMenu } from './ContextMenu'

import iconNewFolder from "../Resources/create_folder.svg"
import iconDeleteFolder from "../Resources/delete_folder.svg"
import iconEditFolder from  "../Resources/changeFolderName.svg"
import iconNewModel from "../Resources/NewModel.svg"
import iconDeleteModel from "../Resources/DeleteModel.svg"
import iconEditModel from "../Resources/editModel.svg"


export const version = 1;

let folderName = "Unnamed Folder";

export class MainProgramClass extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            zoomLevel: 200,
            drawMode: Tool.Vertex,
            menu: LeftMenuType.TreeView,
            selectedObject: null,
        };

        this.setMode = this.setMode.bind(this);
        this.setLeftMenu = this.setLeftMenu.bind(this);
        this.setLeftMenuToTree = this.setLeftMenuToTree.bind(this);
        this.semanticTableEnabled = false;
    }

    componentDidMount() {
        this.setMode(Tool.Select);
        console.log("Mounted");
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        let div = document.getElementById(prevState.SelectedTool);

        if (div !== null) {
            div.style.backgroundColor = "#FFFFFF";
        }

        div = document.getElementById(this.state.SelectedTool);

        div.style.backgroundColor = "#CFFFFF";

        //console.log("Mode set to: " + this.state.SelectedTool);

        // This bit of code here updates the path for whatever vertex is being updated
        if (this.state.selectedObject !== null){
            if (this.state.selectedObject.typeName === "Vertex"){
                showVertexPath(this.state.selectedObject)
                this.state.selectedObject.setPath(someVertexPath)
            }
        }

        
        
    }



    updateFolderName = () => {
        folderName = document.getElementById("FolderName").value
    }

    //The following add/delete functions Now reload the treeview on add/deleteing folders and models - Lachlan
    //The async function is due to javascript executing SetLeftMenuToTree without waiting for handleadd/delete to manipulate data for the new tree - LAchlan
    addFolder = () => {
        //handleAddFolder({modelName:document.getElementById("FolderName").value});
        //ContainmentTree.state = ContainmentTree.state;
        //LeftMenu.state = LeftMenu.state;
        (async() => {
        await handleAddFolder(folderName,getSelectedFolderKey());
        this.setLeftMenuToTree();
        })();
        
    }

    deleteFolder = () => {
        (async() => {
            await handleDeleteFolder(getSelectedFolderKey());
            this.setLeftMenuToTree();
            })();
    }

    editFolderName = () => {
        (async() => {
            await handleRenameFolder(folderName,getSelectedFolderKey());
            this.setLeftMenuToTree();
        })();
    }

    addModel = () => {
        (async() => {
            await handleAddModel(folderName);
            this.setLeftMenuToTree();
            })();
    }

    deleteModel = () => {
        
        (async() => {
            await handleDeleteModel(canvasDraw.getCurrentModel());
            this.setLeftMenuToTree();
            })();
    }

    editModelName = () => {
        (async() => {
            await handleRenameModel(folderName,canvasDraw.getCurrentModel());
            this.setLeftMenuToTree();
        })();
    }

    zoom = (type) => {
        let cZoom = this.state.zoomLevel;
        if (type === "+") {
            if (this.state.zoomLevel < 500) {
                this.setState({zoomLevel:cZoom += 25});
                canvasDraw.setZoom(cZoom);
            }
        } else if (type === "-") {
            if (this.state.zoomLevel > 100) {
                this.setState({zoomLevel:cZoom -= 25});
                canvasDraw.setZoom(cZoom);
            }

        } else {
            console.log("Invalid Zoom Type")
        }
    };

    setMode(mode) {

        if(mode === Tool.Visibility || mode === Tool.Edge || mode === Tool.Specialisation){
            this.setState({drawMode: "Arrow"})
        }else if (mode === Tool.Vertex){
            this.setState({drawMode: "Vertex"})
        }else if (mode === Tool.Select){
            this.setState({drawMode: "Select"})
        } else if (mode === Tool.Artifact) {
            this.setState({ drawMode: "Artifact" })
        } else if (mode === Tool.Container) {
            this.setState({ drawMode: "Container" })
        }

        //console.log(Tool[mode]);

        this.setState({SelectedTool: Tool[mode]});

        canvasDraw.setArrowType(mode)

    };

    // chooses which left hand menu to display, based on the selected item
    setLeftMenu(nearestObject, ctrl = false, OP = []) {
        
        if (OP !== null){
            for(let i = 0;i<OP.length;i++){
                OP[i].setSelected(false); //visually deselects elements
            }
        }
        // checks if that specific object was clicked
        // if it wasn't then deselect it
        // i.e. determines if objects are selected or not
        if (this.state.selectedObject !== null && ctrl === false) {
            this.state.selectedObject.setSelected(false);
            
        }

        // check if the nearest object was too far away or didnt exist
        if (nearestObject === null) {
            this.setState({
                menu: LeftMenuType.TreeView,
                selectedObject: null,
            });

        }

        // if the selected object has a left menu,
        else if (StringToLeftMenuType[nearestObject.typeName] !== null) {
            this.setState({
                menu: nearestObject.typeName,
                selectedObject: nearestObject
            });
            //console.log("below should be selectedObject");
            //console.log(this.state.selectedObject)
            nearestObject.setSelected(true);
        } else {
            if (this.state.selectedObject !== null) {
                canvasDraw.drawAll();
            }

            this.setState({
                menu: LeftMenuType.TreeView,
                selectedObject: null
            });
        }

    }

    //Function for setting left menu to tree
    //This function serves as a direct way to "statechange" the treeview menu - Lachlan
    setLeftMenuToTree(){
        
        if (this.state.selectedObject !== null) {
            
            canvasDraw.drawAll();
        }
        this.setState({
            
            menu: LeftMenuType.None,
        });
        this.setState({
            menu: LeftMenuType.TreeView,
            selectedObject: null
            
        });
        console.log("set left menu To Tree enacted")
        
    }

    setModelName = () => {
        this.setState({modelName:document.getElementById("ModelName").value})
    };

    // Code for file uploading
    // If you know how to move it elsewhere to clean up this file
    // Please move it to src/DataStructures/FileManager.js or similar
    showFile = () => {
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            try {
                let file = document.querySelector('input[type=file]').files[0];

                let reader = new FileReader();
                reader.readAsText(file);
                reader.onload = function () {
                    fileManager.open(reader.result)
                }
            }catch(e){
                alert(e.text()+" did you select a file?")
            }
        } else {
            alert("Your browser is too old to support HTML5 File API");
        }
    };

    // Used to enable/disable the semantic domain editor
    toggleSemanticDomainState = () => {
        if (this.semanticTableEnabled) {
            this.semanticTableEnabled = false;
            canvasDraw.drawAll();
            this.setState(this.state);
            console.log("Semantic Domain disabled");
        } else {
            this.semanticTableEnabled = true;
            resetRows();
            this.setState(this.state);
            console.log("Semantic Domain enabled");
        }
    };



    render() {
        let GUI =
        <><ContextMenu setLeftMenuToTree={this.setLeftMenuToTree} /><div className="Program">
                <div className={this.semanticTableEnabled ? "SemanticDomain" : "hidden"}>
                    <SemanticDomainEditor />
                </div>

                <div className="TopMenus">

                    <DropdownButton variant="Primary" id="File-Menu" title="File" size="lg">

                        <Dropdown.Item>
                            <div className="TopBar">
                                <button id="file" onClick={() => canvasDraw.newFile()}>New File</button>
                            </div>
                        </Dropdown.Item>

                        <Dropdown.Item>
                            <div className="TopBar">
                                <button id="downloader" onClick={() => canvasDraw.getDownload()} download="image.png">Export as .png</button>
                            </div>
                        </Dropdown.Item>


                        <div className="TopBar">
                            <label>Load</label>
                            <input type="file" id="File-Select" onChange={this.showFile} />
                        </div>


                        <Dropdown.Item>
                            <div className="TopBar">
                                <button id="json-downloader" onClick={() => fileManager.save()}>Save (as Json)</button>
                            </div>
                        </Dropdown.Item>

                    </DropdownButton>

                    <div className="TopBar" onClick={() => this.toggleSemanticDomainState()}>
                        Semantic Editor
                    </div>

                    <input className="TopBarSearch" id="ModelName" type="text" name="modelName" placeholder="Graph Name" onChange={(e) => this.setModelName(e)} />
                    <input className="TopBarSearch" id="FolderName" type="text" name="folderName" placeholder="New Container/Model" onChange={(e) => this.updateFolderName(e)} />
                    {/*<div className="TopBarIcon">&nbsp;</div>*/}
                    {/*The + and - are backwards on purpose here*/}
                    <div className="TopBarIcon" onClick={() => this.zoom('-')}> - </div>

                    {/*<div className="TopBarLabel"> {this.state.zoomLevel}% </div>*/}

                    <div className="TopBarIcon" onClick={() => this.zoom('+')}> + </div>


                    {/*<div className="TopBarIdentifier">Rows:&nbsp;</div>*/}
                    {/*<input className="TopBarSelector" style={{"border-left": "0px"}} type="number" id = "canvasRows" defaultValue="70" min="0" max="105" onChange={() => canvasDraw.updateRows()}/>*/}
                    <div className="TopBarSpace">&nbsp;</div>
                    <div className="TopBarSpace">&nbsp;</div>
                    <div className="TopBarIcon" onClick={() => this.addFolder()}><img src={iconNewFolder} alt="Add Container" /></div>
                    <div className="TopBarIcon" onClick={() => this.deleteFolder()}><img src={iconDeleteFolder} alt="Delete Container" /></div>
                    <div className="TopBarIcon" onClick={() => this.editFolderName()}><img src={iconEditFolder} alt="Edit Container" /></div>
                    <div className="TopBarSpace">&nbsp;</div>
                    <div className="TopBarSpace">&nbsp;</div>
                    <div className="TopBarIcon" onClick={() => this.addModel()}><img src={iconNewModel} alt="Add Model" /></div>
                    <div className="TopBarIcon" onClick={() => this.deleteModel()}><img src={iconDeleteModel} alt="Delete Model" /></div>
                    <div className="TopBarIcon" onClick={() => this.editModelName()}><img src={iconEditModel} alt="Edit Model" /></div>



                </div>

                <div className="LowerPanel">
                    <LeftMenu setMode={this.setMode} setLeftMenu={this.setLeftMenu} mainState={this.state} className="LeftMenus" />
                    {/*following 3 classes are temporary for displaying currently selected model and container(renderKey) and folder(selectedFolderKey) */}
                    <input className="SelectedFolder" id="SelectedFolder" type="text" name="selectedFolder" readonly='readonly' />
                    <input className="SelectedContainer" id="SelectedContainer" type="text" name="selectedContainer" readonly='readonly' />
                    <input className="SelectedModel" id="SelectedModel" type="text" name="selectedModel" readonly='readonly' />

                    <div className="Canvas" id = "Canvas">
                        <Canvas setLeftMenu={this.setLeftMenu} setMode={this.setMode} mainState={this.state} />
                    </div>
                </div>
            </div></>;
        return GUI
    }
}