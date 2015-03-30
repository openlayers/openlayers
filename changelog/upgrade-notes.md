## Upgrade notes

This file includes upgrade notes for applications that are using experimental features (parts of the API that are not yet marked as stable).

### v3.5.0

* If your application is using an `ol.source.ImageMapGuide`, `ol.source.ImageWMS`, or `ol.source.ImageStatic` with a custom `imageLoadFunction`, this function will now be called with an HTML image element instead of an `ol.Image` element as the first argument (see [#3427](https://github.com/openlayers/ol3/pull/3427)).

### v3.4.0

There are no special considerations for applications upgrading from `v3.3.0` to `v3.4.0`.

### v3.3.0

* The `ol.events.condition.mouseMove` function was replaced by `ol.events.condition.pointerMove` (see [#3281](https://github.com/openlayers/ol3/pull/3281)). For example, if you use `ol.events.condition.mouseMove` as the condition in a `Select` interaction then you now need to use `ol.events.condition.pointerMove`:

  ```js
  var selectInteraction = new ol.interaction.Select({
    condition: ol.events.condition.pointerMove
    // …
  });
  ```
