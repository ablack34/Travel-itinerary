const { BlobServiceClient } = require("@azure/storage-blob");

module.exports = async function (context, req) {
    const { blobPath } = req.body || {};
    if (!blobPath) {
        context.res = { status: 400, body: { error: "Missing 'blobPath' in request body" } };
        return;
    }

    // Validate path structure: must be "day/filename" within attachments container
    if (blobPath.includes("..") || !blobPath.includes("/")) {
        context.res = { status: 400, body: { error: "Invalid blob path" } };
        return;
    }

    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
        context.res = { status: 500, body: { error: "Storage not configured" } };
        return;
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient("attachments");
    const blobClient = containerClient.getBlobClient(blobPath);

    try {
        await blobClient.deleteIfExists();
        context.res = {
            headers: { "Content-Type": "application/json" },
            body: { success: true }
        };
    } catch (e) {
        context.res = { status: 500, body: { error: "Failed to delete file" } };
    }
};
