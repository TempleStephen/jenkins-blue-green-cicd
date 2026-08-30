param(
    [string]$Url = "http://localhost:5002"
)

Write-Host "Checking application health at $Url"

try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10

    if ($response.StatusCode -eq 200) {
        Write-Host "Health check PASSED"
        exit 0
    }

    Write-Host "Health check FAILED: HTTP $($response.StatusCode)"
    exit 1
}
catch {
    Write-Host "Health check FAILED: $($_.Exception.Message)"
    exit 1
}ys