const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } = require("@azure/storage-blob");

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'doc', 'docx', 'eml', 'msg', 'txt'];

module.exports = async function (context, req) {
    const { day, fileName } = req.body || {};
    if (!day || !fileName) {
        context.res = { status: 400, body: { error: "Missing 'day' or 'fileName' in request body" } };
        return;
    }

    // Validate file extension
    const ext = fileName.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        context.res = { status: 400, body: { error: `File type '.${ext}' not allowed` } };
        return;
    }

    // Sanitize file name — allow only safe characters
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeDay = day.replace(/ /g, "-");
    const blobPath = `${safeDay}/${safeName}`;

    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
        context.res = { status: 500, body: { error: "Storage not configured" } };
        return;
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient("attachments");

    // Ensure container exists
    await containerClient.createIfNotExists();

    const accountName = connectionString.match(/AccountName=([^;]+)/)[1];
    const accountKey = connectionString.match(/AccountKey=([^;]+)/)[1];
    const credential = new StorageSharedKeyCredential(accountName, accountKey);

    // Generate a 5-minute write-only SAS token for this specific blob
    const blobClient = containerClient.getBlobClient(blobPath);
    const sasToken = generateBlobSASQueryParameters({
        containerName: "attachments",
        blobName: blobPath,
        permissions: BlobSASPermissions.parse("cw"), // create + write only
        expiresOn: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        contentLengthRange: { max: MAX_FILE_SIZE }
    }, credential).toString();

    context.res = {
        headers: { "Content-Type": "application/json" },
        body: {
            uploadUrl: `${blobClient.url}?${sasToken}`,
            blobPath
        }
    };
};
