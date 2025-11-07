// src/ui/PublicationCenterModal.ts
<<<<<<< HEAD
import { App, Modal, TFile, Notice } from 'obsidian';
import BlogSyncPlugin from '../../main';
=======

import { App, Modal, TFile, Notice } from 'obsidian';
import BlogSyncPlugin from '../../main';
import { GitHubPublisher } from '../publisher/GitHubPublisher';
>>>>>>> feature/upload

interface NoteStatus {
    file: TFile;
    status: 'unpublished' | 'changed' | 'deleted' | 'published';
    lastPublished?: number;
    hash?: string;
}

export class PublicationCenterModal extends Modal {
    plugin: BlogSyncPlugin;
    notes: NoteStatus[] = [];
    selectedNotes: Set<string> = new Set();
<<<<<<< HEAD
=======
    private publisher: GitHubPublisher | null = null;
>>>>>>> feature/upload

    constructor(app: App, plugin: BlogSyncPlugin) {
        super(app);
        this.plugin = plugin;
<<<<<<< HEAD
=======
        
        // Publisher 초기화
        if (this.plugin.settings.publishTarget === 'github') {
            this.publisher = new GitHubPublisher(this.plugin, {
                githubToken: this.plugin.settings.githubToken,
                githubUsername: this.plugin.settings.githubUsername,
                githubRepo: this.plugin.settings.githubRepo,
                githubBranch: this.plugin.settings.githubBranch,
                blogContentPath: this.plugin.settings.blogContentPath
            });
        }
>>>>>>> feature/upload
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('publication-center-modal');

<<<<<<< HEAD
=======
        // 발행 설정 확인
        if (!this.validateSettings()) {
            this.showSettingsError(contentEl);
            return;
        }

>>>>>>> feature/upload
        // 모달 래퍼 생성 (flex 컨테이너)
        const modalWrapper = contentEl.createDiv({ cls: 'publication-center-wrapper' });

        // 헤더
        const header = modalWrapper.createDiv({ cls: 'publication-center-header' });
<<<<<<< HEAD
        header.createEl('h2', { 
            text: '📚 Publication Center',
            cls: 'publication-center-title' 
        });
=======
        const headerContent = header.createDiv({ cls: 'publication-header-content' });
        
        headerContent.createEl('h2', { 
            text: '📚 Publication Center',
            cls: 'publication-center-title' 
        });
        
        // 발행 대상 표시
        const targetBadge = headerContent.createDiv({ cls: 'publication-target-badge' });
        if (this.plugin.settings.publishTarget === 'github') {
            targetBadge.innerHTML = `🐙 GitHub: ${this.plugin.settings.githubUsername}/${this.plugin.settings.githubRepo}`;
        } else {
            targetBadge.innerHTML = `🖥️ Server: ${this.plugin.settings.serverHost}`;
        }
>>>>>>> feature/upload

        // 노트 상태 분석
        await this.analyzeNotes();

        // 컨텐츠 영역 (스크롤 가능)
        const content = modalWrapper.createDiv({ cls: 'publication-center-content' });

        // 각 카테고리 섹션
        this.createSection(content, 'Unpublished Notes', 'unpublished', '📝');
        this.createSection(content, 'Changed Notes', 'changed', '✏️');
        this.createSection(content, 'Deleted Notes', 'deleted', '🗑️');
        this.createSection(content, 'Published Notes', 'published', '✅');

        // 푸터 (버튼 영역) - 고정
        const footer = modalWrapper.createDiv({ cls: 'publication-center-footer' });
        
        // 선택된 노트 수 표시
        const selectedCount = footer.createDiv({ cls: 'publication-center-selected-count' });
        this.updateSelectedCount(selectedCount);
        
        const publishBtn = footer.createEl('button', {
            text: 'PUBLISH SELECTED',
            cls: 'mod-cta publication-center-publish-btn'
        });
        
        publishBtn.addEventListener('click', async () => {
            await this.publishSelected();
        });
    }

    /**
<<<<<<< HEAD
=======
     * 설정 검증
     */
    private validateSettings(): boolean {
        if (this.plugin.settings.publishTarget === 'github') {
            return !!(
                this.plugin.settings.githubToken &&
                this.plugin.settings.githubUsername &&
                this.plugin.settings.githubRepo
            );
        } else {
            return !!(
                this.plugin.settings.serverHost &&
                this.plugin.settings.serverUsername &&
                this.plugin.settings.serverPassword
            );
        }
    }

    /**
     * 설정 오류 표시
     */
    private showSettingsError(contentEl: HTMLElement): void {
        const errorContainer = contentEl.createDiv({ cls: 'publication-settings-error' });
        
        errorContainer.createEl('h2', { text: '⚠️ Settings Required' });
        errorContainer.createEl('p', { 
            text: 'Please configure your publish settings before using Publication Center.' 
        });
        
        const settingsBtn = errorContainer.createEl('button', {
            text: 'Open Settings',
            cls: 'mod-cta'
        });
        
        settingsBtn.addEventListener('click', () => {
            this.close();
            // @ts-ignore
            this.app.setting.open();
            // @ts-ignore
            this.app.setting.openTabById(this.plugin.manifest.id);
        });
    }

