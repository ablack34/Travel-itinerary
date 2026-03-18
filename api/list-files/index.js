const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } = require("@azure/storage-blob");

module.exports = async function (context, req) {
    const day = req.query.day;
    if (!day) {
        context.res = { status: 400, body: { error: "Missing 'day' query parameter" } };
        return;
    }

    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
        context.res = { status: 500, body: { error: "Storage not configured" } };
        return;
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient("attachments");

    // Parse connection string to get account name and key for SAS generation
    const accountName = connectionString.match(/AccountName=([^;]+)/)[1];
    const accountKey = connectionString.match(/AccountKey=([^;]+)/)[1];
    const credential = new StorageSharedKeyCredential(accountName, accountKey);

    const prefix = day.replace(/ /g, "-") + "/";
    const files = [];

    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
        // Generate a short-lived read-only SAS URL for each file
        const blobClient = containerClient.getBlobClient(blob.name);
        const sasToken = generateBlobSASQueryParameters({
            containerName: "attachments",
            blobName: blob.name,
            permissions: BlobSASPermissions.parse("r"),
            expiresOn: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        }, credential).toString();

        files.push({
            name: blob.name.split("/").pop(),
            fullPath: blob.name,
            size: blob.properties.contentLength,
            type: blob.properties.contentType,
            url: `${blobClient.url}?${sasToken}`
        });
    }

    context.res = {
        headers: { "Content-Type": "application/json" },
        body: { files }
    };
};
