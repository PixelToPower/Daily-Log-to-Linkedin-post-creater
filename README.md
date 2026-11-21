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

## Run it on another computer

The app needs Node.js and a personal OpenAI API key to generate drafts on a local computer.

### 1. Install Node.js

Install Node.js 20.6 or newer from https://nodejs.org/

Check the installed version:

```sh
node --version
```

### 2. Clone the project

```sh
git clone https://github.com/PixelToPower/Daily-Log-to-Linkedin-post-creater.git
cd Daily-Log-to-Linkedin-post-creater
```

### 3. Create an OpenAI API key

1. Sign in to https://platform.openai.com/
2. Open https://platform.openai.com/api-keys
3. Create a new secret key
4. Copy it for the next step

Keep the key private. Do not share it, commit it, or add it to the website. API usage can be billed to the OpenAI account that created the key.

### 4. Configure the local environment

Create a local environment file from the example.

macOS or Linux:

```sh
cp .env.example .env
```

Windows Command Prompt:

```cmd
copy .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Open `.env` and replace the placeholder:

```env
OPENAI_API_KEY=your-personal-openai-api-key
OPENAI_MODEL=gpt-6-luna
```

### 5. Start the app

```sh
npm start
```

Open http://127.0.0.1:3000 in a browser.

To stop the server, return to the terminal and press `Ctrl+C`.

## Using the app

1. Enter what you worked on in the daily log field.
2. Save the log.
3. Choose how many recent logs should be included.
4. Choose AI-suggested, recent, or custom hashtags.
5. Select **Generate with AI**.
6. Review and edit the generated draft.
7. Select **Copy draft** and paste it into LinkedIn.

The app does not post anything to LinkedIn automatically.

## Privacy and data storage

- Logs are saved in the browser's local storage on the computer being used.
- Logs remain in that browser until they are edited, deleted, or the browser storage is cleared.
- Logs are not automatically shared across computers or browsers.
- Selected logs are sent to OpenAI only when **Generate with AI** is selected.
- Avoid entering passwords, API keys, personal secrets, confidential work details, or private student or customer information.
- The app does not encrypt browser local storage; anyone with access to that browser profile may be able to view saved logs.
