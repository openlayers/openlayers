JSDOC = jsdoc
PHANTOMJS = phantomjs
PLOVR_JAR = bin/plovr-b254c26318c5.jar
SPEC = $(shell find test/spec -name \*.js)
SRC = $(shell find exports externs src/ol -name \*.js)
TARGETS = $(shell find demos -name advanced-optimizations.js)
EXAMPLES = $(shell find demos -maxdepth 1 -name \*.html)
comma := ,
empty :=
space := $(empty) $(empty)

.PHONY: all
all: build-all build demos

.PHONY: precommit
precommit: lint build-all doc test build

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
demos: $(subst .html,.json,$(EXAMPLES))

demos/%.json: base.json
	@echo "{\"id\": \"$(basename $(notdir $@))\", \"inherits\": \"../base.json\", \"inputs\": \"$(subst .json,.js,$@)\"}" > $@

demos/%.combined.js: $(PLOVR_JAR) base.json demos/%.js
	java -jar $(PLOVR_JAR) build $(subst .combined.js,.json,$@) >$@
	@echo $@ "uncompressed:" $$(wc -c <$@) bytes
	@echo $@ "  compressed:" $$(gzip -9 -c <$@ | wc -c) bytes

.PHONY: serve
serve: $(PLOVR_JAR) build/require-all.js
	java -jar $(PLOVR_JAR) serve build/*.json demos/*.json

.PHONY: lint
lint: build/lint-src-timestamp build/lint-spec-timestamp

build/lint-src-timestamp: $(SRC)
	gjslint --strict --limited_doc_files=$(subst $(space),$(comma),$(shell find externs -name \*.js)) $(SRC) $(filter-out $(TARGETS),$(shell find demos -name \*.js)) && touch $@

build/lint-spec-timestamp: $(SPEC)
	gjslint $(SPEC) && touch $@

.PHONY: plovr
plovr: $(PLOVR_JAR)

# FIXME find a more permanent host for plovr jar
$(PLOVR_JAR):
	curl http://dev.camptocamp.com/files/tpayne/plovr/$(notdir $@) >$@

.PHONY: gh-pages
gh-pages:
	tools/git-update-ghpages openlayers/ol3 -i build/gh-pages/$(shell git rev-parse --abbrev-ref HEAD) -p $(shell git rev-parse --abbrev-ref HEAD)

.PHONY: doc
doc:
	$(JSDOC) -t doc/template -r src -d build/gh-pages/$(shell git rev-parse --abbrev-ref HEAD)/apidoc

.PHONY: test
test:
	$(PHANTOMJS) test/phantom-jasmine/run_jasmine_test.coffee test/ol.html

clean:
	rm -f build/lint-spec-timestamp
	rm -f build/lint-src-timestamp
	rm -f build/ol.js
	rm -f build/ol-all.js
	rm -f build/require-all.js
	rm -f demos/*.json
	rm -f demos/*.combined.js
	rm -rf build/apidoc

reallyclean: clean
	rm -f $(PLOVR_JAR)
