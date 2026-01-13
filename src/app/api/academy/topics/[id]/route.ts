import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AcademyArticle from '@/models/AcademyArticle';

interface Params {
    params: Promise<{ id: string }>;
}

// GET /api/academy/topics/[id] - 取得單一主題
export async function GET(request: NextRequest, { params }: Params) {
    try {
        await connectDB();
        const { id } = await params;

        const topic = await AcademyArticle.findById(id);

        if (!topic) {
            return NextResponse.json(
                { success: false, error: '找不到主題' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: topic,
        });
    } catch (error) {
        console.error('取得主題失敗:', error);
        return NextResponse.json(
            { success: false, error: '取得主題失敗' },
            { status: 500 }
        );
    }
}

// PUT /api/academy/topics/[id] - 更新主題
export async function PUT(request: NextRequest, { params }: Params) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await request.json();

        const topic = await AcademyArticle.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        );

        if (!topic) {
            return NextResponse.json(
                { success: false, error: '找不到主題' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: topic,
        });
    } catch (error) {
        console.error('更新主題失敗:', error);
        return NextResponse.json(
            { success: false, error: '更新主題失敗' },
            { status: 500 }
        );
    }
}

// DELETE /api/academy/topics/[id] - 刪除主題 (硬刪除)
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        await connectDB();
        const { id } = await params;

        const topic = await AcademyArticle.findByIdAndDelete(id);

        if (!topic) {
            return NextResponse.json(
                { success: false, error: '找不到主題' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: '主題已永久刪除',
        });
    } catch (error) {
        console.error('刪除主題失敗:', error);
        return NextResponse.json(
            { success: false, error: '刪除主題失敗' },
            { status: 500 }
        );
    }
}
