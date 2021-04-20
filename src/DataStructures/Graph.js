/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

class VertexNode {
    constructor(vertex) {
        this.vertex = vertex;
        this.children = new Set();
    }

    add(node) {
        this.children.add(node);
    }

    remove(traversedVertices, node) {
        let isRemoved = false;
        traversedVertices.add(this);

        //Remove from the current vertex
        isRemoved = this.children.has(node);
        this.children.delete(node);

        //Continue to remove from anywhere deeper in the tree
        for (let child of this.children) {
            if (!traversedVertices.has(child)) {
                traversedVertices.add(child);
                isRemoved |= child.remove(traversedVertices, node);
            }
        }

        return isRemoved;
    }

    getVertexNode(traversedVertices, vertex, recursive = true) {
        for (let child of this.children) {
            if (!traversedVertices.has(child)) {
                traversedVertices.add(child);

                if (child.vertex.semanticIdentity.UUID === vertex.semanticIdentity.UUID) {
                    return child;
                } else if (recursive) {
                    let node = child.getVertexNode(traversedVertices, vertex);
                    if (node !== null) {
                        return node;
                    }
                }
            }
        }

        return null;
    }

    //Remove from just the children of this object, without removing from deeper in the tree
    removeFromChildren(node) {
        if (this.children.has(node)) {
            this.children.delete(node);
            return true;

        } else {
            return false;
        }
    }

    flatten(traversedVertices) {
        var flattenedArray = [];

        for (let childNode of this.children) {
            if (!traversedVertices.has(childNode)) {
                traversedVertices.add(childNode);
                flattenedArray.push(childNode.vertex);

                if (childNode !== null) {
                    flattenedArray.push(...childNode.flatten(traversedVertices));
                }
            }
        }

        return flattenedArray;
    }

    flattenVertexNodes(traversedVertices) {
        var flattenedArray = [];

        for (let childNode of this.children) {
            if (!traversedVertices.has(childNode)) {
                traversedVertices.add(childNode);
                flattenedArray.push(childNode);

                if (childNode !== null) {
                    flattenedArray.push(...childNode.flattenVertexNodes(traversedVertices));
                }
            }
        }

        return flattenedArray;
    }

