const puppeteer = require("puppeteer-core");

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 2 });

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

  await page.evaluateOnNewDocument((mdContent, userLiteral) => {
    const messages = [
      { id: "seed-user-1", role: "user", content: userLiteral, createdAt: Date.now() },
      { id: "seed-asst-1", role: "assistant", content: mdContent, createdAt: Date.now() + 1 },
    ];
    localStorage.setItem(
      "trend-iq-chat",
      JSON.stringify({ state: { messages, selectedModelId: "mimo-v2.5-pro" }, version: 0 })
    );
  }, MD, USER_LITERAL);

  await page.goto("http://localhost:1420/#/chat", { waitUntil: "networkidle2", timeout: 30000 });
  await page.waitForSelector(".markdown-body h1", { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: "/tmp/markdown_render.png" });
  console.log("SHOT_OK");
  await browser.close();
})().catch((e) => {
  console.error("SCRIPT_ERROR", e);
  process.exit(1);
});
