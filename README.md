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

## IntelliSense support and type checking for VS Code

The `ol` package contains a `src/` folder with JSDoc annotated sources. TypeScript can get type definitions from these sources with a `jsconfig.json` config file in the project root:
```js
{
  "compilerOptions": {
    "checkJs": true,
    // Point to the JSDoc typed sources when using modules from the ol package
    "baseUrl": "./",
    "paths": {
      "ol": ["node_modules/ol/src"],
      "ol/*": ["node_modules/ol/src/*"]
    }
  },
  "include": [
    "**/*.js",
    "node_modules/ol/**/*.js"
  ]
}
```
Project template with this configuration: https://gist.github.com/9a7253cb4712e8bf38d75d8ac898e36c.

Note that the above only works when authoring in plain JavaScript. For similar configurations with a `tsconfig.json` in TypeScript projects, your mileage may vary.

## Supported Browsers

OpenLayers runs on all modern browsers that support [HTML5](https://html.spec.whatwg.org/multipage/) and [ECMAScript 5](http://www.ecma-international.org/ecma-262/5.1/). This includes Chrome, Firefox, Safari and Edge. For older browsers and platforms like Internet Explorer (down to version 9) and Android 4.x, [polyfills](http://polyfill.io) for `requestAnimationFrame` and `Element.prototype.classList` are required, and using the KML format requires a polyfill for `URL`.

## Documentation

Check out the [hosted examples](https://openlayers.org/en/latest/examples/), the [workshop](https://openlayers.org/workshop/) or the [API documentation](https://openlayers.org/en/latest/apidoc/).

## Bugs

Please use the [GitHub issue tracker](https://github.com/openlayers/openlayers/issues) for all bugs and feature requests. Before creating a new issue, do a quick search to see if the problem has been reported already.

## Contributing

Please see our guide on [contributing](CONTRIBUTING.md) if you're interested in getting involved.

## Community

- Need help? Find it on [Stack Overflow using the tag 'openlayers'](http://stackoverflow.com/questions/tagged/openlayers)
- Follow [@openlayers](https://twitter.com/openlayers) on Twitter

[![CircleCI](https://circleci.com/gh/openlayers/openlayers/tree/master.svg?style=svg)](https://circleci.com/gh/openlayers/openlayers/tree/master)
