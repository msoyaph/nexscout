/*
  # Consolidate Duplicate RLS Policies - Batch 2

  Continue removing duplicate permissive policies.

  ## Tables Updated
  - ai_message_sequences: 6 policies -> 2 policies
  - public_chatbot_training_data: 5 policies -> 2 policies
  - chatbot_conversations: 5 policies -> 2 policies
  - reminders: 5 policies -> 1 policy
  - notifications: 5 policies -> 1 policy
  - browser_captures: 5 policies -> 1 policy
  - chatbot_links: 5 policies -> 2 policies
  - ai_chat_sessions: 5 policies -> 2 policies

  ## Security
  Maintains same access control with simplified policy structure.
*/

-- ai_message_sequences: Consolidate user policies, keep public separate
DROP POLICY IF EXISTS "Users can create own message sequences" ON public.ai_message_sequences;
DROP POLICY IF EXISTS "Users can delete own message sequences" ON public.ai_message_sequences;
DROP POLICY IF EXISTS "Users can insert own message sequences" ON public.ai_message_sequences;
DROP POLICY IF EXISTS "Users can update own message sequences" ON public.ai_message_sequences;
DROP POLICY IF EXISTS "Users can view own message sequences" ON public.ai_message_sequences;

CREATE POLICY "Users manage own message sequences"
  ON public.ai_message_sequences FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- public_chatbot_training_data: Consolidate user policies, keep public separate
DROP POLICY IF EXISTS "Users can delete own manual public chatbot training data" ON public.public_chatbot_training_data;
DROP POLICY IF EXISTS "Users can insert own public chatbot training data" ON public.public_chatbot_training_data;
DROP POLICY IF EXISTS "Users can update own public chatbot training data" ON public.public_chatbot_training_data;
DROP POLICY IF EXISTS "Users can view own public chatbot training data" ON public.public_chatbot_training_data;

CREATE POLICY "Users manage own public chatbot training data"
  ON public.public_chatbot_training_data FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- chatbot_conversations: Consolidate user policies, keep chatbot access separate
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.chatbot_conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.chatbot_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.chatbot_conversations;
DROP POLICY IF EXISTS "Users can view own conversations" ON public.chatbot_conversations;

CREATE POLICY "Users manage own conversations"
  ON public.chatbot_conversations FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- reminders: Consolidate all policies
DROP POLICY IF EXISTS "Users can create own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can delete own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can insert own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can update own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can view own reminders" ON public.reminders;

CREATE POLICY "Users manage own reminders"
  ON public.reminders FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- notifications: Consolidate all policies
DROP POLICY IF EXISTS "Users can create own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;

CREATE POLICY "Users manage own notifications"
  ON public.notifications FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- browser_captures: Already has consolidated policy, remove duplicates
DROP POLICY IF EXISTS "Users can delete own browser captures" ON public.browser_captures;
DROP POLICY IF EXISTS "Users can insert own browser captures" ON public.browser_captures;
DROP POLICY IF EXISTS "Users can update own browser captures" ON public.browser_captures;
DROP POLICY IF EXISTS "Users can view own browser captures" ON public.browser_captures;

-- chatbot_links: Consolidate user policies, keep public separate
DROP POLICY IF EXISTS "Users can delete own chatbot links" ON public.chatbot_links;
DROP POLICY IF EXISTS "Users can insert own chatbot links" ON public.chatbot_links;
DROP POLICY IF EXISTS "Users can update own chatbot links" ON public.chatbot_links;
DROP POLICY IF EXISTS "Users can view own chatbot links" ON public.chatbot_links;

CREATE POLICY "Users manage own chatbot links"
  ON public.chatbot_links FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ai_chat_sessions: Consolidate user policies, keep public separate
DROP POLICY IF EXISTS "Users can insert own chat sessions" ON public.ai_chat_sessions;
DROP POLICY IF EXISTS "Users can update own chat sessions" ON public.ai_chat_sessions;
DROP POLICY IF EXISTS "Users can view own chat sessions" ON public.ai_chat_sessions;

CREATE POLICY "Users manage own chat sessions"
  ON public.ai_chat_sessions FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);