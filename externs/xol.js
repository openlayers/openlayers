
/**
 * @typedef {Object} interaction_ExtentOptions
 * @property {ol.Extent|undefined} extent Initial extent. Defaults to no initial extent
 * @property {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined} boxStyle Style for the drawn extent box.
 * Defaults to ol.style.Style.createDefaultEditing()[module:ol/geom/GeometryType~GeometryType.POLYGON]
 * @property {number|undefined} pixelTolerance Pixel tolerance for considering the pointer close enough to a segment or
 * vertex for editing. Default is `10`.
 * @property {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined} pointerStyle Style for the cursor used to draw the extent.
 * Defaults to ol.style.Style.createDefaultEditing()[module:ol/geom/GeometryType~GeometryType.POINT]
 * @property {boolean|undefined} wrapX Wrap the drawn extent across multiple maps in the X direction?
 * Only affects visuals, not functionality. Defaults to false.
 */


/**
 * @typedef {Object} interaction_TranslateOptions
 * @property {ol.Collection.<module:ol/Feature~Feature>|undefined} features Only features contained in this collection will be able to be translated. If
 * not specified, all features on the map will be able to be translated.
 * @property {undefined|Array.<ol.layer.Layer>|function(ol.layer.Layer): boolean} layers A list of layers from which features should be
 * translated. Alternatively, a filter function can be provided. The
 * function will be called for each layer in the map and should return
 * `true` for layers that you want to be translatable. If the option is
 * absent, all visible layers will be considered translatable.
 * @property {number|undefined} hitTolerance Hit-detection tolerance. Pixels inside the radius around the given position
 * will be checked for features. This only works for the canvas renderer and
 * not for WebGL. Default is `0`.
 */


/**
 * @typedef {Object} interaction_KeyboardPanOptions
 * @property {ol.EventsConditionType|undefined} condition A function that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * Default is {@link ol.events.condition.noModifierKeys} and
 * {@link ol.events.condition.targetNotEditable}.
 * @property {number|undefined} duration Animation duration in milliseconds. Default is `100`.
 * @property {number|undefined} pixelDelta Pixel The amount to pan on each key press. Default is `128` pixels.
 */


/**
 * @typedef {Object} interaction_KeyboardZoomOptions
 * @property {number|undefined} duration Animation duration in milliseconds. Default is `100`.
 * @property {ol.EventsConditionType|undefined} condition A function that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * Default is {@link ol.events.condition.targetNotEditable}.
 * @property {number|undefined} delta The amount to zoom on each key press. Default is `1`.
 */


/**
 * @typedef {Object} interaction_ModifyOptions
 * @property {ol.EventsConditionType|undefined} condition A function that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a boolean
 * to indicate whether that event will be considered to add or move a vertex
 * to the sketch.
 * Default is {@link ol.events.condition.primaryAction}.
 * @property {ol.EventsConditionType|undefined} deleteCondition A function that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * By default, {@link ol.events.condition.singleClick} with
 * {@link ol.events.condition.altKeyOnly} results in a vertex deletion.
 * @property {ol.EventsConditionType|undefined} insertVertexCondition A function that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a boolean
 * to indicate whether a new vertex can be added to the sketch features.
 * Default is {@link ol.events.condition.always}
 * @property {number|undefined} pixelTolerance Pixel tolerance for considering the pointer close enough to a segment or
 * vertex for editing. Default is `10`.
 * @property {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined} style Style used for the features being modified. By default the default edit
 * style is used (see {@link ol.style}).
 * @property {ol.source.Vector|undefined} source The vector source with features to modify.  If a vector source is not
 * provided, a feature collection must be provided with the features option.
 * @property {ol.Collection.<module:ol/Feature~Feature>|undefined} features The features the interaction works on.  If a feature collection is not
 * provided, a vector source must be provided with the source option.
 * @property {boolean|undefined} wrapX Wrap the world horizontally on the sketch overlay. Default is `false`.
 */


/**
 * @typedef {Object} interaction_MouseWheelZoomOptions
 * @property {ol.EventsConditionType|undefined} condition A function that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled. Default is {@link ol.events.condition.always}.
 * @property {number|undefined} duration Animation duration in milliseconds. Default is `250`.
 * @property {number|undefined} timeout Mouse wheel timeout duration in milliseconds. Default is `80`.
 * @property {boolean|undefined} constrainResolution When using a trackpad or magic mouse, zoom to the closest integer zoom level
 * after the scroll gesture ends.
 * Default is `false`.
 * @property {boolean|undefined} useAnchor Enable zooming using the mouse's location as the anchor. Default is `true`.
 * When set to false, zooming in and out will zoom to the center of the screen
 * instead of zooming on the mouse's location.
 */


/**
 * @typedef {Object} interaction_PinchRotateOptions
 * @property {number|undefined} duration The duration of the animation in milliseconds. Default is `250`.
 * @property {number|undefined} threshold Minimal angle in radians to start a rotation. Default is `0.3`.
 */


/**
 * @typedef {Object} interaction_PinchZoomOptions
 * @property {number|undefined} duration Animation duration in milliseconds. Default is `400`.
 * @property {boolean|undefined} constrainResolution Zoom to the closest integer zoom level after the pinch gesture ends. Default is `false`.
 */


/**
 * @typedef {Object} interaction_PointerOptions
 * @property {(function(ol.MapBrowserPointerEvent):boolean|undefined)} handleDownEvent Function handling "down" events. If the function returns `true` then a drag
 * sequence is started.
 * @property {(function(ol.MapBrowserPointerEvent)|undefined)} handleDragEvent Function handling "drag" events. This function is called on "move" events
 * during a drag sequence.
 * @property {(function(module:ol/MapBrowserEvent~MapBrowserEvent):boolean|undefined)} handleEvent Method called by the map to notify the interaction that a browser event was
 * dispatched to the map. The function may return `false` to prevent the
 * propagation of the event to other interactions in the map's interactions
 * chain.
 * @property {(function(ol.MapBrowserPointerEvent)|undefined)} handleMoveEvent Function handling "move" events. This function is called on "move" events,
 * also during a drag sequence (so during a drag sequence both the
 * `handleDragEvent` function and this function are called).
 * @property {(function(ol.MapBrowserPointerEvent):boolean|undefined)} handleUpEvent Function handling "up" events. If the function returns `false` then the
 * current drag sequence is stopped.
 */


/**
 * @typedef {Object} interaction_SelectOptions
 * @property {ol.EventsConditionType|undefined} addCondition A function that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * By default, this is {@link ol.events.condition.never}. Use this if you want
 * to use different events for add and remove instead of `toggle`.
 * @property {ol.EventsConditionType|undefined} condition A function that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * This is the event for the selected features as a whole. By default, this is
 * {@link ol.events.condition.singleClick}. Clicking on a feature selects that
 * feature and removes any that were in the selection. Clicking outside any
 * feature removes all from the selection.
 * See `toggle`, `add`, `remove` options for adding/removing extra features to/
 * from the selection.
 * @property {undefined|Array.<ol.layer.Layer>|function(ol.layer.Layer): boolean} layers A list of layers from which features should be
 * selected. Alternatively, a filter function can be provided. The
 * function will be called for each layer in the map and should return
 * `true` for layers that you want to be selectable. If the option is
 * absent, all visible layers will be considered selectable.
 * @property {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined} style Style for the selected features. By default the default edit style is used
 * (see {@link ol.style}).
 * @property {ol.EventsConditionType|undefined} removeCondition A function that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * By default, this is {@link ol.events.condition.never}. Use this if you want
 * to use different events for add and remove instead of `toggle`.
 * @property {ol.EventsConditionType|undefined} toggleCondition A function that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * This is in addition to the `condition` event. By default,
 * {@link ol.events.condition.shiftKeyOnly}, i.e. pressing `shift` as well as
 * the `condition` event, adds that feature to the current selection if it is
 * not currently selected, and removes it if it is.
 * See `add` and `remove` if you want to use different events instead of a
 * toggle.
 * @property {boolean|undefined} multi A boolean that determines if the default behaviour should select only
 * single features or all (overlapping) features at the clicked map
 * position. Default is false i.e single select
 * @property {ol.Collection.<module:ol/Feature~Feature>|undefined} features Collection where the interaction will place selected features. Optional. If
 * not set the interaction will create a collection. In any case the collection
 * used by the interaction is returned by
 * {@link ol.interaction.Select#getFeatures}.
 * @property {ol.SelectFilterFunction|undefined} filter A function that takes an {@link module:ol/Feature~Feature} and an {@link ol.layer.Layer} and
 * returns `true` if the feature may be selected or `false` otherwise.
 * @property {boolean|undefined} wrapX Wrap the world horizontally on the selection overlay. Default is `true`.
 * @property {number|undefined} hitTolerance Hit-detection tolerance. Pixels inside the radius around the given position
 * will be checked for features. This only works for the canvas renderer and
 * not for WebGL. Default is `0`.
 */


