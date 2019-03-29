---
title: Frequently Asked Questions (FAQ)
layout: doc.hbs
---

# Frequently Asked Questions (FAQ)

Certain questions arise more often than others when users ask for help. This
document tries to list some of the common questions that frequently get asked,
e.g. on [Stack Overflow](http://stackoverflow.com/questions/tagged/openlayers).

If you think a question (and naturally its answer) should be added here, feel
free to ping us or to send a pull request enhancing this document.

Table of contents:

* [What projection is OpenLayers using?](#what-projection-is-openlayers-using-)
* [How do I change the projection of my map?](#how-do-i-change-the-projection-of-my-map-)
* [Why is my map centered on the gulf of guinea (or africa, the ocean, null-island)?](#why-is-my-map-centered-on-the-gulf-of-guinea-or-africa-the-ocean-null-island-)
* [Why is the order of a coordinate [lon,lat], and not [lat,lon]?](#why-is-the-order-of-a-coordinate-lon-lat-and-not-lat-lon-)
* [Why aren't there any features in my source?](#why-aren-t-there-any-features-in-my-source-)
* [How do I force a re-render of the map?](#how-do-i-force-a-re-render-of-the-map-)
* [Why are my features not found?](#why-are-my-features-not-found-)
* [Why is zooming or clicking off, inaccurate?](#user-content-why-is-zooming-or-clicking-off-inaccurate)

## What projection is OpenLayers using?

Every map that you'll create with OpenLayers will have a view, and every view
will have a projection. As the earth is three-dimensional and round but the 2D
view of a map isn't, we need a mathematical expression to represent it. Enter
projections.

There isn't only one projection, but there are many common ones. Each projection
has different properties, in that it accurately represents distances, angles or
areas. Certain projections are better suited for different regions in the world.

Back to the original question: OpenLayers is capable of dealing with most
projections. If you do not explicitly set one, your map is going to use our
default which is the Web Mercator projection (EPSG:3857). The same projection is
used e.g. for the maps of the OpenStreetMap-project and commercial products such
as Bing Maps or Google Maps.

This projection is a good choice if you want a map which shows the whole world,
and you may need to have this projection if you want to e.g. use the
OpenStreetMap or Bing tiles.


## How do I change the projection of my map?

There is a good chance that you want to change the default projection of
OpenLayers to something more appropriate for your region or your specific data.

The projection of your map can be set through the `view`-property. Here are some
examples:

```javascript
import Map from 'ol/Map';
import View from 'ol/View';

// OpenLayers comes with support for the World Geodetic System 1984, EPSG:4326:
const map = new Map({
  view: new View({
    projection: 'EPSG:4326'
    // other view properties like map center etc.
  })
  // other properties for your map like layers etc.
});
```

```javascript
import Map from 'ol/Map';
import View from 'ol/View';
import proj4 from 'proj4';
import {register} from 'ol/proj/proj4';
import {get as getProjection} from 'ol/proj';

// To use other projections, you have to register the projection in OpenLayers.
// This can easily be done with [https://proj4js.org](proj4)
//
// By default OpenLayers does not know about the EPSG:21781 (Swiss) projection.
// So we create a projection instance for EPSG:21781 and pass it to
// register to make it available to the library for lookup by its
// code.
proj4.defs('EPSG:21781',
  '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 ' +
  '+x_0=600000 +y_0=200000 +ellps=bessel ' +
  '+towgs84=660.077,13.551,369.344,2.484,1.783,2.939,5.66 +units=m +no_defs');
register(proj4);
const swissProjection = getProjection('EPSG:21781');

// we can now use the projection:
const map = new Map({
  view: new View({
    projection: swissProjection
    // other view properties like map center etc.
  })
  // other properties for your map like layers etc.
});
```

We recommend to lookup parameters of your projection (like the validity extent)
over at [epsg.io](https://epsg.io/).


## Why is my map centered on the gulf of guinea (or africa, the ocean, null-island)?

If you have set a center in your map view, but don't see a real change in visual
output, chances are that you have provided the coordinates of the map center in
the wrong (a non-matching) projection.

As the default projection in OpenLayers is Web Mercator (see above), the
coordinates for the center have to be provided in that projection. Chances are
that your map looks like this:

```javascript
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

const washingtonLonLat = [-77.036667, 38.895];
const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  target: 'map',
  view: new View({
    center: washingtonLonLat,
    zoom: 12
  })
});
```

Here `[-77.036667, 38.895]` is provided as the center of the view. But as Web
Mercator is a metric projection, you are currently telling OpenLayers that the
center shall be some meters (~77m and ~39m respectively) away from `[0, 0]`. In
the Web Mercator projection the coordinate is right in the gulf of guinea.

The solution is easy: Provide the coordinates projected into Web Mercator.
OpenLayers has some helpful utility methods to assist you:

```javascript
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import {fromLonLat} from 'ol/proj';

const washingtonLonLat = [-77.036667, 38.895];
const washingtonWebMercator = fromLonLat(washingtonLonLat);

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  target: 'map',
  view: new View({
    center: washingtonWebMercator,
    zoom: 8
  })
});
```

The method `fromLonLat()` is available from version 3.5 onwards.

If you told OpenLayers about a custom projection (see above), you can use the
following method to transform a coordinate from WGS84 to your projection:

```javascript
import {transform} from 'ol/proj';
// assuming that OpenLayers knows about EPSG:21781, see above
const swissCoord = transform([8.23, 46.86], 'EPSG:4326', 'EPSG:21781');
```


## Why is the order of a coordinate [lon,lat], and not [lat,lon]?

Because of two different and incompatible conventions. Latitude and longitude
are normally given in that order. Maps are 2D representations/projections
of the earth's surface, with coordinates expressed in the `x,y` grid of the
[Cartesian system](https://en.wikipedia.org/wiki/Cartesian_coordinate_system).
As they are by convention drawn with west on the left and north at the top,
this means that `x` represents longitude, and `y` latitude. As stated above,
OpenLayers is designed to handle all projections, but the default view is in
projected Cartesian coordinates. It would make no sense to have duplicate
functions to handle coordinates in both the Cartesian `x,y` and `lat,lon`
systems, so the degrees of latitude and longitude should be entered as though
they were Cartesian, in other words, they are `lon,lat`.

If you have difficulty remembering which way round it is, use the language code
for English, `en`, as a mnemonic: East before North.

#### A practical example
So you want to center your map on a certain place on the earth and obviously you
need to have its coordinates for this. Let's assume you want your map centered
on Schladming, a beautiful place in Austria. Head over to the wikipedia
page for [Schladming](http://en.wikipedia.org/wiki/Schladming). In the top-right
corner there is a link to [GeoHack](http://tools.wmflabs.org/geohack/geohack.php?pagename=Schladming&params=47_23_39_N_13_41_21_E_type:city(4565)_region:AT-6),
which effectively tells you the coordinates are:

    WGS84:
    47° 23′ 39″ N, 13° 41′ 21″ E
    47.394167, 13.689167

So the next step would be to put the decimal coordinates into an array and use
it as center:

```javascript
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import {fromLonLat} from 'ol/proj';

const schladming = [47.394167, 13.689167]; // caution partner, read on...
// since we are using OSM, we have to transform the coordinates...
const schladmingWebMercator = fromLonLat(schladming);

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  target: 'map',
  view: new View({
    center: schladmingWebMercator,
    zoom: 9
  })
});
```

Running the above example will possibly surprise you, since we are not centered
on Schladming, Austria, but instead on Abyan, a region in Yemen (possibly also a
nice place). So what happened?

Many people mix up the order of longitude and latitude in a coordinate array.
Don't worry if you get it wrong at first, many OpenLayers developers have to
think twice about whether to put the longitude or the latitude first when they
e.g. try to change the map center.

Ok, then let's flip the coordinates:

```javascript
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import {fromLonLat} from 'ol/proj';

const schladming = [13.689167, 47.394167]; // longitude first, then latitude
// since we are using OSM, we have to transform the coordinates...
const schladmingWebMercator = fromLonLat(schladming);

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  target: 'map',
  view: new View({
    center: schladmingWebMercator,
    zoom: 9
  })
});
```

Schladming is now correctly displayed in the center of the map.

So when you deal with EPSG:4326 coordinates in OpenLayers, put the longitude
first, and then the latitude. This behaviour is the same as we had in OpenLayers
2, and it actually makes sense because of the natural axis order in WGS84.

If you cannot remember the correct order, just have a look at the method name
we used: `fromLonLat`; even there we hint that we expect longitude
first, and then latitude.


## Why aren't there any features in my source?

Suppose you want to load a KML file and display the contained features on the
map. Code like the following could be used:

```javascript
import VectorLayer from 'ol/layer/Vector';
import KMLSource from 'ol/source/KML';

const vector = new VectorLayer({
  source: new KMLSource({
    projection: 'EPSG:3857',
    url: 'data/kml/2012-02-10.kml'
  })
});
```

You may ask yourself how many features are in that KML, and try something like
the following:

```javascript
import VectorLayer from 'ol/layer/Vector';
import KMLSource from 'ol/source/KML';

const vector = new VectorLayer({
  source: new KMLSource({
    projection: 'EPSG:3857',
    url: 'data/kml/2012-02-10.kml'
  })
});
const numFeatures = vector.getSource().getFeatures().length;
console.log("Count right after construction: " + numFeatures);
```

This will log a count of `0` features to be in the source. This is because the
loading of the KML-file will happen in an asynchronous manner. To get the count
as soon as possible (right after the file has been fetched and the source has
been populated with features), you should use an event listener function on the
`source`:

```javascript
vector.getSource().on('change', function(evt){
  const source = evt.target;
  if (source.getState() === 'ready') {
    const numFeatures = source.getFeatures().length;
    console.log("Count after change: " + numFeatures);
  }
});
```

This will correctly report the number of features, `1119` in that particular
case.


## How do I force a re-render of the map?

Usually the map is automatically re-rendered, once a source changes (for example
when a remote source has loaded).

If you actually want to manually trigger a rendering, you could use

```javascript
map.render();
```

...or its companion method

```javascript
map.renderSync();
```

## Why are my features not found?

You are using `Map#forEachFeatureAtPixel` or `Map#hasFeatureAtPixel`, but
it sometimes does not work for large icons or labels? The *hit detection* only
checks features that are within a certain distance of the given position. For large
icons, the actual geometry of a feature might be too far away and is not considered.

In this case, set the `renderBuffer` property of `VectorLayer` (the default value is 100px):

```javascript
import VectorLayer from 'ol/layer/Vector';

const vectorLayer = new VectorLayer({
  ...
  renderBuffer: 200
});
```

The recommended value is the size of the largest symbol, line width or label.

## Why is zooming or clicking in the map off/inaccurate?

OpenLayers does not update the map when the container element is resized. This can be caused by progressive updates
to CSS styles or manually resizing the map. When that happens, any interaction will become inaccurate: the map would zoom in and out, and end up not being centered on the pointer. This makes it hard to do certain interactions, e.g. selecting the desired feature.

There is currently no built-in way to react to element's size changes, as [Resize Observer API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) is only implemented in Chrome.

There is however an easy to use [polyfill](https://github.com/que-etc/resize-observer-polyfill):

```javascript
import Map from 'ol/Map';
import ResizeObserver from 'resize-observer-polyfill';

const mapElement = document.querySelector('#map')
const map = new Map({
  target: mapElement
})

const sizeObserver = new ResizeObserver(() => {
  map.updateSize()
})
sizeObserver.observe(mapElement)

// called when the map is destroyed
// sizeObserver.disconnect()
```
