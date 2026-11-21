# Daily Log to LinkedIn Draft

A lightweight browser app that turns your daily work notes into an editable LinkedIn post draft. It helps you capture what you worked on, learned, or built, then shape recent progress into a post you can review and share.

## Live demo

[Open the app](https://pixeltopower.github.io/Daily-Log-to-Linkedin-post-creater/)

## What it does

- Keeps daily logs in your browser so you can build a history of your progress.
- Creates first-person LinkedIn drafts from selected recent logs.
- Adjusts draft length based on the selected timeframe.
- Suggests relevant hashtags, or lets you choose recent hashtags or provide your own.
- Lets you edit and copy the generated draft.

Your logs are stored in your browser. Selected logs are sent to OpenAI only when generating a draft. The app does not publish to LinkedIn automatically.

Hosted generation keeps API credentials on the server and uses Cloudflare Turnstile verification and request rate limits.
