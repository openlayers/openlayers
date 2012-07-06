PLOVR_JAR=bin/plovr-4b3caf2b7d84.jar
GSLINT_EXCLUDES= \
	src/api/bounds.js \
	src/api/feature.js \
	src/api/geom/collection.js \
	src/api/geom/geometry.js \
	src/api/geom/linestring.js \
	src/api/geom/multilinestring.js \
	src/api/geom/multipoint.js \
	src/api/geom/point.js \
	src/api/layer/osm.js \
	src/api/layer/wms.js \
	src/api/layer/xyz.js \
	src/api/loc.js \
	src/api/map.js \
	src/api/popup.js \
	src/api/projection.js \
	src/ol/base.js \
	src/ol/control/Attribution.js \
	src/ol/control/Control.js \
	src/ol/control/Navigation.js \
	src/ol/control/Zoom.js \
	src/ol/coord/AccessorInterface.js \
	src/ol/event/Drag.js \
	src/ol/event/Events.js \
	src/ol/event/ISequence.js \
	src/ol/event/Scroll.js \
	src/ol/Feature.js \
	src/ol/geom/Collection.js \
	src/ol/geom/Geometry.js \
	src/ol/geom/IGeometry.js \
	src/ol/geom/LineString.js \
	src/ol/geom/MultiLineString.js \
	src/ol/geom/MultiPoint.js \
	src/ol/geom/Point.js \
	src/ol/handler/Drag.js \
	src/ol/layer/Layer.js \
	src/ol/layer/OSM.js \
	src/ol/layer/TileLayer.js \
	src/ol/layer/WMS.js \
	src/ol/layer/XYZ.js \
	src/ol/Loc.js \
	src/ol/Map.js \
	src/ol/Popup.js \
	src/ol/renderer/Composite.js \
	src/ol/renderer/LayerRenderer.js \
	src/ol/renderer/MapRenderer.js \
	src/ol/renderer/TileLayerRenderer.js \
	src/ol/renderer/WebGL.js \
	src/ol/Tile.js \
	src/ol/TileCache.js \
	src/ol.export.js \
	src/ol.js

.PHONY: build
build: $(PLOVR_JAR)
	java -jar $(PLOVR_JAR) build main.json >api.js

.PHONY: serve
serve: $(PLOVR_JAR)
	java -jar $(PLOVR_JAR) serve main.json

.PHONY: lint
lint: $(CLOSURE_LINTER)
	gjslint --strict $(filter-out $(GSLINT_EXCLUDES),$(shell find externs src -name \*.js))

$(PLOVR_JAR):
	curl http://plovr.googlecode.com/files/$(PLOVR_JAR) > $@
