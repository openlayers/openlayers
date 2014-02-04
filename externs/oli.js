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


/** @interface */
oli.DrawEvent;


/** @type {ol.Feature} */
oli.DrawEvent.prototype.feature;



/** @interface */
oli.ObjectEvent;


/** @type {string} */
oli.ObjectEvent.prototype.key;



/** @interface */
oli.MapBrowserEvent;


/** @type {ol.Coordinate} */
oli.MapBrowserEvent.prototype.coordinate;


/** @type {Event} */
oli.MapBrowserEvent.prototype.originalEvent;


/** @type {ol.Pixel} */
oli.MapBrowserEvent.prototype.pixel;



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



/** @interface */
oli.render.Event = function() {};


/** @type {CanvasRenderingContext2D|null|undefined} */
oli.render.Event.prototype.context;


/** @type {ol.FrameState|undefined} */
oli.render.Event.prototype.frameState;


/** @type {ol.webgl.Context|null|undefined} */
oli.render.Event.prototype.glContext;


/** @type {ol.render.IRender|undefined} */
oli.render.Event.prototype.render;



/** @interface */
oli.source.VectorEvent;


/** @type {ol.Feature} */
oli.source.VectorEvent.prototype.feature;
