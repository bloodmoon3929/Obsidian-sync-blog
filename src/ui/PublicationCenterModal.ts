// src/ui/PublicationCenterModal.ts

import { App, Modal, TFile, Notice, TFolder } from 'obsidian';
import BlogSyncPlugin from '../../main';
import { GitHubPublisher } from '../publisher/GitHubPublisher';

interface NoteStatus {
    file: TFile;
    status: 'unpublished' | 'changed' | 'deleted' | 'published';
    lastPublished?: number;
    hash?: string;
}

interface FolderNode {
    name: string;
    path: string;
    notes: NoteStatus[];
    subfolders: Map<string, FolderNode>;
    parent?: FolderNode;
}

export class PublicationCenterModal extends Modal {
    plugin: BlogSyncPlugin;
    notes: NoteStatus[] = [];
    selectedNotes: Set<string> = new Set();
    private publisher: GitHubPublisher | null = null;
    private progressBar: HTMLElement | null = null;
    private progressText: HTMLElement | null = null;
    private folderTree: FolderNode;

    constructor(app: App, plugin: BlogSyncPlugin) {
        super(app);
        this.plugin = plugin;
        
        // 루트 폴더 노드 초기화
        this.folderTree = {
            name: 'Root',
            path: '',
            notes: [],
            subfolders: new Map()
        };
        
        if (this.plugin.settings.publishTarget === 'github') {
            this.publisher = new GitHubPublisher(this.plugin, {
                githubToken: this.plugin.settings.githubToken,
                githubUsername: this.plugin.settings.githubUsername,
                githubRepo: this.plugin.settings.githubRepo,
                githubBranch: this.plugin.settings.githubBranch,
                publicBasePath: this.plugin.settings.publicBasePath,
                blogContentPath: this.plugin.settings.blogContentPath,
                blogAssetsPath: this.plugin.settings.blogAssetsPath
            });
        }
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('publication-center-modal');

        if (!this.validateSettings()) {
            this.showSettingsError(contentEl);
            return;
        }

        const modalWrapper = contentEl.createDiv({ cls: 'publication-center-wrapper' });

        // 헤더
        const header = modalWrapper.createDiv({ cls: 'publication-center-header' });
        const headerContent = header.createDiv({ cls: 'publication-header-content' });
        
        const headerLeft = headerContent.createDiv({ cls: 'publication-header-left' });
        headerLeft.createEl('h2', { 
            text: '📚 Publication Center',
            cls: 'publication-center-title' 
        });
        
        const targetBadge = headerLeft.createDiv({ cls: 'publication-target-badge' });
        if (this.plugin.settings.publishTarget === 'github') {
            targetBadge.innerHTML = `🐙 GitHub: ${this.plugin.settings.githubUsername}/${this.plugin.settings.githubRepo}`;
        } else {
            targetBadge.innerHTML = `🖥️ Server: ${this.plugin.settings.serverHost}`;
        }

        // 블로그 링크 버튼
        if (this.plugin.settings.blogUrl) {
            const headerRight = headerContent.createDiv({ cls: 'publication-header-right' });
            const blogLinkBtn = headerRight.createEl('button', {
                text: '🌐 View Blog',
                cls: 'publication-blog-link-btn'
            });
            blogLinkBtn.addEventListener('click', () => {
                window.open(this.plugin.settings.blogUrl, '_blank');
            });
        }

        // 진행 상태바
        const progressContainer = modalWrapper.createDiv({ cls: 'publication-progress-container hidden' });
        this.progressBar = progressContainer.createDiv({ cls: 'publication-progress-bar' });
        this.progressText = progressContainer.createDiv({ cls: 'publication-progress-text' });

        // 노트 상태 분석
        await this.analyzeNotes();
        this.buildFolderTree();

        // 컨텐츠 영역
        const content = modalWrapper.createDiv({ cls: 'publication-center-content' });

        this.createSectionByStatus(content, 'Unpublished Notes', 'unpublished', '📝');
        this.createSectionByStatus(content, 'Changed Notes', 'changed', '✏️');
        this.createSectionByStatus(content, 'Deleted Notes', 'deleted', '🗑️');
        this.createSectionByStatus(content, 'Published Notes', 'published', '✅');

        // 푸터
        const footer = modalWrapper.createDiv({ cls: 'publication-center-footer' });
        
        const selectedCount = footer.createDiv({ cls: 'publication-center-selected-count' });
        this.updateSelectedCount(selectedCount);
        
        const buttonContainer = footer.createDiv({ cls: 'publication-button-container' });
        
        const unpublishBtn = buttonContainer.createEl('button', {
            text: 'UNPUBLISH SELECTED',
            cls: 'publication-center-unpublish-btn'
        });
        
        unpublishBtn.addEventListener('click', async () => {
            await this.unpublishSelected();
        });
        
        const publishBtn = buttonContainer.createEl('button', {
            text: 'PUBLISH SELECTED',
            cls: 'mod-cta publication-center-publish-btn'
        });
        
        publishBtn.addEventListener('click', async () => {
            await this.publishSelected();
        });
    }

