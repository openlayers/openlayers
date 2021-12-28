# 6.10.0

Just in time for the new year, the 6.10 release brings another great batch of features and fixes for your OpenLayers applications.

#### WebGL rendering

You can now update the style for your WebGL tile layers with `layer.setStyle()`.  Keep in mind that it is more efficient to use style variables if you want to adjust styling on every render frame.  However, in cases where you want to completely reconfigure the style, you can use the new `layer.setStyle()` method.

Additional WebGL tile layer rendering enhancements:
 * A new `palette` operator was added that allows styling raster data based on a colormap.
 * The `band` operator accepts expressions for the band number (in addition to numeric literals) – allowing for bands to be set by user provided style variables, for example.
 * Tile layers now dispatch `prerender`, `postrender`, `precompose` and `postcompose` events with access to the WebGL rendering context.
 * Layers that are adjacent to one another now share a single canvas element and rendering context – allowing for more layers in your maps before exhausting the browser's context limit.

#### Vector tiles

The Mapbox vector layer now works more easily with other vector tile providers.  In addition, vector tile layers can now be configured with a background color.

#### New `interpolate` option for sources

Sources now have an `interpolate` option.  This option controls whether data from the source is interpolated when resampling.

For `ol/source/DataTile` sources, the default is `interpolate: false`.  This means that when a data tile source is used with a WebGL tile layer renderer, your style expression will have access to pixel values in the data tiles without interpolation.  If this option is set to true, linear interpolation will be used when over- or under-sampling the data.

#### Deprecation of the `imageSmoothing` option for sources

The `imageSmoothing` option for sources has been deprecated and will be removed in the next major release.  Use the `interpolate` option instead.

```js
// if you were using `imageSmoothing`
const before = new TileSource({
  imageSmoothing: false
});

// use the `interpolate` option instead
const after = new TileSource({
  interpolate: false
});
```

#### List of all changes

