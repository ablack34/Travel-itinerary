const { CosmosClient } = require("@azure/cosmos");

module.exports = async function (context, req) {
    const connectionString = process.env.COSMOS_CONNECTION_STRING;
    if (!connectionString) {
        context.res = { status: 500, headers: { "Content-Type": "application/json" }, body: { error: "Database not configured" } };
        return;
    }

    try {
        const client = new CosmosClient(connectionString);
        const container = client.database("travel").container("itinerary");
        const { resource } = await container.item("main", "main").read();

        if (!resource) {
            context.res = { status: 404, headers: { "Content-Type": "application/json" }, body: { error: "No itinerary found" } };
            return;
        }

        // Return the itinerary data (strip Cosmos metadata)
        const { _rid, _self, _etag, _attachments, _ts, ...itinerary } = resource;
        context.res = { headers: { "Content-Type": "application/json" }, body: itinerary };
    } catch (e) {
        if (e.code === 404) {
            context.res = { status: 404, headers: { "Content-Type": "application/json" }, body: { error: "No itinerary found" } };
        } else {
            context.log.error("get-itinerary:", e.message);
            context.res = { status: 500, headers: { "Content-Type": "application/json" }, body: { error: e.message } };
        }
    }
};
