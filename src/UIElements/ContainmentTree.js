/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import React from 'react';
import axios from 'axios';
import TreeView from 'react-simple-jstree';

import {
    currentObjects, setNewContainerKey as setNewPackageKey, getTotalContainerKeys, incrementTotalContainerKeys,
    getCurrentGraph, setNewGraph as setNewGraphKey, getTotalGraphs, incrementTotalGraphs as incrementTotalGraph, /*getCurrentObjects*/
} from "./CanvasDraw";
import { drawAll } from "./CanvasDraw";
import { VertexNode } from "../DataStructures/Graph.js"
import { SemanticIdentity } from "../DataStructures/SemanticIdentity.js";
import { createSaveState } from '../Serialisation/NewFileManager';
import { getDiagramIcon, getPackageIcon, getTreeVertexEmptyIcon, getTreeVertexFullIcon } from '../Config.js';
// Accesor for tree data
let treeData = [];

// Stores data for packages
let packageData = [];

// The decoy packages something to do with past teams indexing? can probably refactor and remove them? - Lachlan
let decoyPackageData = [];

// Stores data for Vertex's (Tree)
let vertexData = [];

// The decoy Vertex something to do with past teams indexing? can probably refactor and remove them? - Lachlan
let decoyVertexData = []

// Stores data for Graphs
let graphObjects = [];

// The decoy Graph something to do with past teams indexing? can probably refactor and remove them? - Lachlan
let decoyGraphObjects = [];

//used as a container for sorting root from subPackages when pushing Packages to root.
let packageDataRoot = [];

//Index of Currently Selected Container by user
let selectedContainerKey = 0;



export function setSelectedPackageKey(newKey) {
    selectedContainerKey = newKey;
}

export function getSelectedPackageKey() {
    return selectedContainerKey;
}

export function getTreeData() {
    return treeData;
}

export function setTreeData(newTreeData) {
    treeData = newTreeData;
}

export function getPackageData() {
    return packageData;
}

export function setPackageData(newPackageData) {
    packageData = newPackageData;
}

export function getDecoyPackageData() {
    return decoyPackageData
}

export function setDecoyPackageData(newData) {
    decoyPackageData = newData;
}

export function getVertexData() {
    return vertexData;
}

export function setVertexData(newData) {
    vertexData = newData;
}

export function getDecoyVertexData() {
    return decoyVertexData
}

export function setDecoyVertexData(newData) {
    decoyVertexData = newData;
}

//returns a concated array of the Package and vertex (Tree
export function getContainerData() {
    return packageData.concat(vertexData);
}

export function getGraphData() {
    return graphObjects;
}

export function setGraphData(newData) {
    graphObjects = newData;
}
export function getDecoyGraphData() {
    return decoyGraphObjects;
}
export function setDecoyGraphData(newData) {
    decoyGraphObjects = newData;
}




/**
 * Loads the First available/oldest Graph
 */
function loadFirstGraph() {
    //Load first Graph
    if (graphObjects.length > 0) {
        setNewPackageKey(graphObjects[0].data.containerKey)
        setNewGraphKey(graphObjects[0].data.graphKey)
        setSelectedPackageKey(graphObjects[0].data.containerKey)
    }
    //set keys to (none selected) values
    else {
        setNewPackageKey(0)
        setNewGraphKey(-1)
        setSelectedPackageKey(0)
    }
    //load the graph to canvas
    for (let item of currentObjects.flatten()) {
        if (item.typeName === "Vertex" && item.getGraphKey() === getCurrentGraph()) {
            item.setPresent();
        }
        else if (item.getGraphKey() !== getCurrentGraph() && item.typeName === "Vertex") {
            item.setAway();
        }
    }
    drawAll()
}


/**
 * Create a Package in Treeview
 * @param {string} packageName Name of new Package
 * @param {number} parentKey Index of Parent, Defaults to 0 ("Root")
 */
