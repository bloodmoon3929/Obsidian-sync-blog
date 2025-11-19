# Obsidian-sync-blog
깃허브와 개인서버로 옵시디언의 문서를 사진과 마크다운 문서로 분리하고, 옵시디언의 마크다운 문법을 공식 마크다운 문법으로 수정하여 사용자가 정해진 경로로 업로드 해주는 옵시디언 확장프로그램

## 개발 방법
### 터미널 1
```
npm run dev
```
위의 명령을 통해, src에 개발 중인 플러그인의 수정 사항이 생기면, 이것을 확인하고 문제가 없다면 main.js 파일로 변환 해줌

### 터미널 2
```
.\deply-to-vault.ps1
```
위의 명령은 다음과 같은 내용을 포함함

```ps1
$SOURCE_DIR = "C:\Users\gnbup\Desktop\wootech\Obsidian-sync-blog"
$VAULT_PLUGIN_DIR = "C:\Users\gnbup\OneDrive\Obsidian\.obsidian\plugins\obsidian-sync-blog"

Write-Host "=== Deploying Plugin to Obsidian ===" -ForegroundColor Cyan
Write-Host ""

$files = @("main.js", "manifest.json", "styles.css")

foreach ($file in $files) {
    $sourcePath = Join-Path $SOURCE_DIR $file
    $destPath = Join-Path $VAULT_PLUGIN_DIR $file
    
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath -Destination $destPath -Force
        Write-Host "[OK] $file copied" -ForegroundColor Green
    } else {
        Write-Host "[SKIP] $file not found" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host "Please reload Obsidian to see changes." -ForegroundColor Cyan
```

SOURCE_DIR에는 현재 이 폴더의 경로가 지정되어 있다.<br>
VAULT_PLUGIN_DIR에는 사용중인 옵시디언 vault의 플러그인 폴더의 경로로 지정되어 있다.

그 후 main.js, manifest.json, styles.css을 플러그인 폴더로 복사함으로써 플러그인을 사용할 수 있다.

## 폴더 구조
## 다이어그램