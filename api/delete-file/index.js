module.exports = async function (context, req) {
    context.res = {
        status: 501,
        headers: { "Content-Type": "application/json" },
        body: { error: "File deletion not yet available" }
    };
};
