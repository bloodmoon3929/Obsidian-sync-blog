# Quartz 블로그 설정 가이드

## 📚 Quartz란?

Quartz는 Obsidian 노트를 위해 특별히 설계된 정적 사이트 생성기입니다. TypeScript로 작성되었으며, Obsidian의 독특한 마크다운 문법(`[[wikilink]]`, 백링크, 그래프 뷰 등)을 네이티브로 지원합니다.

**공식 문서**: [https://quartz.jzhao.xyz/](https://quartz.jzhao.xyz/)

---

## 🚀 Quartz 설치

### 1. 사전 요구사항

다음 소프트웨어가 설치되어 있어야 합니다:

- **Node.js** v18.14 이상
- **npm** (Node.js와 함께 설치됨)
- **Git**

확인 방법:
```bash
node --version    # v18.14.0 이상
npm --version     # 9.0.0 이상
git --version     # 2.0.0 이상
```

---

### 2. Quartz 설치

#### 방법 1: GitHub Template 사용 (권장)

1. [Quartz Template](https://github.com/jackyzha0/quartz) 접속
2. **Use this template** 버튼 클릭
3. Repository 이름 입력 (예: `blog`)
4. **Create repository** 클릭

```bash
# 로컬로 클론
git clone https://github.com/yourusername/blog.git
cd blog

# 의존성 설치
npm install
```

#### 방법 2: 기존 프로젝트에 추가

```bash
# Quartz 설치
npx quartz create

# 프롬프트에 따라 선택
? Choose how to initialize Quartz:
  > Empty Quartz
  Copy an existing folder
  Symlink an existing folder
```

---

### 3. Quartz 실행

```bash
# 개발 서버 시작
npx quartz build --serve

# 브라우저에서 확인
# http://localhost:8080
```

---

## ⚙️ Quartz 설정

### 1. 기본 설정 파일

프로젝트 루트에 `quartz.config.ts` 파일을 생성/수정합니다.

```typescript
// quartz.config.ts
import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

const config: QuartzConfig = {
  configuration: {
    pageTitle: "🏯 My Blog",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "google",
      tagId: "G-XXXXXXXXXX", // Google Analytics ID
    },
    locale: "ko-KR",
    baseUrl: "yourusername.github.io/blog",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "created",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Noto Sans KR",
        body: "Noto Sans KR",
        code: "JetBrains Mono",
      },
      colors: {
        lightMode: {
          light: "#faf8f8",
          lightgray: "#e5e5e5",
          gray: "#b8b8b8",
          darkgray: "#4e4e4e",
          dark: "#2b2b2b",
          secondary: "#284b63",
          tertiary: "#84a59d",
          highlight: "rgba(143, 159, 169, 0.15)",
        },
        darkMode: {
          light: "#161618",
          lightgray: "#393639",
          gray: "#646464",
          darkgray: "#d4d4d4",
          dark: "#ebebec",
          secondary: "#7b97aa",
          tertiary: "#84a59d",
          highlight: "rgba(143, 159, 169, 0.15)",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "filesystem"],
      }),
      Plugin.Latex({ renderEngine: "katex" }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.NotFoundPage(),
    ],
  },
}

export default config
```

---

### 2. 레이아웃 설정

`quartz.layout.ts` 파일로 페이지 레이아웃을 커스터마이징합니다.

```typescript
// quartz.layout.ts
import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// 모든 페이지에 공통으로 적용
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/yourusername",
      Twitter: "https://twitter.com/yourusername",
    },
  }),
}

// 일반 페이지 레이아웃
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs(),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search(),
    Component.Darkmode(),
    Component.DesktopOnly(Component.Explorer()),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// 폴더/태그 페이지 레이아웃
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search(),
    Component.Darkmode(),
    Component.DesktopOnly(Component.Explorer()),
  ],
  right: [],
}
```

---

## 📁 디렉토리 구조

Obsidian Blog Sync 플러그인과 함께 사용하기 위한 권장 구조:

```
blog/
├── src/
│   └── site/
│       ├── notes/              # 👈 플러그인이 마크다운을 업로드할 경로
│       │   ├── Projects/
│       │   ├── Daily Notes/
│       │   └── index.md
│       └── img/
│           └── user/           # 👈 플러그인이 이미지를 업로드할 경로
│               └── screenshots/
├── quartz/                     # Quartz 코어 파일
├── quartz.config.ts            # Quartz 설정
├── quartz.layout.ts            # 레이아웃 설정
└── package.json
```

**중요**: 플러그인 설정에서 다음 경로를 입력해야 합니다:
- **Public Base Path**: `src/site`
- **Content Path**: `notes`
- **Assets Path**: `img/user`

---

## 🎨 테마 커스터마이징

### 1. 색상 변경

`quartz.config.ts`의 `colors` 섹션 수정:

```typescript
colors: {
  darkMode: {
    light: "#1a1a1a",      // 배경색
    dark: "#ffffff",       // 텍스트색
    secondary: "#7b97aa",  // 링크 색상
    tertiary: "#84a59d",   // 강조 색상
    highlight: "rgba(143, 159, 169, 0.15)",
  },
}
```

### 2. 폰트 변경

```typescript
typography: {
  header: "Pretendard",
  body: "Pretendard",
  code: "D2Coding",
},
```

### 3. CSS 오버라이드

`quartz/styles/custom.scss` 파일 생성:

```scss
// 커스텀 스타일
.article-title {
  color: var(--secondary);
  font-size: 2.5rem;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

---

## 🔌 플러그인 추가

### 1. giscus 댓글 시스템

`quartz/components/Comments.tsx` 파일 생성:

```tsx
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

export default ((userOpts) => {
  const Comments: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    return (
      <div class={`giscus ${displayClass ?? ""}`}>
        <script
          src="https://giscus.app/client.js"
          data-repo="yourusername/blog"
          data-repo-id="YOUR_REPO_ID"
          data-category="General"
          data-category-id="YOUR_CATEGORY_ID"
          data-mapping="pathname"
          data-strict="0"
          data-reactions-enabled="1"
          data-emit-metadata="0"
          data-input-position="bottom"
          data-theme="preferred_color_scheme"
          data-lang="ko"
          crossorigin="anonymous"
          async
        />
      </div>
    )
  }

  Comments.displayName = "Comments"
  return Comments
}) satisfies QuartzComponentConstructor
```

`quartz.layout.ts`에 추가:

```typescript
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [...],
  left: [...],
  right: [...],
  afterBody: [
    Component.Comments(), // 👈 댓글 컴포넌트 추가
  ],
}
```

### 2. Google Analytics

`quartz.config.ts`에 추가:

```typescript
analytics: {
  provider: "google",
  tagId: "G-XXXXXXXXXX", // Google Analytics Measurement ID
},
```

---

## 🏗️ 빌드 & 배포

### 로컬 테스트

```bash
# 개발 서버 (핫 리로드)
npx quartz build --serve

