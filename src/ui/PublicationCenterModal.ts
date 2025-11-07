// src/ui/PublicationCenterModal.ts
import { App, Modal, TFile, Notice } from 'obsidian';
import BlogSyncPlugin from '../../main';

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

    constructor(app: App, plugin: BlogSyncPlugin) {
        super(app);
        this.plugin = plugin;
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('publication-center-modal');

        // 모달 래퍼 생성 (flex 컨테이너)
        const modalWrapper = contentEl.createDiv({ cls: 'publication-center-wrapper' });

        // 헤더
        const header = modalWrapper.createDiv({ cls: 'publication-center-header' });
        header.createEl('h2', { 
            text: '📚 Publication Center',
            cls: 'publication-center-title' 
        });

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
     * 노트 상태 분석
     */
    async analyzeNotes() {
        this.notes = [];
        const allFiles = this.app.vault.getMarkdownFiles();
        
        // TODO: 실제 발행 상태 추적 시스템과 연동
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
                });
            }
        }
    }

    /**
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
                e.stopPropagation(); // 토글 방지
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
     * 선택된 노트 발행
     */
    async publishSelected() {
        if (this.selectedNotes.size === 0) {
            new Notice('Please select notes to publish');
            return;
        }

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
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}