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
 * The feature being drawn.
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
 * Canvas context. Only available when a Canvas renderer is used, null
 * otherwise.
 * @type {CanvasRenderingContext2D|null|undefined}
 */
oli.render.Event.prototype.context;


/**
 * @type {olx.FrameState|undefined}
 */
oli.render.Event.prototype.frameState;


/**
 * WebGL context. Only available when a WebGL renderer is used, null otherwise.
 * @type {ol.webgl.Context|null|undefined}
 */
oli.render.Event.prototype.glContext;


/**
 * For canvas, this is an instance of {@link ol.render.canvas.Immediate}.
 * @type {ol.render.IVectorContext|undefined}
 */
oli.render.Event.prototype.vectorContext;



/** @interface */
oli.source.VectorEvent;


/**
 * The feature being added or removed.
 * @type {ol.Feature}
 */
oli.source.VectorEvent.prototype.feature;
