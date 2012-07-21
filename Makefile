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
	src/ol/layer/WMS.js \
	src/ol/Popup.js \
	src/ol/renderer/Composite.js \
	src/ol/renderer/LayerRenderer.js \
	src/ol/renderer/MapRenderer.js \
	src/ol/renderer/TileLayerRenderer.js
comma := ,
empty :=
space := $(empty) $(empty)

.PHONY: all
all: build webgl-debug.js

.PHONY: build
build: ol.js ol-skeleton.js ol-skeleton-debug.js ol-skeleton-dom.js ol-skeleton-webgl.js

.PHONY: ol.js
ol.js: $(PLOVR_JAR)
	java -jar $(PLOVR_JAR) build $(basename $@).json >$@
	@echo $@ "uncompressed:" $(shell wc -c <$@) bytes
	@echo $@ "  compressed:" $(shell gzip -9 -c <$@ | wc -c) bytes

.PHONY: ol-skeleton.js
ol-skeleton.js: $(PLOVR_JAR)
	java -jar $(PLOVR_JAR) build $(basename $@).json >$@
	@echo $@ "uncompressed:" $(shell wc -c <$@) bytes
	@echo $@ "  compressed:" $(shell gzip -9 -c <$@ | wc -c) bytes

.PHONY: ol-skeleton-debug.js
ol-skeleton-debug.js: $(PLOVR_JAR)
	java -jar $(PLOVR_JAR) build $(basename $@).json >$@
	@echo $@ "uncompressed:" $(shell wc -c <$@) bytes
	@echo $@ "  compressed:" $(shell gzip -9 -c <$@ | wc -c) bytes

.PHONY: ol-skeleton-dom.js
ol-skeleton-dom.js: $(PLOVR_JAR)
	java -jar $(PLOVR_JAR) build $(basename $@).json >$@
	@echo $@ "uncompressed:" $(shell wc -c <$@) bytes
	@echo $@ "  compressed:" $(shell gzip -9 -c <$@ | wc -c) bytes

.PHONY: ol-skeleton-webgl.js
ol-skeleton-webgl.js: $(PLOVR_JAR)
	java -jar $(PLOVR_JAR) build $(basename $@).json >$@
	@echo $@ "uncompressed:" $(shell wc -c <$@) bytes
	@echo $@ "  compressed:" $(shell gzip -9 -c <$@ | wc -c) bytes

.PHONY: serve
serve: $(PLOVR_JAR)
	java -jar $(PLOVR_JAR) serve *.json

.PHONY: lint
lint:
	gjslint --strict --limited_doc_files=$(subst $(space),$(comma),$(shell find externs -name \*.js)) $(filter-out $(GSLINT_EXCLUDES),$(shell find externs src -name \*.js)) skeleton.js

webgl-debug.js:
	curl https://cvs.khronos.org/svn/repos/registry/trunk/public/webgl/sdk/debug/webgl-debug.js > $@

$(PLOVR_JAR):
	curl http://plovr.googlecode.com/files/$(notdir $@) > $@

clean:
	rm -f ol-skeleton.js
	rm -f ol-skeleton-debug.js
	rm -f ol-skeleton-dom.js
	rm -f ol-skeleton-webgl.js

reallyclean: clean
	rm -f $(PLOVR_JAR)
	rm -f webgl-debug.js
