---
title: Frequently Asked Questions (FAQ)
layout: doc.hbs
---

# Frequently Asked Questions (FAQ)

Certain questions arise more often than others when users ask for help. This 
document tries to list some of the common questions that frequently get asked,
e.g. on [Stack Overflow](http://stackoverflow.com/questions/tagged/openlayers-3).

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
* [How do I create a custom build of OpenLayers?](#how-do-i-create-a-custom-build-of-openlayers-)
* [Do I need to write my own code using Closure library?](#do-i-need-to-write-my-own-code-using-closure-library-)
* [Do I need to compress my code with Closure compiler?](#do-i-need-to-compress-my-code-with-closure-compiler-)


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
// OpenLayers comes with support for the World Geodetic System 1984, EPSG:4326:
var map = new ol.Map({
  view: new ol.View({
    projection: 'EPSG:4326'
    // other view properties like map center etc.
  })
  // other properties for your map like layers etc.
});
```

```javascript
// To use other projections, you have to register the projection in OpenLayers:
//
// By default OpenLayers does not know about the EPSG:21781 (Swiss) projection.
// So we create a projection instance for EPSG:21781 and pass it to
// ol.proj.addProjection to make it available to the library for lookup by its
// code.
var swissProjection = new ol.proj.Projection({
  code: 'EPSG:21781',
  // The extent is used to determine zoom level 0. Recommended values for a
  // projection's validity extent can be found at http://epsg.io/.
  extent: [485869.5728, 76443.1884, 837076.5648, 299941.7864],
  units: 'm'
});
ol.proj.addProjection(swissProjection);

// we can now use the projection:
var map = new ol.Map({
  view: new ol.View({
    projection: swissProjection
    // other view properties like map center etc.
  })
  // other properties for your map like layers etc.
});
```

We recommend to lookup parameters of your projection (like the validity extent)
over at [epsg.io](http://epsg.io/).


## Why is my map centered on the gulf of guinea (or africa, the ocean, null-island)?

If you have set a center in your map view, but don't see a real change in visual
output, chances are that you have provided the coordinates of the map center in
the wrong (a non-matching) projection.

As the default projection in OpenLayers is Web Mercator (see above), the
coordinates for the center have to be provided in that projection. Chances are
that your map looks like this:

```javascript
var washingtonLonLat = [-77.036667, 38.895];
var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  target: 'map',
  view: new ol.View({
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
var washingtonLonLat = [-77.036667, 38.895];
var washingtonWebMercator = ol.proj.fromLonLat(washingtonLonLat);

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  target: 'map',
  view: new ol.View({
    center: washingtonWebMercator,
    zoom: 8
  })
});
```

The method `ol.proj.fromLonLat()` is available from version 3.5 onwards.

If you told OpenLayers about a custom projection (see above), you can use the
following method to transform a coordinate from WGS84 to your projection:

```javascript
// assuming that OpenLayers knows about EPSG:21781, see above
var swissCoord = ol.proj.transform([8.23, 46.86], 'EPSG:4326', 'EPSG:21781');
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
var schladming = [47.394167, 13.689167]; // caution partner, read on...
// since we are using OSM, we have to transform the coordinates...
var schladmingWebMercator = ol.proj.fromLonLat(schladming);

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  target: 'map',
  view: new ol.View({
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
var schladming = [13.689167, 47.394167]; // longitude first, then latitude
// since we are using OSM, we have to transform the coordinates...
var schladmingWebMercator = ol.proj.fromLonLat(schladming);

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  target: 'map',
  view: new ol.View({
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
we used: `ol.proj.fromLonLat`; even there we hint that we expect longitude
first, and then latitude.


## Why aren't there any features in my source?

Suppose you want to load a KML file and display the contained features on the
map. Code like the following could be used:

```javascript
var vector = new ol.layer.Vector({
  source: new ol.source.KML({
    projection: 'EPSG:3857',
    url: 'data/kml/2012-02-10.kml'
  })
});
```

You may ask yourself how many features are in that KML, and try something like
the following:

```javascript
var vector = new ol.layer.Vector({
  source: new ol.source.KML({
    projection: 'EPSG:3857',
    url: 'data/kml/2012-02-10.kml'
  })
});
var numFeatures = vector.getSource().getFeatures().length;
console.log("Count right after construction: " + numFeatures);
```

This will log a count of `0` features to be in the source. This is because the
loading of the KML-file will happen in an asynchronous manner. To get the count
as soon as possible (right after the file has been fetched and the source has
been populated with features), you should use an event listener function on the
`source`:

```javascript
vector.getSource().on('change', function(evt){
  var source = evt.target;
  if (source.getState() === 'ready') {
    var numFeatures = source.getFeatures().length; 
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

You are using `ol.Map#forEachFeatureAtPixel` or `ol.Map#hasFeatureAtPixel`, but
it sometimes does not work for large icons or labels? The *hit detection* only
checks features that are within a certain distance of the given position. For large
icons, the actual geometry of a feature might be too far away and is not considered.

In this case, set the `renderBuffer` property of `ol.layer.Vector` (the default
value is 100px):

```javascript
var vectorLayer = new ol.layer.Vector({
  ...
  renderBuffer: 200
});
```

The recommended value is the size of the largest symbol, line width or label.

## How do I create a custom build of OpenLayers?

Please refer to the [official create custom builds tutorial](tutorials/custom-builds.html)
which explains how to create a custom build of OpenLayers with just those parts
included that you want.


## Do I need to write my own code using Closure library?

OpenLayers is built on top of the [Google Closure JavaScript
library](https://developers.google.com/closure/library/), but this
does not mean that you must use that library in your application code.

OpenLayers should play well with all sorts of JavaScript libraries out there,
and you are in no way forced to use a specific one. Choose one that looks
right for you.


## Do I need to compress my code with Closure compiler?

No, you don't need to do compress your code with the [Google Closure
compiler](https://developers.google.com/closure/compiler/).

It may be a good choice though, because when your application code and the
OpenLayers source code is compiled together using closure compiler, the
resulting build will most probably be the smallest in terms of byte-size. For
more details refer to the
[compile application and OpenLayers together tutorial](tutorials/closure.html).

If you don't want to use the closure compiler, or you can't, you are not at all
forced to use it.


