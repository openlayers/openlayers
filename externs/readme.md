# Externs

This directory contains externs files, which tell the Closure compiler about symbols and properties that it should not rename.

## oli.js and olx.js

These two files are special externs that belong to ol3, and this document explains their purpose and how they are used.

### Prevent class properties from being renamed

For events, we make properties available to the application. Methods can be made available by just marking them with the `@api` annotation directly where they are defined; properties should also be added to `oli.js`:

```js
/**
 * @interface
 */
oli.MapBrowserEvent = function() {};

/**
 * @type {ol.Coordinate}
 */
oli.MapBrowserEvent.prototype.coordinate;
```
In the source file (`src/ol/MapBrowserEvent.js`), the class needs to implement this interface:
```js
/**
 * ...
 * @constructor
 * @implements {oli.MapBrowserEvent}
 */
ol.MapBrowserEvent = function(type, map, originalEvent, opt_frameState) {

  // ...

  /**
   * @type {ol.Coordinate}
   * @api
   */
  this.coordinate = map.getEventCoordinate(this.originalEvent);

  // ...

};
```

### Override methods in custom classes

For custom subclasses in applications, which can be created using `ol.inherits`, the API may want to make certain methods available to override. In addition to marking such methods as `@api`, they should also be added to an interface in `oli.js`:
```js
/**
 * @interface
 */
oli.control.Control = function() {};

/**
 * @param {ol.Map} map Map.
 * @return {undefined} Undefined.
 */
oli.control.Control.prototype.setMap = function(map) {};

```
This interface must be implemented by the class in the source file (`src/ol/control/control.js`):
```js
/**
 * ...
 * @constructor
 * @implements {oli.control.Control}
 */
ol.control.Control = function(options) {
  // ...
};

// ...

/**
 * Application subclasses may override this.
 * @param {ol.Map} map Map.
 * @api
 */
ol.control.Control.prototype.setMap = function(map) {
  // ...
};
```
See Custom controls example for an example of how this can be used.

### Export object literals

Object literals cannot be exported like classes. To make sure that their properties do not get renamed, they go in `olx.js`:
```js
/**
 * @typedef {{element: (Element|undefined),
 *     target: (Element|string|undefined)}}
 * @api
 */
olx.control.ControlOptions;

/**
 * The element is the control's container element. This only needs to be
 * specified if you're developing a custom control.
 * @type {Element|undefined}
 */
olx.control.ControlOptions.prototype.element;

/**
 * Specify a target if you want the control to be rendered outside of the map's
 * viewport.
 * @type {Element|string|undefined}
 */
olx.control.ControlOptions.prototype.target;
```
In the source code, the name used for the typedef is used as type whenever this object literal is expected:
```js
/**
 * ...
 * @param {olx.control.ControlOptions} options Control options.
 */
ol.control.Control = function(options) {
  // ...
};
```
