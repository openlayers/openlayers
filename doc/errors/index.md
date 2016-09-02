---
title: Errors
layout: doc.hbs
---

# Errors

### 1

The view center is not defined.

### 2

The view resolution is not defined.

### 3

The view rotation is not defined.

### 4

`image` and `src` cannot be provided at the same time.

### 5

`imgSize` must be set when `image` is provided.

### 6

A defined and non-empty `src` or `image` must be provided.

### 7

`format` must be set when `url` is set.

### 8

Unknown `serverType` configured.

### 9

`url` must be configured or set using `#setUrl()`.

### 10

The default `geometryFunction` can only handle `ol.geom.Point` geometries.

### 11

`options.featureTypes` should be an Array.

### 12

`options.geometryName` must also be provided when `options.bbox` is set.

### 13

Invalid corner. Valid corners are `top-left`, `top-right`, `bottom-right` and `bottom-left`.

### 14

Invalid color. Valid colors are all [CSS colors](https://developer.mozilla.org/en-US/docs/Web/CSS/color).

### 15

Tried to get a value for a key that does not exist in the cache.

### 16

Tried to set a value for a key that is used already.

### 17

`resolutions` must be sorted in descending order.

### 18

Either `origin` or `origins` must be configured, never both.

### 19

Number of `tileSizes` and `resolutions` must be equal.

### 20

Number of `origins` and `resolutions` must be equal.

### 22

Either `tileSize` or `tileSizes` must be configured, never both.

### 23

The passed `ol.TileCoord`s must all have the same `z` value.

### 24

Invalid extent or geometry provided as `geometry`.

### 25

Cannot fit empty extent provided as `geometry`.

### 26

Features for `deletes` must have an id set by the feature reader or  `ol.Feature#setId()`.

### 27

Features for `updates` must have an id set by the feature reader or `ol.Feature#setId()`.

### 28

`renderMode` must be `'image'`, `'hybrid'` or `'vector'`.

### 29

`x` must be greater than `0`.

### 30

The passed `feature` was already added to the source.

### 31

Tried to enqueue an `element` that was already added to the queue.

### 32

Transformation matrix cannot be inverted.

### 33

Invalid `units`. `'degrees'`, `'imperial'`, `'nautical'`, `'metric'` or `'us'` required.

### 34

Invalid geometry layout. Must be `XY`, `XYZ`, `XYM` or `XYZM`.

### 35

Unknown GeoJSON object type. Expected `"Feature"` or `"FeatureCollection"`.

### 36

Unknown SRS type. Expected `"name"` or `"EPSG"`.

### 37

Unknown geometry type found. Expected `'Point'`, `'LineString'`, `'Polygon'` or `'GeometryCollection'`.

### 38

`styleMapValue` has an unknown type.

### 39

Unknown geometry type found. Expected `'GeometryCollection'`, `'MultiPoint'`, `'MultiLineString'` or `'MultiPolygon'`.

### 40

Expected `feature` to have a geometry.

### 41

Expected an `ol.style.Style` or an array of `ol.style.Style`.

### 42

Expected an `ol.Feature`, but got an `ol.RenderFeature`.

### 43

Expected `layers` to be an array or an `ol.Collection`.

### 44

`logo.href` should be a string.

### 45

`logo.src` should be a string.

### 46

Incorrect format for `renderer` option.

### 47

Expected `controls` to be an array or an `ol.Collection`.

### 48

Expected `interactions` to be an array or an `ol.Collection`.

### 49

Expected `overlays` to be an array or an `ol.Collection`.

### 50

Cannot determine Rest Service from url.

### 51

Either `url` or `tileJSON` options must be provided.

### 52

Unknown `serverType` configured.

### 53

Unknown `tierSizeCalculation` configured.

### 54

Hex color should have 3 or 6 digits.

### 55

The `{-y}` placeholder requires a tile grid with extent.

### 56

`mapBrowserEvent` must originate from a pointer event.
