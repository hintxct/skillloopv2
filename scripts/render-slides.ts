import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

async function main() {
  const folder = resolve(process.cwd(), "presentation");
  const output = resolve(folder, "png");
  await mkdir(output, { recursive: true });
  const channel =
    process.env.PLAYWRIGHT_CHANNEL ||
    (process.platform === "win32" &&
    existsSync("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe")
      ? "chrome"
      : undefined);
  const browser = await chromium.launch({ headless: true, channel });
  try {
    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    });
    const external: string[] = [];
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("requestfailed", (request) =>
      errors.push(`Resource failed: ${request.url()}`),
    );
    page.on("request", (request) => {
      if (/^https?:/.test(request.url())) external.push(request.url());
    });
    await page.goto(pathToFileURL(resolve(folder, "index.html")).href);
    await page.evaluate(() => document.fonts.ready);
    assert(
      await page.evaluate(
        () =>
          document.fonts.check("800 74px Manrope") &&
          document.fonts.check("400 42px DM"),
      ),
      "Bundled fonts must load",
    );
    const slides = page.locator(".slide");
    assert.equal(await slides.count(), 8);
    const files: {
      name: string;
      width: number;
      height: number;
      sha256: string;
    }[] = [];
    const thumbnails: string[] = [];
    for (const slide of await slides.all()) {
      const name = await slide.getAttribute("data-name");
      assert(name && /^[0-9]{2}-[a-z-]+$/.test(name));
      const issues = await slide.evaluate((element) => {
        const outer = element.getBoundingClientRect();
        const footer = element.querySelector("footer")!.getBoundingClientRect();
        return [
          ...element.querySelectorAll(
            "h1,h2,h3,p,li,article,.visual,.callout,.technical-notes,svg,header,footer",
          ),
        ].flatMap((node) => {
          const r = node.getBoundingClientRect();
          const isFooter = node.tagName === "FOOTER";
          const clipped =
            node instanceof HTMLElement &&
            node.tagName !== "HEADER" &&
            (node.scrollWidth > node.clientWidth + 1 ||
              node.scrollHeight > node.clientHeight + 1);
          return r.left < outer.left ||
            r.right > outer.right ||
            r.top < outer.top ||
            r.bottom > outer.bottom ||
            (!isFooter && r.bottom > footer.top) ||
            clipped
            ? [
                `${node.tagName}: ${node.textContent?.trim().slice(0, 90)} (y=${r.top - outer.top}, bottom=${r.bottom - outer.top}, footer=${footer.top - outer.top}, scroll=${node.scrollWidth}x${node.scrollHeight}, client=${node.clientWidth}x${node.clientHeight})`,
              ]
            : [];
        });
      });
      const bytes = await slide.screenshot({
        path: resolve(output, `${name}.png`),
        animations: "disabled",
      });
      assert.deepEqual(issues, [], `Content must fit ${name}`);
      assert.equal(bytes.readUInt32BE(16), 1920);
      assert.equal(bytes.readUInt32BE(20), 1080);
      files.push({
        name: `${name}.png`,
        width: 1920,
        height: 1080,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      });
      thumbnails.push(
        `<figure><img src="data:image/png;base64,${bytes.toString("base64")}" alt="${name}" /><figcaption>${name.replaceAll("-", " ")}</figcaption></figure>`,
      );
      console.log(`Rendered ${resolve(output, `${name}.png`)}`);
    }
    assert.deepEqual(
      external,
      [],
      "Slides must render without external resources",
    );
    await page.pdf({
      path: resolve(folder, "SkillLoop-slides.pdf"),
      width: "1920px",
      height: "1080px",
      printBackground: true,
      preferCSSPageSize: true,
    });
    const pdf = await readFile(resolve(folder, "SkillLoop-slides.pdf"));
    assert.equal(
      (pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) ?? []).length,
      8,
      "PDF must have exactly eight pages",
    );
    assert.deepEqual(errors, [], "No render or resource errors");
    await page.setViewportSize({ width: 1600, height: 790 });
    await page.setContent(
      `<!doctype html><html><head><title>SkillLoop slide overview</title><style>body{margin:0;padding:32px;background:#dedbe6;font-family:Arial,sans-serif;color:#302740}h1{margin:0 0 24px;font-size:30px}main{display:grid;grid-template-columns:repeat(3,1fr);gap:26px}figure{margin:0}img{display:block;width:100%;height:auto;border-radius:8px}figcaption{font-size:18px;margin-top:8px}p{font-size:23px;line-height:1.5;padding:22px}</style></head><body><h1>SkillLoop · Eight presentation slides · 1920 × 1080</h1><main>${thumbnails.join("")}<p>Eight readable slides.<br />Implemented features + badges & leaderboard.<br />PNG images + presentation PDF.</p></main></body></html>`,
    );
    await page
      .locator("img")
      .evaluateAll((images) =>
        Promise.all(
          images.map((image) => (image as HTMLImageElement).decode()),
        ),
      );
    await page.screenshot({
      path: resolve(folder, "overview.jpg"),
      type: "jpeg",
      quality: 90,
      fullPage: true,
    });
    const sources = await Promise.all(
      ["index.html", "slides.css"].map(async (name) => ({
        name,
        sha256: createHash("sha256")
          .update(await readFile(resolve(folder, name)))
          .digest("hex"),
      })),
    );
    await writeFile(
      resolve(folder, "manifest.json"),
      JSON.stringify(
        {
          size: "1920x1080",
          slides: files,
          sources,
          validation:
            "8 slides; bundled fonts; no external requests; no clipped text boxes; PNG dimensions checked",
        },
        null,
        2,
      ) + "\n",
    );
    console.log(
      "Validated eight slides; exported PDF, overview.jpg and manifest.json.",
    );
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
