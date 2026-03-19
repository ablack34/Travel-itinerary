targetScope = 'resourceGroup'

@description('Location for all resources')
param location string = resourceGroup().location

@description('Unique suffix for resource names')
param resourceSuffix string = uniqueString(resourceGroup().id)

// ---- Storage Account (for attachments) ----
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
    allowSharedKeyAccess: true
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

// ---- Static Web App (hosts HTML + API functions) ----
resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: 'travel-itinerary-${resourceSuffix}'
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    buildProperties: {
      appLocation: '.'
      outputLocation: 'dist'
      apiLocation: 'api'
    }
  }
}

// ---- Role assignment: SWA → Storage Blob Data Contributor ----
var storageBlobDataContributorRole = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')

resource swaStorageRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: storageAccount
  name: guid(storageAccount.id, staticWebApp.id, storageBlobDataContributorRole)
  properties: {
    roleDefinitionId: storageBlobDataContributorRole
    principalId: staticWebApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// ---- SWA app settings (storage account name for managed identity auth) ----
resource swaAppSettings 'Microsoft.Web/staticSites/config@2023-01-01' = {
  parent: staticWebApp
  name: 'appsettings'
  properties: {
    AZURE_STORAGE_ACCOUNT_NAME: storageAccount.name
  }
}

// ---- Outputs ----
output staticWebAppName string = staticWebApp.name
output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output storageAccountName string = storageAccount.name
