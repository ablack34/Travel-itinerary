targetScope = 'resourceGroup'

@description('Location for all resources')
param location string = resourceGroup().location

@description('Unique suffix for resource names')
param resourceSuffix string = uniqueString(resourceGroup().id)

// ---- Static Web App (frontend + managed API functions) ----
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
      apiLocation: 'api'
    }
  }
}

// ---- Outputs ----
output staticWebAppName string = staticWebApp.name
output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'
