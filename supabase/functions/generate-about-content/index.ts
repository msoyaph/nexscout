import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function generateBioHeadline(profile: any): string {
  const profession = profile.profession || 'Professional';
  const name = profile.full_name || 'Achiever';
  
  const headlines = [
    `${profession} | Empowering Others to Reach Their Full Potential`,
    `Transforming Lives Through ${profession} | Your Success Partner`,
    `${name} | Building Dreams, One Success Story at a Time`,
    `Passionate ${profession} | Helping You Unlock Your Best Life`,
    `${profession} & Success Coach | Let's Win Together`,
  ];
  
  return headlines[Math.floor(Math.random() * headlines.length)];
}

function generateBioStory(profile: any): string {
  const name = profile.full_name || 'I';
  const profession = profile.profession || 'this field';
  const location = profile.location || 'my community';
  
  return `Hi! I'm ${name}, and I'm passionate about helping people transform their lives through ${profession}.\n\nMy journey started when I realized that true success isn't just about personal achievement—it's about lifting others up along the way. What drives me every single day is seeing the lightbulb moment when someone realizes they have everything they need to succeed.\n\nBased in ${location}, I've had the privilege of working with incredible individuals who were ready to take that leap of faith. Some were looking for financial freedom, others wanted more time with family, and many just needed someone to believe in them.\n\nWhat I've learned is this: everyone has untapped potential. My role is simply to help you discover it, harness it, and use it to create the life you've always dreamed of.\n\nLet's connect and see how we can work together to make your goals a reality!`;
}

function generateCareerJourney(profile: any): string {
  const profession = profile.profession || 'this industry';
  
  return `My career journey in ${profession} has been nothing short of transformational.\n\nWhere I Started: Like many, I was working a traditional 9-5, feeling unfulfilled and knowing there had to be more to life than just paying bills.\n\nThe Turning Point: I discovered ${profession} and saw an opportunity not just to change my life, but to help others do the same. I dove in headfirst, learned from the best, and committed to mastering my craft.\n\nToday: I'm proud to say I've built a thriving business while maintaining the freedom and flexibility I always dreamed of. More importantly, I've helped dozens of people start their own journeys to success.\n\nWhat I've Learned: Success leaves clues. The people who win are those who take action, stay consistent, and never give up on their dreams. That's the mindset I bring to everyone I work with.`;
}

function generatePersonalityTraits(profile: any): string[] {
  return [
    'Motivational Leader',
    'Goal-Oriented Achiever',
    'Genuine Connector',
    'Positive Mindset Advocate',
    'Results-Driven Professional',
    'Empathetic Mentor',
    'Continuous Learner',
    'Community Builder',
  ];
}

