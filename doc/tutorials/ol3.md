CLASS HIERARCHY
===============

```
goog.math.Coordinate  // Simple 2D point
|
+- TileCoord

goog.math.Box
|
+- Extent // The extent of a single object in two dimensions, projection not stored
|
+- TileBounds  // A range of tiles in two dimensions, integer coordinates, z not stored


Projection


goog.events.EventTarget
|
+- MVCObject
|  |
|  +- Camera
|  |
|  +- Control
|  |  |
|  |  +- ?
|  |
|  +- Layer
|  |  |
|  |  +- TileLayer
|  |  |  |
|  |  |  +- TMSTileLayer
|  |  |  |
|  |  |  +- WMTSTileLayer
|  |  |  |
|  |  |  +- XYZTileLayer / OSMTileLayer
|  |  |
|  |  +- VectorLayer
|  |  |
|  |  +- ImageLayer
|  |
|  +- LayerRenderer
|  |
|  +- LayerRendererOptions
|  |
|  +- Map
|  |
|  +- MapRenderer
|  |  |
|  |  +- HTMLMapRenderer
|  |  |
|  |  +- WebGLMapRenderer
|  |
|  +- MVCArray
|  |  |
|  |  +- ControlArray
|  |  |
|  |  +- LayerViewArray
|
|  +- TileQueue
|
+- Tile
```


Layer renderer hierarchy
------------------------

```
goog.events.EventTarget
|
+- MVCObject
   |
   +- LayerRenderer
      |
      +- SingleTileLayerRenderer
      |  |
      |  +- HTMLSingleTileLayerRenderer
      |  |
      |  +- WebGLSingleTileLayerRenderer
      |
      +- TileLayerRenderer
      |  |
      |  +- HTMLTileLayerRenderer
      |  |
      |  +- WebGLTileLayerRenderer
      |
      +- VectorLayerRenderer
      |  |
      |  +- HTMLVectorLayerRenderer
      |  |  |
      |  |  +- SVGHTMLVectorLayerRenderer
      |  |  |
      |  |  +- Canvas2DHTMLVectorLayerRenderer
      |  |  |
      |  |  +- VMLHTMLVectorLayerRenderer
      |  |
      |  +- WebGLVectorLayerRenderer
```


OBJECT PROPERTIES AND METHODS
=============================

Notation:

- `property type`  property with type, trailing ? indicates unsure, getters and setters are assumed to exist.
- `f(args) -> type`  function taking args returning type.
- `f(args) -> type = something`  f is a trivial wrapper around something.
- `fires 'x'`  fires events of type 'x'.

Principles:

- All non-trivial objects inherit from `MVCObject`.
- All non-trivial collections are either `MVCArrays` or a child class thereof.
- Resolutions are `Array.<number>`, infinitely scalable resources (e.g. vectore layers) have resolutions == null.

```
MVCObject
  as Google Maps MVCObject
  freeze()
  unfreeze()

TileCoord
  clone() -> TileCoord
  getHash() -> number

TileBounds
  forEachTileCoord(z, function(tileCoord))

Tile
  tileCoord TileCoord
  url string
  state UNLOADED | LOADING | LOADED
  fires 'loaded' // when loaded
  fires 'aborted'  // when loading is aborted

Camera
   position goog.math.Coordinate
   resolution number
   rotation number

Layer
   projections Array.<Projection>
   extent Extent
   getResolutions() -> Array.<number>|null
   fires 'change' // when data changes

LayerArray
   getResolutions() -> Array.<number>|null
   getMaxResolution() = this.getResolutions()[0] | null

LayerRendererOptions
   layer Layer
   visible boolean
   opacity number
   brightness number
   color number
   hue number
   saturation number

Map
   projection Projection
   renderer Renderer
   layers LayerArray
   addLayer(layer) = layers.push(layer)
   getExtent() -> Extent
   getMaxResolution() = layers.getMaxResolution()

TileGrid
   resolutions Array.<number>
   extent ol.Extent
   xEast boolean
   ySouth boolean
   origin(s) Coord|Array.<Coord>
   tileSize goog.math.Size
   forEachTileCoordChild(tileCoord, function(z, TileBounds))
   forEachTileCoordParent(tileCoord, function(z, TileBounds))
   getExtentTileBounds(z, extent) -> TileBounds
   getTileCoord(coordinate) -> TileCoord
   getTileCoordCenter(tileCoord) -> goog.math.Coordinate
   getTileCoordExtent(tileCoord) -> ol.Extent
   getTileCoordResolution(tileCoord) -> number
   getZForResolution(resolution) -> number

TileLayer
   tileGrid TileGrid
   tileUrl function(tileCoord) -> string
   getTileCoordUrl(tileCoord) -> string = this.tileUrl(tileCoord)

TileQueue
   camera Camera  // or maybe MVCArray.<Camera> ?
   getTileCoordPriority(tileCoord) -> number  // private
   enqueueTile(Tile)

VectorLayer
   forEachFeature(resolution, extent, projection, function(Feature))

Renderer
   target HTMLDivElement
   map Map
   camera Camera
   getCapabilities() -> Array.<string>  // maybe ?
```

Questions:

- Store tile layer extent in TileLayer or in TileGrid?  (not clear)

Two concepts: tile coordinate system range and and available data extent.
TileGrid extent is range (or validity extent) of the tile coordinate system.
TileLayer extent is the available data extent. A particular TileGrid may range
from 0,0 to 10,10. My cache may conform to that grid but I may only have tiles
ranging from 2,2 to 8,8. When you need to wrap multiple worlds, you pay
attention to the TileGrid extent. When you need to decide whether or not to
bother requesting a tile, you pay attention to the TileLayer extent.

- Who determines "best" resolution?  (static function?)


Todo: if tile layer extent stored in TileLayer rather than TileGrid then extent
will occasionally need to be passed to TileGrid functions for cropping.

DESIGN ASSERTIONS
=================

Map

- A map has a renderer (the map renderer).
- A map has a camera.
- Multiple maps can share the same camera.
- A map has a layer list.

Layer 

- A layer can have multiple projections (the supported projections).
- A layer advertizes the projections it supports.
- A layer returns no data if asked data for an unsupported projection.

LayerRendererOptions

- A layer renderer options object stores view-related states for a layer.
- Options include visibility, opacity, saturation, hue, etc.
- A layer renderer options object has a layer.
- Multiple layer renderer options can share the same layer.
- In other words a layer can be viewed in different manners.

Renderer

- The map renderer responds to events.
- The map renderer receives events from the camera.
- The map renderer creates layer renderers.

Control

- A control may listen to map events.
- A control may listen to camera events.
- A map navigation control acts on the camera.

MVC

- Types can be described in MVC terms.
- Models don't know what rendering means.
- Maps are models.
- Layers are models.
- Layer views are models (sorry!).
- Cameras are models.
- Layer lists are collections.
- Renderers are views.
- Controls are views or controllers or both.
- An attribution control is a view.
- A map navigation control is a controller.
- A zoom slider control is both a view and a controller.
