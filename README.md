# Daily Log to LinkedIn Draft

A browser app for saving daily work notes and using OpenAI to turn a chosen number of recent logs into an editable LinkedIn post draft.

## Run locally

Requirements: Node.js 20.6 or newer and an OpenAI API key with API access enabled. API usage may incur charges on your OpenAI account.

1. Copy `.env.example` to `.env`.
2. Replace the placeholder `OPENAI_API_KEY` value in `.env` with your key. Never commit or share this file.
3. In the project folder, run:

   ```sh
   npm start
   ```

4. Open `http://127.0.0.1:3000` in your browser.

The server binds to localhost and sends generation requests to OpenAI's Responses API. The default model is `gpt-6.1-terra`; set `OPENAI_MODEL` in `.env` to a different model available to your API account.

## Use it

Save a log for each day, select how many of your most recent logs to include, and choose **Generate with AI**. The app creates an engaging first-person LinkedIn post of 100–240 words excluding hashtags, scales the length to the selected timeframe, and appends three relevant AI-suggested hashtags. Edit the result if needed, then copy it to share.

AI-relevant hashtags are the default. You can instead choose **Use recent hashtags** to select tags saved from earlier drafts, or **Create your own** to send only the hashtags you enter. At least one tag is required in either manual mode; selected tags are appended to the end. Custom hashtags are saved to your recent list after a successful draft.

Logs are stored in the browser's local storage. They are sent to OpenAI only when you choose to generate a draft. Avoid including confidential or sensitive information. Drafts are not posted to LinkedIn automatically.

## Features

- Add, edit, and delete daily logs
- Choose the number of recent logs to include
- Suggest relevant hashtags from the selected logs, select previously used tags, or provide your own
- Scale generated posts from 100–130 words for one day to 190–240 words for four or more days, excluding hashtags
- Generate, edit, and copy an AI-written draft
- Responsive layout for desktop and mobile
- Installable PWA shell with offline app assets

## Deploy for free with GitHub Pages and Cloudflare Workers

GitHub Pages hosts the installable website; a Cloudflare Worker privately handles OpenAI requests. The OpenAI key is stored only as a Cloudflare Worker secret, never in the website or GitHub.

The repository's GitHub Pages Actions publishing source is already enabled. The site URL is <https://pixeltopower.github.io/Daily-Log-to-Linkedin-post-creater/>.

1. Rotate the existing OpenAI API key at https://platform.openai.com/api-keys before deploying. API calls are billed separately from ChatGPT subscriptions.
2. Create a free Cloudflare account, then deploy the Worker from this repository:

   ```sh
   npx wrangler login
   npx wrangler deploy
   npx wrangler secret put OPENAI_API_KEY
   ```

   Copy the `workers.dev` URL printed by deploy. Paste the new API key when prompted; keep it private. The Worker only accepts browser requests from this repository's GitHub Pages origin and rate-limits generation.
3. In the GitHub repository, open **Settings → Secrets and variables → Actions → Variables**, add `API_BASE_URL`, and set it to the Worker URL.
4. Open the **Actions** tab, select **Deploy GitHub Pages**, and click **Run workflow**. The workflow is skipped until `API_BASE_URL` is configured.
5. Open <https://pixeltopower.github.io/Daily-Log-to-Linkedin-post-creater/> and use your browser's install option to add the PWA.

The Pages workflow publishes only the front-end files. The app can be installed from its HTTPS URL using a supported browser. Daily logs stay in the user's browser; selected logs are sent to the Worker and OpenAI only when generating a post. Avoid entering sensitive information.

Cloudflare's basic rate-limit binding allows 10 requests per minute per IP, approximately per Cloudflare location; it is an abuse deterrent, not a strict global quota. Hosting may be available on free tiers, but OpenAI API usage can still incur charges.
