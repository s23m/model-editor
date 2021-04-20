/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import {getDistance} from "../UIElements/CanvasDraw";

export function pathFindTo(nodes, start, dest) {
    var startNode = getNodeByID(nodes, start);
    var destNode = getNodeByID(nodes, dest);

    var path = [startNode];
    var currentNode = path[0];

    // While last node in list is not destination
    while (currentNode[0] !== dest) {
        var possibleNodes = currentNode[3];

        // Remove all nodes already followed
        for (let i = 0; i < path.length; i++) {
            let pathID = path[i][0];
            for (let o = 0; o < possibleNodes; o++) {
                if (pathID === possibleNodes[o]) {
                    // Remove
                    possibleNodes.splice(o, 1);

                    break;
                }
            }
        }

        // Check to see if there are any possible nodes left
        if (possibleNodes.length === 0) {
            console.error("No possible nodes to follow.");
            return path;
        }

        // Follow closest node
        var closestNode = getNodeByID(nodes, possibleNodes[0]);
        var closestDistance = getDistanceFromNodes(closestNode, destNode);
        for (let i = 1; i < possibleNodes.length; i++) {
            var checkNode = getNodeByID(nodes, possibleNodes[i]);
            var checkDistance = getDistanceFromNodes(checkNode, destNode);

            if (checkDistance < closestDistance) {
                closestNode = checkNode;
                closestDistance = checkDistance;
            }
        }

        // Begin path finding again
        path.push(closestNode);
        currentNode = closestNode;
    }

    return path;
}

function getNodeByID(nodes, id) {
    if (nodes === undefined || nodes === null) {
        console.error("The parameter nodes is null/undefined!");
    }
    if (id === undefined || id === null) {
        console.error("The parameter id is null/undefined!");
    }

    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i][0] === id) {
            return nodes[i];
        }
    }

    console.error("Could not find node by id '" + id + "'");
    return null;
}

export function getDistanceFromNodes(nodeA, nodeB) {
    return getDistance(nodeA[1], nodeA[2], nodeB[1], nodeB[2]);
}