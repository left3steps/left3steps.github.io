import { access, readFile } from "node:fs/promises";
import { seedPosts } from "./data/posts.mjs";

const required = [
  "docs/index.html",
  "docs/articles/index.html",
  "docs/about/index.html",
  "docs/editorial-policy/index.html",
  "docs/privacy/index.html",
  "docs/terms/index.html",
  "docs/robots.txt",
  "docs/sitemap.xml",
  ...seedPosts.map((post) => `docs/articles/${post.slug}/index.html`),
];

await Promise.all(required.map((path) => access(new URL(path, import.meta.url))));
const home = await readFile(new URL("docs/index.html", import.meta.url), "utf8");
const list = await readFile(new URL("docs/articles/index.html", import.meta.url), "utf8");

if (!home.includes("완벽한 집보다") || !home.includes("하루결")) throw new Error("Home content is incomplete");
if ((list.match(/data-article-card/g) || []).length !== 10) throw new Error("Article list must contain 10 posts");
if (!home.includes('rel="canonical" href="https://left3steps.github.io/"')) throw new Error("Canonical URL is incorrect");

console.log(`Verified ${required.length} required files and ${seedPosts.length} posts`);
