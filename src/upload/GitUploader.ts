import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';
import { BlogSyncSettings } from '../types/settings';

/**
 * Git 연결 테스트 결과
 */
export interface GitTestResult {
	success: boolean;
	message: string;
	details?: {
		isRepo: boolean;
		branch?: string;
		remote?: string;
		hasChanges?: boolean;
	};
}

/**
 * Git 업로더 클래스
 */
export class GitUploader {
	private git: SimpleGit;
	private settings: BlogSyncSettings;

	constructor(settings: BlogSyncSettings) {
		this.settings = settings;
		
		const options: Partial<SimpleGitOptions> = {
			baseDir: settings.blogFolderPath,
			binary: 'git',
			maxConcurrentProcesses: 6,
		};
		
		this.git = simpleGit(options);
	}

	/**
	 * Git 연결 테스트
	 */
	async testConnection(): Promise<GitTestResult> {
		try {
			// 1. 폴더 경로 확인
			if (!this.settings.blogFolderPath) {
				return {
					success: false,
					message: '블로그 폴더 경로가 설정되지 않았습니다.'
				};
			}

			// 2. Git 저장소인지 확인
			const isRepo = await this.git.checkIsRepo();
			if (!isRepo) {
				return {
					success: false,
					message: '지정된 경로가 Git 저장소가 아닙니다.',
					details: { isRepo: false }
				};
			}

			// 3. 현재 브랜치 확인
			const branchSummary = await this.git.branch();
			const currentBranch = branchSummary.current;

			// 4. 원격 저장소 확인
			const remotes = await this.git.getRemotes(true);
			const hasRemote = remotes.length > 0;
			const remoteName = hasRemote ? remotes[0].name : undefined;
			const remoteUrl = hasRemote ? remotes[0].refs.fetch : undefined;

			if (!hasRemote) {
				return {
					success: false,
					message: '원격 저장소가 설정되지 않았습니다.',
					details: {
						isRepo: true,
						branch: currentBranch,
					}
				};
			}

			// 5. 변경사항 확인
			const status = await this.git.status();
			const hasChanges = !status.isClean();

			// 6. 원격 저장소 연결 테스트 (fetch)
			try {
				await this.git.fetch();
			} catch (fetchError) {
				return {
					success: false,
					message: `원격 저장소에 연결할 수 없습니다: ${fetchError.message}`,
					details: {
						isRepo: true,
						branch: currentBranch,
						remote: remoteUrl,
					}
				};
			}

			// 모든 테스트 통과
			return {
				success: true,
				message: 'Git 연결 테스트 성공!',
				details: {
					isRepo: true,
					branch: currentBranch,
					remote: remoteUrl,
					hasChanges: hasChanges,
				}
			};

		} catch (error) {
			return {
				success: false,
				message: `Git 테스트 실패: ${error.message}`
			};
		}
	}

	/**
	 * 파일 커밋 및 푸시
	 */
	async commitAndPush(filePath: string): Promise<void> {
		try {
			// 파일 추가
			await this.git.add(filePath);

			// 커밋 메시지 생성
			const fileName = filePath.split('/').pop() || 'file';
			const commitMessage = this.settings.gitCommitMessage.replace('{{filename}}', fileName);

			// 커밋
			await this.git.commit(commitMessage);

			// 푸시
			const branch = this.settings.gitBranch || 'main';
			await this.git.push('origin', branch);

		} catch (error) {
			throw new Error(`Git 업로드 실패: ${error.message}`);
		}
	}

	/**
	 * 변경사항 확인
	 */
	async hasChanges(): Promise<boolean> {
		const status = await this.git.status();
		return !status.isClean();
	}

	/**
	 * 현재 브랜치 확인
	 */
	async getCurrentBranch(): Promise<string> {
		const branchSummary = await this.git.branch();
		return branchSummary.current;
	}
}
