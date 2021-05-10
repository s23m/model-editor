/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import React from 'react';
import * as canvasDraw from "./CanvasDraw";
import {LineColourToStringName, LineTypeToString} from "../DataStructures/ArrowProperties"
import { ContainmentTree } from "./ContainmentTree";

import { SketchPicker } from 'react-color';

// Icons
import iconVertex from "../Resources/vertex.svg";
import iconEdge from "../Resources/edge.svg";
import iconSpecialisation from "../Resources/specialisation.svg";
import iconVisibility from "../Resources/visibility.svg"
import iconSelect from "../Resources/select.svg"

import {deleteElement} from "./CanvasDraw";
import DropdownButton from "react-bootstrap/DropdownButton";

//Property Enums
export const LeftMenuType = {
    TreeView: "TreeView",
    Vertex: "Vertex",
    Arrow: "Arrow"
};

export const LeftMenuTypeToString = {};
LeftMenuTypeToString[LeftMenuType.TreeView] = "TreeView";
LeftMenuTypeToString[LeftMenuType.Vertex] = "Vertex";
LeftMenuTypeToString[LeftMenuType.Arrow] = "Arrow";

export const StringToLeftMenuType = {};
LeftMenuTypeToString["TreeView"] = LeftMenuType.TreeView;
LeftMenuTypeToString["Vertex"] = LeftMenuType.Vertex;
LeftMenuTypeToString["Arrow"] = LeftMenuType.Arrow;

export const Tool = {
    Select: "Select",
    Vertex: "Vertex",
    Visibility: "Visibility",
    Edge: "Edge",
    Specialisation: "Specialisation"
};

// class to display the left hand menu, where we will be showing
// object editing tools for now
export class LeftMenu extends React.Component{

    constructor(props) {
        super();
        this.state = {
            menu: LeftMenuType.TreeView,
            selectedObject: null,
            fileNames: []
        };
        this.setTitle = this.setTitle.bind(this);
        this.setContent = this.setContent.bind(this);

        this.formRef = null;

        this.setFormRef = element =>{
            this.formRef = element;
        };

        this.setIcons();

    }

    componentDidMount() {
        this.menu = this.props.mainState.menu;
        this.selectedItem = this.props.mainState.drawMode;
        this.props.setMode(this.selectedItem)

        document.addEventListener("keydown", this.onKeyPressed.bind(this));
    }

    //For quickkeys
    onKeyPressed(e){
        if (e.keyCode === 86){
            this.props.setMode(Tool.Vertex);
            //alert('yeet');
        }

        if (e.keyCode === 69){
            this.props.setMode(Tool.Edge);
        }

        if (e.keyCode === 46){
            deleteElement(this.state.selectedObject);this.setState({menu:"TreeView"});
        }

        
    }

    componentWillReceiveProps(nextProps,nextContext) {
        this.setState({menu:nextProps.mainState.menu});
        this.setState({selectedObject:nextProps.mainState.selectedObject});

        //document.removeEventListener("keydown", this.onKeyPressed.bind(this));

    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        let elem = document.getElementById("LeftTitle");
        if(elem !== null){
            if(document.getElementById("ModelName") !== document.activeElement) {
                elem.select();
                elem.click()
            }
        }
        let leftmenu = document.getElementById("VertexMenu");
        if(leftmenu === null){
            leftmenu = document.getElementById("ArrowMenu");
        }
        if(leftmenu !== null){
            leftmenu.addEventListener("keypress", (e) => {
                if(e.key === "Enter") {
                    e.preventDefault();
                }
            })
        }

    }

    setIcons() {
        fetch('http://localhost:8080/icons/list',{
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
                this.setState({fileNames:fileNames})
            })
    }

    //VERTEX SETTERS
    setTitle() {
        let newTitle = document.getElementById("LeftTitle").value;
        this.state.selectedObject.setTitle(newTitle);
        canvasDraw.drawAll()
    }

    setContent() {
        let newContent = document.getElementById("LeftContent").value;
        newContent = newContent.split("\n");
        this.state.selectedObject.setContent(newContent);
        canvasDraw.drawAll()
    }