/**
 * @typedef {Object} interaction_SnapOptions
 * @property {ol.Collection.<module:ol/Feature~Feature>|undefined} features Snap to these features. Either this option or source should be provided.
 * @property {boolean|undefined} edge Snap to edges. Default is `true`.
 * @property {boolean|undefined} vertex Snap to vertices. Default is `true`.
 * @property {number|undefined} pixelTolerance Pixel tolerance for considering the pointer close enough to a segment or
 * vertex for snapping. Default is `10` pixels.
 * @property {ol.source.Vector|undefined} source Snap to features from this source. Either this option or features should be provided
 */


/**
 * @typedef {Object} layer_BaseOptions
 * @property {number|undefined} opacity Opacity (0, 1). Default is `1`.
 * @property {boolean|undefined} visible Visibility. Default is `true`.
 * @property {ol.Extent|undefined} extent The bounding extent for layer rendering.  The layer will not be rendered
 * outside of this extent.
 * @property {number|undefined} zIndex The z-index for layer rendering.  At rendering time, the layers will be
 * ordered, first by Z-index and then by position. The default Z-index is 0.
 * @property {number|undefined} minResolution The minimum resolution (inclusive) at which this layer will be visible.
 * @property {number|undefined} maxResolution The maximum resolution (exclusive) below which this layer will be visible.
 */


/**
 * @typedef {Object} layer_LayerOptions
 * @property {number|undefined} opacity Opacity (0, 1). Default is `1`.
 * @property {ol.source.Source|undefined} source Source for this layer.  If not provided to the constructor, the source can
 * be set by calling {@link ol.layer.Layer#setSource layer.setSource(source)}
 * after construction.
 * @property {boolean|undefined} visible Visibility. Default is `true` (visible).
 * @property {ol.Extent|undefined} extent The bounding extent for layer rendering.  The layer will not be rendered
 * outside of this extent.
 * @property {number|undefined} zIndex The z-index for layer rendering.  At rendering time, the layers will be
 * ordered, first by Z-index and then by position. The default Z-index is 0.
 * @property {number|undefined} minResolution The minimum resolution (inclusive) at which this layer will be visible.
 * @property {number|undefined} maxResolution The maximum resolution (exclusive) below which this layer will be visible.
 */


/**
 * @typedef {Object} layer_GroupOptions
 * @property {number|undefined} opacity Opacity (0, 1). Default is `1`.
 * @property {boolean|undefined} visible Visibility. Default is `true`.
 * @property {ol.Extent|undefined} extent The bounding extent for layer rendering.  The layer will not be rendered
 * outside of this extent.
 * @property {number|undefined} zIndex The z-index for layer rendering.  At rendering time, the layers will be
 * ordered, first by Z-index and then by position. The default Z-index is 0.
 * @property {number|undefined} minResolution The minimum resolution (inclusive) at which this layer will be visible.
 * @property {number|undefined} maxResolution The maximum resolution (exclusive) below which this layer will be visible.
 * @property {Array.<ol.layer.Base>|ol.Collection.<ol.layer.Base>|undefined} layers Child layers.
 */


/**
 * @typedef {Object} layer_HeatmapOptions
 * @property {Array.<string>|undefined} gradient The color gradient of the heatmap, specified as an array of CSS color
 * strings. Default is `['#00f', '#0ff', '#0f0', '#ff0', '#f00']`.
 * @property {number|undefined} radius Radius size in pixels. Default is `8`.
 * @property {number|undefined} blur Blur size in pixels. Default is `15`.
 * @property {number|undefined} shadow Shadow size in pixels. Default is `250`.
 * @property {string|function(module:ol/Feature~Feature):number|undefined} weight The feature attribute to use for the weight or a function that returns a
 * weight from a feature. Weight values should range from 0 to 1 (and values
 * outside will be clamped to that range). Default is `weight`.
 * @property {ol.Extent|undefined} extent The bounding extent for layer rendering.  The layer will not be rendered
 * outside of this extent.
 * @property {number|undefined} minResolution The minimum resolution (inclusive) at which this layer will be visible.
 * @property {number|undefined} maxResolution The maximum resolution (exclusive) below which this layer will be visible.
 * @property {number|undefined} opacity Opacity. 0-1. Default is `1`.
 * @property {ol.source.Vector} source Source.
 * @property {boolean|undefined} visible Visibility. Default is `true` (visible).
 * @property {number|undefined} zIndex The z-index for layer rendering.  At rendering time, the layers will be
 * ordered, first by Z-index and then by position. The default Z-index is 0.
 */


/**
 * @typedef {Object} layer_ImageOptions
 * @property {number|undefined} opacity Opacity (0, 1). Default is `1`.
 * @property {ol.source.Image} source Source for this layer.
 * @property {ol.PluggableMap|undefined} map Sets the layer as overlay on a map. The map will not manage this layer in its
 * layers collection, and the layer will be rendered on top. This is useful for
 * temporary layers. The standard way to add a layer to a map and have it
 * managed by the map is to use {@link ol.Map#addLayer}.
 * @property {boolean|undefined} visible Visibility. Default is `true` (visible).
 * @property {ol.Extent|undefined} extent The bounding extent for layer rendering.  The layer will not be rendered
 * outside of this extent.
 * @property {number|undefined} minResolution The minimum resolution (inclusive) at which this layer will be visible.
 * @property {number|undefined} maxResolution The maximum resolution (exclusive) below which this layer will be visible.
 * @property {number|undefined} zIndex The z-index for layer rendering.  At rendering time, the layers will be
 * ordered, first by Z-index and then by position. The default Z-index is 0.
 */


/**
 * @typedef {Object} layer_TileOptions
 * @property {number|undefined} opacity Opacity (0, 1). Default is `1`.
 * @property {number|undefined} preload Preload. Load low-resolution tiles up to `preload` levels. By default
 * `preload` is `0`, which means no preloading.
 * @property {ol.source.Tile} source Source for this layer.
 * @property {ol.PluggableMap|undefined} map Sets the layer as overlay on a map. The map will not manage this layer in its
 * layers collection, and the layer will be rendered on top. This is useful for
 * temporary layers. The standard way to add a layer to a map and have it
 * managed by the map is to use {@link ol.Map#addLayer}.
 * @property {boolean|undefined} visible Visibility. Default is `true` (visible).
 * @property {ol.Extent|undefined} extent The bounding extent for layer rendering.  The layer will not be rendered
 * outside of this extent.
 * @property {number|undefined} minResolution The minimum resolution (inclusive) at which this layer will be visible.
 * @property {number|undefined} maxResolution The maximum resolution (exclusive) below which this layer will be visible.
 * @property {boolean|undefined} useInterimTilesOnError Use interim tiles on error. Default is `true`.
 * @property {number|undefined} zIndex The z-index for layer rendering.  At rendering time, the layers will be
 * ordered, first by Z-index and then by position. The default Z-index is 0.
 */


/**
 * @typedef {Object} layer_VectorOptions
 * @property {ol.layer.VectorRenderType|string|undefined} renderMode Render mode for vector layers:
 *  * `'image'`: Vector layers are rendered as images. Great performance, but
 *    point symbols and texts are always rotated with the view and pixels are
 *    scaled during zoom animations.
 *  * `'vector'`: Vector layers are rendered as vectors. Most accurate rendering
 *    even during animations, but slower performance.
 * Default is `vector`.
 * @property {ol.RenderOrderFunction|null|undefined} renderOrder Render order. Function to be used when sorting features before rendering. By
 * default features are drawn in the order that they are created. Use `null` to
 * avoid the sort, but get an undefined draw order.
 * @property {ol.PluggableMap|undefined} map Sets the layer as overlay on a map. The map will not manage this layer in its
 * layers collection, and the layer will be rendered on top. This is useful for
 * temporary layers. The standard way to add a layer to a map and have it
 * managed by the map is to use {@link ol.Map#addLayer}.
 * @property {ol.Extent|undefined} extent The bounding extent for layer rendering.  The layer will not be rendered
 * outside of this extent.
 * @property {number|undefined} minResolution The minimum resolution (inclusive) at which this layer will be visible.
 * @property {number|undefined} maxResolution The maximum resolution (exclusive) below which this layer will be visible.
 * @property {number|undefined} opacity Opacity. 0-1. Default is `1`.
 * @property {number|undefined} renderBuffer The buffer around the viewport extent used by the renderer when getting
 * features from the vector source for the rendering or hit-detection.
 * Recommended value: the size of the largest symbol, line width or label.
 * Default is 100 pixels.
 * @property {ol.source.Vector} source Source.
 * @property {boolean|undefined} declutter Declutter images and text. Decluttering is applied to all image and text
 * styles, and the priority is defined by the z-index of the style. Lower
 * z-index means higher priority. Default is `false`.
 * @property {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined} style Layer style. See {@link ol.style} for default style which will be used if
 * this is not defined.
 * @property {number|undefined} maxTilesLoading Maximum number tiles to load simultaneously.  Default is `16`.
 * @property {boolean|undefined} updateWhileAnimating When set to `true`, feature batches will be recreated during animations.
 * This means that no vectors will be shown clipped, but the setting will have a
 * performance impact for large amounts of vector data. When set to `false`,
 * batches will be recreated when no animation is active.  Default is `false`.
 * @property {boolean|undefined} updateWhileInteracting When set to `true`, feature batches will be recreated during interactions.
 * See also `updateWhileAnimating`. Default is `false`.
 * @property {boolean|undefined} visible Visibility. Default is `true` (visible).
 * @property {number|undefined} zIndex The z-index for layer rendering.  At rendering time, the layers will be
 * ordered, first by Z-index and then by position. The default Z-index is 0.
 */


