const { BlobServiceClient } = require("@azure/storage-blob");

module.exports = async function (context, req) {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
        context.res = { status: 500, body: { error: "Storage not configured" } };
        return;
    }

    const itinerary = req.body;
    if (!itinerary || !itinerary.days || !Array.isArray(itinerary.days)) {
        context.res = { status: 400, body: { error: "Invalid itinerary data" } };
        return;
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient("data");
    await containerClient.createIfNotExists();

    const blobClient = containerClient.getBlockBlobClient("itinerary.json");
    const content = JSON.stringify(itinerary, null, 2);

    await blobClient.upload(content, content.length, {
        blobHTTPHeaders: { blobContentType: "application/json" }
    });

    context.res = {
        headers: { "Content-Type": "application/json" },
        body: { success: true }
    };
};
