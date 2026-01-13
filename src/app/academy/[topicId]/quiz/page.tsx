'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Question {
    question: string;
    options: string[];
    correctAnswer: number;
}

interface QuestionWithResult {
    question: string;
    options: string[];
    correctAnswer: number;
    userAnswer: number;
    isCorrect: boolean;
    explanation?: string;
}

interface QuizResult {
    score: number;
    totalQuestions: number;
    pointsEarned: number;
    balanceAdded: number;
    newBalance: number;
    newPoints: number;
    questionsWithResults: QuestionWithResult[];
}

export default function QuizPage() {
    const params = useParams();
    const topicId = params.topicId as string;
    const [questions, setQuestions] = useState<Question[]>([]);
    const [topicName, setTopicName] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [result, setResult] = useState<QuizResult | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [showReview, setShowReview] = useState(false);

    // 模擬使用者 ID (實際應從認證系統取得)
    const mockUserId = '507f1f77bcf86cd799439011';

    useEffect(() => {
        if (topicId) {
            fetchQuiz();
        }
    }, [topicId]);

    const fetchQuiz = async () => {
        try {
            const res = await fetch('/api/academy/quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ articleId: topicId }),
            });
            const data = await res.json();
            if (data.success) {
                setQuestions(data.data.questions);
                setTopicName(data.data.topicName);
                setAnswers(new Array(data.data.questions.length).fill(-1));
            } else {
                setError(data.error || '載入題目失敗');
            }
        } catch (err) {
            setError('載入題目失敗');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (optionIndex: number) => {
        const newAnswers = [...answers];
        newAnswers[currentIndex] = optionIndex;
        setAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleSubmit = async () => {
        if (answers.includes(-1)) {
            alert('請回答所有題目！');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/academy/quiz', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: mockUserId,
                    articleId: topicId,
                    questions,
                    answers,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setResult(data.data);
            } else {
                setError(data.error || '提交失敗');
            }
        } catch (err) {
            setError('提交失敗');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <style>
                    {`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        @keyframes bounce {
                            0%, 100% { transform: translateY(0); }
                            50% { transform: translateY(-10px); }
                        }
                        @keyframes pulse {
                            0%, 100% { opacity: 1; }
                            50% { opacity: 0.5; }
                        }
                        .loading-spinner {
                            width: 60px;
                            height: 60px;
                            border: 4px solid rgba(255,255,255,0.1);
                            border-top-color: #667eea;
                            border-radius: 50%;
                            animation: spin 1s linear infinite;
                            margin-bottom: 30px;
                        }
                        .loading-text {
                            display: flex;
                            gap: 2px;
                            font-size: 20px;
                            font-weight: 600;
                        }
                        .loading-char {
                            display: inline-block;
                            animation: bounce 0.6s ease-in-out infinite;
                        }
                    `}
                </style>
                <div className="loading-spinner" />
                <div className="loading-text">
                    {'AI 正在生成題目...'.split('').map((char, index) => (
                        <span
                            key={index}
                            className="loading-char"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            {char === ' ' ? '\u00A0' : char}
                        </span>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.errorContainer}>
                <p style={styles.errorText}>{error}</p>
                <Link href={`/academy/${topicId}`} style={styles.backButton}>
                    返回課程
                </Link>
            </div>
        );
    }

    if (result) {
        return (
            <div style={styles.resultContainer}>
                <div style={styles.resultCard}>
                    <div style={styles.resultIcon}>🎉</div>
                    <h1 style={styles.resultTitle}>測驗完成！</h1>
                    <div style={styles.scoreCircle}>
                        <span style={styles.scoreNumber}>
                            {result.score}/{result.totalQuestions}
                        </span>
                        <span style={styles.scoreLabel}>答對題數</span>
                    </div>
                    <div style={styles.rewardsGrid}>
                        <div style={styles.rewardItem}>
                            <span style={styles.rewardIcon}>⭐</span>
                            <span style={styles.rewardValue}>+{result.pointsEarned}</span>
                            <span style={styles.rewardLabel}>積分</span>
                        </div>
                        <div style={styles.rewardItem}>
                            <span style={styles.rewardIcon}>💰</span>
                            <span style={styles.rewardValue}>
                                +${result.balanceAdded.toLocaleString()}
                            </span>
                            <span style={styles.rewardLabel}>模擬資金</span>
                        </div>
                    </div>
                    <div style={styles.totalSection}>
                        <p>目前總積分：<strong>{result.newPoints}</strong></p>
                        <p>目前模擬資金：<strong>${result.newBalance.toLocaleString()}</strong></p>
                    </div>

                    <button
                        onClick={() => setShowReview(!showReview)}
                        style={styles.reviewToggleButton}
                    >
                        {showReview ? '收起作答紀錄 ▲' : '查看作答紀錄 ▼'}
                    </button>

                    {showReview && result.questionsWithResults && (
                        <div style={styles.reviewSection}>
                            {result.questionsWithResults.map((q, index) => (
                                <div
                                    key={index}
                                    style={{
                                        ...styles.reviewItem,
                                        ...(q.isCorrect ? styles.reviewItemCorrect : styles.reviewItemWrong),
                                    }}
                                >
                                    <div style={styles.reviewHeader}>
                                        <span style={styles.reviewIndex}>第 {index + 1} 題</span>
                                        <span style={q.isCorrect ? styles.reviewCorrectBadge : styles.reviewWrongBadge}>
                                            {q.isCorrect ? '✓ 正確' : '✗ 錯誤'}
                                        </span>
                                    </div>
                                    <p style={styles.reviewQuestion}>{q.question}</p>
                                    <div style={styles.reviewOptions}>
                                        {q.options.map((option, optIdx) => (
                                            <div
                                                key={optIdx}
                                                style={{
                                                    ...styles.reviewOption,
                                                    ...(optIdx === q.correctAnswer ? styles.reviewOptionCorrect : {}),
                                                    ...(optIdx === q.userAnswer && !q.isCorrect ? styles.reviewOptionWrong : {}),
                                                }}
                                            >
                                                <span style={styles.reviewOptionLetter}>
                                                    {String.fromCharCode(65 + optIdx)}
                                                </span>
                                                <span>{option}</span>
                                                {optIdx === q.correctAnswer && (
                                                    <span style={styles.correctLabel}>正確答案</span>
                                                )}
                                                {optIdx === q.userAnswer && optIdx !== q.correctAnswer && (
                                                    <span style={styles.yourAnswerLabel}>你的答案</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {q.explanation && (
                                        <div style={styles.explanationBox}>
                                            <div style={styles.explanationHeader}>
                                                <span style={{ fontSize: '16px', marginRight: '6px' }}>🤖</span>
                                                AI 戰情室解析
                                            </div>
                                            <p style={styles.explanationText}>{q.explanation}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <Link href="/academy" style={styles.continueButton}>
                        繼續學習其他課程
                    </Link>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <Link href={`/academy/${topicId}`} style={styles.closeButton}>
                    ✕
                </Link>
                <span style={styles.topicLabel}>{topicName}</span>
                <span style={styles.questionCount}>
                    {currentIndex + 1} / {questions.length}
                </span>
            </div>

            <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${progress}%` }} />
            </div>

            <div style={styles.questionContainer}>
                <h2 style={styles.question}>{currentQuestion.question}</h2>

                <div style={styles.options}>
                    {currentQuestion.options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleAnswer(idx)}
                            style={{
                                ...styles.optionButton,
                                ...(answers[currentIndex] === idx
                                    ? styles.optionButtonSelected
                                    : {}),
                            }}
                        >
                            <span style={styles.optionLetter}>
                                {String.fromCharCode(65 + idx)}
                            </span>
                            <span style={styles.optionText}>{option}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div style={styles.navigation}>
                <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    style={{
                        ...styles.navButton,
                        ...(currentIndex === 0 ? styles.navButtonDisabled : {}),
                    }}
                >
                    ← 上一題
                </button>

                {currentIndex === questions.length - 1 ? (
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        style={styles.submitButton}
                    >
                        {submitting ? '提交中...' : '提交答案'}
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        disabled={answers[currentIndex] === -1}
                        style={{
                            ...styles.navButton,
                            ...styles.navButtonPrimary,
                            ...(answers[currentIndex] === -1 ? styles.navButtonDisabled : {}),
                        }}
                    >
                        下一題 →
                    </button>
                )}
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 30px',
        color: 'white',
    },
    closeButton: {
        color: 'white',
        textDecoration: 'none',
        fontSize: '20px',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
    },
    topicLabel: {
        fontSize: '16px',
        fontWeight: '600',
    },
    questionCount: {
        fontSize: '14px',
        color: 'rgba(255,255,255,0.7)',
    },
    progressBar: {
        height: '4px',
        background: 'rgba(255,255,255,0.1)',
        margin: '0 30px',
        borderRadius: '2px',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
        transition: 'width 0.3s ease',
    },
    questionContainer: {
        padding: '60px 30px',
        maxWidth: '700px',
        margin: '0 auto',
    },
    question: {
        fontSize: '24px',
        fontWeight: '700',
        color: 'white',
        marginBottom: '40px',
        lineHeight: '1.5',
        textAlign: 'center',
    },
    options: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    optionButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '20px 24px',
        background: 'rgba(255,255,255,0.05)',
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: '16px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        textAlign: 'left',
    },
    optionButtonSelected: {
        background: 'rgba(102, 126, 234, 0.3)',
        borderColor: '#667eea',
    },
    optionLetter: {
        width: '36px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '50%',
        color: 'white',
        fontSize: '14px',
        fontWeight: '700',
        flexShrink: 0,
    },
    optionText: {
        fontSize: '16px',
        color: 'white',
        lineHeight: '1.5',
    },
    navigation: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '30px',
        maxWidth: '700px',
        margin: '0 auto',
    },
    navButton: {
        padding: '14px 28px',
        borderRadius: '30px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        background: 'rgba(255,255,255,0.1)',
        border: 'none',
        color: 'white',
    },
    navButtonPrimary: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    navButtonDisabled: {
        opacity: 0.3,
        cursor: 'not-allowed',
    },
    submitButton: {
        padding: '14px 36px',
        borderRadius: '30px',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        border: 'none',
        color: 'white',
        boxShadow: '0 4px 20px rgba(17, 153, 142, 0.4)',
    },
    loadingContainer: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: 'white',
        fontSize: '18px',
    },
    spinner: {
        width: '48px',
        height: '48px',
        border: '4px solid rgba(255,255,255,0.1)',
        borderTopColor: '#667eea',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px',
    },
    errorContainer: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    },
    errorText: {
        color: '#ef4444',
        fontSize: '18px',
        marginBottom: '20px',
    },
    backButton: {
        color: 'white',
        textDecoration: 'none',
        padding: '12px 24px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '8px',
    },
    resultContainer: {
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        padding: '20px',
    },
    resultCard: {
        background: 'white',
        borderRadius: '30px',
        padding: '50px',
        textAlign: 'center',
        maxWidth: '800px', // Widened from 450px
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        transition: 'max-width 0.3s ease', // Smooth transition if we toggle
    },
    resultIcon: {
        fontSize: '64px',
        marginBottom: '16px',
    },
    resultTitle: {
        fontSize: '28px',
        fontWeight: '800',
        color: '#1a1a2e',
        margin: '0 0 30px 0',
    },
    scoreCircle: {
        width: '140px',
        height: '140px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '0 auto 30px',
    },
    scoreNumber: {
        fontSize: '36px',
        fontWeight: '800',
        color: 'white',
    },
    scoreLabel: {
        fontSize: '12px',
        color: 'rgba(255,255,255,0.8)',
        marginTop: '4px',
    },
    rewardsGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '24px',
    },
    rewardItem: {
        background: '#f8fafc',
        padding: '20px',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
    },
    rewardIcon: {
        fontSize: '24px',
    },
    rewardValue: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#11998e',
    },
    rewardLabel: {
        fontSize: '12px',
        color: '#64748b',
    },
    totalSection: {
        background: '#f8fafc',
        padding: '16px',
        borderRadius: '12px',
        marginBottom: '24px',
        fontSize: '14px',
        color: '#475569',
    },
    continueButton: {
        display: 'inline-block',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '16px 32px',
        borderRadius: '30px',
        fontSize: '16px',
        fontWeight: '700',
        textDecoration: 'none',
    },
    reviewToggleButton: {
        width: '100%',
        padding: '14px 24px',
        marginBottom: '16px',
        background: 'transparent',
        border: '2px solid #e2e8f0',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600',
        color: '#475569',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    reviewSection: {
        maxHeight: '400px',
        overflowY: 'auto',
        marginBottom: '24px',
        textAlign: 'left',
    },
    reviewItem: {
        padding: '16px',
        marginBottom: '12px',
        borderRadius: '12px',
        borderWidth: '2px',
        borderStyle: 'solid',
    },
    reviewItemCorrect: {
        background: '#f0fdf4',
        borderColor: '#22c55e',
    },
    reviewItemWrong: {
        background: '#fef2f2',
        borderColor: '#ef4444',
    },
    reviewHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
    },
    reviewIndex: {
        fontSize: '12px',
        fontWeight: '600',
        color: '#64748b',
    },
    reviewCorrectBadge: {
        fontSize: '12px',
        fontWeight: '700',
        color: '#22c55e',
        background: 'rgba(34, 197, 94, 0.1)',
        padding: '4px 12px',
        borderRadius: '20px',
    },
    reviewWrongBadge: {
        fontSize: '12px',
        fontWeight: '700',
        color: '#ef4444',
        background: 'rgba(239, 68, 68, 0.1)',
        padding: '4px 12px',
        borderRadius: '20px',
    },
    reviewQuestion: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: '12px',
        lineHeight: '1.5',
    },
    reviewOptions: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    reviewOption: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        color: '#475569',
        padding: '8px 12px',
        borderRadius: '8px',
        background: 'rgba(0,0,0,0.02)',
    },
    reviewOptionCorrect: {
        background: 'rgba(34, 197, 94, 0.15)',
        color: '#166534',
        fontWeight: '600',
    },
    reviewOptionWrong: {
        background: 'rgba(239, 68, 68, 0.15)',
        color: '#dc2626',
        textDecoration: 'line-through',
    },
    reviewOptionLetter: {
        width: '20px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.05)',
        borderRadius: '50%',
        fontSize: '11px',
        fontWeight: '700',
        flexShrink: 0,
    },
    correctLabel: {
        marginLeft: 'auto',
        fontSize: '11px',
        fontWeight: '600',
        color: '#22c55e',
    },
    yourAnswerLabel: {
        marginLeft: 'auto',
        fontSize: '11px',
        fontWeight: '600',
        color: '#ef4444',
    },
    explanationBox: {
        marginTop: '16px',
        padding: '16px',
        background: '#f1f5f9', // Slate-100
        borderRadius: '12px',
        borderLeft: '4px solid #6366f1', // Indigo-500
        textAlign: 'left',
    },
    explanationHeader: {
        fontSize: '14px',
        fontWeight: '700',
        color: '#4f46e5', // Indigo-600
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
    },
    explanationText: {
        fontSize: '14px',
        color: '#334155', // Slate-700
        lineHeight: '1.6',
        margin: 0,
    },
};
