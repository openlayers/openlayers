/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * Class: OpenLayers.Protocol
 * Abstract vector layer protocol class.  Not to be instantiated directly.  Use
 *     one of the protocol subclasses instead.
 */
OpenLayers.Protocol = OpenLayers.Class({
    
    /**
     * Property: format
     * {<OpenLayers.Format>}
     */
    format: null,
    
    /**
     * Property: options
     * Any options sent to the constructor.
     */
    options: null,

    /**
     * Property: autoDestroy
     * {Boolean} The creator of the protocol can set autoDestroy to false
     *      to fully control when the protocol is destroyed. Defaults to
     *      true.
     */
    autoDestroy: true,
   
    /**
     * Constructor: OpenLayers.Protocol
     * Abstract class for vector protocols.  Create instances of a subclass.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     */
    initialize: function(options) {
        OpenLayers.Util.extend(this, options);
        this.options = options;
    },

    /**
     * APIMethod: destroy
     * Clean up the protocol.
     */
    destroy: function() {
        this.options = null;
        this.format = null;
    },
    
    /**
     * Method: read
     * Construct a request for reading new features.
     *
     * Parameters:
     * options - {Object} Optional object for configuring the request.
     */
    read: function() {
    },
    
    
    /**
     * Method: create
     * Construct a request for writing newly created features.
     *
     * Parameters:
     * features - {Array({<OpenLayers.Feature.Vector>})} or
     *            {<OpenLayers.Feature.Vector>}
     * options - {Object} Optional object for configuring the request.
     */
    create: function() {
    },
    
    /**
     * Method: update
     * Construct a request updating modified features.
     *
     * Parameters:
     * features - {Array({<OpenLayers.Feature.Vector>})} or
     *            {<OpenLayers.Feature.Vector>}
     * options - {Object} Optional object for configuring the request.
     */
    update: function() {
    },
    
    /**
     * Method: delete
     * Construct a request deleting a removed feature.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     * options - {Object} Optional object for configuring the request.
     */
    "delete": function() {
    },

    /**
     * Method: commit
     * Go over the features and for each take action
     * based on the feature state. Possible actions are create,
     * update and delete.
     *
     * Parameters:
     * features - {Array({<OpenLayers.Feature.Vector>})}
     * options - {Object} Map of options, the keys of the map are
     *           'create', 'update', and 'delete'
     */
    commit: function() {
    },
   
    CLASS_NAME: "OpenLayers.Protocol" 
});

/**
 * Class: OpenLayers.Protocol.Response
 * Protocols return Response objects to their users.
 */
OpenLayers.Protocol.Response = new OpenLayers.Class({
    /**
     * Property: code
     * {Integer} - OpenLayers.Protocol.Response.SUCCESS or
     *             OpenLayers.Protocol.Response.FAILURE
     */
    code: null,

    /**
     * Property: features
     * {Array({<OpenLayers.Feature.Vector>})} or {<OpenLayers.Feature.Vector>}
     * The features returned in the response by the server.
     */
    features: null,

    /**
     * Property: reqFeatures
     * {Array({<OpenLayers.Feature.Vector>})} or {<OpenLayers.Feature.Vector>}
     * The features provided by the user and placed in the request by the
     *      protocol.
     */
    reqFeatures: null,

    /**
     * Property: priv
     */
    priv: null,

    /**
     * Constructor: OpenLayers.Protocol.Response
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     */
    initialize: function(options) {
        OpenLayers.Util.extend(this, options);
    },

    /**
     * Method: success
     *
     * Returns:
     * {Boolean} - true on success, false otherwise
     */
    success: function() {
        return !!(this.code & OpenLayers.Protocol.Response.SUCCESS_MASK);
    },

    CLASS_NAME: "OpenLayers.Protocol.Response"
});

OpenLayers.Protocol.Response.SUCCESS_MASK    = 0x000000ff;
OpenLayers.Protocol.Response.SUCCESS         = 0x00000001;

OpenLayers.Protocol.Response.FAILURE_MASK    = 0x0000ff00;
OpenLayers.Protocol.Response.FAILURE         = 0x00000100;