# 프로덕션 빌드
npx quartz build
```

### GitHub Pages 배포

빌드된 파일은 `public/` 폴더에 생성됩니다.

GitHub Actions가 자동으로 배포를 처리합니다. (다음 가이드 참조: [GitHub Actions 설정](./github-action.md))

---

## 🔍 Obsidian 문법 지원

Quartz는 다음 Obsidian 문법을 지원합니다:

### 1. Wikilink

```markdown
[[Other Note]]           # 다른 노트로 링크
[[Other Note|Alias]]     # 링크 텍스트 변경
[[Note#Heading]]         # 특정 제목으로 링크
```

### 2. 임베드

```markdown
![[Other Note]]          # 노트 전체 임베드
![[Note#Section]]        # 특정 섹션만 임베드
![[image.png]]           # 이미지 임베드
```

### 3. 태그

```markdown
#프로젝트 #개발 #typescript
```

### 4. Callout (Admonition)

```markdown
> [!note] 제목
> 내용

> [!warning] 경고
> 조심하세요!

> [!tip] 팁
> 유용한 정보
```

### 5. 수식 (LaTeX)

```markdown
인라인: $E = mc^2$

블록:
$$
\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

---

## ⚠️ 주의사항

### 1. 지원하지 않는 기능

Quartz는 다음 Obsidian 기능을 지원하지 않습니다:

- ❌ Dataview 쿼리
- ❌ Canvas 파일
- ❌ PDF 임베드
- ❌ 플러그인 고유 문법

### 2. 파일명 제한

- 특수문자는 URL 인코딩됨
- 한글 파일명 지원 (자동 인코딩)
- 공백은 `%20`으로 변환

### 3. 이미지 경로

플러그인이 다음과 같이 자동 변환합니다:

```markdown
# Obsidian에서
![[my-image.png]]

# Quartz에서
![my-image.png](/src/site/img/user/my-image.png)
```

---

## 🆘 문제 해결

### 빌드 오류

```bash
# 캐시 삭제 후 재빌드
rm -rf .quartz-cache
npx quartz build
```

### 이미지가 안 보임

- `src/site/img/user/` 경로 확인
- 파일명에 특수문자가 있는지 확인
- 대소문자 일치 확인 (Linux는 대소문자 구분)

### 한글이 깨짐

`quartz.config.ts`에서 locale 설정:

```typescript
locale: "ko-KR",
```

---

## 📚 다음 단계

Quartz 설정이 완료되었다면:

1. [📖 GitHub Actions 설정](./github-action.md)
2. [📖 GitHub Token 발급](./github-token.md)
3. [📖 플러그인으로 첫 발행하기](./init.md#첫-발행하기)

---

## 🔗 참고 자료

- [Quartz 공식 문서](https://quartz.jzhao.xyz/)
- [Quartz GitHub](https://github.com/jackyzha0/quartz)
- [Obsidian Markdown 문법](https://help.obsidian.md/Editing+and+formatting/Obsidian+Flavored+Markdown)