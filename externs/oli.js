/**
 * @externs
 */


/**
 * @type {Object}
 */
var oli;



/** @interface */
oli.CollectionEvent;


/**
 * @type {*}
 */
oli.CollectionEvent.prototype.element;



/** @interface */
oli.DragBoxEvent;


/**
 * @type {ol.Coordinate}
 */
oli.DragBoxEvent.prototype.coordinate;



/** @interface */
oli.DrawEvent;


/**
 * @type {ol.Feature}
 */
oli.DrawEvent.prototype.feature;



/** @interface */
oli.ObjectEvent;


/** @type {string} */
oli.ObjectEvent.prototype.key;



/** @interface */
oli.MapBrowserEvent;


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



/** @interface */
oli.MapEvent;


/**
 * @type {ol.Map}
 */
oli.MapEvent.prototype.map;


/**
 * @type {olx.FrameState}
 */
oli.MapEvent.prototype.frameState;



/**
 * @interface
 */
oli.control.Control;


/**
 * @param {ol.Map} map Map.
 * @return {undefined} Undefined.
 */
oli.control.Control.prototype.setMap = function(map) {};



/** @interface */
oli.interaction.DragAndDropEvent;


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



/** @interface */
oli.render.Event;


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



/** @interface */
oli.source.VectorEvent;


/**
 * @type {ol.Feature}
 */
oli.source.VectorEvent.prototype.feature;
