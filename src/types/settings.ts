// src/types/settings.ts

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface PublishedNoteInfo {
    hash: string;
    timestamp: number;
}

export interface BlogSyncSettings {
    // 기본 설정
    blogFolderPath: string;
    showNotifications: boolean;
    
    // 발행 설정
    publishTarget: 'github' | 'server';
    
    // GitHub 설정
    githubToken: string;
    githubUsername: string;
    githubRepo: string;
    githubBranch: string;
    publicBasePath: string;   // 웹 퍼블리싱 기본 경로 (예: src/site)
    blogContentPath: string;  // 노트가 저장될 경로 (예: notes)
    blogAssetsPath: string;   // 이미지가 저장될 경로 (예: img/user)
    
    // 서버 설정 (FTP/SFTP)
    serverType: 'ftp' | 'sftp';
    serverHost: string;
    serverPort: number;
    serverUsername: string;
    serverPassword: string;
    serverPath: string;
	publishedNotes: Record<string, PublishedNoteInfo>;
}

export const DEFAULT_SETTINGS: BlogSyncSettings = {
    blogFolderPath: '',
    showNotifications: true,
    
    publishTarget: 'github',
    
    githubToken: '',
    githubUsername: '',
    githubRepo: '',
    githubBranch: 'main',
    publicBasePath: 'src/site',
    blogContentPath: 'notes',
    blogAssetsPath: 'img/user',
    
    serverType: 'sftp',
    serverHost: '',
    serverPort: 22,
    serverUsername: '',
    serverPassword: '',
    serverPath: '',
	publishedNotes: {}
};