# FacePrep Browser Automation

A Playwright-based browser automation project built to practice reliable interaction with a dynamic coding-practice web interface.

## What it demonstrates

- Connecting Playwright to an existing Chromium session through CDP
- Detecting the target page dynamically
- Navigating module and section interfaces
- Handling different test states such as Start, Retry, Resume, and Continue
- Discovering question tabs dynamically instead of hard-coding question counts
- Structuring browser automation into reusable functions
- Using environment variables for runtime configuration

## Tech Stack

- JavaScript
- Node.js
- Playwright

## Requirements

- Node.js
- Chromium/Chrome with remote debugging enabled
- Access to the relevant coding-practice environment

## Installation

Install the project dependencies with:

```bash
npm install
```

## Configuration

The default browser debugging endpoint is:

```text
http://localhost:9222
```

It can be overridden using the `CDP_ENDPOINT` environment variable.

The default module is:

```text
T37x
```

Multiple modules can be supplied as a comma-separated list using the `MODULES` environment variable.

## Run

Open the required browser session and target practice page, then run:

```bash
npm start
```

The script detects the target page, navigates through the configured sections, and reports the question tabs it discovers.

## Project Structure

```text
faceprep-browser-automation/
├── faceprep-automation.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## Engineering Notes

The automation uses Playwright locators such as `getByRole()` and `getByText()` where practical.

Dynamic discovery is used for browser pages, module sections, test states, and question counts rather than relying entirely on fixed positions.

Runtime-specific configuration is handled through environment variables instead of being embedded directly into the project configuration.

## Author

Mohammed Uzair