/**
 * @typedef {Object} layer_VectorTileOptions
 * @property {number|undefined} renderBuffer The buffer around the tile extent used by the renderer when getting features
 * from the vector tile for the rendering or hit-detection.
 * Recommended value: Vector tiles are usually generated with a buffer, so this
 * value should match the largest possible buffer of the used tiles. It should
 * be at least the size of the largest point symbol or line width.
 * Default is 100 pixels.
 * @property {ol.layer.VectorTileRenderType|string|undefined} renderMode Render mode for vector tiles:
 *  * `'image'`: Vector tiles are rendered as images. Great performance, but
 *    point symbols and texts are always rotated with the view and pixels are
 *    scaled during zoom animations.
 *  * `'hybrid'`: Polygon and line elements are rendered as images, so pixels
 *    are scaled during zoom animations. Point symbols and texts are accurately
 *    rendered as vectors and can stay upright on rotated views.
 *  * `'vector'`: Vector tiles are rendered as vectors. Most accurate rendering
 *    even during animations, but slower performance than the other options.
 *
 * When `declutter` is set to `true`, `'hybrid'` will be used instead of
 * `'image'`. The default is `'hybrid'`.
 * @property {ol.RenderOrderFunction|undefined} renderOrder Render order. Function to be used when sorting features before rendering. By
 * default features are drawn in the order that they are created.
 * @property {ol.PluggableMap|undefined} map Sets the layer as overlay on a map. The map will not manage this layer in its
 * layers collection, and the layer will be rendered on top. This is useful for
 * temporary layers. The standard way to add a layer to a map and have it
 * managed by the map is to use {@link ol.Map#addLayer}.
 * @property {ol.Extent|undefined} extent The bounding extent for layer rendering.  The layer will not be rendered
 * outside of this extent.
 * @property {number|undefined} minResolution The minimum resolution (inclusive) at which this layer will be visible.
 * @property {number|undefined} maxResolution The maximum resolution (exclusive) below which this layer will be visible.
 * @property {number|undefined} opacity Opacity. 0-1. Default is `1`.
 * @property {number|undefined} preload Preload. Load low-resolution tiles up to `preload` levels. By default
 * `preload` is `0`, which means no preloading.
 * @property {ol.source.VectorTile|undefined} source Source.
 * @property {boolean|undefined} declutter Declutter images and text. Decluttering is applied to all image and text
 * styles, and the priority is defined by the z-index of the style. Lower
 * z-index means higher priority. When set to `true`, a `renderMode` of
 * `'image'` will be overridden with `'hybrid'`. Default is `false`.
 * @property {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined} style Layer style. See {@link ol.style} for default style which will be used if
 * this is not defined.
 * @property {boolean|undefined} updateWhileAnimating When set to `true`, feature batches will be recreated during animations.
 * This means that no vectors will be shown clipped, but the setting will have a
 * performance impact for large amounts of vector data. When set to `false`,
 * batches will be recreated when no animation is active.  Default is `false`.
 * @property {boolean|undefined} updateWhileInteracting When set to `true`, feature batches will be recreated during interactions.
 * See also `updateWhileAnimating`. Default is `false`.
 * @property {boolean|undefined} visible Visibility. Default is `true` (visible).
 * @property {number|undefined} zIndex The z-index for layer rendering.  At rendering time, the layers will be
 * ordered, first by Z-index and then by position. The default Z-index is 0.
 */


/**
 * @typedef {Object} render_State
 * @property {CanvasRenderingContext2D} context Canvas context that the layer is being rendered to.
 * @property {number} pixelRatio Pixel ratio used by the layer renderer.
 * @property {number} resolution Resolution that the render batch was created and optimized for. This is
 * not the view's resolution that is being rendered.
 * @property {number} rotation Rotation of the rendered layer in radians.
 */


/**
 * @typedef {Object} source_BingMapsOptions
 * @property {number|undefined} cacheSize Cache size. Default is `2048`.
 * @property {boolean|undefined} hidpi If `true` hidpi tiles will be requested. Default is `false`.
 * @property {string|undefined} culture Culture code. Default is `en-us`.
 * @property {string} key Bing Maps API key. Get yours at http://www.bingmapsportal.com/.
 * @property {string} imagerySet Type of imagery.
 * @property {number|undefined} maxZoom Max zoom. Default is what's advertized by the BingMaps service (`21`
 * currently).
 * @property {number|undefined} reprojectionErrorThreshold Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * @property {ol.TileLoadFunctionType|undefined} tileLoadFunction Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * @property {boolean|undefined} wrapX Whether to wrap the world horizontally. Default is `true`.
 * @property {number|undefined} transition Duration of the opacity transition for rendering.  To disable the opacity
 * transition, pass `transition: 0`.
 */


/**
 * @typedef {Object} source_ClusterOptions
 * @property {ol.AttributionLike|undefined} attributions Attributions.
 * @property {number|undefined} distance Minimum distance in pixels between clusters. Default is `20`.
 * @property {ol.Extent|undefined} extent Extent.
 * @property {undefined|function(module:ol/Feature~Feature):module:ol/geom/Point~Point} geometryFunction Function that takes an {@link module:ol/Feature~Feature} as argument and returns an
 * {@link module:ol/geom/Point~Point} as cluster calculation point for the feature. When a
 * feature should not be considered for clustering, the function should return
 * `null`. The default, which works when the underyling source contains point
 * features only, is
 * ```js
 * function(feature) {
 *   return feature.getGeometry();
 * }
 * ```
 * See {@link module:ol/geom/Polygon~Polygon#getInteriorPoint} for a way to get a cluster
 * calculation point for polygons.
 * @property {ol.format.Feature|undefined} format Format.
 * @property {ol.ProjectionLike} projection Projection.
 * @property {ol.source.Vector} source Source.
 * @property {boolean|undefined} wrapX WrapX. Default is true
 */


/**
 * @typedef {Object} source_TileUTFGridOptions
 * @property {boolean|undefined} jsonp Use JSONP with callback to load the TileJSON. Useful when the server
 * does not support CORS. Default is `false`.
 * @property {boolean|undefined} preemptive If `true` the TileUTFGrid source loads the tiles based on their "visibility".
 * This improves the speed of response, but increases traffic.
 * Note that if set to `false`, you need to pass `true` as `opt_request`
 * to the `forDataAtCoordinateAndResolution` method otherwise no data
 * will ever be loaded.
 * Default is `true`.
 * @property {TileJSON|undefined} tileJSON TileJSON configuration for this source. If not provided, `url` must be
 * configured.
 * @property {string|undefined} url TileJSON endpoint that provides the configuration for this source. Request
 * will be made through JSONP. If not provided, `tileJSON` must be configured.
 */


/**
 * @typedef {Object} source_TileImageOptions
 * @property {ol.AttributionLike|undefined} attributions Attributions.
 * @property {number|undefined} cacheSize Cache size. Default is `2048`.
 * @property {null|string|undefined} crossOrigin The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @property {boolean|undefined} opaque Whether the layer is opaque.
 * @property {ol.ProjectionLike} projection Projection.
 * @property {number|undefined} reprojectionErrorThreshold Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * @property {ol.source.State|undefined} state Source state.
 * @property {function(new: ol.ImageTile, ol.TileCoord,                ol.TileState, string, ?string,
                ol.TileLoadFunctionType)|undefined}
 tileClass Class used to instantiate image tiles. Default is {@link ol.ImageTile}.
 * @property {ol.tilegrid.TileGrid|undefined} tileGrid Tile grid.
 * @property {ol.TileLoadFunctionType|undefined} tileLoadFunction Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * @property {number|undefined} tilePixelRatio The pixel ratio used by the tile service. For example, if the tile
 * service advertizes 256px by 256px tiles but actually sends 512px
 * by 512px images (for retina/hidpi devices) then `tilePixelRatio`
 * should be set to `2`. Default is `1`.
 * @property {ol.TileUrlFunctionType|undefined} tileUrlFunction Optional function to get tile URL given a tile coordinate and the projection.
 * @property {string|undefined} url URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 * A `{?-?}` template pattern, for example `subdomain{a-f}.domain.com`, may be
 * used instead of defining each one separately in the `urls` option.
 * @property {Array.<string>|undefined} urls An array of URL templates.
 * @property {boolean|undefined} wrapX Whether to wrap the world horizontally. The default, `undefined`, is to
 * request out-of-bounds tiles from the server. When set to `false`, only one
 * world will be rendered. When set to `true`, tiles will be requested for one
 * world only, but they will be wrapped horizontally to render multiple worlds.
 * @property {number|undefined} transition Duration of the opacity transition for rendering.  To disable the opacity
 * transition, pass `transition: 0`.
 */


