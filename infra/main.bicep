targetScope = 'resourceGroup'

@description('Location for all resources')
param location string = resourceGroup().location

@description('Unique suffix for resource names')
param resourceSuffix string = uniqueString(resourceGroup().id)

// ---- Cosmos DB (serverless, free tier) ----
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-02-15-preview' = {
  name: 'cosmos-itinerary-${resourceSuffix}'
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    locations: [{ locationName: location, failoverPriority: 0 }]
    capabilities: [{ name: 'EnableServerless' }]
  }
}

resource cosmosDb 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-02-15-preview' = {
  parent: cosmosAccount
  name: 'travel'
  properties: {
    resource: { id: 'travel' }
  }
}

resource cosmosContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-02-15-preview' = {
  parent: cosmosDb
  name: 'itinerary'
  properties: {
    resource: {
      id: 'itinerary'
      partitionKey: { paths: ['/id'], kind: 'Hash' }
    }
  }
}

// ---- Static Web App (frontend + managed API functions) ----
resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: 'travel-itinerary-${resourceSuffix}'
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
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

// ---- Wire Cosmos connection string to SWA ----
resource swaAppSettings 'Microsoft.Web/staticSites/config@2023-01-01' = {
  parent: staticWebApp
  name: 'appsettings'
  properties: {
    COSMOS_CONNECTION_STRING: cosmosAccount.listConnectionStrings().connectionStrings[0].connectionString
  }
}

// ---- Outputs ----
output staticWebAppName string = staticWebApp.name
output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'
