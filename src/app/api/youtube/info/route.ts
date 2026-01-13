import { NextRequest, NextResponse } from 'next/server';
import { extractVideoId, getYouTubeThumbnail, fetchYouTubeTranscript } from '@/lib/youtube';

// POST /api/youtube/info - 自動擷取 YouTube 影片資訊
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { videoUrl } = body;

        if (!videoUrl) {
            return NextResponse.json(
                { success: false, error: '請提供 YouTube 影片網址' },
                { status: 400 }
            );
        }

        const videoId = extractVideoId(videoUrl);
        if (!videoId) {
            return NextResponse.json(
                { success: false, error: '無效的 YouTube 網址' },
                { status: 400 }
            );
        }

        // 取得縮圖
        const thumbnail = getYouTubeThumbnail(videoUrl);

        // 擷取字幕
        console.log('開始擷取字幕, videoId:', videoId);
        const transcript = await fetchYouTubeTranscript(videoUrl);
        console.log('字幕擷取結果:', transcript ? `成功 (${transcript.length} 字)` : '失敗');

        return NextResponse.json({
            success: true,
            data: {
                videoId,
                thumbnail,
                transcript,
                hasTranscript: !!transcript,
            },
        });
    } catch (error) {
        console.error('擷取 YouTube 資訊失敗:', error);
        return NextResponse.json(
            { success: false, error: '擷取 YouTube 資訊失敗' },
            { status: 500 }
        );
    }
}

