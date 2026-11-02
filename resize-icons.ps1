Add-Type -AssemblyName System.Drawing

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourcePath = Join-Path $scriptDir "icons\icon-master.png"
$destDir = Join-Path $scriptDir "icons"

if (-not (Test-Path $sourcePath)) {
    Write-Error "Source image not found at $sourcePath"
    exit 1
}

$srcImage = [System.Drawing.Image]::FromFile($sourcePath)
Write-Output "Loaded master icon: $($srcImage.Width) x $($srcImage.Height)"

$sizes = @(16, 48, 128)

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $graphics.DrawImage($srcImage, 0, 0, $size, $size)
    $graphics.Dispose()

    $destFile = Join-Path $destDir "icon$size.png"
    $bmp.Save($destFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()

    Write-Output "Generated $destFile ($size x $size)"
}

$srcImage.Dispose()
Write-Output "All icons successfully created!"
