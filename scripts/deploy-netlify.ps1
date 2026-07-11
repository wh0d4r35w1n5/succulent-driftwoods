$ErrorActionPreference = "Stop"

# Workaround for Netlify CLI TLS errors on some Windows setups.
$env:NODE_OPTIONS = "--use-system-ca"

Write-Host "Netlify CLI version:"
netlify --version

Write-Host ""
Write-Host "Checking Netlify auth status..."
netlify status

Write-Host ""
Write-Host "If not logged in, starting login flow..."
netlify login

Write-Host ""
Write-Host "Linking this folder to a Netlify site (if not already linked)..."
netlify link

Write-Host ""
Write-Host "Deploying to production..."
netlify deploy --prod

