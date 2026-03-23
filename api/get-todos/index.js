module.exports = async function (context, req) {
    const token = process.env.GITHUB_PAT;
    const repo = process.env.GITHUB_REPO || 'ablack34/Travel-itinerary';
    const path = 'data/todos.json';

    if (!token) {
        context.res = { status: 500, headers: { 'Content-Type': 'application/json' }, body: { error: 'GITHUB_PAT not configured' } };
        return;
    }

    try {
        const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3.raw' }
        });
        if (res.status === 404) {
            context.res = { headers: { 'Content-Type': 'application/json' }, body: [] };
            return;
        }
        if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
        const todos = await res.json();
        context.res = { headers: { 'Content-Type': 'application/json' }, body: todos };
    } catch (e) {
        context.log.error('get-todos:', e.message);
        context.res = { status: 500, headers: { 'Content-Type': 'application/json' }, body: { error: e.message } };
    }
};
