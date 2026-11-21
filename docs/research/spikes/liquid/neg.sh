#!/bin/sh
# Theme Check on the good theme plus deliberately wrong files.
set -e
rm -rf neg-run && cp -r theme neg-run && cp -r negsrc/* neg-run/
node check.mjs neg-run
rm -rf neg-run
