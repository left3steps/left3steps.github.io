import { createSign } from "node:crypto";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const ENDPOINT = "https://dikjsgxlijnsvpyclbyb.supabase.co/functions/v1/harugyeol-publish";
const PUBLISHER_ID = "local-codex-publisher";
const PRIVATE_KEY_PATH = join(homedir(), ".codex", "credentials", "harugyeol-publisher-rsa.pem");

async function inputPayload() {
  if (process.argv.includes("--health")) return { mode: "health" };
  const fileIndex = process.argv.indexOf("--file");
  if (fileIndex >= 0 && process.argv[fileIndex + 1]) return JSON.parse(await readFile(process.argv[fileIndex + 1], "utf8"));
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  if (!raw.trim()) throw new Error("게시글 JSON을 표준 입력이나 --file로 전달하세요.");
  return JSON.parse(raw);
}

try {
  const rawBody = JSON.stringify(await inputPayload());
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signer = createSign("RSA-SHA256");
  signer.update(`${timestamp}.${rawBody}`);
  signer.end();
  const signature = signer.sign(await readFile(PRIVATE_KEY_PATH, "utf8")).toString("base64");
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-harugyeol-publisher-id": PUBLISHER_ID,
      "x-harugyeol-timestamp": timestamp,
      "x-harugyeol-signature": signature,
    },
    body: rawBody,
  });
  const result = await response.json().catch(() => ({ error: "응답을 해석하지 못했습니다." }));
  if (!response.ok) throw new Error(result.details ? `${result.error}: ${result.details.join(" ")}` : result.error || `HTTP ${response.status}`);
  console.log(JSON.stringify(result));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
