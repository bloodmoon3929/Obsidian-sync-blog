/**
 * 플러그인 설정 인터페이스
 */
export interface BlogSyncSettings {
	// 블로그 설정
	blogFolderPath: string;
	
	// Git 설정
	gitEnabled: boolean;
	gitBranch: string;
	gitAutoCommit: boolean;
	gitCommitMessage: string;
	
	// SFTP 설정
	sftpEnabled: boolean;
	sftpHost: string;
	sftpPort: number;
	sftpUsername: string;
	sftpPassword: string;
	sftpRemotePath: string;
	
	// 업로드 전략
	uploadStrategy: 'sequential' | 'parallel' | 'fallback';
	
	// 파일 처리 옵션
	convertMarkdown: boolean;
	generateFrontmatter: boolean;
	copyAssets: boolean;
	
	// UI 설정
	showStatusBar: boolean;
	showNotifications: boolean;
}

/**
 * 기본 설정 값
 */
export const DEFAULT_SETTINGS: BlogSyncSettings = {
	// 블로그 설정
	blogFolderPath: '',
	
	// Git 설정
	gitEnabled: true,
	gitBranch: 'main',
	gitAutoCommit: true,
	gitCommitMessage: 'Update blog post: {{filename}}',
	
	// SFTP 설정
	sftpEnabled: false,
	sftpHost: '',
	sftpPort: 22,
	sftpUsername: '',
	sftpPassword: '',
	sftpRemotePath: '/var/www/html/blog',
	
	// 업로드 전략
	uploadStrategy: 'sequential',
	
	// 파일 처리 옵션
	convertMarkdown: true,
	generateFrontmatter: true,
	copyAssets: true,
	
	// UI 설정
	showStatusBar: true,
	showNotifications: true,
};

/**
 * 업로드 상태
 */
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

/**
 * 알림 타입
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';
