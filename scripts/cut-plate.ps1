# Grayscale circular coin plate. Finds the emblem circle, maps its center
# to the canvas center, and fills past source rings so CSS brass is the rim.
param(
  [Parameter(Mandatory = $true)][string]$In,
  [Parameter(Mandatory = $true)][string]$Out,
  [int]$Size = 512,
  [double]$Fill = 1.06
)

Add-Type -AssemblyName System.Drawing

function Get-EmblemMap([System.Drawing.Bitmap]$bmp) {
  $w = $bmp.Width
  $h = $bmp.Height
  $rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
  $data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $stride = $data.Stride
  $bytes = New-Object byte[] ($stride * $h)
  [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
  $bmp.UnlockBits($data)

  $minX = $w; $minY = $h; $maxX = -1; $maxY = -1
  for ($y = 0; $y -lt $h; $y++) {
    $row = $y * $stride
    for ($x = 0; $x -lt $w; $x++) {
      $i = $row + $x * 3
      $l = 0.114 * $bytes[$i] + 0.587 * $bytes[$i + 1] + 0.299 * $bytes[$i + 2]
      if ($l -le 22) { continue }
      if ($x -lt $minX) { $minX = $x }
      if ($y -lt $minY) { $minY = $y }
      if ($x -gt $maxX) { $maxX = $x }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }
  $cx = ($minX + $maxX) / 2.0
  $cy = ($minY + $maxY) / 2.0
  $outer = [Math]::Min([Math]::Min($cx - $minX, $maxX - $cx), [Math]::Min($cy - $minY, $maxY - $cy))
  $maxR = [int][Math]::Ceiling($outer) + 8
  $sums = New-Object double[] ($maxR + 1)
  $counts = New-Object int[] ($maxR + 1)
  for ($y = 0; $y -lt $h; $y++) {
    $row = $y * $stride
    for ($x = 0; $x -lt $w; $x++) {
      $i = $row + $x * 3
      $l = 0.114 * $bytes[$i] + 0.587 * $bytes[$i + 1] + 0.299 * $bytes[$i + 2]
      $r = [int][Math]::Round([Math]::Sqrt(($x - $cx) * ($x - $cx) + ($y - $cy) * ($y - $cy)))
      if ($r -ge 0 -and $r -le $maxR) { $sums[$r] += $l; $counts[$r]++ }
    }
  }

  $peakR = [int]$outer
  $peakL = -1.0
  $from = [Math]::Max(0, [int]($outer * 0.82))
  $to = [Math]::Min($maxR, [int]($outer + 4))
  for ($r = $from; $r -le $to; $r++) {
    if ($counts[$r] -le 0) { continue }
    $m = $sums[$r] / $counts[$r]
    if ($m -gt $peakL) { $peakL = $m; $peakR = $r }
  }

  $inner = $outer * 0.96
  $inDark = $false
  for ($r = $peakR; $r -ge [int]($outer * 0.7); $r--) {
    if ($counts[$r] -le 0) { continue }
    $m = $sums[$r] / $counts[$r]
    if (-not $inDark) {
      if ($m -lt 42) { $inDark = $true }
      continue
    }
    if ($m -gt 48) {
      $inner = $r + 1
      break
    }
    $inner = $r
  }

  [pscustomobject]@{ Cx = $cx; Cy = $cy; Inner = $inner; Outer = $outer }
}

$srcPath = (Resolve-Path $In).Path
$src = New-Object System.Drawing.Bitmap $srcPath
$map = Get-EmblemMap $src
$scale = ($Size / 2.0) / $map.Inner * $Fill
$dx = [int][Math]::Round($Size / 2.0 - $map.Cx * $scale)
$dy = [int][Math]::Round($Size / 2.0 - $map.Cy * $scale)
$dw = [int][Math]::Round($src.Width * $scale)
$dh = [int][Math]::Round($src.Height * $scale)

$bmp = New-Object System.Drawing.Bitmap $Size, $Size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::Black)

$clip = New-Object System.Drawing.Drawing2D.GraphicsPath
$clip.AddEllipse(-1, -1, $Size + 1, $Size + 1)
$g.SetClip($clip)

$cm = New-Object System.Drawing.Imaging.ColorMatrix
$cm.Matrix00 = 0.374; $cm.Matrix01 = 0.374; $cm.Matrix02 = 0.374
$cm.Matrix10 = 0.734; $cm.Matrix11 = 0.734; $cm.Matrix12 = 0.734
$cm.Matrix20 = 0.142; $cm.Matrix21 = 0.142; $cm.Matrix22 = 0.142
$cm.Matrix33 = 1
$cm.Matrix40 = -0.08; $cm.Matrix41 = -0.08; $cm.Matrix42 = -0.08
$ia = New-Object System.Drawing.Imaging.ImageAttributes
$ia.SetColorMatrix($cm)

$dest = New-Object System.Drawing.Rectangle $dx, $dy, $dw, $dh
$g.DrawImage($src, $dest, 0, 0, $src.Width, $src.Height, [System.Drawing.GraphicsUnit]::Pixel, $ia)

$g.ResetClip()
$ring = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(235, 235, 235), 2)
$g.DrawEllipse($ring, 1, 1, $Size - 3, $Size - 3)

$dir = Split-Path -Parent $Out
if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)

$ring.Dispose(); $ia.Dispose(); $clip.Dispose(); $g.Dispose(); $bmp.Dispose(); $src.Dispose()
Write-Output ("cut {0} {1}x{1} center={2:n1},{3:n1} inner={4:n1} scale={5:n3}" -f $Out, $Size, $map.Cx, $map.Cy, $map.Inner, $scale)
