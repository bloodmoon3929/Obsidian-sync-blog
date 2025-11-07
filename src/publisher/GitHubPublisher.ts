// src/publisher/GitHubPublisher.ts

import { Notice, TFile } from 'obsidian';
import { Octokit } from '@octokit/rest';
import BlogSyncPlugin from '../../main';

export interface GitHubSettings {
    githubToken: string;
    githubUsername: string;
    githubRepo: string;
    githubBranch: string;
    blogContentPath: string; // 예: 'content/blog'
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
     * 단일 파일 발행
     */
    async publishFile(file: TFile): Promise<boolean> {
        try {
            const content = await this.plugin.app.vault.read(file);
            const encodedContent = btoa(unescape(encodeURIComponent(content)));
            
            const path = `${this.settings.blogContentPath}/${file.basename}.md`;
            
            // 기존 파일이 있는지 확인
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
            } catch (error) {
                // 파일이 없으면 새로 생성
                sha = undefined;
            }

            // 파일 업로드/업데이트
            await this.octokit.rest.repos.createOrUpdateFileContents({
                owner: this.settings.githubUsername,
                repo: this.settings.githubRepo,
                path: path,
                message: `Publish: ${file.basename}`,
                content: encodedContent,
                branch: this.settings.githubBranch,
                sha: sha
            });

            new Notice(`✅ Published: ${file.basename}`);
            return true;
        } catch (error) {
            console.error('Publish error:', error);
            new Notice(`❌ Failed to publish: ${file.basename}`);
            return false;
        }
    }

    /**
     * 여러 파일 배치 발행 (Git Tree API 사용)
     */
    async publishFiles(files: TFile[]): Promise<boolean> {
        try {
            new Notice(`Publishing ${files.length} files...`);

            // 최신 커밋 가져오기
            const { data: refData } = await this.octokit.rest.git.getRef({
                owner: this.settings.githubUsername,
                repo: this.settings.githubRepo,
                ref: `heads/${this.settings.githubBranch}`
            });

            const latestCommitSha = refData.object.sha;

            // 최신 커밋의 트리 가져오기
            const { data: commitData } = await this.octokit.rest.git.getCommit({
                owner: this.settings.githubUsername,
                repo: this.settings.githubRepo,
                commit_sha: latestCommitSha
            });

            const baseTreeSha = commitData.tree.sha;

            // 각 파일에 대한 blob 생성
            const blobs = await Promise.all(
                files.map(async (file) => {
                    const content = await this.plugin.app.vault.read(file);
                    const encodedContent = btoa(unescape(encodeURIComponent(content)));

                    const { data: blobData } = await this.octokit.rest.git.createBlob({
                        owner: this.settings.githubUsername,
                        repo: this.settings.githubRepo,
                        content: encodedContent,
                        encoding: 'base64'
                    });

                    return {
                        path: `${this.settings.blogContentPath}/${file.basename}.md`,
                        mode: '100644' as const,
                        type: 'blob' as const,
                        sha: blobData.sha
                    };
                })
            );

            // 새로운 트리 생성
            const { data: newTree } = await this.octokit.rest.git.createTree({
                owner: this.settings.githubUsername,
                repo: this.settings.githubRepo,
                base_tree: baseTreeSha,
                tree: blobs
            });

            // 새로운 커밋 생성
            const { data: newCommit } = await this.octokit.rest.git.createCommit({
                owner: this.settings.githubUsername,
                repo: this.settings.githubRepo,
                message: `Published ${files.length} notes`,
                tree: newTree.sha,
                parents: [latestCommitSha]
            });

            // 브랜치 HEAD 업데이트
            await this.octokit.rest.git.updateRef({
                owner: this.settings.githubUsername,
                repo: this.settings.githubRepo,
                ref: `heads/${this.settings.githubBranch}`,
                sha: newCommit.sha
            });

            new Notice(`✅ Successfully published ${files.length} files!`);
            return true;
        } catch (error) {
            console.error('Batch publish error:', error);
            new Notice(`❌ Failed to publish files`);
            return false;
        }
    }

    /**
     * 파일 삭제
     */
    async deleteFile(file: TFile): Promise<boolean> {
        try {
            const path = `${this.settings.blogContentPath}/${file.basename}.md`;

            // 파일 SHA 가져오기
            const { data: fileData } = await this.octokit.rest.repos.getContent({
                owner: this.settings.githubUsername,
                repo: this.settings.githubRepo,
                path: path,
                ref: this.settings.githubBranch
            });

            if (!('sha' in fileData)) {
                throw new Error('File not found');
            }

            // 파일 삭제
            await this.octokit.rest.repos.deleteFile({
                owner: this.settings.githubUsername,
                repo: this.settings.githubRepo,
                path: path,
                message: `Delete: ${file.basename}`,
                sha: fileData.sha,
                branch: this.settings.githubBranch
            });

            new Notice(`🗑️ Deleted: ${file.basename}`);
            return true;
        } catch (error) {
            console.error('Delete error:', error);
            new Notice(`❌ Failed to delete: ${file.basename}`);
            return false;
        }
    }

    /**
     * 연결 테스트
     */
    async testConnection(): Promise<boolean> {
        try {
            await this.octokit.rest.repos.get({
                owner: this.settings.githubUsername,
                repo: this.settings.githubRepo
            });
            new Notice('✅ GitHub connection successful!');
            return true;
        } catch (error) {
            console.error('Connection test failed:', error);
            new Notice('❌ GitHub connection failed');
            return false;
        }
    }
}