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
 * Class: OpenLayers.WPSProcess
 */
OpenLayers.WPSProcess = OpenLayers.Class({
    
    /**
     * APIProperty: events
     * {<OpenLayers.Events>}
     *
     * Supported event types:
     * describeprocess - Fires when the process description is available for
     *     the first time.
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
     * Property: chained
     * {Integer} Number of chained processes for pending execute reqeusts that
     * don't have a full configuration yet.
     */
    chained: 0,
    
    /**
     * Property: executeCallbacks
     * {Array} Callbacks waiting to be executed until all chained processes
     * are configured;
     */
    executeCallbacks: null,
    
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
        this.executeCallbacks = [];
        
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
     *
     * Parameters:
     * options - {Object} Coniguration for the method call
     *
     * Available options:
     * callback - {Function} Callback to execute when the description is
     *     available. Will be called with the parsed description as argument.
     *     Optional.
     * scope - {Object} The scope in which the callback will be executed.
     *     Default is the global object.
     */
    describe: function(options) {
        options = options || {};
        function callback() {
            if (options.callback) {
                window.setTimeout(function() {
                    options.callback.call(options.scope, this.description);
                }, 0);
            }
        }
        var server = this.client.servers[this.server];
        if (this.description !== null) {
            callback();
            return;
        } else if (server.describeProcessResponse[this.identifier] === null) {
            // pending request
            this.events.register('describeprocess', this, callback);
            return;
        } else if (this.identifier in server.describeProcessResponse) {
            // process description already cached on client
            this.parseDescription();
            callback();
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
            success: function(response) {
                this.parseDescription(response);
                if (options.callback) {
                    options.callback.call(options.scope, this.description);
                }
            },
            scope: this
        });
    },
    
    /**
     * APIMethod: configure
     * Configure the process, but do not execute it. Use this for processes
     * that are chained as input of a different process by means of the
     * <output> method.
     *
     * Parameters:
     * options - {Object}
     *
     * Available options:
     * inputs - {Object} The inputs for the process, keyed by input identifier.
     *     For spatial data inputs, the value of an input is usually an
     *     <OpenLayers.Geometry>, an <OpenLayers.Feature.Vector> or an array of
     *     geometries or features.
     * callback - {Function} Callback to call when the configuration is
     *     complete. Optional.
     * scope - {Object} Optional scope for the callback.
     */
    configure: function(options) {
        if (!this.description) {
            this.describe({
                callback: function() {
                    this.configure(options);
                },
                scope: this
            });
            return;
        }
        var description = this.description,
            inputs = options.inputs,
            input, i, ii;
        for (i=0, ii=description.dataInputs.length; i<ii; ++i) {
            input = description.dataInputs[i];
            this.setInputData(input, inputs[input.identifier]);
        }
        if (options.callback) {
            options.callback.call(options.scope);
        }
    },
    
    /**
     * APIMethod: execute
     * Configures and executes the process
     *
     * Parameters:
     * options - {Object}
     *
     * Available options:
     * inputs - {Object} The inputs for the process, keyed by input identifier.
     *     For spatial data inputs, the value of an input is usually an
     *     <OpenLayers.Geometry>, an <OpenLayers.Feature.Vector> or an array of
     *     geometries or features.
     * output - {String} The identifier of an output to parse. Optional. If not
     *     provided, the first output will be parsed.
     * success - {Function} Callback to call when the process is complete.
     *     This function is called with an outputs object as argument, which
     *     will have a property with the name of the requested output (e.g.
     *     'result'). For processes that generate spatial output, the value
     *     will either be a single <OpenLayers.Feature.Vector> or an array of
     *     features.
     * scope - {Object} Optional scope for the success callback.
     */
    execute: function(options) {
        this.configure({
            inputs: options.inputs,
            callback: function() {
                var me = this;
                //TODO For now we only deal with a single output
                var outputIndex = this.getOutputIndex(
                    me.description.processOutputs, options.output
                );
                me.setResponseForm({outputIndex: outputIndex});
                (function callback() {
                    OpenLayers.Util.removeItem(me.executeCallbacks, callback);
                    if (me.chained !== 0) {
                        // need to wait until chained processes have a
                        // description and configuration - see chainProcess
                        me.executeCallbacks.push(callback);
                        return;
                    }
                    // all chained processes are added as references now, so
                    // let's proceed.
                    OpenLayers.Request.POST({
                        url: me.client.servers[me.server].url,
                        data: new OpenLayers.Format.WPSExecute().write(me.description),
                        success: function(response) {
                            var output = me.description.processOutputs[outputIndex];
                            var mimeType = me.findMimeType(
                                output.complexOutput.supported.formats
                            );
                            //TODO For now we assume a spatial output
                            var features = me.formats[mimeType].read(response.responseText);
                            if (options.success) {
                                var outputs = {};
                                outputs[output.identifier] = features;
                                options.success.call(options.scope, outputs);
                            }
                        },
                        scope: me
                    });
                })();
            },
            scope: this
        });
    },
    
    /**
     * APIMethod: output
     * Chain an output of a configured process (see <configure>) as input to
     * another process.
     *
     * (code)
     * intersect = client.getProcess('opengeo', 'JTS:intersection');    
     * intersect.configure({
     *     // ...
     * });
     * buffer = client.getProcess('opengeo', 'JTS:buffer');
     * buffer.execute({
     *     inputs: {
     *         geom: intersect.output(), // <-- here we're chaining
     *         distance: 1
     *     },
     *     // ...
     * });
     * (end)
     *
     * Parameters:
     * identifier - {String} Identifier of the output that we're chaining. If
     *     not provided, the first output will be used.
     */
    output: function(identifier) {
        return new OpenLayers.WPSProcess.ChainLink({
            process: this,
            output: identifier
        });
    },
    
    /**
     * Method: parseDescription
     * Parses the DescribeProcess response
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
        delete input.data;
        delete input.reference;
        if (data instanceof OpenLayers.WPSProcess.ChainLink) {
            ++this.chained;
            input.reference = {
                method: 'POST',
                href: data.process.server === this.server ?
                    //TODO what about implementations other than GeoServer?
                    'http://geoserver/wps' :
                    this.client.servers[data.process.server].url
            };
            data.process.describe({
                callback: function() {
                    --this.chained;
                    this.chainProcess(input, data);
                },
                scope: this
            });
        } else {
            input.data = {};
            var complexData = input.complexData;
            if (complexData) {
                var format = this.findMimeType(complexData.supported.formats);
                input.data.complexData = {
                    mimeType: format,
                    value: this.formats[format].write(this.toFeatures(data))
                };
            } else {
                input.data.literalData = {
                    value: data
                };
            }
        }
    },
    
    /**
     * Method: setResponseForm
     * Sets the responseForm property of the <execute> payload.
     *
     * Parameters:
     * options - {Object} See below.
     *
     * Available options:
     * outputIndex - {Integer} The index of the output to use. Optional.
     * supportedFormats - {Object} Object with supported mime types as key,
     *     and true as value for supported types. Optional.
     */
    setResponseForm: function(options) {
        options = options || {};
        output = this.description.processOutputs[options.outputIndex || 0];
        this.description.responseForm = {
            rawDataOutput: {
                identifier: output.identifier,
                mimeType: this.findMimeType(output.complexOutput.supported.formats, options.supportedFormats)
            }
        };
    },
    
    /**
     * Method: getOutputIndex
     * Gets the index of a processOutput by its identifier
     *
     * Parameters:
     * outputs - {Array} The processOutputs array to look at
     * identifier - {String} The identifier of the output
     *
     * Returns
     * {Integer} The index of the processOutput with the provided identifier
     *     in the outputs array.
     */
    getOutputIndex: function(outputs, identifier) {
        var output;
        if (identifier) {
            for (var i=outputs.length-1; i>=0; --i) {
                if (outputs[i].identifier === identifier) {
                    output = i;
                    break;
                }
            }
        } else {
            output = 0;
        }
        return output;
    },
    
    /**
     * Method: chainProcess
     * Sets a fully configured chained process as input for this process.
     *
     * Parameters:
     * input - {Object} The dataInput that the chained process provides.
     * chainLink - {<OpenLayers.WPSProcess.ChainLink} The process to chain.
     */
    chainProcess: function(input, chainLink) {
        var output = this.getOutputIndex(
            chainLink.process.description.processOutputs, chainLink.output
        );
        input.reference.mimeType = this.findMimeType(
            input.complexData.supported.formats,
            chainLink.process.description.processOutputs[output].complexOutput.supported.formats
        );
        var formats = {};
        formats[input.reference.mimeType] = true;
        chainLink.process.setResponseForm({
            outputIndex: output,
            supportedFormats: formats
        });
        input.reference.body = chainLink.process.description;
        while (this.executeCallbacks.length > 0) {
            this.executeCallbacks[0]();
        }
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
     * sourceFormats - {Object} An object literal with mime types as key and
     *     true as value for supported formats.
     * targetFormats - {Object} Like <sourceFormats>, but optional to check for
     *     supported mime types on a different target than this process.
     *     Default is to check against this process's supported formats.
     *
     * Returns:
     * {String} A supported mime type.
     */
    findMimeType: function(sourceFormats, targetFormats) {
        targetFormats = targetFormats || this.formats;
        for (var f in sourceFormats) {
            if (f in targetFormats) {
                return f;
            }
        }
    },
    
    CLASS_NAME: "OpenLayers.WPSProcess"
    
});

/**
 * Class: OpenLayers.WPSProcess.ChainLink
 * Type for chaining processes.
 */
OpenLayers.WPSProcess.ChainLink = OpenLayers.Class({
    
    /**
     * Property: process
     * {<OpenLayers.WPSProcess>} The process to chain
     */
    process: null,
    
    /**
     * Property: output
     * {String} The output identifier of the output we are going to use as
     *     input for another process.
     */
    output: null,
    
    /**
     * Constructor: OpenLayers.WPSProcess.ChainLink
     *
     * Parameters:
     * options - {Object} Properties to set on the instance.
     */
    initialize: function(options) {
        OpenLayers.Util.extend(this, options);
    },
    
    CLASS_NAME: "OpenLayers.WPSProcess.ChainLink"
    
});
