/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

 //EDGE ENDS
export const EdgeEnd = {
    NONE: "None",
    ARROW: "Arrow",
    TRIANGLE: "Triangle",
    FILLED_TRIANGLE: "Filled Triangle",
    DIAMOND: "Diamond",
    FILLED_DIAMOND: "Filled Diamond"
};

export const EdgeEndToString = {};
EdgeEndToString[EdgeEnd.NONE] = "None";
EdgeEndToString[EdgeEnd.ARROW] = "Arrow";
EdgeEndToString[EdgeEnd.TRIANGLE] = "Triangle";
EdgeEndToString[EdgeEnd.FILLED_TRIANGLE] = "FilledTriangle";
EdgeEndToString[EdgeEnd.DIAMOND] = "Diamond";
EdgeEndToString[EdgeEnd.FILLED_DIAMOND] = "FilledDiamond";

export const StringToEdgeEnd = {};
StringToEdgeEnd["None"] = EdgeEnd.NONE;
StringToEdgeEnd["Arrow"] = EdgeEnd.ARROW;
StringToEdgeEnd["Triangle"] = EdgeEnd.TRIANGLE;
StringToEdgeEnd["FilledTriangle"] = EdgeEnd.FILLED_TRIANGLE;
StringToEdgeEnd["Diamond"] = EdgeEnd.DIAMOND;
StringToEdgeEnd["FilledDiamond"] = EdgeEnd.FILLED_DIAMOND;

//LINE COLOURS
export const LineColour = {
    BLACK: "#000000",
    RED: "#FF0000",
    BLUE: "#0000FF",
    GREEN: "#00FF00"
};

export const LineColourToStringName = {};
LineColourToStringName[LineColour.BLACK] = "Black";
LineColourToStringName[LineColour.RED] = "Red";
LineColourToStringName[LineColour.BLUE] = "Blue";
LineColourToStringName[LineColour.GREEN] = "Green";

export const StringNameToLineColour = {};
StringNameToLineColour["Black"] = LineColour.BLACK;
StringNameToLineColour["Red"] = LineColour.RED;
StringNameToLineColour["Blue"] = LineColour.BLUE;
StringNameToLineColour["Green"] = LineColour.GREEN;

//LINE TYPES
export const LineType = {
    SOLID: 1,
    DASHED: 2
};

export const LineTypeToString = {};
LineTypeToString[LineType.SOLID] = "Solid";
LineTypeToString[LineType.DASHED] = "Dashed";

export const StringToLineType = {};
StringToLineType["Solid"] = LineType.SOLID;
StringToLineType["Dashed"] = LineType.DASHED;