function generateCoachRecommendations(profile: any, currentLevel: string): any[] {
  const recommendations: any = {
    newbie: [
      {
        recommendation_type: 'encouragement',
        title: 'Welcome to Your Journey!',
        content: `You are at the beginning of something incredible! Every top earner started exactly where you are now. The fact that you have taken the first step shows you have what it takes.\n\nRemember: Success in MLM is not about being perfect—it is about being consistent. Show up every day, learn something new, and take action. That is the formula.\n\nYou have got this!`,
        priority: 'high',
        action_items: [
          'Complete your profile 100%',
          'Watch the Getting Started training',
          'Make your first 3 prospect connections',
          'Set your 30-day goals',
        ],
      },
      {
        recommendation_type: 'challenge',
        title: '30-Day Newbie Challenge',
        content: `Here is your challenge to kickstart your success:\n\nWeek 1: Learn the system\n• Master your product knowledge\n• Study top performer strategies\n• Practice your story\n\nWeek 2: Build your network\n• Add 25 new prospects\n• Send 10 personalized messages\n• Book 3 discovery calls\n\nWeek 3: Take massive action\n• Follow up with all prospects\n• Close your first sale or recruit\n• Share your wins with the team\n\nWeek 4: Level up\n• Teach what you have learned\n• Help 1 person on your team\n• Set goals for Rising Star level\n\nComplete this challenge and you will be amazed at your progress!`,
        priority: 'high',
        action_items: [
          'Week 1: Master product knowledge',
          'Week 2: Add 25 prospects',
          'Week 3: Close first sale',
          'Week 4: Help 1 team member',
        ],
      },
      {
        recommendation_type: 'growth_path',
        title: 'Your Path to Rising Star',
        content: `Here is what you need to reach Rising Star level:\n\nSkills to Master:\n• Effective prospecting techniques\n• Authentic relationship building\n• Simple follow-up systems\n• Handling basic objections\n\nMilestones to Hit:\n• 50+ qualified prospects in pipeline\n• 5 sales or 3 recruits\n• Consistent daily activity (30+ days)\n• First team member trained\n\nExpected Timeline: 60-90 days with focused effort\n\nYou are building a foundation that will support your entire career. Take your time, but stay consistent!`,
        priority: 'medium',
        action_items: [
          'Master prospecting techniques',
          'Build 50+ prospect pipeline',
          'Achieve 5 sales or 3 recruits',
          'Train your first team member',
        ],
      },
    ],
    rising_star: [
      {
        recommendation_type: 'encouragement',
        title: 'You Are On Fire!',
        content: `Look at you go! You have proven you can do this, and now it is time to scale up. The Rising Star phase is where you transition from learning to leading.\n\nYour consistency is paying off, and people are noticing. Keep that momentum going! The next level is closer than you think.\n\nProud of your progress!`,
        priority: 'high',
        action_items: [
          'Celebrate your wins publicly',
          'Document your success strategies',
          'Identify your unique strengths',
          'Set Professional level targets',
        ],
      },
      {
        recommendation_type: 'challenge',
        title: 'Scale to Professional Challenge',
        content: `Ready to 10x your results? Here is your challenge:\n\nDouble Your Network\n• Add 50 high-quality prospects\n• Focus on warm market expansion\n• Leverage referrals from satisfied customers\n\nBuild Your Team\n• Recruit 3 serious business builders\n• Hold weekly team trainings\n• Create a team culture of excellence\n\nMaster Advanced Skills\n• Perfect your presentation\n• Handle objections like a pro\n• Develop leadership presence\n\nResults Target: $2K-5K monthly income\n\nYou are ready for this level!`,
        priority: 'high',
        action_items: [
          'Add 50 quality prospects',
          'Recruit 3 business builders',
          'Hold weekly team training',
          'Reach $2K+ monthly income',
        ],
      },
    ],
    professional: [
      {
        recommendation_type: 'encouragement',
        title: 'Welcome to Professional Level!',
        content: `You are no longer just building a business—you are building an empire! At this level, you have proven you have what it takes to compete with the best.\n\nNow it is about leverage, systems, and scaling. You are transitioning from doing everything to leading others who do the work.\n\nThis is where the real income comes in. Stay focused!`,
        priority: 'high',
        action_items: [
          'Audit your current systems',
          'Identify bottlenecks to scale',
          'Develop your leadership team',
          'Set Top Earner targets',
        ],
      },
      {
        recommendation_type: 'challenge',
        title: 'Top Earner Breakthrough Challenge',
        content: `Time to break through to elite status:\n\nBuild Your Organization\n• Recruit 10+ serious leaders\n• Create 3 strong teams\n• Develop 2nd generation leaders\n\nMaster Leadership\n• Hold monthly masterminds\n• Create training programs\n• Mentor rising stars personally\n\nScale Your Income\n• Target: $10K-20K per month\n• Multiple income streams\n• Residual income focus\n\nBecome The Expert\n• Speak at events\n• Create content\n• Build your personal brand\n\nThis is your year to go elite!`,
        priority: 'high',
        action_items: [
          'Recruit 10+ leaders',
          'Build 3 strong teams',
          'Reach $10K+ monthly',
          'Speak at 1 event',
        ],
      },
    ],
    top_earner: [
      {
        recommendation_type: 'encouragement',
        title: 'Elite Status Achieved!',
        content: `You have done it! You are now among the top 1% of earners. Your journey from newbie to top earner is an inspiration to everyone on your team.\n\nAt this level, your focus shifts to legacy—building something that lasts beyond you. You are creating generational wealth and changing lives at scale.\n\nNever forget where you started. Your story is what gives others hope. Continue to lead with humility and excellence!`,
        priority: 'high',
        action_items: [
          'Share your complete journey story',
          'Mentor 5 high-potential leaders',
          'Develop succession plans',
          'Focus on legacy building',
        ],
      },
      {
        recommendation_type: 'growth_path',
        title: 'Building Your Legacy',
        content: `As a top earner, your next chapter is about impact:\n\nLeadership Legacy\n• Develop leaders who develop leaders\n• Create lasting systems and culture\n• Build an organization that runs without you\n\nIncome Legacy\n• $50K-100K+ monthly targets\n• Multiple 6-figure earners on your team\n• Generational wealth creation\n\nImpact Legacy\n• Lives transformed through your leadership\n• Communities built around your vision\n• Industry-wide recognition\n\nYour success is now measured by the success you create in others.`,
        priority: 'medium',
        action_items: [
          'Develop 3 six-figure earners',
          'Create self-sustaining systems',
          'Launch community initiatives',
          'Write your legacy plan',
        ],
      },
    ],
  };

  return recommendations[currentLevel] || recommendations.newbie;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { content_type, current_level } = await req.json();

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      throw new Error('Profile not found');
    }

    let result: any = {};

    if (content_type === 'bio' || content_type === 'all') {
      const bioHeadline = generateBioHeadline(profile);
      const bioStory = generateBioStory(profile);
      const careerJourney = generateCareerJourney(profile);
      const personalityTraits = generatePersonalityTraits(profile);

      const { data: aboutContent, error: aboutError } = await supabase
        .from('user_about_content')
        .upsert({
          user_id: user.id,
          bio_headline: bioHeadline,
          bio_story: bioStory,
          career_journey: careerJourney,
          personality_traits: personalityTraits,
          last_generated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (aboutError) throw aboutError;
      result.about_content = aboutContent;
    }

    if (content_type === 'coach' || content_type === 'all') {
      const level = current_level || 'newbie';
      const recommendations = generateCoachRecommendations(profile, level);

      const insertData = recommendations.map((rec) => ({
        user_id: user.id,
        ...rec,
        current_level: level,
        target_level: level === 'newbie' ? 'rising_star' : level === 'rising_star' ? 'professional' : level === 'professional' ? 'top_earner' : 'top_earner',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }));

      const { data: coachRecs, error: coachError } = await supabase
        .from('ai_coach_recommendations')
        .insert(insertData)
        .select();

      if (coachError) throw coachError;
      result.coach_recommendations = coachRecs;
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error generating about content:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate content',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});