# Obsidian Blog Sync Plugin - 시작하기

## 📚 개요

Obsidian Blog Sync Plugin은 Obsidian의 마크다운 노트를 Quartz 블로그로 자동 발행하는 플러그인입니다.

**주요 기능**:
- 🚀 원클릭 발행: GitHub + 로컬 서버 동시 배포
- 🖼️ 이미지 자동 처리: `![[image.png]]` → 자동 변환 및 업로드
- 📁 폴더 구조 유지: Vault 구조 그대로 블로그에 반영
- 🔄 상태 관리: Unpublished, Changed, Published, Deleted
- ⚡ 배치 발행: 여러 파일을 하나의 커밋으로 통합

---

## 🎯 설치 방법

### 1. 플러그인 다운로드

현재 Community Plugin 등록 전이므로, 수동 설치가 필요합니다.

```bash
# Obsidian vault의 플러그인 폴더로 이동
cd /your/vault/.obsidian/plugins/

# GitHub에서 클론
git clone https://github.com/bloodmoon3929/Obsidian-sync-blog.git obsidian-blog-sync

# 의존성 설치 및 빌드
cd obsidian-blog-sync
npm install
npm run build
```

### 2. 플러그인 활성화

1. Obsidian 설정 (`Ctrl + ,`)
2. **Community plugins** → **Installed plugins**
3. **Blog Sync** 플러그인 활성화

---

## 📋 설정 전 준비사항

플러그인을 사용하기 전에 다음 항목들을 준비해야 합니다:

### 필수 항목

| 항목 | 설명 | 가이드 링크 |
|------|------|-------------|
| **Quartz 블로그** | 정적 사이트 생성기 설치 | [📖 Quartz 설정 가이드](./quartz.md) |
| **GitHub Repository** | 블로그 파일 저장소 | [📖 GitHub 가이드](./github-action.md) |
| **GitHub Token** | API 접근 권한 | [📖 Token 발급 가이드](./github-token.md) |

### 선택 항목 (로컬 서버)

| 항목 | 설명 | 가이드 링크 |
|------|------|-------------|
| **로컬 서버** | 빠른 업데이트를 위한 로컬 배포 | [📖 로컬 서버 가이드](./local-server.md) |

---

## ⚙️ 기본 설정

### 1. GitHub 설정

1. **Settings** → **Blog Sync** 탭 이동
2. **GitHub Settings** 섹션:
   - **GitHub Token**: 발급받은 Personal Access Token 입력
   - **Username**: GitHub 사용자명 (예: `bloodmoon3929`)
   - **Repository**: 저장소 이름 (예: `blog`)
   - **Branch**: 배포 브랜치 (기본값: `main`)

3. **Path Settings**:
   - **Public Base Path**: `src/site` (Quartz 기본 경로)
   - **Content Path**: `notes` (노트가 저장될 경로)
   - **Assets Path**: `img/user` (이미지가 저장될 경로)

### 2. 발행 대상 선택

**Publish Target**에서 원하는 배포 방식을 선택:
- **GitHub Only**: GitHub Pages만 사용
- **Local Server Only**: 로컬 서버만 사용
- **Both**: 양쪽 모두 배포 (권장)

---

## 🎨 사용 방법

### Publication Center 열기

**방법 1**: 리본 아이콘 클릭
- 왼쪽 사이드바의 ☁️ 아이콘 클릭

**방법 2**: 명령 팔레트
- `Ctrl + P` → "Publication Center" 입력

**방법 3**: 현재 파일 바로 발행
- `Ctrl + P` → "현재 파일을 블로그에 발행" 입력

---

### Publication Center 인터페이스

