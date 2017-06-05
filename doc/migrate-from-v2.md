---
title: Migrating from OpenLayers v2.x to OpenLayers v3.x
layout: doc.hbs
---

# Migrating from OpenLayers v2.x to OpenLayers v3.x

OpenLayers v3 is a complete rewrite from scratch and has a completely different
API than the previous major version 2.x. The task of migrating an existing
OpenLayers 2 application to now work on top of OpenLayers 3 is a challenging
one, but we try to make the conversion smooth by highlighting some of the key
changes and differences between version 2 and 3.

Throughout this document...

* ... **v2** and **version 2** references OpenLayers 2.x (latest stable version)
* ... **v3** and **version 3** references OpenLayers 3.x (latest stable version)

## The namespace

Version 2 of OpenLayers contained all classes in the namespace `OpenLayers`,
version 3 now uses `ol` as namespace for its classes.

## The main classes

In OpenLayers 2 applications would most likely deal with the following classes:

* `OpenLayers.Map` A map in OpenLayers v2 was sort of a container, which would
  be of use only when layers and controls were added to it. Additionally one
  could configure projections, the start center etc. when constructing a map.
  Over the years in which version 2 existed, more and more functionality was
  put on the map, and sometimes confusing results were expected. So for example
  one could configure a projection on a map and one on a layer, and one was
  surprised, which setting would eventually win.
* `OpenLayers.Layer.*` A map in v2 was built out of a stack of layers arranged
  on top of each other. All layers shared common functionality, and specific
  subclasses would extend that functionality for their needs. The constructor
  of layers would always accept at least two parameters. The first parameter of
  any layer constructor was the name of the layer, and the last parameter was a
  configuration object, which allowed to override specific properties of the
  layer-class. Some constructors (e.g. `OpenLayers.Layer.WMS`) would allow more
  parameters for the instantiation, but one could rely on the first and last
  parameter. This led to quite complicated code when using different types of
  layers, as the number of arguments to the constructors varied.
* `OpenLayers.Control.*` In order to interact with the map and its
  layers, controls could be added to the map. Some of the controls would render
  markup, others would capture user interactions, some would manipulate internal
  state of the map according to URL parameters. Controls were used to do awesome
  things, but the behaviour sometimes was hard to predict, especially when
  multiple instances of controls listening to the same input would be active at
  the same time. For those controls that created DOM elements, the appropriate
  visual styling sometimes was harder than expected.

In OpenLayers v3, this structure is somehow still present, with some important
changes to keep in mind:

* `ol.Map` in v3 the map is still there, and now can be configured with a
  *`view`*, a set of *`layers`*, some *`interactions`* and *`controls`*. All
  these parts will be explained now.
* `ol.View` represents the 2D-view of the map. You set properties like center,
  projection etc. here, and you should query the view when you want to retrieve
  these values later.
* `ol.layer.*` Layers aren't so different from their counterparts in
  OpenLayers v2. There is one very important change though. A layer now has a
  `source`, which  gives us the possibility of dividing the source specific
  properties from the layer specific ones (e.g. the visual representation). In
  OpenLayers v2 the layer classes would mix these concerns sometimes while in v3
  we try to be strict in this differentiation. Also layers aren't divided into
  baselayers and overlays any more.
* `ol.interaction.*` Interactions react to user input and change the
  state of the map. They do not render DOM elements, some may render features on
  the map, though.
* `ol.control.*` A control is a visible widget with a DOM element in a
  fixed position on the screen. They can involve user input (buttons), or be
  informational only. Their position is determined using CSS. What were controls
  in OpenLayers v2 can be an interaction or a control in OpenLayers v3.

## Consistency

OpenLayers v3 tries to be very consistent in the API design. For example:

In OpenLayers v2 certain properties would have getters, e.g. to get the
zoomlevel of a map, one could use the following code:

```javascript
var map = new Openlayers.Map( /* config */ );
var zoom = map.getZoom();
// sadly, map.setZoom does not exist
```

The appropriate setter for the `zoom` property was missing though. In practice
people would then use another method for setting the zoom (e.g. `setCenter`) or
manipulate the property on the instance directly (e.g. `map.zoom = 5;`).

