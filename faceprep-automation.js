const { chromium } = require("playwright");

// ==========================================
// REUSABLE LANGUAGE ENFORCEMENT
// ==========================================
async function ensureJava(page) {
  const currentLanguage = await page
    .locator(".ant-select-selection-item")
    .innerText();

  console.log("Current language checked:", currentLanguage);

  if (!currentLanguage.includes("Java")) {
    console.log("Switching to Java...");
    await page.locator(".ant-select-selection-item").click();
    await page.getByText("Java (OpenJDK 13.0.1)", { exact: true }).click();

    try {
      await page.getByRole("button", { name: "OK" }).click({ timeout: 3000 });
    } catch {}

    await page.waitForTimeout(2000);
  } else {
    console.log("Already Java. Continuing...");
  }
}

// ==========================================
// CORE QUESTION SOLVING FUNCTION (WITH REPAIR)
// ==========================================
async function solveCurrentQuestion(faceprepPage, chatgptPage) {
  await ensureJava(faceprepPage);

  const questionText = await faceprepPage.locator("body").innerText();
  console.log("\n========== EXTRACTING QUESTION ==========\n");

  let solved = false;
  let attempts = 0;
  const maxAttempts = 5;

  let currentCode = "";
  let lastResultText = "";

  while (!solved && attempts < maxAttempts) {
    attempts++;
    console.log(`\n--- Attempt ${attempts} of ${maxAttempts} ---`);

    // 1. Build the correct prompt (Initial vs. Repair)
    let prompt = "";
    if (attempts === 1) {
      prompt = `
You are solving a FacePrep coding challenge.

Return ONLY compilable Java 13 code with indentation.

Rules:
1. Class name must be Main
2. Read input from stdin
3. Output exactly as specified from word to word 
4. No markdown
5. No comments
6. No explanations

Question:

${questionText}
`;
    } else {
      console.log("Building Repair Prompt...");
      prompt = `
The previous Java solution failed.

QUESTION:
${questionText}

CURRENT CODE:
${currentCode}

FACEPREP RESULT (Includes compiler errors or failed test case details):
${lastResultText}

Return ONLY corrected Java 13 code with indentation.
No explanation.
No markdown.
No comments.
`;
    }

    // 2. Send Prompt to ChatGPT
    await chatgptPage.bringToFront();
    const input = chatgptPage.locator("#prompt-textarea");
    await input.click();
    await input.fill(prompt);
    await chatgptPage.keyboard.press("Enter");
    console.log("Prompt sent to ChatGPT.");

    // 3. Wait for ChatGPT to finish writing
    console.log("Waiting for ChatGPT to finish writing...");
    await chatgptPage.waitForFunction(
      () => document.querySelector('[data-testid="stop-button"]') === null,
      { timeout: 120000 },
    );
    await chatgptPage.waitForTimeout(3000);

    // 4. Extract Generated Code
    currentCode = await chatgptPage.evaluate(() => {
      const messages = document.querySelectorAll(
        '[data-message-author-role="assistant"]',
      );
      const last = messages[messages.length - 1];
      return last ? last.innerText : "";
    });

    console.log("CODE LENGTH =", currentCode.length);
    if (!currentCode || currentCode.length < 20) {
      throw new Error("Failed to extract code from ChatGPT");
    }

    // 5. Insert Code into FacePrep Editor (Bulletproof Clear)
    await faceprepPage.bringToFront();
    const editor = faceprepPage.locator(".cm-content");

    console.log("Focusing editor to clear old code...");
    await editor.click();
    await faceprepPage.waitForTimeout(500);

    // Fire both Windows and Mac select-all
    await faceprepPage.keyboard.press("Control+A");
    await faceprepPage.keyboard.press("Meta+A");
    await faceprepPage.waitForTimeout(300);

    // Clear selection
    await faceprepPage.keyboard.press("Backspace");
    await faceprepPage.keyboard.press("Delete");
    await faceprepPage.waitForTimeout(500);

    console.log("Pasting new generated code instantly...");
    await faceprepPage.keyboard.insertText(currentCode);
    await faceprepPage.waitForTimeout(2000);

    // 6. Run Sample Cases
    console.log("Running Sample Cases...");
    await faceprepPage.getByText("Run Sample Cases", { exact: true }).click();
    await faceprepPage.waitForTimeout(10000);

    lastResultText = await faceprepPage.locator("body").innerText();
    const samplePassed = lastResultText.includes("Test Cases Passed: 2 / 2");

    // 7. Verify Sample Cases
    if (samplePassed) {
      console.log("Sample Passed = true. Running All Cases...");
      await faceprepPage.getByText("Run All Cases", { exact: true }).click();
      await faceprepPage.waitForTimeout(15000);

      // 8. Verify Hidden Cases
      lastResultText = await faceprepPage.locator("body").innerText();
      const allPassed = lastResultText.includes("Test Cases Passed: 10 / 10");

      if (allPassed) {
        console.log("All Passed = true! Question Solved.");
        solved = true;
        break; // Exits the while loop successfully
      } else {
        console.log(
          "Warning: Hidden test cases failed. Looping back for repair.",
        );
      }
    } else {
      console.log("Sample cases failed. Looping back for repair.");
    }
  }

  if (!solved) {
    console.log(
      `\n❌ Failed to solve question after ${maxAttempts} attempts. Moving to next to prevent getting stuck.`,
    );
  }
}

