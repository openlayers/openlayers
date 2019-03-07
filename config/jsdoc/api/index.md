<table><tr>
<th width="33.3%">Map</th><th width="33.3%">View</th><th width="33.3%">Layers</th>
</tr><tr>
<td><p>A [map](module-ol_Map-Map.html) is made of [layers](module-ol_layer_Base-BaseLayer.html), a [view](module-ol_View-View.html) to visualize them, [interactions](module-ol_interaction_Interaction-Interaction.html) to modify map content and [controls](module-ol_control_Control-Control.html) with UI components.</p>
[Overview](module-ol_Map-Map.html)<br>
[Creation](module-ol_Map-Map.html#Map)<br>
[Events](module-ol_MapBrowserEvent-MapBrowserEvent.html)</td>
<td><p>The view manages the visual parameters of the map view, like resolution or rotation.</p>
[View](module-ol_View-View.html) with center, projection, resolution and rotation</td>
<td><p>Layers are lightweight containers that get their data from [sources](module-ol_source_Source-Source.html).</p>
[ol/layer/Tile](module-ol_layer_Tile-TileLayer.html)<br>
[ol/layer/Image](module-ol_layer_Image-ImageLayer.html)<br>
[ol/layer/Vector](module-ol_layer_Vector-VectorLayer.html)<br>
[ol/layer/VectorTile](module-ol_layer_VectorTile-VectorTileLayer.html)</td>
</tr><tr>
<th>Controls</th><th>Interactions</th><th>Sources and formats</th>
</tr><tr>
<td>[Map default controls](module-ol_control_util.html#.defaults)<br>
[All controls](module-ol_control_Control-Control.html)
</td>
<td>
[Map default interactions](module-ol_interaction.html#~defaults)<br>
Interactions for [vector features](module-ol_Feature-Feature.html)
<ul><li>[ol/interaction/Select](module-ol_interaction_Select-Select.html)</li>
<li>[ol/interaction/Draw](module-ol_interaction_Draw-Draw.html)</li>
<li>[ol/interaction/Modify](module-ol_interaction_Modify-Modify.html)</li></ul>
[All interactions](module-ol_interaction_Interaction-Interaction.html)</td>
<td>[Tile sources](module-ol_source_Tile-TileSource.html) for [ol/layer/Tile](module-ol_layer_Tile-TileLayer.html)
<br>[Image sources](module-ol_source_Image-ImageSource.html) for [ol/layer/Image](module-ol_layer_Image-ImageLayer.html)
<br>[Vector sources](module-ol_source_Vector-VectorSource.html) for [ol/layer/Vector](module-ol_layer_Vector-VectorLayer.html)
<br>[Vector tile sources](module-ol_source_VectorTile-VectorTile.html) for [ol/layer/VectorTile](module-ol_layer_VectorTile-VectorTileLayer.html)
<br>[Formats](module-ol_format_Feature-FeatureFormat.html) for reading/writing vector data
<br>[ol/format/WMSCapabilities](module-ol_format_WMSCapabilities-WMSCapabilities.html)</td></tr>
<tr><th>Projections</th><th>Observable objects</th><th>Other components</th></tr>
<tr><td><p>All coordinates and extents need to be provided in view projection (default: EPSG:3857). To transform, use [ol/proj#transform()](module-ol_proj.html#.transform) and [ol/proj#transformExtent()](module-ol_proj.html#.transformExtent).</p>
[ol/proj](module-ol_proj.html)</td>
<td><p>Changes to all [ol/Object](module-ol_Object-BaseObject.html)s can be observed by calling the [object.on('propertychange')](module-ol_Object-BaseObject.html#on) method.  Listeners receive an [ol/Object.ObjectEvent](module-ol_Object-ObjectEvent.html) with information on the changed property and old value.</p>
<td>
[ol/Geolocation](module-ol_Geolocation.html)<br>
[ol/Overlay](module-ol_Overlay-Overlay.html)<br></td>
</tr></table>

&nbsp;

#### API change policy

The OpenLayers API consists of
* names and signatures of constructors
* names and signatures of instance methods and properties
* names and signatures of functions
* names of constants

Within a major release series, the API will not be changed.  Any changes to the API will be accompanied by a new major release.

*Note*: The API change policy does not cover CSS class names that are used to style the OpenLayers UI. It also does not cover any typedefs and enums.