export function handleAddPackage(packageName, parentKey = 0) {

    incrementTotalContainerKeys();

    let tempPackageThing = {
        text: packageName + " " + getPackageIcon(),
        children: treeData[getTotalContainerKeys()],
        data: NaN,
        state: { opened: true },
        type: "Package",
        typeName: "Package",
        containerKey: getTotalContainerKeys(),
        parentContainerKey: parentKey
    }

    decoyPackageData.push(tempPackageThing)

    let packageThing2 = {
        text: packageName + " " + getPackageIcon(),
        children: treeData[getTotalContainerKeys()],
        data: decoyPackageData[packageData.length],
        state: { opened: true },
        type: "Package",
        typeName: "Package",
        containerKey: getTotalContainerKeys(),
        parentContainerKey: parentKey
    }

    packageData.push(packageThing2);
}
/**
 * Create a Vertex in Treeview
 * @param {string} vertexName 
 * @param {number} parentKey 
 * @returns Created Vertex Object
 */
export function handleAddVertex(vertexName, parentKey = 0) {
    //Create a new package using the known node type

    incrementTotalContainerKeys();
    let sID = new SemanticIdentity(vertexName, "", "", "", undefined, [])

    let tempVertexThing = {
        text: vertexName + " " + getTreeVertexEmptyIcon(),
        children: treeData[getTotalContainerKeys()],
        data: NaN,
        state: { opened: true },
        type: "treeVertex",
        typeName: "VertexNode",
        originalVertex: true,
        containerKey: getTotalContainerKeys(),
        parentContainerKey: parentKey,
        content: "",
        colour: "#FFD5A9",
        height: 50,
        width: 70,
        icons: [[], [], []],
        imageElements: {},
        fontSize: 12,
        semanticIdentity: sID
    }

    decoyVertexData.push(tempVertexThing)

    let vertexThing2 = {
        text: vertexName + " " + getTreeVertexEmptyIcon(), //If icon is changed, youll have to change the package icon in context menu too
        children: treeData[getTotalContainerKeys()],
        data: decoyVertexData[vertexData.length],
        state: { opened: true },
        type: "treeVertex",
        typeName: "VertexNode",
        originalVertex: true,
        containerKey: getTotalContainerKeys(),
        parentContainerKey: parentKey,
        content: "",
        colour: "#FFD5A9",
        height: 50,
        width: 70,
        icons: [[], [], []],
        imageElements: {},
        fontSize: 12,
        semanticIdentity: sID
    }
    vertexData.push(vertexThing2);
    return vertexThing2
}

/**
 * @param {number} selectedContainerKey 
 */
export function handleDeletePackage(selectedContainerKey) {
    for (let i = 0; i < packageData.length; i++) {
        if (packageData[i].containerKey === selectedContainerKey) {
            deletePackageChildren(packageData[i]);
            decoyPackageData.splice(i, 1);
            packageData.splice(i, 1);
        }
    }
    //set index to first graph
    loadFirstGraph()
}
/**
 * Delete a vertex From Treedata, and appearances on graphs
 * @param {*} selectedUUID 
 */
export function handleDeleteVertex(selectedUUID) {
    for (let vertex of currentObjects.flatten()) {
        if (vertex.originalUUID === selectedUUID) {
            currentObjects.remove(vertex)
        }
    }
    for (let i = 0; i < vertexData.length; i++) {
        if (vertexData[i].semanticIdentity.UUID === selectedUUID) {
            vertexData.splice(i, 1)
            decoyVertexData.splice(i, 1)
        }
    }
    drawAll();
}

function deletePackageChildren(selectedPackage) {
    let packageChildren = selectedPackage.children;
    for (let i = 0; i < packageChildren.length; i++) {
        if (packageChildren[i].type === "Package") {
            let selectedContainerKey = packageChildren[i].containerKey;
            handleDeletePackage(selectedContainerKey);
        }
        else if (packageChildren[i].type === "Graph") {
            let selectedGraphKey = packageChildren[i].graphKey;
            handleDeleteGraph(selectedGraphKey);
        }
        else if (packageChildren[i].type === "treeVertex") {
            let selectedUUID = packageChildren[i].semanticIdentity.UUID;
            handleDeleteVertex(selectedUUID);
        }
    }
}


