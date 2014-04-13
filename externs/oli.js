/**
 * @externs
 */


/**
 * @type {Object}
 */
var oli;



/** @interface */
oli.CollectionEvent;


/** @type {*} */
oli.CollectionEvent.prototype.element;



/** @interface */
oli.DragBoxEvent;


/** @type {ol.Coordinate} */
oli.DragBoxEvent.prototype.coordinate;



/** @interface */
oli.DrawEvent;


/** @type {ol.Feature} */
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
 * @todo stability experimental
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
 * @todo stability experimental
 */
oli.FrameState.prototype.time;


/** @type {Object.<string, Object.<string, ol.TileRange>>} */
oli.FrameState.prototype.usedTiles;


/**
 * @type {oli.View2DState}
 * @todo stability experimental
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


/** @type {ol.Coordinate} */
oli.MapBrowserEvent.prototype.coordinate;


/** @type {Event} */
oli.MapBrowserEvent.prototype.originalEvent;


/** @type {ol.Pixel} */
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


/** @type {Array.<ol.Feature>} */
oli.interaction.DragAndDropEvent.prototype.features;


/** @type {ol.proj.Projection} */
oli.interaction.DragAndDropEvent.prototype.projection;


/** @type {File} */
oli.interaction.DragAndDropEvent.prototype.file;


/** @interface */
oli.render.Event;


/** @type {CanvasRenderingContext2D|null|undefined} */
oli.render.Event.prototype.context;


/** @type {oli.FrameState|undefined} */
oli.render.Event.prototype.frameState;


/** @type {ol.webgl.Context|null|undefined} */
oli.render.Event.prototype.glContext;


/** @type {ol.render.IVectorContext|undefined} */
oli.render.Event.prototype.vectorContext;



/** @interface */
oli.source.VectorEvent;


/** @type {ol.Feature} */
oli.source.VectorEvent.prototype.feature;
