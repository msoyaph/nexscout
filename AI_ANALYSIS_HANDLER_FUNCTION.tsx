// ===== ADD THIS FUNCTION TO ChatbotSessionViewerPage.tsx =====
// ADD after the existing handleRegenerateAnalysis function (around line 275)

// ============================================
// COMPREHENSIVE AI ANALYSIS (PHASES 1-3)
// ============================================
async function handleComprehensiveAnalysis() {
  // Check coin balance (3 coins for analysis)
  if (coinBalance < 3) {
    alert('❌ Insufficient coins!\n\nYou need 3 coins for AI Analysis.\n\nCurrent balance: ' + coinBalance + ' coins');
    setShowBuyCoinsModal(true);
    return;
  }

  setGeneratingAnalysis(true);
  
  try {
    console.log('[AIAnalysis] Starting comprehensive analysis for session:', sessionId);
    
    // Deduct coins first
    const { error: coinError } = await supabase
      .from('profiles')
      .update({ coin_balance: coinBalance - 3 })
      .eq('id', user?.id);
    
    if (coinError) throw coinError;
    
    setCoinBalance(coinBalance - 3);
    console.log('[AIAnalysis] ✅ 3 coins deducted');
    
    // Import the intelligent analytics service
    const { intelligentProgressAnalytics } = await import('../services/prospects/intelligentProgressAnalytics');
    
    // Get comprehensive AI analysis
    console.log('[AIAnalysis] Calling intelligentProgressAnalytics...');
    const analysisData = await intelligentProgressAnalytics.getIntelligentProgressData(
      sessionId!, // Use sessionId as prospectId for now
      user?.id || ''
    );
    
    console.log('[AIAnalysis] ✅ Analysis complete:', analysisData);
    
    // Save comprehensive analysis to state (persists in modal)
    setComprehensiveAnalysis(analysisData);
    setLastAnalyzedAt(new Date().toLocaleString());
    
    // Update old analysis format for backwards compatibility
    setAnalysis({
      leadTemperature: analysisData.predictions?.closeProbability > 70 ? 'hot' :
                       analysisData.predictions?.closeProbability > 50 ? 'warm' : 'cold',
      qualificationScore: analysisData.scoutScore,
      intent: analysisData.emotionalState?.currentEmotion || 'Unknown',
      buyingSignals: analysisData.behavioralPatterns?.buyingSignals || [],
      objections: [],
      questions: [],
      sentiment: analysisData.emotionalState?.valence > 0 ? 'positive' : 
                 analysisData.emotionalState?.valence < 0 ? 'negative' : 'neutral',
      recommendedActions: analysisData.nextActions.slice(0, 3).map(a => a.title) || []
    });
    
    console.log('[AIAnalysis] ✅ Analysis saved to state - will persist until regeneration');
    
    // Don't close the modal - keep it open to show results!
    
  } catch (error) {
    console.error('[AIAnalysis] ❌ Error:', error);
    
    // Refund coins on error
    await supabase
      .from('profiles')
      .update({ coin_balance: coinBalance })
      .eq('id', user?.id);
    
    setCoinBalance(coinBalance);
    
    alert('❌ Failed to generate analysis.\n\nYour coins have been refunded.\n\nError: ' + (error instanceof Error ? error.message : 'Unknown error'));
  } finally {
    setGeneratingAnalysis(false);
  }
}