    /**
     * 폴더 트리 구조 생성
     */
    private buildFolderTree() {
        this.folderTree = {
            name: 'Root',
            path: '',
            notes: [],
            subfolders: new Map()
        };

        for (const note of this.notes) {
            const pathParts = note.file.path.split('/');
            const fileName = pathParts.pop()!;
            
            let currentNode = this.folderTree;
            let currentPath = '';

            // 폴더 경로를 따라 노드 생성
            for (const part of pathParts) {
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                
                if (!currentNode.subfolders.has(part)) {
                    const newNode: FolderNode = {
                        name: part,
                        path: currentPath,
                        notes: [],
                        subfolders: new Map(),
                        parent: currentNode
                    };
                    currentNode.subfolders.set(part, newNode);
                }
                
                currentNode = currentNode.subfolders.get(part)!;
            }

            // 노트를 최종 폴더에 추가
            currentNode.notes.push(note);
        }
    }

    /**
     * 상태별 섹션 생성 (폴더 구조 포함)
     */
    createSectionByStatus(container: HTMLElement, title: string, status: string, icon: string) {
        const notesInStatus = this.notes.filter(n => n.status === status);
        
        const section = container.createDiv({ cls: 'publication-section' });
        
        const sectionHeader = section.createDiv({ cls: 'publication-section-header' });
        const headerContent = sectionHeader.createDiv({ cls: 'publication-section-header-content' });
        
        const toggleIcon = headerContent.createSpan({ cls: 'publication-section-toggle' });
        toggleIcon.innerHTML = '▶';
        
        headerContent.createSpan({ 
            text: `${icon} ${title}`,
            cls: 'publication-section-title' 
        });
        
        const badge = headerContent.createSpan({ 
            text: `${notesInStatus.length}`,
            cls: 'publication-section-badge' 
        });
        
        if (notesInStatus.length > 0) {
            const selectAllBtn = headerContent.createEl('button', {
                text: 'Select All',
                cls: 'publication-select-all-btn'
            });
            
            selectAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectAllInSection(notesInStatus);
            });
        }
        
        const sectionContent = section.createDiv({ cls: 'publication-section-content collapsed' });
        
        if (notesInStatus.length === 0) {
            sectionContent.createDiv({ 
                text: 'No notes',
                cls: 'publication-empty-state' 
            });
        } else {
            // 폴더별로 그룹화해서 표시
            this.renderFolderTree(sectionContent, this.folderTree, status);
        }
        
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
     * 폴더 트리 렌더링 (재귀적)
     */
    private renderFolderTree(container: HTMLElement, node: FolderNode, filterStatus?: string, depth: number = 0) {
        // 현재 폴더의 노트 필터링
        const notesInFolder = filterStatus 
            ? node.notes.filter(n => n.status === filterStatus)
            : node.notes;

        // 서브폴더에서 필터링된 노트 수 계산
        let subfoldersWithNotes = 0;
        for (const [_, subfolder] of node.subfolders) {
            const subNotes = this.countNotesInFolder(subfolder, filterStatus);
            if (subNotes > 0) subfoldersWithNotes++;
        }

        // 현재 폴더에 표시할 노트가 있거나, 서브폴더에 노트가 있으면 표시
        if (notesInFolder.length > 0 || subfoldersWithNotes > 0) {
            // 루트가 아닌 경우 폴더 아이템 생성
            if (depth > 0) {
                const totalNotesInFolder = this.countNotesInFolder(node, filterStatus);
                const folderItem = container.createDiv({ 
                    cls: 'publication-folder-item',
                    attr: { style: `padding-left: ${depth * 20}px` }
                });
                
                const folderHeader = folderItem.createDiv({ cls: 'publication-folder-header' });
                
                const toggleIcon = folderHeader.createSpan({ cls: 'publication-folder-toggle' });
                toggleIcon.innerHTML = '📁 ▶';
                
                const folderName = folderHeader.createSpan({ 
                    text: node.name,
                    cls: 'publication-folder-name' 
                });
                
                const folderBadge = folderHeader.createSpan({ 
                    text: `${totalNotesInFolder}`,
                    cls: 'publication-folder-badge' 
                });

                // 폴더 내 모든 노트 선택 버튼
                const selectFolderBtn = folderHeader.createEl('button', {
                    text: 'Select Folder',
                    cls: 'publication-select-folder-btn'
                });
                
                selectFolderBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectAllInFolder(node, filterStatus);
                });

                const folderContent = container.createDiv({ 
                    cls: 'publication-folder-content collapsed' 
                });

                // 폴더 토글
                folderHeader.addEventListener('click', () => {
                    const isCollapsed = folderContent.hasClass('collapsed');
                    if (isCollapsed) {
                        folderContent.removeClass('collapsed');
                        toggleIcon.innerHTML = '📂 ▼';
                    } else {
                        folderContent.addClass('collapsed');
                        toggleIcon.innerHTML = '📁 ▶';
                    }
                });

                // 현재 폴더의 노트들
                notesInFolder.forEach(note => {
                    this.createNoteItem(folderContent, note, depth + 1);
                });

                // 서브폴더들 (재귀)
                for (const [_, subfolder] of node.subfolders) {
                    this.renderFolderTree(folderContent, subfolder, filterStatus, depth + 1);
                }
            } else {
                // 루트 레벨
                // 루트의 노트들
                notesInFolder.forEach(note => {
                    this.createNoteItem(container, note, depth);
                });

                // 서브폴더들
                for (const [_, subfolder] of node.subfolders) {
                    this.renderFolderTree(container, subfolder, filterStatus, depth + 1);
                }
            }
        }
    }

    /**
     * 폴더 내 노트 개수 세기 (재귀적)
     */
    private countNotesInFolder(node: FolderNode, filterStatus?: string): number {
        let count = filterStatus 
            ? node.notes.filter(n => n.status === filterStatus).length
            : node.notes.length;

        for (const [_, subfolder] of node.subfolders) {
            count += this.countNotesInFolder(subfolder, filterStatus);
        }

        return count;
    }

    /**
     * 폴더 내 모든 노트 선택
     */
    private selectAllInFolder(node: FolderNode, filterStatus?: string) {
        const notesToSelect = filterStatus
            ? node.notes.filter(n => n.status === filterStatus)
            : node.notes;

        notesToSelect.forEach(note => {
            this.selectedNotes.add(note.file.path);
        });

        // 서브폴더도 재귀적으로 선택
        for (const [_, subfolder] of node.subfolders) {
            this.selectAllInFolder(subfolder, filterStatus);
        }

        // 체크박스 업데이트
        this.updateAllCheckboxes();
        this.updateSelectedCount();
    }

    /**
     * 모든 체크박스 상태 업데이트
     */
    private updateAllCheckboxes() {
        const checkboxes = this.contentEl.querySelectorAll('.publication-note-checkbox') as NodeListOf<HTMLInputElement>;
        checkboxes.forEach(checkbox => {
            const noteItem = checkbox.closest('.publication-note-item');
            if (noteItem) {
                const notePath = noteItem.getAttribute('data-note-path');
                if (notePath) {
                    checkbox.checked = this.selectedNotes.has(notePath);
                }
            }
        });
    }

    /**
     * 노트 아이템 생성
     */
    createNoteItem(container: HTMLElement, note: NoteStatus, depth: number = 0) {
        const item = container.createDiv({ 
            cls: 'publication-note-item',
            attr: { 
                'data-note-path': note.file.path,
                style: `padding-left: ${depth * 20}px` 
            }
        });
        
        const checkbox = item.createEl('input', { 
            type: 'checkbox',
            cls: 'publication-note-checkbox'
        });
        
        checkbox.checked = this.selectedNotes.has(note.file.path);
        
        checkbox.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.checked) {
                this.selectedNotes.add(note.file.path);
            } else {
                this.selectedNotes.delete(note.file.path);
            }
            this.updateSelectedCount();
        });
        
        const noteInfo = item.createDiv({ cls: 'publication-note-info' });
        
        noteInfo.createDiv({ 
            text: note.file.basename,
            cls: 'publication-note-name' 
        });
        
        noteInfo.createDiv({ 
            text: note.file.path,
            cls: 'publication-note-path' 
        });
        
        if (note.lastPublished) {
            const date = new Date(note.lastPublished);
            noteInfo.createDiv({ 
                text: `Last published: ${date.toLocaleString()}`,
                cls: 'publication-note-date' 
            });
        }
    }

    /**
     * 진행 상태 표시
     */
    private showProgress(current: number, total: number, message: string) {
        if (!this.progressBar || !this.progressText) return;

        const progressContainer = this.progressBar.parentElement;
        if (progressContainer) {
            progressContainer.removeClass('hidden');
        }

        const percentage = Math.round((current / total) * 100);
        this.progressBar.style.width = `${percentage}%`;
        this.progressText.setText(`${message} (${current}/${total})`);
    }

    private hideProgress() {
        const progressContainer = this.progressBar?.parentElement;
        if (progressContainer) {
            progressContainer.addClass('hidden');
        }
    }

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

    async analyzeNotes() {
        this.notes = [];
        const allFiles = this.app.vault.getMarkdownFiles();
        
        const publishedNotes = this.plugin.settings.publishedNotes || {};
        
        for (const file of allFiles) {
            const fileHash = await this.getFileHash(file);
            const publishInfo = publishedNotes[file.path];
            
            if (!publishInfo) {
                this.notes.push({
                    file,
                    status: 'unpublished',
                    hash: fileHash
                });
            } else if (publishInfo.hash !== fileHash) {
                this.notes.push({
                    file,
                    status: 'changed',
                    hash: fileHash,
                    lastPublished: publishInfo.timestamp
                });
            } else {
                this.notes.push({
                    file,
                    status: 'published',
                    hash: fileHash,
                    lastPublished: publishInfo.timestamp
                });
            }
        }
    }

    private async getFileHash(file: TFile): Promise<string> {
        const content = await this.app.vault.read(file);
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    selectAllInSection(notes: NoteStatus[]) {
        notes.forEach(note => {
            this.selectedNotes.add(note.file.path);
        });
        
        this.updateAllCheckboxes();
        this.updateSelectedCount();
    }

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

    async publishSelected() {
        if (this.selectedNotes.size === 0) {
            new Notice('Please select notes to publish');
            return;
        }

        if (!this.publisher) {
            new Notice('Publisher not initialized. Please check settings.');
            return;
        }

        const selectedFiles: TFile[] = [];
        for (const path of this.selectedNotes) {
            const file = this.app.vault.getAbstractFileByPath(path);
            if (file instanceof TFile) {
                selectedFiles.push(file);
            }
        }

        try {
            this.showProgress(0, selectedFiles.length, 'Preparing to publish');
            
            let successCount = 0;
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                this.showProgress(i + 1, selectedFiles.length, `Publishing ${file.basename}`);
                
                try {
                    await this.publisher.publishFile(file);
                    successCount++;
                    
                    const hash = await this.getFileHash(file);
                    const publishedNotes = this.plugin.settings.publishedNotes || {};
                    publishedNotes[file.path] = {
                        hash: hash,
                        timestamp: Date.now()
                    };
                    this.plugin.settings.publishedNotes = publishedNotes;
                    await this.plugin.saveSettings();
                } catch (error) {
                    console.error(`Failed to publish ${file.basename}:`, error);
                }
            }

            this.hideProgress();
            new Notice(`✅ Successfully published ${successCount}/${selectedFiles.length} notes!`);
            
            await this.analyzeNotes();
            this.selectedNotes.clear();
            this.close();
        } catch (error) {
            this.hideProgress();
            console.error('Publish error:', error);
            new Notice(`❌ Failed to publish: ${error.message}`);
        }
    }

    async unpublishSelected() {
        if (this.selectedNotes.size === 0) {
            new Notice('Please select notes to unpublish');
            return;
        }

        if (!this.publisher) {
            new Notice('Publisher not initialized. Please check settings.');
            return;
        }

        const selectedFiles: TFile[] = [];
        for (const path of this.selectedNotes) {
            const file = this.app.vault.getAbstractFileByPath(path);
            if (file instanceof TFile) {
                selectedFiles.push(file);
            }
        }

        const confirmed = await this.showConfirmDialog(
            'Unpublish Notes',
            `Are you sure you want to unpublish ${selectedFiles.length} note(s) from GitHub?`
        );

        if (!confirmed) {
            return;
        }

        try {
            this.showProgress(0, 1, 'Unpublishing notes from GitHub...');
            
            const success = await this.publisher.deleteFiles(selectedFiles);

            if (success) {
                const publishedNotes = this.plugin.settings.publishedNotes || {};
                for (const file of selectedFiles) {
                    delete publishedNotes[file.path];
                }
                this.plugin.settings.publishedNotes = publishedNotes;
                await this.plugin.saveSettings();

                this.hideProgress();
                new Notice(`✅ Successfully unpublished ${selectedFiles.length} notes!`);
                
                await this.analyzeNotes();
                this.selectedNotes.clear();
                this.close();
            } else {
                this.hideProgress();
                new Notice(`❌ Failed to unpublish notes`);
            }
        } catch (error) {
            this.hideProgress();
            console.error('Unpublish error:', error);
            new Notice(`❌ Failed to unpublish: ${error.message}`);
        }
    }

    private showConfirmDialog(title: string, message: string): Promise<boolean> {
        return new Promise((resolve) => {
            const modal = new Modal(this.app);
            modal.titleEl.setText(title);
            
            const contentEl = modal.contentEl;
            contentEl.createEl('p', { text: message });
            
            const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
            buttonContainer.style.display = 'flex';
            buttonContainer.style.justifyContent = 'flex-end';
            buttonContainer.style.gap = '8px';
            buttonContainer.style.marginTop = '16px';
            
            const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
            cancelBtn.addEventListener('click', () => {
                modal.close();
                resolve(false);
            });
            
            const confirmBtn = buttonContainer.createEl('button', { 
                text: 'Unpublish',
                cls: 'mod-warning'
            });
            confirmBtn.addEventListener('click', () => {
                modal.close();
                resolve(true);
            });
            
            modal.open();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}