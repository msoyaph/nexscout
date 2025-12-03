/*
  # Team Billing RPC Functions
  
  Creates functions for managing team billing and members:
  - update_team_seats: Adjust seat count
  - invite_team_member: Add new member
  - remove_team_member: Remove member
  - update_member_role: Change role
*/

-- Function: Update Team Seats
CREATE OR REPLACE FUNCTION update_team_seats(
  p_team_id uuid,
  p_seats_included int,
  p_extra_seats int,
  p_extra_seat_price int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team record;
  v_caller uuid;
  v_total_seats int;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  SELECT * INTO v_team FROM team_subscriptions WHERE id = p_team_id;
  IF v_team.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'TEAM_NOT_FOUND');
  END IF;

  IF v_team.owner_user_id <> v_caller THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHORIZED');
  END IF;

  v_total_seats := p_seats_included + p_extra_seats;
  IF v_total_seats < COALESCE(v_team.seats_used, 0) THEN
    RETURN jsonb_build_object('success', false, 'error', 'CANNOT_REDUCE_SEATS_BELOW_USAGE');
  END IF;

  UPDATE team_subscriptions
  SET 
    seats_included = p_seats_included,
    extra_seats = p_extra_seats,
    extra_seat_price = p_extra_seat_price,
    updated_at = now()
  WHERE id = p_team_id;

  RETURN jsonb_build_object(
    'success', true,
    'total_seats', v_total_seats,
    'monthly_cost', (p_extra_seats * p_extra_seat_price) + COALESCE(v_team.base_price, 4990)
  );
END;
$$;

-- Function: Invite Team Member
CREATE OR REPLACE FUNCTION invite_team_member(
  p_team_id uuid,
  p_email text,
  p_role text DEFAULT 'agent'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team record;
  v_member_id uuid;
  v_caller uuid;
  v_existing_count int;
  v_total_seats int;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  SELECT * INTO v_team FROM team_subscriptions WHERE id = p_team_id;
  IF v_team.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'TEAM_NOT_FOUND');
  END IF;

  IF v_team.owner_user_id <> v_caller THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHORIZED');
  END IF;

  -- Check for duplicates
  IF EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = p_team_id 
      AND email = p_email 
      AND status IN ('pending', 'active')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'MEMBER_ALREADY_EXISTS');
  END IF;

  -- Check capacity
  SELECT COUNT(*) INTO v_existing_count
  FROM team_members
  WHERE team_id = p_team_id AND status IN ('pending', 'active');

  v_total_seats := COALESCE(v_team.seats_included, 5) + COALESCE(v_team.extra_seats, 0);

  IF v_existing_count >= v_total_seats THEN
    RETURN jsonb_build_object('success', false, 'error', 'NO_SEATS_AVAILABLE');
  END IF;

  -- Insert member
  INSERT INTO team_members (
    team_id,
    owner_user_id,
    user_id,
    email,
    role,
    status,
    invited_at
  )
  VALUES (
    p_team_id,
    v_team.owner_user_id,
    NULL,
    p_email,
    COALESCE(p_role, 'agent'),
    'pending',
    now()
  )
  RETURNING id INTO v_member_id;

  -- Increment seats_used
  UPDATE team_subscriptions
  SET 
    seats_used = COALESCE(seats_used, 0) + 1,
    updated_at = now()
  WHERE id = p_team_id;

  RETURN jsonb_build_object(
    'success', true,
    'member_id', v_member_id,
    'seats_remaining', v_total_seats - v_existing_count - 1
  );
END;
$$;

-- Function: Remove Team Member
CREATE OR REPLACE FUNCTION remove_team_member(
  p_team_member_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member record;
  v_team record;
  v_caller uuid;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  SELECT * INTO v_member FROM team_members WHERE id = p_team_member_id;
  IF v_member.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'MEMBER_NOT_FOUND');
  END IF;

  SELECT * INTO v_team FROM team_subscriptions WHERE id = v_member.team_id;
  IF v_team.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'TEAM_NOT_FOUND');
  END IF;

  IF v_team.owner_user_id <> v_caller THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHORIZED');
  END IF;

  -- Update status (soft delete)
  UPDATE team_members
  SET 
    status = 'removed',
    updated_at = now()
  WHERE id = p_team_member_id;

  -- Decrement seats_used
  UPDATE team_subscriptions
  SET 
    seats_used = GREATEST(0, COALESCE(seats_used, 1) - 1),
    updated_at = now()
  WHERE id = v_member.team_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function: Update Member Role
CREATE OR REPLACE FUNCTION update_member_role(
  p_team_member_id uuid,
  p_new_role text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member record;
  v_team record;
  v_caller uuid;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  IF p_new_role NOT IN ('agent', 'closer', 'leader', 'manager', 'co-owner') THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_ROLE');
  END IF;

  SELECT * INTO v_member FROM team_members WHERE id = p_team_member_id;
  IF v_member.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'MEMBER_NOT_FOUND');
  END IF;

  SELECT * INTO v_team FROM team_subscriptions WHERE id = v_member.team_id;
  IF v_team.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'TEAM_NOT_FOUND');
  END IF;

  IF v_team.owner_user_id <> v_caller THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHORIZED');
  END IF;

  UPDATE team_members
  SET 
    role = p_new_role,
    updated_at = now()
  WHERE id = p_team_member_id;

  RETURN jsonb_build_object('success', true, 'new_role', p_new_role);
END;
$$;