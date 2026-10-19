Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\HP\Desktop\getaipilot\mobile\getaipilot-app\assets\images\referral-invite.jpg"
$dstPath = "c:\Users\HP\Desktop\getaipilot\mobile\getaipilot-app\assets\images\referral-invite.png"

$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$dst = New-Object System.Drawing.Bitmap($src.Width, $src.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Using LockBits for fast pixel processing
$rect = New-Object System.Drawing.Rectangle(0, 0, $src.Width, $src.Height)
$srcData = $src.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$dstData = $dst.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

$bytes = [Math]::Abs($srcData.Stride) * $src.Height
$rgbValues = New-Object byte[] $bytes

[System.Runtime.InteropServices.Marshal]::Copy($srcData.Scan0, $rgbValues, 0, $bytes)

# Format32bppArgb: B, G, R, A
for ($i = 0; $i -lt $bytes; $i += 4) {
    $b = $rgbValues[$i]
    $g = $rgbValues[$i + 1]
    $r = $rgbValues[$i + 2]

    # Check if pixel is white / light grayish background
    # Note: background is > 235 on all channels
    if ($r -gt 232 -and $g -gt 232 -and $b -gt 232) {
        $rgbValues[$i + 3] = 0 # Fully transparent Alpha
    } elseif ($r -gt 220 -and $g -gt 220 -and $b -gt 220) {
        # Soft antialiasing edge
        $avg = ($r + $g + $b) / 3.0
        $alpha = [byte][Math]::Max(0, [Math]::Min(255, (232.0 - $avg) / 12.0 * 255.0))
        $rgbValues[$i + 3] = $alpha
    }
}

[System.Runtime.InteropServices.Marshal]::Copy($rgbValues, 0, $dstData.Scan0, $bytes)

$src.UnlockBits($srcData)
$dst.UnlockBits($dstData)

$dst.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)

$src.Dispose()
$dst.Dispose()

Write-Output "Successfully saved transparent PNG to $dstPath"
