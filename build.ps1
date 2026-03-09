param(
    [ValidateSet('build', 'preview')]
    [string]$Mode = 'build',
    [int]$Port = 4173,
    [switch]$Rebuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -Path $baseDir

function Copy-DirectorySafe {
    param(
        [Parameter(Mandatory = $true)][string]$Source,
        [Parameter(Mandatory = $true)][string]$Destination
    )

    if (Test-Path -Path $Source) {
        New-Item -Path $Destination -ItemType Directory -Force | Out-Null
        Copy-Item -Path (Join-Path -Path $Source -ChildPath '*') -Destination $Destination -Recurse -Force
    }
}

function Invoke-NativeBuild {
    $distPath = Join-Path -Path $baseDir -ChildPath 'dist'
    $layoutPath = Join-Path -Path $baseDir -ChildPath 'layout.html'
    $pages = @(
        'index.html',
        'services.html',
        'about.html',
        'contact.html',
        'imprint.html',
        'datenschutz.html',
        'index-en.html',
        'services-en.html',
        'about-en.html',
        'contact-en.html',
        'imprint-en.html',
        'privacy.html'
    )
    $injectionMarker = '<!-- Page-specific content will be injected here -->'

    if (Test-Path -Path $distPath) {
        Remove-Item -Path $distPath -Recurse -Force
    }
    New-Item -Path $distPath -ItemType Directory -Force | Out-Null

    $layout = Get-Content -Path $layoutPath -Raw -Encoding UTF8
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    if (-not $layout.Contains($injectionMarker)) {
        throw "Missing template marker in layout.html"
    }

    foreach ($page in $pages) {
        $pagePath = Join-Path -Path $baseDir -ChildPath $page
        $pageContent = Get-Content -Path $pagePath -Raw -Encoding UTF8
        $finalHtml = $layout.Replace($injectionMarker, $pageContent)
        $targetPath = Join-Path -Path $distPath -ChildPath $page
        [System.IO.File]::WriteAllText($targetPath, $finalHtml, $utf8NoBom)
    }

    Copy-DirectorySafe -Source (Join-Path -Path $baseDir -ChildPath 'assets') -Destination (Join-Path -Path $distPath -ChildPath 'assets')
    Copy-DirectorySafe -Source (Join-Path -Path $baseDir -ChildPath 'styles') -Destination (Join-Path -Path $distPath -ChildPath 'styles')
    Copy-DirectorySafe -Source (Join-Path -Path $baseDir -ChildPath 'scripts') -Destination (Join-Path -Path $distPath -ChildPath 'scripts')

    $cnamePath = Join-Path -Path $baseDir -ChildPath 'cname'
    if (Test-Path -Path $cnamePath) {
        Copy-Item -Path $cnamePath -Destination (Join-Path -Path $distPath -ChildPath 'cname') -Force
    }

    Write-Host "Build completed: dist is ready for GitHub Pages."
}

function Invoke-NodeBuild {
    Write-Host "Running Node.js build..."
    & node (Join-Path -Path $baseDir -ChildPath 'build.js')
    if ($LASTEXITCODE -ne 0) {
        throw "build.js exited with code $LASTEXITCODE"
    }
}

function Start-PowerShellPreview {
    param(
        [Parameter(Mandatory = $true)][int]$PreviewPort
    )

    $distPath = Join-Path -Path $baseDir -ChildPath 'dist'
    if (-not (Test-Path -Path $distPath)) {
        throw "dist directory not found. Run build first."
    }

    Add-Type -AssemblyName System.Web
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$PreviewPort/")
    $listener.Start()

    Write-Host "Preview server running at http://localhost:$PreviewPort"
    Write-Host "Press Ctrl+C to stop."

    try {
        while ($listener.IsListening) {
            $context = $listener.GetContext()
            $requestPath = [System.Web.HttpUtility]::UrlDecode($context.Request.Url.AbsolutePath)
            if ([string]::IsNullOrWhiteSpace($requestPath) -or $requestPath -eq '/') {
                $requestPath = '/index.html'
            }

            $relativePath = $requestPath.TrimStart('/') -replace '/', '\\'
            $fullPath = Join-Path -Path $distPath -ChildPath $relativePath

            if ((Test-Path -Path $fullPath) -and -not (Get-Item -Path $fullPath).PSIsContainer) {
                $bytes = [System.IO.File]::ReadAllBytes($fullPath)
                $extension = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
                $contentType = switch ($extension) {
                    '.html' { 'text/html; charset=utf-8' }
                    '.css' { 'text/css; charset=utf-8' }
                    '.js' { 'application/javascript; charset=utf-8' }
                    '.json' { 'application/json; charset=utf-8' }
                    '.svg' { 'image/svg+xml' }
                    '.png' { 'image/png' }
                    '.jpg' { 'image/jpeg' }
                    '.jpeg' { 'image/jpeg' }
                    '.webp' { 'image/webp' }
                    '.ico' { 'image/x-icon' }
                    default { 'application/octet-stream' }
                }

                $context.Response.ContentType = $contentType
                $context.Response.ContentLength64 = $bytes.Length
                $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            else {
                $context.Response.StatusCode = 404
                $notFound = [System.Text.Encoding]::UTF8.GetBytes('Not found')
                $context.Response.ContentType = 'text/plain; charset=utf-8'
                $context.Response.ContentLength64 = $notFound.Length
                $context.Response.OutputStream.Write($notFound, 0, $notFound.Length)
            }

            $context.Response.OutputStream.Close()
        }
    }
    finally {
        $listener.Stop()
        $listener.Close()
    }
}

function Invoke-Build {
    if (Get-Command -Name node -ErrorAction SilentlyContinue) {
        Invoke-NodeBuild
    }
    else {
        Write-Host "Node.js not found. Using PowerShell fallback build."
        Invoke-NativeBuild
    }
}

Write-Host "Reminder: edit source files under 'styles/' and 'scripts/' (not 'dist/')."

$distPath = Join-Path -Path $baseDir -ChildPath 'dist'
$distIndex = Join-Path -Path $distPath -ChildPath 'index.html'

if ($Mode -eq 'build') {
    Invoke-Build
    Write-Host "Build finished and script exited."
}
elseif ($Mode -eq 'preview') {
    if ($Rebuild -or -not (Test-Path -Path $distIndex)) {
        Invoke-Build
    }
    else {
        Write-Host "Using existing dist output (no rebuild). Use -Rebuild to force a fresh build."
    }

    if (Get-Command -Name node -ErrorAction SilentlyContinue) {
        Write-Host "Starting local preview on http://localhost:$Port"
        & node (Join-Path -Path $baseDir -ChildPath 'preview.js') --port $Port
    }
    else {
        Start-PowerShellPreview -PreviewPort $Port
    }
}
