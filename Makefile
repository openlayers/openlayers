BRANCH = $(shell git rev-parse --abbrev-ref HEAD)
JSDOC = jsdoc
PHANTOMJS = phantomjs
PLOVR_JAR = bin/plovr-b254c26318c5.jar
SPEC = $(shell find test/spec -name \*.js)
SRC = $(shell find externs src/ol -name \*.js)
EXPORTS = $(shell find src -name \*.exports)
INTERNAL_SRC = \
	build/src/internal/src/requireall.js \
	build/src/internal/src/types.js
EXTERNAL_SRC = \
	build/src/external/externs/types.js \
	build/src/external/src/exports.js \
	build/src/external/src/types.js
EXAMPLES_SRC = $(filter-out $(shell find examples -name \*.combined.js),$(shell find examples -name \*.js))
EXAMPLES = $(filter-out examples/index.html,$(shell find examples -maxdepth 1 -name \*.html))
comma := ,
empty :=
space := $(empty) $(empty)

.PHONY: all
all: build-all build examples

.PHONY: precommit
precommit: lint build-all test doc build build-examples

.PHONY: build
build: build/ol.css build/ol.js

build/ol.css: build/ol.js
	touch $@

build/ol.js: $(PLOVR_JAR) $(SRC) $(EXTERNAL_SRC) base.json build/ol.json
	java -jar $(PLOVR_JAR) build build/ol.json >$@ || ( rm -f $@ ; false )
	@echo $@ "uncompressed:" $$(wc -c <$@) bytes
	@echo $@ "  compressed:" $$(gzip -9 -c <$@ | wc -c) bytes

.PHONY: build-all
build-all: build/ol-all.js

build/ol-all.js: $(PLOVR_JAR) $(SRC) $(INTERNAL_SRC) base.json build/ol-all.json
	java -jar $(PLOVR_JAR) build build/ol-all.json >$@ || ( rm -f $@ ; false )

build/src/external/externs/types.js: bin/generate-exports $(EXPORTS)
	mkdir -p $(dir $@)
	bin/generate-exports --externs $(EXPORTS) >$@ || ( rm -f $@ ; false )

build/src/external/src/exports.js: bin/generate-exports $(EXPORTS)
	mkdir -p $(dir $@)
	bin/generate-exports --exports $(EXPORTS) >$@ || ( rm -f $@ ; false )

build/src/external/src/types.js: bin/generate-exports $(EXPORTS)
	mkdir -p $(dir $@)
	bin/generate-exports --typedef $(EXPORTS) >$@ || ( rm -f $@ ; false )

build/src/internal/src/requireall.js: bin/generate-requireall $(SRC)
	mkdir -p $(dir $@)
	bin/generate-requireall --require=goog.dom src/ol >$@ || ( rm -f $@ ; false )

build/src/internal/src/types.js: bin/generate-exports $(EXPORTS)
	mkdir -p $(dir $@)
	bin/generate-exports --typedef $(EXPORTS) >$@ || ( rm -f $@ ; false )

.PHONY: build-examples
build-examples: examples $(subst .html,.combined.js,$(EXAMPLES))

.PHONY: examples
examples: examples/index.html $(subst .html,.json,$(EXAMPLES))

examples/index.html: bin/generate-examples-index $(EXAMPLES)
	bin/generate-examples-index -o $@ -s examples/index.js $(EXAMPLES)

examples/%.json: Makefile base.json
	echo "{\"id\": \"$(basename $(notdir $@))\", \"inherits\": \"../base.json\", \"inputs\": [\"$(subst .json,.js,$@)\", \"build/src/internal/src/types.js\"]}" > $@

examples/%.combined.js: $(PLOVR_JAR) $(SRC) $(INTERNAL_SRC) base.json examples/%.js
	java -jar $(PLOVR_JAR) build $(subst .combined.js,.json,$@) >$@ || ( rm -f $@ ; false )
	@echo $@ "uncompressed:" $$(wc -c <$@) bytes
	@echo $@ "  compressed:" $$(gzip -9 -c <$@ | wc -c) bytes

.PHONY: serve
serve: $(PLOVR_JAR) $(INTERNAL_SRC) examples
	java -jar $(PLOVR_JAR) serve build/*.json examples/*.json

.PHONY: serve-precommit
serve-precommit: $(PLOVR_JAR) $(INTERNAL_SRC)
	java -jar $(PLOVR_JAR) serve build/ol-all.json

.PHONY: lint
lint: build/lint-src-timestamp build/lint-spec-timestamp

build/lint-src-timestamp: $(SRC) $(INTERNAL_SRC) $(EXTERNAL_SRC) $(EXAMPLES_SRC)
	gjslint --strict --limited_doc_files=$(subst $(space),$(comma),$(shell find externs build/src/external/externs -name \*.js)) $(SRC) $(INTERNAL_SRC) $(EXTERNAL_SRC) $(EXAMPLES_SRC) && touch $@

build/lint-spec-timestamp: $(SPEC)
	gjslint $(SPEC) && touch $@

.PHONY: plovr
plovr: $(PLOVR_JAR)

# FIXME find a more permanent host for plovr jar
$(PLOVR_JAR):
	curl http://dev.camptocamp.com/files/tpayne/plovr/$(notdir $@) >$@

.PHONY: gh-pages
gh-pages:
	bin/git-update-ghpages openlayers/ol3 -i build/gh-pages/$(BRANCH) -p $(BRANCH)

.PHONY: doc
doc: build/jsdoc-$(BRANCH)-timestamp

build/jsdoc-$(BRANCH)-timestamp: $(SRC) $(shell find doc/template -type f)
	mkdir -p build/gh-pages/$(BRANCH)/apidoc
	$(JSDOC) -t doc/template -r src -d build/gh-pages/$(BRANCH)/apidoc
	touch $@

.PHONY: hostexamples
hostexamples: build examples
	mkdir -p build/gh-pages/$(BRANCH)/examples
	mkdir -p build/gh-pages/$(BRANCH)/build
	cp $(EXAMPLES) $(subst .html,.js,$(EXAMPLES)) examples/style.css build/gh-pages/$(BRANCH)/examples/
	cp build/loader_hosted_examples.js build/gh-pages/$(BRANCH)/examples/loader.js
	cp build/ol.js build/ol.css build/gh-pages/$(BRANCH)/build/
	cp examples/index.html examples/index.js build/gh-pages/$(BRANCH)/examples

.PHONY: test
test: $(INTERNAL_SRC)
	$(PHANTOMJS) test/phantom-jasmine/run_jasmine_test.coffee test/ol.html

clean:
	rm -f build/jsdoc-*-timestamp
	rm -f build/lint-spec-timestamp
	rm -f build/lint-src-timestamp
	rm -f build/ol.css
	rm -f build/ol.js
	rm -f build/ol-all.js
	rm -rf build/src
	rm -f examples/*.json
	rm -f examples/*.combined.js
	rm -rf build/apidoc

reallyclean: clean
	rm -f $(PLOVR_JAR)
