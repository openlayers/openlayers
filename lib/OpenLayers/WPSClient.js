/**
 * Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. 
 *
 * @requires OpenLayers/SingleFile.js
 */

/**
 * Class: OpenLayers.WPSClient
 */
OpenLayers.WPSClient = OpenLayers.Class({
    
    /**
     * Property: servers
     * {Object} Service metadata, keyed by a local identifier.
     *
     * Properties:
     * url - {String} the url of the server
     * version - {String} WPS version of the server
     * describeProcessResponse - {Object} Cache of DescribeProcess responses,
     *     keyed by process identifier.
     */
    servers: null,
    
    /**
     * Property: lazy
     * {Boolean} Should the DescribeProcess be deferred until a process is
     *     fully configured? Default is false.
     */
    lazy: false,
    
    /**
     * Constructor: OpenLayers.WPSClient
     *
     * Parameters:
     * options - {Object} Object whose properties will be set on the instance.
     *
     * Avaliable options:
     * servers - {Object} Mandatory. Service metadata, keyed by a local
     *     identifier. Can either be a string with the service url or an
     *     object literal with additional metadata:
     *
     *     (code)
     *     servers: {
     *         local: '/geoserver/wps'
     *     }, {
     *         opengeo: {
     *             url: 'http://demo.opengeo.org/geoserver/wps',
     *             version: '1.0.0'
     *         }
     *     }
     *     (end)
     *
     * lazy - {Boolean} Optional. Set to true if DescribeProcess should not be
     *     requested until a process is fully configured. Default is false.
     */
    initialize: function(options) {
        OpenLayers.Util.extend(this, options);
        this.servers = {};
        for (var s in options.servers) {
            this.servers[s] = typeof options.servers[s] == 'string' ? {
                url: options.servers[s],
                version: '1.0.0',
                describeProcessResponse: {}
            } : options.servers[s];
        }
    },
    
    /**
     * APIMethod: execute
     *
     * Parameters:
     * options - {Object} Options for the execute operation.
     *
     * Available options:
     * server - {String} Mandatory. One of the local identifiers of the
     *     configured servers.
     * process - {String} Mandatory. A process identifier known to the
     *     server.
     * inputs - {Object} The inputs for the process, keyed by input identifier.
     *     For spatial data inputs, the value of an input is usually an
     *     <OpenLayers.Geometry>, an <OpenLayers.Feature.Vector> or an array of
     *     geometries or features.
     * success - {Function} Callback to call when the process is complete.
     *     This function is called with an outputs object as argument, which
     *     will have a 'result' property. For processes that generate spatial
     *     output, this will either be a single <OpenLayers.Feature.Vector> or
     *     an array of features.
     * scope - {Object} Optional scope for the success callback.
     */
    execute: function(options) {
        var process = this.getProcess(options.server, options.process);
        process.execute({
            inputs: options.inputs,
            success: options.success,
            scope: options.scope
        });
    },
    
    /**
     * APIMethod: getProcess
     * Creates an <OpenLayers.WPSProcess>.
     *
     * Parameters:
     * server - {String} Local identifier from the servers that this instance
     *     was constructed with.
     * identifier - {String} Process identifier known to the server.
     *
     * Returns:
     * {<OpenLayers.WPSProcess>}
     */
    getProcess: function(server, identifier) {
        var process = new OpenLayers.WPSProcess({
            client: this,
            server: server,
            identifier: identifier
        });
        if (!this.lazy) {
            process.describe();
        }
        return process;
    },
    
    CLASS_NAME: 'OpenLayers.WPSClient'
    
});
