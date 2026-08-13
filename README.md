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
- 공개 목록과 기존 10개 글은 Supabase의 발행 상태를 브라우저에서 동기화합니다.
- 새 글은 `/article/?slug=...` 주소로 열립니다.
- 브라우저에는 공개용 publishable key만 포함하며, 쓰기는 RLS와 `app_metadata.harugyeol_role = admin`으로 제한합니다.

애드센스 등록 후 발급받은 사이트 확인 메타 태그와 `ads.txt` 값은 승인 요청 전에 추가합니다.
