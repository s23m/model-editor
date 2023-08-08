/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import React from 'react';
import '../App.css';
import * as canvasDraw from "./CanvasDraw";
import { DropdownButton, Dropdown } from "react-bootstrap";
import { Canvas } from './Canvas';
import { /*getPropertyChange*/ LeftMenu, LeftMenuType, StringToLeftMenuType, Tool } from './LeftMenu';
import SemanticDomainEditor from "./SemanticDomainEditor";
import { resetRows } from "./SemanticDomainEditor";
import { ContextMenu } from './ContextMenu'
import { save, saveRepo, publishModel, load, importLoad, undo, redo, saveAllPackagesSeperate } from '../Serialisation/NewFileManager'


import iconRedo from "../Resources/redo.svg"
import iconUndo from "../Resources/undo.svg"
import iconHelp from "../Resources/help.svg"



export const version = 1;
export const serverURL = 'http://localhost:8080';

const CLIENT_ID = "180fba17230e08fc195f";

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
    }

    zoom = (type) => {
        let cZoom = this.state.zoomLevel;
        if (type === "+") {
            if (this.state.zoomLevel < 500) {
                this.setState({ zoomLevel: cZoom += 25 });
                canvasDraw.setZoom(cZoom);
            }
        } else if (type === "-") {
            if (this.state.zoomLevel > 100) {
                this.setState({ zoomLevel: cZoom -= 25 });
                canvasDraw.setZoom(cZoom);
            }
        } else {
            console.log("Invalid Zoom Type")
        }
    };

    setMode(mode) {

        if (mode === Tool.Visibility || mode === Tool.Edge || mode === Tool.Specialisation) {
            this.setState({ drawMode: "Arrow" })
        } else if (mode === Tool.Vertex) {
            this.setState({ drawMode: "Vertex" })
        } else if (mode === Tool.Select) {
            this.setState({ drawMode: "Select" })
        } else if (mode === Tool.Artifact) {
            this.setState({ drawMode: "Artifact" })
        } else if (mode === Tool.Container) {
            this.setState({ drawMode: "Container" })
        }

        this.setState({ SelectedTool: Tool[mode] });

        canvasDraw.setArrowType(mode)
    };

    // chooses which left hand menu to display, based on the selected item
    setLeftMenu(nearestObject, ctrl = false, OP = []) {

        if (OP !== null) {
            for (let i = 0; i < OP.length; i++) {
                //visually deselects elements
                OP[i].setSelected(false);
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
    //This function serves as a direct way to "setState" the treeview menu
    setLeftMenuToTree() {
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
    }

    /**
     * Function For Loading or Importing a File
     * @param {string} loadOrImport "Load" / "Import"
     */
    loadImport(loadOrImport) {
        let refreshTree = this.setLeftMenuToTree //This is used so we can point to setLeftMenuToTree within the reader object
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            try {
                let file = null;
                if (loadOrImport === "Load") {
                    file = document.getElementById("File-Select").files[0];
                }
                else if (loadOrImport === "Import") {
                    file = document.getElementById('File-Select-Import').files[0];
                }
                let reader = new FileReader();
                reader.readAsText(file);
                reader.onload = function () {
                    let text = reader.result
                    if (loadOrImport === "Load") {
                        load(text)
                    }
                    else if (loadOrImport === "Import") {
                        importLoad(text)
                    }
                    refreshTree();
                }
            } catch (e) {
                alert(e + " did you select a file?")
            }
        } else {
            alert("Your browser is too old to support HTML5 File API");
        }
        return 0;
    }

    /**
     * not fully working yet, this should be a function to automatically import all JSON files from a directory
     * @param {event} event 
     */
    importSavedFiles = (event) => {
        let refreshTree = this.setLeftMenuToTree; // This is used so we can point to setLeftMenuToTree within the reader object

        const files = event.target.files;
        const reader = new FileReader();

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            reader.readAsText(file);
            reader.onload = () => {
                const text = reader.result;
                importLoad(text);
                refreshTree();
            };
        }
    };

    // Method For Loading a File
    showFile = () => {
        this.loadImport("Load");
    }


    //Method For Importing a File
    importFile = () => {
        this.loadImport("Import");
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

    async mainUndo() {
        await undo();
        this.setLeftMenuToTree();

    }

    async mainRedo() {
        await redo();
        this.setLeftMenuToTree();
    }

    async sayHello() {
        alert("Hello");
    }

    async loginWithGithub(){
        window.location.assign("https://github.com/login/oauth/authorize?client_id=" + CLIENT_ID);
        // returns with code: 9765640985900e3f60d8
    }



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

                        <div className="TopBar">
                            <label>Import</label>
                            <input type="file" id="File-Select-Import" onChange={this.importFile} />
                        </div>

                        <Dropdown.Item>
                            <div className="TopBar">
                                <button id="json-downloader" onClick={() => save()}>Save (as Json)</button>
                            </div>
                        </Dropdown.Item>

                        <Dropdown.Item>
                            <div className="TopBar">
                                <button id="json-package-downloader" onClick={() => saveAllPackagesSeperate()}>Save Packages As Seperate Files</button>
                            </div>
                        </Dropdown.Item>

                        <Dropdown.Item>
                            <div className="TopBar">
                                <button id="save-to-repository" onClick={() => saveRepo()}>Save To Repository</button>
                            </div>
                        </Dropdown.Item>

                        <Dropdown.Item>
                            <div className="TopBar">
                                <button id="publish-model" onClick={() => publishModel()}>Publish Model</button>
                            </div>
                        </Dropdown.Item>

                    </DropdownButton>

                    <div className="TopBar" onClick={() => this.toggleSemanticDomainState()}>Semantic Editor</div>


                    <input className="SelectedGraph" id="SelectedGraph" type="text" name="selectedGraph" readOnly='readonly' />
                    <div className="TopBarIcon" onClick={() => this.zoom('-')}> - </div>
                    <div className="TopBarIcon" onClick={() => this.zoom('+')}> + </div>
                    <div className="TopBarIcon" onClick={() => this.mainUndo()} ><img src={iconUndo} alt="Delete Container" /></div>
                    <div className="TopBarIcon" onClick={() => this.mainRedo()} ><img src={iconRedo} alt="Add Container" /></div>
                    <div className="TopBarIcon" ><a href="UserManual.pdf"><img src={iconHelp} alt="Help" /></a></div>
                    <DropdownButton variant="Primary" id="Repository-Dropdown" title="Repository" size="lg">
                        <Dropdown.Item>
                            <div className="TopBar">
                                <button id="Grant-Visibility" onClick={() => alert("This will be the grant visibility button")}>Grant Visibility</button>
                            </div>
                        </Dropdown.Item>
                        <Dropdown.Item>
                            <div className="TopBar">
                                <button id="Import-Model" onClick={() => alert("This button will import a model")}>Import Model</button>
                            </div>
                        </Dropdown.Item>
                        <Dropdown.Item>
                            <div className="TopBar">
                                <button id="Grant-Discoverability" onClick={() => alert("This will be the grant visibility button")}>Grant Discoverability</button>
                            </div>
                        </Dropdown.Item>
                    </DropdownButton>
                    <div className="TopBarIcon" id="Account" onClick={this.loginWithGithub}>GitHub Account</div>
                </div>

                <div className="LowerPanel" id="LowerPanel">
                    <LeftMenu setMode={this.setMode} setLeftMenu={this.setLeftMenu} mainState={this.state} className="LeftMenus" />
                    <div className="Canvas" id="Canvas">
                        <Canvas setLeftMenu={this.setLeftMenu} setMode={this.setMode} mainState={this.state} />
                    </div>
                </div>
            </div></>;
        return GUI
    }
}