# Start script — Drone Digital Twin
# Run from the project root

Write-Host "=== Drone Digital Twin — Start ===" -ForegroundColor Cyan

# Start Backend
Write-Host "`n[1/2] Starting backend on http://localhost:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$PSScriptRoot\backend'; venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
)

Start-Sleep -Seconds 2

# Start Frontend
Write-Host "[2/2] Starting frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$PSScriptRoot\frontend'; npm run dev"
)

Write-Host "`n=== Both services started ===" -ForegroundColor Cyan
Write-Host "Simulator:     http://localhost:5173/simulator" -ForegroundColor White
Write-Host "Digital Twin:  http://localhost:5173/digital-twin" -ForegroundColor White
Write-Host "Backend API:   http://localhost:8000" -ForegroundColor White
Write-Host "Backend Docs:  http://localhost:8000/docs" -ForegroundColor White