/**
 * @typedef {Object} source_VectorTileOptions
 * @property {ol.AttributionLike|undefined} attributions Attributions.
 * @property {number|undefined} cacheSize Cache size. Default is `128`.
 * @property {ol.format.Feature|undefined} format Feature format for tiles. Used and required by the default
 * `tileLoadFunction`.
 * @property {boolean|undefined} overlaps This source may have overlapping geometries. Default is `true`. Setting this
 * to `false` (e.g. for sources with polygons that represent administrative
 * boundaries or TopoJSON sources) allows the renderer to optimise fill and
 * stroke operations.
 * @property {ol.ProjectionLike} projection Projection.
 * @property {ol.source.State|undefined} state Source state.
 * @property {function(new: ol.VectorTile, ol.TileCoord,                ol.TileState, string, ol.format.Feature,
                ol.TileLoadFunctionType)|undefined}
 tileClass Class used to instantiate vector tiles. Default is {@link ol.VectorTile}.
 * @property {ol.tilegrid.TileGrid|undefined} tileGrid Tile grid.
 * @property {ol.TileLoadFunctionType|undefined} tileLoadFunction Optional function to load a tile given a URL. Could look like this:
 * ```js
 * function(tile, url) {
 *   tile.setLoader(function() {
 *     var data = // ... fetch data
 *     var format = tile.getFormat();
 *     tile.setFeatures(format.readFeatures(data, {
 *       // uncomment the line below for ol.format.MVT only
 *       extent: tile.getExtent(),
 *       featureProjection: map.getView().getProjection()
 *     }));
 *   };
 * });
 * ```
 * @property {ol.TileUrlFunctionType|undefined} tileUrlFunction Optional function to get tile URL given a tile coordinate and the projection.
 * @property {string|undefined} url URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 * A `{?-?}` template pattern, for example `subdomain{a-f}.domain.com`, may be
 * used instead of defining each one separately in the `urls` option.
 * @property {Array.<string>|undefined} urls An array of URL templates.
 * @property {boolean|undefined} wrapX Whether to wrap the world horizontally. When set to `false`, only one world
 * will be rendered. When set to `true`, tiles will be wrapped horizontally to
 * render multiple worlds. Default is `true`.
 * @property {number|undefined} transition Duration of the opacity transition for rendering.  To disable the opacity
 * transition, pass `transition: 0`.
 */


/**
 * @typedef {Object} source_ImageMapGuideOptions
 * @property {string|undefined} url The mapagent url.
 * @property {number|undefined} displayDpi The display resolution. Default is `96`.
 * @property {number|undefined} metersPerUnit The meters-per-unit value. Default is `1`.
 * @property {boolean|undefined} hidpi Use the `ol.Map#pixelRatio` value when requesting the image from the remote
 * server. Default is `true`.
 * @property {boolean|undefined} useOverlay If `true`, will use `GETDYNAMICMAPOVERLAYIMAGE`.
 * @property {ol.ProjectionLike} projection Projection.
 * @property {number|undefined} ratio Ratio. `1` means image requests are the size of the map viewport, `2` means
 * twice the width and height of the map viewport, and so on. Must be `1` or
 * higher. Default is `1`.
 * @property {Array.<number>|undefined} resolutions Resolutions. If specified, requests will be made for these resolutions only.
 * @property {ol.ImageLoadFunctionType|undefined} imageLoadFunction Optional function to load an image given a URL.
 * @property {Object|undefined} params Additional parameters.
 */


/**
 * @typedef {Object} source_MapQuestOptions
 * @property {number|undefined} cacheSize Cache size. Default is `2048`.
 * @property {string} layer Layer. Possible values are `osm`, `sat`, and `hyb`.
 * @property {number|undefined} reprojectionErrorThreshold Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * @property {ol.TileLoadFunctionType|undefined} tileLoadFunction Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * @property {string|undefined} url URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 */


/**
 * @typedef {Object} source_TileDebugOptions
 * @property {ol.ProjectionLike} projection Projection.
 * @property {ol.tilegrid.TileGrid|undefined} tileGrid Tile grid.
 * @property {boolean|undefined} wrapX Whether to wrap the world horizontally. Default is `true`.
 */


/**
 * @typedef {Object} source_OSMOptions
 * @property {ol.AttributionLike|undefined} attributions Attributions.
 * @property {number|undefined} cacheSize Cache size. Default is `2048`.
 * @property {null|string|undefined} crossOrigin The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 *
 * Default is `anonymous`.
 * @property {number|undefined} maxZoom Max zoom. Default is `19`.
 * @property {boolean|undefined} opaque Whether the layer is opaque. Default is `true`.
 * @property {number|undefined} reprojectionErrorThreshold Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * @property {ol.TileLoadFunctionType|undefined} tileLoadFunction Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * @property {string|undefined} url URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 * Default is `https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png`.
 * @property {boolean|undefined} wrapX Whether to wrap the world horizontally. Default is `true`.
 */


/**
 * @typedef {Object} source_ImageArcGISRestOptions
 * @property {ol.AttributionLike|undefined} attributions Attributions.
 * @property {null|string|undefined} crossOrigin The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @property {boolean|undefined} hidpi Use the `ol.Map#pixelRatio` value when requesting the image from the remote
 * server. Default is `true`.
 * @property {ol.ImageLoadFunctionType|undefined} imageLoadFunction Optional function to load an image given a URL.
 * @property {Object.<string,*>|undefined} params ArcGIS Rest parameters. This field is optional. Service defaults will be
 * used for any fields not specified. `FORMAT` is `PNG32` by default. `F` is `IMAGE` by
 * default. `TRANSPARENT` is `true` by default.  `BBOX, `SIZE`, `BBOXSR`,
 * and `IMAGESR` will be set dynamically. Set `LAYERS` to
 * override the default service layer visibility. See
 * {@link http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Export_Map/02r3000000v7000000/}
 * for further reference.
 * @property {ol.ProjectionLike} projection Projection.
 * @property {number|undefined} ratio Ratio. `1` means image requests are the size of the map viewport, `2` means
 * twice the size of the map viewport, and so on. Default is `1.5`.
 * @property {Array.<number>|undefined} resolutions Resolutions. If specified, requests will be made for these resolutions only.
 * @property {string|undefined} url ArcGIS Rest service URL for a Map Service or Image Service. The
 * url should include /MapServer or /ImageServer.
 */


/**
 * @typedef {Object} source_ImageCanvasOptions
 * @property {ol.AttributionLike|undefined} attributions Attributions.
 * @property {ol.CanvasFunctionType} canvasFunction Canvas function. The function returning the canvas element used by the source
 * as an image. The arguments passed to the function are: `{ol.Extent}` the
 * image extent, `{number}` the image resolution, `{number}` the device pixel
 * ratio, `{ol.Size}` the image size, and `{module:ol/proj/Projection~Projection}` the image
 * projection. The canvas returned by this function is cached by the source. If
 * the value returned by the function is later changed then
 * `dispatchChangeEvent` should be called on the source for the source to
 * invalidate the current cached image.
 * @property {ol.ProjectionLike} projection Projection.
 * @property {number|undefined} ratio Ratio. 1 means canvases are the size of the map viewport, 2 means twice the
 * width and height of the map viewport, and so on. Must be `1` or higher.
 * Default is `1.5`.
 * @property {Array.<number>|undefined} resolutions Resolutions. If specified, new canvases will be created for these resolutions
 * only.
 * @property {ol.source.State|undefined} state Source state.
 */


/**
 * @typedef {Object} source_RasterOptions
 * @property {Array.<ol.source.Source>} sources Input sources.
 * @property {ol.RasterOperation|undefined} operation Raster operation.  The operation will be called with data from input sources
 * and the output will be assigned to the raster source.
 * @property {Object|undefined} lib Functions that will be made available to operations run in a worker.
 * @property {number|undefined} threads By default, operations will be run in a single worker thread.  To avoid using
 * workers altogether, set `threads: 0`.  For pixel operations, operations can
 * be run in multiple worker threads.  Note that there is additional overhead in
 * transferring data to multiple workers, and that depending on the user's
 * system, it may not be possible to parallelize the work.
 * @property {ol.source.RasterOperationType|undefined} operationType Operation type.  Supported values are `'pixel'` and `'image'`.  By default,
 * `'pixel'` operations are assumed, and operations will be called with an
 * array of pixels from input sources.  If set to `'image'`, operations will
 * be called with an array of ImageData objects from input sources.
 */