See below for more features and fixes.

 * [#13155](https://github.com/openlayers/openlayers/pull/13155) - Allow interpolation to be configured for data tile sources ([@tschaub](https://github.com/tschaub))
 * [#13165](https://github.com/openlayers/openlayers/pull/13165) - Do not exceed maximum call stack when parsing TopoJSON ([@ahocevar](https://github.com/ahocevar))
 * [#13158](https://github.com/openlayers/openlayers/pull/13158) - Add example for dynamic clusters ([@ahocevar](https://github.com/ahocevar))
 * [#13156](https://github.com/openlayers/openlayers/pull/13156) - Ensure that tile range covers all pixels ([@tschaub](https://github.com/tschaub))
 * [#13154](https://github.com/openlayers/openlayers/pull/13154) - Update Export Map example to handle WebGL ([@mike-000](https://github.com/mike-000))
 * [#13147](https://github.com/openlayers/openlayers/pull/13147) - Support rendering with a palette in WebGL ([@tschaub](https://github.com/tschaub))
 * [#13142](https://github.com/openlayers/openlayers/pull/13142) - Include transpacific flights in Flight Animation example ([@mike-000](https://github.com/mike-000))
 * [#13150](https://github.com/openlayers/openlayers/pull/13150) - Include layer opacity in Heatmap shader ([@mike-000](https://github.com/mike-000))
 * [#13149](https://github.com/openlayers/openlayers/pull/13149) - Add layer also for programmatically selected features ([@ahocevar](https://github.com/ahocevar))
 * [#13151](https://github.com/openlayers/openlayers/pull/13151) - Avoid error accessing attributes when context is lost ([@mike-000](https://github.com/mike-000))
 * [#13144](https://github.com/openlayers/openlayers/pull/13144) - Replace deprecated syntax in example ([@mike-000](https://github.com/mike-000))
 * [#13131](https://github.com/openlayers/openlayers/pull/13131) - Unset canvas css in stylesheet ([@ahocevar](https://github.com/ahocevar))
 * [#13130](https://github.com/openlayers/openlayers/pull/13130) - Allow WebGL tile layers to be constructed without a source ([@tschaub](https://github.com/tschaub))
 * [#13126](https://github.com/openlayers/openlayers/pull/13126) - Preserve the drawing buffer by default for WebGL layers ([@tschaub](https://github.com/tschaub))
 * [#13127](https://github.com/openlayers/openlayers/pull/13127) - Fix for range slider on IE ([@mike-000](https://github.com/mike-000))
 * [#13095](https://github.com/openlayers/openlayers/pull/13095) - Render is only complete when no tiles are queued ([@ahocevar](https://github.com/ahocevar))
 * [#13120](https://github.com/openlayers/openlayers/pull/13120) - Populate view's object properties ([@ahocevar](https://github.com/ahocevar))
 * [#13102](https://github.com/openlayers/openlayers/pull/13102) - update line-arrows example ([@jipexu](https://github.com/jipexu))
 * [#13119](https://github.com/openlayers/openlayers/pull/13119) - Dispatch precompose and postcompose events for WebGL layers ([@tschaub](https://github.com/tschaub))
 * [#13118](https://github.com/openlayers/openlayers/pull/13118) - Add a layer opacity example ([@tschaub](https://github.com/tschaub))
 * [#13115](https://github.com/openlayers/openlayers/pull/13115) - Lazily create resources for worker ([@tschaub](https://github.com/tschaub))
 * [#13103](https://github.com/openlayers/openlayers/pull/13103) - Assume limited precision when rounding ([@tschaub](https://github.com/tschaub))
 * [#13097](https://github.com/openlayers/openlayers/pull/13097) - Use correct terrain-rgb tile size and update max zoom ([@mike-000](https://github.com/mike-000))
 * [#13101](https://github.com/openlayers/openlayers/pull/13101) - Fix View set center to undefined ([@M393](https://github.com/M393))
 * [#13085](https://github.com/openlayers/openlayers/pull/13085) - Add layer background ([@ahocevar](https://github.com/ahocevar))
 * [#13083](https://github.com/openlayers/openlayers/pull/13083) - Support expressions for band arguments ([@tschaub](https://github.com/tschaub))
 * [#13084](https://github.com/openlayers/openlayers/pull/13084) - Normalize relative sprite and glyph urls for style url ([@ahocevar](https://github.com/ahocevar))
 * [#13020](https://github.com/openlayers/openlayers/pull/13020) - Allow WebGL tile layer style to be updated ([@tschaub](https://github.com/tschaub))
 * [#13073](https://github.com/openlayers/openlayers/pull/13073) - Fall back to standard load handling when decode fails ([@ahocevar](https://github.com/ahocevar))
 * [#13077](https://github.com/openlayers/openlayers/pull/13077) - update draw and modify features example ([@jipexu](https://github.com/jipexu))
 * [#13069](https://github.com/openlayers/openlayers/pull/13069) - Normalize based on GDAL stats metadata ([@tschaub](https://github.com/tschaub))
 * [#13070](https://github.com/openlayers/openlayers/pull/13070) - Use source minzoom if not configured otherwise ([@ahocevar](https://github.com/ahocevar))
 * [#13065](https://github.com/openlayers/openlayers/pull/13065) - Fix typo in example ([@jipexu](https://github.com/jipexu))
 * [#13060](https://github.com/openlayers/openlayers/pull/13060) - Avoid fetching data outside the grid extent ([@tschaub](https://github.com/tschaub))
 * [#13054](https://github.com/openlayers/openlayers/pull/13054) - Updates for newer version of the OGC API spec draft ([@ahocevar](https://github.com/ahocevar))
 * [#13045](https://github.com/openlayers/openlayers/pull/13045) - Fix tiles and background handling ([@ahocevar](https://github.com/ahocevar))
 * [#13030](https://github.com/openlayers/openlayers/pull/13030) - Correctly set popover position in geographic example ([@MoonE](https://github.com/MoonE))
 * [#13031](https://github.com/openlayers/openlayers/pull/13031) - Allow data tile source loader to return a value or a promise ([@tschaub](https://github.com/tschaub))
 * [#13026](https://github.com/openlayers/openlayers/pull/13026) - Fix strokeStyle documentation ([@ahocevar](https://github.com/ahocevar))
 * [#13027](https://github.com/openlayers/openlayers/pull/13027) - Restore the security scan workflow ([@openlayers](https://github.com/openlayers))
 * [#13025](https://github.com/openlayers/openlayers/pull/13025) - Add background to MapboxVector layer ([@ahocevar](https://github.com/ahocevar))
 * [#13013](https://github.com/openlayers/openlayers/pull/13013) - Use appropriate UNPACK_ALIGNMENT for data textures ([@mike-000](https://github.com/mike-000))
 * [#13021](https://github.com/openlayers/openlayers/pull/13021) - Add the renderer type to generic layer template variables ([@tschaub](https://github.com/tschaub))
 * [#13022](https://github.com/openlayers/openlayers/pull/13022) - Update the security scan task ([@tschaub](https://github.com/tschaub))
 * [#13015](https://github.com/openlayers/openlayers/pull/13015) - Additional types for WebGL renderer, sources, and tiles ([@tschaub](https://github.com/tschaub))
 * [#13012](https://github.com/openlayers/openlayers/pull/13012) - Remove unused dependencies ([@tschaub](https://github.com/tschaub))
 * [#12976](https://github.com/openlayers/openlayers/pull/12976) - Handle ReprojTile in ol/layer/WebGLTile ([@mike-000](https://github.com/mike-000))
 * [#13011](https://github.com/openlayers/openlayers/pull/13011) - Use registry URL when publishing ([@tschaub](https://github.com/tschaub))
 * [#13009](https://github.com/openlayers/openlayers/pull/13009) - Use workflow_run event to deploy pull request previews ([@tschaub](https://github.com/tschaub))
 * [#12965](https://github.com/openlayers/openlayers/pull/12965) - Allow canvas reuse for WebGL layers ([@tschaub](https://github.com/tschaub))
 * [#12999](https://github.com/openlayers/openlayers/pull/12999) - Fix style related apidoc issues ([@MoonE](https://github.com/MoonE))
 * [#12978](https://github.com/openlayers/openlayers/pull/12978) - Add null to style jsdoc of VectorImage ([@EvertEt](https://github.com/EvertEt))
 * [#12997](https://github.com/openlayers/openlayers/pull/12997) - Lazily create the WebGL helper ([@tschaub](https://github.com/tschaub))
 * [#12996](https://github.com/openlayers/openlayers/pull/12996) - Align labels with the Select elements in the Raster Reprojection example ([@mike-000](https://github.com/mike-000))
 * [#12994](https://github.com/openlayers/openlayers/pull/12994) - Add a map property to layers ([@tschaub](https://github.com/tschaub))
 * [#12987](https://github.com/openlayers/openlayers/pull/12987) - Browser test config update ([@tschaub](https://github.com/tschaub))
 * [#12939](https://github.com/openlayers/openlayers/pull/12939) - Example that demonstrates a color expression using variables ([@tschaub](https://github.com/tschaub))
 * [#12962](https://github.com/openlayers/openlayers/pull/12962) - No context sharing when layer opacity is set ([@ahocevar](https://github.com/ahocevar))
 * [#12964](https://github.com/openlayers/openlayers/pull/12964) - Updated Bing Maps key ([@tschaub](https://github.com/tschaub))
 * [#12958](https://github.com/openlayers/openlayers/pull/12958) - Reuse temporary canvas in getDataAtPixel() ([@mike-000](https://github.com/mike-000))
 * [#12893](https://github.com/openlayers/openlayers/pull/12893) - Allow map target to be an external window ([@andrewcoder002](https://github.com/andrewcoder002))
 * [#12955](https://github.com/openlayers/openlayers/pull/12955) - Make MapboxVector layer work in more access key scenarios ([@ahocevar](https://github.com/ahocevar))
 * [#12935](https://github.com/openlayers/openlayers/pull/12935) - fix bug #12913 ([@mrpan](https://github.com/mrpan))
 * [#12933](https://github.com/openlayers/openlayers/pull/12933) - Include WebGL context in render events for WebGL layers ([@tschaub](https://github.com/tschaub))
 * [#12917](https://github.com/openlayers/openlayers/pull/12917) - Make removeFeature consistent with other remove methods ([@mike-000](https://github.com/mike-000))
 * [#12918](https://github.com/openlayers/openlayers/pull/12918) - Add setDisplacement method to ol/style/Image and subclasses ([@mike-000](https://github.com/mike-000))
 * [#12930](https://github.com/openlayers/openlayers/pull/12930) - Fix flaky view animation test ([@MoonE](https://github.com/MoonE))
 * [#12915](https://github.com/openlayers/openlayers/pull/12915) - Test the new pull request deploy previews ([@tschaub](https://github.com/tschaub))
 * [#12916](https://github.com/openlayers/openlayers/pull/12916) - Updates to deploy-preview job ([@openlayers](https://github.com/openlayers))
 * [#12914](https://github.com/openlayers/openlayers/pull/12914) - Build site preview as a GitHub action ([@tschaub](https://github.com/tschaub))
 * [#12891](https://github.com/openlayers/openlayers/pull/12891) - Restore browser compatibility where possible ([@mike-000](https://github.com/mike-000))
 * [#12899](https://github.com/openlayers/openlayers/pull/12899) - Update docs to mention Vite ([@tschaub](https://github.com/tschaub))
 * [#12890](https://github.com/openlayers/openlayers/pull/12890) - Release 6.9.0 ([@openlayers](https://github.com/openlayers))


<details>
  <summary>Dependency Updates</summary>

 * [#13162](https://github.com/openlayers/openlayers/pull/13162) - Bump yargs from 17.3.0 to 17.3.1 ([@openlayers](https://github.com/openlayers))
 * [#13163](https://github.com/openlayers/openlayers/pull/13163) - Bump rollup from 2.61.1 to 2.62.0 ([@openlayers](https://github.com/openlayers))
 * [#13161](https://github.com/openlayers/openlayers/pull/13161) - Bump webpack-dev-server from 4.6.0 to 4.7.1 ([@openlayers](https://github.com/openlayers))
 * [#13160](https://github.com/openlayers/openlayers/pull/13160) - Bump puppeteer from 13.0.0 to 13.0.1 ([@openlayers](https://github.com/openlayers))
 * [#13140](https://github.com/openlayers/openlayers/pull/13140) - Bump @rollup/plugin-node-resolve from 13.0.6 to 13.1.1 ([@openlayers](https://github.com/openlayers))
 * [#13132](https://github.com/openlayers/openlayers/pull/13132) - Bump copy-webpack-plugin from 10.1.0 to 10.2.0 ([@openlayers](https://github.com/openlayers))
 * [#13141](https://github.com/openlayers/openlayers/pull/13141) - Bump webpack-dev-middleware from 5.2.2 to 5.3.0 ([@openlayers](https://github.com/openlayers))
 * [#13133](https://github.com/openlayers/openlayers/pull/13133) - Bump eslint from 8.4.1 to 8.5.0 ([@openlayers](https://github.com/openlayers))
 * [#13139](https://github.com/openlayers/openlayers/pull/13139) - Bump @babel/core from 7.16.0 to 7.16.5 ([@openlayers](https://github.com/openlayers))
 * [#13136](https://github.com/openlayers/openlayers/pull/13136) - Bump @babel/preset-env from 7.16.4 to 7.16.5 ([@openlayers](https://github.com/openlayers))
 * [#13137](https://github.com/openlayers/openlayers/pull/13137) - Bump express from 4.17.1 to 4.17.2 ([@openlayers](https://github.com/openlayers))
 * [#13138](https://github.com/openlayers/openlayers/pull/13138) - Bump ol-mapbox-style from 6.7.0 to 6.8.1 ([@openlayers](https://github.com/openlayers))
 * [#13134](https://github.com/openlayers/openlayers/pull/13134) - Bump marked from 4.0.7 to 4.0.8 ([@openlayers](https://github.com/openlayers))
 * [#13106](https://github.com/openlayers/openlayers/pull/13106) - Bump webpack from 5.64.4 to 5.65.0 ([@openlayers](https://github.com/openlayers))
 * [#13108](https://github.com/openlayers/openlayers/pull/13108) - Bump rollup from 2.60.2 to 2.61.1 ([@openlayers](https://github.com/openlayers))
 * [#13107](https://github.com/openlayers/openlayers/pull/13107) - Bump copy-webpack-plugin from 10.0.0 to 10.1.0 ([@openlayers](https://github.com/openlayers))
 * [#13105](https://github.com/openlayers/openlayers/pull/13105) - Bump eslint from 8.4.0 to 8.4.1 ([@openlayers](https://github.com/openlayers))
 * [#13109](https://github.com/openlayers/openlayers/pull/13109) - Bump marked from 4.0.6 to 4.0.7 ([@openlayers](https://github.com/openlayers))
 * [#13110](https://github.com/openlayers/openlayers/pull/13110) - Bump puppeteer from 12.0.1 to 13.0.0 ([@openlayers](https://github.com/openlayers))
 * [#13111](https://github.com/openlayers/openlayers/pull/13111) - Bump clean-css-cli from 5.4.2 to 5.5.0 ([@openlayers](https://github.com/openlayers))
 * [#13091](https://github.com/openlayers/openlayers/pull/13091) - Bump rollup from 2.60.1 to 2.60.2 ([@openlayers](https://github.com/openlayers))
 * [#13089](https://github.com/openlayers/openlayers/pull/13089) - Bump eslint from 8.3.0 to 8.4.0 ([@openlayers](https://github.com/openlayers))
 * [#13090](https://github.com/openlayers/openlayers/pull/13090) - Bump marked from 4.0.5 to 4.0.6 ([@openlayers](https://github.com/openlayers))
 * [#13093](https://github.com/openlayers/openlayers/pull/13093) - Bump yargs from 17.2.1 to 17.3.0 ([@openlayers](https://github.com/openlayers))
 * [#13092](https://github.com/openlayers/openlayers/pull/13092) - Bump puppeteer from 12.0.0 to 12.0.1 ([@openlayers](https://github.com/openlayers))
 * [#13088](https://github.com/openlayers/openlayers/pull/13088) - Bump geotiff from 1.0.8 to 1.0.9 ([@openlayers](https://github.com/openlayers))
 * [#13057](https://github.com/openlayers/openlayers/pull/13057) - Bump puppeteer from 11.0.0 to 12.0.0 ([@openlayers](https://github.com/openlayers))
 * [#13055](https://github.com/openlayers/openlayers/pull/13055) - Bump webpack from 5.64.2 to 5.64.4 ([@openlayers](https://github.com/openlayers))
 * [#13056](https://github.com/openlayers/openlayers/pull/13056) - Bump webpack-dev-server from 4.5.0 to 4.6.0 ([@openlayers](https://github.com/openlayers))
 * [#13058](https://github.com/openlayers/openlayers/pull/13058) - Bump marked from 4.0.4 to 4.0.5 ([@openlayers](https://github.com/openlayers))
 * [#13032](https://github.com/openlayers/openlayers/pull/13032) - Bump webpack from 5.64.0 to 5.64.2 ([@openlayers](https://github.com/openlayers))
 * [#13033](https://github.com/openlayers/openlayers/pull/13033) - Bump webpack-sources from 3.2.1 to 3.2.2 ([@openlayers](https://github.com/openlayers))
 * [#13034](https://github.com/openlayers/openlayers/pull/13034) - Bump rollup from 2.60.0 to 2.60.1 ([@openlayers](https://github.com/openlayers))
 * [#13035](https://github.com/openlayers/openlayers/pull/13035) - Bump copy-webpack-plugin from 9.1.0 to 10.0.0 ([@openlayers](https://github.com/openlayers))
 * [#13036](https://github.com/openlayers/openlayers/pull/13036) - Bump webpack-dev-middleware from 5.2.1 to 5.2.2 ([@openlayers](https://github.com/openlayers))
 * [#13037](https://github.com/openlayers/openlayers/pull/13037) - Bump @babel/preset-env from 7.16.0 to 7.16.4 ([@openlayers](https://github.com/openlayers))
 * [#13038](https://github.com/openlayers/openlayers/pull/13038) - Bump marked from 4.0.3 to 4.0.4 ([@openlayers](https://github.com/openlayers))
 * [#13039](https://github.com/openlayers/openlayers/pull/13039) - Bump eslint from 8.2.0 to 8.3.0 ([@openlayers](https://github.com/openlayers))
 * [#13040](https://github.com/openlayers/openlayers/pull/13040) - Bump ol-mapbox-style from 6.5.2 to 6.5.3 ([@openlayers](https://github.com/openlayers))
 * [#13041](https://github.com/openlayers/openlayers/pull/13041) - Bump karma from 6.3.8 to 6.3.9 ([@openlayers](https://github.com/openlayers))
 * [#13001](https://github.com/openlayers/openlayers/pull/13001) - Bump webpack from 5.62.1 to 5.64.0 ([@openlayers](https://github.com/openlayers))
 * [#13002](https://github.com/openlayers/openlayers/pull/13002) - Bump terser-webpack-plugin from 5.2.4 to 5.2.5 ([@openlayers](https://github.com/openlayers))
 * [#13003](https://github.com/openlayers/openlayers/pull/13003) - Bump copy-webpack-plugin from 9.0.1 to 9.1.0 ([@openlayers](https://github.com/openlayers))
 * [#13004](https://github.com/openlayers/openlayers/pull/13004) - Bump rollup from 2.59.0 to 2.60.0 ([@openlayers](https://github.com/openlayers))
 * [#13005](https://github.com/openlayers/openlayers/pull/13005) - Bump webpack-dev-server from 4.4.0 to 4.5.0 ([@openlayers](https://github.com/openlayers))
 * [#13006](https://github.com/openlayers/openlayers/pull/13006) - Bump ol-mapbox-style from 6.5.1 to 6.5.2 ([@openlayers](https://github.com/openlayers))
 * [#13007](https://github.com/openlayers/openlayers/pull/13007) - Bump marked from 4.0.0 to 4.0.3 ([@openlayers](https://github.com/openlayers))
 * [#13008](https://github.com/openlayers/openlayers/pull/13008) - Bump glob from 7.1.7 to 7.2.0 ([@openlayers](https://github.com/openlayers))
 * [#12968](https://github.com/openlayers/openlayers/pull/12968) - Bump sinon from 11.1.2 to 12.0.1 ([@openlayers](https://github.com/openlayers))
 * [#12969](https://github.com/openlayers/openlayers/pull/12969) - Bump marked from 3.0.8 to 4.0.0 ([@openlayers](https://github.com/openlayers))
 * [#12973](https://github.com/openlayers/openlayers/pull/12973) - Bump eslint from 8.1.0 to 8.2.0 ([@openlayers](https://github.com/openlayers))
 * [#12972](https://github.com/openlayers/openlayers/pull/12972) - Bump karma-firefox-launcher from 2.1.1 to 2.1.2 ([@openlayers](https://github.com/openlayers))
 * [#12971](https://github.com/openlayers/openlayers/pull/12971) - Bump puppeteer from 10.4.0 to 11.0.0 ([@openlayers](https://github.com/openlayers))
 * [#12970](https://github.com/openlayers/openlayers/pull/12970) - Bump karma from 6.3.6 to 6.3.8 ([@openlayers](https://github.com/openlayers))
 * [#12967](https://github.com/openlayers/openlayers/pull/12967) - Bump webpack from 5.61.0 to 5.62.1 ([@openlayers](https://github.com/openlayers))
 * [#12948](https://github.com/openlayers/openlayers/pull/12948) - Bump webpack from 5.59.1 to 5.61.0 ([@openlayers](https://github.com/openlayers))
 * [#12945](https://github.com/openlayers/openlayers/pull/12945) - Bump rollup from 2.58.3 to 2.59.0 ([@openlayers](https://github.com/openlayers))
 * [#12946](https://github.com/openlayers/openlayers/pull/12946) - Bump @babel/preset-env from 7.15.8 to 7.16.0 ([@openlayers](https://github.com/openlayers))
 * [#12947](https://github.com/openlayers/openlayers/pull/12947) - Bump @babel/core from 7.15.8 to 7.16.0 ([@openlayers](https://github.com/openlayers))
 * [#12949](https://github.com/openlayers/openlayers/pull/12949) - Bump karma from 6.3.5 to 6.3.6 ([@openlayers](https://github.com/openlayers))
 * [#12944](https://github.com/openlayers/openlayers/pull/12944) - Bump webpack-dev-server from 4.3.1 to 4.4.0 ([@openlayers](https://github.com/openlayers))
 * [#12923](https://github.com/openlayers/openlayers/pull/12923) - Bump @rollup/plugin-commonjs from 21.0.0 to 21.0.1 ([@openlayers](https://github.com/openlayers))
 * [#12922](https://github.com/openlayers/openlayers/pull/12922) - Bump webpack-cli from 4.9.0 to 4.9.1 ([@openlayers](https://github.com/openlayers))
 * [#12929](https://github.com/openlayers/openlayers/pull/12929) - Bump rollup from 2.58.0 to 2.58.3 ([@openlayers](https://github.com/openlayers))
 * [#12920](https://github.com/openlayers/openlayers/pull/12920) - Bump marked from 3.0.7 to 3.0.8 ([@openlayers](https://github.com/openlayers))
 * [#12924](https://github.com/openlayers/openlayers/pull/12924) - Bump clean-css-cli from 5.4.1 to 5.4.2 ([@openlayers](https://github.com/openlayers))
 * [#12926](https://github.com/openlayers/openlayers/pull/12926) - Bump @rollup/plugin-node-resolve from 13.0.5 to 13.0.6 ([@openlayers](https://github.com/openlayers))
 * [#12928](https://github.com/openlayers/openlayers/pull/12928) - Bump babel-loader from 8.2.2 to 8.2.3 ([@openlayers](https://github.com/openlayers))
 * [#12921](https://github.com/openlayers/openlayers/pull/12921) - Bump webpack from 5.58.2 to 5.59.1 ([@openlayers](https://github.com/openlayers))
 * [#12927](https://github.com/openlayers/openlayers/pull/12927) - Bump eslint from 8.0.1 to 8.1.0 ([@openlayers](https://github.com/openlayers))
 * [#12919](https://github.com/openlayers/openlayers/pull/12919) - Bump karma from 6.3.4 to 6.3.5 ([@openlayers](https://github.com/openlayers))
 * [#12902](https://github.com/openlayers/openlayers/pull/12902) - Bump eslint from 7.32.0 to 8.0.1 ([@openlayers](https://github.com/openlayers))
 * [#12904](https://github.com/openlayers/openlayers/pull/12904) - Bump mocha from 9.1.2 to 9.1.3 ([@openlayers](https://github.com/openlayers))
 * [#12905](https://github.com/openlayers/openlayers/pull/12905) - Bump glob from 7.1.7 to 7.2.0 ([@openlayers](https://github.com/openlayers))
 * [#12903](https://github.com/openlayers/openlayers/pull/12903) - Bump webpack from 5.58.1 to 5.58.2 ([@openlayers](https://github.com/openlayers))


</details>
