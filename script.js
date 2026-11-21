const logForm = document.getElementById("log-form");
const logInput = document.getElementById("daily-log");
const logList = document.getElementById("logs-store");
const logStatus = document.getElementById("log-status");
const logCount = document.getElementById("log-count");
const saveButton = document.getElementById("save-button");
const cancelEditButton = document.getElementById("cancel-edit");
const daysCount = document.getElementById("days-count");
const generateButton = document.getElementById("generatebtn");
const generateSpinner = document.getElementById("generate-spinner");
const generateLabel = document.getElementById("generate-label");
const generatedPost = document.getElementById("generatedpost");
const copyButton = document.getElementById("copybtn");
const draftStatus = document.getElementById("draft-status");
const aiStatus = document.getElementById("ai-status");
const aiHashtagsPanel = document.getElementById("ai-hashtags-panel");
const recentHashtagsPanel = document.getElementById("recent-hashtags-panel");
const recentHashtagsList = document.getElementById("recent-hashtags");
const customHashtagsPanel = document.getElementById("custom-hashtags-panel");
const customHashtagsInput = document.getElementById("custom-hashtags");
const apiBaseUrl = typeof window.APP_API_BASE_URL === "string"
    ? window.APP_API_BASE_URL.replace(/\/+$/, "")
    : "";

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch((error) => {
            console.error("Unable to register the app service worker:", error);
        });
    });
}

let logs = [];
let editingIndex = null;
let storageReady = true;
let aiReady = false;
let isGenerating = false;
let recentHashtags = [];
const maxHashtags = 10;

function isValidHashtag(tag) {
    return typeof tag === "string" && /^#[\p{L}\p{N}_]{1,50}$/u.test(tag);
}

try {
    const savedLogs = JSON.parse(localStorage.getItem("Logs") || "[]");
    if (!Array.isArray(savedLogs) || savedLogs.some((log) =>
        typeof log?.daily_log_save !== "string" || typeof log?.log_date !== "string")) {
        throw new Error("Saved logs have an unexpected format.");
    }
    logs = savedLogs;
} catch (error) {
    storageReady = false;
    logStatus.textContent = "Could not read saved logs. Please check your browser storage before continuing.";
    console.error("Unable to load saved logs:", error);
}

try {
    const savedHashtags = JSON.parse(localStorage.getItem("RecentHashtags") || "[]");
    if (Array.isArray(savedHashtags)) {
        recentHashtags = [...new Set(savedHashtags.filter(isValidHashtag))].slice(0, maxHashtags);
    }
} catch (error) {
    console.error("Unable to load recent hashtags:", error);
}

function updateGenerateButton() {
    generateButton.disabled = logs.length === 0 || !aiReady || isGenerating;
}

function persistLogs(nextLogs) {
    try {
        localStorage.setItem("Logs", JSON.stringify(nextLogs));
        logs = nextLogs;
        return true;
    } catch (error) {
        logStatus.textContent = "Your changes could not be saved in this browser.";
        console.error("Unable to save logs:", error);
        return false;
    }
}

function makeButton(label, className, action, index) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `button button-small ${className}`;
    button.textContent = label;
    button.dataset.action = action;
    button.dataset.index = String(index);
    return button;
}

function renderLogs() {
    logList.replaceChildren();
    logCount.textContent = `${logs.length} ${logs.length === 1 ? "log" : "logs"}`;
    updateGenerateButton();
    daysCount.disabled = logs.length === 0;

    if (logs.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-state";
        emptyMessage.textContent = "No logs yet. Save your first daily update above.";
        logList.append(emptyMessage);
        updateDayOptions();
        return;
    }

    logs.forEach((log, index) => {
        const item = document.createElement("article");
        item.className = "log-item";

        const metadata = document.createElement("div");
        metadata.className = "log-meta";
        const day = document.createElement("span");
        day.textContent = `Day ${index + 1}`;
        const date = document.createElement("time");
        date.textContent = log.log_date;
        metadata.append(day, date);

        const content = document.createElement("p");
        content.className = "log-content";
        content.textContent = log.daily_log_save;

        const actions = document.createElement("div");
        actions.className = "log-actions";
        actions.append(
            makeButton("Edit", "button-quiet", "edit", index),
            makeButton("Delete", "button-danger", "delete", index)
        );
        item.append(metadata, content, actions);
        logList.append(item);
    });

    updateDayOptions();
}