/**
 * @typedef {Object} source_ImageWMSOptions
 * @property {ol.AttributionLike|undefined} attributions Attributions.
 * @property {null|string|undefined} crossOrigin The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @property {boolean|undefined} hidpi Use the `ol.Map#pixelRatio` value when requesting the image from the remote
 * server. Default is `true`.
 * @property {ol.source.WMSServerType|string|undefined} serverType The type of the remote WMS server: `mapserver`, `geoserver` or `qgis`. Only
 * needed if `hidpi` is `true`. Default is `undefined`.
 * @property {ol.ImageLoadFunctionType|undefined} imageLoadFunction Optional function to load an image given a URL.
 * @property {Object.<string,*>} params WMS request parameters. At least a `LAYERS` param is required. `STYLES` is
 * `''` by default. `VERSION` is `1.3.0` by default. `WIDTH`, `HEIGHT`, `BBOX`
 * and `CRS` (`SRS` for WMS version < 1.3.0) will be set dynamically.
 * @property {ol.ProjectionLike} projection Projection.
 * @property {number|undefined} ratio Ratio. `1` means image requests are the size of the map viewport, `2` means
 * twice the width and height of the map viewport, and so on. Must be `1` or
 * higher. Default is `1.5`.
 * @property {Array.<number>|undefined} resolutions Resolutions. If specified, requests will be made for these resolutions only.
 * @property {string|undefined} url WMS service URL.
 */


/**
 * @typedef {Object} source_StamenOptions
 * @property {number|undefined} cacheSize Cache size. Default is `2048`.
 * @property {string} layer Layer.
 * @property {number|undefined} minZoom Minimum zoom.
 * @property {number|undefined} maxZoom Maximum zoom.
 * @property {boolean|undefined} opaque Whether the layer is opaque.
 * @property {number|undefined} reprojectionErrorThreshold Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * @property {ol.TileLoadFunctionType|undefined} tileLoadFunction Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * @property {string|undefined} url URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 * @property {boolean|undefined} wrapX Whether to wrap the world horizontally. Default is `true`.
 */


/**
 * @typedef {Object} source_ImageStaticOptions
 * @property {ol.AttributionLike|undefined} attributions Attributions.
 * @property {null|string|undefined} crossOrigin The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @property {ol.Extent} imageExtent Extent of the image in map coordinates.  This is the [left, bottom, right,
 * top] map coordinates of your image.
 * @property {ol.ImageLoadFunctionType|undefined} imageLoadFunction Optional function to load an image given a URL.
 * @property {ol.ProjectionLike} projection Projection.
 * @property {ol.Size|undefined} imageSize Size of the image in pixels. Usually the image size is auto-detected, so this
 * only needs to be set if auto-detection fails for some reason.
 * @property {string} url Image URL.
 */


/**
 * @typedef {Object} source_TileArcGISRestOptions
 * @property {ol.AttributionLike|undefined} attributions Attributions.
 * @property {number|undefined} cacheSize Cache size. Default is `2048`.
 * @property {null|string|undefined} crossOrigin The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @property {Object.<string,*>|undefined} params ArcGIS Rest parameters. This field is optional. Service defaults will be
 * used for any fields not specified. `FORMAT` is `PNG32` by default. `F` is `IMAGE` by
 * default. `TRANSPARENT` is `true` by default.  `BBOX, `SIZE`, `BBOXSR`,
 * and `IMAGESR` will be set dynamically. Set `LAYERS` to
 * override the default service layer visibility. See
 * {@link http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Export_Map/02r3000000v7000000/}
 * for further reference.
 * @property {ol.tilegrid.TileGrid|undefined} tileGrid Tile grid. Base this on the resolutions, tilesize and extent supported by the
 * server.
 * If this is not defined, a default grid will be used: if there is a projection
 * extent, the grid will be based on that; if not, a grid based on a global
 * extent with origin at 0,0 will be used.
 * @property {ol.ProjectionLike} projection Projection.
 * @property {number|undefined} reprojectionErrorThreshold Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * @property {ol.TileLoadFunctionType|undefined} tileLoadFunction Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * @property {string|undefined} url ArcGIS Rest service URL for a Map Service or Image Service. The
 * url should include /MapServer or /ImageServer.
 * @property {boolean|undefined} wrapX Whether to wrap the world horizontally. Default is `true`.
 * @property {number|undefined} transition Duration of the opacity transition for rendering.  To disable the opacity
 * transition, pass `transition: 0`.
 * @property {Array.<string>|undefined} urls ArcGIS Rest service urls. Use this instead of `url` when the ArcGIS Service supports multiple
 * urls for export requests.
 */


/**
 * @typedef {Object} source_TileJSONOptions
 * @property {ol.AttributionLike|undefined} attributions Optional attributions for the source.  If provided, these will be used
 * instead of any attribution data advertised by the server.  If not provided,
 * any attributions advertised by the server will be used.
 * @property {number|undefined} cacheSize Cache size. Default is `2048`.
 * @property {null|string|undefined} crossOrigin The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @property {boolean|undefined} jsonp Use JSONP with callback to load the TileJSON. Useful when the server
 * does not support CORS. Default is `false`.
 * @property {number|undefined} reprojectionErrorThreshold Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * @property {TileJSON|undefined} tileJSON TileJSON configuration for this source. If not provided, `url` must be
 * configured.
 * @property {ol.TileLoadFunctionType|undefined} tileLoadFunction Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * @property {string|undefined} url URL to the TileJSON file. If not provided, `tileJSON` must be configured.
 * @property {boolean|undefined} wrapX Whether to wrap the world horizontally. Default is `true`.
 * @property {number|undefined} transition Duration of the opacity transition for rendering.  To disable the opacity
 * transition, pass `transition: 0`.
 */


/**
 * @typedef {Object} source_TileWMSOptions
 * @property {ol.AttributionLike|undefined} attributions Attributions.
 * @property {number|undefined} cacheSize Cache size. Default is `2048`.
 * @property {Object.<string,*>} params WMS request parameters. At least a `LAYERS` param is required. `STYLES` is
 * `''` by default. `VERSION` is `1.3.0` by default. `WIDTH`, `HEIGHT`, `BBOX`
 * and `CRS` (`SRS` for WMS version < 1.3.0) will be set dynamically.
 * @property {null|string|undefined} crossOrigin The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @property {number|undefined} gutter The size in pixels of the gutter around image tiles to ignore. By setting
 * this property to a non-zero value, images will be requested that are wider
 * and taller than the tile size by a value of `2 x gutter`. Defaults to zero.
 * Using a non-zero value allows artifacts of rendering at tile edges to be
 * ignored. If you control the WMS service it is recommended to address
 * "artifacts at tile edges" issues by properly configuring the WMS service. For
 * example, MapServer has a `tile_map_edge_buffer` configuration parameter for
 * this. See http://mapserver.org/output/tile_mode.html.
 * @property {boolean|undefined} hidpi Use the `ol.Map#pixelRatio` value when requesting the image from the remote
 * server. Default is `true`.
 * @property {function(new: ol.ImageTile, ol.TileCoord,                ol.TileState, string, ?string,
                ol.TileLoadFunctionType)|undefined}
 tileClass Class used to instantiate image tiles. Default is {@link ol.ImageTile}.
 * @property {ol.tilegrid.TileGrid|undefined} tileGrid Tile grid. Base this on the resolutions, tilesize and extent supported by the
 * server.
 * If this is not defined, a default grid will be used: if there is a projection
 * extent, the grid will be based on that; if not, a grid based on a global
 * extent with origin at 0,0 will be used.
 * @property {ol.ProjectionLike} projection Projection.
 * @property {number|undefined} reprojectionErrorThreshold Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * @property {ol.source.WMSServerType|string|undefined} serverType The type of the remote WMS server. Currently only used when `hidpi` is
 * `true`. Default is `undefined`.
 * @property {ol.TileLoadFunctionType|undefined} tileLoadFunction Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * @property {string|undefined} url WMS service URL.
 * @property {Array.<string>|undefined} urls WMS service urls. Use this instead of `url` when the WMS supports multiple
 * urls for GetMap requests.
 * @property {boolean|undefined} wrapX Whether to wrap the world horizontally. When set to `false`, only one world
 * will be rendered. When `true`, tiles will be requested for one world only,
 * but they will be wrapped horizontally to render multiple worlds. The default
 * is `true`.
 * @property {number|undefined} transition Duration of the opacity transition for rendering.  To disable the opacity
 * transition, pass `transition: 0`.
 */


