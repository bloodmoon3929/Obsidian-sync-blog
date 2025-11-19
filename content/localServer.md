# 로컬 서버 구축 가이드 (선택 사항)

## 📚 로컬 서버란?

로컬 서버는 자신의 컴퓨터나 홈 서버에서 직접 블로그를 호스팅하는 방식입니다. GitHub Pages와 함께 사용하면 **이중 배포 시스템**을 구축할 수 있습니다.

---

## 🎯 로컬 서버의 장점

### GitHub Pages만 사용할 때

| 항목 | 성능 |
|------|------|
| 업데이트 속도 | 5~10분 (GitHub Actions 빌드 시간) |
| 가용성 | 99.9% (GitHub 의존) |
| 제어권 | 제한적 (GitHub 정책 준수) |
| 비용 | 무료 |

### GitHub Pages + 로컬 서버

| 항목 | 성능 |
|------|------|
| 업데이트 속도 | **즉시** (Docker 재시작만) |
| 가용성 | 99.99% (자동 폴백) |
| 제어권 | 완전한 제어 |
| 비용 | 전기세 + 인터넷 비용 |

---

## ⚠️ 사전 고려사항

### 필요한 것

| 항목 | 최소 사양 | 권장 사양 |
|------|-----------|-----------|
| **하드웨어** | 라즈베리파이 4 | 미니 PC (Intel N95+) |
| **RAM** | 2GB | 8GB 이상 |
| **Storage** | 32GB | 256GB 이상 |
| **네트워크** | 100Mbps | 1Gbps |
| **고정 IP** | 동적 DNS | 고정 공인 IP |

### 추가 비용

- 전기세: 월 ~5,000원 (24시간 가동)
- 도메인: 연 ~15,000원 (선택)
- 고정 IP: 월 ~5,000원 (선택)

---

## 🏗️ 아키텍처 개요

```
┌─────────────────────────────────────────────────┐
│              Obsidian Plugin                     │
│  ┌──────────────┐        ┌──────────────┐      │
│  │   GitHub     │        │ Local Server │      │
│  │  Publisher   │        │  Publisher   │      │
│  └──────┬───────┘        └──────┬───────┘      │
│         │                       │               │
└─────────┼───────────────────────┼───────────────┘
          │                       │
          │ 1. GitHub API         │ 2. SMB Copy
          ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│  GitHub Repo     │    │   OMV Server     │
│  (main branch)   │    │   /mnt/...       │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         │ 3. GitHub Actions     │ 4. Webhook
         ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│  GitHub Pages    │    │ Docker Compose   │
│  username.g...   │    │  - Quartz        │
└────────┬─────────┘    │  - Nginx         │
         │               └────────┬─────────┘
         │                       │
         │                       │ 5. HTTP
         └───────────┬───────────┘
                     ▼
         ┌──────────────────────┐
         │ Cloudflare Workers   │
         │  (Load Balancer)     │
         └──────────┬───────────┘
                    │
                    ▼
              ┌──────────┐
              │  사용자  │
              └──────────┘
```

---

## 🖥️ 방법 1: OMV (OpenMediaVault) + Docker

### 1단계: OMV 설치

**OMV란?**
- Debian 기반 NAS 운영체제
- 웹 UI로 간편한 관리
- Docker, SMB, FTP 등 다양한 기능

