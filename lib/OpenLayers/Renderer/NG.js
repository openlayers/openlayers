/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Renderer/Elements.js
 */

/**
 * Class: OpenLayers.Renderer.NG
 * 
 * Inherits from:
 *  - <OpenLayers.Renderer.Elements>
 */
OpenLayers.Renderer.NG = OpenLayers.Class(OpenLayers.Renderer.Elements, {
    
    /**
     * Constant: labelNodeType
     * {String} The node type for text label containers. To be defined by
     * subclasses.
     */
    labelNodeType: null,
    
    /**
     * Constructor: OpenLayers.Renderer.NG
     * 
     * Parameters:
     * containerID - {String}
     * options - {Object} options for this renderer. Supported options are:
     *     * yOrdering - {Boolean} Whether to use y-ordering
     *     * zIndexing - {Boolean} Whether to use z-indexing. Will be ignored
     *         if yOrdering is set to true.
     */

    /**
     * Method: updateDimensions
     * To be extended by subclasses - here we set positioning related styles
     * on HTML elements, subclasses have to do the same for renderer specific
     * elements (e.g. viewBox, width and height of the rendererRoot)
     *
     * Parameters:
     * zoomChanged - {Boolean} Has the zoom changed? If so, subclasses may have
     *     to update feature styles/dimensions.
     */
    updateDimensions: function(zoomChanged) {
        var mapExtent = this.map.getExtent();
        var renderExtent = mapExtent.scale(3);
        this.setExtent(renderExtent, true);
        var res = this.getResolution();
        var div = this.rendererRoot.parentNode;
        var layerLeft = parseFloat(div.parentNode.style.left);
        var layerTop = parseFloat(div.parentNode.style.top);
        div.style.left = ((renderExtent.left - mapExtent.left) / res - layerLeft) + "px";
        div.style.top = ((mapExtent.top - renderExtent.top) / res - layerTop) + "px";
    },
    
    /**
     * Method: resize
     */
    setSize: function() {
        this.map.getExtent() && this.updateDimensions();
    },

    /**
     * Method: drawFeature
     * Draw the feature.  The optional style argument can be used
     * to override the feature's own style.  This method should only
     * be called from layer.drawFeature().
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} 
     * style - {<Object>}
     * 
     * Returns:
     * {Boolean} true if the feature has been drawn completely, false if not,
     *     undefined if the feature had no geometry
     */
    drawFeature: function(feature, style) {
        if(style == null) {
            style = feature.style;
        }
        if (feature.geometry) {
            var rendered = this.drawGeometry(feature.geometry, style, feature.id);
            if(rendered !== false && style.label) {
                var location = feature.geometry.getCentroid(); 
                this.drawText(feature.id, style, location);
            } else {
                this.removeText(feature.id);
            }
            return rendered;
        }
    },
    
    /**
     * Method: drawText
     * Function for drawing text labels.
     * This method is only called by the renderer itself.
     * 
     * Parameters: 
     * featureId - {String|DOMElement}
     * style - {Object}
     * location - {<OpenLayers.Geometry.Point>}, will be modified inline
     *
     * Returns:
     * {DOMElement} container holding the text label (to be populated by
     * subclasses)
     */
    drawText: function(featureId, style, location) {
        var label;
        if (typeof featureId !== "string") {
            label = featureId;
        } else {
            label = this.nodeFactory(featureId + this.LABEL_ID_SUFFIX, this.labelNodeType);
            label._featureId = featureId;
        }
        label._style = style;
        label._x = location.x;
        label._y = location.y;
        if(style.labelXOffset || style.labelYOffset) {
            var xOffset = isNaN(style.labelXOffset) ? 0 : style.labelXOffset;
            var yOffset = isNaN(style.labelYOffset) ? 0 : style.labelYOffset;
            var res = this.getResolution();
            location.move(xOffset*res, yOffset*res);
        }

        if(label.parentNode !== this.textRoot) {
            this.textRoot.appendChild(label);
        }   

        return label;
    },

    CLASS_NAME: "OpenLayers.Renderer.NG"
});
