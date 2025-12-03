import { createClient } from '@supabase/supabase-js';
import onboardingEthicalV1 from '../src/services/onboarding/onboardingEthicalV1.json';
import onboardingExperimentalV2 from '../src/services/onboarding/onboardingExperimentalV2.json';
import firstWinV1 from '../src/services/onboarding/firstWinV1.json';

interface OnboardingSequenceJson {
  sequence_id: string;
  version: string;
  name: string;
  description: string;
  ab_group?: string | null;
  days: {
    day: number;
    scenarios: {
      id: string;
      trigger: string;
      messages: {
        email?: {
          subject?: string;
          body: string;
          delay_hours?: number;
          action_url?: string;
        };
        push?: {
          title?: string;
          body: string;
          delay_hours?: number;
          action_url?: string;
        };
        mentor?: {
          text: string;
          delay_hours?: number;
        };
      };
    }[];
  }[];
}

async function seedSequence(
  supabase: any,
  data: OnboardingSequenceJson
): Promise<void> {
  console.log(`\n📦 Seeding sequence: ${data.name}`);

  const { data: existing } = await supabase
    .from('onboarding_sequences')
    .select('id')
    .eq('sequence_key', data.sequence_id)
    .eq('version', data.version)
    .maybeSingle();

  if (existing) {
    console.log(`⚠️  Sequence already exists, skipping: ${data.sequence_id}`);
    return;
  }

  const { data: seq, error: seqErr } = await supabase
    .from('onboarding_sequences')
    .insert({
      sequence_key: data.sequence_id,
      version: data.version,
      name: data.name,
      description: data.description,
      is_active: true,
      ab_group: data.ab_group || null
    })
    .select('*')
    .single();

  if (seqErr || !seq) {
    console.error('❌ Error inserting sequence:', seqErr);
    throw seqErr;
  }

  console.log(`✅ Created sequence: ${seq.sequence_key}`);

  let totalSteps = 0;
  let totalMessages = 0;

  for (const day of data.days) {
    for (const scenario of day.scenarios) {
      const { data: step, error: stepErr } = await supabase
        .from('onboarding_steps')
        .insert({
          sequence_id: seq.id,
          day_number: day.day,
          scenario_id: scenario.id,
          trigger_key: scenario.trigger,
          priority: 10,
          conditions_json: {}
        })
        .select('*')
        .single();

      if (stepErr || !step) {
        console.error(
          `❌ Error inserting step ${scenario.id}:`,
          stepErr
        );
        continue;
      }

      totalSteps++;

      const { messages } = scenario;

      if (messages.email) {
        await supabase.from('onboarding_messages').insert({
          step_id: step.id,
          channel: 'email',
          subject: messages.email.subject || null,
          title: null,
          body: messages.email.body,
          delay_hours: messages.email.delay_hours || 0,
          action_url: messages.email.action_url || null,
          locale: 'en-PH',
          metadata: {
            template_key: `${scenario.id}_email`
          }
        });
        totalMessages++;
      }

      if (messages.push) {
        await supabase.from('onboarding_messages').insert({
          step_id: step.id,
          channel: 'push',
          subject: null,
          title: messages.push.title || null,
          body: messages.push.body,
          delay_hours: messages.push.delay_hours || 0,
          action_url: messages.push.action_url || null,
          locale: 'en-PH',
          metadata: {
            template_key: `${scenario.id}_push`
          }
        });
        totalMessages++;
      }

      if (messages.mentor) {
        await supabase.from('onboarding_messages').insert({
          step_id: step.id,
          channel: 'mentor',
          subject: null,
          title: null,
          body: messages.mentor.text,
          delay_hours: messages.mentor.delay_hours || 0,
          locale: 'en-PH',
          metadata: {
            template_key: `${scenario.id}_mentor`
          }
        });
        totalMessages++;
      }
    }
  }

  console.log(
    `✅ Seeded ${totalSteps} steps and ${totalMessages} messages for ${data.sequence_id}`
  );
}

async function run() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      '❌ Missing environment variables: VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY'
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🚀 Starting onboarding sequences seeding...\n');

  try {
    await seedSequence(
      supabase,
      onboardingEthicalV1 as OnboardingSequenceJson
    );
    await seedSequence(
      supabase,
      onboardingExperimentalV2 as OnboardingSequenceJson
    );
    await seedSequence(supabase, firstWinV1 as OnboardingSequenceJson);

    console.log('\n✅ All sequences seeded successfully!');
    console.log('\n📊 Summary:');
    console.log('   - Onboarding v1 Ethics (Group A)');
    console.log('   - Onboarding v2 Experimental (Group B)');
    console.log('   - First Win v1 (No A/B group)');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
