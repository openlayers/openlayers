/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * Namespace: OpenLayers.Class
 * Contains functions to create OpenLayers style classes.
 */ 
OpenLayers.Class = {
    isPrototype: function () {}, // magic anonymous value

    /**
     * APIFunction: create
     * Create an OpenLayers style class
     *
     * Return:
     * An OpenLayers class
     */
    create: function() {
        return function() {
            if (arguments && arguments[0] != OpenLayers.Class.isPrototype)
                this.initialize.apply(this, arguments);
        }
    },
 
    /**
     * APIFunction: inherit
     * Inherit from one or more OpenLayers style classes
     *
     * Parameters:
     * class - One or more classes can be provided as arguments
     *
     * Return:
     * An object prototype
     */
    inherit: function () {
        var superClass = arguments[0];
        var proto = new superClass(OpenLayers.Class.isPrototype);
        for (var i = 1; i < arguments.length; i++) {
            if (typeof arguments[i] == "function") {
                var mixin = arguments[i];
                arguments[i] = new mixin(OpenLayers.Class.isPrototype);
            }
            OpenLayers.Util.extend(proto, arguments[i]);

            // This is a hack for IE see
            // http://trac.openlayers.org/attachment/ticket/552
            // 
            // The problem is that ie doesnt recognize toString as a property
            //  so the util.extend() doesnt copy it over. we do it manually.
            // 
            // to be revisited in 3.0
            //
            if((arguments[i].hasOwnProperty && arguments[i].hasOwnProperty('toString')) ||
               (!arguments[i].hasOwnProperty && arguments[i].toString)) {
                proto.toString = arguments[i].toString;
            }
        }
        return proto;
    }
};

/*
    OpenLayers.Class.inherit( OpenLayers.Layer.Grid, OpenLayers.Layer.HTTPRequest, {
        some stuff
    });
*/