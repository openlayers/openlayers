/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/SingleFile.js
 */

/**
 * @requires OpenLayers/Events.js
 * @requires OpenLayers/WPSProcess.js
 * @requires OpenLayers/Format/WPSDescribeProcess.js
 * @requires OpenLayers/Request.js
 */

/**
 * Class: OpenLayers.WPSClient
 * High level API for interaction with Web Processing Services (WPS).
 * An <OpenLayers.WPSClient> instance is used to create <OpenLayers.WPSProcess>
 * instances for servers known to the WPSClient. The WPSClient also caches
 * DescribeProcess responses to reduce the number of requests sent to servers
 * when processes are created.
 */
OpenLayers.WPSClient = OpenLayers.Class({
    
    /**
     * Property: servers
     * {Object} Service metadata, keyed by a local identifier.
     *
     * Properties:
     * url - {String} the url of the server
     * version - {String} WPS version of the server
     * processDescription - {Object} Cache of raw DescribeProcess
     *     responses, keyed by process identifier.
     */
    servers: null,
    
    /**
     * Property: version
     * {String} The default WPS version to use if none is configured. Default
     *     is '1.0.0'.
     */
    version: '1.0.0',
    
    /**
     * Property: lazy
     * {Boolean} Should the DescribeProcess be deferred until a process is
     *     fully configured? Default is false.
     */
    lazy: false,
    
    /**
     * Property: events
     * {<OpenLayers.Events>}
     *
     * Supported event types:
     * describeprocess - Fires when the process description is available.
     *     Listeners receive an object with a 'raw' property holding the raw
     *     DescribeProcess response, and an 'identifier' property holding the
     *     process identifier of the described process.
     */
    events: null,
    
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
        this.events = new OpenLayers.Events(this);
        this.servers = {};
        for (var s in options.servers) {
            this.servers[s] = typeof options.servers[s] == 'string' ? {
                url: options.servers[s],
                version: this.version,
                processDescription: {}
            } : options.servers[s];
        }
    },
    
    /**
     * APIMethod: execute
     * Shortcut to execute a process with a single function call. This is
     * equivalent to using <getProcess> and then calling execute on the
     * process.
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
     * output - {String} The identifier of an output to parse. Optional. If not
     *     provided, the first output will be parsed.
     * success - {Function} Callback to call when the process is complete.
     *     This function is called with an outputs object as argument, which
     *     will have a property with the identifier of the requested output
     *     (e.g. 'result'). For processes that generate spatial output, the
     *     value will either be a single <OpenLayers.Feature.Vector> or an
     *     array of features.
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
     * serverID - {String} Local identifier from the servers that this instance
     *     was constructed with.
     * processID - {String} Process identifier known to the server.
     *
     * Returns:
     * {<OpenLayers.WPSProcess>}
     */
    getProcess: function(serverID, processID) {
        var process = new OpenLayers.WPSProcess({
            client: this,
            server: serverID,
            identifier: processID
        });
        if (!this.lazy) {
            process.describe();
        }
        return process;
    },
    
    /**
     * Method: describeProcess
     *
     * Parameters:
     * serverID - {String} Identifier of the server
     * processID - {String} Identifier of the requested process
     * callback - {Function} Callback to call when the description is available
     * scope - {Object} Optional execution scope for the callback function
     */
    describeProcess: function(serverID, processID, callback, scope) {
        var server = this.servers[serverID];
        if (!server.processDescription[processID]) {
            if (!(processID in server.processDescription)) {
                // set to null so we know a describeFeature request is pending
                server.processDescription[processID] = null;
                OpenLayers.Request.GET({
                    url: server.url,
                    params: {
                        SERVICE: 'WPS',
                        VERSION: server.version,
                        REQUEST: 'DescribeProcess',
                        IDENTIFIER: processID
                    },
                    success: function(response) {
                        server.processDescription[processID] = response.responseText;
                        this.events.triggerEvent('describeprocess', {
                            identifier: processID,
                            raw: response.responseText
                        });
                    },
                    scope: this
                });
            } else {
                // pending request
                this.events.register('describeprocess', this, function describe(evt) {
                    if (evt.identifier === processID) {
                        this.events.unregister('describeprocess', this, describe);
                        callback.call(scope, evt.raw);
                    }
                });
            }
        } else {
            window.setTimeout(function() {
                callback.call(scope, server.processDescription[processID]);
            }, 0);
        }
    },
    
    /**
     * Method: destroy
     */
    destroy: function() {
        this.events.destroy();
        this.events = null;
        this.servers = null;
    },
    
    CLASS_NAME: 'OpenLayers.WPSClient'
    
});
