# GitHub Actions 자동 배포 설정 가이드

## 📚 GitHub Actions란?

GitHub Actions는 GitHub에서 제공하는 CI/CD(Continuous Integration/Continuous Deployment) 플랫폼입니다. 코드가 푸시될 때마다 자동으로 빌드, 테스트, 배포를 수행할 수 있습니다.

**공식 문서**: [https://docs.github.com/en/actions](https://docs.github.com/en/actions)

---

## 🎯 목표

이 가이드를 완료하면:
- ✅ Obsidian 플러그인으로 파일을 푸시하면 자동으로 Quartz 빌드
- ✅ 빌드된 파일을 자동으로 GitHub Pages에 배포
- ✅ 블로그가 자동으로 업데이트됨

---

## 🚀 1단계: GitHub Pages 활성화

### 1. Repository 설정

1. GitHub에서 블로그 Repository로 이동
2. **Settings** → **Pages** 메뉴 선택
3. **Source** 섹션에서:
   - Source: **GitHub Actions** 선택
   - (또는 `gh-pages` 브랜치 선택)

### 2. Repository Visibility

- **Public Repository**: 무료로 GitHub Pages 사용 가능
- **Private Repository**: GitHub Pro 이상 필요

---

## ⚙️ 2단계: Workflow 파일 생성

### 1. 디렉토리 생성

Repository에 다음 디렉토리를 생성합니다:

```bash
mkdir -p .github/workflows
```

### 2. Workflow 파일 작성

`.github/workflows/deploy.yml` 파일을 생성합니다:

```yaml
name: Deploy Quartz to GitHub Pages

on:
  push:
    branches:
      - main  # main 브랜치에 푸시될 때 실행
  workflow_dispatch:  # 수동 실행 가능

# GitHub Pages 배포를 위한 권한 설정
permissions:
  contents: read
  pages: write
  id-token: write

# 동시 배포 방지
concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-22.04
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # 전체 히스토리 가져오기 (날짜 정보를 위해)

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Dependencies
        run: npm ci

      - name: Build Quartz
        run: npx quartz build

      - name: Upload Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: public  # Quartz 빌드 결과물

  deploy:
    needs: build
    runs-on: ubuntu-22.04
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## 📋 Workflow 파일 상세 설명

### Trigger (on)

```yaml
on:
  push:
    branches:
      - main  # main 브랜치에 푸시될 때만 실행
  workflow_dispatch:  # Actions 탭에서 수동 실행 가능
```

**플러그인 동작 방식**:
1. 플러그인이 `main` 브랜치에 파일을 커밋
2. GitHub Actions가 자동으로 트리거
3. 빌드 & 배포 시작

### Permissions

```yaml
permissions:
  contents: read      # Repository 읽기
  pages: write        # GitHub Pages 쓰기
  id-token: write     # OIDC 토큰 생성
```

### Build Job

```yaml
- name: Checkout
  uses: actions/checkout@v4
  with:
    fetch-depth: 0  # 중요: 전체 히스토리 필요 (파일 생성/수정 날짜)
```

**왜 `fetch-depth: 0`이 필요한가?**
- Quartz는 Git 커밋 히스토리에서 파일의 생성/수정 날짜를 가져옴
- `fetch-depth: 0` 없이는 날짜 정보가 부정확함

```yaml
- name: Build Quartz
  run: npx quartz build
```

**빌드 결과물**:
- `public/` 폴더에 정적 HTML/CSS/JS 파일 생성
- 이 폴더가 GitHub Pages로 배포됨

---

## 🔧 3단계: 고급 설정

### 1. 캐싱으로 빌드 속도 향상

`.github/workflows/deploy.yml`에 추가:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'npm'  # 👈 npm 캐시 활성화

- name: Install Dependencies
  run: npm ci
```

**효과**:
- 첫 빌드: ~2분
- 이후 빌드: ~30초 (의존성 캐시 덕분)

---

### 2. 빌드 전 테스트 추가

```yaml
- name: Lint Check
  run: npm run lint  # package.json에 스크립트 추가 필요

- name: Type Check
  run: npx tsc --noEmit  # TypeScript 타입 체크
```

---

### 3. 빌드 실패 시 알림

**Slack 알림 추가**:

```yaml
- name: Notify Slack on Failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "Quartz 빌드 실패! 😱\nRepository: ${{ github.repository }}\nCommit: ${{ github.sha }}"
      }
```

**Discord 알림 추가**:

```yaml
- name: Notify Discord on Failure
  if: failure()
  uses: sarisia/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    status: ${{ job.status }}
    title: "Quartz Build Failed"
    description: "빌드가 실패했습니다. GitHub Actions를 확인하세요."
```

---

### 4. 환경별 빌드

**Production vs Staging**:

```yaml
on:
  push:
    branches:
      - main      # Production 배포
      - staging   # Staging 배포

jobs:
  build:
    runs-on: ubuntu-22.04
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Build Quartz
        run: |
          if [ "${{ github.ref }}" == "refs/heads/main" ]; then
            npx quartz build --output public
          else
            npx quartz build --output public-staging --base-url "/staging"
          fi

      - name: Upload Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: public
```

---

## 🔍 4단계: 배포 확인

### 1. Actions 탭 확인

1. GitHub Repository → **Actions** 탭
2. 최근 Workflow 실행 확인
3. 각 Step의 로그 확인

**성공 시**:
```
✅ Checkout
✅ Setup Node.js
✅ Install Dependencies
✅ Build Quartz
✅ Upload Artifact
✅ Deploy to GitHub Pages
```

### 2. GitHub Pages URL 확인

**URL 형식**:
- `https://username.github.io/repository-name/`
- 예: `https://bloodmoon3929.github.io/blog/`

**배포 완료 시간**:
- 일반적으로 1~5분 소요
- DNS 전파까지 최대 10분

---

## ⚠️ 문제 해결

### 빌드 실패: "Module not found"

**원인**: `package.json`에 의존성이 없음

**해결**:
```bash
# 로컬에서 확인
npm install

# package.json과 package-lock.json 커밋
git add package.json package-lock.json
git commit -m "Add missing dependencies"
git push
```

---

### 배포 실패: "Permission denied"

**원인**: GitHub Pages 권한 없음

**해결**:
1. Repository → **Settings** → **Actions** → **General**
2. **Workflow permissions** 섹션:
   - ✅ "Read and write permissions" 선택
3. 저장 후 Workflow 재실행

---

### 페이지가 404 오류

**원인 1**: `baseUrl` 설정 오류

`quartz.config.ts`:
```typescript
baseUrl: "username.github.io/repository-name",  // 슬래시 없이
```

**원인 2**: GitHub Pages Source 설정 오류

Settings → Pages:
- Source: **GitHub Actions** 선택 확인

---

### 빌드는 성공했지만 CSS/JS가 안 됨

**원인**: 잘못된 경로 설정

`quartz.config.ts`:
```typescript
configuration: {
  baseUrl: "username.github.io/repository-name",  // ✅ 정확한 URL
  ignorePatterns: [/* ... */],
},
```

브라우저 개발자 도구 (F12) → **Network** 탭에서 404 오류 확인

---

## 🚀 5단계: 자동 배포 테스트

### 1. Obsidian에서 발행

1. Publication Center 열기
2. 노트 선택
3. **PUBLISH SELECTED** 클릭

### 2. GitHub에서 확인

1. GitHub Repository 새로고침
2. 새 커밋 확인
3. **Actions** 탭 → Workflow 실행 확인

### 3. 블로그 확인

- 5분 정도 기다린 후 블로그 새로고침
- 새 글이 보이는지 확인

---

## 📊 Workflow 최적화

### Before & After

| 항목 | 최적화 전 | 최적화 후 |
|------|-----------|-----------|
| 빌드 시간 | ~3분 | ~30초 |
| 배포 빈도 | 수동 (월 1회) | 자동 (수시) |
| 오류 감지 | 배포 후 발견 | 빌드 중 감지 |

### 최적화 체크리스트

- [x] npm 캐싱 활성화
- [x] `fetch-depth: 0` 설정
- [x] 테스트 단계 추가
- [x] 실패 알림 설정
- [x] 환경별 빌드 분리

---

## 📚 다음 단계

GitHub Actions 설정이 완료되었다면:

1. [📖 GitHub Token 발급](./github-token.md) - 플러그인 권한 설정
2. [📖 로컬 서버 구축 (선택)](./local-server.md) - 더 빠른 업데이트
3. [📖 플러그인으로 첫 발행하기](./init.md#첫-발행하기)

---

## 🔗 참고 자료

- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [GitHub Pages 문서](https://docs.github.com/en/pages)
- [Quartz 배포 가이드](https://quartz.jzhao.xyz/hosting)
- [Actions Marketplace](https://github.com/marketplace?type=actions)

---

## 💡 Pro Tips

### 1. Workflow Badge 추가

README.md에 빌드 상태 배지 추가:

```markdown
![Deploy Status](https://github.com/username/repository/workflows/Deploy%20Quartz%20to%20GitHub%20Pages/badge.svg)
```

### 2. Workflow 재사용

다른 Repository에서 동일한 Workflow 사용:

```yaml
jobs:
  call-deploy-workflow:
    uses: username/repository/.github/workflows/deploy.yml@main
```

### 3. 수동 배포 트리거

```bash
# GitHub CLI 사용
gh workflow run deploy.yml

# API 호출
curl -X POST \
  -H "Authorization: token YOUR_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/username/repository/actions/workflows/deploy.yml/dispatches \
  -d '{"ref":"main"}'
```