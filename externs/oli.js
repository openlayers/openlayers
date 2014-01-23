/**
 * @externs
 */


/**
 * @type {Object}
 */
var oli;



/** @interface */
oli.CollectionEvent = function() {};


/** @type {*} */
oli.CollectionEvent.prototype.element;


/**
 * @interface
 */
oli.control.Control = function() {};


/**
 * @param {ol.Map} map Map.
 * @return {undefined} Undefined.
 */
oli.control.Control.prototype.setMap = function(map) {};



/** @interface */
oli.interaction.DragAndDropEvent = function() {};


/** @type {Array.<ol.Feature>} */
oli.interaction.DragAndDropEvent.prototype.features;


/** @type {ol.proj.Projection} */
oli.interaction.DragAndDropEvent.prototype.projection;
