Write-Host "Rolling back traffic to BLUE..."

(Get-Content nginx\default.conf) `
    -replace 'proxy_pass http://green_backend;', 'proxy_pass http://blue_backend;' |
    Set-Content nginx\default.conf

docker exec blue-green-nginx nginx -t

if ($LASTEXITCODE -ne 0) {
    Write-Host "Nginx configuration test failed."
    exit 1
}

docker exec blue-green-nginx nginx -s reload

Write-Host "Rollback completed. BLUE is now live."