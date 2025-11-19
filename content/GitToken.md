# GitHub Personal Access Token 발급 가이드

## 📚 Personal Access Token이란?

Personal Access Token (PAT)은 GitHub API에 접근하기 위한 인증 수단입니다. 비밀번호 대신 사용하며, 세밀한 권한 제어가 가능합니다.

**Obsidian Blog Sync 플러그인은 GitHub Token을 사용하여**:
- ✅ 파일을 Repository에 업로드
- ✅ 커밋 생성 및 브랜치 업데이트
- ✅ Repository 정보 조회

---

## 🎯 필요한 권한 (Scopes)

플러그인이 정상 작동하려면 다음 권한이 필요합니다:

| 권한 | 설명 | 필수 여부 |
|------|------|-----------|
| `repo` | Repository 전체 접근 (읽기/쓰기) | ✅ 필수 |
| `workflow` | GitHub Actions Workflow 트리거 | ⚠️ 권장 |

**왜 `repo` 권한이 필요한가?**
- 파일 업로드를 위한 blob 생성
- 커밋 및 tree 생성
- 브랜치 참조 업데이트

**왜 `workflow` 권한이 권장되는가?**
- 파일 푸시 시 GitHub Actions 자동 트리거
- 이 권한이 없어도 플러그인은 작동하지만, Actions가 자동으로 실행되지 않을 수 있음

---

## 🚀 Token 발급 방법

### 1단계: GitHub Settings 이동

1. GitHub 로그인
2. 오른쪽 상단 프로필 사진 클릭
3. **Settings** 선택

---

### 2단계: Developer Settings

1. 왼쪽 사이드바 최하단 **Developer settings** 클릭
2. **Personal access tokens** → **Tokens (classic)** 선택
   - (또는 **Fine-grained tokens** - 더 세밀한 권한 제어)

**Classic vs Fine-grained 비교**:

| 항목 | Classic Token | Fine-grained Token |
|------|---------------|-------------------|
| 권한 범위 | 계정 전체 | Repository별 |
| 만료 기간 | 선택 가능 | 최대 1년 |
| 보안성 | 중간 | 높음 |
| 설정 복잡도 | 간단 | 복잡 |

**권장**: 처음 사용자는 **Classic Token** 사용

---

### 3단계: 새 Token 생성

1. **Generate new token** → **Generate new token (classic)** 클릭
2. 정보 입력:

**Note (이름)**:
```
Obsidian Blog Sync Plugin
```

**Expiration (만료 기간)**:
- 30 days (30일) - 테스트용
- 90 days (90일) - 권장
- No expiration (만료 없음) - 비권장 (보안 위험)

**Select scopes (권한 선택)**:
- ✅ `repo` (전체 체크)
  - ✅ `repo:status`
  - ✅ `repo_deployment`
  - ✅ `public_repo`
  - ✅ `repo:invite`
  - ✅ `security_events`
- ✅ `workflow` (선택 사항, 권장)

---

### 4단계: Token 복사 및 저장

1. **Generate token** 버튼 클릭
2. 생성된 Token이 표시됨:
   ```
   ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. **즉시 복사하여 안전한 곳에 저장**
   - ⚠️ **페이지를 벗어나면 다시 볼 수 없음!**
   - 비밀번호 관리자 (1Password, Bitwarden) 사용 권장

---

## ⚙️ 플러그인에 Token 설정

### 1. Obsidian 설정 열기

- `Ctrl + ,` (Windows/Linux)
- `Cmd + ,` (Mac)

### 2. Blog Sync 설정

1. 왼쪽 사이드바 → **Community plugins**
2. **Blog Sync** → **옵션** (톱니바퀴 아이콘)
3. **GitHub Settings** 섹션

### 3. Token 입력

**GitHub Token** 필드에 발급받은 Token 붙여넣기:
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**GitHub Username** 입력:
```
bloodmoon3929
```

**Repository** 입력:
```
blog
```

**Branch** 입력 (기본값):
```
main
```

---

## 🔒 Token 보안 관리

### DO ✅

**1. 안전하게 저장**
- 비밀번호 관리자 사용
- 암호화된 노트에 저장
- 환경 변수로 관리 (개발 시)

**2. 권한 최소화**
- 필요한 권한만 부여
- Fine-grained Token 사용 (특정 Repository만)

**3. 주기적 갱신**
- 90일마다 새 Token 발급
- 오래된 Token 삭제

**4. Token 유출 시 즉시 조치**
- GitHub Settings에서 Token 삭제
- 새 Token 발급
- 플러그인 설정 업데이트

---

### DON'T ❌

**1. 공개 저장소에 커밋**
```bash
# ❌ 절대 금지
git add .env
git commit -m "Add GitHub token"
```

**2. 스크린샷 공유**
- Token이 보이는 화면 캡처 금지
- 블로그 글에 Token 노출 금지

**3. 다른 사람과 공유**
- Token은 개인용
- 팀 작업 시 각자 발급

**4. 불필요한 권한 부여**
- `repo` 권한만으로 충분
- `admin`, `delete_repo` 등 불필요

---

## ⚠️ Token 만료 시 대응

### 증상

- ❌ "발행 실패: 401 Unauthorized"
- ❌ "Bad credentials"
- ❌ 연결 테스트 실패

### 해결 방법

**1. 새 Token 발급**
- [Token 발급 방법](#token-발급-방법) 재수행

**2. 플러그인 설정 업데이트**
- Obsidian Settings → Blog Sync
- 새 Token 입력

**3. 연결 테스트**
- `Ctrl + P` → "연결 테스트" 실행
- ✅ GitHub 연결 성공 확인

---

## 🔧 Fine-grained Token 발급 (고급)

더 세밀한 권한 제어를 원한다면:

### 1. Fine-grained Token 생성

1. **Personal access tokens** → **Fine-grained tokens**
2. **Generate new token** 클릭

### 2. Token 설정

**Token name**:
```
Obsidian Blog Sync - Blog Repository
```

**Expiration**: 90 days

**Resource owner**: 자신의 계정 선택

**Repository access**:
- **Only select repositories** 선택
- 블로그 Repository만 선택

### 3. 권한 설정

**Repository permissions**:
- Contents: **Read and write** ✅
- Metadata: **Read-only** ✅
- Workflows: **Read and write** (선택 사항)

### 4. Token 생성 및 복사

- **Generate token** 클릭
- Token 복사 후 안전하게 저장

---

## 📊 Token 관리

### 현재 Token 확인

1. GitHub Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. 발급된 Token 목록 확인

**정보 확인 가능**:
- Note (이름)
- Last used (마지막 사용 시간)
- Expires (만료 시간)

### Token 삭제

1. Token 옆 **Delete** 버튼 클릭
2. 확인 후 삭제

**언제 삭제해야 하는가?**
- ✅ Token 유출 의심 시
- ✅ 플러그인 사용 중단 시
- ✅ 새 Token으로 교체 시

---

## 🔍 연결 테스트

### Obsidian에서 테스트

1. `Ctrl + P` (명령 팔레트)
2. "연결 테스트" 입력 및 실행
3. 결과 확인:
   ```
   연결 테스트 결과:
   GitHub: ✅
   로컬 서버: ✅
   Webhook: ✅
   ```

### 수동 테스트 (curl)

```bash
# Token이 유효한지 확인
curl -H "Authorization: token ghp_YOUR_TOKEN" \
     https://api.github.com/user

