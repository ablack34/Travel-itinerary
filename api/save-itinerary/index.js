const { CosmosClient } = require("@azure/cosmos");

module.exports = async function (context, req) {
    const connectionString = process.env.COSMOS_CONNECTION_STRING;
    if (!connectionString) {
        context.res = { status: 500, body: { error: "Database not configured" } };
        return;
    }

    const itinerary = req.body;
    if (!itinerary || !itinerary.days || !Array.isArray(itinerary.days)) {
        context.res = { status: 400, body: { error: "Invalid itinerary data" } };
        return;
    }

    try {
        const client = new CosmosClient(connectionString);
        const container = client.database("travel").container("itinerary");

        // Upsert the itinerary as a single document with fixed id
        await container.items.upsert({ id: "main", ...itinerary });

        context.res = { headers: { "Content-Type": "application/json" }, body: { success: true } };
    } catch (e) {
        context.log.error("save-itinerary:", e.message);
        context.res = { status: 500, headers: { "Content-Type": "application/json" }, body: { error: e.message } };
    }
};
