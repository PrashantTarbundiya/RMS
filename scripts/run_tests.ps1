param (
    [string]$TestFile = "test_analytics.py"
)

$env:PYTHONPATH = "backend"
$env:PYTHONIOENCODING = "utf-8"

$testPath = Join-Path "backend\tests" $TestFile
Write-Host "Running test: $testPath"
& "backend\venv\Scripts\python.exe" $testPath