// ==========================================
// MASTER NAVIGATION LOOP (DYNAMIC TABS)
// ==========================================
(async () => {
  const browser = await chromium.connectOverCDP("http://localhost:9222");
  const context = browser.contexts()[0];
  const pages = context.pages();

  let chatgptPage = null;
  let faceprepPage = null;

  // Dynamically assign pages based on their URL
  for (const page of pages) {
    const url = page.url();
    if (url.includes("chatgpt.com")) chatgptPage = page;
    if (url.includes("faceprep.online")) faceprepPage = page;
  }

  // Safety check
  if (!chatgptPage || !faceprepPage) {
    throw new Error(
      "Could not find both ChatGPT and FacePrep tabs. Please ensure both are open.",
    );
  }

  console.log("ChatGPT Target:", await chatgptPage.url());
  console.log("FacePrep Target:", await faceprepPage.url());

  await faceprepPage.bringToFront();

  // ---------------------------------------------------------
  // THE MASTER QUEUE
  // ---------------------------------------------------------
  const targetModules = ["T37x"]; // Update with your next targets
  const sections = ["Inclass Questions", "Postclass Questions"];

  for (const moduleName of targetModules) {
    console.log(`\n======================================================`);
    console.log(`🚀 STARTING MODULE: ${moduleName}`);
    console.log(`======================================================\n`);

    for (const sectionName of sections) {
      console.log(`\n>>> Entering: ${moduleName} -> ${sectionName} <<<`);

      // 1. Locate the Module Accordion
      const modLocator = faceprepPage
        .locator(".ant-collapse-item")
        .filter({ hasText: moduleName });
      const header = modLocator.locator(".ant-collapse-header");

      // Check if it's already open. If not, click it.
      const isExpanded = await header.getAttribute("aria-expanded");
      if (isExpanded !== "true") {
        console.log(`Expanding ${moduleName} accordion...`);
        await header.click();
        await faceprepPage.waitForTimeout(1000);
      }

      // 2. Click "Inclass" or "Postclass"
      await modLocator.getByText(sectionName, { exact: true }).click();
      await faceprepPage.waitForTimeout(2000);

      // 3. Find and click the Test button (Handles Start, Retry, or Resume)
      console.log("Looking for Test button...");
      const testButton = faceprepPage
        .getByRole("button", {
          name: /(Start Test|Retry Test|Resume Test|Continue)/i,
        })
        .first();

      // If the section doesn't exist or is already fully completed, skip it
      if ((await testButton.count()) === 0) {
        console.log(`No test button found for ${sectionName}. Skipping...`);
        continue;
      }

      await testButton.click();

      // Give the actual coding environment time to load
      await faceprepPage.waitForTimeout(5000);

      // 4. Solve Questions Dynamically
      let q = 1;
      while (true) {
        const qTab = faceprepPage.getByText(`Q${q}`, { exact: true });

        // Check if the tab for Q{q} exists on the screen
        if ((await qTab.count()) > 0) {
          console.log(`\n-----------------------------------`);
          console.log(`SOLVING: ${moduleName} -> ${sectionName} -> Q${q}`);
          console.log(`-----------------------------------`);

          await qTab.click();
          await faceprepPage.waitForTimeout(3000);

          await solveCurrentQuestion(faceprepPage, chatgptPage);
          q++; // Increment to check for the next question
        } else {
          // If Q tab doesn't exist, we've solved all questions in this section
          console.log(
            `\nNo more questions found. Section complete at ${q - 1} questions.`,
          );
          break;
        }
      }

      // 5. Return to the dashboard for the next section
      console.log(`\nFinished ${sectionName}. Navigating back to Practice...`);
      await faceprepPage.getByText("Back To Practice", { exact: true }).click();

      // Wait for the dashboard to render completely before looping
      await faceprepPage.waitForTimeout(5000);
    }
  }

  console.log("\n✅ ALL SCHEDULED MODULES COMPLETED SUCCESSFULLY!");
  await faceprepPage.waitForTimeout(600000);
})();
