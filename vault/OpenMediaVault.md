# 자작 나스 제작기
우아한 테스 코스와 별개로 개인 서버가 있으면 좋을거 같아서 자작 나스를 제작하고 있었다. 그러다 4~5주차 자율주제로 미션을 진행하게 되어 만들고 있던 자작 나스와 연계해서 하면 좋을거 같다는 생각을 하게 되어 진행하게 됬다.

## 스펙
### 하드웨어
- **CPU** : intel 프로세서 N150 (4코어 4 스레드)
- **Ram** : DDR5 16GB
- **저장 공간** : 시게이트 HHD 4TB * 2 + 삼성 ssd 500GB + M.2 128GB

### 소프트웨어
- **OS** : OpenMediaVault
- **웹드라이버** : NextCloud

## 선정 이유
intel의 N150 CPU는 정식으로 발매된 제품이 아닌 하청으로 만들어진 특화 CPU입니다.

기존의 CPU가 15~35W의 전력을 소모하는데 반해 이 CPU는 5W의 저전력을 소모하고, 이는 24시간 동작해야 하는 NAS의 특성을 생각하면 좋은 선택일 것이다.

16GB 램을 선정한 이유는 NAS를 파일 공유의 목적만으로 사용한다면 4GB면 충분했을 것이다. 하지만 이 NAS를 제작하기로 결정했을 때부터 개인 서버, 특히 블로그, 용도로도 사용할 것을 구상하고있었기에 충분한 램 용량을 확보 하였다.

저장공간에 대해서 데이터가 안정적으로 저장되어야 하기에 4TB 하드 디스크를 Raid 1로 묶어서 파일이 안정적으로 보관될 수 있게 하였다. M.2는 오로지 OS를 관리 하는 용도로 사용하고 있으며, SSD는 추후 설명할 도커 컴포넌트를 관리 하는 용도로 사용되고 있다.

많은 Nas OS중 OMV를 사용한 이유는 많은 OS중 가장 낮은 수준의 하드웨어에서도 돌아가기 때문이다. N150 CPU는 저 성능 CPU에 속하기 때문에 최대한 부하 없이 사용하기 위해 이러한 선택을 하였다.

## OpenMediaVault 설치
[OpenMediaVault 설치 링크](openmediavault.org/download.html)

OS 설치 방법은 다른 OS를 설치하는 것처럼 iso 파일을 USB에 넣어 부팅하는 것이다. 부팅시 나오는 화면은 다음과 같을 것이다.

![alt text](./OMVinit.png)

Install을 누르면 동작이 멈춘것처럼 보이지만 잠시 기다리면 리눅스 부팅 화면과 유사한 화면이 나오게 될  것이다.

![alt text](./SelectLanguage.png)
이 화면은 언어 선택화면인데 이것은 OMV의 언어와는 상관없고, 설치시의 언어 설정이다.

![alt text](./location.png)
다음은 지역 설정인데, 이도 나중에 설정 가능하다.

![alt text](./KeyBoard.png)
다음은 키보드 언어 세팅인데, 이 역시 OMV와는 관련이 없고, 한글을 입력해야 하는 설정이 없다.

![alt text](./Wait.png)
모두 선택하고 나면 다음과 같은 화면이 뜰텐데 10분정도 걸리니 대기하면 된다.

![alt text](./NasName.png)
다음은 이 Nas의 이름을 지어주는 화면이다. 기본은 openmediavault지만 원하는 이름으로 바꾸어주면 된다. 나중에 네트워크 내에서 파일을 공유할때 뜨는 이름이니 적절한 이름을 선택해주면 된다.

![alt text](./DomainName.png)
다음은 도메인 이름을 정하는 것인데, 이것은 그냥 local 기본값으로 선택하면 된다.

![alt text](./RootPassword.png)
이 부분은 중요한데 root의 비밀번호를 정해주는 부분이다. 초반을 제외하고 콘솔로 접근 할일은 거의 없지만 이 부분은 보안과 관련되어 있기에 신중히 정해야 한다.

