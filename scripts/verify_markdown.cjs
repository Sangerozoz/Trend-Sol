const puppeteer = require("puppeteer-core");

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(String(e)));

  const MD = `# 风险概览

这是 **加粗** 与 *斜体* 以及 \`行内代码\` 的示例。

## 重点标的

| 标的 | 现价 | 涨跌幅 |
| --- | --- | --- |
| 贵州茅台 | 1680.00 | +1.2% |
| 宁德时代 | 210.50 | -0.8% |

### 操作建议
1. 控制仓位
2. 关注半导体国产替代

- 红利资产防御
- 规避高位题材

> 市场有风险，投资需谨慎。

[东方财富](https://quote.eastmoney.com)

\`\`\`python
print("hello world")
\`\`\`
`;
  const USER_LITERAL = "# 这是用户输入的markdown字面文本，不应被渲染";

  // 在应用脚本执行前注入持久化消息（zustand persist 会据此 rehydrate）
  await page.evaluateOnNewDocument((mdContent, userLiteral) => {
    const messages = [
      {
        id: "seed-user-1",
        role: "user",
        content: userLiteral,
        createdAt: Date.now(),
      },
      {
        id: "seed-asst-1",
        role: "assistant",
        content: mdContent,
        createdAt: Date.now() + 1,
      },
    ];
    localStorage.setItem(
      "trend-iq-chat",
      JSON.stringify({ state: { messages, selectedModelId: "mimo-v2.5-pro" }, version: 0 })
    );
    window.__USER_LITERAL = userLiteral;
  }, MD, USER_LITERAL);

  await page.goto("http://localhost:1420/#/chat", {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await page.waitForSelector(".markdown-body h1", { timeout: 10000 });

  const result = await page.evaluate(() => {
    const userLiteral = window.__USER_LITERAL;
    const m = document.querySelector(".markdown-body");
    const userBubble = [...document.querySelectorAll("div")].find(
      (d) => d.textContent && d.textContent.includes(userLiteral)
    );
    const link = document.querySelector(".markdown-body a");
    return {
      hasH1: !!document.querySelector(".markdown-body h1"),
      h1Text: document.querySelector(".markdown-body h1")?.textContent,
      hasH2: !!document.querySelector(".markdown-body h2"),
      hasH3: !!document.querySelector(".markdown-body h3"),
      hasTable: !!document.querySelector(".markdown-body table"),
      tableHeaders: [
        ...document.querySelectorAll(".markdown-body thead th"),
      ].map((t) => t.textContent),
      tableRows: document.querySelectorAll(".markdown-body tbody tr").length,
      hasUl: !!document.querySelector(".markdown-body ul"),
      hasOl: !!document.querySelector(".markdown-body ol"),
      hasBlockquote: !!document.querySelector(".markdown-body blockquote"),
      hasCodeBlock: !!document.querySelector(".markdown-body pre code"),
      hasInlineCode: !!document.querySelector(".markdown-body p code"),
      hasStrong: !!document.querySelector(".markdown-body strong"),
      hasEm: !!document.querySelector(".markdown-body em"),
      hasLink: !!link,
      linkTarget: link ? link.getAttribute("target") : null,
      linkRel: link ? link.getAttribute("rel") : null,
      rawHashInBody: m ? m.textContent.includes("# 风险概览") : null,
      userShowsRawHash: userBubble
        ? userBubble.textContent.includes(userLiteral)
        : null,
    };
  });

  console.log(JSON.stringify({ result, pageErrors }, null, 2));
  await browser.close();
})().catch((e) => {
  console.error("SCRIPT_ERROR", e);
  process.exit(1);
});