function updateDayOptions() {
    const previousValue = Number(daysCount.value) || 1;
    daysCount.replaceChildren();
    for (let count = 1; count <= logs.length; count += 1) {
        const option = document.createElement("option");
        option.value = String(count);
        option.textContent = `${count} ${count === 1 ? "day" : "days"}`;
        daysCount.append(option);
    }
    daysCount.value = String(Math.min(previousValue, logs.length) || 1);
}

function renderRecentHashtags(selected = recentHashtags) {
    recentHashtagsList.replaceChildren();
    if (recentHashtags.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "field-help";
        emptyMessage.textContent = "No recently used hashtags yet. Generate a draft with your own hashtags to save them here.";
        recentHashtagsList.append(emptyMessage);
        return;
    }

    recentHashtags.forEach((tag) => {
        const label = document.createElement("label");
        label.className = "hashtag-chip";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = tag;
        checkbox.checked = selected.includes(tag);
        label.append(checkbox, document.createTextNode(tag));
        recentHashtagsList.append(label);
    });
}

function updateHashtagMode() {
    const mode = document.querySelector('input[name="hashtag-mode"]:checked')?.value;
    aiHashtagsPanel.hidden = mode !== "ai";
    recentHashtagsPanel.hidden = mode !== "recent";
    customHashtagsPanel.hidden = mode !== "custom";
}

function getHashtagSelection() {
    const mode = document.querySelector('input[name="hashtag-mode"]:checked')?.value;
    if (mode === "ai") {
        return { mode, hashtags: [] };
    }

    if (mode === "recent") {
        const hashtags = [...recentHashtagsList.querySelectorAll('input[type="checkbox"]:checked')]
            .map((checkbox) => checkbox.value);
        if (hashtags.length === 0) {
            throw new Error("Choose at least one recent hashtag or create your own.");
        }
        return {
            mode,
            hashtags
        };
    }

    if (mode !== "custom") {
        throw new Error("Choose a hashtag option.");
    }

    const entries = customHashtagsInput.value.split(/[,\s]+/).filter(Boolean);
    const tags = entries.map((entry) => entry.startsWith("#") ? entry : `#${entry}`);
    if (tags.some((tag) => !isValidHashtag(tag))) {
        throw new Error("Use hashtags with letters, numbers, or underscores only.");
    }
    const hashtags = [...new Set(tags)];
    if (hashtags.length > maxHashtags) {
        throw new Error(`Choose no more than ${maxHashtags} hashtags.`);
    }
    if (hashtags.length === 0) {
        throw new Error("Enter at least one hashtag so your post ends with your chosen tags.");
    }
    return { mode, hashtags };
}

function saveRecentHashtags(hashtags) {
    if (hashtags.length === 0) return true;
    const updatedHashtags = [...new Set([...hashtags, ...recentHashtags])].slice(0, maxHashtags);
    try {
        localStorage.setItem("RecentHashtags", JSON.stringify(updatedHashtags));
        recentHashtags = updatedHashtags;
        renderRecentHashtags(hashtags);
        return true;
    } catch (error) {
        console.error("Unable to save recently used hashtags:", error);
        return false;
    }
}

function resetEditor() {
    editingIndex = null;
    logInput.value = "";
    saveButton.textContent = "Save log";
    cancelEditButton.hidden = true;
    document.getElementById("editor-label").textContent = "What did you work on today?";
}

logForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!storageReady) {
        logStatus.textContent = "Saving is disabled because your saved logs could not be read.";
        return;
    }

    const text = logInput.value.trim();
    if (!text) {
        logStatus.textContent = "Add a few words to your log before saving.";
        logInput.focus();
        return;
    }

    const updatedLogs = [...logs];
    const isEditing = editingIndex !== null;
    if (!isEditing) {
        updatedLogs.push({ daily_log_save: text, log_date: new Date().toLocaleDateString() });
    } else {
        updatedLogs[editingIndex] = { ...updatedLogs[editingIndex], daily_log_save: text };
    }

    if (persistLogs(updatedLogs)) {
        renderLogs();
        resetEditor();
        logStatus.textContent = isEditing ? "Log updated." : "Log saved.";
    }
});

cancelEditButton.addEventListener("click", () => {
    resetEditor();
    logStatus.textContent = "Edit cancelled.";
});

