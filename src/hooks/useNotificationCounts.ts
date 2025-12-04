import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface NotificationCounts {
  newChats: number;
  newProspects: number;
  pipelineUpdates: number;
}

export function useNotificationCounts() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<NotificationCounts>({
    newChats: 0,
    newProspects: 0,
    pipelineUpdates: 0
  });

  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      try {
        // Get unread chat sessions
        const { count: chatCount } = await supabase
          .from('public_chat_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false)
          .neq('status', 'archived');

        // Get new prospects (created in last 24 hours)
        const { count: prospectCount } = await supabase
          .from('prospects')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        // Get pipeline updates (prospects that changed stage in last 24 hours)
        const { count: pipelineCount } = await supabase
          .from('prospects')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .neq('pipeline_stage', null);

        setCounts({
          newChats: chatCount || 0,
          newProspects: prospectCount || 0,
          pipelineUpdates: pipelineCount || 0
        });
      } catch (error) {
        console.error('Error fetching notification counts:', error);
      }
    };

    fetchCounts();

    // Set up real-time subscriptions for updates
    const chatChannel = supabase
      .channel('chat-notifications')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'public_chat_sessions',
          filter: `user_id=eq.${user.id}`
        },
        () => fetchCounts()
      )
      .subscribe();

    const prospectChannel = supabase
      .channel('prospect-notifications')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prospects',
          filter: `user_id=eq.${user.id}`
        },
        () => fetchCounts()
      )
      .subscribe();

    // Refresh counts every 5 minutes
    const interval = setInterval(fetchCounts, 5 * 60 * 1000);

    return () => {
      chatChannel.unsubscribe();
      prospectChannel.unsubscribe();
      clearInterval(interval);
    };
  }, [user]);

  return counts;
}
