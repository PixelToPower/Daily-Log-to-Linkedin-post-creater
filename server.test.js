const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createServer } = require("./server");

function makeWords(count) {
    return Array.from({ length: count }, (_, index) => `detail${index + 1}`).join(" ");
}

async function withServer(options, run) {
    const server = createServer(options);
    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
    });

    try {
        const address = server.address();
        await run(`http://127.0.0.1:${address.port}`);
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        });
    }
}

test("generates a draft with the configured model without returning the API key", async () => {
    let requestOptions;
    const body = makeWords(126);
    await withServer({
        apiKey: "test-secret",
        model: "test-model",
        fetchImpl: async (url, options) => {
            assert.equal(url, "https://api.openai.com/v1/responses");
            requestOptions = options;
            return {
                ok: true,
                json: async () => ({
                    output_text: "",
                    output: [{
                        type: "message",
                        content: [{ type: "output_text", text: `${body} #unwanted` }]
                    }]
                })
            };
        }
    }, async (baseUrl) => {
        const response = await fetch(`${baseUrl}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                logs: [{ date: "11/19/2026", text: "Finished the project UI." }],
                hashtagMode: "custom",
                hashtags: ["#BuildInPublic"]
            })
        });
        assert.equal(response.status, 200);
        const result = await response.json();
        assert.deepEqual(result, {
            draft: `${body}\n\n#BuildInPublic`,
            hashtags: ["#BuildInPublic"],
            wordCount: 126
        });
    });

    const openAiRequest = JSON.parse(requestOptions.body);
    assert.equal(requestOptions.headers.Authorization, "Bearer test-secret");
    assert.equal(openAiRequest.model, "test-model");
    assert.equal(openAiRequest.store, false);
    assert.equal(openAiRequest.reasoning.effort, "none");
    assert.equal(openAiRequest.max_output_tokens, 1200);
    assert.match(openAiRequest.input[1].content, /Finished the project UI/);
    assert.match(openAiRequest.input[0].content, /first-person voice/);
    assert.match(openAiRequest.input[0].content, /Never start with/);
    assert.match(openAiRequest.input[0].content, /why it matters/);
    assert.match(openAiRequest.input[0].content, /100–130 words/);
    assert.match(openAiRequest.input[0].content, /Never invent/);
    assert.match(openAiRequest.input[0].content, /6–8 relevant emojis/);
    assert.match(openAiRequest.input[0].content, /2–3 in the opening/);
    assert.match(openAiRequest.input[0].content, /Place emojis separately/);
    assert.match(openAiRequest.input[1].content, /Create the complete post/);
    assert.match(openAiRequest.input[1].content, /append exactly these hashtags/);
    assert.doesNotMatch(JSON.stringify({ draft: "A grounded LinkedIn draft.\n\n#BuildInPublic" }), /test-secret/);
});

test("suggests three hashtags from the logs and creates a complete thematic post", async () => {
    const body = `${makeWords(150)} #JavaScript #WebDevelopment #BuildInPublic`;
    await withServer({
        apiKey: "test-secret",
        fetchImpl: async () => ({
            ok: true,
            json: async () => ({ output_text: body })
        })
    }, async (baseUrl) => {
        const response = await fetch(`${baseUrl}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                logs: [
                    { date: "11/18/2026", text: "Added a JavaScript feature." },
                    { date: "11/19/2026", text: "Improved the web app." },
                    { date: "11/20/2026", text: "Prepared a progress recap." }
                ],
                hashtagMode: "ai",
                hashtags: []
            })
        });
        assert.equal(response.status, 200);
        const result = await response.json();
        assert.equal(result.draft.split("\n")[0], makeWords(150));
        assert.equal(result.draft.split("\n").at(-1), "#JavaScript #WebDevelopment #BuildInPublic");
        assert.deepEqual(result.hashtags, ["#JavaScript", "#WebDevelopment", "#BuildInPublic"]);
        assert.ok(result.wordCount >= 140 && result.wordCount <= 180);
    });
});

test("revises a draft once when its complete word count is outside the limit", async () => {
    const responses = ["Too short.", makeWords(126)];
    let requestCount = 0;
    await withServer({
        apiKey: "test-secret",
        fetchImpl: async () => ({
            ok: true,
            json: async () => ({ output_text: responses[requestCount++] })
        })
    }, async (baseUrl) => {
        const response = await fetch(`${baseUrl}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                logs: [{ date: "11/20/2026", text: "Added a feature to the app." }],
                hashtagMode: "custom",
                hashtags: ["#BuildInPublic"]
            })
        });
        assert.equal(response.status, 200);
        const result = await response.json();
        assert.equal(requestCount, 2);
        assert.ok(result.wordCount >= 100 && result.wordCount <= 130);
    });
});

