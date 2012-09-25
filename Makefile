JSDOC = jsdoc
PHANTOMJS = phantomjs
PLOVR_JAR = bin/plovr-b254c26318c5.jar
SRC = $(shell find exports externs src/ol -name \*.js)
TARGETS = $(shell find demos -name advanced-optimizations.js -o -name simple-optimizations.js)
comma := ,
empty :=
space := $(empty) $(empty)

.PHONY: all
all: build demos

.PHONY: precommit
precommit: lint test build

.PHONY: build
build: build/ol.js

build/ol.js: $(PLOVR_JAR) $(SRC) base.json \
	build/ol.json build/ol-all.js
	java -jar $(PLOVR_JAR) build build/ol.json >$@
	@echo $@ "uncompressed:" $$(wc -c <$@) bytes
	@echo $@ "  compressed:" $$(gzip -9 -c <$@ | wc -c) bytes

build/ol-all.js: $(SRC)
	( echo "goog.require('goog.dom');" ; find src/ol -name \*.js | xargs grep -rh ^goog.provide | sort | uniq | sed -e 's/provide/require/g' ) > $@

.PHONY: demos
demos: demos/full-screen demos/proj4js demos/side-by-side demos/two-layers

.PHONY: demos/proj4js
demos/proj4js: \
	demos/proj4js/build.html \
	demos/proj4js/index.html

demos/proj4js/build.html: demos/proj4js/template.html.in
	sed -e 's|@SRC@|../../build/ol.js|' $< > $@

demos/proj4js/index.html: demos/proj4js/template.html.in
	sed -e 's|@SRC@|http://localhost:9810/compile?id=ol|' $< > $@

.PHONY: demos/full-screen
demos/full-screen: \
	demos/full-screen/advanced-optimizations.html \
	demos/full-screen/advanced-optimizations.js \
	demos/full-screen/index.html \
	demos/full-screen/simple-optimizations.html \
	demos/full-screen/simple-optimizations.js

demos/full-screen/advanced-optimizations.html: demos/full-screen/template.html.in
	sed -e 's|@SRC@|advanced-optimizations.js|' $< > $@

demos/full-screen/advanced-optimizations.js: $(PLOVR_JAR) $(SRC) base.json \
	demos/full-screen/full-screen.json demos/full-screen/full-screen.js
	java -jar $(PLOVR_JAR) build demos/full-screen/full-screen.json >$@
	@echo $@ "uncompressed:" $$(wc -c <$@) bytes
	@echo $@ "  compressed:" $$(gzip -9 -c <$@ | wc -c) bytes

demos/full-screen/index.html: demos/full-screen/template.html.in
	sed -e 's|@SRC@|../loader.js?id=demo-full-screen|' $< > $@

demos/full-screen/simple-optimizations.html: demos/full-screen/template.html.in
	sed -e 's|@SRC@|simple-optimizations.js|' $< > $@

# FIXME invoke plovr directly, rather than assuming that the server is running
demos/full-screen/simple-optimizations.js: $(PLOVR_JAR) $(SRC) base.json \
	demos/full-screen/full-screen.json demos/full-screen/full-screen.js
	curl 'http://localhost:9810/compile?id=demo-full-screen&mode=SIMPLE' > $@
	@echo $@ "uncompressed:" $$(wc -c <$@) bytes
	@echo $@ "  compressed:" $$(gzip -9 -c <$@ | wc -c) bytes


.PHONY: demos/side-by-side
demos/side-by-side: \
	demos/side-by-side/advanced-optimizations.html \
	demos/side-by-side/advanced-optimizations.js \
	demos/side-by-side/index.html \
	demos/side-by-side/simple-optimizations.html \
	demos/side-by-side/simple-optimizations.js

demos/side-by-side/advanced-optimizations.html: demos/side-by-side/template.html.in
	sed -e 's|@SRC@|advanced-optimizations.js|' $< > $@

