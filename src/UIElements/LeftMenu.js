/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import React from 'react';
import * as canvasDraw from "./CanvasDraw";
import {LineColourToStringName,} from "../DataStructures/ArrowProperties"
import { ContainmentTree,} from "./ContainmentTree";
import {serverURL} from ".//MainView"
import { SketchPicker } from 'react-color';

// Icons
import iconVertex from "../Resources/vertex.svg";
import iconEdge from "../Resources/edge.svg";
import iconSelect from "../Resources/select.svg"
import iconSpecialisation from "../Resources/specialisation.svg";
import iconVisibility from "../Resources/visibility.svg"

import {deleteElement} from "./CanvasDraw";
import { vertexDeleteElement } from './CanvasDraw';

import DropdownButton from "react-bootstrap/DropdownButton";
import { getIsStatic } from '../Config';




//Property Enums
export const LeftMenuType = {
    TreeView: "TreeView",
    Vertex: "Vertex",
    Arrow: "Arrow",

    //FTreeView: "FocussedTreeView"

    Artifact: "Artifact",
    Container:"Container"

};

export const LeftMenuTypeToString = {};
LeftMenuTypeToString[LeftMenuType.TreeView] = "TreeView";
LeftMenuTypeToString[LeftMenuType.Vertex] = "Vertex";
LeftMenuTypeToString[LeftMenuType.Arrow] = "Arrow";
LeftMenuTypeToString[LeftMenuType.Arrow] = "Artifact";
LeftMenuTypeToString[LeftMenuType.Arrow] = "Container";

export const StringToLeftMenuType = {};
LeftMenuTypeToString["TreeView"] = LeftMenuType.TreeView;
LeftMenuTypeToString["Vertex"] = LeftMenuType.Vertex;
LeftMenuTypeToString["Arrow"] = LeftMenuType.Arrow;
LeftMenuTypeToString["Artifact"] = LeftMenuType.Artifact;
LeftMenuTypeToString["Container"] = LeftMenuType.Container;

export const Tool = {
    Select: "Select",
    Vertex: "Vertex",
    Visibility: "Visibility",
    Edge: "Edge",
    Specialisation: "Specialisation",
    Artifact: "Artifact",
    Container: "Container",
};
// for undo/redo, dont want to create a save state each time left menu is opened and nothing is changed
export let PropertyChange = false;

export function getPropertyChange(){
    return PropertyChange;
}
export function resetPropertyChange(){
    PropertyChange = false;
}
// class to display the left hand menu, where we will be showing
// object editing tools for now
export class LeftMenu extends React.Component{

    constructor(props) {
        super(props);
        this.state = {
            menu: LeftMenuType.TreeView,
            selectedObject: null,
            fileNames: [],
            title: "",
            content: [],

        };
        this.setTitle = this.setTitle.bind(this);
        this.setContent = this.setContent.bind(this);
        this.handleChange = this.handleChange.bind(this);

        this.formRef = null;

        this.setFormRef = element =>{
            this.formRef = element;
        };

        
        //this.setIcons();
        

    }
    handleChange(event){
        this.setState({title: event.target.value})
        this.setState({title:""})
        this.setTitle();
        this.setContent();
    }

    componentDidMount() {
        this.menu = this.props.mainState.menu;
        this.selectedItem = this.props.mainState.drawMode;
        this.props.setMode(this.selectedItem)
        document.addEventListener("keydown", this.onKeyPressed.bind(this));  
        if(getIsStatic() === false){
            this.setIcons()
        }
        else{
        this.setIconsStatic();
        }
    }


    //For quickKeys
    onKeyPressed(e) {
        if (e.keyCode === 46){
            if(this.state.selectedObject.typeName === "Vertex"){
                vertexDeleteElement(this.state.selectedObject);
            }
            else{
                deleteElement(this.state.selectedObject);
            }
            this.setState({menu:"TreeView"});
            canvasDraw.drawAll();
        }

        
    }
    