export function handleRenamePackage(newName, rKey) {
    if (newName !== "") {
        for (let i = 0; i < packageData.length; i++) {
            if (packageData[i].containerKey === rKey) {
                packageData[i].text = newName + " " + getPackageIcon();
                packageData[i].data.text = newName + " " + getPackageIcon();
                break;
            }
        }
    }
    else {
        console.log("Cannot have empty name")
    }
}



/**
 * Add Graph to Treeview
 * @param {string} diagramName 
 * @param {number} rKey 
 */
export function handleAddGraph(diagramName, rKey = getSelectedPackageKey()) {
    //stops the creation of graphs in the root or otherwise non-existent packages
    if (rKey <= 0) return

    incrementTotalGraph();

    let decoyGraphThing = {
        text: diagramName + " " + getDiagramIcon(),
        children: [],
        data: NaN,
        state: { opened: true },
        type: "Graph",
        typeName: "Graph",
        containerKey: rKey,
        graphKey: getTotalGraphs(),
    }

    decoyGraphObjects.push(decoyGraphThing);

    let tempGraphThing = {
        text: diagramName + " " + getDiagramIcon(),
        children: [],
        data: decoyGraphObjects[graphObjects.length],
        state: { opened: true },
        type: "Graph",
        typeName: "Graph",
        containerKey: rKey,
        graphKey: getTotalGraphs(),
    };

    graphObjects.push(tempGraphThing);
}

export function handleDeleteGraph(selectedGraphKey) {
    for (let i = 0; i < graphObjects.length; i++) {
        if (graphObjects[i].graphKey === selectedGraphKey) {
            graphObjects.splice(i, 1);
            decoyGraphObjects.splice(i, 1);
        }
    }
    loadFirstGraph()
}

export function handleRenameGraph(newName, gKey) {
    for (let i = 0; i < graphObjects.length; i++) {
        if (graphObjects[i].graphKey === gKey) {
            graphObjects[i].text = newName + " " + getDiagramIcon();
            graphObjects[i].data.text = newName + " " + getDiagramIcon();
            break;
        }
    }
}

/**
 *
 * @param {number} selectedGraphKey 
 * @returns {number} The Key of The Graphs Parent Container
 */
export function getGraphContainerKey(selectedGraphKey) {
    for (let i = 0; i < graphObjects.length; i++) {
        if (graphObjects[i].graphKey === selectedGraphKey) {
            return graphObjects[i].containerKey
        }
    }
}

/**
 * Changes the Parent Container of a Graph
 * @param {number} gKey 
 * @param {number} newkey 
 */
export function handleGraphRebase(gKey, newkey) {
    for (let graph of graphObjects) {
        if (graph.graphKey === gKey) {
            for (let objectPackages of graph.children) {
                let objects = objectPackages.children
                for (let object of objects) {
                    object.containerkey = newkey;
                    if (object.data.typeName === "Vertex") {
                        object.data.vertexContainerKey = newkey;
                    }
                    else {
                        object.data.arrowContainerKey = newkey;
                    }
                }
            }
            graph.containerKey = newkey;
        }
    }
    createSaveState();
}





/**
 * Determines Children for a Container
 * @param {number} parsedContainerKey 
 * @returns Array of Container's children
 */
function determineOwnership(parsedContainerKey) {
    let returnArray = []
    let i = 0
    for (let vertexOrArrow of treeData) {
        if (vertexOrArrow !== undefined) {
            if (vertexOrArrow.type === "Graph") {
                if (vertexOrArrow.containerKey === parsedContainerKey) {
                    returnArray.push(treeData[i])
                }
            }
        }
        i += 1
    }

    return returnArray
}

/**
 * Determines SubContainers for a Container
 * @param {*} parsedContainerKey 
 * @returns Array of Container's SubContainer's
 */
function determineSubPackages(parsedContainerKey) {
    let returnArray = []
    for (let Container of getContainerData()) {
        if (Container.parentContainerKey === parsedContainerKey)
            returnArray.push(Container)
    }
    return returnArray
}

export function getGraphNameFromKey(key) {
    let graph = graphObjects.find(graph => graph.graphKey === key)
    return graph.text
}

export function getContainerNameFromKey(key) {
    let packages = getContainerData().find(packages => packages.containerKey === key)
    return packages.text
}

