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
 * @type {ol.MapBrowserEvent}
 */
oli.DragBoxEvent.prototype.mapBrowserEvent;


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
oli.ModifyEvent = function() {};


/**
 * @type {ol.Collection.<ol.Feature>}
 */
oli.ModifyEvent.prototype.features;


/**
 * @type {ol.MapBrowserEvent}
 */
oli.ModifyEvent.prototype.mapBrowserEvent;


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
 * @type {boolean}
 */
oli.MapBrowserEvent.prototype.dragging;


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
 * @interface
 */
oli.SelectEvent = function() {};


/**
 * @type {Array.<ol.Feature>}
 */
oli.SelectEvent.prototype.deselected;


/**
 * @type {Array.<ol.Feature>}
 */
oli.SelectEvent.prototype.selected;


/**
 * @type {ol.MapBrowserEvent}
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
 * @interface
 */
oli.interaction.TranslateEvent = function() {};


/**
 * @type {ol.Collection.<ol.Feature>}
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
 * @type {olx.FrameState|undefined}
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
oli.source.TileEvent = function() {};


/**
 * @type {ol.Tile}
 */
oli.source.TileEvent.prototype.tile;


/**
 * @interface
 */
oli.source.VectorEvent = function() {};


/**
 * @type {ol.Feature|undefined}
 */
oli.source.VectorEvent.prototype.feature;
