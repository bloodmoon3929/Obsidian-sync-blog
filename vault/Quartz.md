# Quartz v4
Quartz v4는 Obsidian 기반의 메모를 웹사이트 형태로 배포할 수 있도록 돕는 정적 사이트 생성기(Static Site Generator)이다.

Obsidian Vault의 Markdown 파일을 기반으로 블로그, 문서 사이트, 지식 베이스 등을 자동으로 생성해 준다.

## 주요 특징
- Obsidian 폴더 구조를 그대로 웹사이트에 반영
- 빠른 빌드 속도
- 검색/태그/그래프 뷰 지원
- 테마 및 레이아웃 커스터마이징
- GitHub Pages 또는 Vercel에 쉽게 배포 가능
- TypeScript 기반의 확장성 있는 설정 구조

## Quartz v4 사용법
[Quartz 4 공식 문서](https://quartz.jzhao.xyz/)
### 설치
[Quartz 4 공식 설치법](https://quartz.jzhao.xyz/setting-up-your-GitHub-repository)
```
git clone https://github.com/jackyzha0/quartz.git
cd quartz
npm i
npx quartz create
```

## .github/workflows 를 통한 GitHub Actions 자동화
Quartz는 commit → push만 해도 자동 배포가 되도록 GitHub Actions Workflow를 포함하고 있다.

### typical workflow (deploy.yml)
main 브랜치에 push될 때 자동으로 빌드<br>
정적 웹사이트를 GitHub Pages에 업로드<br>
캐시 활용으로 빠른 빌드<br>
자동화 작동 방식<br>
push 감지<br>
Node.js 환경 설치<br>
Quartz 빌드 실행<br>
Pages에 업로드<br>

개발자가 직접 배포 명령어를 실행할 필요가 없다.

### src 파일 구조 설명
Quartz v4의 기본 구조는 다음과 같다:
```
src/
 ├─ components/       # UI 요소(네비바, 푸터 등)
 ├─ content/          # 배포될 Markdown 파일(실제 블로그 글)
 ├─ layouts/          # 페이지 레이아웃
 ├─ plugins/          # quartz 플러그인
 ├─ styles/           # CSS 스타일
 ├─ quartz.config.ts  # 전체 설정 파일
 └─ index.ts          # 메인 엔트리
```

#### 핵심 포인트
- content/ : Markdown 기반 블로그 글
- layouts/ : 페이지 UI 구조 담당
- plugins/ : giscus, sitemap, 검색 등 기능 추가
- quartz.config.ts : 사이트 전역 설정

## [Google Ads (애드센스)](./googleAD.md)
Quartz에서는 head.html 또는 layout.tsx에 Google Ads 스크립트를 삽입하면 광고가 활성화된다.

Ads 삽입 예시
```ts
<script data-ad-client="ca-pub-XXXX" async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js">
</script>
```

사이트가 정적이기 때문에 Ads 삽입이 매우 간단하다.

## [Google Search Console](https://blog.jagaldol.com/blog/blog-google-seo-setting/)
구글 검색 노출을 위해서는 다음을 추가해야 한다:
```
quartz.config.ts에 사이트 URL 설정
robots.txt와 sitemap.xml 생성
Google Search Console에 도메인 등록
HTML 인증 파일 업로드
```

Quartz 플러그인은 자동 sitemap을 지원해 인덱싱에 유리하다.

## quartz.layout 을 통한 블로그 UI 구성
src/layouts/ 내부의 파일이 전체 블로그의 UI 구조를 결정한다.

대표 파일
```
index.tsx
Post.tsx
Page.tsx
```
이 파일들을 수정하면<br>
“글 목록 UI”, “본문 레이아웃”, “네비게이션 등”을 자유롭게 커스터마이징할 수 있다.

예: 글 하단에 광고 추가, 사이드바 제거 등

## quartz.config.ts 설정
Quartz의 모든 전역 설정이 들어있는 핵심 파일이다.

설정 가능 요소
```
사이트 제목
description
author
언어(locale)
base URL
플러그인 활성화
태그 / 카테고리 구조
```

### 한국어 변경
locale: "ko-KR"


해당 설정을 통해 기본 라벨(Prev, Next, Search 등)을 한국어로 출력하도록 조정할 수 있다.

## robots.txt
검색 엔진에게 사이트의 인덱싱 정책을 알려주는 파일.

Quartz에서는 직접 생성하거나 플러그인으로 자동 생성 가능하다.

예시
```
User-Agent: *
Allow: /

Sitemap: https://your-domain.com/sitemap.xml
```

구글 검색 노출에 필수.

## 플러그인
Quartz v4는 플러그인 시스템을 제공하여 다음과 같은 기능을 쉽게 확장할 수 있다.

### giscus (댓글)
GitHub Discussions 기반 댓글 시스템.

quartz.config.ts에 플러그인 등록:
```ts
{ provider: "giscus", repo: "user/repo", repoId: "...", categoryId: "..." }
```

작성자의 GitHub 인증만 있으면 댓글 기능이 자동 활성화된다.

### Graph View (그래프 뷰)
Obsidian 링크 구조처럼 Markdown 파일의 연결을 시각화해 보여준다.

- 문서 노드 자동 생성
- backlink 기반 그래프 생성
- SEO에도 긍정적

Quartz의 대표 기능 중 하나.

### Sitemap 자동 생성
sitemap.xml은 검색엔진에 매우 중요하며, Quartz는 플러그인으로 자동생성을 지원한다.

설정 예시:
```ts
plugins: [
  Plugins.Sitemap()
]
```

생성된 파일은
https://your-domain.com/sitemap.xml
경로에서 확인할 수 있다.