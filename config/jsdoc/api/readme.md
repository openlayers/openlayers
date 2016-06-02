# API Documentation

This directory contains configuration (`conf.json`), static content (`index.md`), template (`template/`) and plugins (`plugins/`) for the [JSDoc3](http://usejsdoc.org/) API generator.

## Documenting the source code

JSDoc annotations are used for metadata used by the compiler, for defining the user facing API, and for user documentation.

In the simplest case, a JSDoc block can look like this:
```js
/**
 * Add the given control to the map.
 * @param {ol.control.Control} control Control.
 * @api
 */
ol.Map.prototype.addControl = function(control) {
  // ...
};
```
The first line is text for the user documentation. This can be long, and it can
contain Markdown.

The second line tells the Closure compiler the type of the argument.

The third line (`@api`) marks the method as part of the api and thus exportable. The stability can be added as value, e.g. `@api stable`. Without such an api annotation, the method will not be documented in the generated API documentation. Symbols without an api annotation will also not be exportable (unless they are explicitly exported with a `goog.exportProperty` call).

The `@api` annotation can be used in conjunction with the `@inheritDoc` annotation to export a symbol that is documented on a parent class (where the method may be abstract).  In general, `@api` annotations should never be used on abstract methods (only on their implementations).

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
   * @api
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
 * @api
 */
oli.MapBrowserEvent.prototype.coordinate;

// ...

};
```
To document which events are fired by a class or method, the `@fires` annotation is used:
```js
/**
 * @fires ol.MapBrowserEvent
 * @fires ol.MapEvent
 * @fires ol.render.Event
 * ...
 */
ol.Map = function(options) {
  // ...
};
```

### Observable Properties

Observable properties are documented using the `@observable` annotation. This annotation is added to the getter of an observable property. If an observable property is also settable, the setter is annotated with `@observable` as well.
