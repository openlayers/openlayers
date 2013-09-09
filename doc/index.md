Finding your way around
-----------------------
See the class list to the right and especially take a look at {@link ol.Map} and {@link ol.layer.Layer} because those are the central objects.

In general every use of OpenLayers starts by initializing a map, then adding the required layers. Controls and interactions can be added to change the behavior of the map.

Projections
-----------
A {@link ol.Projection} defines which point on earth is represented by a pair of coordinates.
Coordinates within OpenLayers can be used in various projections where some common projections are always supported,
others can be used via [Proj4js](http://trac.osgeo.org/proj4js/).

Maps and Layers
---------------
A map in OpenLayers is essentially a staple of layers that is viewed from the top. Layers are responsible for retieving data and displaying it.

Contributing
------------
See [CONTRIBUTING.md](https://github.com/openlayers/ol3/blob/master/CONTRIBUTING.md) for instructions
on building and tesing OpenLayers. The file does also describe how to commit your changes to OpenLayers.
