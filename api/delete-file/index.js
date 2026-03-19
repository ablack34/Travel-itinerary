const { BlobServiceClient } = require("@azure/storage-blob");
const { ManagedIdentityCredential } = require("@azure/identity");

module.exports = async function (context, req) {
    const { blobPath } = req.body || {};
    if (!blobPath) {
        context.res = { status: 400, body: { error: "Missing 'blobPath' in request body" } };
        return;
    }

    if (blobPath.includes("..") || !blobPath.includes("/")) {
        context.res = { status: 400, body: { error: "Invalid blob path" } };
        return;
    }

    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    if (!accountName) {
        context.res = { status: 500, body: { error: "Storage not configured" } };
        return;
    }

    try {
        const blobServiceClient = new BlobServiceClient(
            `https://${accountName}.blob.core.windows.net`,
            new ManagedIdentityCredential()
        );
        const containerClient = blobServiceClient.getContainerClient("attachments");
        const blobClient = containerClient.getBlobClient(blobPath);

        await blobClient.deleteIfExists();
        context.res = {
            headers: { "Content-Type": "application/json" },
            body: { success: true }
        };
    } catch (e) {
        context.log.error("delete-file error:", e.message);
        context.res = { status: 500, body: { error: "Failed to delete file" } };
    }
};