# Repository 접근 가능한지 확인
curl -H "Authorization: token ghp_YOUR_TOKEN" \
     https://api.github.com/repos/username/repository
```

**성공 시**:
```json
{
  "login": "username",
  "id": 12345,
  "type": "User",
  ...
}
```

**실패 시**:
```json
{
  "message": "Bad credentials",
  "documentation_url": "https://docs.github.com/rest"
}
```

---

## ❓ 자주 묻는 질문

### Q1: Token을 분실했어요

**A**: 페이지를 벗어난 후에는 Token을 다시 확인할 수 없습니다. 새로운 Token을 발급받아야 합니다.

---

### Q2: 여러 기기에서 사용하고 싶어요

**A**: 각 기기마다 동일한 Token을 사용할 수 있습니다. 하지만 보안을 위해 기기별로 다른 Token을 발급하는 것을 권장합니다.

---

### Q3: Token이 자꾸 만료돼요

**A**: 만료 기간을 "No expiration"으로 설정할 수 있지만, 보안상 권장하지 않습니다. 90일로 설정하고 캘린더에 갱신 일정을 등록하세요.

---

### Q4: Private Repository에도 작동하나요?

**A**: 네, `repo` 권한은 Public/Private Repository 모두 접근 가능합니다.

---

### Q5: Organization Repository에 사용할 수 있나요?

**A**: 가능하지만, Organization 관리자가 Personal Access Token 사용을 허용해야 합니다.

---

## 🚨 긴급 상황 대응

### Token이 GitHub에 공개되었다면

**1. 즉시 조치 (5분 이내)**
```bash
1. GitHub Settings → Developer settings
2. 해당 Token 삭제
3. 모든 기기에서 git credential 삭제
```

**2. 보안 점검**
- Repository의 최근 커밋 확인
- Actions 실행 이력 확인
- 의심스러운 활동 체크

**3. 새 Token 발급**
- 새로운 Token 생성
- 모든 기기/플러그인 설정 업데이트

---

## 📚 다음 단계

Token 발급이 완료되었다면:

1. [📖 플러그인 초기 설정](./init.md) - Token을 플러그인에 입력
2. [📖 첫 발행하기](./init.md#첫-발행하기) - 실제로 파일 발행 테스트
3. [📖 로컬 서버 구축 (선택)](./local-server.md) - 더 빠른 업데이트

---

## 🔗 참고 자료

- [GitHub Token 공식 문서](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Token 권한 가이드](https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps)
- [Token 보안 모범 사례](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/token-expiration-and-revocation)

---

## 💡 Pro Tips

### Tip 1: Token 이름 규칙

```
[목적] - [장치/서비스] - [발급일]
예: Blog Sync - MacBook Pro - 2024-01
```

### Tip 2: Token 회전 (Rotation)

```bash
# 매 90일마다 새 Token 발급
# 기존 Token 만료 1주일 전에 새 Token 준비
# 겹치는 기간 동안 점진적 교체
```

### Tip 3: .gitignore에 Token 제외

```gitignore
# .gitignore
.env
.env.local
config.json
*token*
*secret*
```

### Tip 4: GitHub Secrets 사용 (CI/CD)

GitHub Actions에서는 Token을 Secrets에 저장:

```yaml
# .github/workflows/deploy.yml
env:
  GITHUB_TOKEN: ${{ secrets.BLOG_SYNC_TOKEN }}
```