// ===== ENHANCED AI ANALYSIS MODAL FOR ChatbotSessionViewerPage.tsx =====
// REPLACE the existing modal (lines 1675-1760) with this comprehensive version

{/* ============================================ */}
{/* ENHANCED AI ANALYSIS MODAL - PHASES 1-3 */}
{/* ============================================ */}
{showGenerateAnalysisModal && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-5 flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="w-7 h-7" />
          AI-Powered Prospect Analysis
        </h3>
        <button
          onClick={() => setShowGenerateAnalysisModal(false)}
          className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* ===== GENERATING STATE ===== */}
        {generatingAnalysis && !comprehensiveAnalysis && (
          <div className="text-center py-12">
            <div className="inline-block">
              <Loader2 className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-4" />
              <h4 className="text-xl font-bold text-gray-900 mb-2">🧠 AI is Analyzing...</h4>
              <p className="text-gray-600 mb-4">Processing conversation with 8 AI systems</p>
              <div className="space-y-2 text-sm text-gray-700 text-left max-w-md mx-auto">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Analyzing chat messages...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Detecting emotional state...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Identifying behavioral patterns...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Calculating ML predictions...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Generating GPT-4 insights...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Creating personalized recommendations...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== COMPREHENSIVE RESULTS (After Analysis) ===== */}
        {comprehensiveAnalysis && !generatingAnalysis && (
          <div className="space-y-6">
            
            {/* Overview Card */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Analysis Overview
                </h4>
                <span className="text-xs text-gray-500">
                  Updated: {new Date().toLocaleString()}
                </span>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {comprehensiveAnalysis.scoutScore}
                  </div>
                  <div className="text-xs text-gray-600">Scout Score</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold mb-1">
                    {comprehensiveAnalysis.predictions?.closeProbability || 50}%
                  </div>
                  <div className="text-xs text-gray-600">Close Probability</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center">
                  <div className="text-lg font-bold text-gray-900 mb-1 capitalize">
                    {comprehensiveAnalysis.currentStage}
                  </div>
                  <div className="text-xs text-gray-600">Current Stage</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center">
                  <div className="text-sm font-bold text-gray-900 mb-1">
                    {comprehensiveAnalysis.timeInStage}
                  </div>
                  <div className="text-xs text-gray-600">In Stage</div>
                </div>
              </div>
            </div>

            {/* GPT-4 AI Insights */}
            {comprehensiveAnalysis.aiInsights && comprehensiveAnalysis.aiInsights.length > 0 && (
              <div className="bg-white border-2 border-blue-200 rounded-2xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-600" />
                  🤖 AI Insights {comprehensiveAnalysis.scoutScore > 60 && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">GPT-4 Enhanced</span>}
                </h4>
                <div className="space-y-2">
                  {comprehensiveAnalysis.aiInsights.map((insight: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                      <span className={`text-lg ${
                        insight.type === 'positive' ? 'text-green-600' :
                        insight.type === 'warning' ? 'text-amber-600' :
                        insight.type === 'critical' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {insight.icon}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{insight.text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{insight.source}</span>
                          {insight.confidence && (
                            <span className="text-xs text-gray-400">• {Math.round(insight.confidence * 100)}% confidence</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Emotional Intelligence */}
            {comprehensiveAnalysis.emotionalState && (
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 rounded-2xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">❤️</span>
                  Emotional Intelligence
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4">
                    <div className="text-xs text-gray-600 mb-1">Current Emotion</div>
                    <div className="text-lg font-bold text-purple-600 capitalize">
                      {comprehensiveAnalysis.emotionalState.currentEmotion}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4">
                    <div className="text-xs text-gray-600 mb-1">Trend</div>
                    <div className={`text-lg font-bold ${
                      comprehensiveAnalysis.emotionalState.trend === 'improving' ? 'text-green-600' :
                      comprehensiveAnalysis.emotionalState.trend === 'declining' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {comprehensiveAnalysis.emotionalState.trend === 'improving' ? '↗️ Improving' :
                       comprehensiveAnalysis.emotionalState.trend === 'declining' ? '↘️ Declining' :
                       '→ Stable'}
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-white rounded-xl">
                  <div className="text-xs text-gray-600 mb-2">Valence (Sentiment)</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${comprehensiveAnalysis.emotionalState.valence > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.abs(comprehensiveAnalysis.emotionalState.valence) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold">
                      {comprehensiveAnalysis.emotionalState.valence > 0 ? '+' : ''}{(comprehensiveAnalysis.emotionalState.valence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-purple-100 rounded-xl">
                  <div className="text-xs font-bold text-purple-900 mb-1">💡 Recommended Approach:</div>
                  <div className="text-sm text-gray-900">
                    <strong>Tone:</strong> {comprehensiveAnalysis.emotionalState.recommendedTone}<br/>
                    <strong>Strategy:</strong> {comprehensiveAnalysis.emotionalState.persuasionStrategy}
                  </div>
                </div>
              </div>
            )}

            {/* Behavioral Patterns */}
            {comprehensiveAnalysis.behavioralPatterns && (
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  🎯 Behavioral Patterns
                </h4>
                
                {/* Peak Activity */}
                {comprehensiveAnalysis.behavioralPatterns.peakActivityHours && comprehensiveAnalysis.behavioralPatterns.peakActivityHours.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-gray-700 mb-2">🕒 Peak Activity Times:</div>
                    <div className="flex flex-wrap gap-2">
                      {comprehensiveAnalysis.behavioralPatterns.peakActivityHours.map((time: string, i: number) => (
                        <span key={i} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          ⏰ {time}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Buying Signals */}
                {comprehensiveAnalysis.behavioralPatterns.buyingSignals && comprehensiveAnalysis.behavioralPatterns.buyingSignals.length > 0 && (
                  <div className="p-4 bg-white rounded-xl border-2 border-green-300">
                    <div className="text-sm font-bold text-green-900 mb-3">🎯 Buying Signals Detected:</div>
                    <div className="space-y-2">
                      {comprehensiveAnalysis.behavioralPatterns.buyingSignals.map((signal: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-green-600 font-bold">✓</span>
                          <span>{signal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Drop-Off Risk */}
                <div className="mt-4 p-4 bg-white rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Drop-Off Risk:</span>
                    <span className={`text-lg font-bold ${
                      comprehensiveAnalysis.behavioralPatterns.dropOffRisk > 0.7 ? 'text-red-600' :
                      comprehensiveAnalysis.behavioralPatterns.dropOffRisk > 0.4 ? 'text-amber-600' :
                      'text-green-600'
                    }`}>
                      {(comprehensiveAnalysis.behavioralPatterns.dropOffRisk * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        comprehensiveAnalysis.behavioralPatterns.dropOffRisk > 0.7 ? 'bg-red-500' :
                        comprehensiveAnalysis.behavioralPatterns.dropOffRisk > 0.4 ? 'bg-amber-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${(comprehensiveAnalysis.behavioralPatterns.dropOffRisk * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ML Predictions */}
            {comprehensiveAnalysis.predictions && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                  📈 ML Predictions
                </h4>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white rounded-xl p-4">
                    <div className="text-xs text-gray-600 mb-1">Close Probability</div>
                    <div className="text-2xl font-bold text-amber-600">
                      {comprehensiveAnalysis.predictions.closeProbability}%
                    </div>
                    <div className="text-xs text-gray-500">
                      Confidence: {comprehensiveAnalysis.predictions.confidence}%
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4">
                    <div className="text-xs text-gray-600 mb-1">Est. Timeline</div>
                    <div className="text-xl font-bold text-gray-900">
                      {comprehensiveAnalysis.predictions.daysToClose}
                    </div>
                    <div className="text-xs text-gray-500">
                      Next: {comprehensiveAnalysis.predictions.nextStage}
                    </div>
                  </div>
                </div>
                
                {/* Bottlenecks */}
                {comprehensiveAnalysis.predictions.bottlenecks && comprehensiveAnalysis.predictions.bottlenecks.length > 0 && (
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-gray-700 mb-2">⚠️ Bottlenecks:</div>
                    {comprehensiveAnalysis.predictions.bottlenecks.map((b: string, i: number) => (
                      <div key={i} className="text-sm text-gray-700 ml-4">• {b}</div>
                    ))}
                  </div>
                )}
                
                {/* Accelerators */}
                {comprehensiveAnalysis.predictions.accelerators && comprehensiveAnalysis.predictions.accelerators.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-2">⚡ Accelerators:</div>
                    {comprehensiveAnalysis.predictions.accelerators.map((a: string, i: number) => (
                      <div key={i} className="text-sm text-gray-700 ml-4">• {a}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Engagement Metrics */}
            {comprehensiveAnalysis.metrics && (
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-gray-600" />
                  📊 Engagement Metrics
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-xl">
                    <div className="text-2xl font-bold text-blue-600">{comprehensiveAnalysis.metrics.messagesSent || 0}</div>
                    <div className="text-xs text-gray-600">Messages</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-xl">
                    <div className="text-2xl font-bold text-green-600">{comprehensiveAnalysis.metrics.messagesReplied || 0}</div>
                    <div className="text-xs text-gray-600">Replies</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-xl">
                    <div className="text-2xl font-bold text-purple-600">{comprehensiveAnalysis.metrics.linkClicks || 0}</div>
                    <div className="text-xs text-gray-600">Clicks</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Engagement Score:</span>
                    <span className="text-lg font-bold text-purple-600">
                      {comprehensiveAnalysis.metrics.engagementScore || 0}/100
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Top Recommended Actions */}
            {comprehensiveAnalysis.nextActions && comprehensiveAnalysis.nextActions.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-600" />
                  🔥 Top Recommended Actions
                </h4>
                <div className="space-y-3">
                  {comprehensiveAnalysis.nextActions.slice(0, 3).map((action: any, i: number) => (
                    <div key={i} className={`p-4 bg-white rounded-xl border-2 ${
                      action.priority === 'critical' ? 'border-red-300' :
                      action.priority === 'high' ? 'border-amber-300' :
                      'border-gray-200'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              action.priority === 'critical' ? 'bg-red-100 text-red-700' :
                              action.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {action.priority.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">Impact: {action.impactScore}/100</span>
                          </div>
                          <div className="font-bold text-gray-900">{action.title}</div>
                          <div className="text-sm text-gray-700 mt-1">{action.description}</div>
                        </div>
                      </div>
                      {action.aiReasoning && (
                        <div className="mt-2 p-3 bg-purple-50 rounded-lg">
                          <div className="text-xs font-semibold text-purple-900 mb-1">🤖 AI Reasoning:</div>
                          <div className="text-xs text-gray-700">{action.aiReasoning}</div>
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                        <span>⏰ {action.bestTime}</span>
                        <span>💎 {action.coinCost} coins</span>
                        <span>📈 {Math.round(action.successProbability * 100)}% success</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== INITIAL STATE (Before Analysis) ===== */}
        {!generatingAnalysis && !comprehensiveAnalysis && (
          <div className="text-center py-12">
            <Brain className="w-20 h-20 text-purple-600 mx-auto mb-4 opacity-50" />
            <h4 className="text-xl font-bold text-gray-900 mb-2">Ready to Analyze</h4>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              AI will analyze this conversation using 8 intelligent systems including GPT-4, 
              emotional intelligence, behavioral patterns, and ML predictions.
            </p>
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl mb-4">
                <div className="text-sm font-bold text-purple-900 mb-3">Analysis Includes:</div>
                <div className="space-y-2 text-sm text-gray-700 text-left">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>GPT-4 powered insights</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Emotional intelligence tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Behavioral pattern recognition</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>ML close probability prediction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Peak activity time detection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Buying signal recognition</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Personalized recommendations</span>
                  </div>
                </div>
              </div>
              
              {/* Cost Display */}
              <div className="p-4 bg-purple-100 rounded-xl mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-purple-900">Analysis Cost:</span>
                  <span className="text-2xl font-bold text-purple-600">💎 3 Coins</span>
                </div>
              </div>
              
              {/* Balance */}
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <span className="text-sm text-gray-600">Your Balance: </span>
                <span className="text-lg font-bold text-gray-900">💎 {coinBalance} Coins</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Buttons */}
      <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 rounded-b-3xl border-t border-gray-200">
        <button
          onClick={() => setShowGenerateAnalysisModal(false)}
          disabled={generatingAnalysis}
          className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-semibold disabled:opacity-50"
        >
          {comprehensiveAnalysis ? 'Close' : 'Cancel'}
        </button>
        {!comprehensiveAnalysis && (
          <button
            onClick={handleComprehensiveAnalysis}
            disabled={generatingAnalysis || coinBalance < 3}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generatingAnalysis ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Analysis (3 Coins)
              </>
            )}
          </button>
        )}
        {comprehensiveAnalysis && (
          <button
            onClick={handleComprehensiveAnalysis}
            disabled={generatingAnalysis || coinBalance < 3}
            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generatingAnalysis ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Regenerate (3 Coins)
              </>
            )}
          </button>
        )}
      </div>
    </div>
  </div>
)}

