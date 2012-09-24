PLOVR_JAR=bin/plovr-4b3caf2b7d84.jar
SRC_OL3 = $(shell find externs src/ol3 -name \*.js)
TARGETS = $(shell find demos -name advanced-optimizations.js -o -name simple-optimizations.js)
comma := ,
empty :=
space := $(empty) $(empty)

.PHONY: all
all: build demos

.PHONY: build
build: build/ol3-compiled.js build/webgl-debug.js

build/ol3-compiled.js: $(PLOVR_JAR) $(SRC_OL3) base.json \
	build/ol3.json build/ol3.js
	java -jar $(PLOVR_JAR) build build/ol3.json >$@
	@echo $@ "uncompressed:" $$(wc -c <$@) bytes
	@echo $@ "  compressed:" $$(gzip -9 -c <$@ | wc -c) bytes

build/ol3.js: $(SRC_OL3)
	( echo "goog.require('goog.dom');" ; find src/ol3 -name \*.js | xargs grep -rh ^goog.provide | sort | uniq | sed -e 's/provide/require/g' ) > $@

.PHONY: demos
demos: demos/proj4js demos/side-by-side demos/two-layers

.PHONY: demos/proj4js
demos/proj4js: \
	demos/proj4js/build.html \
	demos/proj4js/debug.html

demos/proj4js/build.html: demos/proj4js/index.html.in
	sed -e 's|@SRC@|../../build/ol3.js|' $< > $@

demos/proj4js/debug.html: demos/proj4js/index.html.in
	sed -e 's|@SRC@|http://localhost:9810/compile?id=ol3|' $< > $@

.PHONY: demos/side-by-side
demos/side-by-side: \
	demos/side-by-side/advanced-optimizations.html \
	demos/side-by-side/advanced-optimizations.js \
	demos/side-by-side/debug.html \
	demos/side-by-side/simple-optimizations.html \
	demos/side-by-side/simple-optimizations.js

demos/side-by-side/advanced-optimizations.html: demos/side-by-side/index.html.in
	sed -e 's|@SRC@|advanced-optimizations.js|' $< > $@

demos/side-by-side/advanced-optimizations.js: $(PLOVR_JAR) $(SRC_OL3) base.json \
	demos/side-by-side/side-by-side.json demos/side-by-side/side-by-side.js
	java -jar $(PLOVR_JAR) build demos/side-by-side/side-by-side.json >$@
	@echo $@ "uncompressed:" $$(wc -c <$@) bytes
	@echo $@ "  compressed:" $$(gzip -9 -c <$@ | wc -c) bytes

demos/side-by-side/debug.html: demos/side-by-side/index.html.in
	sed -e 's|@SRC@|http://localhost:9810/compile?id=demo-side-by-side|' $< > $@

demos/side-by-side/simple-optimizations.html: demos/side-by-side/index.html.in
	sed -e 's|@SRC@|simple-optimizations.js|' $< > $@

# FIXME invoke plovr directly, rather than assuming that the server is running
demos/side-by-side/simple-optimizations.js: $(PLOVR_JAR) $(SRC_OL3) base.json \
	demos/side-by-side/side-by-side.json demos/side-by-side/side-by-side.js
	curl 'http://localhost:9810/compile?id=demo-side-by-side&mode=SIMPLE' > $@
	@echo $@ "uncompressed:" $$(wc -c <$@) bytes
	@echo $@ "  compressed:" $$(gzip -9 -c <$@ | wc -c) bytes

.PHONY: demos/two-layers
demos/two-layers: \
	demos/two-layers/advanced-optimizations.html \
	demos/two-layers/advanced-optimizations.js \
	demos/two-layers/debug.html \
	demos/two-layers/simple-optimizations.html \
	demos/two-layers/simple-optimizations.js

demos/two-layers/advanced-optimizations.html: demos/two-layers/index.html.in
	sed -e 's|@SRC@|advanced-optimizations.js|' $< > $@

demos/two-layers/advanced-optimizations.js: $(PLOVR_JAR) $(SRC_OL3) base.json \
	demos/two-layers/two-layers.json demos/two-layers/two-layers.js
	java -jar $(PLOVR_JAR) build demos/two-layers/two-layers.json >$@
	@echo $@ "uncompressed:" $$(wc -c <$@) bytes
	@echo $@ "  compressed:" $$(gzip -9 -c <$@ | wc -c) bytes

demos/two-layers/debug.html: demos/two-layers/index.html.in
	sed -e 's|@SRC@|http://localhost:9810/compile?id=demo-two-layers|' $< > $@

demos/two-layers/simple-optimizations.html: demos/two-layers/index.html.in
	sed -e 's|@SRC@|simple-optimizations.js|' $< > $@

# FIXME invoke plovr directly, rather than assuming that the server is running
demos/two-layers/simple-optimizations.js: $(PLOVR_JAR) $(SRC_OL3) base.json \
	demos/two-layers/two-layers.json demos/two-layers/two-layers.js
	curl 'http://localhost:9810/compile?id=demo-two-layers&mode=SIMPLE' > $@
	@echo $@ "uncompressed:" $$(wc -c <$@) bytes
	@echo $@ "  compressed:" $$(gzip -9 -c <$@ | wc -c) bytes

.PHONY: serve
serve: $(PLOVR_JAR)
	java -jar $(PLOVR_JAR) serve build/ol3.json demos/*/*.json

.PHONY: lint
lint:
	gjslint --strict --limited_doc_files=$(subst $(space),$(comma),$(shell find externs -name \*.js)) $(SRC_OL3) $(filter-out $(TARGETS),$(shell find demos -name \*.js))

build/webgl-debug.js:
	curl https://cvs.khronos.org/svn/repos/registry/trunk/public/webgl/sdk/debug/webgl-debug.js > $@

$(PLOVR_JAR):
	curl http://plovr.googlecode.com/files/$(notdir $@) > $@

clean:
	rm -f build/all.js
	rm -f build/ol3.js
	rm -f build/ol3-compiled.js
	rm -f demos/*/*.html
	rm -f demos/*/advanced-optimizations.*
	rm -f demos/*/simple-optimizations.*

reallyclean: clean
	rm -f $(PLOVR_JAR)
	rm -f build/webgl-debug.js
