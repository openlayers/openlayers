/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Renderer.js
 */

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
     * Property: xmlns
     * {String}
     */    
    xmlns: null,
    
    /**
     * Property: minimumSymbolizer
     * {Object}
     */
    minimumSymbolizer: {
        strokeLinecap: "round",
        strokeOpacity: 1,
        fillOpacity: 1,
        pointRadius: 0
    },
    
    /**
     * Constructor: OpenLayers.Renderer.Elements
     * 
     * Parameters:
     * containerID - {String}
     */
    initialize: function(containerID) {
        OpenLayers.Renderer.prototype.initialize.apply(this, arguments);

        this.rendererRoot = this.createRenderRoot();
        this.root = this.createRoot();
        
        this.rendererRoot.appendChild(this.root);
        this.container.appendChild(this.rendererRoot);
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
        if (this.root) {
            while (this.root.childNodes.length > 0) {
                this.root.removeChild(this.root.firstChild);
            }
        }
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
     */
    drawGeometry: function(geometry, style, featureId) {
        var className = geometry.CLASS_NAME;
        if ((className == "OpenLayers.Geometry.Collection") ||
            (className == "OpenLayers.Geometry.MultiPoint") ||
            (className == "OpenLayers.Geometry.MultiLineString") ||
            (className == "OpenLayers.Geometry.MultiPolygon")) {
            for (var i = 0; i < geometry.components.length; i++) {
                this.drawGeometry(geometry.components[i], style, featureId);
            }
            return;
        };

        if (style.display != "none") {
            //first we create the basic node and add it to the root
            var nodeType = this.getNodeType(geometry, style);
            var node = this.nodeFactory(geometry.id, nodeType);
            node._featureId = featureId;
            node._geometryClass = geometry.CLASS_NAME;
            node._style = style;
            
            //now actually draw the node, and style it
            node = this.drawGeometryNode(node, geometry);
            
            // append the node to root (but only if it's new)
            if (node.parentNode != this.root) { 
                this.root.appendChild(node); 
            }
            this.postDraw(node);
        } else {
            node = OpenLayers.Util.getElement(geometry.id);
            if (node) {
                node.parentNode.removeChild(node);
            }
        }
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
     */
    drawGeometryNode: function(node, geometry, style) {
        style = style || node._style;
        OpenLayers.Util.applyDefaults(style, this.minimumSymbolizer);

        var options = {
            'isFilled': true,
            'isStroked': !!style.strokeWidth
        };
        switch (geometry.CLASS_NAME) {
            case "OpenLayers.Geometry.Point":
                this.drawPoint(node, geometry);
                break;
            case "OpenLayers.Geometry.LineString":
                options.isFilled = false;
                this.drawLineString(node, geometry);
                break;
            case "OpenLayers.Geometry.LinearRing":
                this.drawLinearRing(node, geometry);
                break;
            case "OpenLayers.Geometry.Polygon":
                this.drawPolygon(node, geometry);
                break;
            case "OpenLayers.Geometry.Surface":
                this.drawSurface(node, geometry);
                break;
            case "OpenLayers.Geometry.Rectangle":
                this.drawRectangle(node, geometry);
                break;
            default:
                break;
        }

        node._style = style; 
        node._options = options; 

        //set style
        //TBD simplify this
        return this.setStyle(node, style, options, geometry);
    },
    
    /**
     * Method: postDraw
     * Things that have do be done after the geometry node is appended
     * to its parent node. To be overridden by subclasses.
     * 
     * Parameters:
     * node - {DOMElement}
     */
    postDraw: function(node) {},
    
    /**
     * Method: drawPoint
     * Virtual function for drawing Point Geometry. 
     * Should be implemented by subclasses.
     * This method is only called by the renderer itself.
     * 
     * Parameters: 
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     */ 
    drawPoint: function(node, geometry) {},

    /**
     * Method: drawLineString
     * Virtual function for drawing LineString Geometry. 
     * Should be implemented by subclasses.
     * This method is only called by the renderer itself.
     * 
     * Parameters: 
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     */ 
    drawLineString: function(node, geometry) {},

    /**
     * Method: drawLinearRing
     * Virtual function for drawing LinearRing Geometry. 
     * Should be implemented by subclasses.
     * This method is only called by the renderer itself.
     * 
     * Parameters: 
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     */ 
    drawLinearRing: function(node, geometry) {},

    /**
     * Method: drawPolygon
     * Virtual function for drawing Polygon Geometry. 
     * Should be implemented by subclasses.
     * This method is only called by the renderer itself.
     * 
     * Parameters: 
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     */ 
    drawPolygon: function(node, geometry) {},

    /**
     * Method: drawRectangle
     * Virtual function for drawing Rectangle Geometry. 
     * Should be implemented by subclasses.
     * This method is only called by the renderer itself.
     * 
     * Parameters: 
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     */ 
    drawRectangle: function(node, geometry) {},

    /**
     * Method: drawCircle
     * Virtual function for drawing Circle Geometry. 
     * Should be implemented by subclasses.
     * This method is only called by the renderer itself.
     * 
     * Parameters: 
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     */ 
    drawCircle: function(node, geometry) {},

    /**
     * Method: drawSurface
     * Virtual function for drawing Surface Geometry. 
     * Should be implemented by subclasses.
     * This method is only called by the renderer itself.
     * 
     * Parameters: 
     * node - {DOMElement}
     * geometry - {<OpenLayers.Geometry>}
     */ 
    drawSurface: function(node, geometry) {},

    /**
     * Method: getFeatureIdFromEvent
     * 
     * Parameters:
     * evt - {Object} An <OpenLayers.Event> object
     *
     * Returns:
     * {<OpenLayers.Geometry>} A geometry from an event that 
     *                         happened on a layer
     */
    getFeatureIdFromEvent: function(evt) {
        var node = evt.target || evt.srcElement;
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
     */
    eraseGeometry: function(geometry) {
        if ((geometry.CLASS_NAME == "OpenLayers.Geometry.MultiPoint") ||
            (geometry.CLASS_NAME == "OpenLayers.Geometry.MultiLineString") ||
            (geometry.CLASS_NAME == "OpenLayers.Geometry.MultiPolygon") ||
            (geometry.CLASS_NAME == "OpenLayers.Geometry.Collection")) {
            for (var i = 0; i < geometry.components.length; i++) {
                this.eraseGeometry(geometry.components[i]);
            }
        } else {    
            var element = OpenLayers.Util.getElement(geometry.id);
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
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
     * type - {String} type Kind of node to draw
     * 
     * Returns:
     * {DOMElement} A new node of the given type and id
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

    CLASS_NAME: "OpenLayers.Renderer.Elements"
});
