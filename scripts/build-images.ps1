# Scripts/build-images.ps1
# Script automatizado para construir y exportar imagenes Docker

$ErrorActionPreference = "Stop"

Write-Host "--- INICIANDO BUILD DE IMAGENES WOLFMEDIC ---" -ForegroundColor Cyan

# 1. Validaciones previas
Write-Host "1. Validando estructura de carpetas..." -ForegroundColor Yellow
if (-not (Test-Path "auth-service")) { Write-Error "Falta carpeta auth-service" }
if (-not (Test-Path "back")) { Write-Error "Falta carpeta back" }
if (-not (Test-Path "front")) { Write-Error "Falta carpeta front" }
if (-not (Test-Path "front/sim-agenda-web/package.json")) { Write-Error "Falta front/sim-agenda-web/package.json" }

# Crear carpeta de destino
$deployImagesPath = "deploy/images"
if (-not (Test-Path $deployImagesPath)) {
    New-Item -ItemType Directory -Force -Path $deployImagesPath | Out-Null
    Write-Host "Carpeta $deployImagesPath creada." -ForegroundColor Green
}

# 2. Construir Imagenes
Write-Host "`n2. Construyendo imagenes Docker..." -ForegroundColor Cyan

# Auth
Write-Host "-> Construyendo wolfmedic-auth:1.0.0 (desde ./auth-service)..."
docker build -t wolfmedic-auth:1.0.0 ./auth-service
if ($LASTEXITCODE -ne 0) { Write-Error "Error construyendo auth-service" }

# Back
Write-Host "-> Construyendo wolfmedic-api:1.0.0 (desde ./back)..."
docker build -t wolfmedic-api:1.0.0 ./back
if ($LASTEXITCODE -ne 0) { Write-Error "Error construyendo back" }

# Front
Write-Host "-> Construyendo wolfmedic-front:1.0.0 (desde ./front/sim-agenda-web)..."
docker build -t wolfmedic-front:1.0.0 ./front/sim-agenda-web
if ($LASTEXITCODE -ne 0) { Write-Error "Error construyendo front" }

# 3. Exportar Imagenes
Write-Host "`n3. Exportando imagenes a .tar..." -ForegroundColor Cyan

$images = @(
    @{ Name = "wolfmedic-auth:1.0.0"; File = "$deployImagesPath/auth-service.tar" },
    @{ Name = "wolfmedic-api:1.0.0"; File = "$deployImagesPath/back-service.tar" },
    @{ Name = "wolfmedic-front:1.0.0"; File = "$deployImagesPath/frontend.tar" }
)

foreach ($img in $images) {
    Write-Host "Exportando $($img.Name) a $($img.File)..."
    docker save -o $img.File $img.Name
    if ($LASTEXITCODE -ne 0) { Write-Error "Error exportando $($img.Name)" }
}

# 4. Resumen
Write-Host "`n--- PROCESO FINALIZADO EXITOSAMENTE ---" -ForegroundColor Green
Write-Host "Archivos generados en ${deployImagesPath}:"
Get-ChildItem $deployImagesPath | Select-Object Name, @{Name = "Size(MB)"; Expression = { "{0:N2}" -f ($_.Length / 1MB) } } | Format-Table -AutoSize
