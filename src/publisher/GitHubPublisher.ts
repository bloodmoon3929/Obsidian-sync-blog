// src/publisher/GitHubPublisher.ts

import { Notice, TFile, TFolder } from 'obsidian';
import { Octokit } from '@octokit/rest';
import BlogSyncPlugin from '../../main';

export interface GitHubSettings {
    githubToken: string;
    githubUsername: string;
    githubRepo: string;
    githubBranch: string;
    publicBasePath: string;  // 예: 'src/site'
    blogContentPath: string; // 예: 'notes'
    blogAssetsPath: string;  // 예: 'img/user'
}

interface FileBlob {
    path: string;
    mode: '100644';
    type: 'blob';
    sha: string;
}

export class GitHubPublisher {
    private octokit: Octokit;
    private settings: GitHubSettings;
    private plugin: BlogSyncPlugin;

    constructor(plugin: BlogSyncPlugin, settings: GitHubSettings) {
        this.plugin = plugin;
        this.settings = settings;
        this.octokit = new Octokit({
            auth: settings.githubToken
        });
    }

    /**
     * 경로 정규화 (슬래시 제거)
     */
    private normalizePath(path: string): string {
        let normalized = path.trim();
        if (normalized.startsWith('/')) {
            normalized = normalized.slice(1);
        }
        if (normalized.endsWith('/')) {
            normalized = normalized.slice(0, -1);
        }
        return normalized;
    }

    /**
     * 전체 경로 생성 (publicBasePath + relativePath)
     */
    private getFullPath(...parts: string[]): string {
        const filtered = parts.filter(p => p && p.trim());
        const joined = filtered.map(p => this.normalizePath(p)).join('/');
        return joined;
    }

    /**
     * Obsidian 볼트 내 파일의 상대 경로를 유지하면서 GitHub 경로 생성
     * 예: src/site/notes/folder/note.md
     */
    private getFilePath(file: TFile): string {
        // 파일의 볼트 내 전체 경로 (예: "folder/subfolder/note.md")
        const vaultPath = file.path;
        
        // publicBasePath + blogContentPath + vaultPath
        return this.getFullPath(
            this.settings.publicBasePath,
            this.settings.blogContentPath,
            vaultPath
        );
    }

    /**
     * 이미지 파일 경로 생성
     * 예: src/site/img/user/첨부파일/image.png
     */
    private getAssetPath(assetPath: string): string {
        // publicBasePath + blogAssetsPath + assetPath
        return this.getFullPath(
            this.settings.publicBasePath,
            this.settings.blogAssetsPath,
            assetPath
        );
    }

    /**
     * 마크다운에서 이미지 링크 추출
     */
    private extractImageLinks(content: string): string[] {
        const images: string[] = [];
        
        // ![[image.png]] 형식
        const wikiLinkRegex = /!\[\[([^\]]+)\]\]/g;
        let match;
        while ((match = wikiLinkRegex.exec(content)) !== null) {
            images.push(match[1]);
        }
        
