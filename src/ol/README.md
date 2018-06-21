# ol

OpenLayers as ES modules.

## Usage

Add the `ol` package as a dependency to your project.

    npm install ol --save

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

 * Using [Rollup & Uglify](https://gist.github.com/tschaub/8beb328ea72b36446fc2198d008287de)
 * Using [Rollup & Closure Compiler](https://gist.github.com/tschaub/32a5692bedac5254da24fa3b12072f35)
 * Using [Webpack & Uglify](https://gist.github.com/tschaub/79025aef325cd2837364400a105405b8)
 * Using [Webpack & Closure Compiler](https://gist.github.com/ahocevar/8ceafc6293455ba491dd9be12c15761f)
 * Using [Browserify & Uglify](https://gist.github.com/tschaub/4bfb209a8f809823f1495b2e4436018e)

## Module Identifiers

The module identifiers shown in the above snippet (e.g. `ol/Map`, note the CamelCase module name) are default exports of constructors. There are also modules like 'ol/proj' (note the lowercase module name), which provide named exports for utility functions and constants, e.g.

```js
import {fromLonLat} from 'ol/proj';

map.setCenter(fromLonLat([16, 48]));
```
See the [API documentation](http://openlayers.org/en/latest/apidoc/) for a reference of all modules, and just keep in mind: CamelCase modules provide a default export, lowercase modules provide named exports.
