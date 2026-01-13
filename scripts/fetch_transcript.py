"""
YouTube 字幕擷取腳本
使用 youtube-transcript-api 套件
"""
import sys
import json
import io

# 設定 stdout 為 UTF-8 編碼
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

try:
    from youtube_transcript_api import YouTubeTranscriptApi
except ImportError:
    print(json.dumps({"error": "請安裝 youtube-transcript-api: pip install youtube-transcript-api"}))
    sys.exit(1)

def get_transcript(video_id: str) -> dict:
    """
    擷取 YouTube 影片字幕 - 簡化版
    """
    try:
        api = YouTubeTranscriptApi()
        
        # 直接使用 api.fetch 取得字幕
        # 這個方法在 1.x 版本中應該可用
        languages = ['zh-TW', 'zh-Hant', 'zh-HK', 'zh-Hans', 'zh', 'en']
        
        transcript_data = None
        
        # 嘗試 api.fetch (新版 API)
        if hasattr(api, 'fetch'):
            try:
                transcript_data = api.fetch(video_id, languages=languages)
            except Exception:
                try:
                    transcript_data = api.fetch(video_id)
                except Exception:
                    pass
        
        # 如果 fetch 失敗，嘗試 list + find_transcript
        if not transcript_data:
            try:
                if hasattr(api, 'list'):
                    t_list = api.list(video_id)
                elif hasattr(api, 'list_transcripts'):
                    t_list = api.list_transcripts(video_id)
                else:
                    raise Exception("API 無可用方法")
                
                # 找字幕
                target = None
                for t in t_list:
                    lang = getattr(t, 'language_code', '')
                    if lang in languages:
                        target = t
                        break
                
                if not target:
                    for t in t_list:
                        target = t
                        break
                
                if target:
                    transcript_data = target.fetch()
            except Exception:
                pass
        
        if not transcript_data:
            raise Exception("無法取得字幕")
        
        # 直接將資料轉為 list (強制轉換)
        # FetchedTranscript 支援 list() 轉換
        try:
            data_list = list(transcript_data)
        except:
            data_list = transcript_data
        
        # 組合文字
        text_parts = []
        for item in data_list:
            # 嘗試多種方式取得文字
            txt = None
            
            # 方法 1: 字典取值
            if isinstance(item, dict):
                txt = item.get('text', '')
            else:
                # 方法 2: 直接轉字串 (某些版本的 item 可能直接是文字容器)
                try:
                    # 某些版本回傳的 item 轉 dict 後可用
                    item_dict = dict(item)
                    txt = item_dict.get('text', '')
                except:
                    pass
                
                # 方法 3: 用 vars 取內部屬性
                if not txt:
                    try:
                        txt = vars(item).get('text', '')
                    except:
                        pass
                
                # 方法 4: 存取 __dict__
                if not txt:
                    try:
                        txt = item.__dict__.get('text', '')
                    except:
                        pass
                
                # 方法 5: 直接 str
                if not txt:
                    try:
                        s = str(item)
                        if s and not s.startswith('<'):
                            txt = s
                    except:
                        pass
            
            if txt:
                text_parts.append(txt)
        
        if not text_parts:
            raise Exception("字幕內容為空")
        
        full_text = '\n'.join(text_parts)
        
        return {
            "success": True,
            "transcript": full_text,
            "segments": len(text_parts)
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "請提供影片 ID"}))
        sys.exit(1)
    
    video_id = sys.argv[1]
    result = get_transcript(video_id)
    print(json.dumps(result, ensure_ascii=False))
