/**
 * CONFIG SERVICE
 * 
 * Centralized, cached configuration loader
 * Single source of truth for all AI engines
 * 
 * Features:
 * - In-memory caching (5 min TTL)
 * - Parallel loading of all config data
 * - Graceful fallbacks to defaults
 * - Type-safe configuration
 */

import { supabase } from '../../lib/supabase';
import { WorkspaceConfig, getDefaultWorkspaceConfig } from '../../types/WorkspaceConfig';
import { loadWorkspaceConfig } from '../workspaceConfig.service';

export interface UserProfile {
  id: string;
  subscription_tier: string;
  coin_balance: number;
  daily_messages_used: number;
  last_reset_date: string;
  workspace_id?: string;
}

export interface CompanyData {
  name: string;
  industry: string;
  description?: string;
  website?: string;
  brandVoice?: string;
  targetAudience?: string;
}

export interface ProductData {
  id: string;
  name: string;
  description: string;
  price?: number;
  category?: string;
  features?: string[];
}

export interface AISettings {
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  customInstructions?: string;
  systemPrompt?: string;
}

export interface CompleteConfig {
  // User context
  user: UserProfile;
  
  // Workspace/Company context
  workspace: WorkspaceConfig;
  company: CompanyData;
  products: ProductData[];
  
  // AI settings
  aiSettings: AISettings;
  
  // Metadata
  loadedAt: Date;
  cached: boolean;
}

interface CacheEntry {
  config: CompleteConfig;
  expiresAt: number;
}

/**
 * ConfigService - Singleton pattern
 */
class ConfigService {
  private static instance: ConfigService;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
  
  private constructor() {
    // Private constructor for singleton
  }
  
  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }
  
  /**
   * Load complete configuration for a user
   * Uses cache if available and not expired
   */
  async loadConfig(userId: string): Promise<CompleteConfig> {
    // Check cache first
    const cached = this.getFromCache(userId);
    if (cached) {
      return cached;
    }
    
    // Load fresh config
    const config = await this.fetchConfig(userId);
    
    // Cache it
    this.setInCache(userId, config);
    
    return config;
  }
  
  /**
   * Invalidate cache for a user
   */
  invalidate(userId: string): void {
    this.cache.delete(userId);
  }
  
  /**
   * Clear entire cache
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
  
  // ========================================
  // PRIVATE METHODS
  // ========================================
  
  private getFromCache(userId: string): CompleteConfig | null {
    const entry = this.cache.get(userId);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(userId);
      return null;
    }
    
    return {
      ...entry.config,
      cached: true,
    };
  }
  
  private setInCache(userId: string, config: CompleteConfig): void {
    this.cache.set(userId, {
      config,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });
  }
  
  /**
   * Fetch all config data in parallel
   */
  private async fetchConfig(userId: string): Promise<CompleteConfig> {
    try {
      // Load everything in parallel
      const [userProfile, workspaceId] = await Promise.all([
        this.loadUserProfile(userId),
        this.getUserWorkspaceId(userId),
      ]);
      
      // Load workspace-specific data (needs workspaceId first)
      const [workspace, company, products, aiSettings] = await Promise.all([
        this.loadWorkspace(workspaceId),
        this.loadCompany(userId),
        this.loadProducts(userId),
        this.loadAISettings(userId),
      ]);
      
      return {
        user: userProfile,
        workspace,
        company,
        products,
        aiSettings,
        loadedAt: new Date(),
        cached: false,
      };
    } catch (error) {
      console.error('[ConfigService] Error loading config:', error);
      
      // Return minimal safe defaults
      return this.getDefaultConfig(userId);
    }
  }
  
  private async loadUserProfile(userId: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, subscription_tier, coin_balance, daily_messages_used, last_reset_date, workspace_id')
      .eq('id', userId)
      .maybeSingle();
    
    if (error || !data) {
      console.error('[ConfigService] Error loading user profile:', error);
      return {
        id: userId,
        subscription_tier: 'free',
        coin_balance: 0,
        daily_messages_used: 0,
        last_reset_date: new Date().toISOString().split('T')[0],
      };
    }
    
    return data as UserProfile;
  }
  
  private async getUserWorkspaceId(userId: string): Promise<string> {
    const { data } = await supabase
      .from('profiles')
      .select('workspace_id')
      .eq('id', userId)
      .maybeSingle();
    
    return data?.workspace_id || userId; // Fallback to userId as workspaceId
  }
  
  private async loadWorkspace(workspaceId: string): Promise<WorkspaceConfig> {
    try {
      return await loadWorkspaceConfig(workspaceId);
    } catch (error) {
      console.error('[ConfigService] Error loading workspace:', error);
      return getDefaultWorkspaceConfig(workspaceId, 'My Company');
    }
  }
  
  private async loadCompany(userId: string): Promise<CompanyData> {
    const { data } = await supabase
      .from('company_data')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!data) {
      return {
        name: 'My Company',
        industry: 'general',
      };
    }
    
    return {
      name: data.company_name || 'My Company',
      industry: data.industry || 'general',
      description: data.description,
      website: data.website,
      brandVoice: data.brand_voice,
      targetAudience: data.target_audience,
    };
  }
  
  private async loadProducts(userId: string): Promise<ProductData[]> {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!data) {
      return [];
    }
    
    return data.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      price: p.price,
      category: p.category,
      features: p.features || [],
    }));
  }
  
  private async loadAISettings(userId: string): Promise<AISettings> {
    const { data } = await supabase
      .from('ai_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!data) {
      return {
        defaultModel: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 1000,
      };
    }
    
    return {
      defaultModel: data.default_model || 'gpt-4o',
      temperature: data.temperature ?? 0.7,
      maxTokens: data.max_tokens || 1000,
      customInstructions: data.custom_instructions,
      systemPrompt: data.system_prompt,
    };
  }
  
  private getDefaultConfig(userId: string): CompleteConfig {
    return {
      user: {
        id: userId,
        subscription_tier: 'free',
        coin_balance: 0,
        daily_messages_used: 0,
        last_reset_date: new Date().toISOString().split('T')[0],
      },
      workspace: getDefaultWorkspaceConfig(userId, 'My Company'),
      company: {
        name: 'My Company',
        industry: 'general',
      },
      products: [],
      aiSettings: {
        defaultModel: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 1000,
      },
      loadedAt: new Date(),
      cached: false,
    };
  }
}

// Export singleton instance
export const configService = ConfigService.getInstance();





