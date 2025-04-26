#!/bin/bash

# Create the final package directory
PACKAGE_DIR="mechbuildpro-final-v1"
rm -rf $PACKAGE_DIR
mkdir $PACKAGE_DIR

# Copy backend files
mkdir -p $PACKAGE_DIR/backend
cp -r src/* $PACKAGE_DIR/backend/
cp package.json package-lock.json $PACKAGE_DIR/backend/

# Copy frontend files
mkdir -p $PACKAGE_DIR/frontend
cp -r public/* $PACKAGE_DIR/frontend/
cp -r src/client/* $PACKAGE_DIR/frontend/src/

# Copy documentation
mkdir -p $PACKAGE_DIR/docs
cp docs/* $PACKAGE_DIR/docs/

# Copy uploads directory
mkdir -p $PACKAGE_DIR/uploads
cp -r uploads/* $PACKAGE_DIR/uploads/

# Copy root files
cp README.md .env.example $PACKAGE_DIR/

# Create version file
echo "v1.0.0" > $PACKAGE_DIR/VERSION

# Remove unnecessary files
find $PACKAGE_DIR -name "*.log" -type f -delete
find $PACKAGE_DIR -name ".DS_Store" -type f -delete
find $PACKAGE_DIR -name "node_modules" -type d -exec rm -rf {} +

# Create zip archive
zip -r mechbuildpro-final-v1.zip $PACKAGE_DIR

echo "Package created successfully: mechbuildpro-final-v1.zip" 