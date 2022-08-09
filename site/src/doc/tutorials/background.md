---
title: Background
layout: default.hbs
---

# Background

## Overview

OpenLayers is a modular, high-performance, feature-packed library for displaying and interacting with maps and geospatial data.

The library comes with built-in support for a wide range of commercial and free image and vector tile sources, and the most popular open and proprietary vector data formats. With OpenLayers's map projection support, data can be in any projection.

## Public API

OpenLayers is available as [`ol` npm package](https://npmjs.com/package/ol), which provides all modules of the officially supported [API](../../apidoc).

## Browser Support

OpenLayers runs on all modern browsers (with greater than 1% global usage).  This includes Chrome, Firefox, Safari and Edge. For older browsers, [polyfills](https://polyfill.io/) will likely need to be added.

The library is intended for use on both desktop/laptop and mobile devices, and supports pointer and touch interactions.

## Module and Naming Conventions

OpenLayers modules with CamelCase names provide classes as default exports, and may contain additional constants or functions as named exports:

```js
import Map from 'ol/Map';
import View from 'ol/View';
```

Class hierarchies grouped by their parent are provided in a subfolder of the package, e.g. `layer/`.

For convenience, these are also available as named exports, e.g.

```js
import {Map, View} from 'ol';
import {Tile, Vector} from 'ol/layer';
```

In addition to these re-exported classes, modules with lowercase names also provide constants or functions as named exports:

```js
import {getUid} from 'ol';
import {fromLonLat} from 'ol/proj';
```