    /**
>>>>>>> feature/upload
     * 노트 상태 분석
     */
    async analyzeNotes() {
        this.notes = [];
        const allFiles = this.app.vault.getMarkdownFiles();
        
        // TODO: 실제 발행 상태 추적 시스템과 연동
<<<<<<< HEAD
        // 지금은 샘플 데이터로 표시
        for (const file of allFiles) {
            // 간단한 로직: 파일명에 'draft'가 있으면 unpublished
            if (file.basename.toLowerCase().includes('draft')) {
                this.notes.push({
                    file,
                    status: 'unpublished'
                });
            } else {
                // 나머지는 published로 표시
                this.notes.push({
                    file,
                    status: 'published',
                    lastPublished: Date.now()
=======
        // 지금은 간단한 로직으로 표시
        const publishedNotes = this.plugin.settings.publishedNotes || {};
        
        for (const file of allFiles) {
            const fileHash = await this.getFileHash(file);
            const publishInfo = publishedNotes[file.path];
            
            if (!publishInfo) {
                // 발행된 적 없음
                this.notes.push({
                    file,
                    status: 'unpublished',
                    hash: fileHash
                });
            } else if (publishInfo.hash !== fileHash) {
                // 변경됨
                this.notes.push({
                    file,
                    status: 'changed',
                    hash: fileHash,
                    lastPublished: publishInfo.timestamp
                });
            } else {
                // 발행됨
                this.notes.push({
                    file,
                    status: 'published',
                    hash: fileHash,
                    lastPublished: publishInfo.timestamp
>>>>>>> feature/upload
                });
            }
        }
    }

    /**
<<<<<<< HEAD
=======
     * 파일 해시 생성 (간단한 버전)
     */
    private async getFileHash(file: TFile): Promise<string> {
        const content = await this.app.vault.read(file);
        // 간단한 해시 (실제로는 crypto를 사용하는 것이 좋음)
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    /**
>>>>>>> feature/upload
     * 섹션 생성
     */
    createSection(container: HTMLElement, title: string, status: string, icon: string) {
        const section = container.createDiv({ cls: 'publication-section' });
        
        // 섹션 헤더 (토글 가능)
        const sectionHeader = section.createDiv({ cls: 'publication-section-header' });
        
        const headerContent = sectionHeader.createDiv({ cls: 'publication-section-header-content' });
        
        const toggleIcon = headerContent.createSpan({ cls: 'publication-section-toggle' });
        toggleIcon.innerHTML = '▶';
        
        headerContent.createSpan({ 
            text: `${icon} ${title}`,
            cls: 'publication-section-title' 
        });
        
        const notesInSection = this.notes.filter(n => n.status === status);
        const badge = headerContent.createSpan({ 
            text: `${notesInSection.length}`,
            cls: 'publication-section-badge' 
        });
        
        // Select All 버튼 추가
        if (notesInSection.length > 0) {
            const selectAllBtn = headerContent.createEl('button', {
                text: 'Select All',
                cls: 'publication-select-all-btn'
            });
            
            selectAllBtn.addEventListener('click', (e) => {
<<<<<<< HEAD
                e.stopPropagation(); // 토글 방지
=======
                e.stopPropagation();
>>>>>>> feature/upload
                this.selectAllInSection(notesInSection);
            });
        }
        
        // 섹션 컨텐츠
        const sectionContent = section.createDiv({ cls: 'publication-section-content collapsed' });
        
        if (notesInSection.length === 0) {
            sectionContent.createDiv({ 
                text: 'No notes',
                cls: 'publication-empty-state' 
            });
        } else {
            notesInSection.forEach(note => {
                this.createNoteItem(sectionContent, note);
            });
        }
        
        // 토글 기능
        sectionHeader.addEventListener('click', () => {
            const isCollapsed = sectionContent.hasClass('collapsed');
            if (isCollapsed) {
                sectionContent.removeClass('collapsed');
                toggleIcon.innerHTML = '▼';
            } else {
                sectionContent.addClass('collapsed');
                toggleIcon.innerHTML = '▶';
            }
        });
    }

    /**
<<<<<<< HEAD
     * 섹션의 모든 노트 선택
     */
    selectAllInSection(notes: NoteStatus[]) {
        notes.forEach(note => {
            this.selectedNotes.add(note.file.path);
        });
        
        // 체크박스 업데이트
        const checkboxes = this.contentEl.querySelectorAll('.publication-note-checkbox') as NodeListOf<HTMLInputElement>;
        checkboxes.forEach(checkbox => {
            const noteItem = checkbox.closest('.publication-note-item');
            if (noteItem) {
                checkbox.checked = true;
            }
        });
        
        this.updateSelectedCount();
    }

    /**
=======
>>>>>>> feature/upload
     * 노트 아이템 생성
     */
    createNoteItem(container: HTMLElement, note: NoteStatus) {
        const item = container.createDiv({ cls: 'publication-note-item' });
        
        // 체크박스
        const checkbox = item.createEl('input', { 
            type: 'checkbox',
            cls: 'publication-note-checkbox'
        });
        
        checkbox.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.checked) {
                this.selectedNotes.add(note.file.path);
            } else {
                this.selectedNotes.delete(note.file.path);
            }
            this.updateSelectedCount();
        });
        
        // 노트 정보
        const noteInfo = item.createDiv({ cls: 'publication-note-info' });
        
        noteInfo.createDiv({ 
            text: note.file.basename,
            cls: 'publication-note-name' 
        });
        
        noteInfo.createDiv({ 
            text: note.file.path,
            cls: 'publication-note-path' 
        });
        
        // 상태 표시
        if (note.lastPublished) {
            const date = new Date(note.lastPublished);
            noteInfo.createDiv({ 
                text: `Last published: ${date.toLocaleString()}`,
                cls: 'publication-note-date' 
            });
        }
    }

    /**
<<<<<<< HEAD
=======
     * 섹션의 모든 노트 선택
     */
    selectAllInSection(notes: NoteStatus[]) {
        notes.forEach(note => {
            this.selectedNotes.add(note.file.path);
        });
        
        // 체크박스 업데이트
        const checkboxes = this.contentEl.querySelectorAll('.publication-note-checkbox') as NodeListOf<HTMLInputElement>;
        checkboxes.forEach(checkbox => {
            const noteItem = checkbox.closest('.publication-note-item');
            if (noteItem) {
                const noteName = noteItem.querySelector('.publication-note-name')?.textContent;
                const shouldCheck = Array.from(this.selectedNotes).some(path => {
                    const file = this.app.vault.getAbstractFileByPath(path);
                    return file instanceof TFile && file.basename === noteName;
                });
                checkbox.checked = shouldCheck;
            }
        });
        
        this.updateSelectedCount();
    }

    /**
>>>>>>> feature/upload
     * 선택된 노트 수 업데이트
     */
    updateSelectedCount(element?: HTMLElement) {
        const count = this.selectedNotes.size;
        const text = count > 0 ? `${count} note(s) selected` : 'No notes selected';
        
        if (element) {
            element.setText(text);
        } else {
            const countEl = this.contentEl.querySelector('.publication-center-selected-count');
            if (countEl) {
                countEl.setText(text);
            }
        }
    }

    /**
<<<<<<< HEAD
     * 선택된 노트 발행
=======
     * 선택된 노트 발행 (실제 구현)
>>>>>>> feature/upload
     */
    async publishSelected() {
        if (this.selectedNotes.size === 0) {
            new Notice('Please select notes to publish');
            return;
        }

<<<<<<< HEAD
        new Notice(`Publishing ${this.selectedNotes.size} note(s)...`);
        
        // TODO: 실제 발행 로직 구현
        // - GitHub 푸시 또는
        // - 개인 서버 업로드
        
        console.log('Selected notes:', Array.from(this.selectedNotes));
        
        // 임시: 2초 후 성공 메시지
        setTimeout(() => {
            new Notice('✅ Notes published successfully!');
            this.close();
        }, 2000);
=======
        if (!this.publisher) {
            new Notice('Publisher not initialized. Please check settings.');
            return;
        }

        // 발행 시작
        const selectedFiles: TFile[] = [];
        for (const path of this.selectedNotes) {
            const file = this.app.vault.getAbstractFileByPath(path);
            if (file instanceof TFile) {
                selectedFiles.push(file);
            }
        }

        new Notice(`Publishing ${selectedFiles.length} note(s)...`);

        try {
            // GitHub 배치 발행
            const success = await this.publisher.publishFiles(selectedFiles);

            if (success) {
                // 발행 상태 업데이트
                await this.updatePublishedStatus(selectedFiles);
                
                // 성공 메시지
                new Notice(`✅ Successfully published ${selectedFiles.length} notes!`);
                
                // 모달 새로고침
                await this.analyzeNotes();
                this.close();
            }
        } catch (error) {
            console.error('Publish error:', error);
            new Notice(`❌ Failed to publish: ${error.message}`);
        }
    }

    /**
     * 발행 상태 업데이트
     */
    private async updatePublishedStatus(files: TFile[]) {
        const publishedNotes = this.plugin.settings.publishedNotes || {};
        
        for (const file of files) {
            const hash = await this.getFileHash(file);
            publishedNotes[file.path] = {
                hash: hash,
                timestamp: Date.now()
            };
        }
        
        this.plugin.settings.publishedNotes = publishedNotes;
        await this.plugin.saveSettings();
>>>>>>> feature/upload
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}