```
┌─────────────────────────────────────────────────┐
│  📚 Publication Center                          │
│  💾 GitHub: bloodmoon3929/blog                  │
│  🖥️ Server: 203.234.57.91:2052                  │
├─────────────────────────────────────────────────┤
│  📝 Unpublished Notes (5)        [Select All]   │
│  └─ 📁 Projects                                 │
│     ├─ ☑️ project-1.md                          │
│     └─ ☑️ project-2.md                          │
│                                                  │
│  ✏️ Changed Notes (2)            [Select All]   │
│  └─ 📁 Daily Notes                              │
│     └─ ☑️ 2024-01-15.md                         │
│                                                  │
│  ✅ Published Notes (10)         [Select All]   │
│  🗑️ Deleted Notes (0)                          │
├─────────────────────────────────────────────────┤
│  3 note(s) selected                              │
│  [UNPUBLISH SELECTED] [PUBLISH SELECTED]        │
└─────────────────────────────────────────────────┘
```

**기능**:
- ✅ **폴더 구조**: Vault의 폴더 구조를 그대로 표시
- ✅ **상태 필터**: 발행 상태별로 노트 분류
- ✅ **배치 선택**: 여러 파일을 한 번에 선택
- ✅ **폴더 선택**: 폴더 단위로 일괄 선택

---

## 🚀 첫 발행하기

### Step 1: 노트 작성

일반적인 Obsidian 마크다운 문법으로 노트를 작성합니다.

```markdown
# 내 첫 블로그 글

안녕하세요! 이것은 첫 번째 글입니다.

## 이미지 삽입

![[my-image.png]]

## 링크

[[다른 노트]]로 이동할 수 있습니다.
```

### Step 2: Publication Center 열기

- 리본 아이콘 클릭 또는 `Ctrl + P` → "Publication Center"

### Step 3: 발행할 노트 선택

- **Unpublished Notes** 섹션에서 발행할 노트 체크
- 또는 **Select All** 버튼으로 전체 선택

### Step 4: 발행

- **PUBLISH SELECTED** 버튼 클릭
- 진행 상황이 하단 상태바에 표시됨

### Step 5: 확인

- GitHub Repository 확인: 커밋이 생성되었는지 확인
- 블로그 접속: `https://yourusername.github.io/blog` 또는 커스텀 도메인

---

## 🔧 문제 해결

### 발행이 안 돼요

**1. GitHub Token 확인**
- Settings에서 Token이 올바르게 입력되었는지 확인
- Token이 만료되지 않았는지 확인
- [Token 재발급](./github-token.md)

**2. Repository 권한 확인**
- Repository가 존재하는지 확인
- Token에 `repo` 권한이 있는지 확인

**3. 연결 테스트**
- `Ctrl + P` → "연결 테스트" 실행
- GitHub, 로컬 서버, Webhook 상태 확인

### 이미지가 안 보여요

**1. 이미지 경로 확인**
- GitHub Repository의 `src/site/img/user/` 폴더에 이미지가 있는지 확인
- 파일명에 특수문자가 있다면 URL 인코딩되어야 함

**2. 한글 파일명**
- 플러그인이 자동으로 URL 인코딩하지만, GitHub Pages 빌드에 시간이 걸릴 수 있음
- 5분 정도 기다린 후 새로고침

### 로컬 서버가 동작하지 않아요

- [로컬 서버 가이드](./local-server.md) 참조
- Docker 컨테이너가 실행 중인지 확인
- SMB 경로 접근 권한 확인

---

## 📚 다음 단계

플러그인 설정이 완료되었다면, 각 가이드를 참고하여 세부 설정을 진행하세요:

1. [📖 Quartz 블로그 설정](./quartz.md)
2. [📖 GitHub Actions 설정](./github-action.md)
3. [📖 GitHub Token 발급](./github-token.md)
4. [📖 로컬 서버 구축 (선택)](./local-server.md)

---

## 🆘 도움말

### 공식 문서
- [Obsidian Plugin API](https://docs.obsidian.md/Plugins)
- [Quartz Documentation](https://quartz.jzhao.xyz/)

### 문의 및 버그 제보
- [GitHub Issues](https://github.com/bloodmoon3929/Obsidian-sync-blog/issues)
- [GitHub Discussions](https://github.com/bloodmoon3929/Obsidian-sync-blog/discussions)

---

## 📝 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능합니다.