/**
 * @typedef {Object} source_VectorOptions
 * @property {ol.AttributionLike|undefined} attributions Attributions.
 * @property {Array.<module:ol/Feature~Feature>|ol.Collection.<module:ol/Feature~Feature>|undefined} features Features. If provided as {@link ol.Collection}, the features in the source
 * and the collection will stay in sync.
 * @property {ol.format.Feature|undefined} format The feature format used by the XHR feature loader when `url` is set.
 * Required if `url` is set, otherwise ignored. Default is `undefined`.
 * @property {module:ol/Feature~FeatureLoader|undefined} loader The loader function used to load features, from a remote source for example.
 * If this is not set and `url` is set, the source will create and use an XHR
 * feature loader.
 *
 * Example:
 *
 * ```js
 * var vectorSource = new ol.source.Vector({
 *   format: new ol.format.GeoJSON(),
 *   loader: function(extent, resolution, projection) {
 *      var proj = projection.getCode();
 *      var url = 'https://ahocevar.com/geoserver/wfs?service=WFS&' +
 *          'version=1.1.0&request=GetFeature&typename=osm:water_areas&' +
 *          'outputFormat=application/json&srsname=' + proj + '&' +
 *          'bbox=' + extent.join(',') + ',' + proj;
 *      var xhr = new XMLHttpRequest();
 *      xhr.open('GET', url);
 *      var onError = function() {
 *        vectorSource.removeLoadedExtent(extent);
 *      }
 *      xhr.onerror = onError;
 *      xhr.onload = function() {
 *        if (xhr.status == 200) {
 *          vectorSource.addFeatures(
 *              vectorSource.getFormat().readFeatures(xhr.responseText));
 *        } else {
 *          onError();
 *        }
 *      }
 *      xhr.send();
 *    },
 *    strategy: ol.loadingstrategy.bbox
 *  });
 * ```
 * @property {boolean|undefined} overlaps This source may have overlapping geometries. Default is `true`. Setting this
 * to `false` (e.g. for sources with polygons that represent administrative
 * boundaries or TopoJSON sources) allows the renderer to optimise fill and
 * stroke operations.
 * @property {ol.LoadingStrategy|undefined} strategy The loading strategy to use. By default an {@link ol.loadingstrategy.all}
 * strategy is used, a one-off strategy which loads all features at once.
 * @property {string|module:ol/Feature~FeatureUrlFunction|undefined} url Setting this option instructs the source to load features using an XHR loader
 * (see {@link ol.featureloader.xhr}). Use a `string` and an
 * {@link ol.loadingstrategy.all} for a one-off download of all features from
 * the given URL. Use a {@link module:ol/Feature~FeatureUrlFunction} to generate the url with
 * other loading strategies.
 * Requires `format` to be set as well.
 * When default XHR feature loader is provided, the features will
 * be transformed from the data projection to the view projection
 * during parsing. If your remote data source does not advertise its projection
 * properly, this transformation will be incorrect. For some formats, the
 * default projection (usually EPSG:4326) can be overridden by setting the
 * defaultDataProjection constructor option on the format.
 * Note that if a source contains non-feature data, such as a GeoJSON geometry
 * or a KML NetworkLink, these will be ignored. Use a custom loader to load these.
 * @property {boolean|undefined} useSpatialIndex By default, an RTree is used as spatial index. When features are removed and
 * added frequently, and the total number of features is low, setting this to
 * `false` may improve performance.
 *
 * Note that
 * {@link ol.source.Vector#getFeaturesInExtent},
 * {@link ol.source.Vector#getClosestFeatureToCoordinate} and
 * {@link ol.source.Vector#getExtent} cannot be used when `useSpatialIndex` is
 * set to `false`, and {@link ol.source.Vector#forEachFeatureInExtent} will loop
 * through all features.
 *
 * When set to `false`, the features will be maintained in an
 * {@link ol.Collection}, which can be retrieved through
 * {@link ol.source.Vector#getFeaturesCollection}.
 *
 * The default is `true`.
 * @property {boolean|undefined} wrapX Wrap the world horizontally. Default is `true`. For vector editing across the
 * -180° and 180° meridians to work properly, this should be set to `false`. The
 * resulting geometry coordinates will then exceed the world bounds.
 */


/**
 * @typedef {Object} source_WMTSOptions
 * @property {ol.AttributionLike|undefined} attributions Attributions.
 * @property {number|undefined} cacheSize Cache size. Default is `2048`.
 * @property {string|null|undefined} crossOrigin The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @property {ol.tilegrid.WMTS} tileGrid Tile grid.
 * @property {ol.ProjectionLike} projection Projection.
 * @property {number|undefined} reprojectionErrorThreshold Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * @property {ol.source.WMTSRequestEncoding|string|undefined} requestEncoding Request encoding. Default is `KVP`.
 * @property {string} layer Layer name as advertised in the WMTS capabilities.
 * @property {string} style Style name as advertised in the WMTS capabilities.
 * @property {function(new: ol.ImageTile, ol.TileCoord,                ol.TileState, string, ?string,
                ol.TileLoadFunctionType)|undefined}
 tileClass Class used to instantiate image tiles. Default is {@link ol.ImageTile}.
 * @property {number|undefined} tilePixelRatio The pixel ratio used by the tile service. For example, if the tile
 * service advertizes 256px by 256px tiles but actually sends 512px
 * by 512px images (for retina/hidpi devices) then `tilePixelRatio`
 * should be set to `2`. Default is `1`.
 * @property {string|undefined} version WMTS version. Default is `1.0.0`.
 * @property {string|undefined} format Image format. Default is `image/jpeg`.
 * @property {string} matrixSet Matrix set.
 * @property {!Object|undefined} dimensions Additional "dimensions" for tile requests.  This is an object with properties
 * named like the advertised WMTS dimensions.
 * @property {string|undefined} url A URL for the service.  For the RESTful request encoding, this is a URL
 * template.  For KVP encoding, it is normal URL. A `{?-?}` template pattern,
 * for example `subdomain{a-f}.domain.com`, may be used instead of defining
 * each one separately in the `urls` option.
 * @property {ol.TileLoadFunctionType|undefined} tileLoadFunction Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * @property {Array.<string>|undefined} urls An array of URLs.  Requests will be distributed among the URLs in this array.
 * @property {boolean|undefined} wrapX Whether to wrap the world horizontally. Default is `false`.
 * @property {number|undefined} transition Duration of the opacity transition for rendering.  To disable the opacity
 * transition, pass `transition: 0`.
 */


/**
 * @typedef {Object} source_XYZOptions
 * @property {ol.AttributionLike|undefined} attributions Attributions.
 * @property {number|undefined} cacheSize Cache size. Default is `2048`.
 * @property {null|string|undefined} crossOrigin The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @property {boolean|undefined} opaque Whether the layer is opaque.
 * @property {ol.ProjectionLike} projection Projection. Default is `EPSG:3857`.
 * @property {number|undefined} reprojectionErrorThreshold Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * @property {number|undefined} maxZoom Optional max zoom level. Default is `18`.
 * @property {number|undefined} minZoom Optional min zoom level. Default is `0`.
 * @property {ol.tilegrid.TileGrid|undefined} tileGrid Tile grid.
 * @property {ol.TileLoadFunctionType|undefined} tileLoadFunction Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * @property {number|undefined} tilePixelRatio The pixel ratio used by the tile service. For example, if the tile
 * service advertizes 256px by 256px tiles but actually sends 512px
 * by 512px images (for retina/hidpi devices) then `tilePixelRatio`
 * should be set to `2`. Default is `1`.
 * @property {number|ol.Size|undefined} tileSize The tile size used by the tile service. Default is `[256, 256]` pixels.
 * @property {ol.TileUrlFunctionType|undefined} tileUrlFunction Optional function to get tile URL given a tile coordinate and the projection.
 * Required if url or urls are not provided.
 * @property {string|undefined} url URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 * A `{?-?}` template pattern, for example `subdomain{a-f}.domain.com`, may be
 * used instead of defining each one separately in the `urls` option.
 * @property {Array.<string>|undefined} urls An array of URL templates.
 * @property {boolean|undefined} wrapX Whether to wrap the world horizontally. Default is `true`.
 * @property {number|undefined} transition Duration of the opacity transition for rendering.  To disable the opacity
 * transition, pass `transition: 0`.
 */


