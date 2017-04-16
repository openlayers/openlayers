---
title: Exploring the API
layout: doc.hbs
---

# Exploring the API
## Basics
### Setting up a test environment
As stated in the [introduction](introduction.md), the API represents the officially supported interface to the library. The [API docs](../../apidoc/) are the reference documentation for this. There are a number of ways to try out the functionality in this; a simple one is to create a skeleton html file that loads the minimum required, load it in a browser, and then use the console to interactively create the various objects and run functions on them.

Three things are required as a minimum: the library itself, the CSS needed to display the visual widgets/controls, and a DOM element to hold the map. So a simple skeleton HTML would be:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="initial-scale=1.0, user-scalable=no, width=device-width">
    <link rel="stylesheet" href="http://ol3js.org/en/master/css/ol.css">
  </head>
  <body>
    <div id="map" style="height: 400px"></div>
    <script src="http://ol3js.org/en/master/build/ol.js"></script>
  </body>
</html>
```

This creates a Div element for the map (you can of course change this to whatever size you like, including 100%), and loads the hosted 'full' build (the complete API) and default CSS from the OL3 website. You can of course download a local copy and load that if you prefer.

Now load this in the browser, and open the console. Open the API docs in another window/tab for cross-reference.

### Namespaces and classes
Type `ol` in the console, and you will see that the properties of this object largely correspond to those listed in the docs. Those starting with a capital are largely classes (that is, a constructor function), whereas those starting with a lower-case letter are namespaces which contain either subclasses, as with for example `ol.control`, or static methods, as with for example `ol.animation`. Clicking on `ol` in the docs gives you a similar list.

You may have noticed that the docs contain some extra objects that do not appear in the console, such as events. These need to be documented, so appear in the API docs, but instances are created by the system not by applications, so they do not appear in the `ol` object in the console (they are not exported).

### Base classes
As mentioned above, namespaces can contain classes. Look at `ol.control` for example in the API docs or in the console, and you will see a list of control classes. Those with the same name, such as `ol.control.Control`, are base classes, from which the other classes (subclasses) inherit. Some of these can be instantiated in applications, but others, such as `ol.layer.Layer`, are abstracts that are not normally used. There are also some additional base classes, such as `ol.layer.Base`. The API pages for the individual classes mention whether they are base and/or abstract classes.

The classes that are not in namespaces are mainly stand-alone objects that are not related to other classes. There are however two base classes, from which other classes inherit: `ol.Observable` and `ol.Object`. See the appropriate pages of the API docs for more on these, and see the later discussion on events for examples of using observable properties.

### Parameters and options
The docs for the methods are standard, giving the input parameters for the methods together with what is returned. `ol.color` for example has two methods, which both have one parameter. If you look at these functions in the console, you will however notice that the variable names for the parameters have been optimized, the parameters being a,b,c etc.

Most of the class constructors have a single `options` parameter; which options a particular class has depends on the class concerned, and they are listed in the docs. 

### Accessors
Options are used to set properties on the instance. These are in general private, and not referred to in application code. Those that are accessible have `get` and `set` accessors. For example, in `ol.View`, you can set `center` initially using the `center` constructor option, retrieve it with `getCenter()`, and change it with `setCenter()`.

### Types
In the docs for the method parameters and options, you will notice that each one has a 'type'. On the `ol` page in the docs, under the classes and namespaces, you will also see 'type definitions'.

Although standard JS is loosely typed, with the Closure compiler you can define types in a more precise manner in JSDoc comments in the source code; the compiler is then able to optimize the code accordingly. The OL3 library makes extensive use of this.

As with event objects, you do not directly refer to types in application code; but you do have to make sure that parameters and options correspond to the appropriate type. For example, if you look at the docs for `ol.View`, you will see that, for example, the `center` option is a `ol.Coordinate`; if you click on this in the docs, you will see that this is an x,y array. So when you enter this option in your code, you do not use the term `ol.Coordinate` but just ensure that it matches the type pattern. If you look further down the docs for `ol.View` you will see that `getCenter()` also returns a `ol.Coordinate`, but not all getters return the same type as the option. The `projection` option on `ol.View`, for example, is a `ol.proj.ProjectionLike`, whereas `getProjection` returns a `ol.proj.Projection` instance; ProjectionLike is a convenience type, meaning you can just enter the string code for the projection, and the system will convert this into the Projection object needed internally.

### Collections
You will notice that some options and accessors have an `ol.Collection` type. This is used in the library instead of arrays, for example, in `ol.Map`, `controls`, `interactions`, `layers`, and `overlays` are all collections. The `get` functions for these return a collection instance. In general, these properties do not have a `set` function, but instead are changed with `add` and `remove` functions, for example, in `ol.Map`, `addLayer` and `removeLayer`. Even though the options for collections have an `ol.Collection` type, for convenience they also accept a simple array.


## Map and its components
The __map__ object `ol.Map` is the container for the other components. See the API docs for more information on each of the components. Let's start with the simple example given at the top of the API docs page for `ol.Map`. This creates a map instance, and provides 3 options: view, layers, and target. Instead of creating the instances for the options in the map constructor, let's create these separately.

Start with the __view__. In the console, type:
```js
var view = new ol.View({
  center: [0, 0],
  zoom: 1
});
```
Center here corresponds to the `ol.Coordinate` type, that is, an x,y array. If you now inspect the `view` variable, you will see all the properties have obfuscated names, but you can see the API methods on the prototype. If you now do `view.getCenter()` you will see the center you entered, and similarly for zoom. As you did not give a projection, the constructor used the default (EPSG:3857), so if you enter `view.getProjection()` you will get a Projection object for that projection; you can of course call functions on that object, such as `view.getProjection().getCode()`.

OL3 splits __layers__ from the __source__ of the data for the layer. In this case, we have an OSM MapQuest source, so create this in the console with `var source = new ol.source.MapQuest({layer: 'osm'});`. Here, we are specifying the `layer` option (that's the server layer, of course, not the OL layer), which, as you can see from the `ol.source.MapQuest` API page, can be 'osm', 'sat', or 'hyb'. Again, you can look at the variable created, and do, for example, `source.getProjection()` - as with the View, this is by default an EPSG:3857 projection.

Now we'll create the layer, with the source that we've just created: `var layer = new ol.layer.Tile({source: source});`. `layer.getSource()` will return the source we just created, and we can use other instance methods, such as `layer.getVisible()`. Of course, we can also chain function calls, such as `layer.getSource().getProjection().getCode()`.

Now, let's create the map object. The simple and usual way to do this is with one command:
```js
var map = new ol.Map({
  layers: [layer],
  view: view,
  target: 'map'
});
```
But to make the individual steps clearer, let's create an empty map, and then add the various components. You might think you can do `var map = new ol.Map()`, but if you do you'll get an error. The options object itself is not optional, so you must supply an empty one `var map = new ol.Map({})`. The constructor will use defaults, so if you now do `map.getView()`, it will return the default view that was created. This isn't what you want, so set it to the one you created above with `map.setView(view)`. You can set the target with `map.setTarget('map')` ('map' being the id of the div element you created in the skeleton HTML above). If you now look at the HTML page, you will see that you have a couple of visible controls, so the map has been rendered, but of course there is no data because you haven't defined that in the map yet. So the final step to get a visible map is to add the layer. As discussed under Collections above, the layers property/option is a collection, so there is no `setLayers()`. By default, the map constructor created an empty layers collection (try `map.getLayers().getLength()`), so to add the layer you use `map.addLayer(layer);`, which adds the layer to this layer collection. Adding the layer will trigger the layer rendering process, which will fetch the appropriate map tiles, so if you now look at the HTML page, you should see the rendered map. If you now try `map.getLayers().getLength()` you will see we now have a collection of 1, so `map.getLayers().item(0).getSource()` will return the source of the first layer, that is, the one we created above.

The other main components of `ol.Map` are the __controls__ and __interactions__. If you look in the `controls` option on the API page for `ol.Map`, you will see that by default the `ol.controls.default()` function is used. If you click on that, you will see that three controls are added by default: zoom and attribution (which you can see), and rotate (which we won't cover in this tutorial). These are also in a collection, which you can retrieve with `map.getControls()`. `map.getControls().getLength()` should return `3`, and `map.getControls().getArray()` should return the 3 controls as an array. The same applies to interactions, which also has defaults if none are defined in the map options.

Now let's change some of the settings. `view.setCenter([5000000, 4000000])` will reposition the map to that coordinate, and `view.setZoom(5)` will zoom in. Note that the coordinates are in the view projection (EPSG:3857). As you probably don't know any of those and are more familiar with latitude and longitude, you can reproject the lon/lat coordinate with the static `ol.proj.transform` function: `view.setCenter(ol.proj.transform([0, 52], 'EPSG:4326', 'EPSG:3857'))` (note that the coordinates are still in x,y format, not the more usual lat,lon).

### Events
Not all classes fire events, but those they do fire are listed in the appropriate page of the API docs. Applications can set listeners for these events, along with a callback function that will be called when the event is triggered.

Let's try some examples. If you look at the API page for `ol.View`, you will see that `center` is an observable property, and that a 'change:center' event is fired. You can add a listener function with the on() or once() functions: `view.on('change:center', function(evt){console.log(evt)})`. If you now call `view.setCenter()` again with a new center, you will see that the event object is displayed in the console. In this object, `type` is `change:center`, and `target` is the event target, in this case, the view.

Those are the generic observable property listeners. Some classes also have their own events. Let's try a map browser event. Look at the API page for `ol.Map` and you will see that there is a `singleclick` event, which returns a `ol.MapBrowserEvent`. Add a listener for this `map.on('singleclick', function(evt){console.log(evt)})` and then click anywhere on the map; the event instance returned is similar to the `change:center` one, but has additional properties such as `coordinate` and `pixel` which are the point corresponding to the click.

You can also add your own properties to any of the classes descended from `ol.Object`, and listen for changes on them:
```js
map.set('ping', 0); // adds a new observable property called 'ping' with a value of 0
map.on('change:ping', function(){alert('ping!'}); // adds a change listener to that property
map.set('ping', 2); // change the value of ping, and trigger the event, calling the listener function
```

## Further exercises
You should now have the basics of how the API docs relate to the functions available in the build, how to create object instances with options, and how to retrieve and change the properties set by those options. You should also know how to make use of event listeners. You should now be able to expand on that by adding for example an `ol.Overlay` or changing the view rotation, or using different layer or source types. See the examples for some further code examples.