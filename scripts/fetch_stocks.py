import sys
import json
import yfinance as yf
import twstock

def fetch_stock_data(symbols):
    data = {}
    
    for symbol in symbols:
        try:
            # 1. Fetch Price Data via yfinance
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            price = info.get('currentPrice') or info.get('regularMarketPrice') or info.get('previousClose')
            change = 0
            change_percent = 0
            
            previous_close = info.get('previousClose')
            if price and previous_close:
                change = price - previous_close
                change_percent = (change / previous_close) * 100

            # 2. Resolve Traditional Chinese Name via twstock
            # Standardize symbol (remove .TW or .TWO)
            code = symbol.split('.')[0]
            chinese_name = info.get('shortName') or info.get('longName') or symbol # Default fallback
            
            if code in twstock.codes:
                chinese_name = twstock.codes[code].name

            data[symbol] = {
                'symbol': symbol,
                'shortName': chinese_name,
                'regularMarketPrice': price,
                'regularMarketChange': change,
                'regularMarketChangePercent': change_percent
            }
        except Exception as e:
            # print(f"Error for {symbol}: {e}", file=sys.stderr)
            pass
            
    print(json.dumps(data, ensure_ascii=False))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({}))
    else:
        # Check encoding for Windows output to avoid garbled text
        if sys.platform.startswith('win'):
            sys.stdout.reconfigure(encoding='utf-8')
            
        symbols = sys.argv[1:]
        fetch_stock_data(symbols)
