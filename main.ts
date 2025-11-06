import { Plugin, TFile } from 'obsidian';
import { BlogSyncSettings, DEFAULT_SETTINGS } from './src/types/settings';
import { BlogSyncStatusBar } from './src/ui/StatusBar';
import { NotificationManager } from './src/ui/Notification';
import { BlogSyncSettingTab } from './src/ui/SettingTab';

export default class BlogSyncPlugin extends Plugin {
	settings: BlogSyncSettings;
	statusBar: BlogSyncStatusBar;
	notificationManager: NotificationManager;

	async onload() {
		console.log('Loading Blog Sync Plugin');

		// 설정 로드
		await this.loadSettings();

		// UI 초기화
		this.notificationManager = new NotificationManager(this.settings.showNotifications);
		this.statusBar = new BlogSyncStatusBar(this);

		// 리본 아이콘 추가
		this.addRibbonIcon('upload-cloud', '블로그에 동기화', async (evt: MouseEvent) => {
			await this.syncCurrentFile();
		});

		// 커맨드 추가
		this.addCommand({
			id: 'sync-current-file',
			name: '현재 파일을 블로그에 동기화',
			callback: async () => {
				await this.syncCurrentFile();
			}
		});

		this.addCommand({
			id: 'sync-all-files',
			name: '모든 파일을 블로그에 동기화',
			callback: async () => {
				await this.syncAllFiles();
			}
		});

		// 설정 탭 추가
		this.addSettingTab(new BlogSyncSettingTab(this.app, this));

		this.notificationManager.info('블로그 동기화 플러그인이 로드되었습니다!');
	}

	onunload() {
		console.log('Unloading Blog Sync Plugin');
		this.statusBar.destroy();
	}

	/**
	 * 현재 파일 동기화
	 */
	async syncCurrentFile(): Promise<void> {
		const file = this.app.workspace.getActiveFile();
		
		if (!file) {
			this.notificationManager.warning('동기화할 파일이 없습니다.');
			return;
		}

		if (file.extension !== 'md') {
			this.notificationManager.warning('마크다운 파일만 동기화할 수 있습니다.');
			return;
		}

		// 블로그 폴더 경로 확인
		if (!this.settings.blogFolderPath) {
			this.notificationManager.error('블로그 폴더 경로를 설정해주세요.');
			return;
		}

		try {
			// 상태 업데이트
			this.statusBar.setStatus('syncing', file.basename);
			
			// TODO: 실제 동기화 로직 구현
			// 임시로 2초 대기
			await new Promise(resolve => setTimeout(resolve, 2000));
			
			// 성공
			this.statusBar.setStatus('success', file.basename);
			this.notificationManager.success(`"${file.basename}" 파일이 성공적으로 동기화되었습니다!`);
			
			// 3초 후 idle 상태로
			setTimeout(() => {
				this.statusBar.setStatus('idle');
			}, 3000);
			
		} catch (error) {
			console.error('Sync error:', error);
			this.statusBar.setStatus('error', file.basename);
			this.notificationManager.error(`동기화 실패: ${error.message}`);
			
			// 5초 후 idle 상태로
			setTimeout(() => {
				this.statusBar.setStatus('idle');
			}, 5000);
		}
	}

	/**
	 * 모든 파일 동기화
	 */
	async syncAllFiles(): Promise<void> {
		const files = this.app.vault.getMarkdownFiles();
		
		if (files.length === 0) {
			this.notificationManager.warning('동기화할 파일이 없습니다.');
			return;
		}

		if (!this.settings.blogFolderPath) {
			this.notificationManager.error('블로그 폴더 경로를 설정해주세요.');
			return;
		}

		this.notificationManager.info(`${files.length}개 파일 동기화를 시작합니다...`);
		
		// TODO: 실제 동기화 로직 구현
		this.notificationManager.info('전체 동기화 기능은 곧 구현됩니다!');
	}

	/**
	 * 설정 로드
	 */
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	/**
	 * 설정 저장
	 */
	async saveSettings() {
		await this.saveData(this.settings);
		
		// 알림 설정 업데이트
		if (this.notificationManager) {
			this.notificationManager.setEnabled(this.settings.showNotifications);
		}
	}
}
