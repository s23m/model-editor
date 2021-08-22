/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 */

import React from 'react';
import TreeView from 'react-simple-jstree';

import { currentObjects, getModelName } from "./CanvasDraw";
import { drawAll } from "./CanvasDraw";

let focussed = false; //Decides whether or not to show the normal tree view or a focussed version
let currentlySelectedObject = null;
let lastSelectedObject = null;

// A function to be called in the left menu to 
// 1. Return the name of the currently selected vertex for displaying purposes and
// 2. Set the 'focussed' keyword to true
export function displayFocussedTreeView(selectedThing){

    if(focussed === true){
        focussed = false;
        return;
    }

    else if (focussed === false){
        focussed = true;
        lastSelectedObject = currentlySelectedObject;
        currentlySelectedObject = selectedThing;
    }
    
}

export class ContainmentTree extends React.Component {

    constructor(props) {
        super();

        let treeData = []; 
        let i = 0;
        
        if (focussed === false){
            for (let vertex of currentObjects.flattenVertexNodes()) { //.rootVertices() <-- original

                //console.log("AEYO: " + vertex.returnVertexTreePath())
    
                if (i === 0){
                    treeData.push(vertex.toTreeViewElement(new Set(), "vertexFolder"));
                    treeData.push(vertex.toTreeViewElement(new Set(), "arrowFolder"));
                    i += 1;
                }
                treeData.push(vertex.toTreeViewElement(new Set()));
            }
        }

        else if (focussed === true){
            
            for (let vertex of currentObjects.flattenVertexNodes()){
                //Look for our title of interest      
                treeData = [];
                if (currentlySelectedObject.typeName === "Vertex"){
                    treeData.push(vertex.focusTreeViewElement(new Set(), currentlySelectedObject.title));
                }

                else{
                    treeData.push(vertex.focusTreeViewElement(new Set(), currentlySelectedObject.semanticIdentity.UUID));
                }
                
            }
        }




        this.state = {
            data: {
                core: {
                    data: [
                        { text: getModelName(), 
						children: treeData, state: { opened: true } },
                    ]
                }
            },
            selectedVertex: null
        }
    }

    handleElementSelect(e, data) {
        if (data.selected.length === 1 && data.node.data !== null) {
            let UUID = data.node.data.semanticIdentity.UUID;
            for (let vertex of currentObjects.flatten(true, false)) {
                if (vertex.semanticIdentity.UUID === UUID) {
                    this.setState({
                        selectedVertex: vertex
                    });
                    this.props.setLeftMenu(this.state.selectedVertex);
                }
            }
            
        } else {
            this.setState({
                selectedVertex: null
            });
        }

        drawAll();
    }

    render() {
        const data = this.state.data;

        return (
            <div>
                <TreeView treeData={data} onChange={(e, data) => this.handleElementSelect(e, data)} />
            </div>
        )
    }
}