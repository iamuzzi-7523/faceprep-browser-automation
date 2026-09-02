const { chromium } = require("playwright");

const config = {
  cdpEndpoint: process.env.CDP_ENDPOINT || "http://localhost:9222",

  targetModules: (process.env.MODULES || "T37x")
    .split(",")
    .map((module) => module.trim())
    .filter(Boolean),

  sections: ["Inclass Questions", "Postclass Questions"],
};

async function connectToTarget() {
  const browser = await chromium.connectOverCDP(config.cdpEndpoint);
  const context = browser.contexts()[0];

  if (!context) {
    throw new Error("No browser context was found.");
  }

  const faceprepPage = context.pages().find((page) =>
    page.url().includes("faceprep.online")
  );

  if (!faceprepPage) {
    throw new Error(
      "Could not find a FacePrep page. Open FacePrep in the connected browser first."
    );
  }

  return {
    browser,
    faceprepPage,
  };
}

async function openModuleSection(page, moduleName, sectionName) {
  const module = page
    .locator(".ant-collapse-item")
    .filter({ hasText: moduleName });

  const header = module.locator(".ant-collapse-header");

  if ((await header.count()) === 0) {
    throw new Error(`Module not found: ${moduleName}`);
  }

  if ((await header.getAttribute("aria-expanded")) !== "true") {
    await header.click();
  }

  await module.getByText(sectionName, { exact: true }).click();

  await page.waitForTimeout(1500);
}

async function inspectQuestions(page, moduleName, sectionName) {
  const testButton = page
    .getByRole("button", {
      name: /(Start Test|Retry Test|Resume Test|Continue)/i,
    })
    .first();

  if ((await testButton.count()) === 0) {
    console.log(
      `No test action found for ${moduleName} -> ${sectionName}.`
    );

    return;
  }

  await testButton.click();

  await page.waitForTimeout(3000);

  let questionNumber = 1;
  let discoveredQuestions = 0;

  while (true) {
    const questionTab = page.getByText(
      `Q${questionNumber}`,
      { exact: true }
    );

    if ((await questionTab.count()) === 0) {
      break;
    }

    discoveredQuestions++;

    console.log(
      `Discovered ${moduleName} -> ${sectionName} -> Q${questionNumber}`
    );

    await questionTab.click();

    await page.waitForTimeout(1000);

    questionNumber++;
  }

  console.log(
    `Section inspection complete: ${discoveredQuestions} question(s) discovered.`
  );

  const backButton = page.getByText(
    "Back To Practice",
    { exact: true }
  );

  if ((await backButton.count()) > 0) {
    await backButton.click();

    await page.waitForTimeout(2000);
  }
}

async function main() {
  const { browser, faceprepPage } = await connectToTarget();

  console.log(
    "Connected to FacePrep:",
    await faceprepPage.url()
  );

  console.log(
    "Modules:",
    config.targetModules.join(", ")
  );

  await faceprepPage.bringToFront();

  try {
    for (const moduleName of config.targetModules) {
      for (const sectionName of config.sections) {
        console.log(
          `\n>>> ${moduleName} -> ${sectionName}`
        );

        try {
          await openModuleSection(
            faceprepPage,
            moduleName,
            sectionName
          );

          await inspectQuestions(
            faceprepPage,
            moduleName,
            sectionName
          );
        } catch (error) {
          console.error(
            `Workflow failed for ${moduleName} -> ${sectionName}:`,
            error.message
          );
        }
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("Automation failed:", error);

  process.exitCode = 1;
});
