const { BlobServiceClient } = require("@azure/storage-blob");
const { DefaultAzureCredential } = require("@azure/identity");

module.exports = async function (context, req) {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    if (!accountName) {
        context.res = { status: 500, headers: { "Content-Type": "application/json" }, body: { error: "Storage not configured" } };
        return;
    }

    const blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        new DefaultAzureCredential()
    );
    const containerClient = blobServiceClient.getContainerClient("data");
    const blobClient = containerClient.getBlobClient("itinerary.json");

    try {
        const downloadResponse = await blobClient.download(0);
        const body = await streamToString(downloadResponse.readableStreamBody);
        const itinerary = JSON.parse(body);

        context.res = {
            headers: { "Content-Type": "application/json" },
            body: itinerary
        };
    } catch (e) {
        if (e.statusCode === 404) {
            context.res = {
                status: 404,
                headers: { "Content-Type": "application/json" },
                body: { error: "No itinerary found" }
            };
        } else {
            context.log.error("get-itinerary error:", e.message);
            context.res = {
                status: 500,
                headers: { "Content-Type": "application/json" },
                body: { error: "Failed to load itinerary" }
            };
        }
    }
};

async function streamToString(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => chunks.push(data.toString()));
        readableStream.on("end", () => resolve(chunks.join("")));
        readableStream.on("error", reject);
    });
}
