# Azure Deployment Plan — Travel Itinerary

## Status: Deployed — Svelte Refactor In Progress

## Architecture
- **Azure Static Web Apps** (Free) — hosts Svelte frontend + API functions
- **Azure Blob Storage** — stores attachment files + itinerary JSON data
- **GitHub Actions** — CI/CD pipeline

## Resources Created by Bicep
| Resource | Type | SKU |
|----------|------|-----|
| Storage Account | Microsoft.Storage/storageAccounts | Standard_LRS |
| Blob Container | `attachments` | Private |
| Blob Container | `data` | Private (itinerary.json) |
| Static Web App | Microsoft.Web/staticSites | Free |

## Svelte Refactor Phases
See `.instructions.md` for full details.

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Scaffold Svelte + extract data + API endpoints | NOT STARTED |
| 2 | Core rendering (view mode) | NOT STARTED |
| 3 | Edit mode + inline editing + auto-save | NOT STARTED |
| 4 | Drag & drop with country boundary confirmation | NOT STARTED |
| 5 | Port attachment modal to Svelte | NOT STARTED |
| 6 | Polish, loading states, error handling | NOT STARTED |

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
