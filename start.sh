#!/bin/bash

# Check if .next directory exists and has a build
if [ ! -d ".next" ] || [ ! -f ".next/BUILD_ID" ]; then
  echo "Build not found. Building the application..."
  npm run build
  if [ $? -ne 0 ]; then
    echo "Build failed. Exiting."
    exit 1
  fi
  echo "Build completed successfully."
else
  echo "Build found. Starting the application..."
fi

# Start the Next.js production server
npm run start

