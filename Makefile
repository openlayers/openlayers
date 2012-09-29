JSDOC = jsdoc
PHANTOMJS = phantomjs
PLOVR_JAR = bin/plovr-b254c26318c5.jar
SPEC = $(shell find test/spec -name \*.js)
SRC = $(shell find exports externs src/ol -name \*.js)
INTERNAL_SRC = build/src/internal/src/requireall.js build/src/internal/src/types.js
EXAMPLES = $(shell find examples -maxdepth 1 -name \*.html)
comma := ,
empty :=
space := $(empty) $(empty)

.PHONY: all
all: build-all build examples

.PHONY: precommit
precommit: lint build-all doc test build

.PHONY: build
build: build/ol.css build/ol.js

build/ol.css: build/ol.js
	touch $@

build/ol.js: $(PLOVR_JAR) $(SRC) base.json build/ol.json build/src/external/externs/types.js
	java -jar $(PLOVR_JAR) build build/ol.json >$@
	@echo $@ "uncompressed:" $$(wc -c <$@) bytes
	@echo $@ "  compressed:" $$(gzip -9 -c <$@ | wc -c) bytes

.PHONY: build-all
build-all: build/ol-all.js

build/ol-all.js: $(PLOVR_JAR) $(SRC) $(INTERNAL_SRC) base.json build/ol-all.json
	java -jar $(PLOVR_JAR) build build/ol-all.json >$@ || ( rm -f $@ ; false )

build/src/external/externs/types.js: bin/generate-src src/ol/literals.txt
	mkdir -p $(dir $@)
	bin/generate-src --externs src/ol/literals.txt >$@

build/src/internal/src/requireall.js: bin/generate-requireall $(SRC)
	mkdir -p $(dir $@)
	bin/generate-requireall --require=goog.dom src/ol >$@

build/src/internal/src/types.js: bin/generate-src src/ol/literals.txt
	mkdir -p $(dir $@)
	bin/generate-src --typedef src/ol/literals.txt >$@

.PHONY: examples
examples: $(subst .html,.json,$(EXAMPLES))

examples/%.json: Makefile base.json
	echo "{\"id\": \"$(basename $(notdir $@))\", \"inherits\": \"../base.json\", \"inputs\": [\"$(subst .json,.js,$@)\", \"build/src/internal/src/types.js\"]}" > $@

examples/%.combined.js: $(PLOVR_JAR) base.json examples/%.js
	java -jar $(PLOVR_JAR) build $(subst .combined.js,.json,$@) >$@
	@echo $@ "uncompressed:" $$(wc -c <$@) bytes
	@echo $@ "  compressed:" $$(gzip -9 -c <$@ | wc -c) bytes

.PHONY: serve
serve: $(PLOVR_JAR) $(INTERNAL_SRC) examples
	java -jar $(PLOVR_JAR) serve build/*.json examples/*.json

.PHONY: serve-precommit
serve-precommit: $(PLOVR_JAR) $(INTERNAL_SRC)
	java -jar $(PLOVR_JAR) serve build/ol.json

.PHONY: lint
lint: build/lint-src-timestamp build/lint-spec-timestamp

build/lint-src-timestamp: $(SRC) $(INTERNAL_SRC)
	gjslint --strict --limited_doc_files=$(subst $(space),$(comma),$(shell find externs -name \*.js)) $(SRC) $(INTERNAL_SRC) $(filter-out $(shell find examples -name \*.combined.js),$(shell find examples -name \*.js)) && touch $@

build/lint-spec-timestamp: $(SPEC)
	gjslint $(SPEC) && touch $@

.PHONY: plovr
plovr: $(PLOVR_JAR)

# FIXME find a more permanent host for plovr jar
$(PLOVR_JAR):
	curl http://dev.camptocamp.com/files/tpayne/plovr/$(notdir $@) >$@

.PHONY: gh-pages
gh-pages:
	bin/git-update-ghpages openlayers/ol3 -i build/gh-pages/$(shell git rev-parse --abbrev-ref HEAD) -p $(shell git rev-parse --abbrev-ref HEAD)

.PHONY: doc
doc:
	$(JSDOC) -t doc/template -r src -d build/gh-pages/$(shell git rev-parse --abbrev-ref HEAD)/apidoc

.PHONY: test
test: $(INTERNAL_SRC)
	$(PHANTOMJS) test/phantom-jasmine/run_jasmine_test.coffee test/ol.html

clean:
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