![alt text](./Timesetting.png)
다음은 시간 선택이고, 위에서 선택한 지역의 시간중 선택할 수 있다. 어쩌피 이 부분은 추후 변경 가능하기에 중요하지는 않다.

![alt text](./PartionDisk.png)

![alt text](./SeletDisk.png)
이 부분은 Nas OS가 설치될 공간을 선택하는 곳이고, 설치시 내부의 데이터는 모두 날라가기에 이 점을 주의해야 한다.

![alt text](./install.png)
이 부분은 설치 과정이고 오래 걸리는 작업이기에 여유를 가지고 기다리면 된다.

![alt text](./Package.png)

![alt text](./PackageManager.png)

다음은 OMV의 업데이트를 관리하는 패키지 매니저를 선택하는 부분이다.

당연하게도 한국서버가 가장 빠를 것이며, 미러 서버는 아무것이나 선택해도 된다.

![alt text](./proxy.png)
다음은 프록시 설정인데 이는 추후에 가능하니 비우고 진행해도 된다.

![alt text](./apt.png)

![alt text](./installing.png)

이 부분이 가장 오래 걸리는 작업이기에 마음의 여유를 가지고 기다리면 된다.

![alt text](./Finish.png)
이 화면이 뜬다면 모든 설치가 끝난것이다. 이제 Nas를 재부팅하게 된다면 다음과 같은 화면이 나올 것이다.

![alt text](./Debian.png)
이 화면을 선택하면 되고 이후에는 콘솔 화면이 뜨게된다.

## OpenMediaVault 세팅
### 1. TimeZone 설정

![alt text](./TimeZone.png)


### 2. SSL 생성

![alt text](./SSL1.png)

![alt text](./SSL2.png)

### 3. Workbench 설정

![alt text](./Workbrench.png)
(SSL 설정하게 되면 자동 로그아웃 됨)

![alt text](./logout.png)

![alt text](./login.png)

### 4. Hostname
(SAMBA에서 보일 이름)

![alt text](./Hostname.png)

### 5. Raid 플러그인 설치

![alt text](./Raid.png)

![alt text](./Raidinstall.png)

![alt text](./Multiple%20Device.png)

### 6. 디스크 포멧

![alt text](./format.png)

![alt text](./wipe.png)

![alt text](./Quick.png)

### 7. 레이드 구성

![alt text](./setRaid.png)

![alt text](./Mirroring.png)
(미러링 중임)

![alt text](./compliteMirroring.png)

### 8. 파일 시스템 등록

![alt text](./filesystem.png)

![alt text](./FileType.png)

![alt text](./CreateFileSystem.png)

![alt text](./fileTag.png)
(추후 태그를 통해 할당 가능)

### 9. 공유폴더

![alt text](./SharedFolder.png)

![alt text](./createShared.png)

### 10. 사용자 생성

![alt text](./Users.png)

![alt text](./createUser.png)

![alt text](./userSetting.png)

### 11. SMB 설정

![alt text](./SMBsetting.png)

![alt text](./settingSMB.png)

![alt text](./sharedSMB.png)

![alt text](./SharedOption.png)

### 12. Docker
(CLI로 OMV 확장 설치)

```
sudo wget -O - https://github.com/OpenMediaVault-Plugin-Developers/installScript/raw/master/install | sudo bash
```

![alt text](./CLIDocker.png)

(Docker repo 활성화)

![alt text](./Dockerrepo.png)

(Compose 설치)

![alt text](./Compose.png)

![alt text](./installcompose.png)

(Compose 세팅)

![alt text](./Compose%20setting.png)

## nextcloud 세팅
### dockwr를 통한 nextcloud 생성

![alt text](./nextcloud.png)

![alt text](./create_nextcloud.png)

