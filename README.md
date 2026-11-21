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

## Deploy publicly

The included [render.yaml](./render.yaml) deploys the Node server on Render and keeps the OpenAI key as a server environment variable.

1. Rotate the existing OpenAI API key at https://platform.openai.com/api-keys before sharing or committing a project.
2. Push this repository to GitHub.
3. In Render, create a **New Blueprint** and select the repository.
4. Set `OPENAI_API_KEY` to the newly rotated key. Do not put it in `render.yaml`, source code, or repository secrets.
5. Deploy and open the generated `*.on.render.com` URL.
6. The server limits generation to 20 drafts per IP address per hour.

The app is installable through supported browsers with HTTPS. Chrome or Edge may show **Install app** when the manifest and service worker requirements are met.
