# Cliff Notes Downloader 📄⬇️

A powerful, lightweight Google Chrome extension that automatically unblurs premium documents on CliffsNotes, bypasses paywall banners, and compiles the document into a high-quality PDF or ZIP file of images.

## Features ✨
*   **Auto-Scroll Engine:** Bypasses lazy-loading by mimicking human scrolling to capture every single page.
*   **Active DOM Cleanup:** Instantly strips "Why is this page out of focus?" popups and CSS blurs in real-time.
*   **Multiple Export Formats:** Choose between a single compressed `.pdf` or a `.zip` archive containing individual page images.
*   **100% Local Processing:** No external servers, no tracking. Everything happens directly in your browser using local JavaScript libraries.

## Installation 🛠️
Since this extension interacts directly with paywalled content, it is not available on the Chrome Web Store. You must install it manually in Developer Mode:

1. Download or clone this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Toggle on **Developer mode** in the top right corner.
4. Click **Load unpacked** in the top left.
5. Select the folder containing this extension's files.
6. Pin the extension to your toolbar!

## Usage 🚀
1. Navigate to any CliffsNotes document page (e.g., `https://www.cliffsnotes.com/study-notes/...`).
2. Click the **Cliff Notes Downloader** icon in your extension bar.
3. Select your preferred output format (PDF or ZIP).
4. Click **Clean & Download**.
5. Hands off the mouse! Watch as the extension automatically scrolls the page, cleans the UI, and downloads your file.

## Technologies Used 💻
*   Vanilla JavaScript (ES6+)
*   Chrome Extensions API (Manifest V3)
*   [html2canvas](https://html2canvas.hertzen.com/) - For rendering DOM elements to images.
*   [jsPDF](https://parall.ax/products/jspdf) - For compiling images into PDF format.
*   [JSZip](https://stuk.github.io/jszip/) - For bundling images into a ZIP archive.