demos/side-by-side/advanced-optimizations.js: $(PLOVR_JAR) $(SRC) base.json \
	demos/side-by-side/side-by-side.json demos/side-by-side/side-by-side.js
	java -jar $(PLOVR_JAR) build demos/side-by-side/side-by-side.json >$@
	@echo $@ "uncompressed:" $$(wc -c <$@) bytes
	@echo $@ "  compressed:" $$(gzip -9 -c <$@ | wc -c) bytes

demos/side-by-side/index.html: demos/side-by-side/template.html.in
	sed -e 's|@SRC@|../loader.js?id=demo-side-by-side|' $< > $@

demos/side-by-side/simple-optimizations.html: demos/side-by-side/template.html.in
	sed -e 's|@SRC@|simple-optimizations.js|' $< > $@

# FIXME invoke plovr directly, rather than assuming that the server is running
demos/side-by-side/simple-optimizations.js: $(PLOVR_JAR) $(SRC) base.json \
	demos/side-by-side/side-by-side.json demos/side-by-side/side-by-side.js
	curl 'http://localhost:9810/compile?id=demo-side-by-side&mode=SIMPLE' > $@
	@echo $@ "uncompressed:" $$(wc -c <$@) bytes
	@echo $@ "  compressed:" $$(gzip -9 -c <$@ | wc -c) bytes

.PHONY: demos/two-layers
demos/two-layers: \
	demos/two-layers/advanced-optimizations.html \
	demos/two-layers/advanced-optimizations.js \
	demos/two-layers/index.html \
	demos/two-layers/simple-optimizations.html \
	demos/two-layers/simple-optimizations.js

demos/two-layers/advanced-optimizations.html: demos/two-layers/template.html.in
	sed -e 's|@SRC@|advanced-optimizations.js|' $< > $@

demos/two-layers/advanced-optimizations.js: $(PLOVR_JAR) $(SRC) base.json \
	demos/two-layers/two-layers.json demos/two-layers/two-layers.js
	java -jar $(PLOVR_JAR) build demos/two-layers/two-layers.json >$@
	@echo $@ "uncompressed:" $$(wc -c <$@) bytes
	@echo $@ "  compressed:" $$(gzip -9 -c <$@ | wc -c) bytes

demos/two-layers/index.html: demos/two-layers/template.html.in
	sed -e 's|@SRC@|../loader.js?id=demo-two-layers|' $< > $@

demos/two-layers/simple-optimizations.html: demos/two-layers/template.html.in
	sed -e 's|@SRC@|simple-optimizations.js|' $< > $@

# FIXME invoke plovr directly, rather than assuming that the server is running
demos/two-layers/simple-optimizations.js: $(PLOVR_JAR) $(SRC) base.json \
	demos/two-layers/two-layers.json demos/two-layers/two-layers.js
	curl 'http://localhost:9810/compile?id=demo-two-layers&mode=SIMPLE' > $@
	@echo $@ "uncompressed:" $$(wc -c <$@) bytes
	@echo $@ "  compressed:" $$(gzip -9 -c <$@ | wc -c) bytes

.PHONY: serve
serve: $(PLOVR_JAR) build/ol-all.js
	java -jar $(PLOVR_JAR) serve build/ol.json demos/*/*.json

.PHONY: lint
lint:
	gjslint --strict --limited_doc_files=$(subst $(space),$(comma),$(shell find externs -name \*.js)) $(SRC) $(filter-out $(TARGETS),$(shell find demos -name \*.js))

.PHONY: plovr
plovr: $(PLOVR_JAR)

# FIXME find a more permanent host for plovr jar
$(PLOVR_JAR):
	curl http://dev.camptocamp.com/files/tpayne/plovr/$(notdir $@) > $@

.PHONY: doc
doc:
	$(JSDOC) -t doc/template -r src -d build/apidoc

.PHONY: test
test:
	$(PHANTOMJS) test/phantom-jasmine/run_jasmine_test.coffee test/ol.html

clean:
	rm -f build/ol.js
	rm -f build/ol-all.js
	rm -f demos/*/*.html
	rm -f demos/*/advanced-optimizations.*
	rm -f demos/*/simple-optimizations.*
	rm -rf build/apidoc

reallyclean: clean
	rm -f $(PLOVR_JAR)
