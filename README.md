# 미션 간단 소개
진행하고자 하는 미션은 옵시디언이라는 메모앱의 확장프로그램이다.

옵시디언은 마크업 기반의 메모앱으로 개발자 친화적인 메모앱이다

동종 업계인 노션과 다르게 오프라인이기에 자료 공유가 힘든 편이다.

그렇기 때문에 몇몇 개발자들은 이 문제를 md 파일을 기반으로 웹으로 호스팅하는 블로그를 만들곤 한다.

이 과정까지 접근하기 힘들기에 이를 해결하고자 모두가 접근하지 쉬운 옵시디언 플러그인을 제작하여 해결 하고자 한다.

## 요구사항
### 개발 언어
자바 스크립트

### 핵심 기능
- [ ] 이중 업로드 시스템 구성
    - [ ] Git
        - [ ] 연결 테스트
    - [ ] 개인 서버
        - [ ] SFTP 업로드 구현
        - [ ] 연결 테스트
    - [ ] 업로드 전략
        - [ ] 순차
        - [ ] 병렬
        - [ ] Fallback
    - [ ] 에러 핸들링
    - [ ] 재시도 매커니즘
- [ ] 상태바
- [ ] 알림 시스템
- [ ] 설정 UI
    - [ ] 블로그 폴더 지정
- [ ] 파일 상태 관리
- [ ] Obsidian 문법을 표준 마크다운 문법으로 변환
- [ ] 프론트 매터 생성
- [ ] 참조 파일 복사

### UI/UX
#### 설정 화면
|Setting|
|--|
|Blog Platform : Jekyll, Hugo, Custom|
|Blog Floder : [Blog/    ][Browse](기기마다 다름)|
|Upload Method: git, Server(SFTP/FTP), Both|
|Git Repository:[~/blog-repo  ][Brower]|
|Server:[Host : ][Port: ]|

|Image Folder : [asset/]|


#### 명령어 팔레트
```
- Publish current file to blog
- Publish all files to blog
- Unpublish current file
- View blog status
- Open blog settings
- Push to Git
```

#### 상태바 (Status Bar)
```
Obsidian-sync-blog: ✓ Synced | 3 files published
```

#### 사이드 패널
|Blog Status|
|-|
|Published (5)|
|✓ index.md|
|✓ home.md|
|✓ wootech.md|
|...|
||
|Draft (2)|
|[ ] 회고.md|
|[ ] README.md|
||
|Don't Publish(1)|
|readMe.md|
||
|[Publish All][Push to Git]|


### 변환 로직
1. 위키 링크 변환
```md
// Obsidian
[[다른 글]]
[[다른 글|표시 텍스트]]

// 표준 마크 다운
[다른글](./다른-글.md)
[표시 텍스트](./다른-글.md)
```

2. 이미지 
```md
// Obsidian
![[image.png]]
![[subfolder/image.png]]

// 표준 마크 다운
![image](/assets/images/image.png)
```

3. 프론트매터 생성 규칙
```
- title: 파일명
- date: 파일 생성일 또는 수정일
- tags: #태그 수집
- categories: 폴더 구조에서 추출


- publish: 발행 여부
- draft: 변경 여부
```

