/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Renderer.js
 */

/**
 * Class: OpenLayers.ElementsIndexer
 * This class takes care of figuring out which order elements should be
 *     placed in the DOM based on given indexing methods. 
 */
OpenLayers.ElementsIndexer = OpenLayers.Class({
   
    /**
     * Property: maxZIndex
     * {Integer} This is the largest-most z-index value for a node
     *     contained within the indexer.
     */
    maxZIndex: null,
    
    /**
     * Property: order
     * {Array<String>} This is an array of node id's stored in the
     *     order that they should show up on screen. Id's higher up in the
     *     array (higher array index) represent nodes with higher z-indeces.
     */
    order: null, 
    
    /**
     * Property: indices
     * {Object} This is a hash that maps node ids to their z-index value
     *     stored in the indexer. This is done to make finding a nodes z-index 
     *     value O(1).
     */
    indices: null,
    
    /**
     * Property: compare
     * {Function} This is the function used to determine placement of
     *     of a new node within the indexer. If null, this defaults to to
     *     the Z_ORDER_DRAWING_ORDER comparison method.
     */
    compare: null,
    
    /**
     * APIMethod: initialize
     * Create a new indexer with 
     * 
     * Parameters:
     * yOrdering - {Boolean} Whether to use y-ordering.
     */
    initialize: function(yOrdering) {

        this.compare = yOrdering ? 
            OpenLayers.ElementsIndexer.IndexingMethods.Z_ORDER_Y_ORDER :
            OpenLayers.ElementsIndexer.IndexingMethods.Z_ORDER_DRAWING_ORDER;

        this.clear();
    },
    
    /**
     * APIMethod: insert
     * Insert a new node into the indexer. In order to find the correct 
     *     positioning for the node to be inserted, this method uses a binary 
     *     search. This makes inserting O(log(n)). 
     * 
     * Parameters:
     * newNode - {DOMElement} The new node to be inserted.
     * 
     * Returns
     * {DOMElement} the node before which we should insert our newNode, or
     *     null if newNode can just be appended.
     */
    insert: function(newNode) {
        // If the node is known to the indexer, remove it so we can
        // recalculate where it should go.
        if (this.exists(newNode)) {
            this.remove(newNode);
        }
        
        var nodeId = newNode.id;
        
        this.determineZIndex(newNode);       

        var leftIndex = -1;
        var rightIndex = this.order.length;
        var middle;

        while (rightIndex - leftIndex > 1) {
            middle = parseInt((leftIndex + rightIndex) / 2);
            
            var placement = this.compare(this, newNode,
                OpenLayers.Util.getElement(this.order[middle]));
            
            if (placement > 0) {
                leftIndex = middle;
            } else {
                rightIndex = middle;
            } 
        }
        
        this.order.splice(rightIndex, 0, nodeId);
        this.indices[nodeId] = this.getZIndex(newNode);
        
        // If the new node should be before another in the index
        // order, return the node before which we have to insert the new one;
        // else, return null to indicate that the new node can be appended.
        return this.getNextElement(rightIndex);
    },
    
    /**
     * APIMethod: remove
     * 
     * Parameters:
     * node - {DOMElement} The node to be removed.
     */
    remove: function(node) {
        var nodeId = node.id;
        var arrayIndex = OpenLayers.Util.indexOf(this.order, nodeId);
        if (arrayIndex >= 0) {
            // Remove it from the order array, as well as deleting the node
            // from the indeces hash.
            this.order.splice(arrayIndex, 1);
            delete this.indices[nodeId];
            
            // Reset the maxium z-index based on the last item in the 
            // order array.
            if (this.order.length > 0) {
                var lastId = this.order[this.order.length - 1];
                this.maxZIndex = this.indices[lastId];
            } else {
                this.maxZIndex = 0;
            }
        }
    },
    
    /**
     * APIMethod: clear
     */
    clear: function() {
        this.order = [];
        this.indices = {};
        this.maxZIndex = 0;
    },
    
    /**
     * APIMethod: exists
     *
     * Parameters:
     * node - {DOMElement} The node to test for existence.
     *
     * Returns:
     * {Boolean} Whether or not the node exists in the indexer?
     */
    exists: function(node) {
        return (this.indices[node.id] != null);
    },

    /**
     * APIMethod: getZIndex
     * Get the z-index value for the current node from the node data itself.
     * 
     * Parameters:
     * node - {DOMElement} The node whose z-index to get.
     * 
     * Returns:
     * {Integer} The z-index value for the specified node (from the node 
     *     data itself).
     */
    getZIndex: function(node) {
        return node._style.graphicZIndex;  
    },
    
    /**
     * Method: determineZIndex
     * Determine the z-index for the current node if there isn't one, 
     *     and set the maximum value if we've found a new maximum.
     * 
     * Parameters:
     * node - {DOMElement} 
     */
    determineZIndex: function(node) {
        var zIndex = node._style.graphicZIndex;
        
        // Everything must have a zIndex. If none is specified,
        // this means the user *must* (hint: assumption) want this
        // node to succomb to drawing order. To enforce drawing order
        // over all indexing methods, we'll create a new z-index that's
        // greater than any currently in the indexer.
        if (zIndex == null) {
            zIndex = this.maxZIndex;
            node._style.graphicZIndex = zIndex; 
        } else if (zIndex > this.maxZIndex) {
            this.maxZIndex = zIndex;
        }
    },

    /**
     * APIMethod: getNextElement
     * Get the next element in the order stack.
     * 
     * Parameters:
     * index - {Integer} The index of the current node in this.order.
     * 
     * Returns:
     * {DOMElement} the node following the index passed in, or
     *     null.
     */
    getNextElement: function(index) {
        var nextIndex = index + 1;
        if (nextIndex < this.order.length) {
            var nextElement = OpenLayers.Util.getElement(this.order[nextIndex]);
            if (nextElement == undefined) {
                nextElement = this.getNextElement(nextIndex);
            }
            return nextElement;
        } else {
            return null;
        } 
    },
    
    CLASS_NAME: "OpenLayers.ElementsIndexer"
});

