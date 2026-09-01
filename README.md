# 하루결 GitHub Pages

`https://left3steps.github.io`에 게시되는 하루결의 정적 공개 사이트입니다.

## 생성과 검증

```bash
npm run build
npm test
```

완성된 공개 파일은 `docs/`에 생성됩니다. GitHub Pages는 `main` 브랜치의 `/docs` 폴더를 게시 소스로 사용합니다.

## 편집 스튜디오

- 관리자 주소: `https://left3steps.github.io/admin/`
- 게시글 저장소: Supabase의 `public.harugyeol_posts`
- 공개 글은 빌드할 때 Supabase의 발행 상태를 읽어 각각 `/articles/{slug}/` 정적 페이지로 생성합니다.
- 제목, 본문, canonical, Article 구조화 데이터와 사이트맵이 같은 빌드에서 동기화됩니다.
- GitHub Actions가 매시간 새 공개 글을 정적 페이지로 반영합니다.
- 브라우저에는 공개용 publishable key만 포함하며, 쓰기는 RLS와 `app_metadata.harugyeol_role = admin`으로 제한합니다.

Google AdSense 게시자 `pub-1146138210876381`의 사이트 확인 메타 태그, 로더 스크립트, `ads.txt`를 포함합니다.

## 무인 발행 경로

- `harugyeol-publish` Edge Function이 자동화 전용 요청만 검증해 게시글을 발행합니다.
- 발행 개인키는 로컬 자격증명 폴더에만 저장하고, Supabase에는 공개키만 보관합니다.
- 함수가 제목·slug·카테고리·본문 4개 섹션·체크리스트·읽기 시간을 검증하고 `published` 상태를 강제합니다.
- 로컬 호출은 `node scripts/publish-post.mjs --file .automation/pending-post.json`을 사용합니다.
