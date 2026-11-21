const assert = require("node:assert/strict");
const { test } = require("node:test");

const ORIGIN = "https://pixeltopower.github.io";
let worker;

test.before(async () => {
    ({ default: worker } = await import("./worker/index.mjs"));
});

function makeRequest(path, { method = "GET", body, origin = ORIGIN } = {}) {
    return new Request(`https://test-worker.example${path}`, {
        method,
        headers: {
            Origin: origin,
            ...(body === undefined ? {} : { "Content-Type": "application/json" })
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
}

function makeEnv({ apiKey = "test-secret", limiter = { success: true } } = {}) {
    return {
        APP_ORIGIN: ORIGIN,
        OPENAI_API_KEY: apiKey,
        OPENAI_MODEL: "test-model",
        GENERATION_LIMITER: { limit: async () => limiter }
    };
}

test("returns configured status with CORS only for the Pages origin", async () => {
    const response = await worker.fetch(makeRequest("/api/status"), makeEnv());
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), ORIGIN);
    assert.deepEqual(await response.json(), { configured: true, model: "test-model" });

    const denied = await worker.fetch(
        makeRequest("/api/status", { origin: "https://attacker.example" }),
        makeEnv()
    );
    assert.equal(denied.status, 403);
});

test("answers browser preflight requests", async () => {
    const response = await worker.fetch(makeRequest("/api/generate", { method: "OPTIONS" }), makeEnv());
    assert.equal(response.status, 204);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), ORIGIN);
    assert.match(response.headers.get("Access-Control-Allow-Methods"), /POST/);
});

test("rejects empty logs before calling OpenAI", async () => {
    const response = await worker.fetch(
        makeRequest("/api/generate", {
            method: "POST",
            body: { logs: [], hashtagMode: "ai", hashtags: [] }
        }),
        makeEnv()
    );
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /at least one saved log/);
});

test("rate limits generation requests", async () => {
    const response = await worker.fetch(
        makeRequest("/api/generate", {
            method: "POST",
            body: {
                logs: [{ date: "today", text: "Worked on a feature." }],
                hashtagMode: "custom",
                hashtags: ["#BuildInPublic"]
            }
        }),
        makeEnv({ limiter: { success: false } })
    );
    assert.equal(response.status, 429);
});

test("generates a draft while keeping the API key server-side", async () => {
    const originalFetch = globalThis.fetch;
    let requestOptions;
    globalThis.fetch = async (url, options) => {
        assert.equal(url, "https://api.openai.com/v1/responses");
        requestOptions = options;
        const words = Array.from({ length: 110 }, (_, index) => `detail${index + 1}`).join(" ");
        return new Response(JSON.stringify({ output_text: words }), { status: 200 });
    };
    try {
        const response = await worker.fetch(
            makeRequest("/api/generate", {
                method: "POST",
                body: {
                    logs: [{ date: "today", text: "Worked on a feature." }],
                    hashtagMode: "custom",
                    hashtags: ["#BuildInPublic"]
                }
            }),
            makeEnv()
        );
        assert.equal(response.status, 200);
        const result = await response.json();
        assert.equal(result.wordCount, 110);
        assert.equal(result.hashtags[0], "#BuildInPublic");
        assert.match(requestOptions.headers.Authorization, /^Bearer test-secret$/);
        assert.doesNotMatch(JSON.stringify(result), /test-secret/);
    } finally {
        globalThis.fetch = originalFetch;
    }
});
