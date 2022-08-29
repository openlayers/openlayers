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
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
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

 * Using [Vite](https://github.com/openlayers/ol-vite)
 * Using [Rollup](https://github.com/openlayers/ol-rollup)
 * Using [webpack](https://github.com/openlayers/ol-webpack)
 * Using [Parcel](https://github.com/openlayers/ol-parcel)

For more detail on quick prototyping without the use of a Node.js based setup, see the [Skypack](https://github.com/openlayers/ol-skypack) example.

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

## TypeScript support

The [ol package](https://npmjs.com/package/ol) includes auto-generated TypeScript declarations as `*.d.ts` files.

## Supported Browsers

OpenLayers runs on all modern browsers (with greater than 1% global usage).  This includes Chrome, Firefox, Safari and Edge. For older browsers, [polyfills](https://polyfill.io/) will likely need to be added.

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