    //ARROW SETTERS
    setLineType() {
        let newLineType = document.getElementById("LineType").value;
        this.state.selectedObject.setLineType(newLineType);
        canvasDraw.drawAll()
    }

    setColour() {
        let newColour = document.getElementById("LineColour").value;
        this.state.selectedObject.setLineColour(newColour);
        canvasDraw.drawAll()
    }

    setStartLabel() {
        let newLabel = document.getElementById("SourceLabel").value;
        this.state.selectedObject.setStartLabel(newLabel);
        canvasDraw.drawAll();
    }

    setEndLabel() {
        let newLabel = document.getElementById("DestLabel").value;
        this.state.selectedObject.setEndLabel(newLabel);
        canvasDraw.drawAll();
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
    }

    toggleSourceCardinalityVisibility() {
        this.state.selectedObject.toggleSourceCardinalityVisibility();
        canvasDraw.drawAll();
    }

    toggleDestCardinalityVisibility() {
        this.state.selectedObject.toggleDestCardinalityVisibility();
        canvasDraw.drawAll();
    }

    toggleAbstract(){
        this.state.selectedObject.toggleAbstract()
        canvasDraw.drawAll()
    }

    getS23MIconsSelector() {
        let dropdownOptions = [<div className="DropdownItem"><div className="dropdownLabel">Name</div><div className="checkBoxContainer">Text</div><div className="checkBoxContainer">Icon</div></div>];

        let name = "";
        this.state.fileNames.forEach(fileName => {
            if (fileName.slice(-6, -4) === "_n") {
                name = fileName.slice(0, -6);
                dropdownOptions.push(<div className="DropdownItem" ref={fileName}> <div className="dropdownLabel">{name}</div> <div className="checkBoxContainer"><input type='checkbox' disabled="disabled" /> </div>  <div className="checkBoxContainer"><input type='checkbox' defaultChecked={this.shouldIconBeSelected(fileName)} onClick={() => {this.setIcon(fileName)}}/></div> </div>)
            } else {
                name = fileName.slice(0, -4);
                dropdownOptions.push(<div className="DropdownItem" ref={fileName}> <div className="dropdownLabel">{name}</div> <div className="checkBoxContainer"><input type='checkbox' defaultChecked={this.shouldTextBeSelected(fileName)} onClick={() => {this.setText(fileName)}} /> </div>  <div className="checkBoxContainer"><input type='checkbox' defaultChecked={this.shouldIconBeSelected(fileName)} onClick={() => {this.setIcon(fileName)}}/></div> </div>)
            }
        });

        return <DropdownButton title="Category Selector" name="Icons" id="IconSelector" className="IconSelector">
            {dropdownOptions}
        </DropdownButton>;
    }

    getVertexColour = () => {
        return this.state.selectedObject.getColour()
    };

    setVertexColour = (colour) =>{
        this.state.selectedObject.setColour(colour.hex);
        canvasDraw.drawAll()
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
    }

    setIcon(fileName) {
        this.state.selectedObject.setIcon(fileName);
        canvasDraw.drawAll();
    }

    setNavigable(side){

        this.state.selectedObject.toggleNavigable(side);

        document.getElementById("SourceIsNavigable").checked = this.state.selectedObject.getNavigable(0);
        document.getElementById("DestIsNavigable").checked = this.state.selectedObject.getNavigable(1);
        canvasDraw.drawAll()
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
    }

    deselectElement(){
        this.props.setLeftMenu(null);
        canvasDraw.drawAll();
    }

