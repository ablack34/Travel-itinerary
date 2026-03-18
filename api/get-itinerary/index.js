const { BlobServiceClient } = require("@azure/storage-blob");

module.exports = async function (context, req) {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
        context.res = { status: 500, body: { error: "Storage not configured" } };
        return;
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
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
