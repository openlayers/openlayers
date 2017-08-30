OS := $(shell uname)
BRANCH := $(shell git rev-parse --abbrev-ref HEAD)

SRC_GLSL := $(shell find src -type f -name '*.glsl')
SRC_SHADER_JS := $(patsubst %shader.glsl,%shader.js,$(SRC_GLSL))
SRC_SHADERLOCATIONS_JS := $(patsubst %shader.glsl,%shader/locations.js,$(SRC_GLSL))
SRC_JS := $(filter-out $(SRC_SHADER_JS) $(SRC_SHADERLOCATIONS_JS),$(shell find src -name '*.js'))
SRC_JSDOC = $(shell find src -type f -name '*.jsdoc')

EXAMPLES := $(shell find examples -type f)
EXAMPLES_HTML := $(filter-out examples/index.html,$(shell find examples -maxdepth 1 -type f -name '*.html'))
EXAMPLES_JS := $(patsubst %.html,%.js,$(EXAMPLES_HTML))

BUILD_EXAMPLES := $(subst examples,build/examples,$(EXAMPLES)) build/examples/index.js

BUILD_HOSTED := build/hosted/$(BRANCH)
BUILD_HOSTED_EXAMPLES := $(addprefix $(BUILD_HOSTED)/,$(EXAMPLES))
BUILD_HOSTED_EXAMPLES_JS := $(addprefix $(BUILD_HOSTED)/,$(EXAMPLES_JS))

UNPHANTOMABLE_EXAMPLES = examples/shaded-relief.html examples/raster.html examples/region-growing.html examples/color-manipulation.html
CHECK_EXAMPLE_TIMESTAMPS = $(patsubst examples/%.html,build/timestamps/check-%-timestamp,$(filter-out $(UNPHANTOMABLE_EXAMPLES),$(EXAMPLES_HTML)))

TASKS_JS := $(shell find tasks -name '*.js')

ifeq (CYGWIN,$(findstring CYGWIN,$(OS)))
  CLOSURE_LIB = $(shell cygpath -u $(shell node -e 'process.stdout.write(require("closure-util").getLibraryPath())'))
else
  CLOSURE_LIB = $(shell node -e 'process.stdout.write(require("closure-util").getLibraryPath())')
endif

ifeq ($(OS),Darwin)
	STAT_COMPRESSED = stat -f '  compressed: %z bytes'
	STAT_UNCOMPRESSED = stat -f 'uncompressed: %z bytes'
else
	STAT_COMPRESSED = stat -c '  compressed: %s bytes'
	STAT_UNCOMPRESSED = stat -c 'uncompressed: %s bytes'
endif

.PHONY: default
default: help

.PHONY: help
help:
	@echo
	@echo "The most common targets are:"
	@echo
	@echo "- install                 Install node dependencies"
	@echo "- serve                   Start dev server for running examples and tests"
	@echo "- test                    Run unit tests in the console"
	@echo "- check                   Perform a number of checks on the code"
	@echo "- clean                   Remove generated files"
	@echo "- help                    Display this help message"
	@echo
	@echo "Other less frequently used targets are:"
	@echo
	@echo "- build                   Build ol.js, ol-debug.js, ol.js.map and ol.css"
	@echo "- ci                      Run the full continuous integration process"
	@echo "- apidoc                  Build the API documentation using JSDoc"
	@echo "- cleanall                Remove all the build artefacts"
	@echo "- check-deps              Check if the required dependencies are installed"
	@echo

.PHONY: apidoc
apidoc: build/timestamps/jsdoc-$(BRANCH)-timestamp

.PHONY: build
build: build/ol.css build/ol.js build/ol-debug.js build/ol.js.map

.PHONY: check
check: build/ol.js test

.PHONY: check-examples
check-examples: $(CHECK_EXAMPLE_TIMESTAMPS)

.PHONY: check-deps
check-deps: EXECUTABLES = git node python java
check-deps:
	@for exe in $(EXECUTABLES) ;\
	do \
	    which $${exe} > /dev/null && \
		echo "Program $${exe} OK" || \
		echo "Program $${exe} MISSING!" ;\
	done ;\

.PHONY: ci
ci: build test package compile-examples check-examples apidoc

.PHONY: compile-examples
compile-examples: build/compiled-examples/all.combined.js