//Flag for when the editor is first opened or a new file is loaded.
let initialPackageAdded = false;
class GitHubUserContainmentTree extends React.Component {
    constructor() {
      super();
      this.state = {
        data: {
          core: {
            data: [
              {
                text: "GitHub Files", // Root node label
                children: [], // Initialize with an empty array
                state: { opened: false }, // Start with the root node closed
                root: true,
              },
            ],
          },
        },
        selectedVertex: null,
      };
    }
  
    componentDidMount() {
      // Update the tree data with GitHub files when the component mounts
      this.updateTreeData();
    }
  
    // Function to get files from the GitHub repository
    getFilesFromRepo = async () => {
      // check for github user
      const githubUser = JSON.parse(localStorage.getItem('GithubUser'));
      if (githubUser) {
        const owner = githubUser.username;
        const repo = 'Model-Repository';
        const accessToken = githubUser.accessToken;
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
  
        const config = {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github+json',
            "Content-Type": 'application/json',
          }
        };
  
        try {
          const response = await axios.get(apiUrl, config);
          return response.data;
        } catch (error) {
          console.log(error);
          return [];
        }
      }
    }
  
    // Function to update the tree data with GitHub files
    updateTreeData = async () => {
      const githubFiles = await this.getFilesFromRepo();
  
      // Create children nodes for each GitHub file
      const childrenNodes = githubFiles.map((file, index) => ({
        text: file.name,
        content: file, // You can pass the entire file object as data
        state: { opened: false },
        type: "File", // Optional: You can specify a type for each node
        id: `file-${index}`, // Optional: You can assign a unique id to each node
      }));
  
      // Update the state with the children nodes
      this.setState(prevState => ({
        data: {
          core: {
            ...prevState.data.core,
            data: [
              {
                ...prevState.data.core.data[0],
                children: childrenNodes, // Update children nodes
              },
            ],
          },
        },
      }));
    }
  
    handleNodeClick = (e, data) => {
      // Handle the click event on tree nodes as needed
      //console.log("Clicked node:", selectedNode);
      // You can access selectedNode.content to access the file content
    };
  
    render() {
      return (
        <div>
          <TreeView
            treeData={this.state.data}
            onChange={this.handleNodeClick}
            className="treeview"
            id="treeview"
            draggable="true"
            onOpen={this.updateTreeData} // Call updateTreeData when the root node is opened
          />
        </div>
      );
    }
  }

export class ContainmentTree extends React.Component {


    componentDidMount() {
        document.getElementById("LowerPanel").addEventListener('dragstart', this.dragStart);
    }
    componentDidUpdate() {
    }

    componentWillUnmount() {
        document.getElementById("LowerPanel").removeEventListener('dragstart', this.dragStart);
    }

    dragStart(e) {
        //click required as JStree requires a "Selecting a node" to bring data forward. (Element only stores name)
        e.target.click();
        let vertData = 0;
        for (let packages of getContainerData()) {
            if (getSelectedPackageKey() === packages.containerKey)
                vertData = packages;
        }
        let data = vertData;
        //Prevents errors when a package or graph is dragged etc.
        if (vertData.type === "treeVertex") {
            e.dataTransfer.setData('text/plain', data.semanticIdentity.UUID)
        }
        else {
            console.log("This object has no drag/drop feature")
        }
    }


