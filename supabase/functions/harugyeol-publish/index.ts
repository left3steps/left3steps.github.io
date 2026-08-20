import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PUBLISHER_HEADER = "x-harugyeol-publisher-id";
const TIMESTAMP_HEADER = "x-harugyeol-timestamp";
const SIGNATURE_HEADER = "x-harugyeol-signature";
const CATEGORIES = new Set(["정리", "청소", "주방", "루틴", "살림도구"]);
const ACCENTS = new Set(["sage", "clay", "sky", "butter", "plum"]);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function base64Bytes(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

function publicKeyBytes(pem: string) {
  return base64Bytes(pem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s/g, ""));
}

function adminHeaders(extra: Record<string, string> = {}) {
  return {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "content-type": "application/json",
    ...extra,
  };
}

function validatePost(value: unknown): string[] {
  const errors: string[] = [];
  if (!value || typeof value !== "object") return ["게시글 JSON 객체가 필요합니다."];
  const post = value as Record<string, unknown>;
  const title = typeof post.title === "string" ? post.title.trim() : "";
  const slug = typeof post.slug === "string" ? post.slug.trim() : "";
  const excerpt = typeof post.excerpt === "string" ? post.excerpt.trim() : "";
  const intro = typeof post.intro === "string" ? post.intro.trim() : "";
  const category = typeof post.category === "string" ? post.category : "";
  const accent = typeof post.accent === "string" ? post.accent : "";
  const reading = Number(post.reading_minutes);
  const sections = Array.isArray(post.sections) ? post.sections : [];

  if (title.length < 2 || title.length > 120) errors.push("제목은 2~120자여야 합니다.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) errors.push("slug 형식이 올바르지 않습니다.");
  if (excerpt.length < 80 || excerpt.length > 180) errors.push("요약은 80~180자여야 합니다.");
  if (intro.length < 150 || intro.length > 400) errors.push("도입문은 150~400자여야 합니다.");
  if (!CATEGORIES.has(category)) errors.push("허용되지 않은 카테고리입니다.");
  if (!ACCENTS.has(accent)) errors.push("허용되지 않은 accent입니다.");
  if (!Number.isInteger(reading) || reading < 5 || reading > 8) errors.push("읽기 시간은 5~8분이어야 합니다.");
  if (sections.length !== 4) errors.push("본문 섹션은 정확히 4개여야 합니다.");

  let validChecklist = false;
  sections.forEach((section, index) => {
    if (!section || typeof section !== "object") {
      errors.push(`${index + 1}번째 섹션 형식이 올바르지 않습니다.`);
      return;
    }
    const item = section as Record<string, unknown>;
    if (typeof item.heading !== "string" || !item.heading.trim()) errors.push(`${index + 1}번째 섹션 제목이 필요합니다.`);
    if (!Array.isArray(item.paragraphs) || item.paragraphs.length < 2 || item.paragraphs.some((paragraph) => typeof paragraph !== "string" || paragraph.trim().length < 40)) {
      errors.push(`${index + 1}번째 섹션에는 충실한 문단이 2개 이상 필요합니다.`);
    }
    if (Array.isArray(item.checklist)) {
      if (item.checklist.length >= 4 && item.checklist.length <= 6 && item.checklist.every((entry) => typeof entry === "string" && entry.trim())) validChecklist = true;
      else errors.push("체크리스트는 4~6개 항목이어야 합니다.");
    }
  });
  if (!validChecklist) errors.push("4~6개 항목의 체크리스트가 최소 한 섹션에 필요합니다.");
  return errors;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "POST 요청만 허용합니다." }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "서버 구성이 완료되지 않았습니다." }, 503);

  const publisherId = request.headers.get(PUBLISHER_HEADER) ?? "";
  const timestamp = request.headers.get(TIMESTAMP_HEADER) ?? "";
  const signature = request.headers.get(SIGNATURE_HEADER) ?? "";
  const timestampSeconds = Number(timestamp);
  if (!publisherId || !signature || !Number.isInteger(timestampSeconds) || Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds) > 300) {
    return json({ error: "인증되지 않았거나 만료된 요청입니다." }, 401);
  }
  const rawBody = await request.text();
  const publisherResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/harugyeol_automation_tokens?select=id,public_key_pem&id=eq.${encodeURIComponent(publisherId)}&active=eq.true&limit=1`,
    { headers: adminHeaders() },
  );
  const publishers = publisherResponse.ok ? await publisherResponse.json() : [];
  if (!Array.isArray(publishers) || !publishers[0]?.public_key_pem) return json({ error: "인증되지 않은 요청입니다." }, 401);
  try {
    const publicKey = await crypto.subtle.importKey(
      "spki",
      publicKeyBytes(publishers[0].public_key_pem),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      publicKey,
      base64Bytes(signature),
      new TextEncoder().encode(`${timestamp}.${rawBody}`),
    );
    if (!valid) return json({ error: "서명이 올바르지 않습니다." }, 401);
  } catch {
    return json({ error: "서명을 확인하지 못했습니다." }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return json({ error: "올바른 JSON 본문이 필요합니다." }, 400);
  }
  if (body.mode === "health") return json({ ok: true, publisher: "harugyeol" });

  const errors = validatePost(body);
  if (errors.length) return json({ error: "게시글 검증에 실패했습니다.", details: errors }, 422);

  const slug = String(body.slug).trim();
  const duplicateResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/harugyeol_posts?select=id&slug=eq.${encodeURIComponent(slug)}&limit=1`,
    { headers: adminHeaders() },
  );
  const duplicates = duplicateResponse.ok ? await duplicateResponse.json() : [];
  if (Array.isArray(duplicates) && duplicates.length) return json({ error: "이미 사용 중인 slug입니다." }, 409);

  const payload = {
    title: String(body.title).trim(),
    slug,
    excerpt: String(body.excerpt).trim(),
    category: String(body.category),
    intro: String(body.intro).trim(),
    sections: body.sections,
    status: "published",
    featured: false,
    accent: String(body.accent),
    reading_minutes: Number(body.reading_minutes),
    published_at: new Date().toISOString(),
  };
  const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/harugyeol_posts`, {
    method: "POST",
    headers: adminHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(payload),
  });
  const result = await insertResponse.json();
  if (!insertResponse.ok) return json({ error: "게시글을 저장하지 못했습니다.", details: result }, 500);

  await fetch(`${SUPABASE_URL}/rest/v1/harugyeol_automation_tokens?id=eq.${encodeURIComponent(publishers[0].id)}`, {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify({ last_used_at: new Date().toISOString() }),
  });

  return json({ ok: true, post: result[0] });
});
