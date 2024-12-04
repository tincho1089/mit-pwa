# py3 dependency - be a cool kid, install it!
#translation 1.0.1 working properly

py -m pip install azure-ai-translation-text==1.0.1 azure-identity azure-keyvault-secrets

$projectRoot = "$PSScriptRoot/../"

Set-Location "$projectRoot/src/assets/i18n"

py auto-translate.py

Set-Location $projectRoot