**설치 방법**:
1. [OMV ISO 다운로드](https://www.openmediavault.org/)
2. USB 부팅 디스크 생성
3. 서버에 설치
4. 웹 UI 접속: `http://서버IP`
   - 기본 계정: `admin` / `openmediavault`

---

### 2단계: SMB 공유 폴더 설정

**목적**: Windows/Mac에서 파일 시스템 접근

**설정 방법**:

1. **Storage → File Systems**
   - 디스크 마운트

2. **Storage → Shared Folders**
   - **Create** 클릭
   - Name: `quartz-blog`
   - Path: `/srv/dev-disk-by-uuid-xxx/`
   - Permissions: Read/Write

3. **Services → SMB/CIFS**
   - **Settings** 탭: Enabled 체크
   - **Shares** 탭: `quartz-blog` 공유 추가

4. **사용자 권한 설정**
   - Users → 사용자 생성
   - Shared Folders → `quartz-blog` → Permissions

---

### 3단계: Docker 설치

**OMV 플러그인 사용**:

1. **System → Plugins**
2. **openmediavault-compose** 검색 및 설치
3. **Services → Compose** 메뉴 생성됨

---

### 4단계: Docker Compose 설정

**디렉토리 구조**:
```
/srv/dev-disk-by-uuid-xxx/quartz-blog/
├── docker-deployment/
│   ├── docker-compose.yml
│   ├── nginx.conf
│   └── renew-ssl.sh
├── src/
│   └── site/
│       ├── notes/          # 👈 플러그인이 마크다운 업로드
│       └── img/
│           └── user/       # 👈 플러그인이 이미지 업로드
├── quartz.config.ts
└── package.json
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  quartz-blog:
    build: ..
    container_name: quartz-blog
    volumes:
      - ../src:/app/content:ro
      - /app/node_modules
    restart: unless-stopped
    networks:
      - quartz-network
    command: npx quartz build --serve

  quartz-proxy:
    image: alpine/socat
    container_name: quartz-proxy
    command: "TCP-LISTEN:8080,fork,reuseaddr TCP:quartz-blog:8080"
    depends_on:
      - quartz-blog
    networks:
      - quartz-network
    restart: unless-stopped

  nginx-loadbalancer:
    image: nginx:alpine
    container_name: nginx-loadbalancer
    ports:
      - "443:443"
      - "2052:2052"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - quartz-proxy
    networks:
      - quartz-network
    restart: unless-stopped

networks:
  quartz-network:
    driver: bridge
```

**nginx.conf**:
```nginx
events {
    worker_connections 1024;
}

http {
    upstream quartz_backend {
        server quartz-proxy:8080;
    }

    server {
        listen 2052 ssl http2;
        server_name yourdomain.duckdns.org;

        ssl_certificate /etc/letsencrypt/live/yourdomain.duckdns.org/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/yourdomain.duckdns.org/privkey.pem;

        location / {
            proxy_pass http://quartz_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # HTTP to HTTPS 리다이렉트
    server {
        listen 2052;
        server_name yourdomain.duckdns.org;
        return 301 https://$server_name$request_uri;
    }
}

stream {
    upstream backend {
        # GitHub Pages (백업)
        server yourusername.github.io:443 max_fails=3 fail_timeout=30s;
        # 로컬 서버 (primary)
        server 203.234.57.91:2052 max_fails=3 fail_timeout=10s backup;
    }

    server {
        listen 443 ssl;
        proxy_pass backend;
        ssl_certificate /etc/letsencrypt/live/yourdomain.duckdns.org/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/yourdomain.duckdns.org/privkey.pem;
    }
}
```

---

### 5단계: SSL 인증서 발급

**Let's Encrypt + Certbot**:

```bash
# SSH로 OMV 접속
ssh admin@서버IP

# Certbot 설치
sudo apt update
sudo apt install certbot

# 인증서 발급
sudo certbot certonly --standalone \
    -d yourdomain.duckdns.org \
    --agree-tos \
    --email your@email.com

# 자동 갱신 설정
sudo crontab -e

# 매주 월요일 새벽 3시에 갱신
0 3 * * 1 certbot renew && docker-compose -f /srv/dev-disk-by-uuid-xxx/quartz-blog/docker-deployment/docker-compose.yml restart nginx-loadbalancer
```

**갱신 스크립트** (`renew-ssl.sh`):
```bash
#!/bin/bash

LOG_FILE="/var/log/certbot-renew.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] Starting SSL certificate renewal" >> $LOG_FILE

certbot renew --quiet >> $LOG_FILE 2>&1

if [ $? -eq 0 ]; then
    echo "[$DATE] Certificate renewal successful" >> $LOG_FILE
    
    cd /srv/dev-disk-by-uuid-xxx/quartz-blog/docker-deployment
    docker-compose restart nginx-loadbalancer >> $LOG_FILE 2>&1
    
    echo "[$DATE] Nginx restarted successfully" >> $LOG_FILE
else
    echo "[$DATE] Certificate renewal failed" >> $LOG_FILE
fi
```

```bash
# 실행 권한 부여
chmod +x /srv/dev-disk-by-uuid-xxx/quartz-blog/docker-deployment/renew-ssl.sh
```

---

### 6단계: DuckDNS 동적 DNS

**왜 필요한가?**
- 대부분의 가정용 인터넷은 동적 IP (재부팅 시 IP 변경)
- 도메인 이름으로 접속하려면 동적 DNS 필요

**DuckDNS 설정**:

1. [DuckDNS 가입](https://www.duckdns.org/)
2. 서브도메인 생성: `yourdomain.duckdns.org`
3. Token 복사

4. OMV에서 자동 업데이트 설정:

```bash
# Cron Job 추가
*/5 * * * * curl "https://www.duckdns.org/update?domains=yourdomain&token=YOUR_TOKEN&ip=" >> /var/log/duckdns.log 2>&1
```

---

### 7단계: Webhook 서버 (선택)

**목적**: 플러그인이 파일을 업로드하면 Docker 자동 재시작

**간단한 Webhook 서버** (`webhook.py`):

```python
from flask import Flask, request
import subprocess
import os

app = Flask(__name__)

WEBHOOK_TOKEN = "your-secret-token"
DOCKER_COMPOSE_PATH = "/srv/dev-disk-by-uuid-xxx/quartz-blog/docker-deployment"

@app.route('/restart-docker', methods=['POST'])
def restart_docker():
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or auth_header != f'Bearer {WEBHOOK_TOKEN}':
        return {'error': 'Unauthorized'}, 401
    
    try:
        os.chdir(DOCKER_COMPOSE_PATH)
        result = subprocess.run(['docker-compose', 'restart', 'quartz-blog'], 
                                capture_output=True, text=True)
        
        if result.returncode == 0:
            return {'status': 'success', 'message': 'Docker restarted'}, 200
        else:
            return {'status': 'error', 'message': result.stderr}, 500
    except Exception as e:
        return {'status': 'error', 'message': str(e)}, 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8099)
```

**Docker로 실행**:

```yaml
# docker-compose.yml에 추가
webhook:
  image: python:3.11-slim
  container_name: webhook-server
  ports:
    - "8099:8099"
  volumes:
    - ./webhook.py:/app/webhook.py
    - /var/run/docker.sock:/var/run/docker.sock
  working_dir: /app
  command: >
    sh -c "pip install flask && python webhook.py"
  restart: unless-stopped
```

---

## 🖥️ 방법 2: Windows/Mac 로컬 서버 (간단)

### Windows

**1. WSL2 + Docker Desktop 설치**

```powershell
# WSL2 설치
wsl --install

# Docker Desktop 설치
# https://www.docker.com/products/docker-desktop
```

**2. 공유 폴더 설정**

- 프로젝트 폴더를 공유 설정
- 플러그인 설정에서 로컬 경로 입력:
  ```
  C:\Users\YourName\Documents\blog
  ```

**3. Docker Compose 실행**

```powershell
cd C:\Users\YourName\Documents\blog\docker-deployment
docker-compose up -d
```

---

### Mac

**1. Docker Desktop 설치**

```bash
brew install --cask docker
```

**2. 공유 폴더 설정**

```bash
# 플러그인 설정에서 로컬 경로
/Users/YourName/Documents/blog
```

**3. Docker Compose 실행**

```bash
cd ~/Documents/blog/docker-deployment
docker-compose up -d
```

---

## ⚙️ 플러그인 설정

### 1. 로컬 서버 활성화

Obsidian Settings → Blog Sync:

**Local Server Settings**:
- ✅ Enable Local Server
- **Server Host**: `203.234.57.91` (또는 `localhost`)
- **Server Port**: `2052`
- **Server Path** (SMB):
  ```
  \\SERVERNAME\quartz-blog
  ```
  (또는 로컬 경로: `C:\Users\...\blog`)
  
- **Notes Path**: `src\site\notes`
- **Assets Path**: `src\site\img\user`

### 2. Webhook 설정 (선택)

- ✅ Enable Webhook
- **Webhook URL**: `http://SERVERIP:8099/restart-docker`
- **Webhook Token**: `your-secret-token`

---

## 🔍 테스트

### 1. Docker 컨테이너 확인

```bash
docker ps

# 실행 중인 컨테이너:
# - quartz-blog
# - quartz-proxy
# - nginx-loadbalancer
# - webhook-server (선택)
```

### 2. 로컬 서버 접속

```
http://localhost:2052
```

### 3. 외부 접속

```
https://yourdomain.duckdns.org:2052
```

### 4. 플러그인 연결 테스트

Obsidian:
- `Ctrl + P` → "연결 테스트"
- ✅ 로컬 서버: 성공 확인

---

## 🚨 문제 해결

### SMB 접근 불가

```bash
# Windows에서 네트워크 드라이브 연결
net use Z: \\SERVERNAME\quartz-blog /user:USERNAME PASSWORD
```

### Docker 컨테이너 재시작 안 됨

```bash
# 로그 확인
docker-compose logs quartz-blog

# 강제 재빌드
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### SSL 인증서 오류

```bash
# 인증서 갱신
sudo certbot renew --force-renewal

# Nginx 재시작
docker-compose restart nginx-loadbalancer
```

---

## 📚 다음 단계

로컬 서버 구축이 완료되었다면:

1. [📖 플러그인으로 첫 발행하기](./init.md#첫-발행하기)
2. [📖 Cloudflare Workers 설정](./cloudflare-workers.md) - 로드 밸런싱 (추후 추가)
3. [📖 고급 최적화](./advanced-optimization.md) - 성능 튜닝 (추후 추가)

---

## 🔗 참고 자료

- [OpenMediaVault 공식 문서](https://docs.openmediavault.org/)
- [Docker Compose 문서](https://docs.docker.com/compose/)
- [Let's Encrypt 문서](https://letsencrypt.org/docs/)
- [DuckDNS 가이드](https://www.duckdns.org/install.jsp)