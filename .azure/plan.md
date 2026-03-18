# Azure Deployment Plan — Travel Itinerary

## Status: Ready for Deployment

## Architecture
- **Azure Static Web Apps** (Free) — hosts HTML + API functions
- **Azure Blob Storage** (Standard LRS) — stores attachment files
- **GitHub Actions** — CI/CD pipeline

## Resources Created by Bicep
| Resource | Type | SKU |
|----------|------|-----|
| Storage Account | Microsoft.Storage/storageAccounts | Standard_LRS |
| Blob Container | `attachments` | Private |
| Static Web App | Microsoft.Web/staticSites | Free |

## CI/CD Pipeline
- **Trigger:** Push to `main` branch
- **Job 1 (infra):** Deploys Bicep → creates/updates Azure resources
- **Job 2 (deploy):** Deploys HTML + API code to Static Web Apps

## One-Time Setup Required

### 1. Create a GitHub repo (if not already)
```bash
gh repo create Travel-itinerary --public --source=. --push
```

### 2. Set up Azure federated credentials for GitHub Actions
```bash
# Login to Azure
az login

# Create a service principal with federated identity
az ad app create --display-name "travel-itinerary-deploy"

# Note the appId from output, then:
az ad sp create --id <appId>

# Assign Contributor role on your subscription
az role assignment create --assignee <appId> --role Contributor --scope /subscriptions/<subscription-id>

# Create federated credential for GitHub Actions
az ad app federated-credential create --id <appId> --parameters '{
  "name": "github-deploy",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:<your-github-username>/Travel-itinerary:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}'
```

### 3. Add GitHub Secrets
In your repo → Settings → Secrets → Actions, add:
- `AZURE_CLIENT_ID` — the appId from step 2
- `AZURE_TENANT_ID` — from `az account show`
- `AZURE_SUBSCRIPTION_ID` — from `az account show`

### 4. Push and deploy
```bash
git add -A
git commit -m "Add Azure infrastructure and CI/CD"
git push origin main
```

The pipeline will automatically create all Azure resources and deploy the app.
