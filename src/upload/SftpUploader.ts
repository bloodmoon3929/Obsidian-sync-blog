import SftpClient from 'ssh2-sftp-client';
import { BlogSyncSettings } from '../types/settings';
import * as path from 'path';

/**
 * SFTP 연결 테스트 결과
 */
export interface SftpTestResult {
	success: boolean;
	message: string;
	details?: {
		connected: boolean;
		remotePath?: string;
		writable?: boolean;
	};
}

/**
 * SFTP 업로더 클래스
 */
export class SftpUploader {
	private settings: BlogSyncSettings;
	private sftp: SftpClient;

	constructor(settings: BlogSyncSettings) {
		this.settings = settings;
		this.sftp = new SftpClient();
	}

	/**
	 * SFTP 연결 테스트
	 */
	async testConnection(): Promise<SftpTestResult> {
		try {
			// 1. 설정 확인
			if (!this.settings.sftpHost) {
				return {
					success: false,
					message: 'SFTP 호스트가 설정되지 않았습니다.'
				};
			}

			if (!this.settings.sftpUsername) {
				return {
					success: false,
					message: 'SFTP 사용자명이 설정되지 않았습니다.'
				};
			}

			if (!this.settings.sftpPassword) {
				return {
					success: false,
					message: 'SFTP 비밀번호가 설정되지 않았습니다.'
				};
			}

			// 2. 연결 설정
			const config = {
				host: this.settings.sftpHost,
				port: this.settings.sftpPort || 22,
				username: this.settings.sftpUsername,
				password: this.settings.sftpPassword,
			};

			// 3. 연결 시도
			await this.sftp.connect(config);

			// 4. 원격 경로 확인
			const remotePath = this.settings.sftpRemotePath || '/';
			let pathExists = false;
			let writable = false;

			try {
				const exists = await this.sftp.exists(remotePath);
				pathExists = exists !== false;
			} catch (error) {
				pathExists = false;
			}

			if (!pathExists) {
				await this.sftp.end();
				return {
					success: false,
					message: `원격 경로가 존재하지 않습니다: ${remotePath}`,
					details: {
						connected: true,
						remotePath: remotePath,
						writable: false,
					}
				};
			}

			// 5. 쓰기 권한 테스트
			try {
				const testFile = path.posix.join(remotePath, '.obsidian-test');
				await this.sftp.put(Buffer.from('test'), testFile);
				await this.sftp.delete(testFile);
				writable = true;
			} catch (error) {
				writable = false;
			}

			await this.sftp.end();

			if (!writable) {
				return {
					success: false,
					message: '원격 경로에 쓰기 권한이 없습니다.',
					details: {
						connected: true,
						remotePath: remotePath,
						writable: false,
					}
				};
			}

			// 모든 테스트 통과
			return {
				success: true,
				message: 'SFTP 연결 테스트 성공!',
				details: {
					connected: true,
					remotePath: remotePath,
					writable: true,
				}
			};

		} catch (error) {
			// 연결 종료
			if (this.sftp) {
				try {
					await this.sftp.end();
				} catch (e) {
					// 무시
				}
			}

			return {
				success: false,
				message: `SFTP 연결 실패: ${error.message}`
			};
		}
	}

	/**
	 * 파일 업로드
	 */
	async uploadFile(localPath: string, remoteFileName: string): Promise<void> {
		try {
			// 연결
			const config = {
				host: this.settings.sftpHost,
				port: this.settings.sftpPort || 22,
				username: this.settings.sftpUsername,
				password: this.settings.sftpPassword,
			};

			await this.sftp.connect(config);

			// 원격 경로 생성
			const remotePath = this.settings.sftpRemotePath || '/';
			const remoteFilePath = path.posix.join(remotePath, remoteFileName);

			// 업로드
			await this.sftp.put(localPath, remoteFilePath);

			// 연결 종료
			await this.sftp.end();

		} catch (error) {
			// 연결 종료
			if (this.sftp) {
				try {
					await this.sftp.end();
				} catch (e) {
					// 무시
				}
			}

			throw new Error(`SFTP 업로드 실패: ${error.message}`);
		}
	}

	/**
	 * 디렉토리 업로드
	 */
	async uploadDirectory(localDir: string, remoteDir: string): Promise<void> {
		try {
			// 연결
			const config = {
				host: this.settings.sftpHost,
				port: this.settings.sftpPort || 22,
				username: this.settings.sftpUsername,
				password: this.settings.sftpPassword,
			};

			await this.sftp.connect(config);

			// 업로드
			await this.sftp.uploadDir(localDir, remoteDir);

			// 연결 종료
			await this.sftp.end();

		} catch (error) {
			// 연결 종료
			if (this.sftp) {
				try {
					await this.sftp.end();
				} catch (e) {
					// 무시
				}
			}

			throw new Error(`SFTP 디렉토리 업로드 실패: ${error.message}`);
		}
	}

	/**
	 * 연결 종료
	 */
	async disconnect(): Promise<void> {
		if (this.sftp) {
			await this.sftp.end();
		}
	}
}
