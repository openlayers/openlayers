/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * Class: OpenLayers.Size
 * Instances of this class represent a width/height pair
 */
OpenLayers.Size = OpenLayers.Class({

    /**
     * APIProperty: w
     * {Number} width
     */
    w: 0.0,
    
    /**
     * APIProperty: h
     * {Number} height
     */
    h: 0.0,


    /**
     * Constructor: OpenLayers.Size
     * Create an instance of OpenLayers.Size
     *
     * Parameters:
     * w - {Number} width
     * h - {Number} height
     */
    initialize: function(w, h) {
        this.w = parseFloat(w);
        this.h = parseFloat(h);
    },

    /**
     * Method: toString
     * Return the string representation of a size object
     *
     * Returns:
     * {String} The string representation of OpenLayers.Size object. 
     * (ex. <i>"w=55,h=66"</i>)
     */
    toString:function() {
        return ("w=" + this.w + ",h=" + this.h);
    },

    /**
     * APIMethod: clone
     * Create a clone of this size object
     *
     * Returns:
     * {<OpenLayers.Size>} A new OpenLayers.Size object with the same w and h
     * values
     */
    clone:function() {
        return new OpenLayers.Size(this.w, this.h);
    },

    /**
     *
     * APIMethod: equals
     * Determine where this size is equal to another
     *
     * Parameters:
     * sz - {<OpenLayers.Size>}
     *
     * Returns: 
     * {Boolean} The passed in size has the same h and w properties as this one.
     * Note that if sz passed in is null, returns false.
     *
     */
    equals:function(sz) {
        var equals = false;
        if (sz != null) {
            equals = ((this.w == sz.w && this.h == sz.h) ||
                      (isNaN(this.w) && isNaN(this.h) && isNaN(sz.w) && isNaN(sz.h)));
        }
        return equals;
    },

    CLASS_NAME: "OpenLayers.Size"
});
