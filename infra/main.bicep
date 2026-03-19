targetScope = 'resourceGroup'

@description('Location for all resources')
param location string = resourceGroup().location

@description('Unique suffix for resource names')
param resourceSuffix string = uniqueString(resourceGroup().id)

// ---- Storage Account (for attachments + itinerary data + Function App runtime) ----
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'stitinerary${resourceSuffix}'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    publicNetworkAccess: 'Enabled'
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource attachmentsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'attachments'
  properties: {
    publicAccess: 'None'
  }
}

resource dataContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'data'
  properties: {
    publicAccess: 'None'
  }
}

// ---- Function App (standalone API backend) ----
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: 'plan-itinerary-${resourceSuffix}'
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  kind: 'functionapp'
  properties: {
    reserved: true
  }
}

resource functionApp 'Microsoft.Web/sites@2023-01-01' = {
  name: 'func-itinerary-${resourceSuffix}'
  location: location
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    reserved: true
    siteConfig: {
      linuxFxVersion: 'NODE|20'
      appSettings: [
        { name: 'AzureWebJobsStorage__accountName', value: storageAccount.name }
        { name: 'AZURE_STORAGE_ACCOUNT_NAME', value: storageAccount.name }
        { name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' }
        { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'node' }
      ]
    }
  }
}

// ---- Static Web App (hosts Svelte frontend only) ----
resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: 'travel-itinerary-${resourceSuffix}'
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    buildProperties: {
      appLocation: '.'
      outputLocation: 'dist'
    }
  }
}

// ---- Link Function App as SWA backend (proxies /api/* to Function App) ----
resource swaLinkedBackend 'Microsoft.Web/staticSites/linkedBackends@2022-09-01' = {
  parent: staticWebApp
  name: 'backend'
  properties: {
    backendResourceId: functionApp.id
    region: location
  }
}

// NOTE: Role assignments are managed via CLI (CI SP lacks roleAssignment write permission).
// Function App identity needs on the storage account:
//   - Storage Blob Data Contributor
//   - Storage Queue Data Contributor
//   - Storage Table Data Contributor

// ---- Outputs ----
output staticWebAppName string = staticWebApp.name
output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output storageAccountName string = storageAccount.name
output functionAppName string = functionApp.name
