/**
 * AI ORCHESTRATOR - TEST SCRIPT
 * 
 * Run this to verify AIOrchestrator is working correctly
 * Tests all core functionality before migration
 */

import { aiOrchestrator } from '../AIOrchestrator';
import { configService } from '../ConfigService';
import { AIMessage } from '../types';

/**
 * Test 1: Basic Message Generation
 */
export async function test1_basicGeneration() {
  console.log('\n🧪 Test 1: Basic Message Generation');
  console.log('=' .repeat(50));
  
  try {
    const result = await aiOrchestrator.generate({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello World" and nothing else.' }
      ],
      config: {
        userId: 'test-user-id', // Replace with real user ID
        action: 'ai_message',
        temperature: 0,
        maxTokens: 50,
      }
    });
    
    console.log('✅ Success:', result.success);
    console.log('📝 Content:', result.content);
    console.log('🔢 Tokens Used:', result.meta.tokensUsed);
    console.log('💰 Cost (USD):', result.meta.costUSD);
    console.log('⚡ Energy Consumed:', result.meta.energyConsumed);
    console.log('🤖 Model:', result.meta.model);
    console.log('🏢 Provider:', result.meta.provider);
    console.log('⏱️ Latency:', result.meta.latencyMs, 'ms');
    
    return result.success;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

/**
 * Test 2: Config Service Caching
 */
export async function test2_configCaching() {
  console.log('\n🧪 Test 2: Config Service Caching');
  console.log('=' .repeat(50));
  
  try {
    const userId = 'test-user-id'; // Replace with real user ID
    
    // First load
    console.log('📥 Loading config (1st time - should hit database)...');
    const start1 = Date.now();
    const config1 = await configService.loadConfig(userId);
    const time1 = Date.now() - start1;
    console.log(`✅ Loaded in ${time1}ms`);
    console.log('📦 Cached:', config1.cached);
    
    // Second load (should be cached)
    console.log('\n📥 Loading config (2nd time - should be cached)...');
    const start2 = Date.now();
    const config2 = await configService.loadConfig(userId);
    const time2 = Date.now() - start2;
    console.log(`✅ Loaded in ${time2}ms`);
    console.log('📦 Cached:', config2.cached);
    
    // Verify caching improved speed
    if (config2.cached && time2 < time1) {
      console.log(`\n🚀 Cache speedup: ${Math.round((time1 / time2) * 100)}% faster`);
      return true;
    } else {
      console.log('\n⚠️ Warning: Cache may not be working properly');
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

/**
 * Test 3: Energy Integration
 */
export async function test3_energyIntegration() {
  console.log('\n🧪 Test 3: Energy Integration');
  console.log('=' .repeat(50));
  
  try {
    const userId = 'test-user-id'; // Replace with real user ID
    
    // Try to generate with energy check
    const result = await aiOrchestrator.generate({
      messages: [
        { role: 'user', content: 'Test message' }
      ],
      config: {
        userId,
        action: 'ai_message',
      }
    });
    
    if (!result.success && result.error?.includes('Insufficient energy')) {
      console.log('✅ Energy check working (user has insufficient energy)');
      console.log('💡 Tip: Add energy to this user to test generation');
      return true;
    } else if (result.success) {
      console.log('✅ Energy check passed, generation successful');
      console.log('⚡ Energy consumed:', result.meta.energyConsumed);
      return true;
    } else {
      console.log('❌ Unexpected error:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

/**
 * Test 4: Auto Model Selection
 */
export async function test4_autoModelSelection() {
  console.log('\n🧪 Test 4: Auto Model Selection');
  console.log('=' .repeat(50));
  
  try {
    const userId = 'test-user-id'; // Replace with real user ID
    
    // Test with auto-select enabled
    const result = await aiOrchestrator.generate({
      messages: [
        { role: 'user', content: 'Quick test' }
      ],
      config: {
        userId,
        action: 'ai_message',
        autoSelectModel: true, // Enable auto-selection
      }
    });
    
    console.log('✅ Auto-selection result:');
    console.log('🤖 Model selected:', result.meta.model);
    console.log('💰 Cost:', result.meta.costUSD);
    console.log('⚡ Energy:', result.meta.energyConsumed);
    
    // Check if cheaper model was selected
    if (result.meta.model === 'gpt-3.5-turbo') {
      console.log('💡 Used cheaper model (likely due to tier or energy)');
    }
    
    return result.success;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

/**
 * Test 5: Error Handling
 */
export async function test5_errorHandling() {
  console.log('\n🧪 Test 5: Error Handling');
  console.log('=' .repeat(50));
  
  try {
    // Test with invalid user ID
    const result = await aiOrchestrator.generate({
      messages: [
        { role: 'user', content: 'Test' }
      ],
      config: {
        userId: 'invalid-user-id-that-does-not-exist',
        action: 'ai_message',
      }
    });
    
    console.log('Success:', result.success);
    console.log('Error handling:', result.error ? '✅ Graceful' : '❌ No error returned');
    
    return !result.success && !!result.error;
  } catch (error) {
    console.log('✅ Error caught properly');
    return true;
  }
}

/**
 * Test 6: Metrics Tracking
 */
export async function test6_metricsTracking() {
  console.log('\n🧪 Test 6: Metrics Tracking');
  console.log('=' .repeat(50));
  
  try {
    const metrics = aiOrchestrator.getMetrics();
    
    console.log('📊 Current Metrics:');
    console.log('  Total Requests:', metrics.totalRequests);
    console.log('  Total Tokens:', metrics.totalTokens);
    console.log('  Total Cost: $', metrics.totalCost.toFixed(4));
    console.log('  Avg Latency:', metrics.averageLatency.toFixed(0), 'ms');
    console.log('  Error Rate:', (metrics.errorRate * 100).toFixed(2), '%');
    console.log('  Cache Hit Rate:', (metrics.cacheHitRate * 100).toFixed(2), '%');
    
    console.log('\n📈 Provider Distribution:');
    for (const [provider, count] of Object.entries(metrics.providerDistribution)) {
      console.log(`  ${provider}: ${count} requests`);
    }
    
    console.log('\n🤖 Model Distribution:');
    for (const [model, count] of Object.entries(metrics.modelDistribution)) {
      console.log(`  ${model}: ${count} requests`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

/**
 * Run All Tests
 */
export async function runAllTests() {
  console.log('\n🚀 AIOrchestrator Test Suite');
  console.log('=' .repeat(50));
  console.log('Running all tests...\n');
  
  const results = {
    test1: await test1_basicGeneration(),
    test2: await test2_configCaching(),
    test3: await test3_energyIntegration(),
    test4: await test4_autoModelSelection(),
    test5: await test5_errorHandling(),
    test6: await test6_metricsTracking(),
  };
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📋 TEST SUMMARY');
  console.log('=' .repeat(50));
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  console.log('\n' + '=' .repeat(50));
  console.log(`${passed}/${total} tests passed (${Math.round((passed / total) * 100)}%)`);
  console.log('=' .repeat(50));
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! AIOrchestrator is ready for production.');
  } else {
    console.log('\n⚠️ Some tests failed. Review errors above before migration.');
  }
  
  return passed === total;
}

/**
 * Quick Test (for development)
 */
export async function quickTest(userId: string) {
  console.log('\n⚡ Quick Test');
  console.log('=' .repeat(50));
  
  const result = await aiOrchestrator.generate({
    messages: [
      { role: 'user', content: 'Say "Test successful!" and nothing else.' }
    ],
    config: {
      userId,
      action: 'ai_message',
      temperature: 0,
      maxTokens: 20,
    }
  });
  
  if (result.success) {
    console.log('✅ SUCCESS!');
    console.log('Response:', result.content);
    console.log('Model:', result.meta.model);
    console.log('Cost: $', result.meta.costUSD);
  } else {
    console.log('❌ FAILED:', result.error);
  }
  
  return result.success;
}

// Export for use in console or scripts
if (typeof window !== 'undefined') {
  (window as any).aiOrchestratorTests = {
    runAllTests,
    quickTest,
    test1_basicGeneration,
    test2_configCaching,
    test3_energyIntegration,
    test4_autoModelSelection,
    test5_errorHandling,
    test6_metricsTracking,
  };
  
  console.log('💡 AIOrchestrator tests loaded! Run in console:');
  console.log('   aiOrchestratorTests.quickTest("your-user-id")');
  console.log('   aiOrchestratorTests.runAllTests()');
}





