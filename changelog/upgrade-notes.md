## Upgrade notes

### v3.6.0

#### `ol.interaction.Draw` changes

* The `minPointsPerRing` config option has been renamed to `minPoints`. It is now also available for linestring drawing, not only for polygons.

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