logList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button || !storageReady) return;

    const index = Number(button.dataset.index);
    if (!Number.isInteger(index) || !logs[index]) return;

    if (button.dataset.action === "edit") {
        editingIndex = index;
        logInput.value = logs[index].daily_log_save;
        saveButton.textContent = "Update log";
        cancelEditButton.hidden = false;
        document.getElementById("editor-label").textContent = `Editing day ${index + 1}`;
        logStatus.textContent = "Update your log, then save your changes.";
        logInput.focus();
    } else if (button.dataset.action === "delete") {
        const updatedLogs = logs.filter((_, logIndex) => logIndex !== index);
        if (persistLogs(updatedLogs)) {
            if (editingIndex === index) resetEditor();
            else if (editingIndex !== null && editingIndex > index) editingIndex -= 1;
            renderLogs();
            logStatus.textContent = "Log deleted.";
        }
    }
});

document.querySelectorAll('input[name="hashtag-mode"]').forEach((input) => {
    input.addEventListener("change", updateHashtagMode);
});

renderRecentHashtags();
updateHashtagMode();

generateButton.addEventListener("click", async () => {
    const count = Number(daysCount.value);
    if (!Number.isInteger(count) || count < 1 || count > logs.length) {
        draftStatus.textContent = "Save at least one log to create a draft.";
        return;
    }

    let hashtagSelection;
    try {
        hashtagSelection = getHashtagSelection();
    } catch (error) {
        draftStatus.textContent = error.message;
        return;
    }

    const selectedLogs = logs.slice(-count);
    isGenerating = true;
    updateGenerateButton();
    generateButton.setAttribute("aria-busy", "true");
    generateSpinner.hidden = false;
    generateLabel.textContent = "Generating...";
    generateButton.disabled = true;
    draftStatus.textContent = "Sending your selected logs to OpenAI...";

    try {
        const response = await fetch(`${apiBaseUrl}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                logs: selectedLogs.map((log) => ({
                    date: log.log_date,
                    text: log.daily_log_save
                })),
                hashtagMode: hashtagSelection.mode,
                hashtags: hashtagSelection.hashtags
            })
        });
        const result = await response.json();
        if (!response.ok) {
            if (result.code === "invalid_api_key") {
                aiReady = false;
                aiStatus.textContent = result.error;
                aiStatus.dataset.state = "error";
            }
            throw new Error(result.error || "The AI service could not create a draft.");
        }
        if (typeof result.draft !== "string" || !result.draft.trim()) {
            throw new Error("The AI returned an empty draft. Please try again.");
        }

        generatedPost.value = result.draft.trim();
        copyButton.disabled = false;
        const tagsSaved = saveRecentHashtags(Array.isArray(result.hashtags) ? result.hashtags : []);
        const dayLabel = count === 1 ? "log" : "logs";
        draftStatus.textContent = tagsSaved
            ? `AI draft created from your ${count} most recent ${dayLabel}. Review it before sharing.`
            : "Draft created, but recently used hashtags could not be saved in this browser.";
    } catch (error) {
        draftStatus.textContent = error instanceof Error
            ? error.message
            : "Could not generate the draft. Please try again.";
        console.error("Unable to generate AI draft:", error);
    } finally {
        isGenerating = false;
        generateSpinner.hidden = true;
        generateLabel.textContent = "Generate with AI";
        generateButton.removeAttribute("aria-busy");
        updateGenerateButton();
    }
});

generatedPost.addEventListener("input", () => {
    copyButton.disabled = generatedPost.value.trim().length === 0;
});

copyButton.addEventListener("click", async () => {
    if (!generatedPost.value.trim()) return;
    try {
        await navigator.clipboard.writeText(generatedPost.value);
        draftStatus.textContent = "Draft copied to your clipboard.";
    } catch (error) {
        draftStatus.textContent = "Clipboard access failed. Select the draft and copy it manually.";
        console.error("Unable to copy draft:", error);
    }
});

renderLogs();
saveButton.disabled = !storageReady;

async function checkAiServer() {
    try {
        const response = await fetch(`${apiBaseUrl}/api/status`);
        const result = await response.json();
        if (!response.ok || typeof result.configured !== "boolean") {
            throw new Error("The AI server returned an unexpected status.");
        }

        aiReady = result.configured;
        if (aiReady) {
            aiStatus.textContent = `AI server available (${result.model}). The API key will be validated when you generate.`;
            aiStatus.dataset.state = "ready";
        } else {
            aiStatus.textContent = apiBaseUrl
                ? "AI generation is not configured for this service. Please contact its owner."
                : "OpenAI API key not configured. Add it to .env and restart the app.";
            aiStatus.dataset.state = "error";
        }
    } catch (error) {
        aiStatus.textContent = "AI server unavailable. Run npm start, then open http://127.0.0.1:3000.";
        aiStatus.dataset.state = "error";
        console.error("Unable to check AI server status:", error);
    }
    updateGenerateButton();
}

checkAiServer();