    has(traversedVertices, node) {
        //Search for object in children
        if (this.children.has(node)) {
            return true;

        } else {

            //Search for object in children of children
            for (let child of this.children) {
                if (!traversedVertices.has(child)) {
                    traversedVertices.add(child);
                    if (child.has(traversedVertices, node)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    toTreeViewElement(traversedVertices) {
        let children = [];
        let traversed = traversedVertices.has(this);
        if (!traversed) {
            traversedVertices.add(this);
            for (let child of this.children) {
                children.push(child.toTreeViewElement(traversedVertices));
            }
        }

        let text = this.vertex.title;

        if (text === null || text === "") {
            text = "Unnamed Vertex";
        }

        return {
            text: text,
            children: children,
            data: this.vertex,
            state: { opened: true }
        };
    }
}

class ArrowEdge {
    constructor(flattenedVertexNodes, arrow) {
        this.arrow = arrow;
        this.updateVertices(flattenedVertexNodes);
    }

    updateVertices(flattenedVertexNodes) {
        this.sourceVertexNodeObject = null;
        this.destVertexNodeObject = null;

        if (this.arrow !== null) {
            let isSourceFound = this.arrow.sourceVertexUUID === null;
            let isDestFound = this.arrow.destVertexUUID === null;

            for (let vertexNode of flattenedVertexNodes) {
                if (isSourceFound && isDestFound) {
                    break;
                }

                if (vertexNode !== null) {
                    if (vertexNode.vertex.semanticIdentity.UUID === this.arrow.sourceVertexUUID) {
                        this.sourceVertexNodeObject = vertexNode;
                        isSourceFound = true;

                    } else if (vertexNode.vertex.semanticIdentity.UUID === this.arrow.destVertexUUID) {
                        this.destVertexNodeObject = vertexNode;
                        isDestFound = true;
                    }
                }
            }
        
        }
    }

    set sourceVertexNode(vertexNode) {
        this.sourceVertexNodeObject = vertexNode;

        if (vertexNode !== null) {
            this.arrow.sourceVertexUUID = vertexNode.vertex.semanticIdentity.UUID;
        } else {
            this.arrow.sourceVertexUUID = null;
        }
    }

    get sourceVertexNode() {
        return this.sourceVertexNodeObject;
    }

    get sourceVertex() {
        if (this.sourceVertexNodeObject !== null) {
            return this.sourceVertexNodeObject.vertex;
        } else {
            return null;
        }
    }

    set destVertexNode(vertexNode) {
        this.destVertexNodeObject = vertexNode;

        if (vertexNode !== null) {
            this.arrow.destVertexUUID = vertexNode.vertex.semanticIdentity.UUID;
        } else {
            this.arrow.destVertexUUID = null;
        }
    }

    get destVertexNode() {
        return this.destVertexNodeObject;
    }

    get destVertex() {
        if (this.destVertexNodeObject !== null) {
            return this.destVertexNodeObject.vertex;
        } else {
            return null;
        }
    }
}

//Supply with an array/set of Vertex objects or Arrow objects (NOT ArrowEdge objects)
export class Graph {
    constructor(vertexArrayFlattened, arrowArrayFlattened) {
        this.rootVertices = new Set();
        if (vertexArrayFlattened !== undefined) {
            this.add(vertexArrayFlattened);
        }

        this.arrows = new Set();
        if (arrowArrayFlattened !== undefined) {
            this.add(arrowArrayFlattened);
        }
    }

    add(objects) {
        if (!Array.isArray(objects)) {
            objects = [objects];
        }

        for (let object of objects) {
            switch (object.constructor.name) {
                case "Vertex":
                    this.addVertex(object);
                    break;
                case "Arrow":
                    this.addArrow(object);
                    break;
                case "VertexNode":
                    this.rootVertices.add(object);
                    break;
                case "ArrowEdge":
                    this.arrows.add(object);
                    break;
                default:
                    console.error("Attempted to add object to unknown type %s to Graph", object.constructor.name)
                    break;
            }
        }
    }

    addVertex(vertex) {
        if (this.getVertexNode(vertex) === null) {
            vertex = new VertexNode(vertex);
            this.rootVertices.add(vertex);
        } else {
            console.error("Attempted to add duplicate vertex");
        }
    }

    //NOTE: Graph direction is inverted, flowing from the dest to source of arrows
    //This is intentional behaviour of the modelling spec
    addArrow(arrow) {
        if (this.getArrowEdge(arrow) === null) {
            arrow = new ArrowEdge(this.flattenVertexNodes(), arrow);
            this.arrows.add(arrow);

            if (arrow.destVertexNode !== null && arrow.sourceVertexNode !== null) {
                arrow.destVertexNode.add(arrow.sourceVertexNode);

                //If the destination of the arrow is currently a root vertex,
                //search for if the destination has any other possible roots,
                //and remove from the root ONLY IF another root is found
                //This retains an entry point for the graph even if there is a cycle back to root
                if (this.rootVertices.has(arrow.sourceVertexNode)) {
                    let isAnotherRoot = false;

                    for (let vertexNode of this.rootVertices) {
                        if (vertexNode.vertex.semanticIdentity.UUID === arrow.sourceVertex.semanticIdentity.UUID) {
                            continue;
                        }

                        if (vertexNode.has(new Set(), arrow.sourceVertexNode)) {
                            isAnotherRoot = true;
                        }
                    }

                    if (isAnotherRoot) {
                        this.rootVertices.delete(arrow.sourceVertexNode);
                    }
                }
            }

        } else {
            console.error("Attempted to add duplicate arrow");
        }
    }

    //Removes and object while shifting it's children's position in the tree
    remove(object) {
        if (object.constructor.name === "Vertex") {
            object = this.getVertexNode(object);
            let isRemoved = this.rootVertices.has(object);

            //Remove from the root
            this.rootVertices.delete(object);
            for (let child of object.children) {
                this.rootVertices.add(child);
            }
            
            //Remove from anywhere deeper in the tree
            let traversedVertices = new Set();
            for (let vertexNode of this.rootVertices) {
                if (!traversedVertices.has(vertexNode)) {
                    traversedVertices.add(vertexNode);
                    isRemoved |= vertexNode.remove(traversedVertices, object);
                }
            }
            
            if (isRemoved) {
                //Remove the vertex from being the source or dest of any arrow
                for (let arrow of this.arrows) {
                    if (arrow.sourceVertexNode !== null && arrow.sourceVertex.semanticIdentity.UUID === object.vertex.semanticIdentity.UUID) {
                        arrow.sourceVertexNode = null;
                    }
                    
                    if (arrow.destVertexNode !== null && arrow.destVertex.semanticIdentity.UUID === object.vertex.semanticIdentity.UUID) {
                        arrow.destVertexNode = null;
                    }
                }
            }

            return isRemoved;

        } else if (object.constructor.name === "Arrow") {
            object = this.getArrowEdge(object);

            if (object !== null) {
                this.arrows.delete(object);
                //IF arrow has a sourceVertex AND destVertex
                if (object.sourceVertexNode !== null && object.destVertexNode !== null) {
                    //IF there is no other arrow from sourceVertex to destVertex, remove the sourceVertex from the children of destVertex
                    //AND move the sourceVertex to root, if there is no other arrow with the same sourceVertex
                    let isEquivalentArrow = false;
                    let isArrowWithSameSource = false;
                    
                    for (let arrow of this.arrows) {
                        let isEquivalentSource = arrow.sourceVertexNode !== null && arrow.sourceVertex.semanticIdentity.UUID === object.sourceVertex.semanticIdentity.UUID;
                        let isEquivalentDest = arrow.destVertexNode !== null && arrow.destVertex.semanticIdentity.UUID === object.destVertex.semanticIdentity.UUID;
                        
                        if (isEquivalentSource && isEquivalentDest) {
                            isEquivalentArrow = true;
                        }
                        if (isEquivalentSource && arrow.destVertexNode !== null) {
                            isArrowWithSameSource = true;
                        }
                    }
                    
                    if (!isEquivalentArrow) {
                        object.destVertexNode.removeFromChildren(object.sourceVertexNode);
                    }
                    if (!isArrowWithSameSource) {
                        this.add(object.sourceVertexNode);
                    }

                    //Remove vertex from the root if removing this arrow has resolved a cycle
                    if (object.sourceVertexNode.has(new Set(), object.destVertexNode)) {
                        this.rootVertices.delete(object.destVertexNode);
                    }
                }

                return true;
            }

        } else {
            if (object !== null) {
                console.error("Attempted to remove object of invalid type %s to Graph", object.constructor.name);
            } else {
                console.error("Attempted to remove null from Graph");
            }
        }

        return false;
    }

    has(object) {
        //Search for object in root vertices
        if (this.rootVertices.has(object)) {
            return true;

        } else {
            let traversedVertices = new Set();

            //Search for object in children of root vertices
            for (let vertex of this.rootVertices) {
                if (!traversedVertices.has(vertex)) {
                    traversedVertices.add(vertex);
                    if (vertex.has(traversedVertices, object)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    getVertexNode(vertex) {
        let traversedVertices = new Set();

        for (let rootNode of this.rootVertices) {
            if (!traversedVertices.has(rootNode)) {
                traversedVertices.add(rootNode);
                if (rootNode.vertex.semanticIdentity.UUID === vertex.semanticIdentity.UUID) {
                    return rootNode;
                } else {
                    let node = rootNode.getVertexNode(traversedVertices, vertex);
                    if (node !== null) {
                        return node;
                    }
                }
            }
        }

        return null;
    }

    getArrowEdge(arrow) {
        for (let arrowEdge of this.arrows) {
            if (arrowEdge.arrow.semanticIdentity.UUID === arrow.semanticIdentity.UUID) {
                return arrowEdge;
            }
        }

        return null;
    }

    flatten(doFlattenVertices = true, doFlattenArrows = true) {
        let verticesSet = new Set();
        let arrowsSet = new Set();

        let traversedVertices = new Set();

        if (doFlattenVertices) {
            for (let vertexNode of this.rootVertices) {
                if (!traversedVertices.has(vertexNode)) {
                    traversedVertices.add(vertexNode);
                    verticesSet.add(vertexNode.vertex);
    
                    if (vertexNode !== null) {
                        for (let child of vertexNode.flatten(traversedVertices)) {
                            verticesSet.add(child);
                        }
                    }
                }
            }
        }
        
        if (doFlattenArrows) {
            for (let arrowEdge of this.arrows) {
                arrowsSet.add(arrowEdge.arrow);
            }
        }

        let flattenedArray = Array.from(verticesSet);
        return flattenedArray.concat(Array.from(arrowsSet));
    }

    flattenVertexNodes() {
        var verticesSet = new Set();
        let traversedVertices = new Set();

        for (let vertexNode of this.rootVertices) {
            if (!traversedVertices.has(vertexNode)) {
                traversedVertices.add(vertexNode);
                verticesSet.add(vertexNode);

                if (vertexNode !== null) {
                    for (let child of vertexNode.flattenVertexNodes(traversedVertices)) {
                        verticesSet.add(child);
                    }
                }
            }
        }

        return Array.from(verticesSet);
    }
}