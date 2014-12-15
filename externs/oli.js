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
oli.CollectionEvent = function() {};


/**
 * @type {*}
 */
oli.CollectionEvent.prototype.element;



/**
 * @interface
 */
oli.DragBoxEvent = function() {};


/**
 * @type {ol.Coordinate}
 */
oli.DragBoxEvent.prototype.coordinate;



/**
 * @interface
 */
oli.DrawEvent = function() {};


/**
 * @type {ol.Feature}
 */
oli.DrawEvent.prototype.feature;



/**
 * @interface
 */
oli.ObjectEvent = function() {};


/**
 * @type {string}
 */
oli.ObjectEvent.prototype.key;


/**
 * @type {*}
 */
oli.ObjectEvent.prototype.oldValue;



/**
 * @interface
 */
oli.MapBrowserEvent = function() {};


/**
 * @type {ol.Coordinate}
 */
oli.MapBrowserEvent.prototype.coordinate;


/**
 * @type {Event}
 */
oli.MapBrowserEvent.prototype.originalEvent;


/**
 * @type {ol.Pixel}
 */
oli.MapBrowserEvent.prototype.pixel;



/**
 * @interface
 */
oli.MapEvent = function() {};


/**
 * @type {ol.Map}
 */
oli.MapEvent.prototype.map;


/**
 * @type {olx.FrameState}
 */
oli.MapEvent.prototype.frameState;


/**
 * @type {Object}
 */
oli.control;


/**
 * @interface
 */
oli.control.Control = function() {};


/**
 * @param {ol.Map} map Map.
 * @return {undefined} Undefined.
 */
oli.control.Control.prototype.setMap = function(map) {};



/**
 * @type {Object}
 */
oli.interaction;


/**
 * @interface
 */
oli.interaction.DragAndDropEvent = function() {};


/**
 * @type {Array.<ol.Feature>|undefined}
 */
oli.interaction.DragAndDropEvent.prototype.features;


/**
 * @type {ol.proj.Projection|undefined}
 */
oli.interaction.DragAndDropEvent.prototype.projection;


/**
 * @type {File}
 */
oli.interaction.DragAndDropEvent.prototype.file;


/**
 * @type {Object}
 */
oli.render;



/**
 * @interface
 */
oli.render.Event = function() {};


/**
 * @type {CanvasRenderingContext2D|null|undefined}
 */
oli.render.Event.prototype.context;


/**
 * @type {olx.FrameState|undefined}
 */
oli.render.Event.prototype.frameState;


/**
 * @type {ol.webgl.Context|null|undefined}
 */
oli.render.Event.prototype.glContext;


/**
 * @type {ol.render.IVectorContext|undefined}
 */
oli.render.Event.prototype.vectorContext;


/**
 * @type {Object}
 */
oli.source;



/**
 * @interface
 */
oli.source.VectorEvent = function() {};


/**
 * @type {ol.Feature}
 */
oli.source.VectorEvent.prototype.feature;
