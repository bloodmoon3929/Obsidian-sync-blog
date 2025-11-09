// src/ui/SettingTab.ts

import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import BlogSyncPlugin from '../../main';
import { GitHubPublisher } from '../publisher/GitHubPublisher';

export class BlogSyncSettingTab extends PluginSettingTab {
    plugin: BlogSyncPlugin;

    constructor(app: App, plugin: BlogSyncPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Blog Sync Settings' });

        // ============================================
        // 기본 설정
        // ============================================
        containerEl.createEl('h3', { text: 'Basic Settings' });

        new Setting(containerEl)
            .setName('Blog folder path')
            .setDesc('로컬 블로그 폴더 경로')
            .addText(text => text
                .setPlaceholder('C:/Users/username/blog')
                .setValue(this.plugin.settings.blogFolderPath)
                .onChange(async (value) => {
                    this.plugin.settings.blogFolderPath = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Show notifications')
            .setDesc('작업 완료 시 알림 표시')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showNotifications)
                .onChange(async (value) => {
                    this.plugin.settings.showNotifications = value;
                    await this.plugin.saveSettings();
                }));

        // ============================================
        // 발행 대상 선택
        // ============================================
        containerEl.createEl('h3', { text: 'Publish Target' });

        new Setting(containerEl)
            .setName('Publish to')
            .setDesc('노트를 발행할 대상을 선택하세요')
            .addDropdown(dropdown => dropdown
                .addOption('github', 'GitHub Repository')
                .addOption('server', 'Personal Server (FTP/SFTP)')
                .setValue(this.plugin.settings.publishTarget)
                .onChange(async (value: 'github' | 'server') => {
                    this.plugin.settings.publishTarget = value;
                    await this.plugin.saveSettings();
                    this.display(); // UI 새로고침
                }));

        // ============================================
        // GitHub 설정
        // ============================================
        if (this.plugin.settings.publishTarget === 'github') {
            this.displayGitHubSettings(containerEl);
        }

        // ============================================
        // 서버 설정
        // ============================================
        if (this.plugin.settings.publishTarget === 'server') {
            this.displayServerSettings(containerEl);
        }
    }

    /**
     * GitHub 설정 UI
     */
    private displayGitHubSettings(containerEl: HTMLElement): void {
        containerEl.createEl('h3', { text: '⚙️ GitHub Settings' });

        // GitHub Token
        new Setting(containerEl)
            .setName('GitHub Token')
            .setDesc('GitHub Personal Access Token (repo 권한 필요)')
            .addText(text => {
                text
                    .setPlaceholder('ghp_xxxxxxxxxxxx')
                    .setValue(this.plugin.settings.githubToken)
                    .onChange(async (value) => {
                        this.plugin.settings.githubToken = value;
                        await this.plugin.saveSettings();
                    });
                text.inputEl.type = 'password';
                return text;
            })
            .addButton(button => button
                .setButtonText('How to get token?')
                .onClick(() => {
                    window.open('https://github.com/settings/tokens/new');
                }));

        // GitHub Username
        new Setting(containerEl)
            .setName('GitHub Username')
            .setDesc('GitHub 사용자 이름')
            .addText(text => text
                .setPlaceholder('your-username')
                .setValue(this.plugin.settings.githubUsername)
                .onChange(async (value) => {
                    this.plugin.settings.githubUsername = value;
                    await this.plugin.saveSettings();
                }));

        // Repository Name
        new Setting(containerEl)
            .setName('Repository Name')
            .setDesc('블로그 저장소 이름')
            .addText(text => text
                .setPlaceholder('my-blog')
                .setValue(this.plugin.settings.githubRepo)
                .onChange(async (value) => {
                    this.plugin.settings.githubRepo = value;
                    await this.plugin.saveSettings();
                }));

        // Branch
        new Setting(containerEl)
            .setName('Branch')
            .setDesc('푸시할 브랜치 이름')
            .addText(text => text
                .setPlaceholder('main')
                .setValue(this.plugin.settings.githubBranch)
                .onChange(async (value) => {
                    this.plugin.settings.githubBranch = value;
                    await this.plugin.saveSettings();
                }));

        // Blog URL
        new Setting(containerEl)
            .setName('Blog URL')
            .setDesc('블로그 주소 (예: https://username.github.io/repo)')
            .addText(text => text
                .setPlaceholder('https://username.github.io/repo')
                .setValue(this.plugin.settings.blogUrl)
                .onChange(async (value) => {
                    this.plugin.settings.blogUrl = value;
                    await this.plugin.saveSettings();
                }));

        // Public Base Path
        new Setting(containerEl)
            .setName('Public Base Path')
            .setDesc('웹 퍼블리싱 기본 경로 (예: src/site) - Quartz 빌드 시 루트가 되는 경로')
            .addText(text => text
                .setPlaceholder('src/site')
                .setValue(this.plugin.settings.publicBasePath)
                .onChange(async (value) => {
                    this.plugin.settings.publicBasePath = value;
                    await this.plugin.saveSettings();
                }));

        // Blog Content Path
        new Setting(containerEl)
            .setName('Blog Content Path')
            .setDesc('노트 저장 경로 (예: notes) - Public Base Path 하위 경로')
            .addText(text => text
                .setPlaceholder('notes')
                .setValue(this.plugin.settings.blogContentPath)
                .onChange(async (value) => {
                    this.plugin.settings.blogContentPath = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Blog Assets Path')
            .setDesc('이미지 저장 경로 (예: img/user) - Public Base Path 하위 경로')
            .addText(text => text
                .setPlaceholder('img/user')
                .setValue(this.plugin.settings.blogAssetsPath)
                .onChange(async (value) => {
                    this.plugin.settings.blogAssetsPath = value;
                    await this.plugin.saveSettings();
                }));

        // 연결 테스트 버튼
        new Setting(containerEl)
            .setName('Test Connection')
            .setDesc('GitHub 연결 테스트')
            .addButton(button => button
                .setButtonText('Test Connection')
                .setCta()
                .onClick(async () => {
                    button.setDisabled(true);
                    button.setButtonText('Testing...');
                    
                    try {
                        const publisher = new GitHubPublisher(this.plugin, {
                            githubToken: this.plugin.settings.githubToken,
                            githubUsername: this.plugin.settings.githubUsername,
                            githubRepo: this.plugin.settings.githubRepo,
                            githubBranch: this.plugin.settings.githubBranch,
                            publicBasePath: this.plugin.settings.publicBasePath,
                            blogContentPath: this.plugin.settings.blogContentPath,
                            blogAssetsPath: this.plugin.settings.blogAssetsPath
                        });

                        const success = await publisher.testConnection();
                        
                        if (success) {
                            button.setButtonText('✅ Success!');
                        } else {
                            button.setButtonText('❌ Failed');
                        }
                    } catch (error) {
                        new Notice('Connection test failed: ' + error.message);
                        button.setButtonText('❌ Failed');
                    }
                    
                    setTimeout(() => {
                        button.setDisabled(false);
                        button.setButtonText('Test Connection');
                    }, 3000);
                }));

        // 설정 가이드
        const guideEl = containerEl.createDiv({ cls: 'setting-item-description' });
        guideEl.style.padding = '16px';
        guideEl.style.marginTop = '16px';
        guideEl.style.border = '1px solid var(--background-modifier-border)';
        guideEl.style.borderRadius = '8px';
        guideEl.style.backgroundColor = 'var(--background-secondary)';
        
        guideEl.createEl('h4', { text: '📖 Setup Guide' });
        guideEl.createEl('ol').innerHTML = `
            <li>GitHub에서 Personal Access Token을 생성하세요 (repo 권한 필요)</li>
            <li>위의 설정을 모두 입력하세요</li>
            <li>"Test Connection" 버튼으로 연결을 확인하세요</li>
            <li>Publication Center에서 노트를 선택하고 발행하세요</li>
        `;
    }

    /**
     * 서버 설정 UI
     */
    private displayServerSettings(containerEl: HTMLElement): void {
        containerEl.createEl('h3', { text: '🖥️ Server Settings' });

        // Server Type
        new Setting(containerEl)
            .setName('Server Type')
            .setDesc('서버 연결 방식')
            .addDropdown(dropdown => dropdown
                .addOption('sftp', 'SFTP (SSH File Transfer)')
                .addOption('ftp', 'FTP (File Transfer Protocol)')
                .setValue(this.plugin.settings.serverType)
                .onChange(async (value: 'ftp' | 'sftp') => {
                    this.plugin.settings.serverType = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        // Server Host
        new Setting(containerEl)
            .setName('Server Host')
            .setDesc('서버 주소 또는 IP')
            .addText(text => text
                .setPlaceholder('example.com or 192.168.1.100')
                .setValue(this.plugin.settings.serverHost)
                .onChange(async (value) => {
                    this.plugin.settings.serverHost = value;
                    await this.plugin.saveSettings();
                }));

        // Server Port
        new Setting(containerEl)
            .setName('Server Port')
            .setDesc(this.plugin.settings.serverType === 'sftp' ? 'SFTP 포트 (기본: 22)' : 'FTP 포트 (기본: 21)')
            .addText(text => text
                .setPlaceholder(this.plugin.settings.serverType === 'sftp' ? '22' : '21')
                .setValue(String(this.plugin.settings.serverPort))
                .onChange(async (value) => {
                    const port = parseInt(value);
                    if (!isNaN(port)) {
                        this.plugin.settings.serverPort = port;
                        await this.plugin.saveSettings();
                    }
                }));

        // Username
        new Setting(containerEl)
            .setName('Username')
            .setDesc('서버 사용자 이름')
            .addText(text => text
                .setPlaceholder('username')
                .setValue(this.plugin.settings.serverUsername)
                .onChange(async (value) => {
                    this.plugin.settings.serverUsername = value;
                    await this.plugin.saveSettings();
                }));

        // Password
        new Setting(containerEl)
            .setName('Password')
            .setDesc('서버 비밀번호')
            .addText(text => {
                text
                    .setPlaceholder('password')
                    .setValue(this.plugin.settings.serverPassword)
                    .onChange(async (value) => {
                        this.plugin.settings.serverPassword = value;
                        await this.plugin.saveSettings();
                    });
                text.inputEl.type = 'password';
                return text;
            });

        // Remote Path
        new Setting(containerEl)
            .setName('Remote Path')
            .setDesc('서버의 블로그 경로 (예: /var/www/blog)')
            .addText(text => text
                .setPlaceholder('/var/www/blog')
                .setValue(this.plugin.settings.serverPath)
                .onChange(async (value) => {
                    this.plugin.settings.serverPath = value;
                    await this.plugin.saveSettings();
                }));

        // Test Connection (서버용)
        new Setting(containerEl)
            .setName('Test Connection')
            .setDesc('서버 연결 테스트')
            .addButton(button => button
                .setButtonText('Test Connection')
                .setCta()
                .onClick(async () => {
                    new Notice('서버 연결 기능은 곧 구현됩니다!');
                    // TODO: 서버 연결 테스트 구현
                }));

        // 설정 가이드
        const guideEl = containerEl.createDiv({ cls: 'setting-item-description' });
        guideEl.style.padding = '16px';
        guideEl.style.marginTop = '16px';
        guideEl.style.border = '1px solid var(--background-modifier-border)';
        guideEl.style.borderRadius = '8px';
        guideEl.style.backgroundColor = 'var(--background-secondary)';
        
        guideEl.createEl('h4', { text: '📖 Setup Guide' });
        guideEl.createEl('p', { 
            text: 'SFTP는 SSH 기반으로 더 안전하며, FTP보다 권장됩니다.' 
        });
        guideEl.createEl('ol').innerHTML = `
            <li>서버 접속 정보를 모두 입력하세요</li>
            <li>"Test Connection" 버튼으로 연결을 확인하세요</li>
            <li>Publication Center에서 노트를 선택하고 발행하세요</li>
        `;
    }
}