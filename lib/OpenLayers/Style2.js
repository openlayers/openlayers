/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/BaseTypes/Class.js
 * @requires OpenLayers/Rule.js
 * @requires OpenLayers/Symbolizer/Point.js
 * @requires OpenLayers/Symbolizer/Line.js
 * @requires OpenLayers/Symbolizer/Polygon.js
 * @requires OpenLayers/Symbolizer/Text.js
 * @requires OpenLayers/Symbolizer/Raster.js
 */

/**
 * Class: OpenLayers.Style2
 * This class represents a collection of rules for rendering features.
 */
OpenLayers.Style2 = OpenLayers.Class({

    /**
     * Property: id
     * {String} A unique id for this session.
     */
    id: null,
    
    /**
     * APIProperty: name
     * {String} Style identifier.
     */
    name: null,
    
    /**
     * APIProperty: title
     * {String} Title of this style.
     */
    title: null,
    
    /**
     * APIProperty: description
     * {String} Description of this style.
     */
    description: null,

    /**
     * APIProperty: layerName
     * {<String>} Name of the layer that this style belongs to, usually
     *     according to the NamedLayer attribute of an SLD document.
     */
    layerName: null,
    
    /**
     * APIProperty: isDefault
     * {Boolean}
     */
    isDefault: false,
     
    /** 
     * APIProperty: rules 
     * {Array(<OpenLayers.Rule>)} Collection of rendering rules.
     */
    rules: null,
    
    /** 
     * Constructor: OpenLayers.Style2
     * Creates a style representing a collection of rendering rules.
     *
     * Parameters:
     * config - {Object} An object containing properties to be set on the 
     *     style.  Any documented properties may be set at construction.
     *
     * Returns:
     * {<OpenLayers.Style2>} A new style object.
     */
    initialize: function(config) {
        OpenLayers.Util.extend(this, config);
        this.id = OpenLayers.Util.createUniqueID(this.CLASS_NAME + "_");
    },

    /** 
     * APIMethod: destroy
     * nullify references to prevent circular references and memory leaks
     */
    destroy: function() {
        for (var i=0, len=this.rules.length; i<len; i++) {
            this.rules[i].destroy();
        }
        delete this.rules;
    },

    /**
     * APIMethod: clone
     * Clones this style.
     * 
     * Returns:
     * {<OpenLayers.Style2>} Clone of this style.
     */
    clone: function() {
        var config = OpenLayers.Util.extend({}, this);
        // clone rules
        if (this.rules) {
            config.rules = [];
            for (var i=0, len=this.rules.length; i<len; ++i) {
                config.rules.push(this.rules[i].clone());
            }
        }
        return new OpenLayers.Style2(config);
    },
    
    CLASS_NAME: "OpenLayers.Style2"
});
