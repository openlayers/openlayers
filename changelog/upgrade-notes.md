## Upgrade notes

### v3.18.0

#### Changes in the way assertions are handled

Previously, minified builds of the library did not have any assertions. This caused applications to fail silently or with cryptic stack traces. Starting with this release, developers get notified of many runtime errors through the new `ol.AssertionError`. This error has a `code` property. The meaning of the code can be found on http://openlayers.org/en/latest/doc/errors/. There are additional console assertion checks in debug mode when the `goog.DEBUG` compiler flag is `true`. As this is `true` by default, it is recommended that those creating custom builds set this to `false` so these assertions are stripped.'

#### Removal of `ol.ENABLE_NAMED_COLORS`

This option was previously needed to use named colors with the WebGL renderer but is no longer needed.

#### KML format now uses URL()

The URL constructor is supported by all modern browsers, but not by older ones, such as IE. To use the KML format in such older browsers, a URL polyfill will have to be loaded before use.

#### Changes only relevant to those who compile their applications together with the Closure Compiler

A number of internal types have been renamed.  This will not affect those who use the API provided by the library, but if you are compiling your application together with OpenLayers and using type names, you'll need to do the following:

 * rename `ol.CollectionEventType` to `ol.Collection.EventType`
 * rename `ol.CollectionEvent` to `ol.Collection.Event`
 * rename `ol.ViewHint` to `ol.View.Hint`
 * rename `ol.ViewProperty` to `ol.View.Property`
 * rename `ol.render.webgl.imagereplay.shader.Default.Locations` to `ol.render.webgl.imagereplay.defaultshader.Locations`
 * rename `ol.render.webgl.imagereplay.shader.DefaultFragment` to `ol.render.webgl.imagereplay.defaultshader.Fragment`
 * rename `ol.render.webgl.imagereplay.shader.DefaultVertex` to `ol.render.webgl.imagereplay.defaultshader.Vertex`
 * rename `ol.renderer.webgl.map.shader.Default.Locations` to `ol.renderer.webgl.defaultmapshader.Locations`
 * rename `ol.renderer.webgl.map.shader.Default.Locations` to `ol.renderer.webgl.defaultmapshader.Locations`
 * rename `ol.renderer.webgl.map.shader.DefaultFragment` to `ol.renderer.webgl.defaultmapshader.Fragment`
 * rename `ol.renderer.webgl.map.shader.DefaultVertex` to `ol.renderer.webgl.defaultmapshader.Vertex`
 * rename `ol.renderer.webgl.tilelayer.shader.Fragment` to `ol.renderer.webgl.tilelayershader.Fragment`
 * rename `ol.renderer.webgl.tilelayer.shader.Locations` to `ol.renderer.webgl.tilelayershader.Locations`
 * rename `ol.renderer.webgl.tilelayer.shader.Vertex` to `ol.renderer.webgl.tilelayershader.Vertex`
 * rename `ol.webgl.WebGLContextEventType` to `ol.webgl.ContextEventType`
 * rename `ol.webgl.shader.Fragment` to `ol.webgl.Fragment`
 * rename `ol.webgl.shader.Vertex` to `ol.webgl.Vertex`

### v3.17.0

#### `ol.source.MapQuest` removal

