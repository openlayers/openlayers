/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/SingleFile.js
 */

/**
 * @requires OpenLayers/Geometry.js
 * @requires OpenLayers/Feature/Vector.js
 * @requires OpenLayers/Format/WKT.js
 * @requires OpenLayers/Format/GeoJSON.js
 * @requires OpenLayers/Format/WPSExecute.js
 * @requires OpenLayers/Request.js
 */

/**
 * Class: OpenLayers.WPSProcess
 * Representation of a WPS process. Usually instances of
 * <OpenLayers.WPSProcess> are created by calling 'getProcess' on an
 * <OpenLayers.WPSClient> instance.
 *
 * Currently <OpenLayers.WPSProcess> supports processes that have geometries
 * or features as output, using WKT or GeoJSON as output format. It also
 * supports chaining of processes by using the <output> method to create a
 * handle that is used as process input instead of a static value.
 */
OpenLayers.WPSProcess = OpenLayers.Class({
    
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
     * APIProperty: localWPS
     * {String} Service endpoint for locally chained WPS processes. Default is
     *     'http://geoserver/wps'.
     */
    localWPS: 'http://geoserver/wps',
    
    /**
     * Property: formats
     * {Object} OpenLayers.Format instances keyed by mimetype.
     */
    formats: null,
    
    /**
     * Property: chained
     * {Integer} Number of chained processes for pending execute requests that
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
     * client - {<OpenLayers.WPSClient>} Mandatory. Client that manages this
     *     process.
     * server - {String} Mandatory. Local client identifier of this process's
     *     server.
     * identifier - {String} Mandatory. Process identifier known to the server.
     */
    initialize: function(options) {
        OpenLayers.Util.extend(this, options);        
        this.executeCallbacks = [];
        this.formats = {
            'application/wkt': new OpenLayers.Format.WKT(),
            'application/json': new OpenLayers.Format.GeoJSON()
        };
    },
    
    /**
     * Method: describe
     * Makes the client issue a DescribeProcess request asynchronously.
     *
     * Parameters:
     * options - {Object} Configuration for the method call
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
        if (!this.description) {
            this.client.describeProcess(this.server, this.identifier, function(description) {
                if (!this.description) {
                    this.parseDescription(description);
                }
                if (options.callback) {
                    options.callback.call(options.scope, this.description);
                }
            }, this);
        } else if (options.callback) {
            var description = this.description;
            window.setTimeout(function() {
                options.callback.call(options.scope, description);
            }, 0);
        }
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
     * Returns:
     * {<OpenLayers.WPSProcess>} this process.
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
        this.describe({
            callback: function() {
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
            scope: this
        });
        return this;
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
     * output - {String} The identifier of the output to request and parse.
     *     Optional. If not provided, the first output will be requested.
     * success - {Function} Callback to call when the process is complete.
     *     This function is called with an outputs object as argument, which
     *     will have a property with the identifier of the requested output
     *     (or 'result' if output was not configured). For processes that
     *     generate spatial output, the value will be an array of
     *     <OpenLayers.Feature.Vector> instances.
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
                            if (features instanceof OpenLayers.Feature.Vector) {
                                features = [features];
                            }
                            if (options.success) {
                                var outputs = {};
                                outputs[options.output || 'result'] = features;
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
     *         geom: intersect.output('result'), // <-- here we're chaining
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
     * description - {Object}
     */
    parseDescription: function(description) {
        var server = this.client.servers[this.server];
        this.description = new OpenLayers.Format.WPSDescribeProcess()
            .read(server.processDescription[this.identifier])
            .processDescriptions[this.identifier];
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
                    this.localWPS : this.client.servers[data.process.server].url
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
        var output = this.description.processOutputs[options.outputIndex || 0];
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
     * chainLink - {<OpenLayers.WPSProcess.ChainLink>} The process to chain.
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
