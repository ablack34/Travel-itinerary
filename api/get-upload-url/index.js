const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions } = require("@azure/storage-blob");
const { ManagedIdentityCredential } = require("@azure/identity");

const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'doc', 'docx', 'eml', 'msg', 'txt'];

module.exports = async function (context, req) {
    const { day, fileName } = req.body || {};
    if (!day || !fileName) {
        context.res = { status: 400, body: { error: "Missing 'day' or 'fileName' in request body" } };
        return;
    }

    const ext = fileName.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        context.res = { status: 400, body: { error: `File type '.${ext}' not allowed` } };
        return;
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeDay = day.replace(/ /g, "-");
    const blobPath = `${safeDay}/${safeName}`;

    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    if (!accountName) {
        context.res = { status: 500, body: { error: "Storage not configured" } };
        return;
    }

    try {
        const credential = new ManagedIdentityCredential();
        const blobServiceClient = new BlobServiceClient(
            `https://${accountName}.blob.core.windows.net`,
            credential
        );
        const containerClient = blobServiceClient.getContainerClient("attachments");
        await containerClient.createIfNotExists();

        const startsOn = new Date();
        const expiresOn = new Date(Date.now() + 5 * 60 * 1000);
        const userDelegationKey = await blobServiceClient.getUserDelegationKey(startsOn, expiresOn);

        const blobClient = containerClient.getBlobClient(blobPath);
        const sasToken = generateBlobSASQueryParameters({
            containerName: "attachments",
            blobName: blobPath,
            permissions: BlobSASPermissions.parse("cw"),
            expiresOn
        }, userDelegationKey, accountName).toString();

        context.res = {
            headers: { "Content-Type": "application/json" },
            body: {
                uploadUrl: `${blobClient.url}?${sasToken}`,
                blobPath
            }
        };
    } catch (e) {
        context.log.error("get-upload-url error:", e.message);
        context.res = {
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: { error: e.message || "Failed to generate upload URL" }
        };
    }
};
