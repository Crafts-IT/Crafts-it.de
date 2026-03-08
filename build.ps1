# Set paths
$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$distPath = Join-Path -Path $baseDir -ChildPath "dist"
$layoutPath = Join-Path -Path $baseDir -ChildPath "layout.html"
$contentPath = $baseDir
$assetsPath = Join-Path -Path $baseDir -ChildPath "assets"
$stylesPath = Join-Path -Path $baseDir -ChildPath "styles"
$scriptsPath = Join-Path -Path $baseDir -ChildPath "scripts"
$distAssetsPath = Join-Path -Path $distPath -ChildPath "assets"
$distStylesPath = Join-Path -Path $distPath -ChildPath "styles"
$distScriptsPath = Join-Path -Path $distPath -ChildPath "scripts"

# Create dist subdirectories if they don't exist
if (-not (Test-Path -Path $distAssetsPath)) {
    New-Item -ItemType Directory -Path $distAssetsPath | Out-Null
}
if (-not (Test-Path -Path $distStylesPath)) {
    New-Item -ItemType Directory -Path $distStylesPath | Out-Null
}
if (-not (Test-Path -Path $distScriptsPath)) {
    New-Item -ItemType Directory -Path $distScriptsPath | Out-Null
}

# Read layout template
$layout = Get-Content -Path $layoutPath -Raw

# Process content pages
$pages = @("index.html", "imprint.html", "datenschutz.html")
foreach ($page in $pages) {
    $pageContent = Get-Content -Path (Join-Path -Path $contentPath -ChildPath $page) -Raw
    $finalHtml = $layout -replace "<!-- Page-specific content will be injected here -->", $pageContent
    Set-Content -Path (Join-Path -Path $distPath -ChildPath $page) -Value $finalHtml
}

# Copy assets, styles and scripts
Copy-Item -Path $assetsPath -Destination $distPath -Recurse -Force
Copy-Item -Path $stylesPath -Destination $distPath -Recurse -Force
Copy-Item -Path $scriptsPath -Destination $distPath -Recurse -Force

# Copy other files
Copy-Item -Path (Join-Path -Path $baseDir -ChildPath "cname") -Destination $distPath -Force

Write-Host "Website built successfully!"
