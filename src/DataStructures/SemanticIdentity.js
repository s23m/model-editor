/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export function createUUID() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        // eslint-disable-next-line
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

export class SemanticIdentity {
    constructor(name, description, abbreviation, shortAbbreviation, UUID, translations){
        this.typeName = "SemanticIdentity";
        
        if (UUID !== undefined){
            this.UUID = UUID;
        } else {
            this.UUID = createUUID();
        }

        this.name = name;
        this.description = description;
        this.abbreviation = abbreviation;
        this.shortAbbreviation = shortAbbreviation;

        if (translations !== undefined){
            this.translations = translations;
        } else {
            this.translations = [];
        }
    }
}