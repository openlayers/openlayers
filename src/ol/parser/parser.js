goog.provide('ol.parser.Parser');



/**
 * @constructor
 */
ol.parser.Parser = function() {};

/**
 * @param {*} data Data to deserialize.
 * @return {*} Parsed data.
 */
ol.parser.Parser.prototype.read = goog.abstractMethod;


/**
 * @param {*} obj Object to serialize.
 * @return {*} Serialized object.
 */
ol.parser.Parser.prototype.write = goog.abstractMethod;
