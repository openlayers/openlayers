/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * Note:
 * This work draws heavily from the public domain JSON serializer/deserializer
 *     at http://www.json.org/json.js. Rewritten so that it doesn't modify
 *     basic data prototypes.
 */

/**
 * @requires OpenLayers/Format.js
 */

/**
 * Class: OpenLayers.Format.JSON
 * A parser to read/write JSON safely.  Create a new instance with the
 *     <OpenLayers.Format.JSON> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Format>
 */
OpenLayers.Format.JSON = OpenLayers.Class(OpenLayers.Format, {
    
    /**
     * APIProperty: indent
     * {String} For "pretty" printing, the indent string will be used once for
     *     each indentation level.
     */
    indent: "    ",
    
    /**
     * APIProperty: space
     * {String} For "pretty" printing, the space string will be used after
     *     the ":" separating a name/value pair.
     */
    space: " ",
    
    /**
     * APIProperty: newline
     * {String} For "pretty" printing, the newline string will be used at the
     *     end of each name/value pair or array item.
     */
    newline: "\n",
    
    /**
     * Property: level
     * {Integer} For "pretty" printing, this is incremented/decremented during
     *     serialization.
     */
    level: 0,

    /**
     * Property: pretty
     * {Boolean} Serialize with extra whitespace for structure.  This is set
     *     by the <write> method.
     */
    pretty: false,

    /**
     * Property: nativeJSON
     * {Boolean} Does the browser support native json?
     */
    nativeJSON: (function() {
        return !!(window.JSON && typeof JSON.parse == "function" && typeof JSON.stringify == "function");
    })(),

    /**
     * Constructor: OpenLayers.Format.JSON
     * Create a new parser for JSON.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */

    /**
     * APIMethod: read
     * Deserialize a json string.
     *
     * Parameters:
     * json - {String} A JSON string
     * filter - {Function} A function which will be called for every key and
     *     value at every level of the final result. Each value will be
     *     replaced by the result of the filter function. This can be used to
     *     reform generic objects into instances of classes, or to transform
     *     date strings into Date objects.
     *     
     * Returns:
     * {Object} An object, array, string, or number .
     */
    read: function(json, filter) {
        var object;
        if (this.nativeJSON) {
            object = JSON.parse(json, filter);
        } else try {
            /**
             * Parsing happens in three stages. In the first stage, we run the
             *     text against a regular expression which looks for non-JSON
             *     characters. We are especially concerned with '()' and 'new'
             *     because they can cause invocation, and '=' because it can
             *     cause mutation. But just to be safe, we will reject all
             *     unexpected characters.
             */
            if (/^[\],:{}\s]*$/.test(json.replace(/\\["\\\/bfnrtu]/g, '@').
                                replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
                                replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

                /**
                 * In the second stage we use the eval function to compile the
                 *     text into a JavaScript structure. The '{' operator is
                 *     subject to a syntactic ambiguity in JavaScript - it can
                 *     begin a block or an object literal. We wrap the text in
                 *     parens to eliminate the ambiguity.
                 */
                object = eval('(' + json + ')');

                /**
                 * In the optional third stage, we recursively walk the new
                 *     structure, passing each name/value pair to a filter
                 *     function for possible transformation.
                 */
                if(typeof filter === 'function') {
                    function walk(k, v) {
                        if(v && typeof v === 'object') {
                            for(var i in v) {
                                if(v.hasOwnProperty(i)) {
                                    v[i] = walk(i, v[i]);
                                }
                            }
                        }
                        return filter(k, v);
                    }
                    object = walk('', object);
                }
            }
        } catch(e) {
            // Fall through if the regexp test fails.
        }

        if(this.keepData) {
            this.data = object;
        }

        return object;
    },

    /**
     * APIMethod: write
     * Serialize an object into a JSON string.
     *
     * Parameters:
     * value - {String} The object, array, string, number, boolean or date
     *     to be serialized.
     * pretty - {Boolean} Structure the output with newlines and indentation.
     *     Default is false.
     *
     * Returns:
     * {String} The JSON string representation of the input value.
     */
    write: function(value, pretty) {
        this.pretty = !!pretty;
        var json = null;
        var type = typeof value;
        if(this.serialize[type]) {
            try {
                json = (!this.pretty && this.nativeJSON) ?
                    JSON.stringify(value) :
                    this.serialize[type].apply(this, [value]);
            } catch(err) {
                OpenLayers.Console.error("Trouble serializing: " + err);
            }
        }
        return json;
    },
    
    /**
     * Method: writeIndent
     * Output an indentation string depending on the indentation level.
     *
     * Returns:
     * {String} An appropriate indentation string.
     */
    writeIndent: function() {
        var pieces = [];
        if(this.pretty) {
            for(var i=0; i<this.level; ++i) {
                pieces.push(this.indent);
            }
        }
        return pieces.join('');
    },
    
    /**
     * Method: writeNewline
     * Output a string representing a newline if in pretty printing mode.
     *
     * Returns:
     * {String} A string representing a new line.
     */
    writeNewline: function() {
        return (this.pretty) ? this.newline : '';
    },
    
    /**
     * Method: writeSpace
     * Output a string representing a space if in pretty printing mode.
     *
     * Returns:
     * {String} A space.
     */
    writeSpace: function() {
        return (this.pretty) ? this.space : '';
    },

    /**
     * Property: serialize
     * Object with properties corresponding to the serializable data types.
     *     Property values are functions that do the actual serializing.
     */
    serialize: {
        /**
         * Method: serialize.object
         * Transform an object into a JSON string.
         *
         * Parameters:
         * object - {Object} The object to be serialized.
         * 
         * Returns:
         * {String} A JSON string representing the object.
         */
        'object': function(object) {
            // three special objects that we want to treat differently
            if(object == null) {
                return "null";
            }
            if(object.constructor == Date) {
                return this.serialize.date.apply(this, [object]);
            }
            if(object.constructor == Array) {
                return this.serialize.array.apply(this, [object]);
            }
            var pieces = ['{'];
            this.level += 1;
            var key, keyJSON, valueJSON;
            
            var addComma = false;
            for(key in object) {
                if(object.hasOwnProperty(key)) {
                    // recursive calls need to allow for sub-classing
                    keyJSON = OpenLayers.Format.JSON.prototype.write.apply(this,
                                                    [key, this.pretty]);
                    valueJSON = OpenLayers.Format.JSON.prototype.write.apply(this,
                                                    [object[key], this.pretty]);
                    if(keyJSON != null && valueJSON != null) {
                        if(addComma) {
                            pieces.push(',');
                        }
                        pieces.push(this.writeNewline(), this.writeIndent(),
                                    keyJSON, ':', this.writeSpace(), valueJSON);
                        addComma = true;
                    }
                }
            }
            
            this.level -= 1;
            pieces.push(this.writeNewline(), this.writeIndent(), '}');
            return pieces.join('');
        },
        
        /**
         * Method: serialize.array
         * Transform an array into a JSON string.
         *
         * Parameters:
         * array - {Array} The array to be serialized
         * 
         * Returns:
         * {String} A JSON string representing the array.
         */
        'array': function(array) {
            var json;
            var pieces = ['['];
            this.level += 1;
    
            for(var i=0, len=array.length; i<len; ++i) {
                // recursive calls need to allow for sub-classing
                json = OpenLayers.Format.JSON.prototype.write.apply(this,
                                                    [array[i], this.pretty]);
                if(json != null) {
                    if(i > 0) {
                        pieces.push(',');
                    }
                    pieces.push(this.writeNewline(), this.writeIndent(), json);
                }
            }

            this.level -= 1;    
            pieces.push(this.writeNewline(), this.writeIndent(), ']');
            return pieces.join('');
        },
        
        /**
         * Method: serialize.string
         * Transform a string into a JSON string.
         *
         * Parameters:
         * string - {String} The string to be serialized
         * 
         * Returns:
         * {String} A JSON string representing the string.
         */
        'string': function(string) {
            // If the string contains no control characters, no quote characters, and no
            // backslash characters, then we can simply slap some quotes around it.
            // Otherwise we must also replace the offending characters with safe
            // sequences.    
            var m = {
                '\b': '\\b',
                '\t': '\\t',
                '\n': '\\n',
                '\f': '\\f',
                '\r': '\\r',
                '"' : '\\"',
                '\\': '\\\\'
            };
            if(/["\\\x00-\x1f]/.test(string)) {
                return '"' + string.replace(/([\x00-\x1f\\"])/g, function(a, b) {
                    var c = m[b];
                    if(c) {
                        return c;
                    }
                    c = b.charCodeAt();
                    return '\\u00' +
                        Math.floor(c / 16).toString(16) +
                        (c % 16).toString(16);
                }) + '"';
            }
            return '"' + string + '"';
        },

        /**
         * Method: serialize.number
         * Transform a number into a JSON string.
         *
         * Parameters:
         * number - {Number} The number to be serialized.
         *
         * Returns:
         * {String} A JSON string representing the number.
         */
        'number': function(number) {
            return isFinite(number) ? String(number) : "null";
        },
        
        /**
         * Method: serialize.boolean
         * Transform a boolean into a JSON string.
         *
         * Parameters:
         * bool - {Boolean} The boolean to be serialized.
         * 
         * Returns:
         * {String} A JSON string representing the boolean.
         */
        'boolean': function(bool) {
            return String(bool);
        },
        
        /**
         * Method: serialize.object
         * Transform a date into a JSON string.
         *
         * Parameters:
         * date - {Date} The date to be serialized.
         * 
         * Returns:
         * {String} A JSON string representing the date.
         */
        'date': function(date) {    
            function format(number) {
                // Format integers to have at least two digits.
                return (number < 10) ? '0' + number : number;
            }
            return '"' + date.getFullYear() + '-' +
                    format(date.getMonth() + 1) + '-' +
                    format(date.getDate()) + 'T' +
                    format(date.getHours()) + ':' +
                    format(date.getMinutes()) + ':' +
                    format(date.getSeconds()) + '"';
        }
    },

    CLASS_NAME: "OpenLayers.Format.JSON" 

});     
