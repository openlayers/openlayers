/**
 * Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license.
 *
 * @requires OpenLayers/SingleFile.js
 */

/**
 * Namespace: OpenLayers.Vendor
 * A collection of utility functions to detect vendor prefixed features
 */
var OpenLayers = OpenLayers || {};
OpenLayers.Vendor = (function() {
    "use strict";
    
    var VENDOR_PREFIXES = ["", "O", "ms", "Moz", "Webkit"],
        divStyle = document.createElement("div").style,
        cssCache = {},
        jsCache = {};

    
    /**
     * Function: domToCss
     * Converts a upper camel case DOM style property name to a CSS property
     *      i.e. transformOrigin -> transform-origin
     *      or   WebkitTransformOrigin -> -webkit-transform-origin
     *
     * Parameters:
     * prefixedDom - {String} The property to convert
     *
     * Returns:
     * {String} The CSS property
     */
    function domToCss(prefixedDom) {
        if (!prefixedDom) { return null; }
        return prefixedDom.
            replace(/([A-Z])/g, function(c) { return "-" + c.toLowerCase(); }).
            replace(/^ms-/, "-ms-");
    }

    /**
     * APIMethod: cssPrefix
     * Detect which property is used for a CSS property
     *
     * Parameters:
     * property - {String} The standard (unprefixed) CSS property name
     *
     * Returns:
     * {String} The standard CSS property, prefixed property or null if not
     *          supported
     */
    function cssPrefix(property) {
        if (cssCache[property] === undefined) {
            var domProperty = property.
                replace(/(-[\s\S])/g, function(c) { return c.charAt(1).toUpperCase(); });
            var prefixedDom = stylePrefix(domProperty);
            cssCache[property] = domToCss(prefixedDom);
        }
        return cssCache[property];
    }

    /**
     * APIMethod: jsPrefix
     * Detect which property is used for a JS property/method
     *
     * Parameters:
     * obj - {Object} The object to test on
     * property - {String} The standard (unprefixed) JS property name
     *
     * Returns:
     * {String} The standard JS property, prefixed property or null if not
     *          supported
     */
    function jsPrefix(obj, property) {
        if (jsCache[property] === undefined) {
            var tmpProp,
                i = 0,
                l = VENDOR_PREFIXES.length,
                prefix,
                isStyleObj = (typeof obj.cssText !== "undefined");

            jsCache[property] = null;
            for(var i=0,l=VENDOR_PREFIXES.length; i<l; i++) {
                prefix = VENDOR_PREFIXES[i];
                if(prefix) {
                    if (!isStyleObj) {
                        // js prefix should be lower-case, while style
                        // properties have upper case on first character
                        prefix = prefix.toLowerCase();
                    }
                    tmpProp = prefix + property.charAt(0).toUpperCase() + property.slice(1);
                } else {
                    tmpProp = property;
                }

                if(obj[tmpProp] !== undefined) {
                    jsCache[property] = tmpProp;
                    break;
                }
            }
        }
        return jsCache[property];
    }
    
    /**
     * APIMethod: stylePrefix
     * Detect which property is used for a DOM style property
     *
     * Parameters:
     * property - {String} The standard (unprefixed) style property name
     *
     * Returns:
     * {String} The standard style property, prefixed property or null if not
     *          supported
     */
    function stylePrefix(property) {
        return jsPrefix(divStyle, property);
    }
    
    return {
        cssPrefix:      cssPrefix,
        jsPrefix:       jsPrefix,
        stylePrefix:    stylePrefix,
        
        // used for testing
        _clearCache:     function() {
            cssCache = {};
            jsCache  = {};
        },
        _mockStyle: function(mock) {
            divStyle = mock;
        }
    };
}());