import { access, readFile } from "node:fs/promises";
import { seedPosts } from "./data/posts.mjs";

const required = [
  "docs/index.html",
  "docs/articles/index.html",
  "docs/article/index.html",
  "docs/admin/index.html",
  "docs/about/index.html",
  "docs/editorial-policy/index.html",
  "docs/privacy/index.html",
  "docs/terms/index.html",
  "docs/robots.txt",
  "docs/ads.txt",
  "docs/sitemap.xml",
  ...seedPosts.map((post) => `docs/articles/${post.slug}/index.html`),
];

await Promise.all(required.map((path) => access(new URL(path, import.meta.url))));
const home = await readFile(new URL("docs/index.html", import.meta.url), "utf8");
const list = await readFile(new URL("docs/articles/index.html", import.meta.url), "utf8");
const admin = await readFile(new URL("docs/admin/index.html", import.meta.url), "utf8");
const client = await readFile(new URL("docs/assets/site.js", import.meta.url), "utf8");
const ads = await readFile(new URL("docs/ads.txt", import.meta.url), "utf8");

if (!home.includes("완벽한 집보다") || !home.includes("하루결")) throw new Error("Home content is incomplete");
if ((list.match(/data-article-card/g) || []).length !== 10) throw new Error("Article list must contain 10 posts");
if (!home.includes('rel="canonical" href="https://left3steps.github.io/"')) throw new Error("Canonical URL is incorrect");
if (!admin.includes("편집자 로그인") || !admin.includes('name="password"')) throw new Error("Admin page is incomplete");
if (!client.includes("harugyeol_posts") || !client.includes("sb_publishable_")) throw new Error("Supabase client is not configured");
if (/service_role|sb_secret_/.test(client)) throw new Error("A secret Supabase key must not be shipped to the browser");
if (!home.includes('google-adsense-account') || !home.includes('ca-pub-1146138210876381')) throw new Error("AdSense verification is missing");
if (!ads.includes('pub-1146138210876381')) throw new Error("ads.txt is incomplete");

console.log(`Verified ${required.length} required files and ${seedPosts.length} posts`);
