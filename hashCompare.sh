#!/bin/bash

shasum -a 256 package.json | diff - .packageHash

if [ $? -eq 1 ]; then

  ./hashGenerate.sh
  make cleanBack

fi
