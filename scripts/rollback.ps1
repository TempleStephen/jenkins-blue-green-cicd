Write-Host "========== ROLLBACK STARTED ==========" -ForegroundColor Yellow

$nginxContainer = "blue-green-nginx"

Write-Host "Checking active backend..."

$active = docker exec $nginxContainer sh -c "grep proxy_pass /etc/nginx/conf.d/default.conf"

if ($active -match "green_backend") {
    $target = "blue_backend"
    Write-Host "Green is LIVE. Rolling back to BLUE..." -ForegroundColor Cyan
}
elseif ($active -match "blue_backend") {
    $target = "green_backend"
    Write-Host "Blue is LIVE. Rolling back to GREEN..." -ForegroundColor Cyan
}
else {
    Write-Host "Unable to determine active backend." -ForegroundColor Red
    exit 1
}

docker exec $nginxContainer sh -c "
sed -i 's|proxy_pass http://.*_backend;|proxy_pass http://$target;|g' \
/etc/nginx/conf.d/default.conf"

docker exec $nginxContainer nginx -t
if ($LASTEXITCODE -ne 0) {
    Write-Host "Nginx configuration failed validation." -ForegroundColor Red
    exit 1
}

docker exec $nginxContainer nginx -s reload

Write-Host ""
Write-Host "Rollback completed successfully." -ForegroundColor Green

docker exec $nginxContainer grep proxy_pass /etc/nginx/conf.d/default.conf