        // ![alt](image.png) 형식
        const markdownLinkRegex = /!\[([^\]]*)\]\(([^\)]+)\)/g;
        while ((match = markdownLinkRegex.exec(content)) !== null) {
            images.push(match[2]);
        }
        
        return images;
    }

    /**
     * 이미지 파일 찾기 및 blob 생성
     */
    private async processImages(file: TFile): Promise<FileBlob[]> {
        const content = await this.plugin.app.vault.read(file);
        const imageLinks = this.extractImageLinks(content);
        
        if (imageLinks.length === 0) {
            return [];
        }

        console.log(`Found ${imageLinks.length} images in ${file.basename}`);
        
        const imageBlobs: FileBlob[] = [];
        
        for (const imageName of imageLinks) {
            try {
                // 이미지 파일 찾기
                const imageFile = this.plugin.app.metadataCache.getFirstLinkpathDest(
                    imageName,
                    file.path
                );
                
                if (!imageFile) {
                    console.warn(`Image not found: ${imageName}`);
                    continue;
                }

                // 이미지가 실제 파일인지 확인
                if (!(imageFile instanceof TFile)) {
                    continue;
                }

                // 이미지 파일 읽기 (binary)
                const imageData = await this.plugin.app.vault.readBinary(imageFile);
                
                // Base64 인코딩
                const base64Data = this.arrayBufferToBase64(imageData);

                // Blob 생성
                const { data: blobData } = await this.octokit.rest.git.createBlob({
                    owner: this.settings.githubUsername,
                    repo: this.settings.githubRepo,
                    content: base64Data,
                    encoding: 'base64'
                });

                console.log(`Image blob created: ${imageFile.path}`);

                imageBlobs.push({
                    path: this.getAssetPath(imageFile.path),
                    mode: '100644',
                    type: 'blob',
                    sha: blobData.sha
                });
            } catch (error) {
                console.error(`Error processing image ${imageName}:`, error);
            }
        }
        
        return imageBlobs;
    }

    /**
     * ArrayBuffer를 Base64로 변환
     */
    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * 마크다운 내용에서 이미지 링크 변환
     * GitHub에 저장될 때는 /src/site/img/user/... 형태
     * Quartz 빌드 시 src/site가 루트가 되므로 img/user/...로 자동 변환됨
     */
    private transformImageLinks(content: string): string {
        // 전체 경로: publicBasePath + blogAssetsPath
        const fullAssetsPath = this.getFullPath(
            this.settings.publicBasePath,
            this.settings.blogAssetsPath
        );
        
        // ![[image.png]] 또는 ![[첨부파일/image.png]] → ![첨부파일/image.png](/src/site/img/user/첨부파일/image.png)
        content = content.replace(/!\[\[([^\]]+)\]\]/g, (match, imagePath) => {
            // URL 인코딩 (한글 등)
            const encodedPath = imagePath.split('/').map((part : string) => encodeURIComponent(part)).join('/');
            return `![${imagePath}](/${fullAssetsPath}/${encodedPath})`;
        });
        
        // ![alt](image.png) 또는 ![alt](첨부파일/image.png) → ![alt](/src/site/img/user/첨부파일/image.png)
        content = content.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, (match, alt, imagePath) => {
            // 이미 절대 경로거나 URL이면 그대로 둠
            if (imagePath.startsWith('http') || imagePath.startsWith('/')) {
                return match;
            }
            // URL 인코딩
            const encodedPath = imagePath.split('/').map((part : string) => encodeURIComponent(part)).join('/');
            return `![${alt}](/${fullAssetsPath}/${encodedPath})`;
        });
        
        return content;
    }

    /**
     * 단일 파일 발행 (이미지 포함)
     */
    async publishFile(file: TFile): Promise<boolean> {
        try {
            console.log(`=== Publishing file: ${file.path} ===`);
            
            // 1. 노트 내용 변환
            const content = await this.plugin.app.vault.read(file);
            const transformedContent = this.transformImageLinks(content);
            const encodedContent = btoa(unescape(encodeURIComponent(transformedContent)));
            
            const path = this.getFilePath(file);
            console.log(`Target note path: ${path}`);
            
            // 2. 노트 파일 업로드
            let sha: string | undefined;
            try {
                const existingFile = await this.octokit.rest.repos.getContent({
                    owner: this.settings.githubUsername,
                    repo: this.settings.githubRepo,
                    path: path,
                    ref: this.settings.githubBranch
                });
                
                if ('sha' in existingFile.data) {
                    sha = existingFile.data.sha;
                }
            } catch (error: any) {
                if (error.status !== 404) throw error;
            }

            await this.octokit.rest.repos.createOrUpdateFileContents({
                owner: this.settings.githubUsername,
                repo: this.settings.githubRepo,
                path: path,
                message: `Publish: ${file.basename}`,
                content: encodedContent,
                branch: this.settings.githubBranch,
                sha: sha
            });

            console.log('✓ Note uploaded');

            // 3. 이미지 추출
            const imageLinks = this.extractImageLinks(content);
            console.log(`Found ${imageLinks.length} image links:`, imageLinks);
            
            if (imageLinks.length === 0) {
                new Notice(`✅ Published: ${file.basename}`);
                return true;
            }

            // 4. 각 이미지 업로드
            let uploadedCount = 0;
            for (const imageName of imageLinks) {
                try {
                    console.log(`\n--- Processing image: ${imageName} ---`);
                    
                    // 이미지 파일 찾기
                    const imageFile = this.plugin.app.metadataCache.getFirstLinkpathDest(
                        imageName,
                        file.path
                    );
                    
                    if (!imageFile || !(imageFile instanceof TFile)) {
                        console.warn(`Image not found: ${imageName}`);
                        continue;
                    }

                    console.log(`Found image: ${imageFile.path}`);

                    // GitHub 경로
                    const imagePath = this.getAssetPath(imageFile.path);
                    console.log(`Target image path: ${imagePath}`);

                    // 이미지 읽기
                    const imageData = await this.plugin.app.vault.readBinary(imageFile);
                    const base64Data = this.arrayBufferToBase64(imageData);
                    console.log(`Image size: ${imageData.byteLength} bytes, base64 length: ${base64Data.length}`);

                    // 기존 이미지 확인
                    let imageSha: string | undefined;
                    try {
                        const existingImage = await this.octokit.rest.repos.getContent({
                            owner: this.settings.githubUsername,
                            repo: this.settings.githubRepo,
                            path: imagePath,
                            ref: this.settings.githubBranch
                        });
                        
                        if ('sha' in existingImage.data) {
                            imageSha = existingImage.data.sha;
                            console.log(`Existing image SHA: ${imageSha}`);
                        }
                    } catch (error: any) {
                        if (error.status === 404) {
                            console.log('New image, no existing SHA');
                        } else {
                            console.error('Error checking existing image:', error);
                            throw error;
                        }
                    }

                    // 이미지 업로드
                    console.log('Uploading to GitHub...');
                    const uploadResult = await this.octokit.rest.repos.createOrUpdateFileContents({
                        owner: this.settings.githubUsername,
                        repo: this.settings.githubRepo,
                        path: imagePath,
                        message: `Upload image: ${imageFile.name}`,
                        content: base64Data,
                        branch: this.settings.githubBranch,
                        sha: imageSha
                    });

                    console.log(`✅ Image uploaded: ${imagePath}`, uploadResult.data);
                    uploadedCount++;
                } catch (error: any) {
                    console.error(`❌ Failed to upload image: ${imageName}`);
                    console.error('Error:', error.message);
                    console.error('Status:', error.status);
                    console.error('Response:', error.response?.data);
                }
            }

            const message = `✅ Published: ${file.basename} (${uploadedCount}/${imageLinks.length} images uploaded)`;
            console.log(message);
            new Notice(message);
            return true;
        } catch (error: any) {
            console.error('=== Publish failed ===');
            console.error('Error:', error.message);
            console.error('Status:', error.status);
            console.error('Response:', error.response?.data);
            
            new Notice(`❌ Failed to publish: ${file.basename}`);
            return false;
        }
    }
    /**
     * 여러 파일 배치 발행 (노트 + 이미지)
     */
    async publishFiles(files: TFile[]): Promise<boolean> {
        try {
            console.log(`Publishing ${files.length} files...`);
            new Notice(`Publishing ${files.length} files...`);

            let latestCommitSha: string;
            let baseTreeSha: string | undefined;

            try {
                const { data: refData } = await this.octokit.rest.git.getRef({
                    owner: this.settings.githubUsername,
                    repo: this.settings.githubRepo,
                    ref: `heads/${this.settings.githubBranch}`
                });

                latestCommitSha = refData.object.sha;

                const { data: commitData } = await this.octokit.rest.git.getCommit({
                    owner: this.settings.githubUsername,
                    repo: this.settings.githubRepo,
                    commit_sha: latestCommitSha
                });

                baseTreeSha = commitData.tree.sha;
            } catch (error: any) {
                if (error.status === 404) {
                    console.log('Repository is empty, creating initial commit...');
                    return await this.createInitialCommit(files);
                }
                throw error;
            }

            // 노트 파일 blob 생성
            const noteBlobs: FileBlob[] = [];
            const allImageBlobs: FileBlob[] = [];

            for (const file of files) {
                try {
                    // 노트 내용 처리
                    const content = await this.plugin.app.vault.read(file);
                    const transformedContent = this.transformImageLinks(content);
                    const encodedContent = btoa(unescape(encodeURIComponent(transformedContent)));

                    const { data: blobData } = await this.octokit.rest.git.createBlob({
                        owner: this.settings.githubUsername,
                        repo: this.settings.githubRepo,
                        content: encodedContent,
                        encoding: 'base64'
                    });

                    noteBlobs.push({
                        path: this.getFilePath(file),
                        mode: '100644',
                        type: 'blob',
                        sha: blobData.sha
                    });

                    // 이미지 처리
                    const imageBlobs = await this.processImages(file);
                    allImageBlobs.push(...imageBlobs);

                } catch (error) {
                    console.error(`Error processing file ${file.basename}:`, error);
                    throw error;
                }
            }

            // 중복 이미지 제거 (같은 경로)
            const uniqueImageBlobs = Array.from(
                new Map(allImageBlobs.map(blob => [blob.path, blob])).values()
            );

            console.log(`Created ${noteBlobs.length} note blobs and ${uniqueImageBlobs.length} image blobs`);

            // 모든 blob 합치기
            const allBlobs = [...noteBlobs, ...uniqueImageBlobs];

            // 새로운 트리 생성
            const { data: newTree } = await this.octokit.rest.git.createTree({
                owner: this.settings.githubUsername,
                repo: this.settings.githubRepo,
                base_tree: baseTreeSha,
                tree: allBlobs
            });

            // 커밋 생성
            const { data: newCommit } = await this.octokit.rest.git.createCommit({
                owner: this.settings.githubUsername,
                repo: this.settings.githubRepo,
                message: `Published ${files.length} notes and ${uniqueImageBlobs.length} images from Obsidian`,
                tree: newTree.sha,
                parents: [latestCommitSha]
            });

            // 브랜치 업데이트
            await this.octokit.rest.git.updateRef({
                owner: this.settings.githubUsername,
                repo: this.settings.githubRepo,
                ref: `heads/${this.settings.githubBranch}`,
                sha: newCommit.sha
            });

            new Notice(`✅ Published ${files.length} notes and ${uniqueImageBlobs.length} images!`);
            return true;
        } catch (error: any) {
            console.error('Batch publish error:', error);
            
            let errorMessage = 'Failed to publish files';
            if (error.message) {
                errorMessage = `❌ ${error.message}`;
            }
            
            new Notice(errorMessage);
            return false;
        }
    }

    /**
     * 빈 저장소에 초기 커밋 생성
     */
    private async createInitialCommit(files: TFile[]): Promise<boolean> {
        try {
            console.log('Creating initial commit...');
            
            const noteBlobs: FileBlob[] = [];
            const allImageBlobs: FileBlob[] = [];

            for (const file of files) {
                const content = await this.plugin.app.vault.read(file);
                const transformedContent = this.transformImageLinks(content);
                const encodedContent = btoa(unescape(encodeURIComponent(transformedContent)));

                const { data: blobData } = await this.octokit.rest.git.createBlob({
                    owner: this.settings.githubUsername,
                    repo: this.settings.githubRepo,
                    content: encodedContent,
                    encoding: 'base64'
                });

                noteBlobs.push({
                    path: this.getFilePath(file),
                    mode: '100644',
                    type: 'blob',
                    sha: blobData.sha
                });

                const imageBlobs = await this.processImages(file);
                allImageBlobs.push(...imageBlobs);
            }

            const uniqueImageBlobs = Array.from(
                new Map(allImageBlobs.map(blob => [blob.path, blob])).values()
            );

            const allBlobs = [...noteBlobs, ...uniqueImageBlobs];

            const { data: newTree } = await this.octokit.rest.git.createTree({
                owner: this.settings.githubUsername,
                repo: this.settings.githubRepo,
                tree: allBlobs
            });

            const { data: newCommit } = await this.octokit.rest.git.createCommit({
                owner: this.settings.githubUsername,
                repo: this.settings.githubRepo,
                message: `Initial commit: ${files.length} notes and ${uniqueImageBlobs.length} images`,
                tree: newTree.sha,
                parents: []
            });

            try {
                await this.octokit.rest.git.createRef({
                    owner: this.settings.githubUsername,
                    repo: this.settings.githubRepo,
                    ref: `refs/heads/${this.settings.githubBranch}`,
                    sha: newCommit.sha
                });
            } catch (error: any) {
                if (error.status === 422) {
                    await this.octokit.rest.git.updateRef({
                        owner: this.settings.githubUsername,
                        repo: this.settings.githubRepo,
                        ref: `heads/${this.settings.githubBranch}`,
                        sha: newCommit.sha
                    });
                } else {
                    throw error;
                }
            }

            new Notice(`✅ Initial commit: ${files.length} notes and ${uniqueImageBlobs.length} images!`);
            return true;
        } catch (error: any) {
            console.error('Initial commit error:', error);
            new Notice(`❌ Failed: ${error.message}`);
            return false;
        }
    }

    /**
     * 여러 파일 삭제 (배치) - 완전 개선 버전
     */
    async deleteFiles(files: TFile[]): Promise<boolean> {
        try {
            console.log(`=== Starting deletion of ${files.length} files ===`);
            
            // 삭제할 파일 경로 미리 계산
            const pathsToDelete = files.map(file => {
                const path = this.getFilePath(file);
                console.log(`Will delete: ${file.path} -> ${path}`);
                return path;
            });

            // 1. 최신 커밋 가져오기
            console.log('Step 1: Getting latest commit...');
            const { data: refData } = await this.octokit.rest.git.getRef({
                owner: this.settings.githubUsername,
                repo: this.settings.githubRepo,
                ref: `heads/${this.settings.githubBranch}`
            });

            const latestCommitSha = refData.object.sha;
            console.log(`Latest commit SHA: ${latestCommitSha}`);

            // 2. 커밋의 트리 가져오기
            console.log('Step 2: Getting commit tree...');
            const { data: commitData } = await this.octokit.rest.git.getCommit({
                owner: this.settings.githubUsername,
                repo: this.settings.githubRepo,
                commit_sha: latestCommitSha
            });

            const baseTreeSha = commitData.tree.sha;
            console.log(`Base tree SHA: ${baseTreeSha}`);

            // 3. 전체 트리 가져오기 (recursive)
            console.log('Step 3: Getting full tree...');
            const { data: currentTree } = await this.octokit.rest.git.getTree({
                owner: this.settings.githubUsername,
                repo: this.settings.githubRepo,
                tree_sha: baseTreeSha,
                recursive: '1'
            });

            console.log(`Current tree has ${currentTree.tree.length} items`);
            
            // blob만 필터링 (tree 타입 제외)
            const currentBlobs = currentTree.tree.filter(item => item.type === 'blob');
            console.log(`Current tree has ${currentBlobs.length} blobs (files)`);
            
            // 삭제 대상 파일이 실제로 존재하는지 확인
            const filesToDelete = currentBlobs.filter(item => 
                pathsToDelete.includes(item.path || '')
            );
            console.log(`Found ${filesToDelete.length} files to delete:`, 
                filesToDelete.map(f => f.path));

            if (filesToDelete.length === 0) {
                console.error('⚠️ No matching files found in repository');
                console.log('Paths to delete:', pathsToDelete);
                console.log('Sample blob paths:', currentBlobs.slice(0, 5).map(b => b.path));
                new Notice('⚠️ Files not found in repository');
                return false;
            }

            // 4. 삭제할 파일을 제외한 새 트리 아이템 생성 (blob만)
            console.log('Step 4: Creating new tree without deleted files...');
            const newTreeItems = currentBlobs
                .filter(item => {
                    const shouldKeep = !pathsToDelete.includes(item.path || '');
                    if (!shouldKeep) {
                        console.log(`  ✓ Removing: ${item.path}`);
                    }
                    return shouldKeep;
                })
                .map(item => ({
                    path: item.path!,
                    mode: '100644' as const, // blob는 항상 100644
                    type: 'blob' as const,
                    sha: item.sha!
                }));

            const removedCount = currentBlobs.length - newTreeItems.length;
            console.log(`New tree will have ${newTreeItems.length} blobs (removed ${removedCount})`);
            console.log(`First 3 items in new tree:`, newTreeItems.slice(0, 3).map(i => i.path));

            if (removedCount === 0) {
                console.error('⚠️ WARNING: No files were actually removed!');
                new Notice('⚠️ Files not found in repository.');
                return false;
            }

            // 5. 새 트리 생성
            console.log('Step 5: Creating new tree on GitHub...');
            const { data: newTree } = await this.octokit.rest.git.createTree({
                owner: this.settings.githubUsername,
                repo: this.settings.githubRepo,
                tree: newTreeItems
            });

            console.log(`✓ New tree created with SHA: ${newTree.sha}`);
            
            if (newTree.sha === baseTreeSha) {
                console.error('⚠️ ERROR: New tree SHA is the same as base tree!');
                console.error('Tree items count:', newTreeItems.length);
                console.error('Original blobs count:', currentBlobs.length);
                new Notice('❌ Failed to create modified tree');
                return false;
            }

            // 6. 새 커밋 생성
            console.log('Step 6: Creating commit...');
            const commitMessage = `Unpublish ${files.length} note(s) from Obsidian\n\nDeleted:\n${pathsToDelete.map(p => `- ${p}`).join('\n')}`;
            const { data: newCommit } = await this.octokit.rest.git.createCommit({
                owner: this.settings.githubUsername,
                repo: this.settings.githubRepo,
                message: commitMessage,
                tree: newTree.sha,
                parents: [latestCommitSha]
            });

            console.log(`✓ Commit created with SHA: ${newCommit.sha}`);

            // 7. 브랜치 업데이트
            console.log('Step 7: Updating branch reference...');
            await this.octokit.rest.git.updateRef({
                owner: this.settings.githubUsername,
                repo: this.settings.githubRepo,
                ref: `heads/${this.settings.githubBranch}`,
                sha: newCommit.sha
            });

            console.log(`✓ Branch updated successfully`);
            console.log(`  Old commit: ${latestCommitSha}`);
            console.log(`  New commit: ${newCommit.sha}`);

            // 8. GitHub 처리 대기
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 9. 검증
            console.log('Step 8: Verifying deletion...');
            try {
                const { data: updatedTree } = await this.octokit.rest.git.getTree({
                    owner: this.settings.githubUsername,
                    repo: this.settings.githubRepo,
                    tree_sha: newCommit.sha,
                    recursive: '1'
                });
                
                const remainingBlobs = updatedTree.tree.filter(item => item.type === 'blob');
                console.log(`Updated tree has ${remainingBlobs.length} blobs`);
                
                const stillExists = pathsToDelete.filter(path => 
                    remainingBlobs.some(blob => blob.path === path)
                );
                
                if (stillExists.length > 0) {
                    console.warn('⚠️ Files still exist:', stillExists);
                } else {
                    console.log('✓ All files successfully removed from tree');
                }
            } catch (error) {
                console.error('Verification error:', error);
            }

            console.log('=== ✅ Deletion completed successfully ===');
            return true;
        } catch (error: any) {
            console.error('❌ Batch delete error:', error);
            console.error('Error details:', {
                message: error.message,
                status: error.status,
                response: error.response?.data
            });
            
            new Notice(`❌ Delete failed: ${error.message}`);
            return false;
        }
    }

    /**
     * 단일 파일 삭제
     */
    async deleteFile(file: TFile): Promise<boolean> {
        try {
            const path = this.getFilePath(file);
            console.log(`Deleting single file: ${path}`);

            // 파일 정보 가져오기
            const { data: fileData } = await this.octokit.rest.repos.getContent({
                owner: this.settings.githubUsername,
                repo: this.settings.githubRepo,
                path: path,
                ref: this.settings.githubBranch
            });

            if (Array.isArray(fileData) || fileData.type !== 'file') {
                console.error('Not a file:', path);
                return false;
            }

            // 파일 삭제
            await this.octokit.rest.repos.deleteFile({
                owner: this.settings.githubUsername,
                repo: this.settings.githubRepo,
                path: path,
                message: `Unpublish: ${file.basename}`,
                sha: fileData.sha,
                branch: this.settings.githubBranch
            });

            console.log(`✅ Deleted: ${path}`);
            return true;
        } catch (error: any) {
            console.error('Delete error:', error);
            if (error.status === 404) {
                console.log(`File not found: ${this.getFilePath(file)}`);
            }
            return false;
        }
    }

    async testConnection(): Promise<boolean> {
        // 기존 코드 유지
        try {
            await this.octokit.rest.repos.get({
                owner: this.settings.githubUsername,
                repo: this.settings.githubRepo
            });
            new Notice('✅ GitHub connection successful!');
            return true;
        } catch (error) {
            new Notice('❌ GitHub connection failed');
            return false;
        }
    }
}