const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions } = require("@azure/storage-blob");
const { DefaultAzureCredential } = require("@azure/identity");

module.exports = async function (context, req) {
    const day = req.query.day;
    if (!day) {
        context.res = { status: 400, body: { error: "Missing 'day' query parameter" } };
        return;
    }

    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    if (!accountName) {
        context.res = { status: 500, body: { error: "Storage not configured" } };
        return;
    }

    try {
        const credential = new DefaultAzureCredential();
        const blobServiceClient = new BlobServiceClient(
            `https://${accountName}.blob.core.windows.net`,
            credential
        );
        const containerClient = blobServiceClient.getContainerClient("attachments");

        // Get user delegation key for read-only SAS
        const startsOn = new Date();
        const expiresOn = new Date(Date.now() + 15 * 60 * 1000);
        const userDelegationKey = await blobServiceClient.getUserDelegationKey(startsOn, expiresOn);

        const prefix = day.replace(/ /g, "-") + "/";
        const files = [];

        for await (const blob of containerClient.listBlobsFlat({ prefix })) {
            const blobClient = containerClient.getBlobClient(blob.name);
            const sasToken = generateBlobSASQueryParameters({
                containerName: "attachments",
                blobName: blob.name,
                permissions: BlobSASPermissions.parse("r"),
                expiresOn
            }, userDelegationKey, accountName).toString();

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
    } catch (e) {
        context.log.error("list-files error:", e.message);
        context.res = {
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: { error: e.message }
        };
    }
};
