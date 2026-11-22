#!/bin/bash
set -e

emcc circuit_engine.cpp \
  -O3 \
  -I /usr/include/eigen3 \
  -s WASM=1 \
  -s EXPORTED_FUNCTIONS='["_run_circuit_simulation", "_run_digital_simulation", "_malloc", "_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -o ../frontend/public/circuit_engine.js

echo "Built circuit_engine.js and circuit_engine.wasm into frontend/public/"
