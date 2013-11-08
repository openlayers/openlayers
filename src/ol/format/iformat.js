// FIXME add XML
// FIXME add IWriter

goog.provide('ol.format.IReader');



/**
 * @interface
 */
ol.format.IReader = function() {
};


/**
 * @param {Object} object Object.
 * @param {function(this: S, ol.Feature): T} callback Callback.
 * @param {S=} opt_obj Scope.
 * @return {T|undefined} Callback result.
 * @template S,T
 */
ol.format.IReader.prototype.readObject = function(object, callback, opt_obj) {
};


/**
 * @param {string} string String.
 * @param {function(this: S, ol.Feature): T} callback Callback.
 * @param {S=} opt_obj Scope.
 * @return {T|undefined} Callback result.
 * @template S,T
 */
ol.format.IReader.prototype.readString = function(string, callback, opt_obj) {
};
