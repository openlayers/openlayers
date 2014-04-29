# API Documentation

This directory contains configuration (`conf.json`), static content (`index.md`), template (`template/`) and plugins (`plugins/`) for the [JSDoc3](http://usejsdoc.org/) API generator.

## Documenting the source code

JSDoc annotations are used for metadata used by the compiler, for defining the user facing API, and for user documentation.

In the simplest case, a JSDoc block can look like this:
```js
/**
 * Add the given control to the map.
 * @param {ol.control.Control} control Control.
 * @todo api
 */
ol.Map.prototype.addControl = function(control) {
  // ...
};
```
The first line is text for the user documentation. This can be long, and it can
contain Markdown.

The second line tells the Closure compiler the type of the argument.

The third line (`@todo api`) marks the method as exportable. The stability can be added as value, e.g. `@todo api stable`. Once the documentation story is fully settled, we will remove the `todo ` and just write `@api` or `@api stable`. Without such an api note, the method will not be exported and not documented in the generated API documentation.

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
   * @todo api
   */
  SINGLECLICK: 'singleclick',
  // ...
};
```
Note the value of the `@event` annotation. The text before the hash refers to the event class that the event belongs to, and the text after the hash is the type of the event.

To export event properties, they need to be defined in `externs/oli.js` (also see `readme.md` in `externs/`) and marked with an @api annotation:
```js
/** @interface */
oli.MapBrowserEvent;

/**
 * @type {ol.Coordinate}
 * @todo api
 */
oli.MapBrowserEvent.prototype.coordinate;

// ...

};
```
To document which events are fired by a class or method, the `@fires` annotation is used:
```js
 * @fires {@link ol.MapBrowserEvent} ol.MapBrowserEvent
 * @fires {@link ol.MapEvent} ol.MapEvent
 * @fires {@link ol.render.Event} ol.render.Event
 * ...
 */
ol.Map = function(options) {
  // ...
};
```
Again, note the syntax of the `@fires` annotation. The link is necessary to provide a link to the documentation of the event, and the name of the event class is necessary for JSDoc3 to know which event we are talking about.
