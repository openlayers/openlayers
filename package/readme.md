# ol

OpenLayers as ES2015 modules.

**Note: This is still a work in progress.  Not yet ready for production.**

## Usage

Add the `ol` package as a dependency to your project.

    npm install ol@beta --save

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

Note that the module identifiers above (e.g. `ol/map`) are like the `ol.Map` names in the [API documentation](http://openlayers.org/en/latest/apidoc/) with `/` instead of `.` and all lowercase.  Also note that the, WebGL renderer is not available in this package.

See the following examples for more detail on bundling OpenLayers with your application:

 * Using [Rollup & Uglify](https://gist.github.com/tschaub/8beb328ea72b36446fc2198d008287de)
 * Using [Rollup & Closure Compiler](https://gist.github.com/tschaub/32a5692bedac5254da24fa3b12072f35)
 * Using [Webpack & Uglify](https://gist.github.com/tschaub/79025aef325cd2837364400a105405b8)
 * Using [Browserify & Uglify](https://gist.github.com/tschaub/4bfb209a8f809823f1495b2e4436018e)

This is still a work in progress.  See [openlayers/openlayers#6302](https://github.com/openlayers/openlayers/pull/6302) for ongoing discussion.
