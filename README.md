# OpenLayers

[OpenLayers](https://openlayers.org/) is a high-performance, feature-packed library for creating interactive maps on the web. It can display map tiles, vector data and markers loaded from any source on any web page. OpenLayers has been developed to further the use of geographic information of all kinds. It is completely free, Open Source JavaScript, released under the [BSD 2-Clause License](https://opensource.org/licenses/BSD-2-Clause).

## Getting Started

Install the [`ol` package](https://www.npmjs.com/package/ol):

```
npm install ol
```

Import just what you need for your application:

```js
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';

new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new XYZ({
        url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      })
    })
  ],
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});
```

See the following examples for more detail on bundling OpenLayers with your application:

 * Using [Rollup](https://github.com/openlayers/ol-rollup)
 * Using [Webpack](https://github.com/openlayers/ol-webpack)
 * Using [Parcel](https://github.com/openlayers/ol-parcel)
 * Using [Browserify](https://github.com/openlayers/ol-browserify)

## Sponsors

OpenLayers appreciates contributions of all kinds.  We especially want to thank our fiscal sponsors who contribute to ongoing project maintenance.

<br>

[![Pozi logo](./sponsor-logos/pozi.png)](https://pozi.com/)

> Pozi helps connect communities through spatial thinking.
> We love Openlayers and it forms a core part of our platform.
> https://pozi.com/ https://app.pozi.com/

<br>

[![yey'maps logo](./sponsor-logos/yeymaps.png)](https://www.yeymaps.io/)

> yey'maps is a scalable cloud GIS suite that is developed with the
> powerful Openlayers API and the GDAL library.
> https://www.yeymaps.io/

<br>

[![GeoSolutions logo](./sponsor-logos/geosolutions.png)](https://www.geosolutionsgroup.com/)

> Your one-stop-shop for geospatial open source software.
> https://www.geosolutionsgroup.com/

<br>

[![ela-compil logo](./sponsor-logos/ela-compil.png)](https://ela.pl/)

> We develop leading Physical Security Information Management (PSIM) software.
> OpenLayers is the core of our map engine and we love it! 
> https://elacompil.recruitee.com/

<br>

See our [GitHub sponsors page](https://github.com/sponsors/openlayers) or [Open Collective](https://opencollective.com/openlayers/contribute/sponsors-214/checkout) if you too are interested in becoming a regular sponsor.

## ES Modules

The `ol` package contains a `src/` folder with the sources, authored as [ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules). To use these untranspiled sources, either import modules from `ol/src` instead of `ol`, or configure your bundler with an alias pointing to `ol/src` for the `ol` package.

## TypeScript support

The [ol package](https://npmjs.com/package/ol) includes auto-generated TypeScript declarations as `*.d.ts` files.

## Supported Browsers

OpenLayers runs on all modern browsers that support [HTML5](https://html.spec.whatwg.org/multipage/) and [ECMAScript 5](https://262.ecma-international.org/5.1/). This includes Chrome, Firefox, Safari and Edge.

For older browsers and platforms (Internet Explorer, Android 4.x, iOS v12 and older, Safari v12 and older), polyfills may be needed for the following browser features:

* [`fetch`](https://caniuse.com/fetch): Available from [polyfill.io](https://polyfill.io/).
* [`requestAnimationFrame`](https://caniuse.com/requestanimationframe): Available from [polyfill.io](https://polyfill.io/).
* [`element.prototype.classList` (`add`/`remove`)](https://caniuse.com/classlist): Available from [polyfill.io](https://polyfill.io/).
* [`URL` API](https://caniuse.com/url): Available from [polyfill.io](https://polyfill.io/).
* [`TextDecoder`](https://caniuse.com/textencoder): Available from [polyfill.io](https://polyfill.io/).
* [`Number.isInteger`](https://caniuse.com/isInteger): Available from [polyfill.io](https://polyfill.io/).
* [Pointer events](https://caniuse.com/pointer): Use [elm-pep](https://npmjs.com/package/elm-pep) (lightweight) or [pepjs](https://npmjs.com/package/pepjs) (for really, really old browsers).

[`ol/source/GeoTIFF`](https://openlayers.org/en/latest/apidoc/module-ol_source_GeoTIFF-GeoTIFFSource.html) requires a browser that supports [ECMAScript 6](https://262.ecma-international.org/6.0/). Additionally a polyfill for [`Promise.allSettled`](https://caniuse.com/mdn-javascript_builtins_promise_allsettled) may be needed.

## Documentation

Check out the [hosted examples](https://openlayers.org/en/latest/examples/), the [workshop](https://openlayers.org/workshop/) or the [API documentation](https://openlayers.org/en/latest/apidoc/).

## Bugs

Please use the [GitHub issue tracker](https://github.com/openlayers/openlayers/issues) for all bugs and feature requests. Before creating a new issue, do a quick search to see if the problem has been reported already.

## Contributing

Please see our guide on [contributing](CONTRIBUTING.md) if you're interested in getting involved.

## Community

- Need help? Find it on [Stack Overflow using the tag 'openlayers'](https://stackoverflow.com/questions/tagged/openlayers)
- Follow [@openlayers](https://twitter.com/openlayers) on Twitter

![Test Status](https://github.com/openlayers/openlayers/workflows/Test/badge.svg)
