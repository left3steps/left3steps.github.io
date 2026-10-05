import { access, readFile, readdir } from "node:fs/promises";
import { seedPosts } from "./data/posts.mjs";
import assert from "node:assert/strict";
import { TAX_CATEGORY, taxReviewMarkup, validateTaxReview } from "./assets/tax-review.mjs";

const articleDirectories = (await readdir(new URL("docs/articles/", import.meta.url), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const required = [
  "docs/index.html",
  "docs/articles/index.html",
  "docs/tax/index.html",
  "docs/living/index.html",
  "docs/categories/tax/index.html",
  "docs/assets/tax-review.mjs",
  "docs/start/index.html",
  "docs/tools/weekly-reset-planner/index.html",
  "docs/contact/index.html",
  "docs/categories/organizing/index.html",
  "docs/categories/cleaning/index.html",
  "docs/categories/kitchen/index.html",
  "docs/categories/routines/index.html",
  "docs/categories/home-tools/index.html",
  "docs/article/index.html",
  "docs/admin/index.html",
  "docs/about/index.html",
  "docs/editorial-policy/index.html",
  "docs/privacy/index.html",
  "docs/terms/index.html",
  "docs/robots.txt",
  "docs/ads.txt",
  "docs/google24b793f83e74c099.html",
  "docs/sitemap.xml",
  ...articleDirectories.map((slug) => `docs/articles/${slug}/index.html`),
];

await Promise.all(required.map((path) => access(new URL(path, import.meta.url))));
const home = await readFile(new URL("docs/index.html", import.meta.url), "utf8");
const list = await readFile(new URL("docs/articles/index.html", import.meta.url), "utf8");
const admin = await readFile(new URL("docs/admin/index.html", import.meta.url), "utf8");
const client = await readFile(new URL("docs/assets/site.js", import.meta.url), "utf8");
const ads = await readFile(new URL("docs/ads.txt", import.meta.url), "utf8");
const searchVerification = await readFile(new URL("docs/google24b793f83e74c099.html", import.meta.url), "utf8");
const schema = await readFile(new URL("supabase/schema.sql", import.meta.url), "utf8");
const publisher = await readFile(new URL("supabase/functions/harugyeol-publish/index.ts", import.meta.url), "utf8");
const publisherClient = await readFile(new URL("scripts/publish-post.mjs", import.meta.url), "utf8");
const sitemap = await readFile(new URL("docs/sitemap.xml", import.meta.url), "utf8");
const start = await readFile(new URL("docs/start/index.html", import.meta.url), "utf8");
const planner = await readFile(new URL("docs/tools/weekly-reset-planner/index.html", import.meta.url), "utf8");
const about = await readFile(new URL("docs/about/index.html", import.meta.url), "utf8");
const tax = await readFile(new URL("docs/tax/index.html", import.meta.url), "utf8");
const living = await readFile(new URL("docs/living/index.html", import.meta.url), "utf8");
const articles = await Promise.all(articleDirectories.map((slug) => readFile(new URL(`docs/articles/${slug}/index.html`, import.meta.url), "utf8")));

if (!home.includes("생활 속 세금") || !home.includes("근거부터 차근차근")) throw new Error("Tax home content is incomplete");
if (articleDirectories.length < seedPosts.length) throw new Error("Published article snapshot is incomplete");
if ((list.match(/data-article-card/g) || []).length !== articleDirectories.length) throw new Error("Article list and static pages must contain the same posts");
if (!home.includes('rel="canonical" href="https://left3steps.github.io/"')) throw new Error("Canonical URL is incorrect");
if (!admin.includes("편집자 로그인") || !admin.includes('name="password"')) throw new Error("Admin page is incomplete");
if (!admin.includes("처음 접속 또는 비밀번호 설정") || !admin.includes("관리자 비밀번호 설정")) throw new Error("Admin recovery flow is incomplete");
if (!client.includes("harugyeol_posts") || !client.includes("sb_publishable_")) throw new Error("Supabase client is not configured");
if (!client.includes("먼저 실행할 세 가지") || !client.includes("오늘의 다음 행동")) throw new Error("Live article enhancement markup is incomplete");
if (/service_role|sb_secret_/.test(client)) throw new Error("A secret Supabase key must not be shipped to the browser");
if (!home.includes('google-adsense-account') || !home.includes('ca-pub-1146138210876381')) throw new Error("AdSense verification is missing");
if (!home.includes("필요한 세금 주제부터 찾기") || !home.includes("생활 아카이브")) throw new Error("Tax and archive discovery paths are incomplete");
if (!["연말정산", "소비·증빙", "주거세금", "신고기초"].every((topic) => tax.includes(topic))) throw new Error("Tax pillars are incomplete");
if (!list.includes("주제별 빠른 찾기") || !list.includes("생활 아카이브")) throw new Error("Article library shortcuts are incomplete");
if (!start.includes("귀속") || !start.includes("공식") || !start.includes("개인 맞춤")) throw new Error("Tax reading criteria are incomplete");
if (!living.includes("기존 생활 글과 URL을 보존합니다")) throw new Error("Living archive is incomplete");
if (!admin.includes('name="tax_review"') || !admin.includes("생활세금")) throw new Error("Tax editor metadata fields are incomplete");
if (!planner.includes("data-planner-form") || !client.includes("setupPlanner")) throw new Error("Interactive planner is incomplete");
if (!about.includes("left3steps") || !about.includes("nature@left3steps.com")) throw new Error("Publisher identity and contact are incomplete");
if (!ads.includes('pub-1146138210876381')) throw new Error("ads.txt is incomplete");
if (!searchVerification.includes("google-site-verification")) throw new Error("Search Console verification is incomplete");
if (articles.some((page) => page.includes('<meta name="robots" content="noindex">'))) throw new Error("Published articles must be indexable");
if (articles.some((page) => !page.includes('type="application/ld+json"') || !page.includes("pagead2.googlesyndication.com"))) throw new Error("Published article metadata is incomplete");
if (articles.some((page) => !page.includes("먼저 실행할 세 가지") || !page.includes("오늘의 다음 행동") || !page.includes('"BreadcrumbList"'))) throw new Error("Article engagement paths are incomplete");
if (articleDirectories.some((slug) => !sitemap.includes(`https://left3steps.github.io/articles/${slug}/`))) throw new Error("Sitemap is missing a published article");
if (!["tax", "organizing", "cleaning", "kitchen", "routines", "home-tools"].every((slug) => sitemap.includes(`https://left3steps.github.io/categories/${slug}/`))) throw new Error("Sitemap is missing a category guide");
if (!["tax", "living"].every((slug) => sitemap.includes(`https://left3steps.github.io/${slug}/`))) throw new Error("Sitemap is missing a pivot landing page");
if (!schema.includes("harugyeol_automation_tokens") || !schema.includes("enable row level security")) throw new Error("Automation token schema is incomplete");
if (!publisher.includes("x-harugyeol-signature") || !publisher.includes('status: "published"')) throw new Error("Automated publisher is incomplete");
if (/sb_secret_|service_role/i.test(publisherClient)) throw new Error("Publisher client must not contain a Supabase secret key");
if (!publisher.includes("validateTaxReview(taxReviewFor(post))") || !client.includes("validateTaxReview(review)")) throw new Error("Tax publication must validate review metadata");
if (!schema.includes("'생활세금'")) throw new Error("Database category schema is incomplete");

const review = { topic: "연말정산", tax_year: "특정 연도 수치를 다루지 않는 기본 구조", checked_at: "2026-10-05", scope: "대한민국 일반 근로소득 연말정산의 계산 구조만 설명합니다.", sources: [{ title: "국세청 공식 안내", url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7870&mi=6434" }], cautions: ["개인별 요건은 해당 연도 안내에서 확인합니다.", "공제액이 개인의 환급액과 같다는 의미는 아닙니다."] };
assert.deepEqual(validateTaxReview(review, "2026-10-05"), []);
for (const invalid of [null, { ...review, topic: "투자" }, { ...review, checked_at: "2026-02-30" }, { ...review, checked_at: "2026-10-06" }, { ...review, sources: [{ title: "비공식 안내", url: "https://nts.go.kr.evil.example/" }] }, { ...review, sources: [{ title: "위험한 주소", url: "javascript:alert(1)" }] }, { ...review, sources: [{ title: "인증정보 포함", url: "https://user:password@www.nts.go.kr/" }] }, { ...review, cautions: [] }]) {
  assert.ok(validateTaxReview(invalid, "2026-10-05").length, "Invalid review metadata must be rejected");
}
const escaped = taxReviewMarkup({ category: TAX_CATEGORY, sections: [{ review: { ...review, sources: [{ ...review.sources[0], title: '<img src=x onerror="alert(1)">' }] } }] });
assert.ok(escaped.includes("&lt;img") && !escaped.includes("<img"));
assert.equal(taxReviewMarkup({ category: "정리", sections: [] }), "");
assert.ok(taxReviewMarkup({ category: TAX_CATEGORY, sections: [] }).includes("자료 확인이 필요합니다"));
const modules = await Promise.all(["assets/tax-review.mjs", "docs/assets/tax-review.mjs", "supabase/functions/harugyeol-publish/tax-review.mjs"].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
assert.equal(modules[0], modules[1], "Static browser validation must match the generator");
assert.equal(modules[0], modules[2], "Publisher validation must match the editor");
const taxArticles = articles.filter((page) => page.includes('class="tax-verification"'));
if (!taxArticles.length || taxArticles.some((page) => !page.includes("자료 확인일") || !page.includes("개인별 세무·법률 자문이 아닙니다"))) throw new Error("Published tax article source metadata is incomplete");

console.log(`Verified ${required.length} required files, ${articleDirectories.length} posts and tax metadata guardrails`);
