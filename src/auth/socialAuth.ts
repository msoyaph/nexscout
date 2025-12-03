import { supabase } from '../lib/supabase';

export type SocialProvider = 'facebook' | 'google' | 'linkedin' | 'twitter' | 'tiktok' | 'instagram';

export interface SocialAuthConfig {
  provider: SocialProvider;
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

export interface SocialIdentity {
  id: string;
  userId: string;
  provider: SocialProvider;
  providerUserId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  profileData: Record<string, any>;
  isActive: boolean;
}

export class SocialAuth {
  private static readonly PROVIDER_CONFIGS: Record<string, Partial<SocialAuthConfig>> = {
    facebook: {
      scopes: ['public_profile', 'email', 'pages_show_list', 'pages_read_engagement'],
    },
    google: {
      scopes: ['profile', 'email'],
    },
    linkedin: {
      scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
    },
    twitter: {
      scopes: ['tweet.read', 'users.read', 'offline.access'],
    },
    tiktok: {
      scopes: ['user.info.basic', 'video.list'],
    },
    instagram: {
      scopes: ['instagram_basic', 'instagram_manage_insights', 'pages_show_list'],
    },
  };

  static async startOAuthFlow(provider: SocialProvider): Promise<{ url: string }> {
    const config = this.getProviderConfig(provider);

    const state = this.generateState();
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_provider', provider);

    const authUrl = this.buildAuthUrl(provider, config, state);

    await this.logConnectAttempt(provider, 'oauth_start');

    return { url: authUrl };
  }

  private static getProviderConfig(provider: SocialProvider): SocialAuthConfig {
    const baseConfig = this.PROVIDER_CONFIGS[provider];

    return {
      provider,
      clientId: import.meta.env[`VITE_${provider.toUpperCase()}_CLIENT_ID`] || 'demo_client_id',
      redirectUri: `${window.location.origin}/auth/callback`,
      scopes: baseConfig?.scopes || [],
    };
  }

  private static buildAuthUrl(
    provider: SocialProvider,
    config: SocialAuthConfig,
    state: string
  ): string {
    const authUrls: Record<SocialProvider, string> = {
      facebook: 'https://www.facebook.com/v18.0/dialog/oauth',
      google: 'https://accounts.google.com/o/oauth2/v2/auth',
      linkedin: 'https://www.linkedin.com/oauth/v2/authorization',
      twitter: 'https://twitter.com/i/oauth2/authorize',
      tiktok: 'https://www.tiktok.com/auth/authorize',
      instagram: 'https://api.instagram.com/oauth/authorize',
    };

    const baseUrl = authUrls[provider];
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      response_type: 'code',
      state,
    });