Because of changes at MapQuest (see: https://lists.openstreetmap.org/pipermail/talk/2016-June/076106.html) we had to remove the MapQuest source for now (see https://github.com/openlayers/ol3/issues/5484 for details).

#### `ol.interaction.ModifyEvent` changes

The event object previously had a `mapBrowserPointerEvent` property, which has been renamed to `mapBrowserEvent`.

#### Removal of ol.raster namespace

Users compiling their code with the library and using types in the `ol.raster` namespace should note that this has now been removed. `ol.raster.Pixel` has been deleted, and the other types have been renamed as follows, and your code may need changing if you use these:
* `ol.raster.Operation` to `ol.RasterOperation`
* `ol.raster.OperationType` to `ol.RasterOperationType`

#### All typedefs now in ol namespace

Users compiling their code with the library should note that the following typedefs have been renamed; your code may need changing if you use these:
* ol.events.ConditionType to ol.EventsConditionType
* ol.events.EventTargetLike to ol.EventTargetLike
* ol.events.Key to ol.EventsKey
* ol.events.ListenerFunctionType to ol.EventsListenerFunctionType
* ol.interaction.DragBoxEndConditionType to ol.DragBoxEndConditionType
* ol.interaction.DrawGeometryFunctionType to ol.DrawGeometryFunctionType
* ol.interaction.SegmentDataType to ol.ModifySegmentDataType
* ol.interaction.SelectFilterFunction to ol.SelectFilterFunction
* ol.interaction.SnapResultType to ol.SnapResultType
* ol.interaction.SnapSegmentDataType to ol.SnapSegmentDataType
* ol.proj.ProjectionLike to ol.ProjectionLike
* ol.style.AtlasBlock to ol.AtlasBlock
* ol.style.AtlasInfo to ol.AtlasInfo
* ol.style.AtlasManagerInfo to ol.AtlasManagerInfo
* ol.style.CircleRenderOptions to ol.CircleRenderOptions
* ol.style.ImageOptions to ol.StyleImageOptions
* ol.style.GeometryFunction to ol.StyleGeometryFunction
* ol.style.RegularShapeRenderOptions to ol.RegularShapeRenderOptions
* ol.style.StyleFunction to ol.StyleFunction

### v3.16.0

#### Rendering change for tile sources

Previously, if you called `source.setUrl()` on a tile source, all currently rendered tiles would be cleared before new tiles were loaded and rendered.  This clearing of the map is undesirable if you are trying to smoothly update the tiles used by a source.  This behavior has now changed, and calling `source.setUrl()` (or `source.setUrls()`) will *not* clear currently rendered tiles before loading and rendering new tiles.  Instead, previously rendered tiles remain rendered until new tiles have loaded and can replace them.  If you want to achieve the old behavior (render a blank map before loading new tiles), you can call `source.refresh()` or you can replace the old source with a new one (using `layer.setSource()`).

#### Move of typedefs out of code and into separate file

This change should not affect the great majority of application developers, but it's possible there are edge cases when compiling application code together with the library which cause compiler errors or warnings. In this case, please raise a GitHub issue. `goog.require`s for typedefs should not be necessary.
Users compiling their code with the library should note that the following API `@typedef`s have been renamed; your code may need changing if you use these:
* `ol.format.WFS.FeatureCollectionMetadata` to `ol.WFSFeatureCollectionMetadata`
* `ol.format.WFS.TransactionResponse` to `ol.WFSTransactionResponse`

#### Removal of `opaque` option for `ol.source.VectorTile`

This option is no longer needed, so it was removed from the API.

#### XHR loading for `ol.source.TileUTFGrid`

The `ol.source.TileUTFGrid` now uses XMLHttpRequest to load UTFGrid tiles by default.  This works out of the box with the v4 Mapbox API.  To work with the v3 API, you must use the new `jsonp` option on the source.  See the examples below for detail.

```js
// To work with the v4 API
var v4source = new ol.source.TileUTFGrid({
  url: 'https://api.tiles.mapbox.com/v4/example.json?access_token=' + YOUR_KEY_HERE
});

// To work with the v3 API
var v3source = new ol.source.TileUTFGrid({
  jsonp: true, // <--- this is required for v3
  url: 'http://api.tiles.mapbox.com/v3/example.json'
});
```

### v3.15.0

#### Internet Explorer 9 support

As of this release, OpenLayers requires a `classList` polyfill for IE 9 support. See http://cdn.polyfill.io/v2/docs/features#Element_prototype_classList.

#### Immediate rendering API

Listeners for `precompose`, `render`, and `postcompose` receive an event with a `vectorContext` property with methods for immediate vector rendering.  The previous geometry drawing methods have been replaced with a single `vectorContext.drawGeometry(geometry)` method.  If you were using any of the following experimental methods on the vector context, replace them with `drawGeometry`:

 * Removed experimental geometry drawing methods: `drawPointGeometry`, `drawLineStringGeometry`, `drawPolygonGeometry`, `drawMultiPointGeometry`, `drawMultiLineStringGeometry`, `drawMultiPolygonGeometry`, and `drawCircleGeometry` (all have been replaced with `drawGeometry`).

In addition, the previous methods for setting style parts have been replaced with a single `vectorContext.setStyle(style)` method.  If you were using any of the following experimental methods on the vector context, replace them with `setStyle`:

 * Removed experimental style setting methods: `setFillStrokeStyle`, `setImageStyle`, `setTextStyle` (all have been replaced with `setStyle`).

Below is an example of how the vector context might have been used in the past:

```js
// OLD WAY, NO LONGER SUPPORTED
map.on('postcompose', function(event) {
  event.vectorContext.setFillStrokeStyle(style.getFill(), style.getStroke());
  event.vectorContext.drawPointGeometry(geometry);
});
```

Here is an example of how you could accomplish the same with the new methods:
```js
// NEW WAY, USE THIS INSTEAD OF THE CODE ABOVE
map.on('postcompose', function(event) {
  event.vectorContext.setStyle(style);
  event.vectorContext.drawGeometry(geometry);
});
```

A final change to the immediate rendering API is that `vectorContext.drawFeature()` calls are now "immediate" as well.  The drawing now occurs synchronously.  This means that any `zIndex` in a style passed to `drawFeature()` will be ignored.  To achieve `zIndex` ordering, order your calls to `drawFeature()` instead.

#### Removal of `ol.DEFAULT_TILE_CACHE_HIGH_WATER_MARK`

The `ol.DEFAULT_TILE_CACHE_HIGH_WATER_MARK` define has been removed. The size of the cache can now be defined on every tile based `ol.source`:
```js
new ol.layer.Tile({
  source: new ol.source.OSM({
    cacheSize: 128
  })
})
```
The default cache size is `2048`.

### v3.14.0

#### Internet Explorer 9 support

As of this release, OpenLayers requires a `requestAnimationFrame`/`cancelAnimationFrame` polyfill for IE 9 support. See http://cdn.polyfill.io/v2/docs/features/#requestAnimationFrame.

#### Layer pre-/postcompose event changes

It is the responsibility of the application to undo any canvas transform changes at the end of a layer 'precompose' or 'postcompose' handler. Previously, it was ok to set a null transform. The API now guarantees a device pixel coordinate system on the canvas with its origin in the top left corner of the map. However, applications should not rely on the underlying canvas being the same size as the visible viewport.

Old code:
```js
layer.on('precompose', function(e) {
  // rely on canvas dimensions to move coordinate origin to center
  e.context.translate(e.context.canvas.width / 2, e.context.canvas.height / 2);
  e.context.scale(3, 3);
  // draw an x in the center of the viewport
  e.context.moveTo(-20, -20);
  e.context.lineTo(20, 20);
  e.context.moveTo(-20, 20);
  e.context.lineTo(20, -20);
  // rely on the canvas having a null transform
  e.context.setTransform(1, 0, 0, 1, 0, 0);
});
```
New code:
```js
layer.on('precompose', function(e) {
  // use map size and pixel ratio to move coordinate origin to center
  var size = map.getSize();
  var pixelRatio = e.frameState.pixelRatio;
  e.context.translate(size[0] / 2 * pixelRatio, size[1] / 2 * pixelRatio);
  e.context.scale(3, 3);
  // draw an x in the center of the viewport
  e.context.moveTo(-20, -20);
  e.context.lineTo(20, 20);
  e.context.moveTo(-20, 20);
  e.context.lineTo(20, -20);
  // undo all transforms
  e.context.scale(1 / 3, 1 / 3);
  e.context.translate(-size[0] / 2 * pixelRatio, -size[1] / 2 * pixelRatio);
});
```

### v3.13.0

#### `proj4js` integration

Before this release, OpenLayers depended on the global proj4 namespace. When using a module loader like Browserify, you might not want to depend on the global `proj4` namespace. You can use the `ol.proj.setProj4` function to set the proj4 function object. For example in a browserify ES6 environment:

```js
import ol from 'openlayers';
import proj4 from 'proj4';
ol.proj.setProj4(proj4);
```

#### `ol.source.TileJSON` changes

The `ol.source.TileJSON` now uses `XMLHttpRequest` to load the TileJSON instead of JSONP with callback.
When using server without proper CORS support, `jsonp: true` option can be passed to the constructor to get the same behavior as before:
```js
new ol.source.TileJSON({
  url: 'http://serverwithoutcors.com/tilejson.json',
  jsonp: true
})
```
Also for Mapbox v3, make sure you use urls ending with `.json` (which are able to handle both `XMLHttpRequest` and JSONP) instead of `.jsonp`.

### v3.12.0

#### `ol.Map#forEachFeatureAtPixel` changes

The optional `layerFilter` function is now also called for unmanaged layers. To get the same behaviour as before, wrap your layer filter code in an if block like this:
```js
function layerFilter(layer) {
  if (map.getLayers().getArray().indexOf(layer) !== -1) {
    // existing layer filter code
  }
}
```

### v3.11.0

#### `ol.format.KML` changes

KML icons are scaled 50% so that the rendering better matches Google Earth rendering.

If a KML placemark has a name and is a point, an `ol.style.Text` is created with the name displayed to the right of the icon (if there is an icon).
This can be controlled with the showPointNames option which defaults to true.

To disable rendering of the point names for placemarks, use the option:
new ol.format.KML({ showPointNames: false });


#### `ol.interaction.DragBox` and `ol.interaction.DragZoom` changes

Styling is no longer done with `ol.Style`, but with pure CSS. The `style` constructor option is no longer required, and no longer available. Instead, there is a `className` option for the CSS selector. The default for `ol.interaction.DragBox` is `ol-dragbox`, and `ol.interaction.DragZoom` uses `ol-dragzoom`. If you previously had
```js
new ol.interaction.DragZoom({
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'red',
      width: 3
    }),
    fill: new ol.style.Fill({
      color: [255, 255, 255, 0.4]
    })
  })
});
```
you'll now just need
```js
new ol.interaction.DragZoom();
```
but with additional css:
```css
.ol-dragzoom {
  border-color: red;
  border-width: 3px;
  background-color: rgba(255,255,255,0.4);
}
```

#### Removal of `ol.source.TileVector`

With the introduction of true vector tile support, `ol.source.TileVector` becomes obsolete. Change your code to use `ol.layer.VectorTile` and `ol.source.VectorTile` instead of `ol.layer.Vector` and `ol.source.TileVector`.

#### `ol.Map#forEachFeatureAtPixel` changes for unmanaged layers

`ol.Map#forEachFeatureAtPixel` will still be called for unmanaged layers, but the 2nd argument to the callback function will be `null` instead of a reference to the unmanaged layer. This brings back the behavior of the abandoned `ol.FeatureOverlay` that was replaced by unmanaged layers.

If you are affected by this change, please change your unmanaged layer to a regular layer by using e.g. `ol.Map#addLayer` instead of `ol.layer.Layer#setMap`.

### v3.10.0

#### `ol.layer.Layer` changes

The experimental `setHue`, `setContrast`, `setBrightness`, `setSaturation`, and the corresponding getter methods have been removed.  These properties only worked with the WebGL renderer.  If are interested in applying color transforms, look for the `postcompose` event in the API docs.  In addition, the `ol.source.Raster` source provides a way to create new raster data based on arbitrary transforms run on any number of input sources.

### v3.9.0

#### `ol.style.Circle` changes

The experimental `getAnchor`, `getOrigin`, and `getSize` methods have been removed.  The anchor and origin of a circle symbolizer are not modifiable, so these properties should not need to be accessed.  The radius and stroke width can be used to calculate the rendered size of a circle symbolizer if needed:

```js
// calculate rendered size of a circle symbolizer
var width = 2 * circle.getRadius();
if (circle.getStroke()) {
  width += circle.getStroke().getWidth() + 1;
}
```

### v3.8.0

There should be nothing special required when upgrading from v3.7.0 to v3.8.0.

### v3.7.0

#### Removal of `ol.FeatureOverlay`

Instead of an `ol.FeatureOverlay`, we now use an `ol.layer.Vector` with an
`ol.source.Vector`. If you previously had:
```js
var featureOverlay = new ol.FeatureOverlay({
  map: map,
  style: overlayStyle
});
featureOverlay.addFeature(feature);
featureOverlay.removeFeature(feature);
var collection = featureOverlay.getFeatures();
```
you will have to change this to:
```js
var collection = new ol.Collection();
var featureOverlay = new ol.layer.Vector({
  map: map,
  source: new ol.source.Vector({
    features: collection,
    useSpatialIndex: false // optional, might improve performance
  }),
  style: overlayStyle,
  updateWhileAnimating: true, // optional, for instant visual feedback
  updateWhileInteracting: true // optional, for instant visual feedback
});
featureOverlay.getSource().addFeature(feature);
featureOverlay.getSource().removeFeature(feature);
```

With the removal of `ol.FeatureOverlay`, `zIndex` symbolizer properties of overlays are no longer stacked per map, but per layer/overlay. If you previously had multiple feature overlays where you controlled the rendering order of features by using `zIndex` symbolizer properties, you can now achieve the same rendering order only if all overlay features are on the same layer.

Note that `ol.FeatureOverlay#getFeatures()` returned an `{ol.Collection.<ol.Feature>}`, whereas `ol.source.Vector#getFeatures()` returns an `{Array.<ol.Feature>}`.

#### `ol.TileCoord` changes

Until now, the API exposed two different types of `ol.TileCoord` tile coordinates: internal ones that increase left to right and upward, and transformed ones that may increase downward, as defined by a transform function on the tile grid. With this change, the API now only exposes tile coordinates that increase left to right and upward.

Previously, tile grids created by OpenLayers either had their origin at the top-left or at the bottom-left corner of the extent. To make it easier for application developers to transform tile coordinates to the common XYZ tiling scheme, all tile grids that OpenLayers creates internally have their origin now at the top-left corner of the extent.

This change affects applications that configure a custom `tileUrlFunction` for an `ol.source.Tile`. Previously, the `tileUrlFunction` was called with rather unpredictable tile coordinates, depending on whether a tile coordinate transform took place before calling the `tileUrlFunction`. Now it is always called with OpenLayers tile coordinates. To transform these into the common XYZ tiling scheme, a custom `tileUrlFunction` has to change the `y` value (tile row) of the `ol.TileCoord`:
```js
function tileUrlFunction = function(tileCoord, pixelRatio, projection) {
  var urlTemplate = '{z}/{x}/{y}';
  return urlTemplate
      .replace('{z}', tileCoord[0].toString())
      .replace('{x}', tileCoord[1].toString())
      .replace('{y}', (-tileCoord[2] - 1).toString());
}
```

The `ol.tilegrid.TileGrid#createTileCoordTransform()` function which could be used to get the tile grid's tile coordinate transform function has been removed. This function was confusing and should no longer be needed now that application developers get tile coordinates in a known layout.

The code snippets below show how your application code needs to be changed:

Old application code (with `ol.tilegrid.TileGrid#createTileCoordTransform()`):
```js
var transform = source.getTileGrid().createTileCoordTransform();
var tileUrlFunction = function(tileCoord, pixelRatio, projection) {
  tileCoord = transform(tileCoord, projection);
  return 'http://mytiles.com/' +
      tileCoord[0] + '/' + tileCoord[1] + '/' + tileCoord[2] + '.png';
};
```
Old application code (with custom `y` transform):
```js
var tileUrlFunction = function(tileCoord, pixelRatio, projection) {
  var z = tileCoord[0];
  var yFromBottom = tileCoord[2];
  var resolution = tileGrid.getResolution(z);
  var tileHeight = ol.size.toSize(tileSize)[1];
  var matrixHeight =
      Math.floor(ol.extent.getHeight(extent) / tileHeight / resolution);
  return 'http://mytiles.com/' +
      tileCoord[0] + '/' + tileCoord[1] + '/' +
      (matrixHeight - yFromBottom - 1) + '.png';

};
```
New application code (simple -y - 1 transform):
```js
var tileUrlFunction = function(tileCoord, pixelRatio, projection) {
  return 'http://mytiles.com/' +
      tileCoord[0] + '/' + tileCoord[1] + '/' + (-tileCoord[2] - 1) + '.png';
};
```

#### Removal of `ol.tilegrid.Zoomify`

The replacement of `ol.tilegrid.Zoomify` is a plain `ol.tilegrid.TileGrid`, configured with `extent`, `origin` and `resolutions`. If the `size` passed to the `ol.source.Zoomify` source is `[width, height]`, then the extent for the tile grid will be `[0, -height, width, 0]`, and the origin will be `[0, 0]`.

#### Replace `ol.View.fitExtent()` and `ol.View.fitGeometry()` with `ol.View.fit()`
* This combines two previously distinct functions into one more flexible call which takes either a geometry or an extent.
* Rename all calls to `fitExtent` and `fitGeometry` to `fit`.

#### Change to `ol.interaction.Modify`

When single clicking a line or boundary within the `pixelTolerance`, a vertex is now created.

### v3.6.0

#### `ol.interaction.Draw` changes

* The `minPointsPerRing` config option has been renamed to `minPoints`. It is now also available for linestring drawing, not only for polygons.
* The `ol.DrawEvent` and `ol.DrawEventType` types were renamed to `ol.interaction.DrawEvent` and `ol.interaction.DrawEventType`. This has an impact on your code only if your code is compiled together with ol3.

#### `ol.tilegrid` changes

* The `ol.tilegrid.XYZ` constructor has been replaced by a static `ol.tilegrid.createXYZ()` function. The `ol.tilegrid.createXYZ()` function takes the same arguments as the previous `ol.tilegrid.XYZ` constructor, but returns an `ol.tilegrid.TileGrid` instance.
* The internal tile coordinate scheme for XYZ sources has been changed. Previously, the `y` of tile coordinates was transformed to the coordinates used by sources by calculating `-y-1`. Now, it is transformed by calculating `height-y-1`, where height is the number of rows of the tile grid at the zoom level of the tile coordinate.
* The `widths` constructor option of `ol.tilegrid.TileGrid` and subclasses is no longer available, and it is no longer necessary to get proper wrapping at the 180° meridian. However, for `ol.tilegrid.WMTS`, there is a new option `sizes`, where each entry is an `ol.Size` with the `width` ('TileMatrixWidth' in WMTS capabilities) as first and the `height` ('TileMatrixHeight') as second entry of the array. For other tile grids, users can
now specify an `extent` instead of `widths`. These settings are used to restrict the range of tiles that sources will request.
* For `ol.source.TileWMS`, the default value of `warpX` used to be `undefined`, meaning that WMS requests with out-of-extent tile BBOXes would be sent. Now `wrapX` can only be `true` or `false`, and the new default is `true`. No application code changes should be required, but the resulting WMS requests for out-of-extent tiles will no longer use out-of-extent BBOXes, but ones that are shifted to real-world coordinates.

### v3.5.0

#### `ol.Object` and `bindTo`

* The following experimental methods have been removed from `ol.Object`: `bindTo`, `unbind`, and `unbindAll`.  If you want to get notification about `ol.Object` property changes, you can listen for the `'propertychange'` event (e.g. `object.on('propertychange', listener)`).  Two-way binding can be set up at the application level using property change listeners.  See [#3472](https://github.com/openlayers/ol3/pull/3472) for details on the change.

* The experimental `ol.dom.Input` component has been removed.  If you need to synchronize the state of a dom Input element with an `ol.Object`, this can be accomplished using listeners for change events.  For example, you might bind the state of a checkbox type input with a layer's visibility like this:

  ```js
  var layer = new ol.layer.Tile();
  var checkbox = document.querySelector('#checkbox');

  checkbox.addEventListener('change', function() {
    var checked = this.checked;
    if (checked !== layer.getVisible()) {
      layer.setVisible(checked);
    }
  });

  layer.on('change:visible', function() {
    var visible = this.getVisible();
    if (visible !== checkbox.checked) {
      checkbox.checked = visible;
    }
  });
  ```

#### New Vector API

* The following experimental vector classes have been removed: `ol.source.GeoJSON`, `ol.source.GML`, `ol.source.GPX`, `ol.source.IGC`, `ol.source.KML`, `ol.source.OSMXML`, and `ol.source.TopoJSON`. You now will use `ol.source.Vector` instead.

  For example, if you used `ol.source.GeoJSON` as follows:

  ```js
  var source = new ol.source.GeoJSON({
    url: 'features.json',
    projection: 'EPSG:3857'
  });
  ```

  you will need to change your code to:

  ```js
  var source = new ol.source.Vector({
    url: 'features.json',
    format: new ol.format.GeoJSON()
  });
  ```

  See http://openlayers.org/en/master/examples/vector-layer.html for a real example.

  Note that you no longer need to set a `projection` on the source!

  Previously the vector data was loaded at source construction time, and, if the data projection and the source projection were not the same, the vector data was transformed to the source projection before being inserted (as features) into the source.

  The vector data is now loaded at render time, when the view projection is known. And the vector data is transformed to the view projection if the data projection and the source projection are not the same.

  If you still want to "eagerly" load the source you will use something like this:

  ```js
  var source = new ol.source.Vector();
  $.ajax('features.json').then(function(response) {
    var geojsonFormat = new ol.format.GeoJSON();
    var features = geojsonFormat.readFeatures(response,
        {featureProjection: 'EPSG:3857'});
    source.addFeatures(features);
  });
  ```

  The above code uses jQuery to send an Ajax request, but you can obviously use any Ajax library.

  See http://openlayers.org/en/master/examples/igc.html for a real example.

* Note about KML

  If you used `ol.source.KML`'s `extractStyles` or `defaultStyle` options, you will now have to set these options on `ol.format.KML` instead. For example, if you used:

  ```js
  var source = new ol.source.KML({
    url: 'features.kml',
    extractStyles: false,
    projection: 'EPSG:3857'
  });
  ```

  you will now use:

  ```js
  var source = new ol.source.Vector({
    url: 'features.kml',
    format: new ol.format.KML({
      extractStyles: false
    })
  });
  ```

* The `ol.source.ServerVector` class has been removed. If you used it, for example as follows:

  ```js
  var source = new ol.source.ServerVector({
    format: new ol.format.GeoJSON(),
    loader: function(extent, resolution, projection) {
      var url = …;
      $.ajax(url).then(function(response) {
        source.addFeatures(source.readFeatures(response));
      });
    },
    strategy: ol.loadingstrategy.bbox,
    projection: 'EPSG:3857'
  });
  ```

  you will need to change your code to:

  ```js
  var source = new ol.source.Vector({
    loader: function(extent, resolution, projection) {
      var url = …;
      $.ajax(url).then(function(response) {
        var format = new ol.format.GeoJSON();
        var features = format.readFeatures(response,
            {featureProjection: projection});
        source.addFeatures(features);
      });
    },
    strategy: ol.loadingstrategy.bbox
  });
  ```

  See http://openlayers.org/en/master/examples/vector-osm.html for a real example.

* The experimental `ol.loadingstrategy.createTile` function has been renamed to `ol.loadingstrategy.tile`. The signature of the function hasn't changed. See http://openlayers.org/en/master/examples/vector-osm.html for an example.

#### Change to `ol.style.Icon`

* When manually loading an image for `ol.style.Icon`, the image size should now be set
with the `imgSize` option and not with `size`. `size` is supposed to be used for the
size of a sub-rectangle in an image sprite.

#### Support for non-square tiles

The return value of `ol.tilegrid.TileGrid#getTileSize()` will now be an `ol.Size` array instead of a number if non-square tiles (i.e. an `ol.Size` array instead of a number as `tilsSize`) are used. To always get an `ol.Size`, the new `ol.size.toSize()` was added.

#### Change to `ol.interaction.Draw`

When finishing a draw, the `drawend` event is now dispatched before the feature is inserted to either the source or the collection. This change allows application code to finish setting up the feature.

#### Misc.

If you compile your application together with the library and use the `ol.feature.FeatureStyleFunction` type annotation (this should be extremely rare), the type is now named `ol.FeatureStyleFunction`.

### v3.4.0

There should be nothing special required when upgrading from v3.3.0 to v3.4.0.

### v3.3.0

* The `ol.events.condition.mouseMove` function was replaced by `ol.events.condition.pointerMove` (see [#3281](https://github.com/openlayers/ol3/pull/3281)). For example, if you use `ol.events.condition.mouseMove` as the condition in a `Select` interaction then you now need to use `ol.events.condition.pointerMove`:

  ```js
  var selectInteraction = new ol.interaction.Select({
    condition: ol.events.condition.pointerMove
    // …
  });
  ```