test("explains an incomplete OpenAI response instead of reporting an empty draft", async () => {
    await withServer({
        apiKey: "test-secret",
        fetchImpl: async () => ({
            ok: true,
            json: async () => ({
                status: "incomplete",
                incomplete_details: { reason: "max_output_tokens" },
                output: []
            })
        })
    }, async (baseUrl) => {
        const response = await fetch(`${baseUrl}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                logs: [{ date: "11/20/2026", text: "Added a feature to the app." }],
                hashtagMode: "custom",
                hashtags: ["#BuildInPublic"]
            })
        });
        assert.equal(response.status, 502);
        assert.match((await response.json()).error, /response limit before completing/);
    });
});

test("rejects empty logs without calling OpenAI", async () => {
    let calledOpenAi = false;
    await withServer({
        apiKey: "test-secret",
        fetchImpl: async () => {
            calledOpenAi = true;
            throw new Error("OpenAI should not be called for invalid logs.");
        }
    }, async (baseUrl) => {
        const response = await fetch(`${baseUrl}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ logs: [], hashtagMode: "recent", hashtags: [] })
        });
        assert.equal(response.status, 400);
        assert.match((await response.json()).error, /at least one saved log/);
    });
    assert.equal(calledOpenAi, false);
});

test("reports missing OpenAI configuration without making an API request", async () => {
    let calledOpenAi = false;
    await withServer({
        apiKey: "",
        fetchImpl: async () => {
            calledOpenAi = true;
            throw new Error("OpenAI should not be called without a key.");
        }
    }, async (baseUrl) => {
        const response = await fetch(`${baseUrl}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                logs: [{ date: "today", text: "Worked on a feature." }],
                hashtagMode: "custom",
                hashtags: ["#BuildInPublic"]
            })
        });
        assert.equal(response.status, 503);
        assert.match((await response.json()).error, /Add your API key to \.env/);
    });
    assert.equal(calledOpenAi, false);
});

test("requires a hashtag so a successful draft includes selected tags", async () => {
    let calledOpenAi = false;
    await withServer({
        apiKey: "test-secret",
        fetchImpl: async () => {
            calledOpenAi = true;
            throw new Error("OpenAI should not be called without selected hashtags.");
        }
    }, async (baseUrl) => {
        const response = await fetch(`${baseUrl}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                logs: [{ date: "today", text: "Worked on a feature." }],
                hashtagMode: "custom",
                hashtags: []
            })
        });
        assert.equal(response.status, 400);
        assert.match((await response.json()).error, /at least one hashtag/);
    });
    assert.equal(calledOpenAi, false);
});

test("reports whether an OpenAI key is configured without returning it", async () => {
    await withServer({ apiKey: "test-secret", model: "test-model" }, async (baseUrl) => {
        const response = await fetch(`${baseUrl}/api/status`);
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { configured: true, model: "test-model" });
    });
});

test("explains an OpenAI authentication failure without exposing the key", async () => {
    await withServer({
        apiKey: "test-secret",
        fetchImpl: async () => ({ ok: false, status: 401 })
    }, async (baseUrl) => {
        const response = await fetch(`${baseUrl}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                logs: [{ date: "today", text: "Worked on a feature." }],
                hashtagMode: "custom",
                hashtags: ["#BuildInPublic"]
            })
        });
        assert.equal(response.status, 502);
        const payload = await response.json();
        assert.equal(payload.code, "invalid_api_key");
        assert.match(payload.error, /OpenAI rejected the API key \(401\)/);
        assert.doesNotMatch(JSON.stringify(payload), /test-secret/);
    });
});

test("limits each public IP to twenty successful generation slots per hour", async () => {
    await withServer({
        apiKey: "test-secret",
        fetchImpl: async () => ({
            ok: true,
            json: async () => ({ output_text: makeWords(126) })
        })
    }, async (baseUrl) => {
        for (let count = 1; count <= 21; count += 1) {
            const response = await fetch(`${baseUrl}/api/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Forwarded-For": "203.0.113.10"
                },
                body: JSON.stringify({
                    logs: [{ date: "today", text: "Worked on a feature." }],
                    hashtagMode: "custom",
                    hashtags: ["#BuildInPublic"]
                })
            });
            if (count <= 20) {
                assert.equal(response.status, 200);
            } else {
                assert.equal(response.status, 429);
                assert.match((await response.json()).error, /hourly draft limit/);
            }
        }
    });
});

test("rejects malformed hashtags without calling OpenAI", async () => {
    let calledOpenAi = false;
    await withServer({
        apiKey: "test-secret",
        fetchImpl: async () => {
            calledOpenAi = true;
            throw new Error("OpenAI should not be called for invalid hashtags.");
        }
    }, async (baseUrl) => {
        const response = await fetch(`${baseUrl}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                logs: [{ date: "today", text: "Worked on a feature." }],
                hashtagMode: "custom",
                hashtags: ["#bad-tag"]
            })
        });
        assert.equal(response.status, 400);
        assert.match((await response.json()).error, /letters, numbers, and underscores/);
    });
    assert.equal(calledOpenAi, false);
});
