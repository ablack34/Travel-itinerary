module.exports = async function (context, req) {
    const token = process.env.GITHUB_PAT;
    const repo = process.env.GITHUB_REPO || 'ablack34/Travel-itinerary';
    const path = 'data/itinerary.json';

    if (!token) {
        context.res = { status: 500, headers: { 'Content-Type': 'application/json' }, body: { error: 'GITHUB_PAT not configured' } };
        return;
    }

    const itinerary = req.body;
    if (!itinerary || !itinerary.days || !Array.isArray(itinerary.days)) {
        context.res = { status: 400, body: { error: 'Invalid itinerary data' } };
        return;
    }

    try {
        // Get current file SHA (needed for update)
        let sha;
        const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' }
        });
        if (getRes.ok) {
            const existing = await getRes.json();
            sha = existing.sha;
        }

        // Write file
        const content = Buffer.from(JSON.stringify(itinerary, null, 2)).toString('base64');
        const body = { message: 'Update itinerary', content, ...(sha && { sha }) };
        const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!putRes.ok) {
            const err = await putRes.text();
            throw new Error(`GitHub API: ${putRes.status} ${err}`);
        }
        context.res = { headers: { 'Content-Type': 'application/json' }, body: { success: true } };
    } catch (e) {
        context.log.error('save-itinerary:', e.message);
        context.res = { status: 500, headers: { 'Content-Type': 'application/json' }, body: { error: e.message } };
    }
};
