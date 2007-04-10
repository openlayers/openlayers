/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @class
 * 
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
 * @requires OpenLayers/Renderer.js
 */
OpenLayers.Renderer.Elements = OpenLayers.Class.create();
OpenLayers.Renderer.Elements.prototype = 
  OpenLayers.Class.inherit(OpenLayers.Renderer, {

    /** @type DOMElement */
    rendererRoot: null,
    
    /** @type DOMElement */
    root: null,

    /** @type String */    
    xmlns: null,
    
    /**
     * @constructor
     * 
     * @param {String} containerID
     */
    initialize: function(containerID) {
        OpenLayers.Renderer.prototype.initialize.apply(this, arguments);

        this.rendererRoot = this.createRenderRoot();
        this.root = this.createRoot();
        
        this.rendererRoot.appendChild(this.root);
        this.container.appendChild(this.rendererRoot);
    },
    
    /**
     * 
     */
    destroy: function() {

        this.clear(); 

        this.rendererRoot = null;
        this.root = null;
        this.xmlns = null;

        OpenLayers.Renderer.prototype.destroy.apply(this, arguments);
    },
    
    /**
     * Remove all the elements from the root
     * @private
     */    
    clear: function() {
        if (this.root) {
            while (this.root.childNodes.length > 0) {
                this.root.removeChild(this.root.firstChild);
            }
        }
    },

    /** This function is in charge of asking the specific renderer which type
     *   of node to create for the given geometry. All geometries in an 
     *   Elements-based renderer consist of one node and some attributes. We
     *   have the nodeFactory() function which creates a node for us, but it
     *   takes a 'type' as input, and that is precisely what this function 
     *   tells us.  
     * 
     * @param geometry {OpenLayers.Geometry}
     * 
     * @returns The corresponding node type for the specified geometry
     * @type String
     * @private
     */
    getNodeType: function(geometry) { },

    /** 
     * Draw the feature.  The optional style argument can be used
     * to override the feature's own style.  This method should only
     * be called from layer.drawFeature().
     *
     * @param {OpenLayers.Feature.Vector} feature 
     * @param {Object} style
     */
    drawFeature: function(feature, style) {
        if(style == null) {
            style = feature.style;
        }
        this.drawGeometry(feature.geometry, style, feature.id);
    },

    /** 
     * Draw the geometry, creating new nodes, setting paths, setting style,
     * setting featureId on the node.  This method should only be called
     * by the renderer itself.
     *
     * @param {OpenLayers.Geometry} geometry 
     * @param {Object} style
     * @param {String} featureId
     * @private
     */
    drawGeometry: function(geometry, style, featureId) {

        if ((geometry.CLASS_NAME == "OpenLayers.Geometry.MultiPoint") ||
            (geometry.CLASS_NAME == "OpenLayers.Geometry.MultiLineString") ||
            (geometry.CLASS_NAME == "OpenLayers.Geometry.MultiPolygon")) {
            for (var i = 0; i < geometry.components.length; i++) {
                this.drawGeometry(geometry.components[i], style, featureId);
            }
            return;
        };

        //first we create the basic node and add it to the root
        var nodeType = this.getNodeType(geometry);
        var node = this.nodeFactory(geometry.id, nodeType, geometry);
        node._featureId = featureId;
        node._geometryClass = geometry.CLASS_NAME;
        node._style = style;
        this.root.appendChild(node);
        
        //now actually draw the node, and style it
        this.drawGeometryNode(node, geometry);
    },

    /** 
     * Given a node, draw a geometry on the specified layer.
     * node and geometry are required arguments, style is optional.
     * This method is only called by the render itself.
     *
     * @param {DOMElement} node
     * @param {OpenLayers.Geometry} geometry 
     * @param {Object} style
     * @private
     */
    drawGeometryNode: function(node, geometry, style) {
        style = style || node._style;

        var options = {
            'isFilled': true,
            'isStroked': true
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
        this.setStyle(node, style, options, geometry);
    },
    
    /** 
     * virtual functions for drawing different Geometries. 
     * These should all be implemented by subclasses.
     * These methods are only called by the render itself.
     *
     * @param {DOMElement} node
     * @param {OpenLayers.Geometry} geometry
     * @private
     */
    drawPoint: function(node, geometry) {},
    drawLineString: function(node, geometry) {},
    drawLinearRing: function(node, geometry) {},
    drawPolygon: function(node, geometry) {},
    drawRectangle: function(node, geometry) {},
    drawCircle: function(node, geometry) {},
    drawCurve: function(node, geometry) {},
    drawSurface: function(node, geometry) {},

    /**
     * @param evt {Object} an OpenLayers.Event object
     *
     * @returns A geometry from an event that happened on a layer
     * @type OpenLayers.Geometry
     */
    getFeatureIdFromEvent: function(evt) {
        var node = evt.target || evt.srcElement;
        return node._featureId;
    },

    /** Erase a geometry from the renderer. In the case of a multi-geometry, 
     *   we cycle through and recurse on ourselves. Otherwise, we look for a 
     *   node with the geometry.id, destroy its geometry, and remove it from
     *   the DOM.
     * 
     * @param {OpenLayers.Geometry} geometry
     */
    eraseGeometry: function(geometry) {
        if ((geometry.CLASS_NAME == "OpenLayers.Geometry.MultiPoint") ||
            (geometry.CLASS_NAME == "OpenLayers.Geometry.MultiLineString") ||
            (geometry.CLASS_NAME == "OpenLayers.Geometry.MultiPolygon")) {
            for (var i = 0; i < geometry.components.length; i++) {
                this.eraseGeometry(geometry.components[i]);
            }
        } else {    
            var element = $(geometry.id);
            if (element && element.parentNode) {
                if (element.geometry) {
                    element.geometry.destroy();
                    element.geometry = null;
                }
                element.parentNode.removeChild(element);
            }
        }
    },    

    /** 
     * @private 
     *
     * Create new node of the specified type, with the (optional) specified id.
     * 
     * If node already exists with same ID and type, we remove it and then
     *  call ourselves again to recreate it.
     * 
     * @param {String} id
     * @param {String} type Kind of node to draw
     * @param {OpenLayers.Geometry} geometry
     * 
     * @returns A new node of the given type and id
     * @type DOMElement
     */
    nodeFactory: function(id, type, geometry) {
        var node = $(id);
        if (node) {
            if (!this.nodeTypeCompare(node, type)) {
                node.parentNode.removeChild(node);
                node = this.nodeFactory(id, type, geometry);
            }
        } else {
            node = this.createNode(type, id);
        }
        return node;
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Renderer.Elements"
});
