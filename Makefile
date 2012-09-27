JSDOC = jsdoc
PHANTOMJS = phantomjs
PLOVR_JAR = bin/plovr-b254c26318c5.jar
SRC = $(shell find exports externs src/ol -name \*.js)
TARGETS = $(shell find demos -name advanced-optimizations.js)
comma := ,
empty :=
space := $(empty) $(empty)

.PHONY: all
all: build-all build demos

.PHONY: precommit
precommit: lint build-all test build

.PHONY: build
build: build/ol.js

build/ol.js: $(PLOVR_JAR) $(SRC) base.json build/ol.json
	java -jar $(PLOVR_JAR) build build/ol.json >$@
	@echo $@ "uncompressed:" $$(wc -c <$@) bytes
	@echo $@ "  compressed:" $$(gzip -9 -c <$@ | wc -c) bytes

.PHONY: build-all
build-all: build/ol-all.js

build/ol-all.js: $(PLOVR_JAR) $(SRC) base.json build/ol-all.json build/require-all.js
	java -jar $(PLOVR_JAR) build build/ol-all.json >$@ || ( rm -f $@ ; false )

build/require-all.js: $(SRC)
	( echo "goog.require('goog.dom');" ; find src/ol -name \*.js | xargs grep -rh ^goog.provide | sort | uniq | sed -e 's/provide/require/g' ) >$@

.PHONY: demos
demos: demos/full-screen demos/proj4js demos/side-by-side demos/two-layers

.PHONY: demos/proj4js
demos/proj4js: \
	demos/proj4js/build.html \
	demos/proj4js/index.html

demos/proj4js/build.html: demos/proj4js/template.html.in
	sed -e 's|@SRC@|../../build/ol.js|' $< >$@

demos/proj4js/index.html: demos/proj4js/template.html.in
	sed -e 's|@SRC@|http://localhost:9810/compile?id=ol|' $< >$@

.PHONY: demos/full-screen
demos/full-screen: \
	demos/full-screen/advanced-optimizations.html \
	demos/full-screen/advanced-optimizations.js \
	demos/full-screen/index.html

demos/full-screen/advanced-optimizations.html: demos/full-screen/template.html.in
	sed -e 's|@SRC@|advanced-optimizations.js|' $< >$@

demos/full-screen/advanced-optimizations.js: $(PLOVR_JAR) $(SRC) base.json \
	demos/full-screen/full-screen.json demos/full-screen/full-screen.js
	java -jar $(PLOVR_JAR) build demos/full-screen/full-screen.json >$@
	@echo $@ "uncompressed:" $$(wc -c <$@) bytes
	@echo $@ "  compressed:" $$(gzip -9 -c <$@ | wc -c) bytes

demos/full-screen/index.html: demos/full-screen/template.html.in
	sed -e 's|@SRC@|../loader.js?id=demo-full-screen|' $< >$@


.PHONY: demos/side-by-side
demos/side-by-side: \
	demos/side-by-side/advanced-optimizations.html \
	demos/side-by-side/advanced-optimizations.js \
	demos/side-by-side/index.html

demos/side-by-side/advanced-optimizations.html: demos/side-by-side/template.html.in
	sed -e 's|@SRC@|advanced-optimizations.js|' $< >$@

demos/side-by-side/advanced-optimizations.js: $(PLOVR_JAR) $(SRC) base.json \
	demos/side-by-side/side-by-side.json demos/side-by-side/side-by-side.js
	java -jar $(PLOVR_JAR) build demos/side-by-side/side-by-side.json >$@
	@echo $@ "uncompressed:" $$(wc -c <$@) bytes
	@echo $@ "  compressed:" $$(gzip -9 -c <$@ | wc -c) bytes

demos/side-by-side/index.html: demos/side-by-side/template.html.in
	sed -e 's|@SRC@|../loader.js?id=demo-side-by-side|' $< >$@

.PHONY: demos/two-layers
demos/two-layers: \
	demos/two-layers/advanced-optimizations.html \
	demos/two-layers/advanced-optimizations.js \
	demos/two-layers/index.html

demos/two-layers/advanced-optimizations.html: demos/two-layers/template.html.in
	sed -e 's|@SRC@|advanced-optimizations.js|' $< >$@

demos/two-layers/advanced-optimizations.js: $(PLOVR_JAR) $(SRC) base.json \
	demos/two-layers/two-layers.json demos/two-layers/two-layers.js
	java -jar $(PLOVR_JAR) build demos/two-layers/two-layers.json >$@
	@echo $@ "uncompressed:" $$(wc -c <$@) bytes
	@echo $@ "  compressed:" $$(gzip -9 -c <$@ | wc -c) bytes

demos/two-layers/index.html: demos/two-layers/template.html.in
	sed -e 's|@SRC@|../loader.js?id=demo-two-layers|' $< >$@

.PHONY: serve
serve: $(PLOVR_JAR) build/require-all.js
	java -jar $(PLOVR_JAR) serve build/*.json demos/*/*.json

.PHONY: lint
lint: build/lint-timestamp

build/lint-timestamp: $(SRC)
	gjslint --strict --limited_doc_files=$(subst $(space),$(comma),$(shell find externs -name \*.js)) $(SRC) $(filter-out $(TARGETS),$(shell find demos -name \*.js)) && touch $@

.PHONY: plovr
plovr: $(PLOVR_JAR)

# FIXME find a more permanent host for plovr jar
$(PLOVR_JAR):
	curl http://dev.camptocamp.com/files/tpayne/plovr/$(notdir $@) >$@

.PHONY: doc
doc:
	$(JSDOC) -t doc/template -r src -d build/apidoc

.PHONY: test
test:
	$(PHANTOMJS) test/phantom-jasmine/run_jasmine_test.coffee test/ol.html

clean:
	rm -f build/lint-timestamp
	rm -f build/ol.js
	rm -f build/ol-all.js
	rm -f build/require-all.js
	rm -f demos/*/advanced-optimizations.*
	rm -f demos/*/index.html
	rm -rf build/apidoc

reallyclean: clean
	rm -f $(PLOVR_JAR)