#### yml 파일
```
services:
  db:
    image: mariadb:latest
    container_name: nextcloud-mariadb
    restart: always
    command: --transaction-isolation=READ-COMMITTED --log-bin=binlog --binlog-format=ROW
    volumes:
      - /srv/dev-disk-by-uuid-7847be5b-9750-4037-93b8-3ed042e81b36/4테라/next_db:/var/lib/mysql
    environment:
      - MYSQL_ROOT_PASSWORD={비밀번호}
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER=nextcloud
      - MYSQL_PASSWORD={비밀번호}
    networks:
      - next-network
    ports:
      - "3380:3306"

  redis:
    image: redis:alpine
    container_name: nextcloud-redis
    restart: always
    command: redis-server --requirepass rlatkddn@12
    networks:
      - next-network



  app:
    image: nextcloud:latest
    container_name: nextcloud
    ports:
      - 8080:80
    volumes:
      - /srv/dev-disk-by-uuid-7847be5b-9750-4037-93b8-3ed042e81b36/4테라/nextcloud:/var/www/html
      - /srv/dev-disk-by-uuid-7847be5b-9750-4037-93b8-3ed042e81b36/4테라/nextcloud-php.ini:/usr/local/etc/php/conf.d/nextcloud.ini
    restart: always
    environment:
      - MYSQL_HOST=db:3306
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER=nextcloud
      - MYSQL_PASSWORD={비밀번호}
      - REDIS_HOST=redis
      - REDIS_HOST_PASSWORD={비밀번호}
    depends_on:
      - db
      - redis
    networks:
      - next-network

volumes:
  next_db:
  nextcloud:
networks:
  next-network:
```
##### yml 파일 설명
```
Nextcloud (웹앱)
   │
   ├── DB (MariaDB)
   │
   └── 캐시 서버 (Redis)
```
세개의 컨테이너는 같은 네트워크에 연결되어 있음

##### 1. DB
NextCloud에서 사용하는 데이터베이스 서버

**주요 설정**
|설정|설명|
|--|--|
|image: mariadb:lastest|최신의 MariaDB 사용|
|command|DB 트랜잭션 격리 수준과 바이너리 로그 형식 설정|
|volumes|호스트의 디렉토리를 /var/lib/mysql에 마운트 → DB 데이터 영구 저장|
|environment|MariaDB 초기 설정용 환경 변수 (DB명, 사용자, 비밀번호 등)|
|ports|3380 포트로 외부 접근 가능 (내부 DB포트는 3306)|


##### 2. redis
Nextcloud의 메모리 캐시 및 락(lock) 관리용 서버입니다.
속도를 높이고 동시접속 충돌을 방지하는 데 사용됩니다.

**주요 설정**
|설정|설명|
|--|--|
|image: redis:alpine|가벼운 알파인 기반 Redis|
|command|Redis 서버 실행 시 비밀번호 설정 (--requirepass)|
|networks|다른 컨테이너와 같은 네트워크로 연결|

##### 3. app
Nextcloud의 웹 애플리케이션 서버입니다.
웹 브라우저로 접속할 때 이 컨테이너가 사용자에게 서비스합니다.

**주요 설정**
|설정|설명|
|--|--|
|ports: 8080:80|호스트의 8080 포트를 컨테이너의 80 포트로 연결|
|volumes|Nextcloud 앱 데이터와 PHP 설정을 영구 보존|
|environment|DB 및 Redis 연결 정보 설정|
|depends_on|db, redis가 먼저 실행되어야 함을 지정|
|restart: always|예기치 않게 꺼져도 자동 재시작|


##### 4. volumes / networks
- volumes: Docker 내부 관리용 볼륨 정의 (현재는 이름만 지정, 실사용은 위에서 host-path로 연결)

- networks: 세 컨테이너가 통신할 가상 네트워크 정의

### Nextcloud config.php에 Redis 설정 추가
위에서 언급한 redis을 사용하기 위한 추가적인 절차이다.

```bash
docker exec -it nextcloud bash

apt update && apt install nano -y
nano /var/www/html/config/config.php
```

