import { App, PluginSettingTab, Setting } from 'obsidian';
import BlogSyncPlugin from '../../main';

/**
 * 블로그 동기화 플러그인 설정 탭
 */
export class BlogSyncSettingTab extends PluginSettingTab {
	plugin: BlogSyncPlugin;

	constructor(app: App, plugin: BlogSyncPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// 헤더
		containerEl.createEl('h1', { text: '블로그 동기화 설정' });

		// === 블로그 설정 섹션 ===
		containerEl.createEl('h2', { text: '📁 블로그 설정' });

		new Setting(containerEl)
			.setName('블로그 폴더 경로')
			.setDesc('블로그 저장소의 절대 경로를 입력하세요')
			.addText(text => text
				.setPlaceholder('C:\\Users\\username\\blog')
				.setValue(this.plugin.settings.blogFolderPath)
				.onChange(async (value) => {
					this.plugin.settings.blogFolderPath = value;
					await this.plugin.saveSettings();
				}));

		// === Git 설정 섹션 ===
		containerEl.createEl('h2', { text: '🔀 Git 설정' });

		new Setting(containerEl)
			.setName('Git 활성화')
			.setDesc('Git을 통한 업로드를 활성화합니다')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.gitEnabled)
				.onChange(async (value) => {
					this.plugin.settings.gitEnabled = value;
					await this.plugin.saveSettings();
					this.display(); // 재렌더링
				}));

		if (this.plugin.settings.gitEnabled) {
			new Setting(containerEl)
				.setName('Git 브랜치')
				.setDesc('푸시할 브랜치 이름')
				.addText(text => text
					.setPlaceholder('main')
					.setValue(this.plugin.settings.gitBranch)
					.onChange(async (value) => {
						this.plugin.settings.gitBranch = value;
						await this.plugin.saveSettings();
					}));

			new Setting(containerEl)
				.setName('자동 커밋')
				.setDesc('동기화 시 자동으로 커밋합니다')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.gitAutoCommit)
					.onChange(async (value) => {
						this.plugin.settings.gitAutoCommit = value;
						await this.plugin.saveSettings();
					}));

			new Setting(containerEl)
				.setName('커밋 메시지')
				.setDesc('{{filename}}은 파일명으로 대체됩니다')
				.addText(text => text
					.setPlaceholder('Update blog post: {{filename}}')
					.setValue(this.plugin.settings.gitCommitMessage)
					.onChange(async (value) => {
						this.plugin.settings.gitCommitMessage = value;
						await this.plugin.saveSettings();
					}));
		}

		// === SFTP 설정 섹션 ===
		containerEl.createEl('h2', { text: '🌐 SFTP 설정' });

		new Setting(containerEl)
			.setName('SFTP 활성화')
			.setDesc('SFTP를 통한 업로드를 활성화합니다')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.sftpEnabled)
				.onChange(async (value) => {
					this.plugin.settings.sftpEnabled = value;
					await this.plugin.saveSettings();
					this.display(); // 재렌더링
				}));

		if (this.plugin.settings.sftpEnabled) {
			new Setting(containerEl)
				.setName('호스트')
				.setDesc('SFTP 서버 주소')
				.addText(text => text
					.setPlaceholder('example.com')
					.setValue(this.plugin.settings.sftpHost)
					.onChange(async (value) => {
						this.plugin.settings.sftpHost = value;
						await this.plugin.saveSettings();
					}));

			new Setting(containerEl)
				.setName('포트')
				.setDesc('SFTP 포트 번호 (기본: 22)')
				.addText(text => text
					.setPlaceholder('22')
					.setValue(String(this.plugin.settings.sftpPort))
					.onChange(async (value) => {
						this.plugin.settings.sftpPort = parseInt(value) || 22;
						await this.plugin.saveSettings();
					}));

			new Setting(containerEl)
				.setName('사용자명')
				.setDesc('SFTP 로그인 사용자명')
				.addText(text => text
					.setPlaceholder('username')
					.setValue(this.plugin.settings.sftpUsername)
					.onChange(async (value) => {
						this.plugin.settings.sftpUsername = value;
						await this.plugin.saveSettings();
					}));

			new Setting(containerEl)
				.setName('비밀번호')
				.setDesc('SFTP 로그인 비밀번호')
				.addText(text => {
					text.inputEl.type = 'password';
					text.setPlaceholder('password')
						.setValue(this.plugin.settings.sftpPassword)
						.onChange(async (value) => {
							this.plugin.settings.sftpPassword = value;
							await this.plugin.saveSettings();
						});
				});

			new Setting(containerEl)
				.setName('원격 경로')
				.setDesc('서버의 업로드 대상 경로')
				.addText(text => text
					.setPlaceholder('/var/www/html/blog')
					.setValue(this.plugin.settings.sftpRemotePath)
					.onChange(async (value) => {
						this.plugin.settings.sftpRemotePath = value;
						await this.plugin.saveSettings();
					}));
		}

		// === 업로드 전략 섹션 ===
		containerEl.createEl('h2', { text: '🚀 업로드 전략' });

		new Setting(containerEl)
			.setName('업로드 방식')
			.setDesc('Git과 SFTP의 업로드 방식을 선택하세요')
			.addDropdown(dropdown => dropdown
				.addOption('sequential', '순차 (Git → SFTP)')
				.addOption('parallel', '병렬 (동시 실행)')
				.addOption('fallback', 'Fallback (실패 시 다른 방법)')
				.setValue(this.plugin.settings.uploadStrategy)
				.onChange(async (value) => {
					this.plugin.settings.uploadStrategy = value as any;
					await this.plugin.saveSettings();
				}));

		// === 파일 처리 옵션 섹션 ===
		containerEl.createEl('h2', { text: '📝 파일 처리 옵션' });

		new Setting(containerEl)
			.setName('마크다운 변환')
			.setDesc('Obsidian 문법을 표준 마크다운으로 변환합니다')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.convertMarkdown)
				.onChange(async (value) => {
					this.plugin.settings.convertMarkdown = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('프론트매터 생성')
			.setDesc('YAML 프론트매터를 자동으로 생성합니다')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.generateFrontmatter)
				.onChange(async (value) => {
					this.plugin.settings.generateFrontmatter = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('참조 파일 복사')
			.setDesc('이미지 등 참조된 파일을 함께 복사합니다')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.copyAssets)
				.onChange(async (value) => {
					this.plugin.settings.copyAssets = value;
					await this.plugin.saveSettings();
				}));

		// === UI 설정 섹션 ===
		containerEl.createEl('h2', { text: '🎨 UI 설정' });

		new Setting(containerEl)
			.setName('상태바 표시')
			.setDesc('하단 상태바에 동기화 상태를 표시합니다')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showStatusBar)
				.onChange(async (value) => {
					this.plugin.settings.showStatusBar = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('알림 표시')
			.setDesc('동기화 결과를 알림으로 표시합니다')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showNotifications)
				.onChange(async (value) => {
					this.plugin.settings.showNotifications = value;
					await this.plugin.saveSettings();
				}));

		// === 테스트 버튼 ===
		containerEl.createEl('h2', { text: '🧪 테스트' });

		new Setting(containerEl)
			.setName('연결 테스트')
			.setDesc('Git 및 SFTP 연결을 테스트합니다')
			.addButton(button => button
				.setButtonText('테스트 실행')
				.setCta()
				.onClick(async () => {
					// TODO: 실제 테스트 로직 구현
					this.plugin.notificationManager.info('테스트 기능은 곧 구현됩니다!');
				}));
	}
}