    return `${baseUrl}?${params.toString()}`;
  }

  static async handleOAuthCallback(code: string, state: string): Promise<SocialIdentity> {
    const savedState = sessionStorage.getItem('oauth_state');
    const provider = sessionStorage.getItem('oauth_provider') as SocialProvider;

    if (state !== savedState) {
      throw new Error('Invalid state parameter');
    }

    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('oauth_provider');

    const tokenData = await this.exchangeCodeForToken(provider, code);

    const profileData = await this.fetchUserProfile(provider, tokenData.access_token);

    const identity = await this.saveIdentity(provider, tokenData, profileData);

    await this.awardSmartnessBonus('social_connect', provider);

    await this.logConnectAttempt(provider, 'oauth_success', { provider_user_id: profileData.id });

    return identity;
  }

  private static async exchangeCodeForToken(
    provider: SocialProvider,
    code: string
  ): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }> {
    const mockTokens: Record<SocialProvider, any> = {
      facebook: {
        access_token: `fb_mock_token_${Date.now()}`,
        expires_in: 5184000,
      },
      google: {
        access_token: `google_mock_token_${Date.now()}`,
        refresh_token: `google_refresh_${Date.now()}`,
        expires_in: 3600,
      },
      linkedin: {
        access_token: `linkedin_mock_token_${Date.now()}`,
        expires_in: 5184000,
      },
      twitter: {
        access_token: `twitter_mock_token_${Date.now()}`,
        refresh_token: `twitter_refresh_${Date.now()}`,
        expires_in: 7200,
      },
      tiktok: {
        access_token: `tiktok_mock_token_${Date.now()}`,
        refresh_token: `tiktok_refresh_${Date.now()}`,
        expires_in: 86400,
      },
      instagram: {
        access_token: `ig_mock_token_${Date.now()}`,
        expires_in: 5184000,
      },
    };

    return mockTokens[provider];
  }

  private static async fetchUserProfile(
    provider: SocialProvider,
    accessToken: string
  ): Promise<Record<string, any>> {
    const mockProfiles: Record<SocialProvider, any> = {
      facebook: {
        id: `fb_${Date.now()}`,
        name: 'John Dela Cruz',
        email: 'john@example.com',
        picture: { data: { url: 'https://via.placeholder.com/150' } },
      },
      google: {
        id: `google_${Date.now()}`,
        name: 'Maria Santos',
        email: 'maria@example.com',
        picture: 'https://via.placeholder.com/150',
      },
      linkedin: {
        id: `linkedin_${Date.now()}`,
        firstName: { localized: { en_US: 'Pedro' } },
        lastName: { localized: { en_US: 'Reyes' } },
        emailAddress: 'pedro@example.com',
      },
      twitter: {
        id: `twitter_${Date.now()}`,
        name: 'Anna Martinez',
        username: 'annamartinez',
        profile_image_url: 'https://via.placeholder.com/150',
      },
      tiktok: {
        id: `tiktok_${Date.now()}`,
        username: 'carlosramos',
        display_name: 'Carlos Ramos',
        avatar_url: 'https://via.placeholder.com/150',
      },
      instagram: {
        id: `ig_${Date.now()}`,
        username: 'sarahig',
        name: 'Sarah Johnson',
      },
    };

    return mockProfiles[provider];
  }

  private static async saveIdentity(
    provider: SocialProvider,
    tokenData: any,
    profileData: any
  ): Promise<SocialIdentity> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from('social_identities')
      .upsert({
        user_id: user.id,
        provider,
        provider_user_id: profileData.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        profile_data: profileData,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      userId: data.user_id,
      provider: data.provider,
      providerUserId: data.provider_user_id,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
      profileData: data.profile_data,
      isActive: data.is_active,
    };
  }

  static async getConnectedIdentities(): Promise<SocialIdentity[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('social_identities')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) {
      console.error('Failed to fetch identities:', error);
      return [];
    }

    return data.map(item => ({
      id: item.id,
      userId: item.user_id,
      provider: item.provider,
      providerUserId: item.provider_user_id,
      accessToken: item.access_token,
      refreshToken: item.refresh_token,
      expiresAt: item.expires_at,
      profileData: item.profile_data,
      isActive: item.is_active,
    }));
  }

  static async disconnectProvider(provider: SocialProvider): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('social_identities')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('provider', provider);

    if (error) {
      throw error;
    }

    await this.logConnectAttempt(provider, 'disconnect');
  }

  private static generateState(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private static async awardSmartnessBonus(eventType: string, provider: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: connections } = await supabase
      .from('social_identities')
      .select('provider')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const connectionCount = connections?.length || 0;

    let smartnessDelta = 10;
    if (connectionCount >= 3) smartnessDelta = 40;
    else if (connectionCount >= 2) smartnessDelta = 25;

    await supabase.from('scan_smartness_events').insert({
      user_id: user.id,
      event_type: eventType,
      smartness_delta: smartnessDelta,
      description: `Connected ${provider}`,
      metadata: { provider, connection_count: connectionCount },
    });
  }

  private static async logConnectAttempt(
    provider: string,
    action: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('social_connect_logs').insert({
      user_id: user.id,
      action,
      provider,
      success: true,
      metadata: metadata || {},
    });
  }
}
