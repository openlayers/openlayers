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
 * The element that is added to or removed from the collection.
 * @type {*}
 * @todo api
 */
oli.CollectionEvent.prototype.element;



/** @interface */
oli.DragBoxEvent;


/**
 * @type {ol.Coordinate}
 * @todo api
 */
oli.DragBoxEvent.prototype.coordinate;



/** @interface */
oli.DrawEvent;


/**
 * The feature being drawn.
 * @type {ol.Feature}
 * @todo api
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
 * @todo api
 */
oli.MapBrowserEvent.prototype.coordinate;


/**
 * @type {Event}
 * @todo api
 */
oli.MapBrowserEvent.prototype.originalEvent;


/**
 * @type {ol.Pixel}
 * @todo api
 */
oli.MapBrowserEvent.prototype.pixel;



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
 * @todo api
 */
oli.interaction.DragAndDropEvent.prototype.features;


/**
 * @type {ol.proj.Projection|undefined}
 * @todo api
 */
oli.interaction.DragAndDropEvent.prototype.projection;


/**
 * @type {File}
 * @todo api
 */
oli.interaction.DragAndDropEvent.prototype.file;


/** @interface */
oli.render.Event;


/**
 * Canvas context. Only available when a Canvas renderer is used, null
 * otherwise.
 * @type {CanvasRenderingContext2D|null|undefined}
 * @todo api
 */
oli.render.Event.prototype.context;


/**
 * @type {olx.FrameState|undefined}
 * @todo api
 */
oli.render.Event.prototype.frameState;


/**
 * WebGL context. Only available when a WebGL renderer is used, null otherwise.
 * @type {ol.webgl.Context|null|undefined}
 * @todo api
 */
oli.render.Event.prototype.glContext;


/**
 * For canvas, this is an instance of {@link ol.render.canvas.Immediate}.
 * @type {ol.render.IVectorContext|undefined}
 * @todo api
 */
oli.render.Event.prototype.vectorContext;



/** @interface */
oli.source.VectorEvent;


/**
 * The feature being added or removed.
 * @type {ol.Feature}
 * @todo api
 */
oli.source.VectorEvent.prototype.feature;
