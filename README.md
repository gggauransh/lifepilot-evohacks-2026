# LifePilot — EvoHacks 2026

School tasks arrive through too many sources. LifePilot uses **local pretrained neural OCR** to read screenshots, then turns reviewed text into editable tasks and a daily plan that fits your available time.

## Run the complete project locally

The hosted app remains owner-private. Judges can test this project locally without an API key.

1. Download this repository with **Code → Download ZIP**, and extract it (or clone it).
2. Install Node.js 22.13+ and pnpm 11.
3. In the extracted repository folder, run:

```sh
node restore-source.mjs
pnpm install --frozen-lockfile
node restore-source.mjs --assets
pnpm dev
```

Open **http://localhost:5173**. Choose **Add something → A screenshot → Read file on my device**. Review the recognized text, find actions from it, review task details, and save. Then choose **My day** and a time budget.

The three source parts are a compressed archive of **135 original source/configuration/documentation/brand/example files**, exported from the completed Sites source commit **0eed615127c8150632408b4cd6fd4997a4f69640**. The restoration script writes them into this folder. Large generated OCR assets are recreated from installed Tesseract.js/PDF.js packages; the English model is downloaded from the official tessdata_fast repository. This packaging avoids a separate account connection and preserves the complete runnable project.

Readable snapshots of the main application and scanning/planning code are provided under **code/** for quick review. After restoration, the original app/, lib/, build/, scripts/, public/ and other source directories are present normally.

## What uses AI?

Tesseract's existing English LSTM model reads printed text in screenshots and scanned PDF pages. I did not train this model. Request/date extraction and daily planning use rules, with review before saving. No OpenAI key is configured or needed for the demo. The optional OpenAI endpoint is not part of the verified demo.

## Verified

Real screenshot OCR read all three fictional school tasks and deadlines; actions were reviewed and saved; the daily plan respected its budget; checklist/completion worked; calendar export and JSON backup/restore passed. OCR confidence is not a guarantee. English printed text works best; blur, handwriting and mixed scanned/selectable PDF content may need correction.

Input limits: 5 MB files, 12-megapixel images, 5-page PDFs, 20,000 characters. Data stays in the browser. Original uploads are not stored by the local scanner. Calendar files require import, and replies remain editable templates. No cloud sync or background notifications are provided.

## Build timing and credits

The original task began October 10 at 20:12 Dubai, after the announced 20:00 kickoff; first application commit: **3c6f58ba460180394a830854b3da75b7d176a918**, timestamped 20:42:35 +04:00. OCR was added October 11. The original source history remains in the Sites repository; this public repository is a source distribution, and its publication timestamps do not represent the start of development.

Built with ChatGPT/Codex assistance, React, TypeScript, the supplied Sites/Vinext/Cloudflare starter, Tesseract.js/Tesseract core, tessdata_fast, PDF.js, Lucide, Zod and Google Fonts. The owner supplied the LifePilot logo. Restored files include third-party notices and licenses. No claim is made that framework scaffolding or pretrained models are original work.