    constructor(props) {
        super(props);

        treeData = [];

        if (initialPackageAdded === false) {

            setNewPackageKey(1);
            setNewGraphKey(1);
            setSelectedPackageKey(1);
            initialPackageAdded = true;
            createSaveState();
            console.log('constructor save')
        }


        // Push the graph objects in
        for (let graph of graphObjects) {
            treeData.push(graph);

        }
        //define owenerships
        for (let packages of getContainerData()) {
            let canvasItems = determineOwnership(packages.containerKey)
            let subPackageItems = determineSubPackages(packages.containerKey)
            let combinedItems = canvasItems.concat(subPackageItems)
            packages.children = combinedItems;


        }

        //define ownership of canvas arrows  
        for (let packages of getContainerData()) {
            let vertex = new VertexNode()
            if (vertex.toTreeViewElement("Arrow Package", packages.containerKey) !== undefined) {
                packages.children.push(vertex.toTreeViewElement("Arrow Package", packages.containerKey))
            }

        }
        //determine if vertex's are empty or not
        for (let vert of getVertexData()) {
            if (vert.children.length === 0) {
                vert.text = vert.text.replace(" " + getTreeVertexEmptyIcon(), "");
                vert.text = vert.text.replace(" " + getTreeVertexFullIcon(), "");
                vert.text = vert.text + " " + getTreeVertexEmptyIcon();
            }
            else {
                vert.text = vert.text.replace(" " + getTreeVertexEmptyIcon(), "");
                vert.text = vert.text.replace(" " + getTreeVertexFullIcon(), "");
                vert.text = vert.text + " " + getTreeVertexFullIcon()
            }
        }

        //Determine which packages are root packages
        packageDataRoot = [];
        for (let packages of getContainerData()) {
            if (packages.parentContainerKey === 0) {
                packageDataRoot.push(packages)
            }

        }

        //const retrievedValue = JSON.parse(localStorage.getItem('GithubUser'));
        

        //Set the TreeData
        this.state = {
            data: {
                core: {
                    data: [
                        {
                            // text: retrievedValue && retrievedValue.username !== null
                            //     ? retrievedValue.username : "Root",
                            text: "Root",
                            children: packageDataRoot,
                            state: { opened: true },
                            root: true
                        },
                    ]
                }
            },
            selectedVertex: null,
        }
    }

    /**
     * Function called when Treeview Element is clicked
     * @param {*} e The target element
     * @param {*} data The treeNodes data
     */
    handleElementSelect(e, data) {
        //console.log(getCurrentObjects())
        console.log(data.node);

        //catch undefined data type eg. root
        try {
            if (data.node.data.type === "Package" || data.node.data.type === "treeVertex") {
                setSelectedPackageKey(data.node.data.containerKey)
            }

            else if (data.node.data.type === "Graph") {
                setNewGraphKey(data.node.data.graphKey);
                setNewPackageKey(data.node.data.containerKey);
                setSelectedPackageKey(data.node.data.containerKey)
                // Move everything away
                for (let item of currentObjects.flatten()) {
                    if (item.typeName === "Vertex" && item.getGraphKey() === getCurrentGraph()) {
                        item.setPresent();
                    }
                    else if (item.getGraphKey() !== getCurrentGraph() && item.typeName === "Vertex") {
                        item.setAway();
                    }
                }
            }

            else if (data.selected.length === 1 && data.node.data !== null && data.node.data.type === undefined) {
                let UUID = data.node.data.semanticIdentity.UUID;
                for (let vertex of currentObjects.flatten()) {
                    if (vertex.semanticIdentity.UUID === UUID) {
                        this.setState({
                            selectedVertex: vertex
                        });
                        setNewPackageKey(vertex.vertexContainerKey);
                        setNewGraphKey(vertex.vertexGraphKey);
                        setSelectedPackageKey(vertex.vertexContainerKey)

                        for (let item of currentObjects.flatten()) {
                            if (item.typeName === "Vertex" && item.getGraphKey() === getCurrentGraph()) {
                                item.setPresent();
                            }
                            else if (item.getGraphKey() !== getCurrentGraph() && item.typeName === "Vertex") {
                                item.setAway();
                            }
                        }
                        this.props.setLeftMenu(this.state.selectedVertex);
                    }
                }
            }
            else {
                this.setState({
                    selectedVertex: null
                });
            }
            drawAll();
        }
        catch (e) {
            console.log("If True,a null type error has been caught, If the selected object should be selectable, this is an issue")
        }
        //If the user clicks the root package
        try {
            if (data.node.original.root === true) {
                setSelectedPackageKey(0) //containerkey 0 will be used for root
            }
        }
        catch (e) {
        }


    }
    render() {
        const data = this.state.data;
        return (
            <div id="Tree-Container">
                <TreeView treeData={data} onChange={(e, data) => this.handleElementSelect(e, data)} className="treeview" id="treeview" draggable="true" />
                <GitHubUserContainmentTree />
            </div>
        )
    }
}