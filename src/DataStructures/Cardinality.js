/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { SemanticIdentity } from "./SemanticIdentity";

export class Cardinality {
    constructor(lowerBound, upperBound, attachedToUUID, isVisible = false, semanticIdentity) {
        this.typeName = "Cardinality";
        
        this.numLowerBound = lowerBound;
        this.numUpperBound = upperBound;
        this.attachedToUUID = attachedToUUID;
        this.isVisible = isVisible;

        if (semanticIdentity !== undefined){
            this.semanticIdentity = semanticIdentity;
        } else {
            this.semanticIdentity = new SemanticIdentity(this.toString(), this.getDescription())
        }
    }

    set lowerBound(value){
        this.numLowerBound = value;
        this.semanticIdentity.name = this.toString();
    }

    get lowerBound(){
        return this.numLowerBound;
    }

    set upperBound(value){
        this.numUpperBound = value;
        this.semanticIdentity.name = this.toString();
    }

    get upperBound(){
        return this.numUpperBound;
    }

    toggleVisibility() {
        this.isVisible = !this.isVisible;
    }

    toString() {
        var lower;
        var upper;

        if (this.lowerBound === '-1') {
            lower = 'n'
        } else {
            lower = this.lowerBound;
        }

        if (this.upperBound === '-1') {
            upper = 'n'
        } else {
            upper = this.upperBound;
        }

        if (lower === upper) {
            return lower;
        } else {
            return lower + " .. " + upper
        }
    }

    getDescription(){
        return `Cardinality of Edge End ${this.attachedToUUID}`;
    }
}