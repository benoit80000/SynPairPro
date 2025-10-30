export type TF = '1m'|'5m'|'1h'|'4h'|'1d'|'7d'|'30d';

// +++ Étend la liste des indicateurs sélectionnables +++
export type IndicatorKey =
  | 'rsi14' | 'ema20' | 'ema60' | 'bb' | 'sigma30' | 'z30'
  | 'sma50' | 'sma200' | 'ema200'
  | 'macd' | 'macdSignal' | 'macdHist'
  | 'atr14' | 'mfi14' | 'stoch14';

export const ALL_INDICATORS: IndicatorKey[] = [
  'rsi14','ema20','ema60','bb','sigma30','z30',
  'sma50','sma200','ema200','macd','macdSignal','macdHist','atr14','mfi14','stoch14'
];