/**
 * Namespace: OpenLayers.ElementsIndexer.IndexingMethods
 * These are the compare methods for figuring out where a new node should be 
 *     placed within the indexer. These methods are very similar to general 
 *     sorting methods in that they return -1, 0, and 1 to specify the 
 *     direction in which new nodes fall in the ordering.
 */
OpenLayers.ElementsIndexer.IndexingMethods = {
    
    /**
     * Method: Z_ORDER
     * This compare method is used by other comparison methods.
     *     It can be used individually for ordering, but is not recommended,
     *     because it doesn't subscribe to drawing order.
     * 
     * Parameters:
     * indexer - {<OpenLayers.ElementsIndexer>}
     * newNode - {DOMElement}
     * nextNode - {DOMElement}
     * 
     * Returns:
     * {Integer}
     */
    Z_ORDER: function(indexer, newNode, nextNode) {
        var newZIndex = indexer.getZIndex(newNode);

        var returnVal = 0;
        if (nextNode) {
            var nextZIndex = indexer.getZIndex(nextNode);
            returnVal = newZIndex - nextZIndex; 
        }
        
        return returnVal;
    },

    /**
     * APIMethod: Z_ORDER_DRAWING_ORDER
     * This method orders nodes by their z-index, but does so in a way
     *     that, if there are other nodes with the same z-index, the newest 
     *     drawn will be the front most within that z-index. This is the 
     *     default indexing method.
     * 
     * Parameters:
     * indexer - {<OpenLayers.ElementsIndexer>}
     * newNode - {DOMElement}
     * nextNode - {DOMElement}
     * 
     * Returns:
     * {Integer}
     */
    Z_ORDER_DRAWING_ORDER: function(indexer, newNode, nextNode) {
        var returnVal = OpenLayers.ElementsIndexer.IndexingMethods.Z_ORDER(
            indexer, 
            newNode, 
            nextNode
        );
        
        // Make Z_ORDER subscribe to drawing order by pushing it above
        // all of the other nodes with the same z-index.
        if (nextNode && returnVal == 0) {
            returnVal = 1;
        }
        
        return returnVal;
    },

    /**
     * APIMethod: Z_ORDER_Y_ORDER
     * This one should really be called Z_ORDER_Y_ORDER_DRAWING_ORDER, as it
     *     best describes which ordering methods have precedence (though, the 
     *     name would be too long). This method orders nodes by their z-index, 
     *     but does so in a way that, if there are other nodes with the same 
     *     z-index, the nodes with the lower y position will be "closer" than 
     *     those with a higher y position. If two nodes have the exact same y 
     *     position, however, then this method will revert to using drawing  
     *     order to decide placement.
     * 
     * Parameters:
     * indexer - {<OpenLayers.ElementsIndexer>}
     * newNode - {DOMElement}
     * nextNode - {DOMElement}
     * 
     * Returns:
     * {Integer}
     */
    Z_ORDER_Y_ORDER: function(indexer, newNode, nextNode) {
        var returnVal = OpenLayers.ElementsIndexer.IndexingMethods.Z_ORDER(
            indexer, 
            newNode, 
            nextNode
        );
        
        if (nextNode && returnVal === 0) {            
            var result = nextNode._boundsBottom - newNode._boundsBottom;
            returnVal = (result === 0) ? 1 : result;
        }
        
        return returnVal;       
    }
};

