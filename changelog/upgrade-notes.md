## Upgrade notes

### v3.11.0

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
