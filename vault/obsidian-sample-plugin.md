# obsidian-sample-plugin
Obsidian에서 공식적으로 제공하는 플러그인 개발용 예제이며 다음을 포함함

- 기본 플러그인 구조
- 설정창 구현 예제
- 커맨드(Command) 등록
- 리본 아이콘 추가
- 상태 저장(Storage) 예시
- 이벤트 등록 예시
- Modal, Suggest Modal 사용 예시


## 사용하는 이유
- TypeScript 기반 개발
- 안정적인 기본 구조 확보
- 공식 API 사용 예제 포함
- 최소한의 코드로 동작 가능한 플러그인 형태 제공

## 폴더 구조
```
obsidian-sample-plugin/
│── main.ts          # 플러그인 로직이 시작되는 핵심 파일
│── manifest.json    # Obsidian이 플러그인을 인식하는 메타 정보
│── styles.css       # 플러그인에서 사용하는 커스텀 스타일
│── package.json     # 빌드 설정 및 의존성
│── tsconfig.json    # 타입스크립트 설정
```

## 주요 파일 설명
### main.ts
플러그인의 핵심 로직이 들어가는 곳

- 플러그인 로드 시 실행(onload)
- 언로드 시 실행(onunload)
- 커맨드 등록
- 리본 아이콘 추가
- 설정 UI 호출
- Obsidian 이벤트 등록

```ts
export default class SamplePlugin extends Plugin {
  async onload() {
    console.log("Plugin loaded");

    this.addCommand({
      id: "sample-command",
      name: "Show a modal",
      callback: () => new SampleModal(this.app).open(),
    });
  }

  onunload() {
    console.log("Plugin unloaded");
  }
}
```

### manifest.json
플러그인 정보 정의 파일.

```ts
{
  "id": "sample-plugin",
  "name": "Sample Plugin",
  "version": "1.0.0",
  "minAppVersion": "0.15.0",
  "author": "Obsidian",
  "description": "A sample plugin for Obsidian",
  "isDesktopOnly": false
}
```

### settings / SettingTab
기본적으로 샘플에는 설정 탭이 구현

```ts
class SampleSettingTab extends PluginSettingTab {
  display(): void {
    const { containerEl } = this;

    new Setting(containerEl)
      .setName("API Key")
      .addText(text => text
        .setPlaceholder("Enter your key")
        .onChange(value => {
          this.plugin.settings.apiKey = value;
          this.plugin.saveSettings();
        }));
  }
}
```
![alt text](../Asset/samplesetting.png)

## 핵심 문법
### onload
Obsidian이 로딩될 때, 아래의 메서드가 실행됨
```ts
async onload() {
    this.addRibbonIcon("dice", "Sample Plugin", () => {
        new Notice("Hello from sample plugin!");
    });

    this.addCommand({
        id: "sample-plugin-command",
        name: "Trigger Sample Command",
        callback: () => {
            new Notice("Command executed!");
        },
    });

    this.addSettingTab(new SampleSettingTab(this.app, this));

    this.registerInterval(
        window.setInterval(() => console.log("interval"), 5 * 60 * 1000)
    );
}
```

### 사이드 바
사이드 바에 버튼을 추가할 수 있음
```ts
this.addRibbonIcon("dice", "Tooltip Text", () => {
    new Notice("Clicked!");
});
```

![alt text](../Asset/samplesidebar.png)

### 커맨드 팔레트
명령어를 추가 할 수 있음
```ts
this.addCommand({
    id: "my-command",
    name: "Run my command",
    callback: () => {
        new Notice("Command executed!");
    },
});
```

### 설정창
설정창을 만들수 있음
```ts
class SampleSettingTab extends PluginSettingTab {
    display() {
        const { containerEl } = this;

        new Setting(containerEl)
            .setName("Setting Name")
            .setDesc("Setting description here")
            .addText(text =>
                text.setPlaceholder("Enter value")
                    .setValue(this.plugin.settings.mySetting)
                    .onChange(async value => {
                        this.plugin.settings.mySetting = value;
                        await this.plugin.saveSettings();
                    })
            );
    }
}
```

### 저장
데이터를 가지고 오거나 저장할 수 있음
```ts
async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
}

async saveSettings() {
    await this.saveData(this.settings);
}
```

### 주기적 실행
주기적으로 실행 시킬수 있음
```ts
this.registerInterval(
    window.setInterval(() => console.log("interval"), 5 * 60 * 1000)
);
```