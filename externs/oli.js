/**
 * @externs
 */


/**
 * @type {Object}
 */
let oli;


/**
 * @interface
 */
oli.AssertionError = function() {};


/**
 * @type {number}
 */
oli.AssertionError.prototype.code;


/**
 * @interface
 */
oli.events.Event = function() {};


/**
 * @type {Object}
 */
oli.events.Event.prototype.target;


/**
 * @type {string}
 */
oli.events.Event.prototype.type;


/**
 */
oli.events.Event.prototype.preventDefault = function() {};


/**
 */
oli.events.Event.prototype.stopPropagation = function() {};


/**
 * @interface
 */
oli.Collection.Event = function() {};


/**
 * @type {*}
 */
oli.Collection.Event.prototype.element;


/**
 * @interface
 */
oli.DragBoxEvent = function() {};


/**
 * @type {ol.Coordinate}
 */
oli.DragBoxEvent.prototype.coordinate;


/**
 * @type {module:ol/MapBrowserEvent~MapBrowserEvent}
 */
oli.DragBoxEvent.prototype.mapBrowserEvent;


/**
 * @interface
 */
oli.DrawEvent = function() {};


/**
 * @type {module:ol/Feature~Feature}
 */
oli.DrawEvent.prototype.feature;


/**
 * @interface
 */
oli.ExtentEvent = function() {};


/**
 * @type {ol.Extent}
 */
oli.ExtentEvent.prototype.extent;

/**
 * @interface
 */
oli.ModifyEvent = function() {};


/**
 * @type {ol.Collection.<module:ol/Feature~Feature>}
 */
oli.ModifyEvent.prototype.features;


/**
 * @type {module:ol/MapBrowserEvent~MapBrowserEvent}
 */
oli.ModifyEvent.prototype.mapBrowserEvent;


/**
 * @type {Object}
 */
oli.Object;


/**
 * @interface
 */
oli.Object.Event = function() {};


/**
 * @type {string}
 */
oli.Object.Event.prototype.key;


/**
 * @type {*}
 */
oli.Object.Event.prototype.oldValue;


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
 * @type {boolean}
 */
oli.MapBrowserEvent.prototype.dragging;


/**
 * @interface
 */
oli.MapEvent = function() {};


/**
 * @type {ol.PluggableMap}
 */
oli.MapEvent.prototype.map;


/**
 * @type {module:ol/PluggableMap~FrameState}
 */
oli.MapEvent.prototype.frameState;


/**
 * @interface
 */
oli.SelectEvent = function() {};


/**
 * @type {Array.<module:ol/Feature~Feature>}
 */
oli.SelectEvent.prototype.deselected;


/**
 * @type {Array.<module:ol/Feature~Feature>}
 */
oli.SelectEvent.prototype.selected;


/**
 * @type {module:ol/MapBrowserEvent~MapBrowserEvent}
 */
oli.SelectEvent.prototype.mapBrowserEvent;


/**
 * @type {Object}
 */
oli.control;


/**
 * @interface
 */
oli.control.Control = function() {};


/**
 * @param {ol.PluggableMap} map Map.
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
 * @type {Array.<module:ol/Feature~Feature>|undefined}
 */
oli.interaction.DragAndDropEvent.prototype.features;


/**
 * @type {module:ol/proj/Projection~Projection|undefined}
 */
oli.interaction.DragAndDropEvent.prototype.projection;


/**
 * @type {File}
 */
oli.interaction.DragAndDropEvent.prototype.file;


/**
 * @interface
 */
oli.interaction.TranslateEvent = function() {};


/**
 * @type {ol.Collection.<module:ol/Feature~Feature>}
 */
oli.interaction.TranslateEvent.prototype.features;


/**
 * @type {ol.Coordinate}
 */
oli.interaction.TranslateEvent.prototype.coordinate;


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
 * @type {module:ol/PluggableMap~FrameState|undefined}
 */
oli.render.Event.prototype.frameState;


/**
 * @type {ol.webgl.Context|null|undefined}
 */
oli.render.Event.prototype.glContext;


/**
 * @type {ol.render.VectorContext|undefined}
 */
oli.render.Event.prototype.vectorContext;


/**
 * @type {Object}
 */
oli.source;


/**
 * @interface
 */
oli.source.ImageEvent = function() {};


/**
 * @type {ol.Image}
 */
oli.source.ImageEvent.prototype.image;


/**
 * @interface
 */
oli.source.RasterEvent = function() {};


/**
 * @type {ol.Extent}
 */
oli.source.RasterEvent.prototype.extent;


/**
 * @type {number}
 */
oli.source.RasterEvent.prototype.resolution;


/**
 * @type {Object}
 */
oli.source.RasterEvent.prototype.data;


/**
 * @interface
 */
oli.source.Tile.Event = function() {};


/**
 * @type {ol.Tile}
 */
oli.source.Tile.Event.prototype.tile;


/**
 * @interface
 */
oli.source.Vector.Event = function() {};


/**
 * @type {module:ol/Feature~Feature|undefined}
 */
oli.source.Vector.Event.prototype.feature;
