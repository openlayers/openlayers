## Upgrade notes

### v3.5.0

* The following experimental methods have been removed from `ol.Object`: `bindTo`, `unbind`, and `unbindAll`.  If you want to get notification about `ol.Object` property changes, you can listen for the `'propertychange'` event (e.g. `object.on('propertychange', listener)`).  Two-way binding can be set up at the application level using property change listeners.  See [#3472](https://github.com/openlayers/ol3/pull/3472) for details on the change.

* The experimental `ol.dom.Input` component has been removed.  If you need to synchronize the state of a dom Input element with an `ol.Object`, this can be accomplished using listeners for change events.  For example, you might bind the state of a checkbox type input with a layer's visibility like this:

  ```js
  var layer = new ol.layer.Tile();
  var checkbox = document.querySelector('#checkbox');

  checkbox.addEventListener('change', function() {
    var checked = this.checked;
    if (checked !== layer.getVisible()) {
      layer.setVisible(checked);
    }
  });

  layer.on('change:visible', function() {
    var visible = this.getVisible();
    if (visible !== checkbox.checked) {
      checkbox.checked = visible;
    }
  });
  ```

* When manually loading an image for `ol.style.Icon`, the image size should now be set
with the `imgSize` option and not with `size`. `size` is supposed to be used for the
size of a sub-rectangle in an image sprite.

### v3.4.0

There should be nothing special required when upgrading from v3.3.0 to v3.4.0.

### v3.3.0

* The `ol.events.condition.mouseMove` function was replaced by `ol.events.condition.pointerMove` (see [#3281](https://github.com/openlayers/ol3/pull/3281)). For example, if you use `ol.events.condition.mouseMove` as the condition in a `Select` interaction then you now need to use `ol.events.condition.pointerMove`:

  ```js
  var selectInteraction = new ol.interaction.Select({
    condition: ol.events.condition.pointerMove
    // …
  });
  ```
