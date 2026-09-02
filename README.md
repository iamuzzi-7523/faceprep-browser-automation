# FacePrep Browser Automation

A Playwright-based browser automation project for navigating and inspecting coding-practice workflows through a connected Chromium browser session.

## Overview

This project explores browser automation using Playwright and demonstrates how a script can interact with a dynamic web application instead of relying on fixed page positions or manual navigation.

The automation connects to an existing Chromium session through the Chrome DevTools Protocol (CDP), identifies the relevant FacePrep page, navigates through practice modules, handles different test states, and dynamically discovers available question tabs.

## Features

- Connects to an existing Chromium session using CDP
- Dynamically identifies the target FacePrep page
- Navigates module and question sections
- Handles different test states:
  - Start Test
  - Retry Test
  - Resume Test
  - Continue
- Dynamically discovers available question tabs
- Uses reusable functions to organize the automation workflow
- Supports configuration through environment variables
- Provides clear console output during execution

## Tech Stack

- JavaScript
- Node.js
- Playwright

## Requirements

Before running the project, make sure you have:

- Node.js installed
- Chromium or Google Chrome available
- A Chromium/Chrome session running with remote debugging enabled
- Access to the relevant coding-practice environment

## Installation

Clone the repository:

`git clone https://github.com/iamuzzi-7523/faceprep-browser-automation.git`

Enter the project directory:

`cd faceprep-browser-automation`

Install the required dependencies:

`npm install`

## Configuration

The automation connects to Chromium through the Chrome DevTools Protocol.

Default endpoint:

`http://127.0.0.1:9222`

The endpoint can be changed using the `CDP_ENDPOINT` environment variable.

Default module:

`T37`

Multiple modules can be supplied using the `MODULES` environment variable.

Example:

`MODULES=T37,T38`

## Running the Automation

1. Start Chromium or Chrome with remote debugging enabled.
2. Open the required FacePrep practice page.
3. Make sure the browser session is accessible through the configured CDP endpoint.
4. Run `npm start`.

The script will:

1. Connect to the existing browser session.
2. Locate the FacePrep page.
3. Navigate through the configured modules.
4. Open the selected practice sections.
5. Detect the available test state.
6. Discover question tabs dynamically.
7. Report the discovered questions in the console.

## Project Structure

- `faceprep-automation.js` — Main browser automation script
- `package.json` — Project configuration and dependencies
- `package-lock.json` — Locked dependency versions
- `.gitignore` — Files excluded from version control
- `README.md` — Project documentation

## Engineering Approach

The project focuses on making browser automation more maintainable and less dependent on fixed page positions.

### Dynamic Page Detection

Instead of assuming a particular browser tab or page index, the automation searches for a page associated with the target environment.

### Reusable Workflow Functions

The automation is separated into functions for:

- Connecting to the browser
- Opening module sections
- Inspecting questions
- Running the overall workflow

This keeps the main execution flow easier to understand and modify.

### Playwright Locators

The project uses Playwright locators such as `getByRole()` and `getByText()` where practical.

These locators allow the automation to interact with elements based on their roles and visible text rather than relying exclusively on fragile positional selectors.

### Dynamic Question Discovery

The automation does not assume a fixed number of questions.

Instead, it checks for available question tabs and continues discovering them until no additional question is found.

## Configuration Through Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `CDP_ENDPOINT` | `http://localhost:9222` | Chromium remote debugging endpoint |
| `MODULES` | `T37x` | Comma-separated list of modules to process |

## Learning Goals

This project was built as part of my learning journey in:

- Browser automation
- Playwright
- JavaScript
- Node.js
- Web application interaction
- Dynamic element handling
- Automation workflow design
- Git and GitHub

## Disclaimer

This repository is intended as a learning and portfolio project demonstrating browser automation concepts.

The public version focuses on browser navigation and workflow inspection rather than automating the generation or submission of answers to coding assessments.

## Author

**Mohammed Uzair**

GitHub: [@iamuzzi-7523](https://github.com/iamuzzi-7523)
