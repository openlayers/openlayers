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
oli.FrameState;


/** @type {boolean} */
oli.FrameState.prototype.animate;


/** @type {Object.<string, ol.Attribution>} */
oli.FrameState.prototype.attributions;


/** @type {goog.vec.Mat4.Number} */
oli.FrameState.prototype.coordinateToPixelMatrix;


/** @type {(null|ol.Extent)} */
oli.FrameState.prototype.extent;


/** @type {ol.Coordinate} */
oli.FrameState.prototype.focus;


/** @type {number} */
oli.FrameState.prototype.index;


/** @type {Object.<number, ol.layer.LayerState>} */
oli.FrameState.prototype.layerStates;


/** @type {Array.<ol.layer.LayerState>} */
oli.FrameState.prototype.layerStatesArray;


/** @type {Object.<string, string>} */
oli.FrameState.prototype.logos;


/**
 * @type {number}
 * @todo api
 */
oli.FrameState.prototype.pixelRatio;


/** @type {goog.vec.Mat4.Number} */
oli.FrameState.prototype.pixelToCoordinateMatrix;


/** @type {Array.<ol.PostRenderFunction>} */
oli.FrameState.prototype.postRenderFunctions;


/** @type {ol.Size} */
oli.FrameState.prototype.size;


/** @type {Object.<string, boolean>} */
oli.FrameState.prototype.skippedFeatureUids_;


/** @type {ol.TileQueue} */
oli.FrameState.prototype.tileQueue;


/**
 * @type {number}
 * @todo api
 */
oli.FrameState.prototype.time;


/** @type {Object.<string, Object.<string, ol.TileRange>>} */
oli.FrameState.prototype.usedTiles;


/**
 * @type {oli.View2DState}
 * @todo api
 */
oli.FrameState.prototype.view2DState;


/** @type {Array.<number>} */
oli.FrameState.prototype.viewHints;


/** @type {Object.<string, Object.<string, boolean>>} */
oli.FrameState.prototype.wantedTiles;



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



/** @interface */
oli.View2DState;


/** @type {ol.Coordinate} */
oli.View2DState.prototype.center;


/** @type {ol.proj.Projection} */
oli.View2DState.prototype.projection;


/** @type {number} */
oli.View2DState.prototype.resolution;


/** @type {number} */
oli.View2DState.prototype.rotation;



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
 * @type {oli.FrameState|undefined}
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
