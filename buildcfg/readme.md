# Build configs

This directory includes configuration files (json) for the tasks/build.js
build script.

Notes:

`use_types_for_optimization` is set to `false` for the SIMPLE and WHITESPACE
builds.  If it was set to `true` we would get function names like
`ol_control_Control_prototype$setMap` in the compiled code when using the
SIMPLE compilation. `use_types_for_optimization` is only appropriate for
ADVANCED compilation. To be sure we also don't set it for WHITESPACE.
