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

![Pozi logo](./sponsor-logos/pozi.png)

> Pozi helps connect communities through spatial thinking.
> We love Openlayers and it forms a core part of our platform.
> https://pozi.com/ https://app.pozi.com/

See our [Open Collective](https://opencollective.com/openlayers/contribute/sponsors-214/checkout) page if you too are interested in becoming a regular sponsor.

## IntelliSense support and type checking for VS Code

The ol package contains a src/ folder with JSDoc annotated sources. TypeScript can get type definitions from these sources with a [`jsconfig.json`](https://gist.github.com/ahocevar/9a7253cb4712e8bf38d75d8ac898e36c#file-jsconfig-json) (when authoring in JavaScript) or [`tsconfig.json`](https://gist.github.com/ahocevar/ad7b52a2fa0f6c5495193cd695ab3780#file-tsconfig-json) (when authoring in TypeScript) config file in the project root:

<details><summary>jsconfig.json</summary>

```json
{
  "compilerOptions": {
    "checkJs": true,
    "baseUrl": "./",
    "paths": {
      "ol": ["node_modules/ol/src"],
      "ol/*": ["node_modules/ol/src/*"]
    }
  },
  "include": [
    "**/*.js",
    "node_modules/ol/**/*.js"
  ],
  "typeAcquisition": {
    "exclude": ["ol"]
  }
}
```

</details>
<details><summary>tsconfig.json</summary>

```json
{
  "compilerOptions": {
    "allowJs": true,
    "baseUrl": "./",
    "paths": {
      "ol": ["node_modules/ol/src"],
      "ol/*": ["node_modules/ol/src/*"]
    }
  },
  "include": [
    "**/*.ts",
    "node_modules/ol/**/*"
  ],
  "typeAcquisition": {
    "exclude": ["ol"]
  }
}
```

</details>

TypeScript users may want to use a [third-party types package](https://github.com/hanreev/types-ol) instead.

## Supported Browsers

OpenLayers runs on all modern browsers that support [HTML5](https://html.spec.whatwg.org/multipage/) and [ECMAScript 5](http://www.ecma-international.org/ecma-262/5.1/). This includes Chrome, Firefox, Safari and Edge.

For older browsers and platforms (Internet Explorer, Android 4.x, iOS v12 and older, Safari v12 and older), polyfills may be needed for the following browser features:

* [`requestAnimationFrame`](https://caniuse.com/#feat=requestanimationframe): Available from [polyfill.io](https://polyfill.io/).
* [`element.prototype.classList` (`add`/`remove`)](https://caniuse.com/#feat=classlist): Available from [polyfill.io](https://polyfill.io/).
* [`URL` API](https://caniuse.com/#feat=url): Available from [polyfill.io](https://polyfill.io/).
* [Pointer events](https://caniuse.com/#feat=pointer): Use [elm-pep](https://npmjs.com/package/elm-pep) (lightweight) or [@openlayers/pepjs](https://npmjs.com/package/pepjs) (for really, really old browsers).

## Documentation

Check out the [hosted examples](https://openlayers.org/en/latest/examples/), the [workshop](https://openlayers.org/workshop/) or the [API documentation](https://openlayers.org/en/latest/apidoc/).

## Bugs

Please use the [GitHub issue tracker](https://github.com/openlayers/openlayers/issues) for all bugs and feature requests. Before creating a new issue, do a quick search to see if the problem has been reported already.

## Contributing

Please see our guide on [contributing](CONTRIBUTING.md) if you're interested in getting involved.

## Community

- Need help? Find it on [Stack Overflow using the tag 'openlayers'](http://stackoverflow.com/questions/tagged/openlayers)
- Follow [@openlayers](https://twitter.com/openlayers) on Twitter

![Test Status](https://github.com/openlayers/openlayers/workflows/Test/badge.svg)