.PHONY: clean
clean:
	rm -f build/timestamps/check-*-timestamp
	rm -f build/ol.css
	rm -f build/ol.js
	rm -f build/ol.js.map
	rm -f build/ol-debug.js
	rm -rf build/examples
	rm -rf build/compiled-examples
	rm -rf build/package
	rm -rf $(BUILD_HOSTED)

.PHONY: cleanall
cleanall:
	rm -rf build

.PHONY: css
css: build/ol.css

.PHONY: examples
examples: $(BUILD_EXAMPLES)

.PHONY: install
install: build/timestamps/node-modules-timestamp

.PHONY: npm-install
npm-install: build/timestamps/node-modules-timestamp

.PHONY: shaders
shaders: $(SRC_SHADER_JS $(SRC_SHADERLOCATIONS_JS)

.PHONY: serve
serve:
	node tasks/serve.js

.PHONY: test
test: build/timestamps/node-modules-timestamp
	npm test

.PHONY: host-examples
host-examples: $(BUILD_HOSTED_EXAMPLES) \
               $(BUILD_HOSTED)/build/ol.js \
               $(BUILD_HOSTED)/build/ol-debug.js \
               $(BUILD_HOSTED)/css/ol.css \
               $(BUILD_HOSTED)/examples/loader.js \
               $(BUILD_HOSTED)/examples/index.js \
               $(BUILD_HOSTED)/build/ol-deps.js

.PHONY: host-libraries
host-libraries: build/timestamps/node-modules-timestamp
	@rm -rf $(BUILD_HOSTED)/closure-library
	@mkdir -p $(BUILD_HOSTED)/closure-library
	@cp -r $(CLOSURE_LIB)/* $(BUILD_HOSTED)/closure-library/
	@rm -rf $(BUILD_HOSTED)/ol/ol
	@mkdir -p $(BUILD_HOSTED)/ol/ol
	@cp -r src/ol/* $(BUILD_HOSTED)/ol/ol/
	@rm -rf $(BUILD_HOSTED)/ol.ext
	@mkdir -p $(BUILD_HOSTED)/ol.ext
	@cp -r build/ol.ext/* $(BUILD_HOSTED)/ol.ext/

$(BUILD_EXAMPLES): $(EXAMPLES) package.json
	@mkdir -p $(@D)
	@node tasks/build-examples.js

build/timestamps/check-%-timestamp: $(BUILD_HOSTED)/examples/%.html \
                                    $(BUILD_HOSTED)/examples/%.js \
                                    $(filter $(BUILD_HOSTED)/examples/resources/%,$(BUILD_HOSTED_EXAMPLES)) \
                                    $(filter $(BUILD_HOSTED)/examples/data/%,$(BUILD_HOSTED_EXAMPLES)) \
                                    $(BUILD_HOSTED)/examples/loader.js \
                                    $(BUILD_HOSTED)/build/ol.js \
                                    $(BUILD_HOSTED)/css/ol.css
	@mkdir -p $(@D)
	node tasks/check-example.js $<
	@touch $@

build/compiled-examples/all.js: $(EXAMPLES_JS)
	@mkdir -p $(@D)
	@python bin/combine-examples.py $^ > $@

build/compiled-examples/all.combined.js: config/examples-all.json build/compiled-examples/all.js \
                                         $(SRC_JS) $(SRC_SHADER_JS) $(SRC_SHADERLOCATIONS_JS) \
                                         build/timestamps/node-modules-timestamp
	@mkdir -p $(@D)
	node tasks/build.js $< $@

build/compiled-examples/%.json: config/example.json build/examples/%.js \
                                build/timestamps/node-modules-timestamp
	@mkdir -p $(@D)
	@sed -e 's|{{id}}|$*|' $< > $@

build/compiled-examples/%.combined.js: build/compiled-examples/%.json \
                                       $(SRC_JS) $(SRC_SHADER_JS) $(SRC_SHADERLOCATIONS_JS)\
                                       build/timestamps/node-modules-timestamp
	@mkdir -p $(@D)
	node tasks/build.js $< $@

build/timestamps/jsdoc-$(BRANCH)-timestamp: config/jsdoc/api/index.md \
                                            config/jsdoc/api/conf.json $(SRC_JS) \
                                            $(SRC_SHADER_JS) $(SRC_SHADERLOCATIONS_JS) \
                                            $(shell find config/jsdoc/api/template -type f) \
                                            build/timestamps/node-modules-timestamp
	@mkdir -p $(@D)
	@rm -rf $(BUILD_HOSTED)/apidoc
	./node_modules/.bin/jsdoc config/jsdoc/api/index.md -c config/jsdoc/api/conf.json --package package.json -d $(BUILD_HOSTED)/apidoc
	@touch $@

$(BUILD_HOSTED_EXAMPLES_JS): $(BUILD_HOSTED)/examples/%.js: build/examples/%.js
	@mkdir -p $(@D)
	@python bin/split-example.py $< $(@D)

$(BUILD_HOSTED)/examples/loader.js: bin/loader_hosted_examples.js
	@mkdir -p $(@D)
	@cp $< $@

$(BUILD_HOSTED)/examples/%: build/examples/%
	@mkdir -p $(@D)
	@cp $< $@

$(BUILD_HOSTED)/build/ol.js: build/ol.js
	@mkdir -p $(@D)
	@cp $< $@

$(BUILD_HOSTED)/build/ol-debug.js: build/ol-debug.js
	@mkdir -p $(@D)
	@cp $< $@

$(BUILD_HOSTED)/css/ol.css: build/ol.css
	@mkdir -p $(@D)
	@cp $< $@

$(BUILD_HOSTED)/build/ol-deps.js: host-libraries
	@mkdir -p $(@D)
	@python $(CLOSURE_LIB)/closure/bin/build/depswriter.py \
           --root_with_prefix "src ../../../ol" \
           --root_with_prefix "build/ol.ext ../../../ol.ext" \
           --root $(BUILD_HOSTED)/closure-library/closure/goog \
           --root_with_prefix "$(BUILD_HOSTED)/closure-library/third_party ../../third_party" \
           --output_file $@

build/timestamps/node-modules-timestamp: package.json
	@mkdir -p $(@D)
	npm install
	@touch $@

build/ol.css: css/ol.css build/timestamps/node-modules-timestamp
	@mkdir -p $(@D)
	@echo "Running cleancss..."
	@./node_modules/.bin/cleancss $< > $@

build/ol.js: config/ol.json $(SRC_JS) $(SRC_SHADER_JS) $(SRC_SHADERLOCATIONS_JS) \
             build/timestamps/node-modules-timestamp
	@mkdir -p $(@D)
	node tasks/build.js $< $@
	@$(STAT_UNCOMPRESSED) $@
	@cp $@ /tmp/
	@gzip /tmp/ol.js
	@$(STAT_COMPRESSED) /tmp/ol.js.gz
	@rm /tmp/ol.js.gz

build/ol.js.map: config/ol.json $(SRC_JS) $(SRC_SHADER_JS) $(SRC_SHADERLOCATIONS_JS) \
                 build/timestamps/node-modules-timestamp
	@mkdir -p $(@D)
	node tasks/build.js $< $@

build/ol-debug.js: config/ol-debug.json $(SRC_JS) $(SRC_SHADER_JS) $(SRC_SHADERLOCATIONS_JS) \
                   build/timestamps/node-modules-timestamp
	@mkdir -p $(@D)
	node tasks/build.js $< $@
	@$(STAT_UNCOMPRESSED) $@
	@cp $@ /tmp/
	@gzip /tmp/ol-debug.js
	@$(STAT_COMPRESSED) /tmp/ol-debug.js.gz
	@rm /tmp/ol-debug.js.gz

%shader.js: %shader.glsl src/ol/webgl/shader.mustache tasks/glslunit.js build/timestamps/node-modules-timestamp
	@node tasks/glslunit.js --input $< | ./node_modules/.bin/mustache - src/ol/webgl/shader.mustache > $@

%shader/locations.js: %shader.glsl src/ol/webgl/shaderlocations.mustache tasks/glslunit.js build/timestamps/node-modules-timestamp
	@mkdir -p $(@D)
	@node tasks/glslunit.js --input $< | ./node_modules/.bin/mustache - src/ol/webgl/shaderlocations.mustache > $@

.PHONY: package
package:
	@rm -rf build/package
	@cp -r package build
	@cd ./src && cp -r ol/* ../build/package
	@rm build/package/typedefs.js
	@cp css/ol.css build/package
	./node_modules/.bin/jscodeshift --transform transforms/module.js build/package
	npm run lint-package