/**
 * Class: OpenLayers.Renderer.Elements
 * This is another virtual class in that it should never be instantiated by 
 *  itself as a Renderer. It exists because there is *tons* of shared 
 *  functionality between different vector libraries which use nodes/elements
 *  as a base for rendering vectors. 
 * 
 * The highlevel bits of code that are implemented here are the adding and 
 *  removing of geometries, which is essentially the same for any 
 *  element-based renderer. The details of creating each node and drawing the
 *  paths are of course different, but the machinery is the same. 
 * 
 * Inherits:
 *  - <OpenLayers.Renderer>
 */
OpenLayers.Renderer.Elements = OpenLayers.Class(OpenLayers.Renderer, {

    /**
     * Property: rendererRoot
     * {DOMElement}
     */
    rendererRoot: null,
    
    /**
     * Property: root
     * {DOMElement}
     */
    root: null,
    
    /**
     * Property: vectorRoot
     * {DOMElement}
     */
    vectorRoot: null,

    /**
     * Property: textRoot
     * {DOMElement}
     */
    textRoot: null,

    /**
     * Property: xmlns
     * {String}
     */    
    xmlns: null,
    
    /**
     * Property: xOffset
     * {Number} Offset to apply to the renderer viewport translation in x
     * direction. If the renderer extent's center is on the right of the
     * dateline (i.e. exceeds the world bounds), we shift the viewport to the
     * left by one world width. This avoids that features disappear from the
     * map viewport. Because our dateline handling logic in other places
     * ensures that extents crossing the dateline always have a center
     * exceeding the world bounds on the left, we need this offset to make sure
     * that the same is true for the renderer extent in pixel space as well.
     */
    xOffset: 0,
    
    /**
     * Property: rightOfDateLine
     * {Boolean} Keeps track of the location of the map extent relative to the
     * date line. The <setExtent> method compares this value (which is the one
     * from the previous <setExtent> call) with the current position of the map
     * extent relative to the date line and updates the xOffset when the extent
     * has moved from one side of the date line to the other.
     */
    
    /**
     * Property: Indexer
     * {<OpenLayers.ElementIndexer>} An instance of OpenLayers.ElementsIndexer 
     *     created upon initialization if the zIndexing or yOrdering options
     *     passed to this renderer's constructor are set to true.
     */
    indexer: null, 
    
    /**
     * Constant: BACKGROUND_ID_SUFFIX
     * {String}
     */
    BACKGROUND_ID_SUFFIX: "_background",
    
    /**
     * Constant: LABEL_ID_SUFFIX
     * {String}
     */
    LABEL_ID_SUFFIX: "_label",
    
    /**
     * Constant: LABEL_OUTLINE_SUFFIX
     * {String}
     */
    LABEL_OUTLINE_SUFFIX: "_outline",

    /**
     * Constructor: OpenLayers.Renderer.Elements
     * 
     * Parameters:
     * containerID - {String}
     * options - {Object} options for this renderer. 
     *
     * Supported options are:
     *     yOrdering - {Boolean} Whether to use y-ordering
     *     zIndexing - {Boolean} Whether to use z-indexing. Will be ignored
     *         if yOrdering is set to true.
     */
    initialize: function(containerID, options) {
        OpenLayers.Renderer.prototype.initialize.apply(this, arguments);

        this.rendererRoot = this.createRenderRoot();
        this.root = this.createRoot("_root");
        this.vectorRoot = this.createRoot("_vroot");
        this.textRoot = this.createRoot("_troot");
        
        this.root.appendChild(this.vectorRoot);
        this.root.appendChild(this.textRoot);
        
        this.rendererRoot.appendChild(this.root);
        this.container.appendChild(this.rendererRoot);
        
        if(options && (options.zIndexing || options.yOrdering)) {
            this.indexer = new OpenLayers.ElementsIndexer(options.yOrdering);
        }
    },
    
    /**
     * Method: destroy
     */
    destroy: function() {

        this.clear(); 

        this.rendererRoot = null;
        this.root = null;
        this.xmlns = null;

        OpenLayers.Renderer.prototype.destroy.apply(this, arguments);
    },
    
    /**
     * Method: clear
     * Remove all the elements from the root
     */    
    clear: function() {
        var child;
        var root = this.vectorRoot;
        if (root) {
            while (child = root.firstChild) {
                root.removeChild(child);
            }
        }
        root = this.textRoot;
        if (root) {
            while (child = root.firstChild) {
                root.removeChild(child);
            }
        }
        if (this.indexer) {
            this.indexer.clear();
        }
    },
    
    /**
     * Method: setExtent
     * Set the visible part of the layer.
     *
     * Parameters:
     * extent - {<OpenLayers.Bounds>}
     * resolutionChanged - {Boolean}
     *
     * Returns:
     * {Boolean} true to notify the layer that the new extent does not exceed
     *     the coordinate range, and the features will not need to be redrawn.
     *     False otherwise.
     */
    setExtent: function(extent, resolutionChanged) {
        var coordSysUnchanged = OpenLayers.Renderer.prototype.setExtent.apply(this, arguments);
        var resolution = this.getResolution();
        if (this.map.baseLayer && this.map.baseLayer.wrapDateLine) {
            var rightOfDateLine,
                ratio = extent.getWidth() / this.map.getExtent().getWidth(),
                extent = extent.scale(1 / ratio),
                world = this.map.getMaxExtent();
            if (world.right > extent.left && world.right < extent.right) {
                rightOfDateLine = true;
            } else if (world.left > extent.left && world.left < extent.right) {
                rightOfDateLine = false;
            }
            if (rightOfDateLine !== this.rightOfDateLine || resolutionChanged) {
                coordSysUnchanged = false;
                this.xOffset = rightOfDateLine === true ?
                    world.getWidth() / resolution : 0;
            }
            this.rightOfDateLine = rightOfDateLine;
        }
        return coordSysUnchanged;
    },

    /** 
     * Method: getNodeType
     * This function is in charge of asking the specific renderer which type
     *     of node to create for the given geometry and style. All geometries
     *     in an Elements-based renderer consist of one node and some
     *     attributes. We have the nodeFactory() function which creates a node
     *     for us, but it takes a 'type' as input, and that is precisely what
     *     this function tells us.  
     *  
     * Parameters:
     * geometry - {<OpenLayers.Geometry>}
     * style - {Object}
     * 
     * Returns:
     * {String} The corresponding node type for the specified geometry
     */
    getNodeType: function(geometry, style) { },

    /** 
     * Method: drawGeometry 
     * Draw the geometry, creating new nodes, setting paths, setting style,
     *     setting featureId on the node.  This method should only be called
     *     by the renderer itself.
     *
     * Parameters:
     * geometry - {<OpenLayers.Geometry>}
     * style - {Object}
     * featureId - {String}
     * 
     * Returns:
     * {Boolean} true if the geometry has been drawn completely; null if
     *     incomplete; false otherwise
     */
    drawGeometry: function(geometry, style, featureId) {
        var className = geometry.CLASS_NAME;
        var rendered = true;
        if ((className == "OpenLayers.Geometry.Collection") ||
            (className == "OpenLayers.Geometry.MultiPoint") ||
            (className == "OpenLayers.Geometry.MultiLineString") ||
            (className == "OpenLayers.Geometry.MultiPolygon")) {
            for (var i = 0, len=geometry.components.length; i<len; i++) {
                rendered = this.drawGeometry(
                    geometry.components[i], style, featureId) && rendered;
            }
            return rendered;
        }

        rendered = false;
        var removeBackground = false;
        if (style.display != "none") {
            if (style.backgroundGraphic) {
                this.redrawBackgroundNode(geometry.id, geometry, style,
                    featureId);
            } else {
                removeBackground = true;
            }
            rendered = this.redrawNode(geometry.id, geometry, style,
                featureId);
        }
        if (rendered == false) {
            var node = document.getElementById(geometry.id);
            if (node) {
                if (node._style.backgroundGraphic) {
                    removeBackground = true;
                }
                node.parentNode.removeChild(node);
            }
        }
        if (removeBackground) {
            var node = document.getElementById(
                geometry.id + this.BACKGROUND_ID_SUFFIX);
            if (node) {
                node.parentNode.removeChild(node);
            }
        }
        return rendered;
    },
    
    /**
     * Method: redrawNode
     * 
     * Parameters:
     * id - {String}
     * geometry - {<OpenLayers.Geometry>}
     * style - {Object}
     * featureId - {String}
     * 
     * Returns:
     * {Boolean} true if the complete geometry could be drawn, null if parts of
     *     the geometry could not be drawn, false otherwise
     */
    redrawNode: function(id, geometry, style, featureId) {
        style = this.applyDefaultSymbolizer(style);
        // Get the node if it's already on the map.
        var node = this.nodeFactory(id, this.getNodeType(geometry, style));
        
        // Set the data for the node, then draw it.
        node._featureId = featureId;
        node._boundsBottom = geometry.getBounds().bottom;
        node._geometryClass = geometry.CLASS_NAME;
        node._style = style;

        var drawResult = this.drawGeometryNode(node, geometry, style);
        if(drawResult === false) {
            return false;
        }
         
        node = drawResult.node;
        
        // Insert the node into the indexer so it can show us where to
        // place it. Note that this operation is O(log(n)). If there's a
        // performance problem (when dragging, for instance) this is
        // likely where it would be.
        if (this.indexer) {
            var insert = this.indexer.insert(node);
            if (insert) {
                this.vectorRoot.insertBefore(node, insert);
            } else {
                this.vectorRoot.appendChild(node);
            }
        } else {
            // if there's no indexer, simply append the node to root,
            // but only if the node is a new one
            if (node.parentNode !== this.vectorRoot){ 
                this.vectorRoot.appendChild(node);
            }
        }
        
        this.postDraw(node);
        
        return drawResult.complete;
    },
    
    /**
     * Method: redrawBackgroundNode
     * Redraws the node using special 'background' style properties. Basically
     *     just calls redrawNode(), but instead of directly using the 
     *     'externalGraphic', 'graphicXOffset', 'graphicYOffset', and 
     *     'graphicZIndex' properties directly from the specified 'style' 
     *     parameter, we create a new style object and set those properties 
     *     from the corresponding 'background'-prefixed properties from 
     *     specified 'style' parameter.
     * 
     * Parameters:
     * id - {String}
     * geometry - {<OpenLayers.Geometry>}
     * style - {Object}
     * featureId - {String}
     * 
     * Returns:
     * {Boolean} true if the complete geometry could be drawn, null if parts of
     *     the geometry could not be drawn, false otherwise
     */
    redrawBackgroundNode: function(id, geometry, style, featureId) {
        var backgroundStyle = OpenLayers.Util.extend({}, style);
        
        // Set regular style attributes to apply to the background styles.
        backgroundStyle.externalGraphic = backgroundStyle.backgroundGraphic;
        backgroundStyle.graphicXOffset = backgroundStyle.backgroundXOffset;
        backgroundStyle.graphicYOffset = backgroundStyle.backgroundYOffset;
        backgroundStyle.graphicZIndex = backgroundStyle.backgroundGraphicZIndex;
        backgroundStyle.graphicWidth = backgroundStyle.backgroundWidth || backgroundStyle.graphicWidth;
        backgroundStyle.graphicHeight = backgroundStyle.backgroundHeight || backgroundStyle.graphicHeight;
        
        // Erase background styles.
        backgroundStyle.backgroundGraphic = null;
        backgroundStyle.backgroundXOffset = null;
        backgroundStyle.backgroundYOffset = null;
        backgroundStyle.backgroundGraphicZIndex = null;
        
        return this.redrawNode(
            id + this.BACKGROUND_ID_SUFFIX, 
            geometry, 
            backgroundStyle, 
            null
        );
    },

    /**
     * Method: drawGeometryNode
     * Given a node, draw a geometry on the specified layer.
     *     node and geometry are required arguments, style is optional.
     *     This method is only called by the render itself.
     *
     * Parameters:
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     * style - {Object}
     * 
     * Returns:
     * {Object} a hash with properties "node" (the drawn node) and "complete"
     *     (null if parts of the geometry could not be drawn, false if nothing
     *     could be drawn)
     */
    drawGeometryNode: function(node, geometry, style) {
        style = style || node._style;

        var options = {
            'isFilled': style.fill === undefined ?
                true :
                style.fill,
            'isStroked': style.stroke === undefined ?
                !!style.strokeWidth :
                style.stroke
        };
        var drawn;
        switch (geometry.CLASS_NAME) {
            case "OpenLayers.Geometry.Point":
                if(style.graphic === false) {
                    options.isFilled = false;
                    options.isStroked = false;
                }
                drawn = this.drawPoint(node, geometry);
                break;
            case "OpenLayers.Geometry.LineString":
                options.isFilled = false;
                drawn = this.drawLineString(node, geometry);
                break;
            case "OpenLayers.Geometry.LinearRing":
                drawn = this.drawLinearRing(node, geometry);
                break;
            case "OpenLayers.Geometry.Polygon":
                drawn = this.drawPolygon(node, geometry);
                break;
            case "OpenLayers.Geometry.Rectangle":
                drawn = this.drawRectangle(node, geometry);
                break;
            default:
                break;
        }

        node._options = options; 

        //set style
        //TBD simplify this
        if (drawn != false) {
            return {
                node: this.setStyle(node, style, options, geometry),
                complete: drawn
            };
        } else {
            return false;
        }
    },
    
    /**
     * Method: postDraw
     * Things that have do be done after the geometry node is appended
     *     to its parent node. To be overridden by subclasses.
     * 
     * Parameters:
     * node - {DOMElement}
     */
    postDraw: function(node) {},
    
    /**
     * Method: drawPoint
     * Virtual function for drawing Point Geometry. 
     *     Should be implemented by subclasses.
     *     This method is only called by the renderer itself.
     * 
     * Parameters: 
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     * 
     * Returns:
     * {DOMElement} or false if the renderer could not draw the point
     */ 
    drawPoint: function(node, geometry) {},

    /**
     * Method: drawLineString
     * Virtual function for drawing LineString Geometry. 
     *     Should be implemented by subclasses.
     *     This method is only called by the renderer itself.
     * 
     * Parameters: 
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     * 
     * Returns:
     * {DOMElement} or null if the renderer could not draw all components of
     *     the linestring, or false if nothing could be drawn
     */ 
    drawLineString: function(node, geometry) {},

    /**
     * Method: drawLinearRing
     * Virtual function for drawing LinearRing Geometry. 
     *     Should be implemented by subclasses.
     *     This method is only called by the renderer itself.
     * 
     * Parameters: 
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     * 
     * Returns:
     * {DOMElement} or null if the renderer could not draw all components
     *     of the linear ring, or false if nothing could be drawn
     */ 
    drawLinearRing: function(node, geometry) {},

    /**
     * Method: drawPolygon
     * Virtual function for drawing Polygon Geometry. 
     *    Should be implemented by subclasses.
     *    This method is only called by the renderer itself.
     * 
     * Parameters: 
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     * 
     * Returns:
     * {DOMElement} or null if the renderer could not draw all components
     *     of the polygon, or false if nothing could be drawn
     */ 
    drawPolygon: function(node, geometry) {},

    /**
     * Method: drawRectangle
     * Virtual function for drawing Rectangle Geometry. 
     *     Should be implemented by subclasses.
     *     This method is only called by the renderer itself.
     * 
     * Parameters: 
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     * 
     * Returns:
     * {DOMElement} or false if the renderer could not draw the rectangle
     */ 
    drawRectangle: function(node, geometry) {},

    /**
     * Method: drawCircle
     * Virtual function for drawing Circle Geometry. 
     *     Should be implemented by subclasses.
     *     This method is only called by the renderer itself.
     * 
     * Parameters: 
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     * 
     * Returns:
     * {DOMElement} or false if the renderer could not draw the circle
     */ 
    drawCircle: function(node, geometry) {},

    /**
     * Method: removeText
     * Removes a label
     * 
     * Parameters:
     * featureId - {String}
     */
    removeText: function(featureId) {
        var label = document.getElementById(featureId + this.LABEL_ID_SUFFIX);
        if (label) {
            this.textRoot.removeChild(label);
        }
        var outline = document.getElementById(featureId + this.LABEL_OUTLINE_SUFFIX);
        if (outline) {
            this.textRoot.removeChild(outline);
        }
    },

    /**
     * Method: getFeatureIdFromEvent
     * 
     * Parameters:
     * evt - {Object} An <OpenLayers.Event> object
     *
     * Returns:
     * {String} A feature id or undefined.
     */
    getFeatureIdFromEvent: function(evt) {
        var target = evt.target;
        var useElement = target && target.correspondingUseElement;
        var node = useElement ? useElement : (target || evt.srcElement);
        return node._featureId;
    },

    /** 
     * Method: eraseGeometry
     * Erase a geometry from the renderer. In the case of a multi-geometry, 
     *     we cycle through and recurse on ourselves. Otherwise, we look for a 
     *     node with the geometry.id, destroy its geometry, and remove it from
     *     the DOM.
     * 
     * Parameters:
     * geometry - {<OpenLayers.Geometry>}
     * featureId - {String}
     */
    eraseGeometry: function(geometry, featureId) {
        if ((geometry.CLASS_NAME == "OpenLayers.Geometry.MultiPoint") ||
            (geometry.CLASS_NAME == "OpenLayers.Geometry.MultiLineString") ||
            (geometry.CLASS_NAME == "OpenLayers.Geometry.MultiPolygon") ||
            (geometry.CLASS_NAME == "OpenLayers.Geometry.Collection")) {
            for (var i=0, len=geometry.components.length; i<len; i++) {
                this.eraseGeometry(geometry.components[i], featureId);
            }
        } else {    
            var element = OpenLayers.Util.getElement(geometry.id);
            if (element && element.parentNode) {
                if (element.geometry) {
                    element.geometry.destroy();
                    element.geometry = null;
                }
                element.parentNode.removeChild(element);

                if (this.indexer) {
                    this.indexer.remove(element);
                }
                
                if (element._style.backgroundGraphic) {
                    var backgroundId = geometry.id + this.BACKGROUND_ID_SUFFIX;
                    var bElem = OpenLayers.Util.getElement(backgroundId);
                    if (bElem && bElem.parentNode) {
                        // No need to destroy the geometry since the element and the background
                        // node share the same geometry.
                        bElem.parentNode.removeChild(bElem);
                    }
                }
            }
        }
    },

    /** 
     * Method: nodeFactory
     * Create new node of the specified type, with the (optional) specified id.
     * 
     * If node already exists with same ID and a different type, we remove it
     *     and then call ourselves again to recreate it.
     * 
     * Parameters:
     * id - {String}
     * type - {String} type Kind of node to draw.
     * 
     * Returns:
     * {DOMElement} A new node of the given type and id.
     */
    nodeFactory: function(id, type) {
        var node = OpenLayers.Util.getElement(id);
        if (node) {
            if (!this.nodeTypeCompare(node, type)) {
                node.parentNode.removeChild(node);
                node = this.nodeFactory(id, type);
            }
        } else {
            node = this.createNode(type, id);
        }
        return node;
    },
    
    /** 
     * Method: nodeTypeCompare
     * 
     * Parameters:
     * node - {DOMElement}
     * type - {String} Kind of node
     * 
     * Returns:
     * {Boolean} Whether or not the specified node is of the specified type
     *     This function must be overridden by subclasses.
     */
    nodeTypeCompare: function(node, type) {},
    
    /** 
     * Method: createNode
     * 
     * Parameters:
     * type - {String} Kind of node to draw.
     * id - {String} Id for node.
     * 
     * Returns:
     * {DOMElement} A new node of the given type and id.
     *     This function must be overridden by subclasses.
     */
    createNode: function(type, id) {},

    /**
     * Method: moveRoot
     * moves this renderer's root to a different renderer.
     * 
     * Parameters:
     * renderer - {<OpenLayers.Renderer>} target renderer for the moved root
     */
    moveRoot: function(renderer) {
        var root = this.root;
        if(renderer.root.parentNode == this.rendererRoot) {
            root = renderer.root;
        }
        root.parentNode.removeChild(root);
        renderer.rendererRoot.appendChild(root);
    },
    
    /**
     * Method: getRenderLayerId
     * Gets the layer that this renderer's output appears on. If moveRoot was
     * used, this will be different from the id of the layer containing the
     * features rendered by this renderer.
     * 
     * Returns:
     * {String} the id of the output layer.
     */
    getRenderLayerId: function() {
        return this.root.parentNode.parentNode.id;
    },
    
    /**
     * Method: isComplexSymbol
     * Determines if a symbol cannot be rendered using drawCircle
     * 
     * Parameters:
     * graphicName - {String}
     * 
     * Returns
     * {Boolean} true if the symbol is complex, false if not
     */
    isComplexSymbol: function(graphicName) {
        return (graphicName != "circle") && !!graphicName;
    },

    CLASS_NAME: "OpenLayers.Renderer.Elements"
});

