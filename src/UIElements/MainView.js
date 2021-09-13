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
import {handleAddFolder} from './ContainmentTree';
import { handleDeleteFolder } from './ContainmentTree';

import { showVertexPath } from './ContainmentTree';
import { someVertexPath } from './ContainmentTree';

// Simple incremental version
// 1->2->3->4
export const version = 1;

let folderName = "Unnamed Folder";

export class MainProgramClass extends React.Component {

    constructor(props) {
        super();
        this.state = {
            zoomLevel: 200,
            drawMode: Tool.Vertex,
            menu: LeftMenuType.TreeView,
            selectedObject: null,
        };

        this.setMode = this.setMode.bind(this);
        this.setLeftMenu = this.setLeftMenu.bind(this);
        this.semanticTableEnabled = false;
    }

    componentDidMount() {
        this.setMode(Tool.Vertex);
        console.log("Mounted");
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        let div = document.getElementById(prevState.SelectedTool);

        if (div !== null) {
            div.style.backgroundColor = "#FFFFFF";
        }

        div = document.getElementById(this.state.SelectedTool);

        div.style.backgroundColor = "#CFFFFF";

        console.log("Mode set to: " + this.state.SelectedTool);

        // This bit of code here updates the path for whatever vertex is being updated
        if (this.state.selectedObject !== null){
            if (this.state.selectedObject.typeName === "Vertex"){
                showVertexPath(this.state.selectedObject)
                this.state.selectedObject.setPath(someVertexPath)
            }
        }
        
    }

    updateFolderName = (type) => {
        folderName = document.getElementById("FolderName").value
    }

    addFolder = (type) => {
        //handleAddFolder({modelName:document.getElementById("FolderName").value});
        handleAddFolder(folderName);
    }

    deleteFolder = (type) => {
        handleDeleteFolder(folderName);
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

        console.log(Tool[mode]);

        this.setState({SelectedTool: Tool[mode]});

        canvasDraw.setArrowType(mode)

    };

    // chooses which left hand menu to display, based on the selected item
    setLeftMenu(nearestObject) {

        if (this.state.selectedObject !== null) {
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
        else if (StringToLeftMenuType[nearestObject.constructor.name] !== null) {
            this.setState({
                menu: nearestObject.constructor.name,
                selectedObject: nearestObject
            });
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
        var GUI =
            <div className="Program">
                <div className={this.semanticTableEnabled ? "SemanticDomain" : "hidden"}>
                    <SemanticDomainEditor/>
                </div>

                <div className= "TopMenus">

                    <DropdownButton variant = "Primary" id = "File-Menu" title = "File" size = "lg">

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

                    <input className="TopBarSearch" id="ModelName" type = "text" name = "modelName" placeholder = "Model Name" onChange={(e) => this.setModelName(e)}/>
                    <input className="TopBarSearch" id="FolderName" type = "text" name = "folderName" placeholder = "New Folder" onChange={(e) => this.updateFolderName(e)}/>

                    {/*<div className="TopBarIcon">&nbsp;</div>*/}
                    {/*The + and - are backwards on purpose here*/}
                    <div className="TopBarIcon" onClick={() => this.zoom('-')}> - </div>

                    {/*<div className="TopBarLabel"> {this.state.zoomLevel}% </div>*/}
                    
                    <div className="TopBarIcon" onClick={() => this.zoom('+')}> + </div>


                    {/*<div className="TopBarIdentifier">Rows:&nbsp;</div>*/}
                    {/*<input className="TopBarSelector" style={{"border-left": "0px"}} type="number" id = "canvasRows" defaultValue="70" min="0" max="105" onChange={() => canvasDraw.updateRows()}/>*/}
                    <div className="TopBarIcon">&nbsp;</div>
                    <div className="TopBarIcon" onClick={() => this.addFolder()}> Add Folder </div>
                    <div className="TopBarIcon">&nbsp;</div>
                    <div className="TopBarIcon" onClick={() => this.deleteFolder()}> Delete Folder </div>


                </div>

                <div className="LowerPanel">
                    <LeftMenu setMode = {this.setMode} setLeftMenu = {this.setLeftMenu} mainState = {this.state} className = "LeftMenus"/>
                    <div className="Canvas">
                        <Canvas setLeftMenu = {this.setLeftMenu} setMode = {this.setMode} mainState = {this.state}/>
                    </div>
                </div>
            </div>;
        return GUI
    }
}