/**
 * @typedef {Object} source_CartoDBOptions
 * @property {ol.AttributionLike|undefined} attributions Attributions.
 * @property {number|undefined} cacheSize Cache size. Default is `2048`.
 * @property {null|string|undefined} crossOrigin The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @property {ol.ProjectionLike} projection Projection. Default is `EPSG:3857`.
 * @property {number|undefined} maxZoom Optional max zoom level. Default is `18`.
 * @property {number|undefined} minZoom Minimum zoom.
 * @property {boolean|undefined} wrapX Whether to wrap the world horizontally. Default is `true`.
 * @property {Object|undefined} config If using anonymous maps, the CartoDB config to use. See
 * {@link http://docs.cartodb.com/cartodb-platform/maps-api/anonymous-maps/}
 * for more detail.
 * If using named maps, a key-value lookup with the template parameters.
 * See {@link http://docs.cartodb.com/cartodb-platform/maps-api/named-maps/}
 * for more detail.
 * @property {string|undefined} map If using named maps, this will be the name of the template to load.
 * See {@link http://docs.cartodb.com/cartodb-platform/maps-api/named-maps/}
 * for more detail.
 * @property {string} account CartoDB account name
 */


/**
 * @typedef {Object} source_ZoomifyOptions
 * @property {ol.AttributionLike|undefined} attributions Attributions.
 * @property {number|undefined} cacheSize Cache size. Default is `2048`.
 * @property {null|string|undefined} crossOrigin The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @property {ol.ProjectionLike|undefined} projection Projection.
 * @property {number|undefined} reprojectionErrorThreshold Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * @property {!string} url URL template or base URL of the Zoomify service. A base URL is the fixed part
 * of the URL, excluding the tile group, z, x, and y folder structure, e.g.
 * `http://my.zoomify.info/IMAGE.TIF/`. A URL template must include
 * `{TileGroup}`, `{x}`, `{y}`, and `{z}` placeholders, e.g.
 * `http://my.zoomify.info/IMAGE.TIF/{TileGroup}/{z}-{x}-{y}.jpg`.
 * Internet Imaging Protocol (IIP) with JTL extension can be also used with
 * `{tileIndex}` and `{z}` placeholders, e.g.
 * `http://my.zoomify.info?FIF=IMAGE.TIF&JTL={z},{tileIndex}`.
 * A `{?-?}` template pattern, for example `subdomain{a-f}.domain.com`, may be
 * used instead of defining each one separately in the `urls` option.
 * @property {string|undefined} tierSizeCalculation Tier size calculation method: `default` or `truncated`.
 * @property {ol.Size} size Size of the image.
 * @property {ol.Extent|undefined} extent Extent for the TileGrid that is created. Default sets the TileGrid in the
 * fourth quadrant, meaning extent is `[0, -height, width, 0]`. To change the
 * extent to the first quadrant (the default for OpenLayers 2) set the extent
 * as `[0, 0, width, height]`.
 * @property {number|undefined} transition Duration of the opacity transition for rendering.  To disable the opacity
 * transition, pass `transition: 0`.
 * @property {number|undefined} tileSize Tile size. Same tile size is used for all zoom levels. Default value is
 * `256`.
 */


/**
 * @typedef {Object} style_CircleOptions
 * @property {ol.style.Fill|undefined} fill Fill style.
 * @property {number} radius Circle radius.
 * @property {boolean|undefined} snapToPixel If `true` integral numbers of pixels are used as the X and Y pixel
 * coordinate when drawing the circle in the output canvas. If `false`
 * fractional numbers may be used. Using `true` allows for "sharp"
 * rendering (no blur), while using `false` allows for "accurate"
 * rendering. Note that accuracy is important if the circle's
 * position is animated. Without it, the circle may jitter noticeably.
 * Default value is `true`.
 * @property {ol.style.Stroke|undefined} stroke Stroke style.
 * @property {ol.style.AtlasManager|undefined} atlasManager The atlas manager to use for this circle. When using WebGL it is
 * recommended to use an atlas manager to avoid texture switching.
 * If an atlas manager is given, the circle is added to an atlas.
 * By default no atlas manager is used.
 */


/**
 * @typedef {Object} style_FillOptions
 * @property {ol.Color|ol.ColorLike|undefined} color A color, gradient or pattern. See {@link ol.color}
 * and {@link ol.colorlike} for possible formats. Default null;
 * if null, the Canvas/renderer default black will be used.
 */


/**
 * @typedef {Object} style_IconOptions
 * @property {Array.<number>|undefined} anchor Anchor. Default value is `[0.5, 0.5]` (icon center).
 * @property {ol.style.IconOrigin|undefined} anchorOrigin Origin of the anchor: `bottom-left`, `bottom-right`, `top-left` or
 * `top-right`. Default is `top-left`.
 * @property {ol.style.IconAnchorUnits|undefined} anchorXUnits Units in which the anchor x value is specified. A value of `'fraction'`
 * indicates the x value is a fraction of the icon. A value of `'pixels'`
 * indicates the x value in pixels. Default is `'fraction'`.
 * @property {ol.style.IconAnchorUnits|undefined} anchorYUnits Units in which the anchor y value is specified. A value of `'fraction'`
 * indicates the y value is a fraction of the icon. A value of `'pixels'`
 * indicates the y value in pixels. Default is `'fraction'`.
 * @property {ol.Color|string|undefined} color Color to tint the icon. If not specified, the icon will be left as is.
 * @property {null|string|undefined} crossOrigin The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @property {Image|HTMLCanvasElement|undefined} img Image object for the icon. If the `src` option is not provided then the
 * provided image must already be loaded. And in that case, it is required
 * to provide the size of the image, with the `imgSize` option.
 * @property {Array.<number>|undefined} offset Offset, which, together with the size and the offset origin,
 * define the sub-rectangle to use from the original icon image. Default value
 * is `[0, 0]`.
 * @property {ol.style.IconOrigin|undefined} offsetOrigin Origin of the offset: `bottom-left`, `bottom-right`, `top-left` or
 * `top-right`. Default is `top-left`.
 * @property {number|undefined} opacity Opacity of the icon. Default is `1`.
 * @property {number|undefined} scale Scale. Default is `1`.
 * @property {boolean|undefined} snapToPixel If `true` integral numbers of pixels are used as the X and Y pixel
 * coordinate when drawing the icon in the output canvas. If `false`
 * fractional numbers may be used. Using `true` allows for "sharp"
 * rendering (no blur), while using `false` allows for "accurate"
 * rendering. Note that accuracy is important if the icon's position
 * is animated. Without it, the icon may jitter noticeably. Default
 * value is `true`.
 * @property {boolean|undefined} rotateWithView Whether to rotate the icon with the view. Default is `false`.
 * @property {number|undefined} rotation Rotation in radians (positive rotation clockwise). Default is `0`.
 * @property {ol.Size|undefined} size Icon size in pixel. Can be used together with `offset` to define the
 * sub-rectangle to use from the origin (sprite) icon image.
 * @property {ol.Size|undefined} imgSize Image size in pixels. Only required if `img` is set and `src` is not, and for
 * SVG images in Internet Explorer 11. The provided `imgSize` needs to match
 * the actual size of the image.
 * @property {string|undefined} src Image source URI.
 */


/**
 * @typedef {Object} style_RegularShapeOptions
 * @property {ol.style.Fill|undefined} fill Fill style.
 * @property {number} points Number of points for stars and regular polygons. In case of a polygon, the
 * number of points is the number of sides.
 * @property {number|undefined} radius Radius of a regular polygon.
 * @property {number|undefined} radius1 Outer radius of a star.
 * @property {number|undefined} radius2 Inner radius of a star.
 * @property {number|undefined} angle Shape's angle in radians. A value of 0 will have one of the shape's point
 * facing up.
 * Default value is 0.
 * @property {boolean|undefined} snapToPixel If `true` integral numbers of pixels are used as the X and Y pixel
 * coordinate when drawing the shape in the output canvas. If `false`
 * fractional numbers may be used. Using `true` allows for "sharp"
 * rendering (no blur), while using `false` allows for "accurate"
 * rendering. Note that accuracy is important if the shape's
 * position is animated. Without it, the shape may jitter noticeably.
 * Default value is `true`.
 * @property {ol.style.Stroke|undefined} stroke Stroke style.
 * @property {number|undefined} rotation Rotation in radians (positive rotation clockwise). Default is `0`.
 * @property {boolean|undefined} rotateWithView Whether to rotate the shape with the view. Default is `false`.
 * @property {ol.style.AtlasManager|undefined} atlasManager The atlas manager to use for this symbol. When using WebGL it is
 * recommended to use an atlas manager to avoid texture switching.
 * If an atlas manager is given, the symbol is added to an atlas.
 * By default no atlas manager is used.
 */


/**
 * @typedef {Object} style_StrokeOptions
 * @property {ol.Color|ol.ColorLike|undefined} color A color, gradient or pattern. See {@link ol.color}
 * and {@link ol.colorlike} for possible formats. Default null;
 * if null, the Canvas/renderer default black will be used.
 * @property {string|undefined} lineCap Line cap style: `butt`, `round`, or `square`. Default is `round`.
 * @property {string|undefined} lineJoin Line join style: `bevel`, `round`, or `miter`. Default is `round`.
 * @property {Array.<number>|undefined} lineDash Line dash pattern. Default is `undefined` (no dash). Please note that
 * Internet Explorer 10 and lower [do not support][mdn] the `setLineDash`
 * method on the `CanvasRenderingContext2D` and therefore this option will
 * have no visual effect in these browsers.
 *
 * [mdn]: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash#Browser_compatibility
 *
 * @property {number|undefined} lineDashOffset Line dash offset. Default is '0'.
 * @property {number|undefined} miterLimit Miter limit. Default is `10`.
 * @property {number|undefined} width Width.
 */


