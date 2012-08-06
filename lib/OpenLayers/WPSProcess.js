/**
 * Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. 
 *
 * @requires OpenLayers/SingleFile.js
 */

/**
 * @requires OpenLayers/Events.js
 * @requires OpenLayers/Geometry.js
 * @requires OpenLayers/Feature/Vector.js
 */

/**
 * Class: OpenLayers.WPSProces
 */
OpenLayers.WPSProcess = OpenLayers.Class({
    
    /**
     * APIProperty: events
     * {<OpenLayers.Events>}
     *
     * Supported event types:
     * describeprocess - fires when the process description is available
     */
    events: null,
    
    /**
     * Property: client
     * {<OpenLayers.WPSClient>} The client that manages this process.
     */
    client: null,
    
    /**
     * Property: server
     * {String} Local client identifier for this process's server.
     */
    server: null,
    
    /**
     * Property: identifier
     * {String} Process identifier known to the server.
     */
    identifier: null,
    
    /**
     * Property: description
     * {Object} DescribeProcess response for this process.
     */
    description: null,
    
    /**
     * Property: formats
     * {Object} OpenLayers.Format instances keyed by mimetype.
     */
    formats: null,
    
    /**
     * Constructor: OpenLayers.WPSProcess
     *
     * Parameters:
     * options - {Object} Object whose properties will be set on the instance.
     *
     * Avaliable options:
     * client - {<OpenLayers.WPSClient} Mandatory. Client that manages this
     *     process.
     * server - {String} Mandatory. Local client identifier of this process's
     *     server.
     * identifier - {String} Mandatory. Process identifier known to the server.
     */
    initialize: function(options) {
        OpenLayers.Util.extend(this, options);
        
        this.events = new OpenLayers.Events(this);
        
        this.formats = {
            'application/wkt': new OpenLayers.Format.WKT(),
            'application/json': new OpenLayers.Format.GeoJSON()
        };
    },
    
    /**
     * Method: describe
     * Issues a DescribeProcess request asynchronously and fires the
     * 'describeprocess' event as soon as the response is available in
     * <description>.
     */
    describe: function() {
        var server = this.client.servers[this.server];
        if (this.description !== null) {
            return;
        } else if (server.describeProcessResponse[this.identifier] === null) {
            // pending request
            return;
        } else if (this.identifier in server.describeProcessResponse) {
            // process description already cached on client
            this.parseDescription();
            return;
        }
        // set to null so we know a describeFeature request is pending
        server.describeProcessResponse[this.identifier] = null;
        OpenLayers.Request.GET({
            url: server.url,
            params: {
                SERVICE: 'WPS',
                VERSION: server.version,
                REQUEST: 'DescribeProcess',
                IDENTIFIER: this.identifier
            },
            success: this.parseDescription,
            scope: this
        });
    },
    
    /**
     * APIMethod: execute
     * Executes the process
     *
     * Parameters:
     * options - {Object}
     *
     * Available options:
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
        if (!this.description) {
            this.events.register('describeprocess', this, function execute() {
                this.events.unregister('describeprocess', this, execute);
                this.execute(options);
            });
            this.describe();
            return;
        }
        var description = this.description,
            inputs = options.inputs,
            input, i, ii;
        for (i=0, ii=description.dataInputs.length; i<ii; ++i) {
            input = description.dataInputs[i];
            this.setInputData(input, inputs[input.identifier]);
        }
        //TODO For now we only handle responseForm with a single output
        this.setResponseForm();
        OpenLayers.Request.POST({
            url: this.client.servers[this.server].url,
            data: new OpenLayers.Format.WPSExecute().write(this.description),
            success: function(response) {
                var mimeType = this.findMimeType(this.description.processOutputs[0].complexOutput);
                var features = this.formats[mimeType].read(response.responseText);
                if (options.success) {
                    options.success.call(options.scope, {
                        result: features
                    });
                }
            },
            scope: this
        });
    },
    
    /**
     * Method: parseDescription
     *
     * Parameters:
     * response - {Object}
     */
    parseDescription: function(response) {
        var server = this.client.servers[this.server];
        if (response) {
            server.describeProcessResponse[this.identifier] = response.responseText;
        }
        this.description = new OpenLayers.Format.WPSDescribeProcess()
            .read(server.describeProcessResponse[this.identifier])
            .processDescriptions[this.identifier];
        this.events.triggerEvent('describeprocess');
    },
    
    /**
     * Method: setInputData
     * Sets the data for a single input
     *
     * Parameters:
     * input - {Object}  An entry from the dataInputs array of the process
     *     description.
     * data - {Mixed} For spatial data inputs, this is usually an
     *     <OpenLayers.Geometry>, an <OpenLayers.Feature.Vector> or an array of
     *     geometries or features.
     */
    setInputData: function(input, data) {
        // clear any previous data
        input.data = {};
        if (data) {
            var complexData = input.complexData;
            if (complexData) {
                var format = this.findMimeType(complexData);
                input.data.complexData = {
                    mimeType: format,
                    value: this.formats[format].write(this.toFeatures(data))
                };
            }
        }
    },
    
    /**
     * Method: setResponseForm
     * Sets the responseForm property of the <execute> payload.
     */
    setResponseForm: function() {
        output = this.description.processOutputs[0];
        this.description.responseForm = {
            rawDataOutput: {
                identifier: output.identifier,
                mimeType: this.findMimeType(output.complexOutput)
            }
        };
    },
    
    /**
     * Method: toFeatures
     * Converts spatial input into features so it can be processed by
     * <OpenLayers.Format> instances.
     *
     * Parameters:
     * source - {Mixed} An <OpenLayers.Geometry>, an
     *     <OpenLayers.Feature.Vector>, or an array of geometries or features
     *
     * Returns:
     * {Array(<OpenLayers.Feature.Vector>)}
     */
    toFeatures: function(source) {
        var isArray = OpenLayers.Util.isArray(source);
        if (!isArray) {
            source = [source];
        }
        var target = new Array(source.length),
            current;
        for (var i=0, ii=source.length; i<ii; ++i) {
            current = source[i];
            target[i] = current instanceof OpenLayers.Feature.Vector ?
                current : new OpenLayers.Feature.Vector(current);
        }
        return isArray ? target : target[0];
    },
    
    /**
     * Method: findMimeType
     * Finds a supported mime type.
     *
     * Parameters:
     * complex - {Object} A complexData or complexOutput object from the
     *     process description.
     *
     * Returns:
     * {String} A supported mime type.
     */
    findMimeType: function(complex) {
        var formats = complex.supported.formats;
        for (var f in formats) {
            if (f in this.formats) {
                return f;
            }
        }
    },
    
    CLASS_NAME: "OpenLayers.WPSProcess"
    
});
