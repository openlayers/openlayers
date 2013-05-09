/**
 * @externs
 */


/**
 * @type {Object}
 */
var oli;


/**
 * @interface
 */
oli.control.Control = function() {};


/**
 * @param {ol.MapEvent} mapEvent Map event.
 */
oli.control.Control.prototype.handleMapPostrender = function(mapEvent) {};


/**
 * @param {ol.Map} map Map.
 * @return {undefined} Undefined.
 */
oli.control.Control.prototype.setMap = function(map) {};
