/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Style.js
 * @requires OpenLayers/Feature/Vector.js
 */
 
/**
 * Class: OpenLayers.StyleMap
 */
OpenLayers.StyleMap = OpenLayers.Class({
    
    /**
     * Property: styles
     * Hash of {<OpenLayers.Style>}, keyed by names of well known
     * rendering intents (e.g. "default", "temporary", "select").
     */
    styles: null,
    
    /**
     * Property: extendDefault
     * {Boolean} if true, every render intent will extend the symbolizers
     * specified for the "default" intent. Otherwise, every rendering intent
     * is treated as a completely independent symbolizer.
     */
    extendDefault: true,
    
    /**
     * Constructor: OpenLayers.StyleMap
     * 
     * Parameters:
     * style   - {Object} Optional. Either a style hash, or a style object, or
     *           a hash of style objects (style hashes) keyed by rendering
     *           intent
     * options - {Object} optional hash of additional options for this
     *           instance
     */
    initialize: function (style, options) {
        this.styles = {
            "default": new OpenLayers.Style(
                OpenLayers.Feature.Vector.style["default"]),
            "select": new OpenLayers.Style(
                OpenLayers.Feature.Vector.style["select"]),
            "temporary": new OpenLayers.Style(
                OpenLayers.Feature.Vector.style["temporary"])
        };
        
        // take whatever the user passed as style parameter and convert it
        // into parts of stylemap.
        if(style instanceof OpenLayers.Style) {
            // user passed a style object
            this.styles["default"] = style;
        } else if(typeof style == "object") {
            for(var key in style) {
                if(style[key] instanceof OpenLayers.Style) {
                    // user passed a hash of style objects
                    this.styles[key] = style[key];
                } else if(typeof style[key] == "object") {
                    // user passsed a hash of style hashes
                    this.styles[key] = new OpenLayers.Style(style[key]);
                } else {
                    // user passed a style hash (i.e. symbolizer)
                    this.styles["default"] = new OpenLayers.Style(style);
                    break;
                }
            }
        }
        OpenLayers.Util.extend(this, options);
    },

    /**
     * Method: destroy
     */
    destroy: function() {
        for(var key in this.styles) {
            this.styles[key].destroy();
        }
        this.styles = null;
    },
    
    /**
     * Method: createSymbolizer
     * Creates the symbolizer for a feature for a render intent.
     * 
     * Parameters:
     * feature - {<OpenLayers.Feature>} The feature to evaluate the rules
     *           of the intended style against.
     * intent  - {String} The intent determines the symbolizer that will be
     *           used to draw the feature. Well known intents are "default"
     *           (for just drawing the features), "select" (for selected
     *           features) and "temporary" (for drawing features).
     * 
     * Returns:
     * {Object} symbolizer hash
     */
    createSymbolizer: function(feature, intent) {
        if(!feature) {
            feature = new OpenLayers.Feature.Vector();
        }
        if(!this.styles[intent]) {
            intent = "default";
        }
        feature.renderIntent = intent;
        var defaultSymbolizer = {};
        if(this.extendDefault && intent != "default") {
            defaultSymbolizer = this.styles["default"].createSymbolizer(feature);
        }
        return OpenLayers.Util.extend(defaultSymbolizer,
            this.styles[intent].createSymbolizer(feature));
    },

    CLASS_NAME: "OpenLayers.StyleMap"
});
