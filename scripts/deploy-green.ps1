
Write-Host ""
Write-Host "========================================"
Write-Host " BLUE/GREEN DEPLOYMENT - GREEN RELEASE"
Write-Host "========================================"
Write-Host ""

Write-Host "Building GREEN image..."
docker compose build green

Write-Host ""
Write-Host "Starting GREEN container..."
docker compose up -d green

Write-Host ""
Write-Host "Waiting for GREEN to become healthy..."
Start-Sleep -Seconds 5

try {
    Invoke-WebRequest http://localhost:5002 -UseBasicParsing | Out-Null

    Write-Host ""
    Write-Host "GREEN HEALTH CHECK PASSED" -ForegroundColor Green

    Write-Host ""
    Write-Host "Switching Nginx traffic to GREEN..."

    docker exec blue-green-nginx sh -c "sed -i 's/server blue-app:80;/server green-app:80;/' /etc/nginx/conf.d/default.conf"

    docker exec blue-green-nginx nginx -s reload

    Write-Host ""
    Write-Host "GREEN IS NOW LIVE" -ForegroundColor Green
}
catch {

    Write-Host ""
    Write-Host "GREEN FAILED HEALTH CHECK" -ForegroundColor Red

    Write-Host "Keeping BLUE LIVE..."

}