    static getDerivedStateFromProps(props,state) {

        return {
            menu: props.mainState.menu,
            selectedObject: props.mainState.selectedObject

        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {


        let leftMenu = document.getElementById("VertexMenu");
        if(leftMenu === null){
            leftMenu = document.getElementById("ArrowMenu");
        }
        if(leftMenu !== null){
            leftMenu.addEventListener("keypress", (e) => {
                if(e.key === "Enter") {
                    e.preventDefault();
                }
            })
        }

    }

    setIcons() {
        fetch(serverURL + '/icons/list',{
            method:'GET',
            headers: {
                'Accept': '*/*',
            },
        })
            .then((res) => {return res.json()})
            .then((data) => {
                let fileNames = [];
                data.icons.forEach((icon) => {
                    fileNames.push(icon)
                });
                console.log(fileNames)
                this.setState({fileNames:fileNames})
            })
            
    }

    async setIconsStatic(){
        const iconNames = ['Activity.png',
            'Agent.png',
            'BioSphere.png',
            'Critical.png',
            'Designed.png',
            'Ecosystem.png',
            'Error.png',
            'Event.png',
            'Grow_n.png',
            'Human.png',
            'Make_n.png',
            'Move_n.png',
            'Organic.png',
            'Organisation.png',
            'Play_n.png',
            'Resource.png',
            'SaaS_n.png',
            'Social.png',
            'Software.png',
            'Sustain_n.png',
            'Symbolic.png',
            'Tacit Knowledge.png',
            'Team.png',
            'Trust.png',
            'UI Device.png']
            console.log(iconNames)
            this.setState({fileNames:iconNames})
            console.log(this.state.fileNames)
          
    }

    //VERTEX SETTERS
    setTitle() {
        let newTitle = document.getElementById("LeftTitle").value;
        this.state.selectedObject.setTitle(newTitle);
        canvasDraw.updateVertex(this.state.selectedObject);
        canvasDraw.drawAll()
        PropertyChange = true;
    }


    setContent() {
        let newContent = document.getElementById("LeftContent").value;
        newContent = newContent.split("\n");
        this.state.selectedObject.setContent(newContent);
        canvasDraw.updateVertex(this.state.selectedObject);
        canvasDraw.drawAll()
        PropertyChange = true;
    }

    //ARROW SETTERS
    setLineType() {
        let newLineType = document.getElementById("LineType").value;
        this.state.selectedObject.setLineType(newLineType);
        canvasDraw.drawAll()
        PropertyChange = true;
    }

    setColour() {
        let newColour = document.getElementById("LineColour").value;
        this.state.selectedObject.setLineColour(newColour);
        canvasDraw.drawAll()
        PropertyChange = true;
    }

    setStartLabel() {
        let newLabel = document.getElementById("SourceLabel").value;
        this.state.selectedObject.setStartLabel(newLabel);
        canvasDraw.drawAll();
        PropertyChange = true;
    }

    setEndLabel() {
        let newLabel = document.getElementById("DestLabel").value;
        this.state.selectedObject.setEndLabel(newLabel);
        canvasDraw.drawAll();
        PropertyChange = true;
    }

    updateCardinality() {
        let sourceLowerBound = document.getElementById("sourceFromCardindality").value;
        let sourceUpperBound = document.getElementById("sourceToCardindality").value;
        let currentSourceVisibility = this.state.selectedObject.getSourceCardinalityVisibility();
        let destLowerBound = document.getElementById("destFromCardindality").value;
        let destUpperBound = document.getElementById("destToCardindality").value;
        let currentDestVisibility = this.state.selectedObject.getDestCardinalityVisibility();

        this.state.selectedObject.updateSourceCardinality(sourceLowerBound, sourceUpperBound, currentSourceVisibility);
        this.state.selectedObject.updateDestCardinality(destLowerBound, destUpperBound, currentDestVisibility);

        canvasDraw.drawAll();
        PropertyChange = true;
    }

    toggleSourceCardinalityVisibility() {
        this.state.selectedObject.toggleSourceCardinalityVisibility();
        canvasDraw.drawAll();
        PropertyChange = true;
    }

    toggleDestCardinalityVisibility() {
        this.state.selectedObject.toggleDestCardinalityVisibility();
        canvasDraw.drawAll();
        PropertyChange = true;
    }

    toggleAbstract(){
        this.state.selectedObject.toggleAbstract()
        canvasDraw.drawAll()
        PropertyChange = true;
    }

    getS23MIconsSelector() {
        let dropdownOptions = [<div className="DropdownItem" key={0}><div className="dropdownLabel">Name</div><div className="checkBoxContainer">Text</div><div className="checkBoxContainer">Icon</div></div>];

        let name = "";
        this.state.fileNames.forEach(fileName => {
            if (fileName.slice(-6, -4) === "_n") {
                name = fileName.slice(0, -6);
                dropdownOptions.push(<div className="DropdownItem" ref={fileName} key={fileName}> <div className="dropdownLabel">{name}</div> <div className="checkBoxContainer"><input type='checkbox' disabled="disabled" /> </div>  <div className="checkBoxContainer"><input type='checkbox' defaultChecked={this.shouldIconBeSelected(fileName)} onClick={() => {this.setIcon(fileName)}}/></div> </div>)
            } else {
                name = fileName.slice(0, -4);
                dropdownOptions.push(<div className="DropdownItem" ref={fileName} key={fileName}> <div className="dropdownLabel">{name}</div> <div className="checkBoxContainer"><input type='checkbox' defaultChecked={this.shouldTextBeSelected(fileName)} onClick={() => {this.setText(fileName)}} /> </div>  <div className="checkBoxContainer"><input type='checkbox' defaultChecked={this.shouldIconBeSelected(fileName)} onClick={() => {this.setIcon(fileName)}}/></div> </div>)
            }
        });

        return <DropdownButton title="Category Selector" name="Icons" id="IconSelector" className="IconSelector" >
            {dropdownOptions}
        </DropdownButton>;
        
    }

    getVertexColour = () => {
        return this.state.selectedObject.getColour()
    };

    setVertexColour = (colour) =>{
        this.state.selectedObject.setColour(colour.hex);
        canvasDraw.updateVertex(this.state.selectedObject);
        canvasDraw.drawAll()
        PropertyChange = true;
    };

    getColourPicker() {
        return <DropdownButton title = "Colour Selector" id = "ColourSelector">
        <SketchPicker
            color={this.getVertexColour}
            onChangeComplete={this.setVertexColour}
            presetColors = {["#FFD5A9","#F5B942","#FFFFFF"]}
        /></DropdownButton>
    }

    shouldTextBeSelected(fileName) {
        return this.state.selectedObject.isTextSet(fileName)
    }

    shouldIconBeSelected(fileName) {
        return this.state.selectedObject.isIconSet(fileName)
    }

    setText(fileName) {
        this.state.selectedObject.setText(fileName);
        canvasDraw.drawAll();
        PropertyChange = true;
    }

    setIcon(fileName) {
        this.state.selectedObject.setIcon(fileName);
        canvasDraw.drawAll();
        PropertyChange = true;
    }

    setNavigable(side){

        this.state.selectedObject.toggleNavigable(side);

        document.getElementById("SourceIsNavigable").checked = this.state.selectedObject.getNavigable(0);
        document.getElementById("DestIsNavigable").checked = this.state.selectedObject.getNavigable(1);
        canvasDraw.drawAll()
        PropertyChange = true;
    }

    setAggregation(side){
        if(!this.state.selectedObject.getNavigable(side)){
            this.state.selectedObject.toggleNavigable(side);
        }
        this.state.selectedObject.toggleAggregation(side);
        let SourceAggregation = this.state.selectedObject.getAggregation(0);
        let DestAggregation = this.state.selectedObject.getAggregation(1);
        if(SourceAggregation) {
            document.getElementById("SourceIsNavigable").checked = true;
        }
        if(DestAggregation){
            document.getElementById("DestIsNavigable").checked = true;
        }
        document.getElementById("SourceIsAggregation").checked = SourceAggregation;
        document.getElementById("DestIsAggregation").checked = DestAggregation;
        canvasDraw.drawAll()
        PropertyChange = true;
    }

    deselectElement(){
        this.props.setLeftMenu(null);
        canvasDraw.drawAll();
    }

    showTreeView(){
        this.state.selectedObject(null)
        canvasDraw.drawAll();
    }

    stripElement(e){
        e.preventDefault()
        this.state.selectedObject.trimPath();
        canvasDraw.drawAll()
    }

   
    deleteTitle = () => {
        this.setState({title: ""})
    };


// return the correct menu based on the selected item
    getMenu = () =>{

        

        let leftMenuContents;

        let toolbar = <div id = "Toolbar" className = "Toolbar">
            <div id = "Select" className="ToolbarItem" onClick={() => this.props.setMode(Tool.Select)}><img src={iconSelect} alt ="Select"/></div>

            <div id = "Vertex" className="ToolbarItem" onClick={() => {this.props.setMode(Tool.Vertex); }} onKeyDown={() => this.onKeyPressed()}    ><img src={iconVertex} alt ="Vertex"/></div>

            <div id = "Edge" className="ToolbarItem" onClick={() => this.props.setMode(Tool.Edge)}><img src={iconEdge} alt ="Edge"/></div>

            <div id = "Specialisation" className="ToolbarItem" onClick={() => this.props.setMode(Tool.Specialisation)}><img src={iconSpecialisation} alt ="Specialisation"/></div>
            
            <div id = "Visibility" className="ToolbarItem" onClick={() => this.props.setMode(Tool.Visibility)}><img src={iconVisibility} alt ="Visibility"/></div>

        </div>;

        if (this.state.menu === LeftMenuType.TreeView) {
            leftMenuContents = <ContainmentTree setLeftMenu = {this.props.setLeftMenu} />

        } else if (this.state.menu === LeftMenuType.Vertex) {
            canvasDraw.drawAll();
            
            leftMenuContents = <div id = "VertexMenu">
                <div className="LeftHeader">Vertex Properties</div>
                <label className="LeftLabel">Title</label>
                <input id="LeftTitle" className="LeftTitle" value={this.state.selectedObject.title} onChange={this.handleChange}/>
                <label className="LeftSpacer">&nbsp;</label>

                <label className="LeftLabel">Content</label>
                <textarea id="LeftContent" className ="LeftContent" value={this.state.selectedObject.getContentAsString()} onChange={this.handleChange}/>
                <label className="LeftSpacer">&nbsp;</label>

                {this.getS23MIconsSelector()}
                <label className="LeftSpacer">&nbsp;</label>

                {this.getColourPicker()}
                <label className="LeftSpacer">&nbsp;</label>

                <label className="LeftLabel">Is Abstract?</label>
                <input type="checkbox" id="IsAbstract" className="LeftCheckbox" defaultChecked={this.state.selectedObject.getAbstract()} onClick={() => this.toggleAbstract()}/>
                <label className="LeftSpacer">&nbsp;</label>

                <button className="LeftMenuButton" onClick={() => this.deselectElement()}>Deselect</button>
                <label className="LeftSpacer">&nbsp;</label>
                <button className="LeftMenuButton" onClick={() => { vertexDeleteElement(this.state.selectedObject); this.deselectElement()}}>Remove</button>

                <label className="LeftSpacer">&nbsp;</label>
                

            </div>;
            
        } else if (this.state.menu === LeftMenuType.Arrow) {

            if(this.state.selectedObject.edgeType === Tool.Edge){

            leftMenuContents = <div id = "ArrowMenu">
                <div className="LeftHeader">Edge Properties</div>

                <label className="LeftLabel">Source Is Navigable?</label>
                <input type="checkbox" id="SourceIsNavigable" className="LeftCheckbox" checked={this.state.selectedObject.getNavigable(0)} onChange={() => this.setNavigable(0)}/>

                <label className="LeftLabel">Destination Is Navigable?</label>
                <input type="checkbox" id="DestIsNavigable" className="LeftCheckbox" checked={this.state.selectedObject.getNavigable(1)} onChange={() => this.setNavigable(1)}/>

                <label className="LeftLabel">Source Is Aggregation?</label>
                <input type="checkbox" id="SourceIsAggregation" className="LeftCheckbox" checked={this.state.selectedObject.getAggregation(0)}onChange={() => this.setAggregation(0)}/>

                <label className="LeftLabel">Destination Is Aggregation?</label>
                <input type="checkbox" id="DestIsAggregation" className="LeftCheckbox" checked={this.state.selectedObject.getAggregation(1)} onChange={() => this.setAggregation(1)}/>

                <label className="LeftLabel">Line Colour</label>
                <select name="LineColour" id="LineColour" className="LeftSelector" defaultValue={LineColourToStringName[this.state.selectedObject.lineColour]} onChange={() => this.setColour()}>
                    <option value = "Black">Black</option>
                    <option value = "Red">Red</option>
                    <option value = "Blue">Blue</option>
                    <option value = "Green">Green</option>
                </select>
                <label className="LeftSpacer">&nbsp;</label>

                {/* -1 represents n or *  */}
                <label className="LeftLabel">Source Cardinality</label>
                <div className="CardinalityArea"> <div className="LeftCheckboxLabel"> Visible: </div> <input type="checkbox" id = "sourceCardinalityShown" className="LeftCheckbox" defaultChecked={this.state.selectedObject.getSourceCardinalityVisibility()} onChange={() => {this.toggleSourceCardinalityVisibility();canvasDraw.drawAll()}}/>
                    <input type="number" id = "sourceFromCardindality" className="CardinalityBox" defaultValue={this.state.selectedObject.getSourceCardinalityLowerBound()} min="0" max="25" onChange={() => this.updateCardinality()}/>
                    <label>..</label>
                    <input type="number" id = "sourceToCardindality" className="CardinalityBox" defaultValue={this.state.selectedObject.getSourceCardinalityUpperBound()} min="-1" max="25" onChange={() => this.updateCardinality()}/>
                </div>


                <label className="LeftLabel">Destination Cardinality</label>
                <div className="CardinalityArea"> <div className="LeftCheckboxLabel">Visible:</div> <input type="checkbox" id = "destCardinalityShown" className="LeftCheckbox" defaultChecked={this.state.selectedObject.getDestCardinalityVisibility()} onChange={() => {this.toggleDestCardinalityVisibility();canvasDraw.drawAll()}}/>
                    <input type="number" id = "destFromCardindality" className="CardinalityBox" defaultValue={this.state.selectedObject.getDestCardinalityLowerBound()} min="0" max="25" onChange={() => this.updateCardinality()}/>
                    <label>..</label>
                    <input type="number" id = "destToCardindality" className="CardinalityBox" defaultValue={this.state.selectedObject.getDestCardinalityUpperBound()} min="-1" max="25" onChange={() => this.updateCardinality()}/>
                </div>

                <label className="LeftLabel">Source Label</label>
                    <input id="SourceLabel" className="LeftTitle" defaultValue={this.state.selectedObject.sourceEdgeEnd.label} onKeyUp={() => this.setStartLabel()}/>
                <label className="LeftSpacer">&nbsp;</label>

                <label className="LeftLabel">Destination Label</label>
                    <input id="DestLabel" className="LeftTitle" defaultValue={this.state.selectedObject.destEdgeEnd.label} onKeyUp={() => this.setEndLabel()}/>
                <label className="LeftSpacer">&nbsp;</label>
                <button className="LeftMenuButton" onClick={() => { deleteElement(this.state.selectedObject); this.deselectElement()}}>Remove</button>
                <label className="LeftSpacer">&nbsp;</label>
                <button className="LeftMenuButton" onClick={() => this.deselectElement()}>Deselect</button>
                <label className="LeftSpacer">&nbsp;</label>

            </div>
            }else{
                leftMenuContents = <form id = "ArrowMenu">
                    <div className="LeftHeader">Selected Edge</div>
                    <button className="LeftMenuButton" onClick={() => this.deselectElement()}>Deselect</button>
                    <label className="LeftSpacer">&nbsp;</label>
                    <button className="LeftMenuButton" onClick={() => {deleteElement(this.state.selectedObject); this.deselectElement()}}>Remove</button>
                    </form>
            }
        }

        return <div>{toolbar}<form ref={this.setFormRef} className={this.props.className}>
            {leftMenuContents}
            </form></div>;
        
    };

    render() {
        let menu = this.getMenu();
        if (this.formRef !== null) {
            this.formRef = null;
        }
        return menu;
    }


}