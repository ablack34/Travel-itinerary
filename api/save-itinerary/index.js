const { BlobServiceClient } = require("@azure/storage-blob");
const { DefaultAzureCredential } = require("@azure/identity");

module.exports = async function (context, req) {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    if (!accountName) {
        context.res = { status: 500, body: { error: "Storage not configured" } };
        return;
    }

    const itinerary = req.body;
    if (!itinerary || !itinerary.days || !Array.isArray(itinerary.days)) {
        context.res = { status: 400, body: { error: "Invalid itinerary data" } };
        return;
    }

    try {
        const blobServiceClient = new BlobServiceClient(
            `https://${accountName}.blob.core.windows.net`,
            new DefaultAzureCredential()
        );
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
    } catch (e) {
        context.log.error("save-itinerary error:", e.message);
        context.res = { status: 500, headers: { "Content-Type": "application/json" }, body: { error: e.message } };
    }
};
