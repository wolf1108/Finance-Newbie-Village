'use client';

import { useState, useEffect, useCallback } from 'react';

interface Topic {
    _id: string;
    topicName: string;
    thumbnail: string;
    category: string;
    videoUrl?: string;
    createdAt: string;
}

interface FormData {
    topicName: string;
    thumbnail: string;
    category: string;
    content: string;
    videoUrl: string;
    videoTranscript: string;
    videoDescription: string;
}

const initialFormData: FormData = {
    topicName: '',
    thumbnail: '',
    category: '',
    content: '',
    videoUrl: '',
    videoTranscript: '',
    videoDescription: '',
};

export default function AdminTopicsPage() {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [error, setError] = useState('');
    const [fetching, setFetching] = useState(false);
    const [fetchStatus, setFetchStatus] = useState('');

    const fetchTopics = useCallback(async () => {
        try {
            const res = await fetch('/api/academy/topics');
            const data = await res.json();
            if (data.success) {
                setTopics(data.data);
            }
        } catch (err) {
            console.error('取得主題失敗:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTopics();
    }, [fetchTopics]);

    // 自動擷取 YouTube 縮圖
    const fetchYouTubeInfo = async (videoUrl: string) => {
        if (!videoUrl || !videoUrl.includes('youtube') && !videoUrl.includes('youtu.be')) {
            return;
        }

        setFetching(true);
        setFetchStatus('正在擷取縮圖與字幕...');

        try {
            const res = await fetch('/api/youtube/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoUrl }),
            });
            const data = await res.json();

            if (data.success) {
                setFormData(prev => ({
                    ...prev,
                    thumbnail: data.data.thumbnail,
                    videoTranscript: data.data.transcript || prev.videoTranscript,
                }));

                if (data.data.hasTranscript) {
                    setFetchStatus('✅ 已擷取縮圖和字幕');
                } else {
                    setFetchStatus('✅ 已擷取縮圖 | 💡 請手動複製字幕：YouTube → 點擊「...」→「開啟逐字稿」→ 複製貼上');
                }
            } else {
                // 即使 API 失敗，也嘗試直接用 YouTube 縮圖 URL
                const videoIdMatch = videoUrl.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/);
                if (videoIdMatch) {
                    setFormData(prev => ({
                        ...prev,
                        thumbnail: `https://img.youtube.com/vi/${videoIdMatch[1]}/maxresdefault.jpg`,
                    }));
                    setFetchStatus('✅ 已擷取縮圖 | 💡 請手動複製字幕：YouTube → 點擊「...」→「開啟逐字稿」→ 複製貼上');
                } else {
                    setFetchStatus('⚠️ 擷取失敗：' + data.error);
                }
            }
        } catch (err) {
            console.error('擷取失敗:', err);
            // 直接使用 YouTube 縮圖
            const videoIdMatch = videoUrl.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/);
            if (videoIdMatch) {
                setFormData(prev => ({
                    ...prev,
                    thumbnail: `https://img.youtube.com/vi/${videoIdMatch[1]}/maxresdefault.jpg`,
                }));
                setFetchStatus('✅ 已擷取縮圖 | 💡 請手動複製字幕：YouTube → 點擊「...」→「開啟逐字稿」→ 複製貼上');
            } else {
                setFetchStatus('⚠️ 擷取失敗');
            }
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const url = editingId
                ? `/api/academy/topics/${editingId}`
                : '/api/academy/topics';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (data.success) {
                fetchTopics();
                setShowForm(false);
                setEditingId(null);
                setFormData(initialFormData);
                setFetchStatus('');
            } else {
                setError(data.error || '操作失敗');
            }
        } catch (err) {
            setError('操作失敗');
            console.error(err);
        }
    };

    const handleEdit = async (id: string) => {
        try {
            const res = await fetch(`/api/academy/topics/${id}`);
            const data = await res.json();
            if (data.success) {
                setFormData({
                    topicName: data.data.topicName,
                    thumbnail: data.data.thumbnail || '',
                    category: data.data.category,
                    content: data.data.content,
                    videoUrl: data.data.videoUrl || '',
                    videoTranscript: data.data.videoTranscript || '',
                    videoDescription: data.data.videoDescription || '',
                });
                setEditingId(id);
                setShowForm(true);
                setFetchStatus('');
            }
        } catch (err) {
            console.error('載入主題失敗:', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('確定要刪除此主題嗎？')) return;

        try {
            const res = await fetch(`/api/academy/topics/${id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                fetchTopics();
            }
        } catch (err) {
            console.error('刪除失敗:', err);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleVideoUrlBlur = () => {
        if (formData.videoUrl) {
            fetchYouTubeInfo(formData.videoUrl);
        }
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>📚 主題管理</h1>
                <button
                    onClick={() => {
                        setShowForm(!showForm);
                        setEditingId(null);
                        setFormData(initialFormData);
                        setFetchStatus('');
                    }}
                    style={styles.addButton}
                >
                    {showForm ? '取消' : '+ 新增主題'}
                </button>
            </header>

            {showForm && (
                <form onSubmit={handleSubmit} style={styles.form}>
                    <h2 style={styles.formTitle}>
                        {editingId ? '編輯主題' : '新增主題'}
                    </h2>
                    {error && <div style={styles.error}>{error}</div>}

                    <div style={styles.formGrid}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>主題名稱 *</label>
                            <input
                                type="text"
                                name="topicName"
                                value={formData.topicName}
                                onChange={handleChange}
                                required
                                style={styles.input}
                                placeholder="例如：股票入門"
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>分類 *</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                style={styles.input}
                            >
                                <option value="">選擇分類</option>
                                <option value="股票基礎">股票基礎</option>
                                <option value="基金投資">基金投資</option>
                                <option value="風險管理">風險管理</option>
                                <option value="技術分析">技術分析</option>
                                <option value="理財規劃">理財規劃</option>
                            </select>
                        </div>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>
                            YouTube 影片網址
                            <span style={styles.hint}>（輸入後會自動擷取縮圖與字幕）</span>
                        </label>
                        <div style={styles.videoUrlWrapper}>
                            <input
                                type="text"
                                name="videoUrl"
                                value={formData.videoUrl}
                                onChange={handleChange}
                                onBlur={handleVideoUrlBlur}
                                style={styles.input}
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                            <button
                                type="button"
                                onClick={() => fetchYouTubeInfo(formData.videoUrl)}
                                disabled={fetching || !formData.videoUrl}
                                style={styles.fetchButton}
                            >
                                {fetching ? '擷取中...' : '🔄 重新擷取'}
                            </button>
                        </div>
                        {fetchStatus && (
                            <div style={styles.fetchStatus}>{fetchStatus}</div>
                        )}
                    </div>

                    {formData.thumbnail && (
                        <div style={styles.formGroup}>
                            <label style={styles.label}>縮圖預覽</label>
                            <div style={styles.thumbnailPreview}>
                                <img
                                    src={formData.thumbnail}
                                    alt="縮圖預覽"
                                    style={styles.previewImage}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = formData.thumbnail.replace('maxresdefault', 'hqdefault');
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <div style={styles.formGroup}>
                        <label style={styles.label}>文章內容 *</label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            required
                            style={{ ...styles.input, minHeight: '120px' }}
                            placeholder="輸入文章內容..."
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>
                            影片字幕 (供 AI 出題)
                            <span style={styles.hint}>（自動擷取，可手動編輯）</span>
                        </label>
                        <textarea
                            name="videoTranscript"
                            value={formData.videoTranscript}
                            onChange={handleChange}
                            style={{ ...styles.input, minHeight: '100px' }}
                            placeholder="字幕將從 YouTube 自動擷取..."
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>補充描述 (供 AI 出題參考)</label>
                        <textarea
                            name="videoDescription"
                            value={formData.videoDescription}
                            onChange={handleChange}
                            style={{ ...styles.input, minHeight: '80px' }}
                            placeholder="可輸入額外的課程重點或補充說明..."
                        />
                    </div>

                    <button type="submit" style={styles.submitButton}>
                        {editingId ? '更新主題' : '建立主題'}
                    </button>
                </form>
            )}

            {loading ? (
                <div style={styles.loading}>載入中...</div>
            ) : (
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>縮圖</th>
                            <th style={styles.th}>主題名稱</th>
                            <th style={styles.th}>分類</th>
                            <th style={styles.th}>建立時間</th>
                            <th style={styles.th}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topics.map((topic) => (
                            <tr key={topic._id} style={styles.tr}>
                                <td style={styles.td}>
                                    <img
                                        src={topic.thumbnail || '/uploads/default-thumbnail.jpg'}
                                        alt={topic.topicName}
                                        style={styles.thumbnail}
                                    />
                                </td>
                                <td style={styles.td}>{topic.topicName}</td>
                                <td style={styles.td}>
                                    <span style={styles.categoryBadge}>{topic.category}</span>
                                </td>
                                <td style={styles.td}>
                                    {new Date(topic.createdAt).toLocaleDateString('zh-TW')}
                                </td>
                                <td style={styles.td}>
                                    <button
                                        onClick={() => handleEdit(topic._id)}
                                        style={styles.editButton}
                                    >
                                        編輯
                                    </button>
                                    <button
                                        onClick={() => handleDelete(topic._id)}
                                        style={styles.deleteButton}
                                    >
                                        刪除
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {!loading && topics.length === 0 && (
                <div style={styles.empty}>目前沒有主題，請新增第一個主題</div>
            )}
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
    },
    title: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#1a1a2e',
        margin: 0,
    },
    addButton: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
    },
    form: {
        background: 'white',
        padding: '30px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        marginBottom: '30px',
    },
    formTitle: {
        margin: '0 0 20px 0',
        fontSize: '20px',
        color: '#333',
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '20px',
    },
    formGroup: {
        marginBottom: '16px',
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: '500',
        color: '#555',
    },
    hint: {
        fontSize: '12px',
        color: '#94a3b8',
        fontWeight: '400',
        marginLeft: '8px',
    },
    input: {
        width: '100%',
        padding: '12px 16px',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        fontSize: '14px',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
    },
    videoUrlWrapper: {
        display: 'flex',
        gap: '10px',
    },
    fetchButton: {
        background: '#e0e7ff',
        color: '#4338ca',
        border: 'none',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
    },
    fetchStatus: {
        marginTop: '8px',
        fontSize: '13px',
        color: '#64748b',
    },
    thumbnailPreview: {
        background: '#f8fafc',
        borderRadius: '12px',
        padding: '12px',
        display: 'inline-block',
    },
    previewImage: {
        maxWidth: '320px',
        maxHeight: '180px',
        borderRadius: '8px',
        objectFit: 'cover',
    },
    submitButton: {
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        color: 'white',
        border: 'none',
        padding: '14px 32px',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        marginTop: '10px',
    },
    error: {
        background: '#fee2e2',
        color: '#dc2626',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '16px',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        background: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    },
    th: {
        background: '#f8fafc',
        padding: '16px',
        textAlign: 'left',
        fontSize: '14px',
        fontWeight: '600',
        color: '#64748b',
        borderBottom: '1px solid #e2e8f0',
    },
    tr: {
        borderBottom: '1px solid #f1f5f9',
    },
    td: {
        padding: '16px',
        fontSize: '14px',
        color: '#334155',
    },
    thumbnail: {
        width: '80px',
        height: '45px',
        objectFit: 'cover',
        borderRadius: '6px',
    },
    categoryBadge: {
        background: '#e0e7ff',
        color: '#4338ca',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '500',
    },
    editButton: {
        background: '#3b82f6',
        color: 'white',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '6px',
        fontSize: '13px',
        cursor: 'pointer',
        marginRight: '8px',
    },
    deleteButton: {
        background: '#ef4444',
        color: 'white',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '6px',
        fontSize: '13px',
        cursor: 'pointer',
    },
    loading: {
        textAlign: 'center',
        padding: '60px',
        color: '#64748b',
        fontSize: '16px',
    },
    empty: {
        textAlign: 'center',
        padding: '60px',
        color: '#94a3b8',
        fontSize: '16px',
    },
};
