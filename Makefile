SRC_GLSL := $(shell find src -type f -name '*.glsl')
SRC_SHADER_JS := $(patsubst %shader.glsl,%shader.js,$(SRC_GLSL))
SRC_SHADERLOCATIONS_JS := $(patsubst %shader.glsl,%shader/Locations.js,$(SRC_GLSL))

.PHONY: shaders
shaders: $(SRC_SHADER_JS) $(SRC_SHADERLOCATIONS_JS)

%shader.js: %shader.glsl src/ol/webgl/shader.mustache tasks/glslunit.js
	@node tasks/glslunit.js --input $< | ./node_modules/.bin/mustache - src/ol/webgl/shader.mustache > $@

%shader/Locations.js: %shader.glsl src/ol/webgl/shaderlocations.mustache tasks/glslunit.js
	@mkdir -p $(@D)
	@node tasks/glslunit.js --input $< | ./node_modules/.bin/mustache - src/ol/webgl/shaderlocations.mustache > $@
