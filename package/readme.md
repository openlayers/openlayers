# ol

OpenLayers as ES2015 modules.

## Usage

Add the `ol` package as a dependency to your project.

    npm install ol --save

Import just what you need for your application:

```js
import Map from 'ol/map';
import View from 'ol/view';
import TileLayer from 'ol/layer/tile';
import XYZ from 'ol/source/xyz';

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

The module identifiers above (e.g. `ol/map`) are like the `ol.Map` names in the [API documentation](http://openlayers.org/en/latest/apidoc/) with `/` instead of `.` and all lowercase.  Each module only has a `default` export (there are no other named exports).

Constructors are exported from dedicated modules.  For example, the `ol/layer/tile` module exports the `Tile` layer constructor.

Utility functions are available as properties of the default export from utility modules.  For example, the `getCenter` function is a property of the default export from the `ol/extent` utility module.
