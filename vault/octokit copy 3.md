# OctoKit
Github API를 편하게 쓰도록 만든 라이브러리 세트

GitHub REST API, GraphQL API 호출을
- 인증
- rate-limit 처리
- pagination
- 오류 처리
- webhook 검증
등을 수행해줌

##### 사용 예시
REST API
```ts
import { Octokit } from "octokit";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const { data } = await octokit.rest.repos.get({
  owner: "octocat",
  repo: "Hello-World",
});

console.log(data);
```

GraphQL API
```ts
import { graphql } from "@octokit/graphql";

const { repository } = await graphql(
  `
    query ($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        stargazerCount
      }
    }
  `,
  {
    owner: "octocat",
    repo: "Hello-World",
    headers: {
      authorization: `token ${process.env.GITHUB_TOKEN}`,
    },
  }
);

console.log(repository.stargazerCount);
```

##### 전체 구조
1. Core (핵심 HTTP/인증 기능)
2. REST API (GitHub REST wrapper)
3. GraphQL API
4. Webhooks (서명 검증/리스너)
5. Plugins (확장 기능)

###### Octokit Core 기능
@octokit/core

모든 Octokit 패키지의 기반.

**핵심 기능**
인증
- Personal Access Token
- GitHub App 인증 (App ID + Private Key)
- OAuth App 인증
- Web OAuth Flow 지원
- JWT 발급 자동 처리

요청(Request) 기능
- GitHub API 스펙 자동 적용
- 파라미터 검증
- 자동 User-Agent 설정
- Base URL 커스텀(GitHub Enterprise)

오류 처리(Error Handling)
- API rate limit 에러
- Abuse detection
- Validation error 자동 파싱
- Retry 가능

Pagination (자동 페이지네이션)
- octokit.paginate() API 제공
- 전체 데이터 자동 수집

Hook 시스템
- before/after hooks로 요청을 가로채서 커스텀 가능.


###### REST API 기능

@octokit/rest

GitHub의 600+ REST API 엔드포인트를 method로 제공.

**주요 기능**
인증된 사용자
- 내 정보 가져오기
- 이메일 목록
- 사용자 Organizations 조회

Repository 관리
- 레포 만들기
- 삭제/아카이브/포크
- branch, tree, blobs 관리
- Collaborator 추가/삭제
- Webhook 생성/삭제

Issues
- 생성/조회/수정/닫기
- 라벨 관리
- Assignees 관리
- Comment 추가/삭제

Pull Requests
- 생성
- Merge
- Review 등록/승인/요청변경
- 코멘트, 커밋, 파일 변경 내역 읽기

Releases
- 릴리즈 생성/수정/삭제
- Release Assets 업로드
- 태그 관리

Git 데이터 API
- 커밋/트리/블롭 관리
- Git 객체 생성
- 참조(ref) 생성/삭제
- SHA 체크

Actions
- workflow 실행 트리거
- 실행 로그 조회
- artifacts 조회/다운로드/삭제
- workflow dispatch 호출

Checks API
- CI 상태 체크 생성
- 상태를 GitHub UI에 표시

Permissions
- Token 조회
- Github App permissions 체크

Stats
- 기여도 통계
- 트래픽, 인기 파일 조회

GitHub Packages
- 패키지 조회
- 버전 삭제
- 패키지 다운로드 정보

###### GraphQL API 기능

@octokit/graphql

GitHub의 GraphQL API를 편하게 호출하는 클라이언트.

**가능한 기능**
- GraphQL 쿼리 실행
- 변수 바인딩
- Header 커스텀(auth)
- GitHub의 전체 스키마(레포/유저/PR/이슈 모두) 접근

GraphQL의 장점:
- 필요한 데이터만 가져오기
- 복잡한 nested 관계를 한번에 조회
- REST에서 여러 요청이 필요한 작업을 한 번에 끝냄

###### Webhooks 기능

@octokit/webhooks

GitHub에서 오는 이벤트를 받아 처리하는 기능.

**지원하는 기능**
- Webhook signature 검증(HMAC SHA-256)
- 이벤트 라우팅 (예: issues.opened)
- 모든 GitHub 이벤트 타입 지원 (100+)
- Express/Fastify/Koa 등 Node 프레임워크 연결
- 배포 방식(FaaS) 대응

예:
```ts
webhooks.on("issues.opened", async ({ payload }) => {
  console.log("이슈 생성됨:", payload.issue.title);
});
```

###### Plugins 시스템

Octokit은 플러그인을 조합해서 기능을 확장하도록 설계됨.

**주요 플러그인들:**

@octokit/plugin-retry

- GitHub API rate limit → 자동 재시도
- 네트워크 오류 자동 재시도

@octokit/plugin-rest-endpoint-methods
- REST API 엔드포인트를 자동 메소드화
- octokit.rest.* 제공하게 하는 핵심

@octokit/plugin-paginate-rest
- 페이지네이션 자동 처리
- 모든 list API에서 .paginate() 제공

@octokit/auth- (여러 종류)
- 앱 인증
- OAuth 인증
- SSO 인증 등

@octokit/plugin-throttling
- GitHub가 abuse detection 걸면 요청 속도 제한 조절
- GitHub Actions 봇 개발 시 필수

@octokit/plugin-request-log
- API 요청/응답 로깅

기타 기능
- GitHub Enterprise 호환
- GraphQL rate-limit 검사
- Linking, Hypermedia 지원

###### 특수 라이브러리들

Octokit 생태계에 있는 중요 패키지들:

패키지	기능
octokit	Core + REST + paginate + retry 번들
@octokit/auth-app	GitHub App 인증 전체 자동화
@octokit/oauth-methods	OAuth device flow 등
@octokit/webhooks-methods	웹훅 생성/삭제 등
probot	Octokit 기반 GitHub App 프레임워크

##### Octokit으로 가능한 것들 전체 요약
GitHub 자동화
- Issue/PR 자동 생성
- PR merge bot 만들기
- release 자동 생성
- 잔디 자동 커밋 봇

GitHub Actions 외부 스크립팅
- 빌드 완료 후 release 생성
- CI 결과 보고 Slack 알리기

GitHub App 제작
- Webhook + Octokit 조합
- 리뷰 자동 할당
- 스팸 PR 차단

Git 데이터 직접 조작
- repo 파일 읽기/쓰기
- 커밋 직접 생성
- ref 브랜치 조작

GraphQL로 고급 데이터 조회
- 팀 기여도 통계
- 대규모 레포 분석