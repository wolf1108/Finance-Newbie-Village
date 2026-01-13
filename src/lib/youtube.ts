/**
 * YouTube 工具函數
 * 自動擷取影片縮圖與字幕
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

/**
 * 從 YouTube URL 擷取影片 ID
 */
export function extractVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/shorts\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }
    return null;
}

/**
 * 取得 YouTube 影片縮圖 URL
 */
export function getYouTubeThumbnail(videoUrl: string): string {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
        return '/uploads/default-thumbnail.jpg';
    }
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

/**
 * 取得 YouTube 影片縮圖 (多種解析度)
 */
export function getYouTubeThumbnails(videoUrl: string) {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
        return null;
    }
    return {
        default: `https://img.youtube.com/vi/${videoId}/default.jpg`,
        medium: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        high: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    };
}

/**
 * 從 YouTube 擷取字幕
 * 使用 Python youtube-transcript-api 套件
 */
export async function fetchYouTubeTranscript(videoUrl: string): Promise<string | null> {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
        return null;
    }

    try {
        // 使用 Python 腳本擷取字幕
        // 使用絕對路徑以避免工作目錄問題
        const projectRoot = process.cwd();
        const scriptPath = path.join(projectRoot, 'scripts', 'fetch_transcript.py');

        console.log('執行 Python 腳本:', scriptPath);
        console.log('影片 ID:', videoId);

        const { stdout, stderr } = await execAsync(`chcp 65001 >nul && python "${scriptPath}" ${videoId}`, {
            timeout: 30000, // 30 秒超時
            cwd: projectRoot,
            encoding: 'utf8',
            env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
        });

        if (stderr) {
            console.error('Python stderr:', stderr);
        }

        console.log('Python stdout 長度:', stdout.length);

        // 清理輸出並解析 JSON
        const cleanedOutput = stdout.trim();
        const result = JSON.parse(cleanedOutput);

        if (result.success && result.transcript) {
            console.log('字幕擷取成功，字數:', result.transcript.length);
            return result.transcript;
        }

        console.log('字幕擷取失敗:', result.error);
        return null;
    } catch (error) {
        console.error('擷取 YouTube 字幕失敗:', error);
        return null;
    }
}

export default {
    extractVideoId,
    getYouTubeThumbnail,
    getYouTubeThumbnails,
    fetchYouTubeTranscript,
};