/**
 * @typedef {Object} style_TextOptions
 * @property {string|undefined} font Font style as CSS 'font' value, see:
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font}.
 * Default is '10px sans-serif'
 * @property {number|undefined} maxAngle When `placement` is set to `'line'`, allow a maximum angle between adjacent
 * characters. The expected value is in radians, and the default is 45°
 * (`Math.PI / 4`).
 * @property {number|undefined} offsetX Horizontal text offset in pixels. A positive will shift the text right.
 * Default is `0`.
 * @property {number|undefined} offsetY Vertical text offset in pixels. A positive will shift the text down. Default
 * is `0`.
 * @property {boolean|undefined} overflow For polygon labels or when `placement` is set to `'line'`, allow text to
 * exceed the width of the polygon at the label position or the length of
 * the path that it follows. Default is `false`.
 * @property {ol.style.TextPlacement|undefined} placement Text placement.
 * @property {number|undefined} scale Scale.
 * @property {boolean|undefined} rotateWithView Whether to rotate the text with the view. Default is `false`.
 * @property {number|undefined} rotation Rotation in radians (positive rotation clockwise). Default is `0`.
 * @property {string|undefined} text Text content.
 * @property {string|undefined} textAlign Text alignment. Possible values: 'left', 'right', 'center', 'end' or 'start'.
 * Default is 'center' for `placement: 'point'`. For `placement: 'line'`, the
 * default is to let the renderer choose a placement where `maxAngle` is not
 * exceeded.
 * @property {string|undefined} textBaseline Text base line. Possible values: 'bottom', 'top', 'middle', 'alphabetic',
 * 'hanging', 'ideographic'. Default is 'middle'.
 * @property {ol.style.Fill|undefined} fill Fill style. If none is provided, we'll use a dark fill-style (#333).
 * @property {ol.style.Stroke|undefined} stroke Stroke style.
 * @property {ol.style.Fill|undefined} backgroundFill Fill style for the text background when `placement` is `'point'`. Default is
 * no fill.
 * @property {ol.style.Stroke|undefined} backgroundStroke Stroke style for the text background  when `placement` is `'point'`. Default
 * is no stroke.
 * @property {Array.<number>|undefined} padding Padding in pixels around the text for decluttering and background. The order
 * of values in the array is `[top, right, bottom, left]`. Default is
 * `[0, 0, 0, 0]`.
 */


/**
 * @typedef {Object} style_StyleOptions
 * @property {undefined|string|module:ol/geom/Geometry~Geometry|ol.StyleGeometryFunction} geometry Feature property or geometry or function returning a geometry to render for
 * this style.
 * @property {ol.style.Fill|undefined} fill Fill style.
 * @property {ol.style.Image|undefined} image Image style.
 * @property {ol.StyleRenderFunction|undefined} renderer Custom renderer. When configured, `fill`, `stroke` and `image` will be
 * ignored, and the provided function will be called with each render frame for
 * each geometry.
 *
 * @property {ol.style.Stroke|undefined} stroke Stroke style.
 * @property {ol.style.Text|undefined} text Text style.
 * @property {number|undefined} zIndex Z index.
 */


/**
 * @typedef {Object} tilegrid_TileGridOptions
 * @property {ol.Extent|undefined} extent Extent for the tile grid. No tiles outside this extent will be requested by
 * {@link ol.source.Tile} sources. When no `origin` or `origins` are
 * configured, the `origin` will be set to the top-left corner of the extent.
 * @property {number|undefined} minZoom Minimum zoom. Default is 0.
 * @property {ol.Coordinate|undefined} origin The tile grid origin, i.e. where the `x` and `y` axes meet (`[z, 0, 0]`).
 * Tile coordinates increase left to right and upwards. If not specified,
 * `extent` or `origins` must be provided.
 * @property {Array.<ol.Coordinate>|undefined} origins Tile grid origins, i.e. where the `x` and `y` axes meet (`[z, 0, 0]`), for
 * each zoom level. If given, the array length should match the length of the
 * `resolutions` array, i.e. each resolution can have a different origin. Tile
 * coordinates increase left to right and upwards. If not specified, `extent`
 * or `origin` must be provided.
 * @property {!Array.<number>} resolutions Resolutions. The array index of each resolution needs to match the zoom
 * level. This means that even if a `minZoom` is configured, the resolutions
 * array will have a length of `maxZoom + 1`.
 * @property {number|ol.Size|undefined} tileSize Tile size. Default is `[256, 256]`.
 * @property {Array.<number|ol.Size>|undefined} tileSizes Tile sizes. If given, the array length should match the length of the
 * `resolutions` array, i.e. each resolution can have a different tile size.
 */


/**
 * @typedef {Object} tilegrid_WMTSOptions
 * @property {ol.Extent|undefined} extent Extent for the tile grid. No tiles outside this extent will be requested by
 * {@link ol.source.Tile} sources. When no `origin` or `origins` are
 * configured, the `origin` will be set to the top-left corner of the extent.
 * @property {ol.Coordinate|undefined} origin The tile grid origin, i.e. where the `x` and `y` axes meet (`[z, 0, 0]`).
 * Tile coordinates increase left to right and upwards. If not specified,
 * `extent` or `origins` must be provided.
 * @property {Array.<ol.Coordinate>|undefined} origins Tile grid origins, i.e. where the `x` and `y` axes meet (`[z, 0, 0]`), for
 * each zoom level. If given, the array length should match the length of the
 * `resolutions` array, i.e. each resolution can have a different origin. Tile
 * coordinates increase left to right and upwards. If not specified, `extent` or
 * `origin` must be provided.
 * @property {!Array.<number>} resolutions Resolutions. The array index of each resolution needs to match the zoom
 * level. This means that even if a `minZoom` is configured, the resolutions
 * array will have a length of `maxZoom + 1`
 * @property {!Array.<string>} matrixIds matrix IDs. The length of this array needs to match the length of the
 * `resolutions` array.
 * @property {Array.<ol.Size>|undefined} sizes Number of tile rows and columns of the grid for each zoom level. The values
 * here are the `TileMatrixWidth` and `TileMatrixHeight` advertised in the
 * GetCapabilities response of the WMTS, and define the grid's extent together
 * with the `origin`. An `extent` can be configured in addition, and will
 * further limit the extent for which tile requests are made by sources. Note
 * that when the top-left corner of the `extent` is used as `origin` or
 * `origins`, then the `y` value must be negative because OpenLayers tile
 * coordinates increase upwards.
 * @property {number|ol.Size|undefined} tileSize Tile size.
 * @property {Array.<number|ol.Size>|undefined} tileSizes Tile sizes. The length of this array needs to match the length of the
 * `resolutions` array.
 * @property {Array.<number>|undefined} widths Number of tile columns that cover the grid's extent for each zoom level. Only
 * required when used with a source that has `wrapX` set to `true`, and only
 * when the grid's origin differs from the one of the projection's extent. The
 * array length has to match the length of the `resolutions` array, i.e. each
 * resolution will have a matching entry here.
 */


/**
 * @typedef {Object} tilegrid_XYZOptions
 * @property {ol.Extent|undefined} extent Extent for the tile grid.  The origin for an XYZ tile grid is the top-left
 * corner of the extent.  The zero level of the grid is defined by the
 * resolution at which one tile fits in the provided extent.  If not provided,
 * the extent of the EPSG:3857 projection is used.
 * @property {number|undefined} maxZoom Maximum zoom.  The default is `ol.DEFAULT_MAX_ZOOM`.  This determines the
 * number of levels in the grid set.  For example, a `maxZoom` of 21 means there
 * are 22 levels in the grid set.
 * @property {number|undefined} minZoom Minimum zoom. Default is 0.
 * @property {number|ol.Size|undefined} tileSize Tile size in pixels. Default is `[256, 256]`.
 */


/**
 * @typedef {Object} ViewState
 * @property {ol.Coordinate} center
 * @property {module:ol/proj/Projection~Projection} projection
 * @property {number} resolution
 * @property {number} rotation
 * @property {number} zoom The current zoom level.
 */


/**
 * @typedef {Object} style_AtlasManagerOptions
 * @property {number|undefined} initialSize The size in pixels of the first atlas image. Default is `256`.
 * @property {number|undefined} maxSize The maximum size in pixels of atlas images. Default is
 * `WEBGL_MAX_TEXTURE_SIZE` or 2048 if WebGL is not supported.
 * @property {number|undefined} space The space in pixels between images (default: 1).
 */