config.php 파일 끝부분 ); 바로 위에 다음을 추가하면 된다.
```php
'memcache.local' => '\OC\Memcache\APCu',
  'memcache.locking' => '\OC\Memcache\Redis',
  'memcache.distributed' => '\OC\Memcache\Redis',
  'redis' => 
  array (
    'host' => 'redis',
    'port' => 6379,
    'password' => 'redis비밀번호입력',
  ),
```

### PHP 설정
php를 설정하기 않아도 사용할 수 있으나 대용량 파일 업로드 등을 할 수 없기에 추가한다.

```bash
sudo nano /srv/dev-disk-by-uuid-7847be5b-9750-4037-93b8-3ed042e81b36/4테라/nextcloud-php.ini
```

```php
memory_limit = 512M
upload_max_filesize = 16G
post_max_size = 16G
max_execution_time = 3600
max_input_time = 3600
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=10000
opcache.revalidate_freq=60
opcache.save_comments=1
```

### MySQL 4바이트 문자 지원 (이모지 등)
이것부터는 추가적인 세팅이기에 따라하지 않아도 된다.

```bash
docker exec -it nextcloud bash

su -s /bin/bash www-data

php occ maintenance:mode --on

php occ config:system:set mysql.utf8mb4 --type boolean --value="true"
php occ maintenance:repair

php occ maintenance:mode --off

exit
exit
```

### 유지관리 시간 설정
```bash
docker exec -it nextcloud bash
su -s /bin/bash www-data

php occ config:system:set maintenance_window_start --type integer --value 3

exit
exit
```

### 국가 설정
```bash
docker exec -it nextcloud bash
su -s /bin/bash www-data

php occ config:system:set default_phone_region --value="KR"

exit
exit
```

### Apache 타임아웃 설정
```bash
sudo nano /srv/dev-disk-by-uuid-7847be5b-9750-4037-93b8-3ed042e81b36/4테라/nextcloud-apache.conf
```

```apache
# Apache timeout settings
Timeout 3600
ProxyTimeout 3600
KeepAlive On
KeepAliveTimeout 60
MaxKeepAliveRequests 100

# Request size limits
LimitRequestBody 0

# FastCGI settings
<IfModule mod_fcgid.c>
  FcgidIOTimeout 3600
  FcgidConnectTimeout 3600
  FcgidBusyTimeout 3600
  FcgidIdleTimeout 3600
  MaxRequestLen 1073741824
</IfModule>

# Proxy settings
<IfModule mod_proxy.c>
  ProxyTimeout 3600
</IfModule>
```

### Next cloud 타임아웃 설정
```bash
# 유지보수 모드
docker exec -u www-data nextcloud php occ maintenance:mode --on

# 타임아웃 관련 설정
docker exec -u www-data nextcloud php occ config:system:set timeout --value=3600 --type=integer
docker exec -u www-data nextcloud php occ config:system:set filelocking.ttl --value=3600 --type=integer
docker exec -u www-data nextcloud php occ config:system:set files_external.max_chunk_size --value=10485760
docker exec -u www-data nextcloud php occ config:app:set files max_chunk_size --value=10485760

# MySQL 타임아웃
docker exec -u www-data nextcloud php occ config:system:set dbdriveroptions 'PDO::MYSQL_ATTR_INIT_COMMAND' --value="SET wait_timeout = 28800"

# 유지보수 모드 해제
docker exec -u www-data nextcloud php occ maintenance:mode --off
```

### Corn
Nextcloud의 백그라운드 작업을 실행하는 명령

파일 스캔, 미리보기 생성, 휴지통 비우기, 버전 정리, 알림 전송, 앱 업데이트 확인, 로그 정리등의 기능을 처리한다.

![alt text](./Cron.png)

![alt text](./CronSetting.png)

위의 세팅으로 5분마다 백그라운드 작업을 처리한다.

### 미리보기 최적화
```bash
docker exec -u www-data nextcloud php occ config:app:set previewgenerator squareSizes --value="32 256"
docker exec -u www-data nextcloud php occ config:app:set previewgenerator widthSizes --value="256 384"
docker exec -u www-data nextcloud php occ config:app:set previewgenerator heightSizes --value="256"
```

