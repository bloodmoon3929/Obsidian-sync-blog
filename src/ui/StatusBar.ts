import { Plugin } from 'obsidian';
import { SyncStatus } from '../types/settings';

/**
 * 블로그 동기화 상태를 표시하는 상태바
 */
export class BlogSyncStatusBar {
	private statusBarItem: HTMLElement;
	private status: SyncStatus = 'idle';
	private currentFile: string = '';

	constructor(private plugin: Plugin) {
		this.statusBarItem = this.plugin.addStatusBarItem();
		this.updateStatusBar();
	}

	/**
	 * 상태 업데이트
	 */
	setStatus(status: SyncStatus, file?: string): void {
		this.status = status;
		if (file) {
			this.currentFile = file;
		}
		this.updateStatusBar();
	}

	/**
	 * 상태바 UI 업데이트
	 */
	private updateStatusBar(): void {
		this.statusBarItem.empty();

		const container = this.statusBarItem.createDiv({ cls: 'blog-sync-status' });
		
		// 아이콘
		const icon = container.createSpan({ cls: 'blog-sync-icon' });
		icon.innerHTML = this.getIcon();
		
		// 텍스트
		const text = container.createSpan({ cls: 'blog-sync-text' });
		text.setText(this.getStatusText());
		
		// 색상 적용
		container.addClass(`status-${this.status}`);
	}

	/**
	 * 상태에 따른 아이콘 반환
	 */
	private getIcon(): string {
		switch (this.status) {
			case 'idle':
				return '📝';
			case 'syncing':
				return '🔄';
			case 'success':
				return '✅';
			case 'error':
				return '❌';
			default:
				return '📝';
		}
	}

	/**
	 * 상태에 따른 텍스트 반환
	 */
	private getStatusText(): string {
		switch (this.status) {
			case 'idle':
				return 'Blog: Ready';
			case 'syncing':
				return `Blog: Syncing${this.currentFile ? ` ${this.currentFile}` : ''}...`;
			case 'success':
				return `Blog: Synced${this.currentFile ? ` ${this.currentFile}` : ''}`;
			case 'error':
				return `Blog: Error${this.currentFile ? ` ${this.currentFile}` : ''}`;
			default:
				return 'Blog: Ready';
		}
	}

	/**
	 * 상태바 제거
	 */
	destroy(): void {
		this.statusBarItem.remove();
	}
}
