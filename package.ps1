# Create the final package directory
$PACKAGE_DIR = "mechbuildpro-final-v1"
Remove-Item -Path $PACKAGE_DIR -Recurse -Force -ErrorAction SilentlyContinue
New-Item -Path $PACKAGE_DIR -ItemType Directory

# Copy backend files
New-Item -Path "$PACKAGE_DIR\backend" -ItemType Directory -Force
Copy-Item -Path "src\*" -Destination "$PACKAGE_DIR\backend" -Recurse
Copy-Item -Path "package.json","package-lock.json" -Destination "$PACKAGE_DIR\backend"

# Copy frontend files
New-Item -Path "$PACKAGE_DIR\frontend" -ItemType Directory -Force
Copy-Item -Path "public\*" -Destination "$PACKAGE_DIR\frontend" -Recurse
if (Test-Path "src\client") {
    New-Item -Path "$PACKAGE_DIR\frontend\src" -ItemType Directory -Force
    Copy-Item -Path "src\client\*" -Destination "$PACKAGE_DIR\frontend\src" -Recurse
}

# Copy documentation
New-Item -Path "$PACKAGE_DIR\docs" -ItemType Directory -Force
if (Test-Path "docs") {
    Copy-Item -Path "docs\*" -Destination "$PACKAGE_DIR\docs" -Recurse
}

# Copy uploads directory
New-Item -Path "$PACKAGE_DIR\uploads" -ItemType Directory -Force
if (Test-Path "uploads") {
    Copy-Item -Path "uploads\*" -Destination "$PACKAGE_DIR\uploads" -Recurse
}

# Copy root files
Copy-Item -Path "README.md",".env.example" -Destination "$PACKAGE_DIR" -ErrorAction SilentlyContinue

# Create version file
"v1.0.0" | Out-File -FilePath "$PACKAGE_DIR\VERSION"

# Remove unnecessary files
Get-ChildItem -Path $PACKAGE_DIR -Include "*.log",".DS_Store" -Recurse | Remove-Item -Force
Get-ChildItem -Path $PACKAGE_DIR -Include "node_modules" -Directory -Recurse | Remove-Item -Recurse -Force

# Create zip archive
Compress-Archive -Path $PACKAGE_DIR -DestinationPath "mechbuildpro-final-v1.zip" -Force

Write-Host "Package created successfully: mechbuildpro-final-v1.zip" 