    stripElement(e){
        e.preventDefault()
        this.state.selectedObject.trimPath();
        canvasDraw.drawAll()
    }

// return the correct menu based on the selected item
    getMenu = () =>{

        

        let leftMenuContents;

        let toolbar = <div id = "Toolbar" className = "Toolbar">
            <div id = "Select" className="ToolbarItem" onClick={() => this.props.setMode(Tool.Select)}><img src={iconSelect} alt ="Select"/></div>
            <div id = "Vertex" className="ToolbarItem" onClick={() => this.props.setMode(Tool.Vertex)}  onKeyDown={() => this.onKeyPressed()}    ><img src={iconVertex} alt ="Vertex"/></div>
            <div id = "Edge" className="ToolbarItem" onClick={() => this.props.setMode(Tool.Edge)}><img src={iconEdge} alt ="Edge"/></div>
            <div id = "Specialisation" className="ToolbarItem" onClick={() => this.props.setMode(Tool.Specialisation)}><img src={iconSpecialisation} alt ="Specialisation"/></div>
            <div id = "Visibility" className="ToolbarItem" onClick={() => this.props.setMode(Tool.Visibility)}><img src={iconVisibility} alt ="Visibility"/></div>
        </div>;

        if (this.state.menu === LeftMenuType.TreeView) {
            leftMenuContents = <ContainmentTree setLeftMenu = {this.props.setLeftMenu} />;

        } else if (this.state.menu === LeftMenuType.Vertex) {
            canvasDraw.drawAll();

            leftMenuContents = <form id = "VertexMenu">
                <div className="LeftHeader">Vertex Properties</div>
                <label className="LeftLabel">Title</label>
                <input id="LeftTitle" className="LeftTitle" defaultValue={this.state.selectedObject.title} onKeyUp={() => this.setTitle()}/>
                <label className="LeftSpacer">&nbsp;</label>

                <label className="LeftLabel">Content</label>
                <textarea id="LeftContent" className ="LeftContent" defaultValue={this.state.selectedObject.getContentAsString()} onKeyUp={() => this.setContent()}/>
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
                <button className="LeftMenuButton" onClick={() => {deleteElement(this.state.selectedObject);this.setState({menu:"TreeView"})}} placeholder="NoTabIndex">Remove</button>
            </form>;

        } else if (this.state.menu === LeftMenuType.Arrow) {
            console.log("Arrow Selected");

            if(this.state.selectedObject.edgeType === Tool.Edge){

            leftMenuContents = <form id = "ArrowMenu">
                <div className="LeftHeader">Edge Properties</div>

                <label className="LeftLabel">Source Is Navigable?</label>
                <input type="checkbox" id="SourceIsNavigable" className="LeftCheckbox" defaultChecked={this.state.selectedObject.getNavigable(0)} onClick={() => this.setNavigable(0)}/>

                <label className="LeftLabel">Destination Is Navigable?</label>
                <input type="checkbox" id="DestIsNavigable" className="LeftCheckbox" defaultChecked={this.state.selectedObject.getNavigable(1)} onClick={() => this.setNavigable(1)}/>

                <label className="LeftLabel">Source Is Aggregation?</label>
                <input type="checkbox" id="SourceIsAggregation" className="LeftCheckbox" defaultChecked={this.state.selectedObject.getAggregation(0)} onClick={() => this.setAggregation(0)}/>

                <label className="LeftLabel">Destination Is Aggregation?</label>
                <input type="checkbox" id="DestIsAggregation" className="LeftCheckbox" defaultChecked={this.state.selectedObject.getAggregation(1)} onClick={() => this.setAggregation(1)}/>

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
                <button className="LeftMenuButton" onClick={() => { deleteElement(this.state.selectedObject); this.setState({ menu: LeftMenuType.TreeView, selectedObject: null }) }}>Remove</button>
                <label className="LeftSpacer">&nbsp;</label>
                <button className="LeftMenuButton" onClick={(e) => this.stripElement(e)}>Make Straight</button>
                <label className="LeftSpacer">&nbsp;</label>
                <button className="LeftMenuButton" onClick={() => this.deselectElement()}>Deselect</button>
                <label className="LeftSpacer">&nbsp;</label>
                <button className="LeftMenuButton" onClick={() => {deleteElement(this.state.selectedObject);this.setState({menu:LeftMenuType.TreeView,selectedObject:null})}}>Remove</button>

            </form>
            }else{
                leftMenuContents = <form id = "ArrowMenu">
                    <div className="LeftHeader">Selected Edge</div>
                    <button className="LeftMenuButton" onClick={() => this.deselectElement()}>Deselect</button>
                    <label className="LeftSpacer">&nbsp;</label>
                    <button className="LeftMenuButton" onClick={() => {deleteElement(this.state.selectedObject);this.setState({menu:LeftMenuType.TreeView,selectedObject:null})}}>Remove</button>

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
            this.formRef.reset();
        }
        return menu;
    }


}
