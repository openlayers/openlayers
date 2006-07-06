/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */
// @require: OpenLayers/Layer/Grid.js
// @require: OpenLayers/Layer/Markers.js
/**
* @class
*/
OpenLayers.Layer.WFS = Class.create();
OpenLayers.Layer.WFS.prototype = 
  Object.extend(new OpenLayers.Layer.Grid(),
    Object.extend(new OpenLayers.Layer.Markers(), {

    /** Allow the user to specify a special class to use to display features. 
     *   This allows for easy-definition of feature behaviour. This property
     *   should be set via the "options" parameter.
     * @type Object */
    featureClass: OpenLayers.Feature.WFS,

    /** @final @type hash */
    DEFAULT_PARAMS: { service: "WFS",
                      version: "1.0.0",
                      request: "GetFeature",
                      typename: "docpoint"
                    },

    /**
    * @constructor
    *
    * @param {str} name
    * @param {str} url
    * @param {hash} params
    * @param {Object} options Hash of extra options to tag onto the layer
    */
    initialize: function(name, url, params, options) {
        var newArguments = new Array();
        if (arguments.length > 0) {
            //uppercase params
            params = OpenLayers.Util.upperCaseObject(params);
            newArguments.push(name, url, params, options);
        }
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, newArguments);
        OpenLayers.Layer.Markers.prototype.initialize.apply(this, newArguments);

        if (options && options['tileSize']) {
            this.tileSize = options['tileSize'].copyOf();
        } else {
            this.tileSize = new OpenLayers.Size(256, 256);
        }
    
        if (arguments.length > 0) {
            OpenLayers.Util.applyDefaults(
                           this.params, 
                           OpenLayers.Util.upperCaseObject(this.DEFAULT_PARAMS)
                           );
        }
    },    
    

    /**
     * 
     */
    destroy: function() {
        OpenLayers.Layer.Grid.prototype.destroy.apply(this, arguments);
        OpenLayers.Layer.Markers.prototype.destroy.apply(this, arguments);
    },
    
    /** 
    * @param {OpenLayers.Bounds} bounds
    * @param {Boolean} zoomChanged
    */
    moveTo: function(bounds, zoomChanged) {
        OpenLayers.Layer.Grid.prototype.moveTo.apply(this, arguments);
        OpenLayers.Layer.Markers.prototype.moveTo.apply(this, arguments);
    },
    
    /** WFS layer is never a base class. 
     * @type Boolean
     */
    isBaseLayer: function() {
        return false;
    },
    
    /**
    * @param {String} name
    * @param {hash} params
    *
    * @returns A clone of this OpenLayers.Layer.WMS, with the passed-in
    *          parameters merged in.
    * @type OpenLayers.Layer.WMS
    */
    clone: function (name, params) {
        var mergedParams = {}
        Object.extend(mergedParams, this.params);
        Object.extend(mergedParams, params);
        var obj = new OpenLayers.Layer.WFS(name, this.url, mergedParams);
        if (this.tileSize)
            obj.setTileSize(this.tileSize);
        return obj;
    },

    /**
    * addTile creates a tile, initializes it (via 'draw' in this case), and 
    * adds it to the layer div. 
    *
    * @param {OpenLayers.Bounds} bounds
    *
    * @returns The added OpenLayers.Tile.WFS
    * @type OpenLayers.Tile.WFS
    */
    addTile:function(bounds, position) {
        url = this.getFullRequestString(
                     { BBOX:bounds.toBBOX() });

        return new OpenLayers.Tile.WFS(this, position, bounds, 
                                           url, this.tileSize);
    },



    /**
     * Catch changeParams and uppercase the new params to be merged in
     *  before calling changeParams on the super class.
     * 
     * Once params have been changed, we will need to re-init our tiles
     * 
     * @param {Object} params Hash of new params to use
     */
    mergeNewParams:function(params) {
        var upperParams = OpenLayers.Util.upperCaseObject(params);
        var newArguments = [upperParams];
        OpenLayers.Layer.Grid.prototype.mergeNewParams.apply(this, newArguments);

        this._initTiles();
    },

    /** combine the layer's url with its params and these newParams. 
    *   
    *    Add the SRS parameter from getProjection() -- this is probably
    *     more eloquently done via a setProjection() method, but this 
    *     works for now and always.
    * 
    * @param {Object} newParams
    * 
    * @type String
    */
    getFullRequestString:function(newParams) {
        this.params.SRS = this.map.getProjection();
        return OpenLayers.Layer.Grid.prototype.getFullRequestString.apply(
                                                    this, arguments);
    },
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.WFS"
}
)
);
