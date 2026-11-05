# UTF-8 olarak hazırlanmış JSON payload - doğrudan string olarak gönder
$json = '{"title":"Proje Kick-off Duyurusu","subtitle":"01 Mayis 2026 | Istanbul","design":"modern","logoUrl":"","headerImgUrl":"https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=640&q=80","blocks":[{"id":"b1","type":"title","data":{"text":"Kick-off Toplantisi","size":"h1"}},{"id":"b2","type":"paragraph","data":{"text":"AB Erasmus+ projemizin baslangici resmi olarak gerceklesti. 5 farkli ulkeden katilimcilarla hedeflerimizi belirledik."}},{"id":"b3","type":"photos","data":{"url":"https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=640&q=80","caption":"Kick-off toplantisi fotografi"}}]}'

$apiUrl = if ($env:NOTEBOOK_SYNC_URL) { $env:NOTEBOOK_SYNC_URL } else { "http://localhost:3000/api/notebook-sync" }
if (-not $env:NOTEBOOK_SYNC_SECRET -or $env:NOTEBOOK_SYNC_SECRET.Length -lt 24) {
    Write-Error "NOTEBOOK_SYNC_SECRET tanımlanmalı (en az 24 karakter)."
    exit 1
}

try {
    $response = Invoke-RestMethod -Method Post -Uri $apiUrl -Body $json -ContentType "application/json" -Headers @{ "x-notebook-secret" = $env:NOTEBOOK_SYNC_SECRET }
    Write-Host "Payload basariyla gonderildi!" -ForegroundColor Green
}
catch {
    Write-Host "Hata: $_" -ForegroundColor Red
}
