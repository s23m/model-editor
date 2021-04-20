/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import {currentObjects, setCurrentObjects, updateArrows} from "../UIElements/CanvasDraw"
import {version} from "../UIElements/MainView"
import {setTranslationColumns, translationColumns} from "../UIElements/SemanticDomainEditor"
import {getModelName} from "../UIElements/CanvasDraw";

import {Vertex} from "../DataStructures/Vertex";
import {Arrow} from "../DataStructures/Arrow";
import {Cardinality} from "../DataStructures/Cardinality";
import {EdgeEnd} from "../DataStructures/EdgeEnd";
import {Graph} from "../DataStructures/Graph";
import { SemanticIdentity } from "../DataStructures/SemanticIdentity";

export function getSaveData() {
    let vertexObjects = currentObjects.flatten(true, false);
    let arrowObjects = currentObjects.flatten(false, true);

    // Combine into save data
    let saveData = {
        // The version is being saved in the savefile
        // this is so in future versions, if the serialisation changes
        // They can upgrade the the file to one compatibile with the newer version
        version: version,

        // Translations for semantic domain editor
        translationColumns: translationColumns,

        // The data here should all have uuids and should be convertible back into their objects.
        vertices: vertexObjects,
        arrows: arrowObjects,

        "modelName":getModelName()
    };


    return saveData;
}

export function save() {
    let JSONdata = getSaveData();
    let dataStr = JSON.stringify(JSONdata);

    let DLelement = document.createElement("a");
    let dataFile = new Blob([dataStr], {type: 'text/json'});

    DLelement.href = URL.createObjectURL(dataFile);
    let title = getModelName();
    if (title === "") {
        title = "untitled";
    }
    DLelement.download = title + ".json";
    document.body.appendChild(DLelement);
    DLelement.click();
}

// This is done since serialised objects lose their methods
// verticesArray parameter is only used when rebuilding an Arrow type
export function rebuildObject(item, verticesArray) {
    switch (item.typeName) {
        case "Vertex":
            var vertex = new Vertex(item.title, item.content, item.x, item.y, item.width, item.height, item.semanticIdentity);
            return vertex;

        case "Arrow":
        case "Edge":
        case "Specialisation":
        case "Visibility":
            var arrow = new Arrow(verticesArray, item.pathData, item.edgeType, rebuildObject(item.semanticIdentity));
            arrow.sourceEdgeEnd = rebuildObject(item.sourceEdgeEnd);
            arrow.destEdgeEnd = rebuildObject(item.destEdgeEnd);
            return arrow;

        case "Cardinality":
            return new Cardinality(item.numLowerBound, item.numUpperBound, item.attachedToUUID, item.isVisible, rebuildObject(item.semanticIdentity));

        case "EdgeEnd":
            return new EdgeEnd(item.attachedToUUID, item.headType, rebuildObject(item.cardinality), item.label, rebuildObject(item.semanticIdentity));

        case "SemanticIdentity":
            return new SemanticIdentity(item.name, item.description, item.abbreviation, item.shortAbbreviation, item.UUID, item.translations);
        default:
            console.error("Unknown object to deserialise ", item);
            break;
    }
}

export function open(jsonString) {
    if (jsonString == null) return;
    try {
        var loadedJSON = JSON.parse(jsonString);

        // Loaded objects ONLY with variables
        setTranslationColumns(loadedJSON.translationColumns);

        // Update current objects
        var newVertices = [];
        var newArrows = [];
        for (let serialisedVertex of loadedJSON.vertices) {
            if (serialisedVertex !== null) {
                newVertices.push(rebuildObject(serialisedVertex));
            }
        }

        for (let serialisedArrow of loadedJSON.arrows) {
            if (serialisedArrow !== null) {
                newArrows.push(rebuildObject(serialisedArrow, newVertices));
            }
        }

        setCurrentObjects(new Graph(newVertices, newArrows));

        //Rebuild arrow paths
        updateArrows();

    } catch (e) {
        alert(e);
    }

}