OpenLayers v3 tries to be more consistent here. Usually (most cases) you will
find a setter for a property where we also have a getter:

```javascript
var map = new ol.Map( /* config */ );
var zoom = map.getView().getZoom();
// map.getView().setZoom()
```

If there is no such setter, we consider the property to be read-only.

Most classes in OpenLayers v3 also inherit from the ol.Object class, which gives
them a generic getter and setter for arbitrary properties. These can also be
monitored for change events:

```javascript
var map = new ol.Map( /* config */ );
map.on('change:humpty', function()({ /* handle the new value for humpty */ });
map.set('humpty', 123);
map.get('humpty');
map.set('humpty', 456);
```

## Examples

Let's have a look at some of the examples of OpenLayers v2 and see how we can
write these as Openlayers v3 examples.

### WMS layer

The code behind the [OpenLayers 2 WMS
example](http://dev.openlayers.org/examples/wms.html) mainly is:

```javascript
var lon = 5;
var lat = 40;
var zoom = 5;
var map, layer;

function init(){
    map = new OpenLayers.Map( 'map' );
    layer = new OpenLayers.Layer.WMS( "OpenLayers WMS",
            "http://vmap0.tiles.osgeo.org/wms/vmap0", {layers: 'basic'} );
    map.addLayer(layer);

    map.setCenter(new OpenLayers.LonLat(lon, lat), zoom);
}
```

Rewritten against the new API this becomes:

```javascript
var lon = 5;
var lat = 40;
var zoom = 5;
var map, layer;

function init(){
  layer = new ol.layer.Tile({
    source: new ol.source.TileWMS({
      url: 'http://vmap0.tiles.osgeo.org/wms/vmap0',
      params: { LAYERS: 'basic' }
    })
  });

  map = new ol.Map({
    layers: [layer],
    target: 'map',
    view: new ol.View({
      center: [lon, lat],
      zoom: zoom,
      projection: 'EPSG:4326'
    })
  });
}
```

The layer is configured to be an `ol.layer.Tile`, and we only specify a source
for it. The `ol.source.TileWMS` only needs the `url` and some `params` to be
able to create appropriate `GetMap`-urls. The `ol.Map` only has its `layers``
set, defines a render-`target` and configures the `view`.

One can observe two more differences between the result of OpenLayers v2 and the
one based on OpenLayers v3:

* The default projection of a map (or its view) changed: in v2 we default to
  `EPSG:4326` (longitude/latitude), while v3 defaults to the metric web mercator
  projection (`EPSG:3857`), the projection used by e.g. OpenStreetMap and other
  tile providers.
* The default WMS version to be used for interacting with the Web Map Server
  changed: in v2 the GetMap-requests contained `VERSION=1.1.1`, while in v3 we
  find `VERSION=1.3.0`.

Even though the newer version is slightly longer, it has a clearer separation
of concerns.

### OSM layer

The code behind the [OpenLayers 2 OSM
example](http://dev.openlayers.org/examples/osm.html) mainly is:

```javascript
var map, layer;
function init(){
    map = new OpenLayers.Map( 'map' );
    layer = new OpenLayers.Layer.OSM( "Simple OSM Map");
    map.addLayer(layer);
    map.setCenter(
        new OpenLayers.LonLat(-71.147, 42.472).transform(
            new OpenLayers.Projection("EPSG:4326"),
            map.getProjectionObject()
        ), 12
    );
}
```

Rewritten against the new API this becomes:

```javascript
var map, layer;
function init(){
  var layer = new ol.layer.Tile({
    source: new ol.source.OSM()
  });
  var map = new ol.Map({
    layers: [layer],
    target: 'map',
    view: new ol.View({
      center: ol.proj.transform([-71.147, 42.472], 'EPSG:4326', 'EPSG:3857'),
      zoom: zoom
    })
  });
}
```

In OpenLayers 2 we had a special layer for OSM, where in version v3 it is
simply a tiled layer (hence `ol.layer.Tile`) configured with the correct source.

The transformation of coordinates in `EPSG:4326` to the projection used by OSM
is also a lot more readable than it was in OpenLayers 2.

## Classes from version 2 and their version 3 equivalent

<table>
  <thead>
    <tr>
      <th>OpenLayers v2</th>
      <th>OpenLayers v3</th>
      <th>Notes, Example</th>
    </tr>
  </thead>
  <tbody>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/BaseTypes/Bounds-js.html">
          <code>OpenLayers.Bounds</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.html#Extent">
          <code>ol.Extent</code>
        </a> (type definition),
        <a href="http://openlayers.org/en/master/apidoc/ol.extent.html">
          <code>ol.extent.*</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/BaseTypes-js.html">
          <code>OpenLayers.String</code>,<br />
          <code>OpenLayers.Number</code>,<br />
          <code>OpenLayers.Function</code>,<br />
          <code>OpenLayers.Array</code>
        </a>
      </td>
      <td>
        ✗
      </td>
      <td>
        Many libraries will give you this sort of general purpose functionality.
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/BaseTypes/Class-js.html">
          <code>OpenLayers.Class</code>
        </a>
      </td>
      <td>
        ✗
      </td>
      <td>
        We are no longer providing a generic `Class`-helper. You can of course
        extend existing classes
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/BaseTypes/Date-js.html">
          <code>OpenLayers.Date</code>
        </a>
      </td>
      <td>
        ✗
      </td>
      <td>
        Many libraries will give you this sort of general purpose functionality.
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/BaseTypes/Element-js.html">
          <code>OpenLayers.Element</code>
        </a>
      </td>
      <td>
        ✗
      </td>
      <td>
        Many libraries will give you this sort of general purpose functionality.
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/BaseTypes/LonLat-js.html">
          <code>OpenLayers.LonLat</code>
        </a>
      </td>
      <td>
        ~
        <a href="http://openlayers.org/en/master/apidoc/ol.html#Coordinate">
          <code>ol.Coordinate</code>
        </a> (type definition),
        <a href="http://openlayers.org/en/master/apidoc/ol.coordinate.html">
          <code>ol.coordinate.*</code>
        </a>
      </td>
      <td>
        v3 example: <code>[16, 48]</code>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/BaseTypes/Pixel-js.html">
          <code>OpenLayers.Pixel</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.html#Pixel">
          <code>ol.Pixel</code>
        </a> (type definition)
      </td>
      <td>
        v3 example: <code>[xCoord, yCoord]</code>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/BaseTypes/Size-js.html">
          <code>OpenLayers.Size</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.html#Size">
          <code>ol.Size</code>
        </a> (type definition)
      </td>
      <td>
        v3 example: <code>[width, height]</code>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/ArgParser-js.html">
          <code>OpenLayers.Control.ArgParser</code>
        </a>
      </td>
      <td>
        ✗
      </td>
      <td>
        Application code should implement this behaviour. Example wanted.
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/Attribution-js.html">
          <code>OpenLayers.Control.Attribution</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.Attribution.html">
          <code>ol.Attribution</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/Button-js.html">
          <code>OpenLayers.Control.Button</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/Panel-js.html">
          <code>OpenLayers.Control.Panel</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/EditingToolbar-js.html">
          <code>OpenLayers.Control.EditingToolbar</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/NavToolbar-js.html">
          <code>OpenLayers.Control.NavToolbar</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/PanPanel-js.html">
          <code>OpenLayers.Control.PanPanel</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/PanZoom-js.html">
          <code>OpenLayers.Control.PanZoom</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/PanZoomBar-js.html">
          <code>OpenLayers.Control.PanZoomBar</code>
        </a>
      </td>
      <td>
        ✗
      </td>
      <td>
        Application code is responsible for this sort of behaviour
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/CacheRead-js.html">
          <code>OpenLayers.Control.CacheRead</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/CacheWrite-js.html">
          <code>OpenLayers.Control.CacheWrite</code>
        </a>
      </td>
      <td>
        ✗
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/DragFeature-js.html">
          <code>OpenLayers.Control.DragFeature</code>
        </a>
      </td>
      <td>
        ✗, see <a href="https://github.com/openlayers/ol3/pull/3250">#3250</a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/examples/drag-features.html">
          v3 example
        </a>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/DragPan-js.html">
          <code>OpenLayers.Control.DragPan</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.interaction.DragPan.html">
          <code>ol.interaction.DragPan</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/DrawFeature-js.html">
          <code>OpenLayers.Control.DrawFeature</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.interaction.Draw.html">
          <code>ol.interaction.Draw</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/DrawFeature-js.html">
          <code>OpenLayers.Control.Geolocate</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.Geolocation.html">
          <code>ol.Geolocation</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/GetFeature-js.html">
          <code>OpenLayers.Control.GetFeature</code>
        </a>
      </td>
      <td>
        ✗
      </td>
      <td>
        Compare <code>forEachFeature</code>,
        <code>forEachFeatureInExtent</code>, etc. of many sources and
        <code>forEachFeatureAtPixel</code> of <code>ol.Map</code>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/Graticule-js.html">
          <code>OpenLayers.Control.Graticule</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.Graticule.html">
          <code>ol.Graticule</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/KeyboardDefaults-js.html">
          <code>OpenLayers.Control.KeyboardDefaults</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.interaction.KeyboardPan.html">
          <code>ol.interaction.KeyboardPan</code>
        </a>, <br />
        <a href="http://openlayers.org/en/master/apidoc/ol.interaction.KeyboardZoom.html">
          <code>ol.interaction.KeyboardZoom</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/LayerSwitcher-js.html">
          <code>OpenLayers.Control.LayerSwitcher</code>
        </a>
      </td>
      <td>
        ✗
      </td>
      <td>
      Alternatively create inputs that are
        <a href="http://openlayers.org/en/master/examples/bind-input.html">bound
        to the layer visibility</a>. See also
        <a href="https://github.com/walkermatt/ol3-layerswitcher">OpenLayers 3
        LayerSwitcher</a> by <a href="https://github.com/walkermatt">Matt
        Walker</a>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/Measure-js.html">
          <code>OpenLayers.Control.Measure</code>
        </a>
      </td>
      <td>
        ✗
      </td>
      <td>
       Use <code>ol.interaction.Draw</code>: see the
       <a href="http://openlayers.org/en/master/examples/measure.html">measure
       example</a>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/KeyboardDefaults-js.html">
          <code>OpenLayers.Control.ModifyFeature</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.interaction.Modify.html">
          <code>ol.interaction.Modify</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/MousePosition-js.html">
          <code>OpenLayers.Control.MousePosition</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.control.MousePosition.html">
          <code>ol.control.MousePosition</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/Navigation-js.html">
          <code>OpenLayers.Control.Navigation</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.interaction.DoubleClickZoom.html">
          <code>ol.interaction.DoubleClickZoom</code>
        </a>, <br />
        <a href="http://openlayers.org/en/master/apidoc/ol.interaction.DragPan.html">
          <code>ol.interaction.DragPan</code>
        </a>, <br />
        <a href="http://openlayers.org/en/master/apidoc/ol.interaction.DragZoom.html">
          <code>ol.interaction.DragZoom</code>
        </a>, <br />
        <a href="http://openlayers.org/en/master/apidoc/ol.interaction.MouseWheelZoom.html">
          <code>ol.interaction.MouseWheelZoom</code>
        </a>, <br />
        <a href="http://openlayers.org/en/master/apidoc/ol.interaction.PinchZoom.html">
          <code>ol.interaction.PinchZoom</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/NavigationHistory-js.html">
          <code>OpenLayers.Control.NavigationHistory</code>
        </a>
      </td>
      <td>
        ✗
      </td>
      <td>
        Application code should handle the history of the application
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/OverviewMap-js.html">
          <code>OpenLayers.Control.OverviewMap</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.control.OverviewMap.html">
          <code>ol.control.OverviewMap</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/Pan-js.html">
          <code>OpenLayers.Control.Pan</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.interaction.DragPan.html">
          <code>ol.interaction.DragPan</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/Permalink-js.html">
          <code>OpenLayers.Control.Permalink</code>
        </a>
      </td>
      <td>
        ✗
      </td>
      <td>
        Application code should implement this behaviour. Example wanted.
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/PinchZoom-js.html">
          <code>OpenLayers.Control.PinchZoom</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.interaction.PinchZoom.html">
          <code>ol.interaction.PinchZoom</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/Scale-js.html">
          <code>OpenLayers.Control.Scale</code>
        </a>
      </td>
      <td>
        ✗
      </td>
      <td>
        Application code should implement this behaviour. Example wanted.
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/ScaleLine-js.html">
          <code>OpenLayers.Control.ScaleLine</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.interaction.ScaleLine.html">
          <code>ol.control.ScaleLine</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/SelectFeature-js.html">
          <code>OpenLayers.Control.SelectFeature</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.interaction.Select.html">
          <code>ol.interaction.Select</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/SLDSelect-js.html">
          <code>OpenLayers.Control.SLDSelect</code>
        </a>
      </td>
      <td>
        ✗
      </td>
      <td>
        Application code should implement this behaviour. Example wanted.
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/Snapping-js.html">
          <code>OpenLayers.Control.Snapping</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.interaction.Snap.html">
          <code>ol.interaction.Snap</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/Split-js.html">
          <code>OpenLayers.Control.Split</code>
        </a>
      </td>
      <td>
        ✗
      </td>
      <td>
        Application code should implement this behaviour. Example wanted.
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/TouchNavigation-js.html">
          <code>OpenLayers.Control.TouchNavigation</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.interaction.DoubleClickZoom.html">
          <code>ol.interaction.DoubleClickZoom</code>
        </a>, <br />
        <a href="http://openlayers.org/en/master/apidoc/ol.interaction.DragPan.html">
          <code>ol.interaction.DragPan</code>
        </a>, <br />
        <a href="http://openlayers.org/en/master/apidoc/ol.interaction.DragZoom.html">
          <code>ol.interaction.DragZoom</code>
        </a>, <br />
        <a href="http://openlayers.org/en/master/apidoc/ol.interaction.PinchZoom.html">
          <code>ol.interaction.PinchZoom</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/TransformFeature-js.html">
          <code>OpenLayers.Control.TransformFeature</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.interaction.Modify.html">
          <code>ol.interaction.Modify</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/UTFGrid-js.html">
          <code>OpenLayers.Control.UTFGrid</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.source.TileUTFGrid.html">
          <code>ol.source.TileUTFGrid</code>
        </a>
      </td>
      <td>
        See also the <a href="http://openlayers.org/en/master/examples/tileutfgrid.html">example</a>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/WMSGetFeatureInfo-js.html">
          <code>OpenLayers.Control.WMSGetFeatureInfo</code>
        </a>
      </td>
      <td>
        ✗
      </td>
      <td>
        Combine <code>forEachLayerAtPixel</code> of <code>ol.Map</code> with
        the format
        <code>WMSGetFeatureInfo</code>, <a
        href="http://openlayers.org/en/master/examples/getfeatureinfo-image.html">example</a>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/WMTSGetFeatureInfo-js.html">
          <code>OpenLayers.Control.WMTSGetFeatureInfo</code>
        </a>
      </td>
      <td>
        ✗
      </td>
      <td>
      </td>
    </tr>



    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/Zoom-js.html">
          <code>OpenLayers.Control.Zoom</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.interaction.Zoom.html">
          <code>ol.control.Zoom</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/ZoomBox-js.html">
          <code>OpenLayers.Control.ZoomBox</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.interaction.DragZoom.html">
          <code>ol.interaction.DragZoom</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/ZoomIn-js.html">
          <code>OpenLayers.Control.ZoomIn</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/ZoomIn-js.html">
          <code>OpenLayers.Control.ZoomOut</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Control/ZoomIn-js.html">
          <code>OpenLayers.Control.ZoomToMaxExtent</code>
        </a>
      </td>
      <td>
        ✗
      </td>
      <td>
        Application code should implement this behaviour.
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Feature/Vector-js.html">
          <code>OpenLayers.Feature.Vector</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.Feature_.html">
          <code>ol.Feature</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Filter-js.html">
          <code>OpenLayers.Filter</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Filter/Comparison-js.html">
          <code>OpenLayers.Filter.Comparison</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Filter/FeatureId-js.html">
          <code>OpenLayers.Filter.FeatureId</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Filter/Function-js.html">
          <code>OpenLayers.Filter.Function</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Filter/Logical-js.html">
          <code>OpenLayers.Filter.Logical</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Filter/Spatial-js.html">
          <code>OpenLayers.Filter.Spatial</code>
        </a>
      </td>
      <td>
        ✗
      </td>
      <td>
        Application code should implement this behaviour.
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Format-js.html">
          <code>OpenLayers.Format.*</code>
        </a>
      </td>
      <td>
        We have certain formats which mostly represent features: e.g.:<br/>
        <a href="http://openlayers.org/en/master/apidoc/ol.format.GML2.html">
          <code>ol.format.GML2</code>
        </a>, <br />
        <a href="http://openlayers.org/en/master/apidoc/ol.format.GML3.html">
          <code>ol.format.GML3</code>
        </a>, <br />
        <a href="http://openlayers.org/en/master/apidoc/ol.format.GeoJSON.html">
          <code>ol.format.GeoJSON</code>
        </a>, <br />
        <a href="http://openlayers.org/en/master/apidoc/ol.format.KML.html">
          <code>ol.format.KML</code>
        </a>, &hellip;<br />
        and there is e.g.
        <a href="http://openlayers.org/en/master/apidoc/ol.format.WMSCapabilities .html">
          <code>ol.format.WMSCapabilities</code>
        </a>, <br />
        <a href="http://openlayers.org/en/master/apidoc/ol.format.WMTSCapabilities.html">
          <code>ol.format.WMTSCapabilities</code>
        </a>
      </td>
      <td>
        It is rather unlikely that we'll ever support as many formats as v2 did.
        <br /><br />For other formats a look at
        <a href="https://github.com/highsource/jsonix">jsonix</a> /
        <a href="https://github.com/OSGeo/ows.js">ows.js</a> may prove useful.
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Geometry-js.html">
          <code>OpenLayers.Geometry.*</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.geom.html">
          <code>ol.geom.*</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Handler-js.html">
          <code>OpenLayers.Handler.*</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.interaction.html">
          <code>ol.interaction.*</code>
        </a>
      </td>
      <td>
        What was a <code>Handler</code> in v2 is replaced by functionality that
        <code>ol.interaction</code> now provides.
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Lang-js.html">
          <code>OpenLayers.Lang.*</code>
        </a>
      </td>
      <td>
        ✗
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/Google-js.html">
          <code>OpenLayers.Layer.ArcGISCache</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/Google-js.html">
          <code>OpenLayers.Layer.ArcGIS93Rest</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/Google-js.html">
          <code>OpenLayers.Layer.ArcIMS</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.source.TileArcGISRest.html">
          <code>ol.source.TileArcGISRest</code>
        </a>, other Arc* formats / sources may follow
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/Bing-js.html">
          <code>OpenLayers.Layer.Bing</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.source.BingMaps.html">
          <code>ol.source.BingMaps</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/Boxes-js.html">
          <code>OpenLayers.Layer.Boxes</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/EventPane-js.html">
          <code>OpenLayers.Layer.EventPane</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/FixedZoomLevels-js.html">
          <code>OpenLayers.Layer.FixedZoomLevels</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/PointGrid-js.html">
          <code>OpenLayers.Layer.PointGrid</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/PointTrack-js.html">
          <code>OpenLayers.Layer.PointTrack</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/Text-js.html">
          <code>OpenLayers.Layer.Text</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/HTTPRequest-js.html">
          <code>OpenLayers.Layer.HTTPRequest</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/Grid-js.html">
          <code>OpenLayers.Layer.Grid</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/SphericalMercator-js.html">
          <code>OpenLayers.Layer.SphericalMercator</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/TileCache-js.html">
          <code>OpenLayers.Layer.TileCache</code>
        </a>
      </td>
      <td>
        ✗
      </td>
      <td>
        These layer types don't have a direct replacement in v3
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/GeoRSS-js.html">
          <code>OpenLayers.Layer.GeoRSS</code>
        </a>
      </td>
      <td>
        ✗
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/Google-js.html">
          <code>OpenLayers.Layer.Google</code>
        </a>
      </td>
      <td>
        ✗
      </td>
      <td>
        Alternatively use
        <a href="http://openlayers.org/en/master/examples/bing-maps.html">Bing</a>,
        or contact Google sales for direct access to their tiles. Once you have
        that <code>ol.source.XYZ</code> can be of use.
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/Image-js.html">
          <code>OpenLayers.Layer.Image</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.source.ImageStatic.html">
          <code>ol.source.ImageStatic</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/KaMap-js.html">
          <code>OpenLayers.Layer.KaMap</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/KaMapCache-js.html">
          <code>OpenLayers.Layer.KaMapCache</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/MapServer-js.html">
          <code>OpenLayers.Layer.MapServer</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/Markers-js.html">
          <code>OpenLayers.Layer.Markers</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/WorldWind-js.html">
          <code>OpenLayers.Layer.WorldWind</code>
        </a>

      </td>
      <td>
        ✗
      </td>
      <td>
        These layer types don't have a direct replacement in v3
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/MapGuide-js.html">
          <code>OpenLayers.Layer.MapGuide</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.source.ImageMapGuide.html">
          <code>ol.source.ImageMapGuide</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/OSM-js.html">
          <code>OpenLayers.Layer.OSM</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.source.OSM.html">
          <code>ol.source.OSM</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/TileCache-js.html">
          <code>OpenLayers.Layer.TileCache</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.source.OSM.html">
          <code>ol.source.OSM</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/TMS-js.html">
          <code>OpenLayers.Layer.TMS</code>
        </a>
      </td>
      <td>
        see
        <a href="http://openlayers.org/en/master/apidoc/ol.source.XYZ.html">
          <code>ol.source.XYZ</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/Vector-js.html">
          <code>OpenLayers.Layer.Vector</code>
        </a>
      </td>
      <td>
        see
        <a href="http://openlayers.org/en/master/apidoc/ol.layer.Vector.html">
          <code>ol.layer.Vector</code>
          with various sources
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/WMS-js.html">
          <code>OpenLayers.Layer.WMS</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.source.ImageWMS.html">
          <code>ol.source.ImageWMS</code>
        </a>, <br />
        <a href="http://openlayers.org/en/master/apidoc/ol.source.TileWMS.html">
          <code>ol.source.TileWMS</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/WMS-js.html">
          <code>OpenLayers.Layer.WMTS</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.source.WMTS.html">
          <code>ol.source.WMTS</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/XYZ-js.html">
          <code>OpenLayers.Layer.XYZ</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.source.XYZ.html">
          <code>ol.source.XYZ</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/Zoomify-js.html">
          <code>OpenLayers.Layer.Zoomify</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.source.Zoomify.html">
          <code>ol.source.Zoomify</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/UTFGrid-js.html">
          <code>OpenLayers.Layer.UTFGrid</code>
        </a>
      </td>
      <td>
        <a href="http://openlayers.org/en/master/apidoc/ol.source.TileUTFGrid.html">
          <code>ol.source.TileUTFGrid</code>
        </a>
      </td>
      <td>
      </td>
    </tr>

    <tr>
      <td>
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/UTFGrid-js.html">
          <code>OpenLayers.Marker</code>
        </a>, <br />
        <a href="http://dev.openlayers.org/releases/OpenLayers-2.13.1/doc/apidocs/files/OpenLayers/Layer/UTFGrid-js.html">
          <code>OpenLayers.Popup</code>
        </a>
      </td>
      <td>
        ✗
      </td>
      <td>
        Have a look at the
        <a href="http://openlayers.org/en/master/examples/overlay.html">overlay example</a>
        and the <a href="http://openlayers.org/en/master/examples/popup.html">popup example</a>
      </td>
    </tr>

  </tbody>
</table>


