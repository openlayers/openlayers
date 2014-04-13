# API Documentation

This directory contains configuration (`conf.json`), static content (`index.md`), template (`template/`) and plugins (`plugins/`) for the [JSDoc3](http://usejsdoc.org/) API generator.

## Documenting the source code

JSDoc annotations are used for metadata used by the compiler, for defining the user facing API, and for user documentation.

In the simplest case, a JSDoc block can look like this:
```js
/**
 * Add the given control to the map.
 * @param {ol.control.Control} control Control.
 * @todo stability experimental
 * @todo api
 */
ol.Map.prototype.addControl = function(control) {
  // ...
};
```
The first line is text for the user documentation. This can be long, and it can
contain Markdown.

The second line tells the Closure compiler the type of the argument.

The third line marks the API stability. Once the documentation story is fully settled, we will remove the `todo ` and just write `@stability experimental`. Without such a stability note, the method will not be documented in the generated API documentation.

The last line marks the method as exportable so it can be made available to the user facing API. This will also change to just `@api` eventually.

### Observable properties

For classes that inherit from `ol.Object`, there is a special documentation case for getters and setters:
```js
/**
 * Get the size of this map.
 * @return {ol.Size|undefined} Size.
 * @todo stability experimental
 */
ol.Map.prototype.getSize = function() {
  // ...
};
goog.exportProperty(
    ol.Map.prototype,
    'getSize',
    ol.Map.prototype.getSize);
```
Because `ol.Object` needs to rely on these getter and setter names, these methods are not marked `@api` as exportable. Instead, `goog.exportProperty()` is used after the method definition to make sure that this method is always part of the API and not renamed in build configurations that do not need it.

To document observable properties with the `ol.ObjectEvent` types they are associated with, the `@observable` property is used (currently still `@todo observable`):
```js
 * @constructor
 * @todo observable layergroup {ol.layer.Group} a layer group containing the
 *       layers in this map.
 * @todo observable size {ol.Size} the size in pixels of the map in the DOM
 * @todo observable target {string|Element} the Element or id of the Element
 *       that the map is rendered in.
 * @todo observable view {ol.IView} the view that controls this map
 */
ol.Map = function(options) {
```
The first argument to that annotation is the name of the property, then the type(s) in curly braces, and then a description. NOTE/TODO: The `apidoc/plugins/observable.js` plugin does currently not handle inherited observable properties.

### Events

Events are documented using `@fires` and `@event` annotations:
```js
/**
 * Constants for event names.
 * @enum {string}
 */
ol.MapBrowserEvent.EventType = {
  /**
   * A true single click with no dragging and no double click. Note that this
   * event is delayed by 250 ms to ensure that it is not a double click.
   * @event ol.MapBrowserEvent#singleclick
   * @todo stability experimental
   */
  SINGLECLICK: 'singleclick',
  // ...
};
```
Note the value of the `@event` annotation. The text before the hash refers to the event class that the event belongs to, and the text after the hash is the type of the event. To export these properties, they need to be defined in `externs/oli.js` (also see `readme.md` in `externs/`). In addition, a stability note is required in the source code (`src/ol/MapBrowserEvent.js`) to make sure that documentation gets generated:
```js
ol.MapBrowserEvent = function(type, map, browserEvent, opt_frameState) {

  // ...

  /**
   * @type {ol.Coordinate}
   * @todo stability experimental
   */
  this.coordinate = map.getEventCoordinate(this.originalEvent);

  // ...

};
```
To document which events are fired by a class or method, the `@fires` annotation is used:
```js
 * @fires {@link ol.MapBrowserEvent} ol.MapBrowserEvent
 * @fires {@link ol.MapEvent} ol.MapEvent
 * @fires {@link ol.render.Event} ol.render.Event
 */
ol.Map = function(options) {
  // ...
};
```
Again, note the syntax of the `@fires` annotation. The link is necessary to provide a link to the documentation of the event, and the name of the event class is necessary for JSDoc3 to know which event we are talking about.

### Special cases with inheritance

When an item is marked `@api` in a subclass and not the base class, the documentation needs to be provided in the class where the item is exported. If the item is a (member) function, the `@function` annotation needs to be used:
```js
/**
 * Read a feature from a GeoJSON Feature source.  This method will throw
 * an error if used with a FeatureCollection source.
 * @function
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @return {ol.Feature} Feature.
 * @todo stability experimental
 * @todo api
 */
ol.format.GeoJSON.prototype.readFeature;
```
The `@function` annotation is also needed when the function assignment is a
constant function from a `goog` namespace (e.g. `goog.AbstractMethod`).

For an abstract method, if it exported by every subclass, the documentation can be provided in the abstract class, with a `@stability` note. Implementing classes can use `@inheritDoc` and export the item:
```js
/**
 * @inheritDoc
 * @todo api
 */
```
When only a subset of the subclasses exports the item, @inheritDoc cannot
be used, and every exporting class needs to provide the documentation.
