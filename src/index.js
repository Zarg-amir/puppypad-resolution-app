/**
 * PuppyPad Resolution Worker
 * Backend API for the Resolution App
 *
 * CONFIGURATION GUIDE:
 * - All easy-to-modify settings are at the TOP of this file
 * - Search for "EASY CONFIG" to find customizable sections
 * - See CODING_GUIDELINES.md for modification rules
 */

// ============================================
// EASY CONFIG: POLICY SETTINGS
// ============================================
const POLICY_CONFIG = {
  guaranteeDays: 90,              // Money-back guarantee period
  fulfillmentCutoffHours: 10,     // Hours before fulfillment check applies
};

// ============================================
// EASY CONFIG: ADMIN SETTINGS
// ============================================
const ADMIN_CONFIG = {
  tokenSecret: 'puppypad-admin-secret-2025',  // Change in production!
  setupKey: 'puppypad-setup-2025',            // One-time setup key
  tokenExpiryHours: 24,
};

// ============================================
// EASY CONFIG: RICHPANEL INTEGRATION
// Note: testMode is determined by env.RICHPANEL_TEST_MODE or env.APP_ENV
// Set RICHPANEL_TEST_MODE=false in production, or APP_ENV=production
// ============================================
const RICHPANEL_CONFIG = {
  testEmail: 'zarg.business@gmail.com',        // Test mode routes all emails here
  supportEmail: 'help@teampuppypad.com',       // Production support email
};

// ============================================
// EASY CONFIG: CHINA/INTERNATIONAL CARRIERS
// These carriers should be hidden from customers
// Show "our international warehouse" instead
// ============================================
const CHINA_CARRIERS = [
  'yunexpress', 'yun express',
  'yanwen', 'yanwen express',
  '4px', '4px express', '4px worldwide express',
  'cne', 'cne express', 'cnexps',
  'cainiao', 'cainiao super economy',
  'china post', 'china ems', 'epacket',
  'sf express', 'sf international',
  'sto express', 'shentong',
  'yto express', 'yuantong',
  'zto express', 'zhongtong',
  'best express', 'best inc',
  'jd logistics', 'jingdong',
  'sunyou', 'sun you',
  'anjun', 'anjun logistics',
  'winit', 'wan b',
  'flyt express', 'flytexpress',
  'equick', 'equick china',
  'ubi logistics', 'ubi smart parcel',
  'toll', 'toll priority', 'toll ipec',
  'speedpak',
];

// Helper to check if a carrier is a China/international carrier
function isChinaCarrier(carrierName) {
  if (!carrierName) return false;
  const lowerName = carrierName.toLowerCase();
  return CHINA_CARRIERS.some(china => lowerName.includes(china));
}

// Helper to check if we're in test mode (reads from env)
function isTestMode(env) {
  // Explicit RICHPANEL_TEST_MODE takes priority
  if (env.RICHPANEL_TEST_MODE !== undefined) {
    return env.RICHPANEL_TEST_MODE === 'true' || env.RICHPANEL_TEST_MODE === true;
  }
  // Otherwise check APP_ENV
  if (env.APP_ENV === 'production') {
    return false;
  }
  // Default to test mode for safety (prevents accidental production emails)
  return true;
}

// ============================================
// EASY CONFIG: PERSONA PROMPTS (Amy, Claudia)
// Modify these to change AI personality/responses
// ============================================
const PERSONA_PROMPTS = {
  amy: {
    name: 'Amy',
    role: 'Customer Support',
    characteristics: [
      'Warm and heartwarming tone',
      'Use occasional emojis like 🙂 ❤️ but don\'t overuse them',
      'Sound like a real human friend, not a corporate bot',
      'Be empathetic and understanding',
      'Keep responses concise but caring',
    ],
    instruction: 'Respond naturally to help the customer. If tackling an objection, be persuasive but genuine about the product\'s value.',
  },
  claudia: {
    name: 'Claudia',
    role: 'In-house Veterinarian',
    characteristics: [
      'Professional but warm and friendly',
      'Knowledgeable about dog behavior and training',
      'Encouraging and supportive',
      'Provide specific, actionable tips',
      'Sound like a trusted friend who happens to be an expert',
    ],
    instruction: 'Provide personalized training tips based on the dog\'s information. Be specific and helpful. Make the customer feel confident they can succeed.',
  },
  sarah: {
    name: 'Sarah',
    role: 'CX Lead',
    characteristics: [
      'Professional and solution-focused',
      'Takes ownership of issues',
      'Apologetic when needed',
      'Offers concrete next steps',
    ],
    instruction: 'Handle escalated issues with empathy and clear action plans.',
  },
};

// ============================================
// INTENT-SPECIFIC PROMPT PACKS
// Provides tailored context for different customer situations
// ============================================
const PROMPT_PACKS = {
  // Subscription-related intents
  subscription: {
    too_expensive: {
      context: 'Customer finds the subscription too expensive and is considering cancellation.',
      instruction: 'Acknowledge the customer\'s budget concerns genuinely. Highlight the long-term savings compared to disposable pads. Mention the quality and durability (1000+ washes). Do NOT offer discounts unless prompted by the system - focus on value, not price cuts.',
      objectionHandling: 'Avoid being pushy. If they\'ve made up their mind, respect it while leaving the door open for the future.',
    },
    too_many: {
      context: 'Customer has too many pads and wants to pause or cancel their subscription.',
      instruction: 'Validate their situation. Suggest pausing instead of cancelling to lock in their current price (prices may increase). Mention they can resume whenever they\'re ready.',
      objectionHandling: 'Be understanding. A pause is a win - they stay in the system.',
    },
    not_working: {
      context: 'Customer says the product isn\'t working as described.',
      instruction: 'Show genuine concern and ask specific questions about the issue. Offer to connect them with Claudia (our veterinarian) for training tips. Product may need break-in period or proper training approach.',
      objectionHandling: 'Listen first. Many "not working" issues are training-related, not product defects.',
    },
    moving: {
      context: 'Customer is moving and wants to cancel.',
      instruction: 'Offer to update their shipping address instead of cancelling. Emphasize continuity and that the service follows them.',
      objectionHandling: 'Moving is logistical, not dissatisfaction. Easy to resolve.',
    },
  },

  // Refund-related intents
  refund: {
    damaged: {
      context: 'Customer received a damaged product and wants a refund.',
      instruction: 'Apologize sincerely for the damaged item. Express that this isn\'t the experience we want. Ask for a photo if not already provided. Process quickly to rebuild trust.',
      objectionHandling: 'Damage claims should be handled generously. Speed matters more than investigation.',
    },
    not_as_described: {
      context: 'Customer feels the product doesn\'t match the description.',
      instruction: 'Listen to their specific concerns. Clarify any misunderstandings about features. If it\'s truly a mismatch, process the refund while noting feedback for product team.',
      objectionHandling: 'Don\'t be defensive. Acknowledge their perspective.',
    },
    changed_mind: {
      context: 'Customer simply changed their mind about the purchase.',
      instruction: 'Be understanding. Process within our return policy. Gently ask what changed to gather feedback.',
      objectionHandling: 'No need to convince. A smooth return creates future customers.',
    },
    doesnt_work: {
      context: 'Customer says the product doesn\'t work for their situation.',
      instruction: 'Ask about their specific use case. Offer training tips if applicable. If truly not suitable, process refund gracefully.',
      objectionHandling: 'May be a training opportunity. Suggest Claudia if dog-related.',
    },
  },

  // Tracking-related intents
  track: {
    late: {
      context: 'Customer\'s package is late and they\'re frustrated.',
      instruction: 'Apologize for the delay. Provide current tracking status. Explain carrier delays are outside our control but we\'re monitoring. Offer proactive updates.',
      objectionHandling: 'Focus on what we CAN do (monitor, follow up) rather than blame carriers.',
    },
    lost: {
      context: 'Package appears lost in transit.',
      instruction: 'Take ownership of the situation. Explain our investigation process. Assure them we\'ll either locate it or ship a replacement. Be specific about timeline.',
      objectionHandling: 'Lost packages are stressful. Speed and certainty help.',
    },
    delivered_not_received: {
      context: 'Carrier marked delivered but customer didn\'t receive it.',
      instruction: 'Take this seriously - package theft is real. Ask about common locations (neighbors, safe spots). Explain our investigation process including carrier contact and GPS verification.',
      objectionHandling: 'Never imply the customer is lying. Investigate thoroughly.',
    },
    stuck: {
      context: 'Package stuck at carrier facility or in transit.',
      instruction: 'Explain common reasons for delays (customs, facility backlogs). Provide realistic timeline. Offer to contact carrier on their behalf.',
      objectionHandling: 'Patience is needed. Set expectations clearly.',
    },
  },

  // General/fallback
  general: {
    default: {
      context: 'General customer inquiry.',
      instruction: 'Be helpful and friendly. Address their question directly. Offer additional assistance if relevant.',
      objectionHandling: 'Listen actively and respond to their actual concern.',
    },
  },
};

// ============================================
// DETAILED AI SCENARIO PROMPTS
// Full system prompts for specific customer scenarios
// ============================================
const AI_SCENARIO_PROMPTS = {
  // Dr. Claudia tips for dog not using product
  dog_tips: {
    model: 'gpt-4o',
    temperature: 0.75,
    maxTokens: 1000,
    buildSystemPrompt: (productDoc) => `You are Dr. Claudia, a compassionate veterinarian who specializes in dog behavior. You write warm, friendly messages.

=== KEY PRODUCT KNOWLEDGE ===
The PuppyPad is infused with pheromones that naturally attract dogs to use it. Most dogs (95%+) use it immediately with ZERO training required. However, a small percentage of dogs need a little extra encouragement - and that's completely normal!

=== YOUR EXPERTISE ===
You know how different breeds and ages respond:
- Puppies (under 1 year): Short attention spans, need frequent reminders, learn through repetition
- Adult dogs (1-7 years): May have established habits, need redirection
- Senior dogs (7+ years): May have mobility issues, need pad placed conveniently
- Stubborn breeds (Bulldogs, Huskies, Beagles): Need extra patience and positive reinforcement
- Eager-to-please breeds (Labs, Golden Retrievers, Poodles): Respond well to praise
- Small breeds (Chihuahuas, Yorkies): May be intimidated by large pads, need encouragement

=== CRITICAL RULES ===
1. ALWAYS use each dog's actual name throughout
2. Give BREED-SPECIFIC advice when breed is provided
3. Give AGE-APPROPRIATE advice based on their dog's age
4. If they mention what they've tried, you MUST:
   - Acknowledge it explicitly ("I can see you've already tried X...")
   - Explain why those methods might not have worked
   - Suggest DIFFERENT approaches that build on or complement what they tried
5. Emphasize these are simple tips, not intensive training (pheromones do most of the work)
6. If multiple dogs, give tips that work for all of them or address each dog specifically

=== OUTPUT FORMAT ===
You MUST output valid HTML. Use these tags:
- <p> for paragraphs
- <ul> and <li> for bullet point tips

CRITICAL:
- Do NOT use markdown (no asterisks, no backticks)
- Do NOT wrap in code blocks (no \`\`\`html)
- Just output raw HTML directly

=== PRODUCT INFO ===
${productDoc || 'PuppyPad - reusable pee pad with pheromone attractant'}`,
    buildUserPrompt: (data) => {
      // Format dogs list
      const dogs = data.dogs || [{ name: data.dogName, breed: data.dogBreed, age: data.dogAge }];
      const dogsInfo = dogs.map((d, i) => `Dog ${i + 1}: ${d.name} (${d.breed}, ${d.age})`).join('\n');
      const dogNames = dogs.map(d => d.name).join(' and ');
      const isSingleDog = dogs.length === 1;

      return `A customer needs help - their dog${isSingleDog ? " isn't" : "s aren't"} using the PuppyPad yet.

DOG INFO:
${dogsInfo}

WHAT THEY'VE ALREADY TRIED:
${data.methodsTried || 'Nothing specific mentioned'}

Write your response in HTML. ${isSingleDog ? '' : 'Address all dogs by name.'}

STRUCTURE:

<p>[Warm greeting mentioning ${dogNames}. Say something positive about their breed${isSingleDog ? '' : 's'}.]</p>

${data.methodsTried && data.methodsTried !== 'Nothing specific mentioned' ? `<p>[IMPORTANT: Acknowledge what they've tried: "${data.methodsTried}". Say something like "I can see you've already tried..." and briefly explain why it might not have worked yet. Show you've taken this into account.]</p>` : ''}

<p>[Explain that PuppyPads have pheromones that work instantly for most dogs, but some pups need extra help. Reassure them - they're not alone!]</p>

<p>Here are a few tips specifically for ${dogNames}:</p>

<ul>
<li>[Tip 1 - Tailored to breed/age. Use dog name${isSingleDog ? '' : 's'}.]</li>
<li>[Tip 2 - MUST be different from what they already tried. Explain why this approach is different.]</li>
<li>[Tip 3 - Another practical tip for their situation.]</li>
</ul>

<p>[Encouraging close - confident ${dogNames} will get it within days. Be warm!]</p>

CRITICAL:
- Output raw HTML only - NO markdown, NO code blocks
- Start with <p>, end with </p>
- If they mentioned trying something, ACKNOWLEDGE IT and explain why your tips are different`;
    }
  },

  // Changed mind / Didn't meet expectations (post-delivery)
  changed_mind: {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 800,
    buildSystemPrompt: (productDoc, orderItems) => `You are Amy, a warm customer support specialist for a PET PRODUCTS brand. A customer is reconsidering their purchase. Read their message carefully and identify WHY, then respond appropriately.

=== IDENTIFY THE REASON & RESPOND ACCORDINGLY ===

1. PET LOSS OR REHOMED (dog died, gave away pet, pet very sick)
   → Express genuine sympathy
   → Suggest: donate to shelter, gift to friend/neighbor, keep for future pet
   → Make them feel good about helping other animals

2. DOG NO LONGER NEEDS IT (trained, goes outside now, solved the problem)
   → Congratulate them! But gently mention:
   → Great for backup during bad weather, travel, or emergencies
   → Useful as your dog ages (senior dogs have accidents)
   → Good to have on hand "just in case"

3. IMPULSE BUY ("bought too quickly", "didn't think it through")
   → Reassure them it was actually a good decision
   → Explain the real benefits and quality
   → Help them see the value they're getting

4. ORDERED TOO MANY ("only need one", "didn't realize it was a multipack")
   → These are reusable and last a long time
   → Having extras means less frequent washing
   → Great for multiple rooms or rotation

5. FOUND DIFFERENT SOLUTION ("went with another option", "bought something else")
   → Explain what makes THIS product different/better
   → Focus on quality, durability, features
   → Don't bash competitors, just highlight strengths

6. LIVING SITUATION CHANGED ("I'm moving", "won't work where I live now")
   → Show empathy for big life changes
   → Suggest: gift to someone, donate to local shelter
   → Useful in any living situation (apartments especially!)

7. TIMING ISSUES ("needed it sooner", "won't arrive in time")
   → Check delivery status and reassure if shipped
   → These are reusable - they'll still be valuable when they arrive

8. FINANCIAL CONCERNS ("need to save money", "budget changed")
   → Be understanding - money concerns are real
   → Gently mention: reusable = saves money long-term vs disposables
   → Quality means it lasts, which is better value

9. MISUNDERSTOOD THE PRODUCT ("not what I thought", "didn't realize what it was")
   → Clarify what the product actually is/does
   → Explain benefits they might not have known about

10. PERSONAL/VAGUE ("personal reasons", "things changed", won't explain)
    → Respect their privacy
    → Gentle, warm response without prying
    → Share a few benefits in case it helps them reconsider

=== TONE & STYLE ===
- Warm, caring, genuine - like a helpful friend
- SHORT paragraphs (2-3 sentences max)
- Blank line between paragraphs
- Use ellipses (...) for pauses, NEVER em-dashes
- This is a CHAT message, NOT an email
- NEVER sign off with "Warm regards", "Best", "Thanks", or any email-style closing
- NEVER sign your name
- Just end naturally after your last point

=== CRITICAL - PRODUCT MATCHING ===
- ONLY mention products from the order items list
- Do NOT invent or guess product names
- When in doubt, use "your products" instead of guessing

=== PRODUCT DOCUMENTATION ===
${productDoc || 'Premium reusable dog pee pads, machine washable, leak-proof.'}

=== PRODUCTS THEY ORDERED ===
${orderItems || 'PuppyPad products'}

Write 4-5 short, warm paragraphs.`,
    buildUserPrompt: (data) => `Customer name: ${data.customerName || 'there'}
Their message: "${data.customerMessage || 'I want to cancel'}"

Respond appropriately based on their situation. Don't mention refunds or returns. End naturally - no sign-offs.`
  },

  // Pre-shipment: Found it cheaper elsewhere
  preshipment_cheaper: {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 600,
    buildSystemPrompt: (productDoc) => `You are Amy, a warm and knowledgeable customer support specialist for PuppyPad.

A customer wants to cancel their pre-shipment order because they "found it cheaper elsewhere." Your job is to explain why PuppyPad offers BETTER VALUE despite potentially higher upfront cost.

IMPORTANT: Be warm and understanding, NOT defensive or pushy.

KEY VALUE ARGUMENTS:
1. **Quality & Durability**: One PuppyPad lasts 2-3 years with proper care. Cheaper alternatives often need replacing within months.
2. **Absorbency**: Our 5-layer design handles accidents better than thin, cheap alternatives that leak through.
3. **Machine Washable**: 300+ washes = massive long-term savings vs constantly buying cheap pads.
4. **Leak-Proof Guarantee**: Our backing actually works. Cheap pads often soak through to floors.
5. **Eco-Friendly**: One PuppyPad replaces 300+ disposable pads (better for environment AND wallet).

TONE & STYLE:
- Warm, caring, genuine - like a helpful friend
- SHORT paragraphs (2-3 sentences max)
- Use ellipses (...) for pauses, NEVER em-dashes
- This is a CHAT message, NOT an email
- NEVER sign off with "Warm regards", "Best", etc.
- End naturally after your last point

=== PRODUCT INFO ===
${productDoc || 'PuppyPad premium reusable dog pee pads'}

Write 3-4 short, warm paragraphs that address their price concern.`,
    buildUserPrompt: (data) => `Customer name: ${data.customerName || 'there'}
Order total: ${data.orderTotal || 'their order'}

Acknowledge their price concern warmly, then explain the VALUE difference. Focus on long-term savings and quality.`
  },

  // Pre-shipment: Financial reasons
  preshipment_financial: {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 600,
    buildSystemPrompt: (productDoc) => `You are Amy, a warm and understanding customer support specialist for PuppyPad.

A customer wants to cancel their order due to "financial reasons." Your job is to help them see the FINANCIAL VALUE - showing them how this is actually a SMART financial decision, not an expense.

IMPORTANT: This is about helping them see the INVESTMENT VALUE, not guilt-tripping them.

KEY FINANCIAL ARGUMENTS:
1. **Cost Comparison**: One PuppyPad ($40-60) replaces 300+ disposable pads. At $0.25-0.50 per disposable, that's $75-150 in savings!
2. **Monthly Savings**: Disposable pads cost $20-40/month. PuppyPad pays for itself in 2-3 months.
3. **Long-term Math**: Over 2-3 years, you'll save $300-600+ compared to disposables
4. **No Hidden Costs**: Machine washable - no ongoing purchase costs
5. **One-Time Investment**: Unlike disposables, you buy once and you're set

TONE & STYLE:
- Warm, caring, understanding - money concerns are real and valid
- SHORT paragraphs (2-3 sentences max)
- Use ellipses (...) for pauses, NEVER em-dashes
- This is a CHAT message, NOT an email
- Show the math in a friendly, non-pushy way
- If they still want to cancel after this, that's okay

=== PRODUCT INFO ===
${productDoc || 'PuppyPad premium reusable dog pee pads'}

Write 3-4 short, warm paragraphs that address their financial concern.`,
    buildUserPrompt: (data) => `Customer name: ${data.customerName || 'there'}
Order total: ${data.orderTotal || 'their order'}

Acknowledge their financial concern with empathy, show the MATH of why this saves money long-term.`
  },

  // Pre-shipment: Accidental order
  preshipment_accidental: {
    model: 'gpt-4o-mini',
    temperature: 0.75,
    maxTokens: 400,
    buildSystemPrompt: (productDoc, orderItems) => `You are Amy, a warm and friendly customer support specialist for PuppyPad.

A customer placed an order "by accident" and wants to cancel. Your job is to gently persuade them that maybe this wasn't an accident after all... it might be exactly what they need! But don't be pushy.

APPROACH:
- Acknowledge the "accident" with humor/lightness
- Mention their specific product(s) by name
- Highlight 1-2 key benefits of what THEY ordered
- Share a quick "why customers love it" moment
- End with an encouraging nudge, not pressure

TONE & STYLE:
- Warm, playful, like a helpful friend
- SHORT paragraphs (2-3 sentences max)
- Use ellipses (...) for pauses, NEVER em-dashes
- This is a CHAT message, NOT an email
- Keep it light and fun!
- NEVER sign off with "Warm regards", "Best", etc.

=== PRODUCT INFO ===
${productDoc || 'Premium reusable dog pee pads'}

=== PRODUCTS THEY ORDERED ===
${orderItems || 'PuppyPad'}

Write 2-3 short, warm paragraphs. Keep it playful!`,
    buildUserPrompt: (data) => `Customer name: ${data.customerName || 'there'}
Order total: ${data.orderTotal || 'their order'}

Playfully acknowledge the "accident" and encourage them to give it a try. Keep it light - no pressure.`
  },

  // Subscription too expensive
  subscription_expensive: {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 400,
    buildSystemPrompt: (productDoc) => `You are Amy, a warm customer support specialist for PuppyPad. A subscription customer says their subscription is "too expensive" and wants to cancel.

Write a brief, empathetic response (3-4 short sentences) that:
1. Shows you understand budget concerns are real
2. Mentions what makes our product worth it (reusable, long-lasting, quality)
3. Hints that you might have a solution

TONE:
- Understanding, not defensive
- Casual and friendly, like a chat message
- Don't be pushy about keeping them

CRITICAL RULES:
- This is a CHAT message, not an email
- NEVER use em-dashes
- NEVER sign off with "Warm regards", "Best", "Thanks", etc.
- Don't mention specific discounts yet
- End naturally - no sign-offs

=== PRODUCT INFO ===
${productDoc || 'PuppyPad subscription'}`,
    buildUserPrompt: (data) => `Customer name: ${data.customerName || 'there'}
Subscription price: ${data.subscriptionPrice || 'their subscription'}

Write a short, understanding response that acknowledges their budget concern and gently explains the value.`
  },

  // Satisfied customer thank you
  satisfied_thankyou: {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 200,
    buildSystemPrompt: () => `You are Amy, a warm customer support specialist for PuppyPad. A customer was having second thoughts about their purchase, but you talked with them and they've decided they're happy to keep it.

Write a brief, warm thank you message (2-3 short sentences max).

TONE:
- Genuinely happy and warm
- Casual and friendly, like a chat message
- Don't be over-the-top or salesy
- Make them feel good about their decision

CRITICAL RULES:
- This is a CHAT message, not an email
- NEVER sign off with "Warm regards", "Best", "Thanks", etc.
- NEVER sign your name
- Keep it short and natural
- End naturally after your last point`,
    buildUserPrompt: (data) => `Customer name: ${data.customerName || 'there'}
Their original concern: "${data.originalConcern || 'had some concerns'}"

Write a short, warm thank you message now that they're satisfied.`
  },

  // Amy general response
  amy_general: {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 300,
    buildSystemPrompt: (productDoc, context) => `You are Amy, a friendly and caring customer support representative for PuppyPad (a pet products company). You're chatting with a customer who needs help.

YOUR PERSONALITY:
- Warm, friendly, and genuinely caring - like talking to a helpful friend
- Empathetic and understanding - you really get how frustrating issues can be
- Casual but professional - use natural conversational language
- Brief and to the point - keep responses to 1-2 short sentences max

IMPORTANT RULES:
- Use the customer's first name naturally if provided
- Reference what they selected/told you to show you're listening
- NEVER use em-dashes. Use "..." for pauses if needed
- Keep it SHORT - just 1-2 sentences, conversational
- Be genuine, not scripted or robotic
- Don't over-apologize or be overly formal
- Sound like a real person texting a friend who needs help

=== CONTEXT ===
${context || 'General customer support'}

=== PRODUCT INFO ===
${productDoc || 'PuppyPad products'}`,
    buildUserPrompt: (data) => `Customer name: ${data.customerName || 'there'}
Situation: ${data.situation || 'needs help'}

Write a brief, warm response.`
  },

  // Case confirmation message
  case_confirmation: {
    model: 'gpt-4o-mini',
    temperature: 0.6,
    maxTokens: 200,
    buildSystemPrompt: () => `You are writing a brief confirmation message for a PuppyPad customer who just submitted a support request.

RULES:
- Be warm and reassuring
- Keep it to 2-3 short sentences
- Acknowledge their specific issue/selection
- Confirm we got their request
- Let them know what happens next (24-48 hours)
- Don't repeat all the details they already know
- This is a CHAT message, not an email
- NEVER use em-dashes
- Do NOT sign off with any email-style closing
- End naturally after your last sentence`,
    buildUserPrompt: (data) => `Issue type: ${data.issueType || 'support request'}
Resolution: ${data.resolution || 'being processed'}

Write a warm, empathetic 2-3 sentence confirmation. Acknowledge their situation and let them know our team will handle it within 24-48 hours.`
  },

  // Package help - can't find delivered package
  package_help: {
    model: 'gpt-4o-mini',
    temperature: 0.6,
    maxTokens: 400,
    buildSystemPrompt: () => `You are a helpful customer support specialist. The customer says they can't find their delivered package. Provide practical tips for locating it based on the delivery information.

Be helpful and practical. List 4-5 specific places to check for the package based on common delivery locations.`,
    buildUserPrompt: (data) => `Package delivery info:
Carrier: ${data.carrier || 'Unknown'}
Delivery date: ${data.deliveryDate || 'Recently'}
Address type: ${data.addressType || 'Unknown'}
Latest tracking: ${data.trackingStatus || 'Delivered'}

Provide 4-5 specific places to check for the package. Be helpful and practical.`
  },

  // Product issue help
  product_issue: {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 500,
    buildSystemPrompt: (productDoc) => `You are a helpful customer support specialist for PuppyPad.

Provide empathetic, helpful responses when customers have issues with their products.

TONE:
- Understanding and caring
- Helpful and solution-oriented
- Professional but friendly

RULES:
- Acknowledge their frustration
- Provide practical suggestions
- Use product documentation when relevant
- End by asking if this helps

=== PRODUCT DOCUMENTATION ===
${productDoc || 'Premium reusable dog pee pads, machine washable, leak-proof.'}`,
    buildUserPrompt: (data) => `Customer concern about ${data.productName || 'their product'}:
Issue: "${data.issue || 'having problems'}"
${data.expectations ? `Expectations not met: "${data.expectations}"` : ''}

Provide an empathetic response with helpful suggestions. End with asking if this helps.`
  }
};

// ============================================
// EASY CONFIG: PRODUCT DOC MAPPING
// Maps product names to R2 file names
// ============================================
const PRODUCT_DOC_MAP = {
  'puppypad': 'PuppyPad-_Reusable-Pee-Pad_-_1_.txt',
  'pee pad': 'PuppyPad-_Reusable-Pee-Pad_-_1_.txt',
  'busypet': 'BusyPet.txt',
  'calmbuddy': 'CalmBuddy Premium Diffuser Kit.txt',
  'cozybed': 'CozyBed (1).txt',
  'laundry': 'Laundry-Detergent-Sheets.txt',
  'stain': 'Stain-and-Odor-Eliminator.txt',
};

// ============================================
// CLICKUP CONFIGURATION
// ============================================
const CLICKUP_CONFIG = {
  lists: {
    refundRequests: '901518836463',
    returnRequests: '901519002456',
    shippingIssues: '901519012573',
    subscriptionManagement: '901519256086',
    manualHelp: '901519256097'
  },
  fields: {
    caseId: '8edc1dca-f349-4663-ab04-be7e1a1c6732',
    emailAddress: '200cbfa0-5bdf-4a90-910e-986ee1fbbed1',
    resolution: '44a77a25-2b98-4b79-b1f0-caf2a67a137a',
    orderNumber: '5f89f376-9bf7-45dd-a06b-ffafda305260',
    orderUrl: '71ece2eb-d082-4135-8a11-fb6a1b1c90f4',
    conversationUrl: 'c9e884af-bfa8-4b79-bffe-fed6a8e3fa8f',
    refundAmount: '3a85cb2e-2607-487c-9aaf-5d22b018aae2',
    selectedItems: 'aabe9246-54fd-4b8b-b8e2-09347265aa06',
    orderIssue: '3602bb2f-d07b-48aa-97f3-3590a06b35d4',
    returnStatus: 'f1bc2f2f-3f5b-4b85-a316-6f74675a8e32',
    trackingUrl: 'f443b9bd-3044-464b-a2db-ac45d09daf91',
    carrierIssue: 'e058af04-bb11-4d65-9ade-f1810ae16b22',
    subscriptionStatus: '05c30d78-d38b-437b-8fbb-42094dcba3ed',
    actionType: 'a13af7b6-b656-4e9a-9e3a-663d386ad867'
  },
  options: {
    returnStatus: {
      awaitingReturn: '8fdc441c-d187-45a2-8375-d8226e86568c',
      inTransit: '6be07ee9-2124-4325-9895-7f6fd775b1e3',
      delivered: 'caa19b8c-c229-4390-9a49-6a2a89cbdc4c',
      failed: 'e17dbd41-4ce3-405e-b86f-fe2390b6622d'
    },
    carrierIssue: {
      addressCorrection: '61ee026a-deaa-4a36-8f4b-6fb03d26eeb2',
      failedDelivery: '45e02527-7941-44d0-85e1-0e9d53ad0cb3',
      exception: 'b68f8a6d-e4f2-4125-89a2-0c345325bbea',
      expiredTracking: '6f126cd4-8382-4887-8728-d5b4f8243cb1',
      extendedTransit: '89258fc3-145e-4610-bf2e-f2cb05467900',
      deliveredNotReceived: '9c631d27-f8a4-495f-94f8-e278cb6ca8c6'
    },
    subscriptionStatus: {
      active: 'd3cef57a-a2ac-4c42-a6ae-2b3c5eb6d615',
      paused: 'd042ffdb-00b7-46ef-b571-d9a6064248de',
      cancelled: '6402e72a-b4b3-48de-953c-4f976f5b6bbf'
    },
    actionType: {
      pause: '1d307432-947e-4d54-b3ba-ffb1312d417e',
      cancel: 'aba9ab01-45c0-42be-9f3d-31ecbaf31e60',
      changeSchedule: '20da5eba-2e35-427d-9cdc-d715f168735f',
      changeAddress: 'e33586ef-3502-4995-bb27-98f954846810'
    }
  }
};

// SOP URLs for each case type (placeholder URLs - update with actual SOP links)
const SOP_URLS = {
  refund: 'https://docs.puppypad.com/sop/refunds',
  return: 'https://docs.puppypad.com/sop/returns',
  shipping: 'https://docs.puppypad.com/sop/shipping-issues',
  subscription: 'https://docs.puppypad.com/sop/subscriptions',
  manual: 'https://docs.puppypad.com/sop/manual-assistance'
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS headers for frontend
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (pathname === '/api/health') {
        return Response.json({ status: 'ok', timestamp: new Date().toISOString() }, { headers: corsHeaders });
      }

      // Lookup order
      if (pathname === '/api/lookup-order' && request.method === 'POST') {
        return await handleLookupOrder(request, env, corsHeaders);
      }

      // Get tracking
      if (pathname === '/api/tracking' && request.method === 'POST') {
        return await handleTracking(request, env, corsHeaders);
      }

      // Validate 90-day guarantee
      if (pathname === '/api/validate-guarantee' && request.method === 'POST') {
        return await handleValidateGuarantee(request, env, corsHeaders);
      }

      // Get subscription
      if (pathname === '/api/subscription' && request.method === 'POST') {
        return await handleSubscription(request, env, corsHeaders);
      }

      // Create case
      if (pathname === '/api/create-case' && request.method === 'POST') {
        return await handleCreateCase(request, env, corsHeaders);
      }

      // Create manual help case (order not found)
      if (pathname === '/api/create-manual-case' && request.method === 'POST') {
        return await handleCreateManualCase(request, env, corsHeaders);
      }

      // Check existing case
      if (pathname === '/api/check-case' && request.method === 'POST') {
        return await handleCheckCase(request, env, corsHeaders);
      }

      // Append to existing case (dedupe flow)
      if (pathname === '/api/append-to-case' && request.method === 'POST') {
        return await handleAppendToCase(request, env, corsHeaders);
      }

      // AI response (Amy/Claudia)
      if (pathname === '/api/ai-response' && request.method === 'POST') {
        return await handleAIResponse(request, env, corsHeaders);
      }

      // Parse pickup location from tracking data using AI
      if (pathname === '/api/parse-pickup-location' && request.method === 'POST') {
        return await handleParsePickupLocation(request, env, corsHeaders);
      }

      // Upload evidence
      if (pathname === '/api/upload-evidence' && request.method === 'POST') {
        return await handleUploadEvidence(request, env, corsHeaders);
      }

      // Serve audio files
      if (pathname.startsWith('/audio/')) {
        return await handleAudio(pathname, env, corsHeaders);
      }

      // ============================================
      // ANALYTICS ENDPOINTS
      // ============================================

      // Log event
      if (pathname === '/api/analytics/event' && request.method === 'POST') {
        return await handleLogEvent(request, env, corsHeaders);
      }

      // Log session
      if (pathname === '/api/analytics/session' && request.method === 'POST') {
        return await handleLogSession(request, env, corsHeaders);
      }

      // Log survey response
      if (pathname === '/api/analytics/survey' && request.method === 'POST') {
        return await handleLogSurvey(request, env, corsHeaders);
      }

      // Log policy block
      if (pathname === '/api/analytics/policy-block' && request.method === 'POST') {
        return await handleLogPolicyBlock(request, env, corsHeaders);
      }

      // ============================================
      // ADMIN DASHBOARD ENDPOINTS
      // ============================================

      // Admin login
      if (pathname === '/admin/api/login' && request.method === 'POST') {
        return await handleAdminLogin(request, env, corsHeaders);
      }

      // Dashboard data (protected)
      if (pathname === '/admin/api/dashboard' && request.method === 'GET') {
        return await handleDashboardData(request, env, corsHeaders);
      }

      // Recent cases list (protected)
      if (pathname === '/admin/api/cases' && request.method === 'GET') {
        return await handleCasesList(request, env, corsHeaders);
      }

      // Events log (protected)
      if (pathname === '/admin/api/events' && request.method === 'GET') {
        return await handleEventsList(request, env, corsHeaders);
      }

      // Serve dashboard HTML
      if (pathname === '/admin' || pathname === '/admin/') {
        return await serveDashboard(env, corsHeaders);
      }

      // Admin setup endpoint (one-time use to create admin user)
      if (pathname === '/admin/setup' && request.method === 'POST') {
        return await handleAdminSetup(request, env, corsHeaders);
      }

      // ============================================
      // POSTHOG PROXY (bypass ad blockers)
      // ============================================

      // Proxy PostHog script
      if (pathname === '/ph/array.js') {
        const response = await fetch('https://us-assets.i.posthog.com/static/array.js');
        return new Response(response.body, {
          headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'public, max-age=3600',
            ...corsHeaders
          }
        });
      }

      // Proxy PostHog ingest (events, recordings, etc.)
      if (pathname.startsWith('/ph/')) {
        const posthogPath = pathname.replace('/ph/', '');
        const posthogUrl = `https://us.i.posthog.com/${posthogPath}${url.search}`;

        const response = await fetch(posthogUrl, {
          method: request.method,
          headers: {
            'Content-Type': request.headers.get('Content-Type') || 'application/json',
          },
          body: request.method !== 'GET' ? await request.text() : undefined,
        });

        return new Response(response.body, {
          status: response.status,
          headers: {
            'Content-Type': response.headers.get('Content-Type') || 'application/json',
            ...corsHeaders
          }
        });
      }

      // 404 for unknown routes
      return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });

    } catch (error) {
      console.error('Worker error:', error);
      return Response.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
    }
  }
};

// ============================================
// SHOPIFY ORDER LOOKUP
// ============================================
async function handleLookupOrder(request, env, corsHeaders) {
  const { email, phone, firstName, lastName, orderNumber, address1, country, deepSearch } = await request.json();

  // Build Shopify search query
  let query = '';

  if (deepSearch && firstName && lastName && address1) {
    // Deep search mode: Search by name (Shopify will return matches)
    // We'll filter for exact name/country match and fuzzy address match after
    query = `shipping_address.first_name:${firstName} shipping_address.last_name:${lastName}`;

    // Add country filter if provided
    if (country) {
      const countryName = getCountryNameFromCode(country);
      if (countryName) {
        query += ` shipping_address.country:"${countryName}"`;
      }
    }
  } else {
    // Standard lookup: email or phone
    if (email) {
      query = `email:${email}`;
    } else if (phone) {
      // Clean phone number for search
      const cleanPhone = phone.replace(/\D/g, '');
      query = `phone:*${cleanPhone.slice(-10)}*`; // Last 10 digits
    }

    if (orderNumber) {
      query += ` name:#${orderNumber.replace('#', '').replace('P', '').replace('p', '')}`;
    }
    if (firstName) {
      query += ` billing_address.first_name:${firstName}`;
    }
    if (lastName) {
      query += ` billing_address.last_name:${lastName}`;
    }
  }

  const shopifyUrl = `https://${env.SHOPIFY_STORE}/admin/api/2024-01/orders.json?status=any&limit=50&query=${encodeURIComponent(query)}`;

  const response = await fetch(shopifyUrl, {
    headers: {
      'X-Shopify-Access-Token': env.SHOPIFY_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    return Response.json({ error: 'Shopify lookup failed' }, { status: 500, headers: corsHeaders });
  }

  const data = await response.json();
  let orders = data.orders || [];

  // For deep search, apply strict filtering
  if (deepSearch && orders.length > 0) {
    const searchFirstName = firstName?.toLowerCase().trim();
    const searchLastName = lastName?.toLowerCase().trim();
    const searchAddress = address1?.toLowerCase().trim();
    const searchCountryName = country ? getCountryNameFromCode(country)?.toLowerCase() : null;

    orders = orders.filter(order => {
      const addr = order.shipping_address;
      if (!addr) return false;

      // EXACT match on first name (case insensitive)
      const orderFirstName = (addr.first_name || '').toLowerCase().trim();
      if (orderFirstName !== searchFirstName) return false;

      // EXACT match on last name (case insensitive)
      const orderLastName = (addr.last_name || '').toLowerCase().trim();
      if (orderLastName !== searchLastName) return false;

      // EXACT match on country (case insensitive)
      if (searchCountryName) {
        const orderCountry = (addr.country || '').toLowerCase().trim();
        if (orderCountry !== searchCountryName) return false;
      }

      // FUZZY match on address - check if key parts match
      if (searchAddress) {
        const orderAddress = (addr.address1 || '').toLowerCase();

        // Extract significant parts (numbers and words > 2 chars)
        const searchParts = searchAddress.split(/[\s,]+/).filter(p => p.length > 1);

        // Check how many parts match
        let matchCount = 0;
        for (const part of searchParts) {
          if (orderAddress.includes(part)) {
            matchCount++;
          }
        }

        // Require at least 40% of parts to match for fuzzy address
        const matchRatio = searchParts.length > 0 ? matchCount / searchParts.length : 0;
        if (matchRatio < 0.4) return false;
      }

      return true;
    });
  }

  // Process orders - extract line items with images and product type
  const processedOrders = await Promise.all(orders.map(async (order) => {
    const lineItems = await processLineItems(order.line_items, env);
    const clientOrderId = extractClientOrderId(order);

    // Calculate fulfillment window (backend enforcement)
    const orderDate = new Date(order.created_at);
    const now = new Date();
    const hoursSinceOrder = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
    const isUnfulfilled = !order.fulfillment_status || order.fulfillment_status === 'null';
    const withinFulfillmentWindow = hoursSinceOrder < POLICY_CONFIG.fulfillmentCutoffHours;

    // canModify = unfulfilled AND within 10-hour window
    const canModify = isUnfulfilled && withinFulfillmentWindow;
    const hoursUntilFulfillment = withinFulfillmentWindow
      ? Math.max(0, POLICY_CONFIG.fulfillmentCutoffHours - hoursSinceOrder)
      : 0;

    return {
      id: order.id,
      orderNumber: order.name,
      email: order.email,
      phone: order.phone,
      createdAt: order.created_at,
      financialStatus: order.financial_status,
      fulfillmentStatus: order.fulfillment_status,
      totalPrice: order.total_price,
      currency: order.currency,
      customerName: `${order.billing_address?.first_name || ''} ${order.billing_address?.last_name || ''}`.trim(),
      customerFirstName: order.billing_address?.first_name || order.customer?.first_name || '',
      customerLastName: order.billing_address?.last_name || order.customer?.last_name || '',
      shippingAddress: order.shipping_address,
      billingAddress: order.billing_address,
      lineItems,
      clientOrderId,
      orderUrl: `https://${env.SHOPIFY_STORE}/admin/orders/${order.id}`,
      // Fulfillment window fields (backend-enforced)
      canModify,                    // true if order can be changed/cancelled
      hoursUntilFulfillment,        // hours remaining in window
      hoursSinceOrder,              // for debugging/display
    };
  }));

  return Response.json({ orders: processedOrders }, { headers: corsHeaders });
}

// Process line items with images and product type detection
async function processLineItems(lineItems, env) {
  return lineItems.map(item => {
    // Extract product type (OFFER or UPSALE)
    const productTypeProperty = (item.properties || []).find(p =>
      p.name === 'productType' || p.name === 'product_type'
    );
    const productType = productTypeProperty?.value || null;

    // Determine if item is free
    const isFree = parseFloat(item.price) === 0;
    
    // Check if digital (ebook)
    const isDigital = item.requires_shipping === false || 
      item.title?.toLowerCase().includes('ebook') ||
      item.title?.toLowerCase().includes('e-book') ||
      item.title?.toLowerCase().includes('digital');

    return {
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      title: item.title,
      variantTitle: item.variant_title,
      sku: item.sku,
      quantity: item.quantity,
      price: item.price,
      image: item.image?.src || null,
      fulfillmentStatus: item.fulfillment_status,
      productType, // OFFER, UPSALE, or null
      isFree,
      isDigital,
      isPuppyPad: item.title?.toLowerCase().includes('puppypad') || 
                  item.title?.toLowerCase().includes('puppy pad') ||
                  item.title?.toLowerCase().includes('pee pad'),
    };
  });
}

// Extract CheckoutChamp order ID from Shopify order
function extractClientOrderId(order) {
  // Check note attributes
  const noteAttrs = order.note_attributes || [];
  const clientOrderIdAttr = noteAttrs.find(attr => 
    attr.name === 'clientOrderId' || attr.name === 'client_order_id'
  );
  if (clientOrderIdAttr) return clientOrderIdAttr.value;

  // Check order note
  if (order.note) {
    const match = order.note.match(/clientOrderId[:\s]+(\d+)/i);
    if (match) return match[1];
  }

  return null;
}

// ============================================
// PARCEL PANEL TRACKING (API v2)
// ============================================
async function handleTracking(request, env, corsHeaders) {
  try {
    const { orderNumber, trackingNumber } = await request.json();

    if (!orderNumber && !trackingNumber) {
      return Response.json({ tracking: null, message: 'No identifier provided' }, { headers: corsHeaders });
    }

    // Use ParcelPanel API v2 endpoint
    // Docs: https://docs.parcelpanel.com/shopify/api-webhook/api-v2/
    let url = 'https://open.parcelpanel.com/api/v2/tracking/order?';

    if (orderNumber) {
      // Keep the # in order number as ParcelPanel expects it
      const orderNum = orderNumber.startsWith('#') ? orderNumber : `#${orderNumber}`;
      url += `order_number=${encodeURIComponent(orderNum)}`;
    } else if (trackingNumber) {
      url = `https://open.parcelpanel.com/api/v2/tracking?tracking_number=${encodeURIComponent(trackingNumber)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-parcelpanel-api-key': env.PARCELPANEL_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('ParcelPanel API error:', response.status, await response.text());
      return Response.json({ tracking: null, message: 'Tracking lookup failed' }, { headers: corsHeaders });
    }

    const data = await response.json();

    // ParcelPanel v2 returns { order: { shipments: [...] } }
    const shipments = data?.order?.shipments || [];

    if (shipments.length === 0) {
      return Response.json({ tracking: null, message: 'No tracking found' }, { headers: corsHeaders });
    }

    // Process all shipments
    const trackingResults = shipments.map(shipment => {
      const checkpoints = shipment.checkpoints || [];

      // Map numeric status to string status
      const statusMap = {
        1: 'pending',
        2: 'info_received',
        3: 'in_transit',
        4: 'in_transit',
        5: 'out_for_delivery',
        6: 'delivered',
        7: 'failed_attempt',
        8: 'exception',
        9: 'expired',
        10: 'pickup'
      };

      const statusCode = shipment.status;
      let status = statusMap[statusCode];

      // If no numeric mapping, try to normalize string status
      if (!status) {
        const labelNormalized = (shipment.status_label || '').toLowerCase().replace(/\s+/g, '_');
        // Map common string variations to our standard status codes
        if (labelNormalized.includes('pickup') || labelNormalized.includes('ready_for')) {
          status = 'pickup';
        } else if (labelNormalized.includes('exception') || labelNormalized.includes('problem')) {
          status = 'exception';
        } else if (labelNormalized.includes('delivered')) {
          status = 'delivered';
        } else if (labelNormalized.includes('transit') || labelNormalized.includes('shipped')) {
          status = 'in_transit';
        } else if (labelNormalized.includes('out_for_delivery')) {
          status = 'out_for_delivery';
        } else {
          status = labelNormalized || 'unknown';
        }
      }

      return {
        trackingNumber: shipment.tracking_number,
        carrier: shipment.carrier?.name || shipment.carrier?.code || 'Unknown',
        carrierCode: shipment.carrier?.code,
        carrierLogo: shipment.carrier?.logo_url,
        carrierUrl: shipment.carrier?.url,
        status: status,
        statusLabel: shipment.status_label || formatTrackingStatus(status),
        substatus: shipment.substatus,
        substatusLabel: shipment.substatus_label,
        deliveryDate: shipment.delivery_date,
        estimatedDelivery: shipment.estimated_delivery_date,
        daysInTransit: shipment.transit_time || 0,
        orderDate: shipment.order_date,
        fulfillmentDate: shipment.fulfillment_date,
        lastMile: shipment.last_mile,
        // Return ALL checkpoints with full details for pickup location parsing
        checkpoints: checkpoints.map(cp => ({
          checkpoint_time: cp.checkpoint_time,
          message: cp.message || cp.detail,
          detail: cp.detail,
          location: cp.location,
          tag: cp.tag,
          status: cp.status,
          substatus: cp.substatus,
          substatus_label: cp.substatus_label
        })),
        lastUpdate: checkpoints[0]?.checkpoint_time || null
      };
    });

    return Response.json({
      tracking: trackingResults[0],
      allTracking: trackingResults
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Tracking error:', error);
    return Response.json({ tracking: null, message: 'Tracking lookup error' }, { headers: corsHeaders });
  }
}

function formatTrackingStatus(status) {
  const statusMap = {
    'pending': 'Pending',
    'info_received': 'Info Received',
    'in_transit': 'In Transit',
    'out_for_delivery': 'Out for Delivery',
    'delivered': 'Delivered',
    'failed_attempt': 'Failed Delivery',
    'exception': 'Exception',
    'expired': 'Expired',
    'pickup': 'Ready for Pickup'
  };
  return statusMap[status] || status;
}

// Convert country code to full name for Shopify search
function getCountryNameFromCode(code) {
  const countryMap = {
    'US': 'United States',
    'CA': 'Canada',
    'GB': 'United Kingdom',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'IT': 'Italy',
    'ES': 'Spain',
    'NL': 'Netherlands',
    'BE': 'Belgium',
    'AT': 'Austria',
    'CH': 'Switzerland',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland',
    'IE': 'Ireland',
    'PT': 'Portugal',
    'NZ': 'New Zealand',
    'JP': 'Japan',
    'MX': 'Mexico',
    'BR': 'Brazil'
  };
  return countryMap[code] || null;
}

// ============================================
// 90-DAY GUARANTEE VALIDATION
// ============================================
async function handleValidateGuarantee(request, env, corsHeaders) {
  const { orderNumber, orderCreatedAt } = await request.json();

  if (!orderNumber && !orderCreatedAt) {
    return Response.json({
      error: 'orderNumber or orderCreatedAt required'
    }, { status: 400, headers: corsHeaders });
  }

  let referenceDate = null;
  let usedFallback = false;
  let deliverySource = null;

  // Step 1: Try to get delivery date from ParcelPanel
  if (orderNumber) {
    try {
      const cleanOrder = orderNumber.replace('#', '');
      const url = `https://api.parcelpanel.com/api/v3/parcels?order_number=${encodeURIComponent(cleanOrder)}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${env.PARCELPANEL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const parcels = data.data || [];

        // Look for delivered parcel with delivery_date
        for (const parcel of parcels) {
          if (parcel.delivery_date && parcel.delivery_status === 'delivered') {
            referenceDate = new Date(parcel.delivery_date);
            deliverySource = 'parcelpanel_delivery';
            break;
          }
        }

        // If no delivery date but we have checkpoints, use the delivered checkpoint
        if (!referenceDate) {
          for (const parcel of parcels) {
            if (parcel.delivery_status === 'delivered' && parcel.checkpoints?.length > 0) {
              // Find the delivered checkpoint
              const deliveredCheckpoint = parcel.checkpoints.find(cp =>
                cp.tag === 'Delivered' || cp.substatus === 'delivered'
              );
              if (deliveredCheckpoint?.checkpoint_time) {
                referenceDate = new Date(deliveredCheckpoint.checkpoint_time);
                deliverySource = 'parcelpanel_checkpoint';
                break;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('ParcelPanel lookup error:', error);
    }
  }

  // Step 2: Fallback to order created date
  if (!referenceDate && orderCreatedAt) {
    referenceDate = new Date(orderCreatedAt);
    usedFallback = true;
    deliverySource = 'order_created_fallback';
  }

  // If we still don't have a date, return error
  if (!referenceDate) {
    return Response.json({
      eligible: false,
      error: 'Could not determine order date',
      daysRemaining: 0,
      usedFallback: true,
      deliverySource: null
    }, { headers: corsHeaders });
  }

  // Calculate days since delivery/order
  const now = new Date();
  const daysSince = Math.floor((now - referenceDate) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, POLICY_CONFIG.guaranteeDays - daysSince);
  const eligible = daysSince <= POLICY_CONFIG.guaranteeDays;

  return Response.json({
    eligible,
    daysSince,
    daysRemaining,
    usedFallback,
    deliverySource,
    referenceDate: referenceDate.toISOString(),
    guaranteeDays: POLICY_CONFIG.guaranteeDays
  }, { headers: corsHeaders });
}

// ============================================
// CHECKOUTCHAMP SUBSCRIPTION
// ============================================
async function handleSubscription(request, env, corsHeaders) {
  const { clientOrderId } = await request.json();

  if (!clientOrderId) {
    return Response.json({ error: 'clientOrderId required' }, { status: 400, headers: corsHeaders });
  }

  // Get order from CheckoutChamp
  const authHeader = 'Basic ' + btoa(`${env.CC_API_USERNAME}:${env.CC_API_PASSWORD}`);
  
  const orderResponse = await fetch(`https://api.checkoutchamp.com/order/${clientOrderId}`, {
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
  });

  if (!orderResponse.ok) {
    return Response.json({ error: 'CheckoutChamp order lookup failed' }, { status: 500, headers: corsHeaders });
  }

  const orderData = await orderResponse.json();
  const purchaseIds = orderData.result?.purchases?.map(p => p.purchaseId) || [];

  // Get subscription details for each purchase
  const subscriptions = await Promise.all(purchaseIds.map(async (purchaseId) => {
    const purchaseResponse = await fetch(`https://api.checkoutchamp.com/purchase/${purchaseId}`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!purchaseResponse.ok) return null;

    const purchaseData = await purchaseResponse.json();
    const purchase = purchaseData.result;

    return {
      purchaseId,
      productName: purchase.productName,
      status: purchase.status,
      lastBillingDate: purchase.lastBillingDate,
      nextBillingDate: purchase.nextBillingDate,
      frequency: purchase.billingIntervalDays,
      price: purchase.price,
      orders: purchase.orders || [],
    };
  }));

  return Response.json({ 
    subscriptions: subscriptions.filter(s => s !== null) 
  }, { headers: corsHeaders });
}

// ============================================
// CREATE CLICKUP CASE + RICHPANEL
// ============================================
async function handleCreateCase(request, env, corsHeaders) {
  const caseData = await request.json();
  
  // Generate case ID
  const now = new Date();
  const prefix = getCasePrefix(caseData.caseType);
  const caseId = `${prefix}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

  // Get ClickUp list ID based on case type
  const listId = getClickUpListId(caseData.caseType);

  // Create ClickUp task
  const clickupTask = await createClickUpTask(env, listId, {
    ...caseData,
    caseId,
  });

  // Create Richpanel email and private note
  const richpanelResult = await createRichpanelEntry(env, caseData, caseId);

  // Update ClickUp with Richpanel conversation URL
  if (richpanelResult.success && richpanelResult.conversationNo && clickupTask?.id) {
    await updateClickUpWithConversationUrl(env, clickupTask.id, richpanelResult.conversationNo);
  }

  // Log to D1 analytics database
  await logCaseToAnalytics(env, {
    caseId,
    sessionId: caseData.sessionId,
    caseType: caseData.caseType,
    resolution: caseData.resolution,
    orderNumber: caseData.orderNumber,
    email: caseData.email,
    customerName: caseData.customerName,
    refundAmount: caseData.refundAmount,
    selectedItems: caseData.selectedItems,
    clickupTaskId: clickupTask?.id,
    clickupTaskUrl: clickupTask?.url
  });

  return Response.json({
    success: true,
    caseId,
    clickupTaskId: clickupTask?.id,
    clickupTaskUrl: clickupTask?.url,
  }, { headers: corsHeaders });
}

// ============================================
// CREATE MANUAL HELP CASE (ORDER NOT FOUND)
// ============================================
async function handleCreateManualCase(request, env, corsHeaders) {
  const { email, fullName, phone, orderNumber, issue, preferredContact, lookupAttempts, sessionId, sessionReplayUrl } = await request.json();

  // Generate case ID
  const now = new Date();
  const caseId = `MAN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

  // Build lookup attempts log (plain text for ClickUp comment)
  const lookupLog = (lookupAttempts || []).map(attempt =>
    `✗ ${attempt.method}: ${attempt.value} - ${attempt.result}`
  ).join('\n');

  // Build lookup attempts log (HTML for Richpanel)
  const lookupLogHtml = (lookupAttempts || []).map(attempt =>
    `✗ ${attempt.method}: ${attempt.value} - ${attempt.result}`
  ).join('<br>');

  // Create ClickUp task with empty description (details go in comments)
  const taskData = {
    name: fullName || 'Unknown Customer',
    description: '', // Keep empty - details go in comments
    status: 'to do',
  };

  // Build custom fields
  const customFields = [
    { id: CLICKUP_CONFIG.fields.caseId, value: caseId },
    { id: CLICKUP_CONFIG.fields.emailAddress, value: email || '' },
    { id: CLICKUP_CONFIG.fields.orderNumber, value: orderNumber || '' },
    { id: CLICKUP_CONFIG.fields.resolution, value: 'Manual assistance - order not found' },
    { id: CLICKUP_CONFIG.fields.orderIssue, value: issue ? issue.substring(0, 200) : 'Order not found in system' },
  ];

  try {
    // Create ClickUp task
    const response = await fetch(`https://api.clickup.com/api/v2/list/${CLICKUP_CONFIG.lists.manualHelp}/task`, {
      method: 'POST',
      headers: {
        'Authorization': env.CLICKUP_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...taskData,
        custom_fields: customFields,
      }),
    });

    const task = await response.json();

    // Add formatted comment with all case details
    const sopUrl = SOP_URLS.manual;
    const commentLines = [
      `📋 **MANUAL HELP REQUEST - ORDER NOT FOUND**`,
      ``,
      `**Issue:** ${issue || 'No message provided'}`,
      `**Resolution:** Manual assistance required - order not found in system`,
      ``,
      `**Customer Email:** ${email || 'Not provided'}`,
      `**Customer Name:** ${fullName || 'Not provided'}`,
      `**Phone:** ${phone || 'Not provided'}`,
      `**Order Number:** ${orderNumber || 'Unknown'}`,
      `**Preferred Contact:** ${preferredContact === 'phone' ? 'Phone' : 'Email'}`,
      ``,
      `**Lookup Attempts:**`,
      lookupLog || 'No lookup attempts recorded',
      ``,
      `**SOP:** ${sopUrl}`,
      ``,
      sessionReplayUrl ? `🎥 **Session Recording:** ${sessionReplayUrl}` : '',
      ``,
      `---`,
      `Session ID: ${sessionId || 'N/A'}`,
      `Case ID: ${caseId}`,
    ].filter(Boolean);

    const commentText = commentLines.join('\n');

    await fetch(`https://api.clickup.com/api/v2/task/${task.id}/comment`, {
      method: 'POST',
      headers: {
        'Authorization': env.CLICKUP_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment_text: commentText }),
    });

    // Create Richpanel entry (email + private note)
    let richpanelResult = null;
    if (env.RICHPANEL_API_KEY && email) {
      const caseData = {
        email,
        customerName: fullName,
        customerFirstName: fullName ? fullName.split(' ')[0] : 'Customer',
        customerLastName: fullName ? fullName.split(' ').slice(1).join(' ') : '',
        orderNumber: orderNumber || 'N/A',
        caseType: 'manual',
        resolution: 'manual_assistance',
        issueType: 'order_not_found',
        intentDetails: issue,
      };

      richpanelResult = await createRichpanelEntry(env, caseData, caseId);

      // Update ClickUp with conversation URL if available
      if (richpanelResult?.success && richpanelResult.conversationNo && task?.id) {
        await updateClickUpWithConversationUrl(env, task.id, richpanelResult.conversationNo);
      }
    }

    // Log to analytics
    await logCaseToAnalytics(env, {
      caseId,
      sessionId,
      caseType: 'manual',
      resolution: 'manual_order_not_found',
      orderNumber: orderNumber || 'unknown',
      email: email || '',
      customerName: fullName || '',
      clickupTaskId: task?.id,
      clickupTaskUrl: task?.url,
      richpanelConversationNo: richpanelResult?.conversationNo,
    });

    return Response.json({
      success: true,
      caseId,
      clickupTaskId: task?.id,
      clickupTaskUrl: task?.url,
      richpanelConversationNo: richpanelResult?.conversationNo,
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error creating manual case:', error);
    return Response.json({
      success: false,
      caseId, // Still return the case ID even if ClickUp fails
      error: 'Failed to create ClickUp task',
    }, { headers: corsHeaders });
  }
}

function getCasePrefix(caseType) {
  const prefixes = {
    'refund': 'REF',
    'return': 'RET',
    'shipping': 'SHP',
    'subscription': 'SUB',
    'manual': 'MAN',
  };
  return prefixes[caseType] || 'CAS';
}

function getClickUpListId(caseType) {
  const listMap = {
    'refund': CLICKUP_CONFIG.lists.refundRequests,
    'return': CLICKUP_CONFIG.lists.returnRequests,
    'shipping': CLICKUP_CONFIG.lists.shippingIssues,
    'subscription': CLICKUP_CONFIG.lists.subscriptionManagement,
    'manual': CLICKUP_CONFIG.lists.manualHelp,
  };
  return listMap[caseType] || CLICKUP_CONFIG.lists.manualHelp;
}

// Format resolution code to human-readable text (concise format)
function formatResolution(resolution, caseData) {
  if (!resolution) return 'Pending Review';

  const refundAmount = caseData.refundAmount ? `$${parseFloat(caseData.refundAmount).toFixed(2)}` : 'TBD';

  // Build concise resolution text
  const resolutionMap = {
    // Partial refunds (product issues)
    'partial_20': `Give 20% refund (${refundAmount})`,
    'partial_50': `Give 50% refund (${refundAmount})`,
    'partial_75': `Give 75% refund (${refundAmount})`,

    // Full refunds
    'full_refund': caseData.keepProduct
      ? `Give full refund (${refundAmount})`
      : `Give full refund (${refundAmount}) after return`,
    'full': caseData.keepProduct
      ? `Give full refund (${refundAmount})`
      : `Give full refund (${refundAmount}) after return`,

    // Returns
    'return_refund': `Send return label and refund (${refundAmount}) after return`,
    'exchange': 'Send return label and ship replacement',

    // Shipping - Partial refund + reship combos
    'partial_20_reship': `Give 20% refund (${refundAmount}) and reship order`,
    'partial_50_reship': `Give 50% refund (${refundAmount}) and reship order`,

    // Shipping - Reship only
    'reship': 'Reship order',

    // Shipping - Refunds for lost/damaged
    'refund_lost': `Give full refund (${refundAmount}) - package lost`,
    'refund_damaged': `Give full refund (${refundAmount}) - package damaged`,

    // Investigation flows
    'investigation_delivered_not_received': 'Investigate with carrier',
    'replacement_damaged': 'Ship replacement - damaged item',
    'reship_wrong_item': 'Ship correct item',
    'reship_missing_item': 'Ship missing item',
    'partial_missing': `Give partial refund (${refundAmount}) for missing item`,

    // Subscription
    'pause': 'Pause subscription',
    'cancel': 'Cancel subscription',
    'change_schedule': 'Update delivery schedule',
    'change_address': 'Update shipping address',

    // Shipping issues - general
    'no_tracking': 'Investigate and provide tracking or reship',
    'stuck_out_for_delivery': 'Contact carrier or reship',
    'pending_too_long': 'Check fulfillment status',
    'multiple_failed_attempts': 'Arrange redelivery or reship',
  };

  // Check for dynamic partial_XX_reship patterns
  const partialReshipMatch = resolution.match(/^partial_(\d+)_reship$/);
  if (partialReshipMatch) {
    const percent = partialReshipMatch[1];
    return `Give ${percent}% refund (${refundAmount}) and reship order`;
  }

  return resolutionMap[resolution] || resolution.replace(/_/g, ' ');
}

// Format order issue from customer's reason
function formatOrderIssue(caseData) {
  // If there's detailed intent from the customer
  if (caseData.intentDetails) {
    return caseData.intentDetails;
  }

  // Map issue types to readable descriptions
  const issueMap = {
    // Product issues
    'not_met_expectations': "Product didn't meet expectations",
    'changed_mind': 'Customer changed their mind',
    'ordered_mistake': 'Ordered by mistake',
    'defective': 'Product is defective',
    'wrong_item': 'Received wrong item',
    'damaged': 'Product arrived damaged',
    'missing_item': 'Item missing from order',
    'not_as_described': 'Product not as described',
    'dog_not_using': 'Dog not using product',
    'quality_difference': 'Quality difference noticed',

    // Shipping issues
    'late_delivery': 'Delivery taking too long',
    'not_received': 'Order not received',
    'lost_package': 'Package lost in transit',
    'stuck_in_transit': 'Package stuck in transit',
    'delivery_exception': 'Delivery exception reported',
    'address_issue': 'Address correction needed',
    'failed_delivery': 'Delivery attempt failed',

    // Subscription issues
    'subscription_cancel': 'Cancel subscription',
    'subscription_pause': 'Pause subscription',
    'subscription_change': 'Change subscription',
    'charged_unexpectedly': 'Unexpected subscription charge',

    // General
    'other': 'Other issue - see details',
  };

  // Check if we have a matching issue type
  if (caseData.issueType && issueMap[caseData.issueType]) {
    return issueMap[caseData.issueType];
  }

  // Fallback based on case type for better context
  const caseTypeFallbacks = {
    'refund': 'Refund request - product issue',
    'return': 'Return request - product issue',
    'shipping': 'Shipping issue - delivery problem',
    'subscription': 'Subscription change request',
    'manual': 'Customer support request',
  };

  return caseTypeFallbacks[caseData.caseType] || caseData.issueType?.replace(/_/g, ' ') || 'General inquiry';
}

async function createClickUpTask(env, listId, caseData) {
  // Format resolution to human-readable text
  const formattedResolution = formatResolution(caseData.resolution, caseData);
  const orderIssue = formatOrderIssue(caseData);

  // Build custom fields array - ALWAYS include essential fields
  const customFields = [
    { id: CLICKUP_CONFIG.fields.caseId, value: caseData.caseId },
    { id: CLICKUP_CONFIG.fields.emailAddress, value: caseData.email || '' },
    { id: CLICKUP_CONFIG.fields.resolution, value: formattedResolution },
    // ALWAYS populate order issue - uses smart fallback if not specified
    { id: CLICKUP_CONFIG.fields.orderIssue, value: orderIssue },
  ];

  if (caseData.orderNumber) {
    customFields.push({ id: CLICKUP_CONFIG.fields.orderNumber, value: caseData.orderNumber });
  }

  if (caseData.orderUrl) {
    customFields.push({ id: CLICKUP_CONFIG.fields.orderUrl, value: caseData.orderUrl });
  }

  if (caseData.refundAmount) {
    customFields.push({ id: CLICKUP_CONFIG.fields.refundAmount, value: String(caseData.refundAmount) });
  }

  if (caseData.selectedItems) {
    const itemsText = Array.isArray(caseData.selectedItems)
      ? caseData.selectedItems.map(i => `${i.title} (${i.sku})`).join(', ')
      : caseData.selectedItems;
    customFields.push({ id: CLICKUP_CONFIG.fields.selectedItems, value: itemsText });
  }

  // Carrier issue dropdown for shipping cases
  if (caseData.caseType === 'shipping' && caseData.carrierIssue) {
    const optionId = CLICKUP_CONFIG.options.carrierIssue[caseData.carrierIssue];
    if (optionId) {
      customFields.push({ id: CLICKUP_CONFIG.fields.carrierIssue, value: optionId });
    }
  }

  // Return status for return cases
  if (caseData.caseType === 'return') {
    customFields.push({
      id: CLICKUP_CONFIG.fields.returnStatus,
      value: CLICKUP_CONFIG.options.returnStatus.awaitingReturn
    });
  }

  // Subscription fields
  if (caseData.caseType === 'subscription') {
    if (caseData.actionType) {
      const actionId = CLICKUP_CONFIG.options.actionType[caseData.actionType];
      if (actionId) {
        customFields.push({ id: CLICKUP_CONFIG.fields.actionType, value: actionId });
      }
    }
    if (caseData.subscriptionStatus) {
      const statusId = CLICKUP_CONFIG.options.subscriptionStatus[caseData.subscriptionStatus];
      if (statusId) {
        customFields.push({ id: CLICKUP_CONFIG.fields.subscriptionStatus, value: statusId });
      }
    }
  }

  // Task body with no description (details go in comments)
  const taskBody = {
    name: caseData.customerName || 'Unknown Customer',
    description: '', // Keep empty - details go in comments
    custom_fields: customFields,
  };

  const response = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
    method: 'POST',
    headers: {
      'Authorization': env.CLICKUP_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskBody),
  });

  if (!response.ok) {
    console.error('ClickUp task creation failed');
    return null;
  }

  const task = await response.json();

  // Build formatted comment using ClickUp's rich text API
  const sopUrl = SOP_URLS[caseData.caseType] || SOP_URLS.manual;
  const orderDate = caseData.orderDate ? new Date(caseData.orderDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : 'Unknown';

  // Build ClickUp comment with proper JSON formatting
  const comment = buildClickUpComment(caseData, orderIssue, formattedResolution, orderDate, sopUrl, caseData.sessionReplayUrl);

  await fetch(`https://api.clickup.com/api/v2/task/${task.id}/comment`, {
    method: 'POST',
    headers: {
      'Authorization': env.CLICKUP_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comment }),
  });

  return task;
}

// Build ClickUp comment with proper rich text formatting
function buildClickUpComment(caseData, orderIssue, formattedResolution, orderDate, sopUrl, sessionReplayUrl) {
  const comment = [];

  // Helper to add bold label with value
  const addBoldLine = (label, value) => {
    comment.push({ text: label, attributes: { bold: true } });
    comment.push({ text: ` ${value}` });
    comment.push({ text: '\n', attributes: {} });
  };

  // Helper to add section header
  const addHeader = (text) => {
    comment.push({ text: '\n', attributes: {} });
    comment.push({ text: text, attributes: { bold: true } });
    comment.push({ text: '\n', attributes: {} });
  };

  // Header with emoji
  comment.push({ text: 'U0001F4CB', type: 'emoticon', emoticon: { code: '1f4cb' } });
  comment.push({ text: ' CASE DETAILS', attributes: { bold: true } });
  comment.push({ text: '\n\n', attributes: {} });

  // Core case info
  addBoldLine('Issue:', orderIssue);
  addBoldLine('Resolution:', formattedResolution);
  comment.push({ text: '\n', attributes: {} });
  addBoldLine('Customer Email:', caseData.email || 'Not provided');
  addBoldLine('Order Number:', caseData.orderNumber || 'N/A');
  addBoldLine('Order Date:', orderDate);
  addBoldLine('Order Value:', caseData.refundAmount ? `$${parseFloat(caseData.refundAmount).toFixed(2)}` : 'N/A');
  comment.push({ text: '\n', attributes: {} });

  // SOP link
  comment.push({ text: 'SOP:', attributes: { bold: true } });
  comment.push({ text: ' ' });
  comment.push({ text: sopUrl, attributes: { link: sopUrl } });
  comment.push({ text: '\n', attributes: {} });

  // Items list (bulleted)
  if (caseData.selectedItems && caseData.selectedItems.length > 0) {
    addHeader('Items:');
    caseData.selectedItems.forEach(item => {
      comment.push({ text: `${item.title} (${item.sku || 'N/A'})`, attributes: {} });
      comment.push({ text: '\n', attributes: { list: { list: 'bullet' } } });
    });
  }

  // Shopify order link
  if (caseData.orderUrl) {
    comment.push({ text: '\n', attributes: {} });
    comment.push({ text: 'Shopify Order:', attributes: { bold: true } });
    comment.push({ text: ' ' });
    comment.push({ text: caseData.orderUrl, attributes: { link: caseData.orderUrl } });
    comment.push({ text: '\n', attributes: {} });
  }

  // Shipping-specific details
  if (caseData.caseType === 'shipping') {
    addHeader('SHIPPING DETAILS');

    if (caseData.trackingNumber) addBoldLine('Tracking Number:', caseData.trackingNumber);
    if (caseData.carrierName) addBoldLine('Carrier:', caseData.carrierName);
    if (caseData.trackingStatus) addBoldLine('Tracking Status:', caseData.trackingStatus);
    if (caseData.daysInTransit) addBoldLine('Days in Transit:', caseData.daysInTransit);

    // Shipping address (with warning if updated)
    if (caseData.shippingAddress) {
      const addr = caseData.shippingAddress;
      comment.push({ text: '\n', attributes: {} });

      if (caseData.addressChanged) {
        comment.push({ text: 'U000026A0', type: 'emoticon', emoticon: { code: '26a0' } });
        comment.push({ text: ' UPDATED ADDRESS:', attributes: { bold: true } });
      } else {
        comment.push({ text: 'Shipping Address:', attributes: { bold: true } });
      }
      comment.push({ text: '\n', attributes: {} });

      if (addr.address1) {
        comment.push({ text: addr.address1, attributes: {} });
        comment.push({ text: '\n', attributes: {} });
      }
      if (addr.address2) {
        comment.push({ text: addr.address2, attributes: {} });
        comment.push({ text: '\n', attributes: {} });
      }
      const cityLine = [addr.city, addr.province, addr.zip].filter(Boolean).join(', ');
      if (cityLine) {
        comment.push({ text: cityLine, attributes: {} });
        comment.push({ text: '\n', attributes: {} });
      }
      if (addr.country) {
        comment.push({ text: addr.country, attributes: {} });
        comment.push({ text: '\n', attributes: {} });
      }
    }

    if (caseData.pickupReason) {
      comment.push({ text: '\n', attributes: {} });
      addBoldLine("Customer Reason (Can't Pickup):", caseData.pickupReason);
    }
  }

  // Subscription-specific details
  if (caseData.caseType === 'subscription') {
    addHeader('SUBSCRIPTION DETAILS');

    if (caseData.purchaseId) addBoldLine('Purchase ID:', caseData.purchaseId);
    if (caseData.clientOrderId) addBoldLine('Client Order ID:', caseData.clientOrderId);
    if (caseData.subscriptionProductName) addBoldLine('Product:', caseData.subscriptionProductName);

    if (caseData.actionType) {
      const actionLabels = {
        pause: 'Pause Subscription',
        cancel: 'Cancel Subscription',
        changeSchedule: 'Change Schedule',
        changeAddress: 'Change Address'
      };
      addBoldLine('Action:', actionLabels[caseData.actionType] || caseData.actionType);
    }
    if (caseData.discountPercent) addBoldLine('Discount Applied:', `${caseData.discountPercent}%`);
    if (caseData.cancelReason) {
      const reasonLabels = {
        expensive: 'Too expensive',
        too_many: 'Has too many',
        not_working: 'Not working as described',
        moving: 'Moving',
        other: 'Other reason'
      };
      addBoldLine('Cancel Reason:', reasonLabels[caseData.cancelReason] || caseData.cancelReason);
    }
    if (caseData.subscriptionStatus) addBoldLine('Status:', caseData.subscriptionStatus);
  }

  // Session replay link (always include if available)
  if (sessionReplayUrl) {
    comment.push({ text: '\n', attributes: {} });
    comment.push({ text: '🎥', type: 'emoticon', emoticon: { code: '1f3a5' } });
    comment.push({ text: ' Session Recording:', attributes: { bold: true } });
    comment.push({ text: ' ' });
    comment.push({ text: sessionReplayUrl, attributes: { link: sessionReplayUrl } });
    comment.push({ text: '\n', attributes: {} });
  }

  return comment;
}

// Update ClickUp task with Richpanel conversation URL
async function updateClickUpWithConversationUrl(env, taskId, conversationNo) {
  const conversationUrl = `https://app.richpanel.com/conversations?viewId=search&conversationNo=${conversationNo}`;
  const fieldId = CLICKUP_CONFIG.fields.conversationUrl;

  try {
    const response = await fetch(`https://api.clickup.com/api/v2/task/${taskId}/field/${fieldId}`, {
      method: 'POST',
      headers: {
        'Authorization': env.CLICKUP_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: conversationUrl }),
    });

    if (!response.ok) {
      console.error('Failed to update ClickUp conversation URL:', response.status);
    } else {
      console.log('ClickUp conversation URL updated:', conversationUrl);
    }
  } catch (error) {
    console.error('Error updating ClickUp conversation URL:', error);
  }
}

// ============================================
// RICHPANEL INTEGRATION
// Requires env.RICHPANEL_API_KEY
// ============================================

async function createRichpanelEntry(env, caseData, caseId) {
  // Skip if no API key configured
  if (!env.RICHPANEL_API_KEY) {
    console.log('Richpanel: Skipping - no API key configured');
    return { success: false, error: 'No API key configured' };
  }

  try {
    // 1. Create the customer email (ticket)
    const ticketResult = await createRichpanelTicket(env, caseData, caseId);

    if (!ticketResult.success) {
      return ticketResult;
    }

    const ticketId = ticketResult.ticketId;
    const conversationNo = ticketResult.conversationNo;

    // 2. Add private note with action steps
    await createRichpanelPrivateNote(env, ticketId, caseData, caseId);

    // 3. Return conversation URL for ClickUp (uses conversationNo for search)
    const conversationUrl = `https://app.richpanel.com/conversations?viewId=search&conversationNo=${conversationNo}`;

    console.log('Richpanel: Entry created successfully', { caseId, ticketId, conversationNo });

    return {
      success: true,
      ticketId,
      conversationNo,
      conversationUrl
    };
  } catch (error) {
    console.error('Richpanel integration error:', error);

    // Don't fail the whole case creation if Richpanel fails
    return {
      success: false,
      error: error.message
    };
  }
}

async function createRichpanelTicket(env, caseData, caseId) {
  // Use test email in test mode (determined by env variables)
  const testMode = isTestMode(env);
  const fromEmail = testMode
    ? RICHPANEL_CONFIG.testEmail
    : (caseData.email || RICHPANEL_CONFIG.testEmail);

  const customerFirstName = caseData.customerFirstName || 'Customer';
  const customerLastName = caseData.customerLastName || '';

  // Build subject line with Case ID and specific issue
  const orderIssue = formatOrderIssue(caseData);
  const subject = `${caseId} - ${orderIssue} - Order ${caseData.orderNumber || 'N/A'}`;

  // Build customer message (simulated email from customer)
  const customerMessage = buildCustomerMessage(caseData, caseId, testMode);

  const response = await fetch('https://api.richpanel.com/v1/tickets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-richpanel-key': env.RICHPANEL_API_KEY
    },
    body: JSON.stringify({
      ticket: {
        status: 'OPEN',
        subject: subject,
        comment: {
          sender_type: 'customer',
          body: customerMessage
        },
        customer_profile: {
          firstName: customerFirstName,
          lastName: customerLastName
        },
        via: {
          channel: 'email',
          source: {
            from: { address: fromEmail },
            to: { address: RICHPANEL_CONFIG.supportEmail }
          }
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Richpanel API error:', response.status, errorText);
    return { success: false, error: `Richpanel API error: ${response.status}` };
  }

  const result = await response.json();

  // Extract ticketId and conversationNo with multiple fallback variations
  const ticketId = result.id || result.ticket?.id;

  // Richpanel API response format can vary, check all possible field names
  const conversationNo = result.conversationNo ||
                         result.ticket?.conversationNo ||
                         result.conversation_no ||
                         result.ticket?.conversation_no ||
                         result.ticketNumber ||
                         result.ticket?.ticketNumber ||
                         result.ticket_number ||
                         result.ticket?.ticket_number;

  console.log('Richpanel ticket created:', { ticketId, conversationNo, rawResult: JSON.stringify(result) });

  return {
    success: true,
    ticketId,
    conversationNo
  };
}

function buildCustomerMessage(caseData, caseId, testMode = true) {
  const testNotice = testMode
    ? '[TEST MODE - This is not a real customer request]\n\n'
    : '';

  const orderIssue = formatOrderIssue(caseData);
  const formattedResolution = formatResolution(caseData.resolution, caseData);

  // Build items list if available
  const itemsList = caseData.selectedItems?.map(item =>
    `- ${item.title}${item.sku ? ` (SKU: ${item.sku})` : ''}`
  ).join('\n') || '';

  // Build address section if changed
  let addressSection = '';
  if (caseData.addressChanged && caseData.shippingAddress) {
    const addr = caseData.shippingAddress;
    const addressParts = [
      addr.address1,
      addr.address2,
      [addr.city, addr.province, addr.zip].filter(Boolean).join(', '),
      addr.country
    ].filter(Boolean);
    addressSection = `\nNEW ADDRESS: ${addressParts.join(', ')}`;
  }

  // Build message parts based on case type
  const messageParts = [testNotice];
  const firstName = caseData.customerFirstName || caseData.customerName?.split(' ')[0] || 'Customer';
  const refundAmountStr = caseData.refundAmount ? `$${parseFloat(caseData.refundAmount).toFixed(2)}` : '';

  // RETURN CASE - Natural customer email
  if (caseData.caseType === 'return') {
    messageParts.push(
      'Hi there,',
      '',
      `I'd like to return my order for a refund.`,
      '',
      `Here's what happened: ${orderIssue}`,
      '',
      `I'm returning the following item(s):`,
      ''
    );
    if (itemsList) {
      messageParts.push(itemsList);
    }
    messageParts.push(
      '',
      `My order number is ${caseData.orderNumber || 'N/A'} and my case reference is ${caseId}.`,
      '',
      `I understand that once you receive and inspect my return, I'll get a full refund${refundAmountStr ? ` of ${refundAmountStr}` : ''}.`,
      '',
      `I'll send over the tracking number as soon as I've shipped the package.`,
      '',
      'Thanks for your help!',
      '',
      firstName
    );
  }
  // REFUND CASE - Natural customer email
  else if (caseData.caseType === 'refund') {
    messageParts.push(
      'Hi there,',
      '',
      `I'm reaching out because I need some help with my order.`,
      '',
      `The issue: ${orderIssue}`,
      '',
      `This is regarding my order #${caseData.orderNumber || 'N/A'} (Case ID: ${caseId}).`,
      ''
    );
    if (itemsList) {
      messageParts.push('The item(s) affected:', '', itemsList, '');
    }
    messageParts.push(
      `I've been offered a ${formattedResolution.toLowerCase()}${refundAmountStr ? ` of ${refundAmountStr}` : ''} which I've accepted.`,
      '',
      `Please let me know if you need anything else from me.`,
      '',
      'Thanks!',
      '',
      firstName
    );
  }
  // SHIPPING CASE - Natural customer email
  else if (caseData.caseType === 'shipping') {
    messageParts.push(
      'Hi there,',
      '',
      `I'm having an issue with the delivery of my order.`,
      '',
      `The problem: ${orderIssue}`,
      '',
      `My order number is ${caseData.orderNumber || 'N/A'} (Case ID: ${caseId}).`,
      ''
    );
    if (itemsList) {
      messageParts.push('Order contains:', '', itemsList, '');
    }
    messageParts.push(
      `The resolution we agreed on: ${formattedResolution}${refundAmountStr ? ` (${refundAmountStr})` : ''}.`,
      '',
      `Please let me know once this has been processed.`,
      '',
      'Thanks for sorting this out!',
      '',
      firstName
    );
  }
  // SUBSCRIPTION CASE - Natural customer email
  else if (caseData.caseType === 'subscription') {
    const actionLabels = {
      pause: 'pause my subscription',
      cancel: 'cancel my subscription',
      changeSchedule: 'change my delivery schedule',
      changeAddress: 'update my shipping address'
    };
    const actionText = actionLabels[caseData.actionType] || 'make changes to my subscription';

    messageParts.push(
      'Hi there,',
      '',
      `I'd like to ${actionText}.`,
      '',
      `Reason: ${orderIssue}`,
      '',
      `My details:`,
      `• Order: ${caseData.orderNumber || 'N/A'}`,
      `• Case ID: ${caseId}`
    );
    if (caseData.purchaseId) messageParts.push(`• Purchase ID: ${caseData.purchaseId}`);
    if (caseData.subscriptionProductName) messageParts.push(`• Product: ${caseData.subscriptionProductName}`);
    messageParts.push(
      '',
      `Resolution: ${formattedResolution}${refundAmountStr ? ` (${refundAmountStr})` : ''}.`,
      '',
      'Thanks!',
      '',
      firstName
    );
  }
  // DEFAULT/MANUAL CASE
  else {
    messageParts.push(
      'Hi there,',
      '',
      `I'm reaching out for help with my order.`,
      '',
      `Issue: ${orderIssue}`,
      '',
      `Order Number: ${caseData.orderNumber || 'N/A'}`,
      `Case ID: ${caseId}`,
      ''
    );
    if (itemsList) {
      messageParts.push('Items:', '', itemsList, '');
    }
    if (formattedResolution) {
      messageParts.push(`Resolution requested: ${formattedResolution}${refundAmountStr ? ` (${refundAmountStr})` : ''}`, '');
    }
    messageParts.push(
      'Please let me know if you need any more information.',
      '',
      'Thanks!',
      '',
      firstName
    );
  }

  return messageParts.filter(Boolean).join('\n').trim();
}

function getSubjectByType(caseType, resolution) {
  const subjects = {
    'refund': `Refund Request - ${resolution || 'Full Refund'}`,
    'return': 'Return Request',
    'shipping': 'Shipping Issue',
    'subscription': `Subscription - ${resolution || 'Change Request'}`,
    'manual': 'Customer Support Request'
  };
  return subjects[caseType] || 'Customer Support Request';
}

async function createRichpanelPrivateNote(env, ticketId, caseData, caseId) {
  const actionSteps = getActionStepsHtml(caseData);
  const formattedResolution = formatResolution(caseData.resolution, caseData);
  const orderIssue = formatOrderIssue(caseData);
  const sopUrl = SOP_URLS[caseData.caseType] || SOP_URLS.manual;
  const orderDate = caseData.orderDate ? new Date(caseData.orderDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : 'Unknown';

  // Build items list in HTML
  const itemsHtml = caseData.selectedItems && caseData.selectedItems.length > 0
    ? caseData.selectedItems.map(item => `• ${item.title} (${item.sku || 'N/A'})`).join('<br>')
    : 'No items selected';

  // Build shipping-specific details HTML
  let shippingDetailsHtml = '';
  if (caseData.caseType === 'shipping') {
    let addressHtml = '';
    if (caseData.shippingAddress) {
      const addr = caseData.shippingAddress;
      const addressLabel = caseData.addressChanged ? '⚠️ UPDATED SHIPPING ADDRESS' : 'Shipping Address';
      addressHtml = `
<b>${addressLabel}:</b><br>
${addr.address1 || ''}<br>
${addr.address2 ? `${addr.address2}<br>` : ''}
${[addr.city, addr.province, addr.zip].filter(Boolean).join(', ')}<br>
${addr.country || ''}<br>
`;
    }

    shippingDetailsHtml = `
<br>
<b>─────────────────────</b><br>
<br>
<b>SHIPPING DETAILS</b><br>
${caseData.trackingNumber ? `<b>Tracking Number:</b> ${caseData.trackingNumber}<br>` : ''}
${caseData.carrierName ? `<b>Carrier:</b> ${caseData.carrierName}<br>` : ''}
${caseData.trackingStatus ? `<b>Tracking Status:</b> ${caseData.trackingStatus}<br>` : ''}
${caseData.daysInTransit ? `<b>Days in Transit:</b> ${caseData.daysInTransit}<br>` : ''}
${addressHtml}
${caseData.pickupReason ? `<b>Can't Pickup Reason:</b> ${caseData.pickupReason}<br>` : ''}
${caseData.notes ? `<b>Notes:</b> ${caseData.notes}<br>` : ''}
`;
  }

  // Build subscription-specific details HTML
  let subscriptionDetailsHtml = '';
  if (caseData.caseType === 'subscription') {
    const actionLabels = {
      pause: 'Pause Subscription',
      cancel: 'Cancel Subscription',
      changeSchedule: 'Change Schedule',
      changeAddress: 'Change Address'
    };
    const reasonLabels = {
      expensive: 'Too expensive',
      too_many: 'Has too many',
      not_working: 'Not working as described',
      moving: 'Moving',
      other: 'Other reason'
    };
    subscriptionDetailsHtml = `
<br>
<b>─────────────────────</b><br>
<br>
<b>SUBSCRIPTION DETAILS</b><br>
${caseData.purchaseId ? `<b>Purchase ID:</b> ${caseData.purchaseId}<br>` : ''}
${caseData.clientOrderId ? `<b>Client Order ID:</b> ${caseData.clientOrderId}<br>` : ''}
${caseData.subscriptionProductName ? `<b>Product:</b> ${caseData.subscriptionProductName}<br>` : ''}
${caseData.actionType ? `<b>Action:</b> ${actionLabels[caseData.actionType] || caseData.actionType}<br>` : ''}
${caseData.discountPercent ? `<b>Discount Applied:</b> ${caseData.discountPercent}%<br>` : ''}
${caseData.cancelReason ? `<b>Cancel Reason:</b> ${reasonLabels[caseData.cancelReason] || caseData.cancelReason}<br>` : ''}
${caseData.notes ? `<b>Notes:</b> ${caseData.notes}<br>` : ''}
`;
  }

  // Build HTML formatted note content with <br> and <b> tags (no italics)
  const noteContent = `
<b>🎯 ACTION REQUIRED</b><br>
<br>
<b>Case ID:</b> ${caseId}<br>
<b>Order Number:</b> ${caseData.orderNumber || 'N/A'}<br>
<b>Order Date:</b> ${orderDate}<br>
<b>Customer Email:</b> ${caseData.email || 'Not provided'}<br>
<br>
<b>Issue:</b> ${orderIssue}<br>
<b>Resolution:</b> ${formattedResolution}<br>
${caseData.refundAmount ? `<b>Refund Amount:</b> $${parseFloat(caseData.refundAmount).toFixed(2)}<br>` : ''}
<br>
<b>─────────────────────</b><br>
<br>
<b>Action Steps:</b><br>
${actionSteps}<br>
${shippingDetailsHtml}
${subscriptionDetailsHtml}
<br>
<b>─────────────────────</b><br>
<br>
${caseData.caseType !== 'subscription' && caseData.caseType !== 'shipping' ? `<b>Items:</b><br>${itemsHtml}<br><br>` : ''}
${caseData.orderUrl ? `<b>Shopify Order:</b> <a href="${caseData.orderUrl}">${caseData.orderUrl}</a><br>` : ''}
<b>SOP:</b> <a href="${sopUrl}">${sopUrl}</a>
`.trim();

  // Use PUT to add a private note (operator comment)
  const response = await fetch(
    `https://api.richpanel.com/v1/tickets/${ticketId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-richpanel-key': env.RICHPANEL_API_KEY
      },
      body: JSON.stringify({
        ticket: {
          comment: {
            body: noteContent,
            public: false,
            sender_type: 'operator'
          }
        }
      })
    }
  );

  if (!response.ok) {
    console.error('Failed to create private note:', response.status);
  }

  return response.ok;
}

// HTML version of action steps for Richpanel
function getActionStepsHtml(caseData) {
  const type = caseData.caseType;
  const resolution = caseData.resolution;

  if (type === 'refund') {
    if (resolution === 'full_refund' || resolution === 'Full Refund') {
      return `1. ✅ Verify order in Shopify<br>2. ✅ Process full refund in Shopify<br>3. ✅ Send refund confirmation email<br>4. ✅ Close ticket`;
    }
    return `1. ✅ Verify order in Shopify<br>2. ✅ Process partial refund: $${caseData.refundAmount || 'TBD'}<br>3. ✅ Send refund confirmation email<br>4. ✅ Close ticket`;
  }

  if (type === 'return') {
    return `1. ✅ Verify order is within return window<br>2. ✅ Send return label to customer<br>3. ⏳ Wait for return to arrive<br>4. ✅ Process refund once received<br>5. ✅ Close ticket`;
  }

  if (type === 'shipping') {
    return `1. ✅ Check tracking status in ParcelPanel<br>2. ✅ Contact carrier if needed<br>3. ✅ Update customer on status<br>4. ✅ Close ticket when resolved`;
  }

  if (type === 'subscription') {
    return `1. ✅ Verify subscription in CheckoutChamp<br>2. ✅ Process requested change: ${resolution || 'N/A'}<br>3. ✅ Confirm change with customer<br>4. ✅ Close ticket`;
  }

  return `1. ✅ Review customer request<br>2. ✅ Take appropriate action<br>3. ✅ Update customer<br>4. ✅ Close ticket`;
}

function getActionSteps(caseData) {
  const type = caseData.caseType;
  const resolution = caseData.resolution;

  if (type === 'refund') {
    if (resolution === 'full_refund' || resolution === 'Full Refund') {
      return `
1. ✅ Verify order in Shopify
2. ✅ Process full refund in Shopify
3. ✅ Send refund confirmation email
4. ✅ Close ticket`;
    }
    return `
1. ✅ Verify order in Shopify
2. ✅ Process partial refund: $${caseData.refundAmount || 'TBD'}
3. ✅ Send refund confirmation email
4. ✅ Close ticket`;
  }

  if (type === 'return') {
    return `
1. ✅ Verify order is within return window
2. ✅ Send return label to customer
3. ⏳ Wait for return to arrive
4. ✅ Process refund once received
5. ✅ Close ticket`;
  }

  if (type === 'shipping') {
    return `
1. ✅ Check tracking status in ParcelPanel
2. ✅ Contact carrier if needed
3. ✅ Update customer on status
4. ✅ Close ticket when resolved`;
  }

  if (type === 'subscription') {
    return `
1. ✅ Verify subscription in CheckoutChamp
2. ✅ Process requested change: ${resolution || 'N/A'}
3. ✅ Confirm change with customer
4. ✅ Close ticket`;
  }

  return `
1. ✅ Review customer request
2. ✅ Take appropriate action
3. ✅ Update customer
4. ✅ Close ticket`;
}

// ============================================
// CHECK EXISTING CASE (DEDUPE)
// ============================================
async function handleCheckCase(request, env, corsHeaders) {
  const { orderNumber, email } = await request.json();

  if (!orderNumber && !email) {
    return Response.json({ existingCase: false }, { headers: corsHeaders });
  }

  // Search all ClickUp lists for existing open cases
  const lists = Object.values(CLICKUP_CONFIG.lists);
  
  for (const listId of lists) {
    try {
      const response = await fetch(
        `https://api.clickup.com/api/v2/list/${listId}/task?statuses[]=to%20do&statuses[]=in%20progress`,
        {
          headers: { 'Authorization': env.CLICKUP_API_KEY },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const tasks = data.tasks || [];
        
        // Find matching task
        const matchingTask = tasks.find(task => {
          const orderField = task.custom_fields?.find(f => f.id === CLICKUP_CONFIG.fields.orderNumber);
          const emailField = task.custom_fields?.find(f => f.id === CLICKUP_CONFIG.fields.emailAddress);
          
          return (orderNumber && orderField?.value === orderNumber) ||
                 (email && emailField?.value === email);
        });

        if (matchingTask) {
          const caseIdField = matchingTask.custom_fields?.find(f => f.id === CLICKUP_CONFIG.fields.caseId);
          return Response.json({ 
            existingCase: true, 
            taskId: matchingTask.id,
            taskUrl: matchingTask.url,
            caseId: caseIdField?.value || null,
            status: matchingTask.status?.status
          }, { headers: corsHeaders });
        }
      }
    } catch (e) {
      console.error(`Error checking list ${listId}:`, e);
    }
  }

  return Response.json({ existingCase: false }, { headers: corsHeaders });
}

// ============================================
// APPEND TO EXISTING CASE
// Adds new info as a comment to an existing ClickUp task
// ============================================
async function handleAppendToCase(request, env, corsHeaders) {
  const { taskId, caseData, additionalInfo, newIntent } = await request.json();

  if (!taskId) {
    return Response.json({ success: false, error: 'No task ID provided' }, { status: 400, headers: corsHeaders });
  }

  try {
    // Build comment with new information
    const now = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
    const formattedResolution = formatResolution(caseData?.resolution, caseData);
    const orderIssue = formatOrderIssue(caseData);

    const commentLines = [
      `📝 **ADDITIONAL INFORMATION ADDED**`,
      `Date: ${now}`,
      ``,
    ];

    if (newIntent) {
      commentLines.push(`**New Issue Type:** ${newIntent}`);
    }
    if (caseData?.resolution) {
      commentLines.push(`**Requested Resolution:** ${formattedResolution}`);
    }
    if (orderIssue) {
      commentLines.push(`**Issue Details:** ${orderIssue}`);
    }
    if (caseData?.intentDetails) {
      commentLines.push(`**Customer Notes:** ${caseData.intentDetails}`);
    }
    if (additionalInfo) {
      commentLines.push(`**Additional Info:** ${additionalInfo}`);
    }
    if (caseData?.selectedItems?.length > 0) {
      commentLines.push(``, `**Items:**`);
      caseData.selectedItems.forEach(item => {
        commentLines.push(`- ${item.title}${item.sku ? ` (${item.sku})` : ''}`);
      });
    }

    commentLines.push(``, `---`, `Session ID: ${caseData?.sessionId || 'N/A'}`);

    const commentText = commentLines.join('\n');

    // Add comment to ClickUp task
    const response = await fetch(`https://api.clickup.com/api/v2/task/${taskId}/comment`, {
      method: 'POST',
      headers: {
        'Authorization': env.CLICKUP_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment_text: commentText }),
    });

    if (!response.ok) {
      console.error('Failed to add comment to ClickUp task');
      return Response.json({ success: false, error: 'Failed to update case' }, { status: 500, headers: corsHeaders });
    }

    // Also update Richpanel if we have a conversation
    // (In a full implementation, we'd look up the Richpanel conversation and add a note)

    return Response.json({
      success: true,
      message: 'Information added to existing case'
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error appending to case:', error);
    return Response.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// ============================================
// AI RESPONSE (AMY / CLAUDIA)
// Supports both legacy PROMPT_PACKS and new AI_SCENARIO_PROMPTS
// ============================================
async function handleAIResponse(request, env, corsHeaders) {
  const body = await request.json();
  const {
    // New scenario-based approach
    scenarioType,
    scenarioData,
    // Legacy approach
    persona,
    context,
    productName,
    customerInput,
    methodsTried,
    intentCategory,
    intentReason,
    orderItems,
  } = body;

  // Get product doc from R2 if needed
  let productDoc = '';
  if (productName || scenarioData?.productName) {
    productDoc = await getProductDoc(env, productName || scenarioData?.productName);
  }

  let systemPrompt, userPrompt, model, temperature, maxTokens;

  // Check if using new scenario-based approach
  if (scenarioType && AI_SCENARIO_PROMPTS[scenarioType]) {
    const scenario = AI_SCENARIO_PROMPTS[scenarioType];
    model = scenario.model;
    temperature = scenario.temperature;
    maxTokens = scenario.maxTokens;

    // Build prompts using scenario builders
    systemPrompt = scenario.buildSystemPrompt(productDoc, orderItems || scenarioData?.orderItems, scenarioData?.context);
    userPrompt = scenario.buildUserPrompt(scenarioData || {});
  } else {
    // Legacy PROMPT_PACKS approach
    const promptPack = getPromptPack(intentCategory, intentReason);
    model = 'gpt-4o-mini';
    temperature = 0.7;
    maxTokens = 500;

    systemPrompt = persona === 'claudia'
      ? buildClaudiaPrompt(productDoc, methodsTried, promptPack)
      : buildAmyPrompt(productDoc, context, promptPack);
    userPrompt = customerInput;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: temperature,
    }),
  });

  if (!response.ok) {
    console.error('AI response failed:', response.status);
    return Response.json({ error: 'AI response failed' }, { status: 500, headers: corsHeaders });
  }

  const data = await response.json();
  const message = data.choices[0]?.message?.content || '';

  // Split into multiple messages if too long
  const messages = splitMessage(message);

  return Response.json({ messages }, { headers: corsHeaders });
}

// ============================================
// PARSE PICKUP LOCATION
// Extracts pickup location name from checkpoints
// Returns last-mile carrier tracking link for full details
// ============================================
async function handleParsePickupLocation(request, env, corsHeaders) {
  const { tracking, carrier, checkpoints, lastMile, shippingAddress } = await request.json();

  // Get data from ParcelPanel
  const lastMileCarrier = lastMile?.carrier_name || null;
  const lastMileTrackingNumber = lastMile?.tracking_number || null;
  const lastMileCarrierUrl = lastMile?.carrier_url || null;

  // Check if main carrier is a China carrier
  const isMainCarrierChina = isChinaCarrier(carrier);
  const displayCarrier = lastMileCarrier || (isMainCarrierChina ? null : carrier);

  // Get recent checkpoints for context
  const recentCheckpoints = (checkpoints || []).slice(0, 6);
  const checkpointContext = recentCheckpoints
    .map(cp => `${cp.checkpoint_time || ''}: ${cp.message || cp.detail || ''} ${cp.location ? `(${cp.location})` : ''}`)
    .join('\n');

  let pickupLocationName = null;

  try {
    // Extract pickup location NAME from checkpoints (e.g., "daoSHOP", "Post Office")
    const extractResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Extract ONLY the pickup location name from these tracking checkpoints.

TRACKING CHECKPOINTS:
${checkpointContext || 'No checkpoints'}

Look for the location name in phrases like:
- "Held at [LOCATION]"
- "Ready for pickup at [LOCATION]"
- "Available at [LOCATION]"
- "Awaiting collection at [LOCATION]"

Return ONLY the location name (e.g., "Post Office", "daoSHOP", "FedEx Office").
If no location found, return "pickup location".`
        }],
        max_tokens: 50,
        temperature: 0.1,
      }),
    });

    if (extractResponse.ok) {
      const data = await extractResponse.json();
      const content = data.choices?.[0]?.message?.content?.trim() || '';
      if (content && content.toLowerCase() !== 'null' && content.length < 100) {
        pickupLocationName = content.replace(/^["']|["']$/g, ''); // Remove quotes if present
      }
    }
  } catch (error) {
    console.error('Pickup location extraction error:', error.message);
  }

  return Response.json({
    success: true,
    pickupLocationName: pickupLocationName,
    lastMileCarrier: lastMileCarrier,
    lastMileTrackingNumber: lastMileTrackingNumber,
    lastMileCarrierUrl: lastMileCarrierUrl,
    displayCarrier: displayCarrier,
    isMainCarrierChina,
  }, { headers: corsHeaders });
}

// Gets the appropriate prompt pack for the given intent
function getPromptPack(category, reason) {
  if (!category) return null;

  const categoryPack = PROMPT_PACKS[category];
  if (!categoryPack) return PROMPT_PACKS.general.default;

  const reasonPack = categoryPack[reason];
  if (!reasonPack) {
    // If no specific reason, use the first one in the category as fallback
    const firstReason = Object.keys(categoryPack)[0];
    return categoryPack[firstReason] || PROMPT_PACKS.general.default;
  }

  return reasonPack;
}

async function getProductDoc(env, productName) {
  // Uses PRODUCT_DOC_MAP from config at top of file
  const lowerName = productName.toLowerCase();
  let filename = null;

  for (const [key, value] of Object.entries(PRODUCT_DOC_MAP)) {
    if (lowerName.includes(key)) {
      filename = value;
      break;
    }
  }

  if (!filename) return '';

  try {
    const file = await env.PRODUCT_DOCS.get(filename);
    if (file) {
      return await file.text();
    }
  } catch (e) {
    console.error('Error fetching product doc:', e);
  }

  return '';
}

// Builds prompt from PERSONA_PROMPTS config + intent-specific prompt pack
function buildAmyPrompt(productDoc, context, promptPack = null) {
  const persona = PERSONA_PROMPTS.amy;

  // Build intent-specific section if prompt pack provided
  let intentSection = '';
  if (promptPack) {
    intentSection = `
SITUATION CONTEXT:
${promptPack.context}

YOUR APPROACH FOR THIS SITUATION:
${promptPack.instruction}

HANDLING PUSHBACK:
${promptPack.objectionHandling}
`;
  }

  return `You are ${persona.name} from PuppyPad ${persona.role}. You are warm, caring, and helpful.

Your characteristics:
${persona.characteristics.map(c => '- ' + c).join('\n')}

Product knowledge:
${productDoc}

Context: ${context || 'General customer support'}
${intentSection}
${persona.instruction}`;
}

// Builds prompt from PERSONA_PROMPTS config + intent-specific prompt pack
function buildClaudiaPrompt(productDoc, methodsTried, promptPack = null) {
  const persona = PERSONA_PROMPTS.claudia;

  // Build intent-specific section if prompt pack provided
  let intentSection = '';
  if (promptPack) {
    intentSection = `
SITUATION CONTEXT:
${promptPack.context}

YOUR APPROACH FOR THIS SITUATION:
${promptPack.instruction}

HANDLING PUSHBACK:
${promptPack.objectionHandling}
`;
  }

  return `You are ${persona.name}, an ${persona.role} at PuppyPad. You specialize in helping customers train their dogs to use PuppyPad products.

Your characteristics:
${persona.characteristics.map(c => '- ' + c).join('\n')}

Product knowledge:
${productDoc}

Methods the customer has already tried (DO NOT suggest these again):
${methodsTried || 'None specified'}
${intentSection}
${persona.instruction}`;
}

function splitMessage(message) {
  // Don't split HTML content - keep as single message
  if (message.includes('<p>') || message.includes('<ul>') || message.includes('<li>')) {
    // Clean up any markdown code block wrappers GPT might add
    let cleaned = message.replace(/^```html\s*/i, '').replace(/```\s*$/i, '').trim();
    return [cleaned];
  }

  // If message is short, return as single message
  if (message.length < 500) return [message];

  // Split into 2 messages at a natural break point
  const midPoint = Math.floor(message.length / 2);
  let splitIndex = message.lastIndexOf('. ', midPoint + 50);

  if (splitIndex === -1 || splitIndex < midPoint - 100) {
    splitIndex = message.indexOf('. ', midPoint);
  }

  if (splitIndex === -1) return [message];

  return [
    message.substring(0, splitIndex + 1).trim(),
    message.substring(splitIndex + 1).trim(),
  ];
}

// ============================================
// UPLOAD EVIDENCE
// ============================================
async function handleUploadEvidence(request, env, corsHeaders) {
  const formData = await request.formData();
  const file = formData.get('file');
  const caseId = formData.get('caseId') || 'temp';

  if (!file) {
    return Response.json({ error: 'No file provided' }, { status: 400, headers: corsHeaders });
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    return Response.json({ error: 'Please upload a JPG or PNG image' }, { status: 400, headers: corsHeaders });
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return Response.json({ error: 'File too large. Please upload an image under 5MB.' }, { status: 400, headers: corsHeaders });
  }

  const filename = `${caseId}/${Date.now()}-${file.name}`;
  
  await env.EVIDENCE_UPLOADS.put(filename, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  return Response.json({ 
    success: true, 
    filename,
    url: `/evidence/${filename}`,
  }, { headers: corsHeaders });
}

// ============================================
// SERVE AUDIO FILES
// ============================================
async function handleAudio(pathname, env, corsHeaders) {
  const rawFilename = pathname.replace('/audio/', '');
  const filename = decodeURIComponent(rawFilename);
  
  const file = await env.PRODUCT_DOCS.get(filename);
  
  if (!file) {
    return Response.json({ error: 'Audio not found' }, { status: 404, headers: corsHeaders });
  }

  return new Response(file.body, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'audio/mpeg',
      'Content-Length': file.size,
    },
  });
}

// ============================================
// ANALYTICS API HANDLERS
// ============================================

// Log event
async function handleLogEvent(request, env, corsHeaders) {
  try {
    const { sessionId, eventType, eventName, eventData } = await request.json();

    await env.ANALYTICS_DB.prepare(`
      INSERT INTO events (session_id, event_type, event_name, event_data)
      VALUES (?, ?, ?, ?)
    `).bind(
      sessionId,
      eventType,
      eventName,
      JSON.stringify(eventData || {})
    ).run();

    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (e) {
    console.error('Event logging failed:', e);
    return Response.json({ success: false, error: e.message }, { headers: corsHeaders });
  }
}

// Log or update session
async function handleLogSession(request, env, corsHeaders) {
  try {
    const { sessionId, flowType, customerEmail, orderNumber, persona, deviceType, completed, ended } = await request.json();

    if (ended) {
      // Update existing session
      await env.ANALYTICS_DB.prepare(`
        UPDATE sessions SET ended_at = CURRENT_TIMESTAMP, completed = ?, flow_type = COALESCE(?, flow_type)
        WHERE session_id = ?
      `).bind(completed ? 1 : 0, flowType, sessionId).run();
    } else {
      // Insert new session
      await env.ANALYTICS_DB.prepare(`
        INSERT OR REPLACE INTO sessions (session_id, flow_type, customer_email, order_number, persona, device_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(sessionId, flowType, customerEmail, orderNumber, persona, deviceType).run();
    }

    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (e) {
    console.error('Session logging failed:', e);
    return Response.json({ success: false, error: e.message }, { headers: corsHeaders });
  }
}

// Log survey response
async function handleLogSurvey(request, env, corsHeaders) {
  try {
    const { sessionId, caseId, rating } = await request.json();

    await env.ANALYTICS_DB.prepare(`
      INSERT INTO survey_responses (session_id, case_id, rating)
      VALUES (?, ?, ?)
    `).bind(sessionId, caseId, rating).run();

    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (e) {
    console.error('Survey logging failed:', e);
    return Response.json({ success: false, error: e.message }, { headers: corsHeaders });
  }
}

// Log policy block
async function handleLogPolicyBlock(request, env, corsHeaders) {
  try {
    const { sessionId, blockType, orderNumber, daysSince } = await request.json();

    await env.ANALYTICS_DB.prepare(`
      INSERT INTO policy_blocks (session_id, block_type, order_number, days_since)
      VALUES (?, ?, ?, ?)
    `).bind(sessionId, blockType, orderNumber, daysSince).run();

    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (e) {
    console.error('Policy block logging failed:', e);
    return Response.json({ success: false, error: e.message }, { headers: corsHeaders });
  }
}

// Log case creation (called from handleCreateCase)
async function logCaseToAnalytics(env, caseData) {
  try {
    await env.ANALYTICS_DB.prepare(`
      INSERT INTO cases (case_id, session_id, case_type, resolution, order_number, customer_email, customer_name, refund_amount, selected_items, clickup_task_id, clickup_task_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      caseData.caseId,
      caseData.sessionId,
      caseData.caseType,
      caseData.resolution,
      caseData.orderNumber,
      caseData.email,
      caseData.customerName,
      caseData.refundAmount || null,
      JSON.stringify(caseData.selectedItems || []),
      caseData.clickupTaskId,
      caseData.clickupTaskUrl
    ).run();
  } catch (e) {
    console.error('Case analytics logging failed:', e);
  }
}

// ============================================
// ADMIN AUTHENTICATION
// ============================================
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + ADMIN_CONFIG.tokenSecret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateToken(username) {
  const payload = {
    username,
    exp: Date.now() + (ADMIN_CONFIG.tokenExpiryHours * 60 * 60 * 1000)
  };
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload) + ADMIN_CONFIG.tokenSecret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return btoa(JSON.stringify(payload)) + '.' + signature;
}

async function verifyToken(token) {
  try {
    const [payloadB64, signature] = token.split('.');
    const payload = JSON.parse(atob(payloadB64));

    if (payload.exp < Date.now()) {
      return null; // Token expired
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload) + ADMIN_CONFIG.tokenSecret);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (signature === expectedSignature) {
      return payload;
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function handleAdminLogin(request, env, corsHeaders) {
  try {
    const { username, password } = await request.json();

    const passwordHash = await hashPassword(password);

    const user = await env.ANALYTICS_DB.prepare(`
      SELECT * FROM admin_users WHERE username = ? AND password_hash = ?
    `).bind(username, passwordHash).first();

    if (!user) {
      return Response.json({ success: false, error: 'Invalid credentials' }, { status: 401, headers: corsHeaders });
    }

    // Update last login
    await env.ANALYTICS_DB.prepare(`
      UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(user.id).run();

    const token = await generateToken(username);

    return Response.json({
      success: true,
      token,
      user: { username: user.username, name: user.name, role: user.role }
    }, { headers: corsHeaders });
  } catch (e) {
    console.error('Login error:', e);
    return Response.json({ success: false, error: 'Login failed' }, { status: 500, headers: corsHeaders });
  }
}

// Admin setup - creates or updates admin user (one-time setup)
async function handleAdminSetup(request, env, corsHeaders) {
  try {
    const { username, password, setupKey } = await request.json();

    // Simple setup key protection (configured in ADMIN_CONFIG at top of file)
    if (setupKey !== ADMIN_CONFIG.setupKey) {
      return Response.json({ error: 'Invalid setup key' }, { status: 403, headers: corsHeaders });
    }

    if (!username || !password) {
      return Response.json({ error: 'Username and password required' }, { status: 400, headers: corsHeaders });
    }

    const passwordHash = await hashPassword(password);

    // Insert or replace admin user
    await env.ANALYTICS_DB.prepare(`
      INSERT OR REPLACE INTO admin_users (username, password_hash, name, role)
      VALUES (?, ?, 'Administrator', 'admin')
    `).bind(username, passwordHash).run();

    return Response.json({
      success: true,
      message: `Admin user '${username}' created successfully. You can now login at /admin`
    }, { headers: corsHeaders });
  } catch (e) {
    console.error('Admin setup error:', e);
    return Response.json({ error: 'Setup failed: ' + e.message }, { status: 500, headers: corsHeaders });
  }
}

// ============================================
// ADMIN DASHBOARD DATA
// ============================================
async function handleDashboardData(request, env, corsHeaders) {
  // Verify authentication
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token);
  if (!payload) {
    return Response.json({ error: 'Invalid or expired token' }, { status: 401, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const range = url.searchParams.get('range') || '7d';

  // Calculate date range
  let daysAgo = 7;
  if (range === '30d') daysAgo = 30;
  else if (range === '90d') daysAgo = 90;
  else if (range === 'year') daysAgo = 365;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);
  const startDateStr = startDate.toISOString().split('T')[0];

  try {
    // Total sessions
    const sessionsResult = await env.ANALYTICS_DB.prepare(`
      SELECT COUNT(*) as total FROM sessions WHERE started_at >= ?
    `).bind(startDateStr).first();

    // Completed sessions (resolved in-app)
    const completedResult = await env.ANALYTICS_DB.prepare(`
      SELECT COUNT(*) as total FROM sessions WHERE started_at >= ? AND completed = 1
    `).bind(startDateStr).first();

    // Total cases created
    const casesResult = await env.ANALYTICS_DB.prepare(`
      SELECT COUNT(*) as total FROM cases WHERE created_at >= ?
    `).bind(startDateStr).first();

    // Cases by type
    const casesByType = await env.ANALYTICS_DB.prepare(`
      SELECT case_type, COUNT(*) as count FROM cases WHERE created_at >= ? GROUP BY case_type
    `).bind(startDateStr).all();

    // Total refund amount
    const refundsResult = await env.ANALYTICS_DB.prepare(`
      SELECT SUM(refund_amount) as total FROM cases WHERE created_at >= ? AND refund_amount IS NOT NULL
    `).bind(startDateStr).first();

    // Average survey rating
    const surveyResult = await env.ANALYTICS_DB.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM survey_responses WHERE created_at >= ?
    `).bind(startDateStr).first();

    // Policy blocks
    const blocksResult = await env.ANALYTICS_DB.prepare(`
      SELECT block_type, COUNT(*) as count FROM policy_blocks WHERE created_at >= ? GROUP BY block_type
    `).bind(startDateStr).all();

    // Recent cases
    const recentCases = await env.ANALYTICS_DB.prepare(`
      SELECT * FROM cases ORDER BY created_at DESC LIMIT 10
    `).all();

    // Daily sessions for chart
    const dailySessions = await env.ANALYTICS_DB.prepare(`
      SELECT DATE(started_at) as date, COUNT(*) as count
      FROM sessions WHERE started_at >= ?
      GROUP BY DATE(started_at) ORDER BY date
    `).bind(startDateStr).all();

    const totalSessions = sessionsResult?.total || 0;
    const completedSessions = completedResult?.total || 0;
    const resolutionRate = totalSessions > 0 ? ((completedSessions / totalSessions) * 100).toFixed(1) : 0;

    return Response.json({
      summary: {
        totalSessions,
        completedSessions,
        resolutionRate,
        totalCases: casesResult?.total || 0,
        totalRefunds: refundsResult?.total || 0,
        avgRating: surveyResult?.avg_rating ? surveyResult.avg_rating.toFixed(1) : 'N/A',
        surveyResponses: surveyResult?.total || 0
      },
      casesByType: casesByType?.results || [],
      policyBlocks: blocksResult?.results || [],
      recentCases: recentCases?.results || [],
      dailySessions: dailySessions?.results || [],
      dateRange: { start: startDateStr, end: new Date().toISOString().split('T')[0], days: daysAgo }
    }, { headers: corsHeaders });
  } catch (e) {
    console.error('Dashboard data error:', e);
    return Response.json({ error: 'Failed to load dashboard data' }, { status: 500, headers: corsHeaders });
  }
}

// Get cases list with pagination
async function handleCasesList(request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token);
  if (!payload) {
    return Response.json({ error: 'Invalid or expired token' }, { status: 401, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  try {
    const cases = await env.ANALYTICS_DB.prepare(`
      SELECT * FROM cases ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    const countResult = await env.ANALYTICS_DB.prepare(`
      SELECT COUNT(*) as total FROM cases
    `).first();

    return Response.json({
      cases: cases?.results || [],
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit)
      }
    }, { headers: corsHeaders });
  } catch (e) {
    console.error('Cases list error:', e);
    return Response.json({ error: 'Failed to load cases' }, { status: 500, headers: corsHeaders });
  }
}

// Get events log
async function handleEventsList(request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token);
  if (!payload) {
    return Response.json({ error: 'Invalid or expired token' }, { status: 401, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;

  try {
    const events = await env.ANALYTICS_DB.prepare(`
      SELECT * FROM events ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    const countResult = await env.ANALYTICS_DB.prepare(`
      SELECT COUNT(*) as total FROM events
    `).first();

    return Response.json({
      events: events?.results || [],
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit)
      }
    }, { headers: corsHeaders });
  } catch (e) {
    console.error('Events list error:', e);
    return Response.json({ error: 'Failed to load events' }, { status: 500, headers: corsHeaders });
  }
}

// ============================================
// SERVE DASHBOARD HTML
// ============================================
async function serveDashboard(env, corsHeaders) {
  const html = getDashboardHTML();
  return new Response(html, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
}

function getDashboardHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PuppyPad Resolution - Admin Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --brand-navy: #0A1628;
      --brand-navy-light: #1E3A5F;
      --accent-coral: #FF6B6B;
      --accent-teal: #4ECDC4;
      --gray-50: #F9FAFB;
      --gray-100: #F3F4F6;
      --gray-200: #E5E7EB;
      --gray-300: #D1D5DB;
      --gray-500: #6B7280;
      --gray-600: #4B5563;
      --gray-700: #374151;
      --gray-900: #111827;
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', sans-serif;
      background: var(--gray-100);
      min-height: 100vh;
    }

    /* Login Screen */
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .login-card {
      background: white;
      border-radius: 24px;
      padding: 48px;
      width: 100%;
      max-width: 400px;
      box-shadow: var(--shadow-lg);
    }

    .login-logo {
      text-align: center;
      margin-bottom: 32px;
    }

    .login-logo img {
      height: 40px;
    }

    .login-title {
      font-family: 'Poppins', sans-serif;
      font-size: 24px;
      font-weight: 700;
      color: var(--gray-900);
      text-align: center;
      margin-bottom: 8px;
    }

    .login-subtitle {
      color: var(--gray-500);
      text-align: center;
      margin-bottom: 32px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: var(--gray-700);
      margin-bottom: 8px;
    }

    .form-group input {
      width: 100%;
      padding: 14px 16px;
      border: 1px solid var(--gray-200);
      border-radius: 12px;
      font-size: 15px;
      transition: border-color 0.2s;
    }

    .form-group input:focus {
      outline: none;
      border-color: var(--brand-navy);
    }

    .login-btn {
      width: 100%;
      padding: 16px;
      background: var(--brand-navy);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .login-btn:hover {
      background: var(--brand-navy-light);
      transform: translateY(-1px);
    }

    .login-error {
      color: var(--accent-coral);
      text-align: center;
      margin-bottom: 16px;
      display: none;
    }

    /* Dashboard Layout */
    .dashboard-container {
      display: none;
      min-height: 100vh;
    }

    .dashboard-container.active {
      display: block;
    }

    .dashboard-header {
      background: white;
      padding: 20px 32px;
      border-bottom: 1px solid var(--gray-200);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-left h1 {
      font-family: 'Poppins', sans-serif;
      font-size: 24px;
      color: var(--gray-900);
    }

    .header-left p {
      color: var(--gray-500);
      font-size: 14px;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .date-select {
      padding: 10px 16px;
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
    }

    .logout-btn {
      padding: 10px 20px;
      background: var(--gray-100);
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: var(--gray-700);
      cursor: pointer;
    }

    .dashboard-content {
      padding: 32px;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .metric-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: var(--shadow-md);
    }

    .metric-card.highlight {
      background: linear-gradient(135deg, var(--accent-teal) 0%, #38B2AC 100%);
      color: white;
    }

    .metric-label {
      font-size: 14px;
      color: var(--gray-500);
      margin-bottom: 8px;
    }

    .metric-card.highlight .metric-label {
      color: rgba(255,255,255,0.8);
    }

    .metric-value {
      font-family: 'Poppins', sans-serif;
      font-size: 36px;
      font-weight: 700;
      color: var(--gray-900);
    }

    .metric-card.highlight .metric-value {
      color: white;
    }

    .metric-sub {
      font-size: 13px;
      color: var(--gray-500);
      margin-top: 4px;
    }

    .metric-card.highlight .metric-sub {
      color: rgba(255,255,255,0.7);
    }

    /* Tables */
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: var(--shadow-md);
      margin-bottom: 24px;
      overflow: hidden;
    }

    .card-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--gray-100);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-title {
      font-family: 'Poppins', sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: var(--gray-900);
    }

    .table-container {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      padding: 14px 20px;
      text-align: left;
      border-bottom: 1px solid var(--gray-100);
    }

    th {
      background: var(--gray-50);
      font-weight: 600;
      color: var(--gray-600);
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    td {
      font-size: 14px;
      color: var(--gray-700);
    }

    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .badge-refund { background: #FEE2E2; color: #DC2626; }
    .badge-shipping { background: #DBEAFE; color: #2563EB; }
    .badge-subscription { background: #D1FAE5; color: #059669; }
    .badge-return { background: #FEF3C7; color: #D97706; }
    .badge-manual { background: #E5E7EB; color: #374151; }

    .loading {
      text-align: center;
      padding: 40px;
      color: var(--gray-500);
    }

    .pagination {
      display: flex;
      justify-content: center;
      gap: 8px;
      padding: 20px;
    }

    .pagination button {
      padding: 8px 16px;
      border: 1px solid var(--gray-200);
      background: white;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    }

    .pagination button:hover {
      background: var(--gray-50);
    }

    .pagination button.active {
      background: var(--brand-navy);
      color: white;
      border-color: var(--brand-navy);
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
    }

    .tab {
      padding: 12px 24px;
      background: white;
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: var(--gray-600);
      cursor: pointer;
    }

    .tab.active {
      background: var(--brand-navy);
      color: white;
      border-color: var(--brand-navy);
    }

    @media (max-width: 768px) {
      .dashboard-header {
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
      }

      .dashboard-content {
        padding: 16px;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <!-- Login Screen -->
  <div class="login-container" id="loginScreen">
    <div class="login-card">
      <div class="login-logo">
        <img src="https://cdn.shopify.com/s/files/1/0433/0510/7612/files/navyblue-logo.svg?v=1754231041" alt="PuppyPad">
      </div>
      <h2 class="login-title">Admin Dashboard</h2>
      <p class="login-subtitle">Sign in to view analytics</p>
      <div class="login-error" id="loginError">Invalid username or password</div>
      <form id="loginForm">
        <div class="form-group">
          <label>Username</label>
          <input type="text" id="username" required autocomplete="username">
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="password" required autocomplete="current-password">
        </div>
        <button type="submit" class="login-btn">Sign In</button>
      </form>
    </div>
  </div>

  <!-- Dashboard -->
  <div class="dashboard-container" id="dashboardScreen">
    <header class="dashboard-header">
      <div class="header-left">
        <h1>Analytics Dashboard</h1>
        <p>PuppyPad Resolution App Performance</p>
      </div>
      <div class="header-right">
        <select class="date-select" id="dateRange">
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="year">This Year</option>
        </select>
        <button class="logout-btn" onclick="logout()">Logout</button>
      </div>
    </header>

    <div class="dashboard-content">
      <!-- Metrics -->
      <div class="metrics-grid" id="metricsGrid">
        <div class="loading">Loading metrics...</div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab active" data-tab="cases">Recent Cases</button>
        <button class="tab" data-tab="events">Event Log</button>
      </div>

      <!-- Cases Table -->
      <div class="card" id="casesCard">
        <div class="card-header">
          <h3 class="card-title">Customer Submissions</h3>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Type</th>
                <th>Customer</th>
                <th>Order</th>
                <th>Resolution</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody id="casesTableBody">
              <tr><td colspan="6" class="loading">Loading...</td></tr>
            </tbody>
          </table>
        </div>
        <div class="pagination" id="casesPagination"></div>
      </div>

      <!-- Events Table -->
      <div class="card" id="eventsCard" style="display: none;">
        <div class="card-header">
          <h3 class="card-title">Event Log</h3>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Session</th>
                <th>Event Type</th>
                <th>Event Name</th>
                <th>Data</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody id="eventsTableBody">
              <tr><td colspan="5" class="loading">Loading...</td></tr>
            </tbody>
          </table>
        </div>
        <div class="pagination" id="eventsPagination"></div>
      </div>
    </div>
  </div>

  <script>
    const API_BASE = '';
    let authToken = localStorage.getItem('adminToken');
    let currentCasesPage = 1;
    let currentEventsPage = 1;

    // Check if already logged in
    if (authToken) {
      showDashboard();
    }

    // Login form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      try {
        const response = await fetch(API_BASE + '/admin/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
          authToken = data.token;
          localStorage.setItem('adminToken', authToken);
          showDashboard();
        } else {
          document.getElementById('loginError').style.display = 'block';
        }
      } catch (err) {
        document.getElementById('loginError').style.display = 'block';
      }
    });

    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const tabName = tab.dataset.tab;
        document.getElementById('casesCard').style.display = tabName === 'cases' ? 'block' : 'none';
        document.getElementById('eventsCard').style.display = tabName === 'events' ? 'block' : 'none';
      });
    });

    // Date range change
    document.getElementById('dateRange').addEventListener('change', loadDashboardData);

    function showDashboard() {
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('dashboardScreen').classList.add('active');
      loadDashboardData();
      loadCases();
      loadEvents();
    }

    function logout() {
      localStorage.removeItem('adminToken');
      authToken = null;
      document.getElementById('loginScreen').style.display = 'flex';
      document.getElementById('dashboardScreen').classList.remove('active');
    }

    async function loadDashboardData() {
      const range = document.getElementById('dateRange').value;

      try {
        const response = await fetch(API_BASE + '/admin/api/dashboard?range=' + range, {
          headers: { 'Authorization': 'Bearer ' + authToken }
        });

        if (response.status === 401) {
          logout();
          return;
        }

        const data = await response.json();
        renderMetrics(data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      }
    }

    function renderMetrics(data) {
      const s = data.summary;
      document.getElementById('metricsGrid').innerHTML = \`
        <div class="metric-card">
          <div class="metric-label">Total Sessions</div>
          <div class="metric-value">\${s.totalSessions.toLocaleString()}</div>
          <div class="metric-sub">In selected period</div>
        </div>
        <div class="metric-card highlight">
          <div class="metric-label">Resolution Rate</div>
          <div class="metric-value">\${s.resolutionRate}%</div>
          <div class="metric-sub">\${s.completedSessions} resolved in-app</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Cases Created</div>
          <div class="metric-value">\${s.totalCases.toLocaleString()}</div>
          <div class="metric-sub">Across all types</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Refunds</div>
          <div class="metric-value">$\${(s.totalRefunds || 0).toLocaleString()}</div>
          <div class="metric-sub">Processed amount</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Avg Rating</div>
          <div class="metric-value">\${s.avgRating}/5</div>
          <div class="metric-sub">\${s.surveyResponses} responses</div>
        </div>
      \`;
    }

    async function loadCases(page = 1) {
      currentCasesPage = page;

      try {
        const response = await fetch(API_BASE + '/admin/api/cases?page=' + page, {
          headers: { 'Authorization': 'Bearer ' + authToken }
        });

        if (response.status === 401) {
          logout();
          return;
        }

        const data = await response.json();
        renderCases(data);
      } catch (err) {
        console.error('Failed to load cases:', err);
      }
    }

    function renderCases(data) {
      const tbody = document.getElementById('casesTableBody');

      if (!data.cases || data.cases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No cases found</td></tr>';
        return;
      }

      tbody.innerHTML = data.cases.map(c => \`
        <tr>
          <td><strong>\${c.case_id}</strong></td>
          <td><span class="badge badge-\${c.case_type}">\${c.case_type}</span></td>
          <td>\${c.customer_email || c.customer_name || 'N/A'}</td>
          <td>\${c.order_number || 'N/A'}</td>
          <td>\${c.resolution || 'N/A'}</td>
          <td>\${new Date(c.created_at).toLocaleString()}</td>
        </tr>
      \`).join('');

      renderPagination('casesPagination', data.pagination, loadCases);
    }

    async function loadEvents(page = 1) {
      currentEventsPage = page;

      try {
        const response = await fetch(API_BASE + '/admin/api/events?page=' + page, {
          headers: { 'Authorization': 'Bearer ' + authToken }
        });

        if (response.status === 401) {
          logout();
          return;
        }

        const data = await response.json();
        renderEvents(data);
      } catch (err) {
        console.error('Failed to load events:', err);
      }
    }

    function renderEvents(data) {
      const tbody = document.getElementById('eventsTableBody');

      if (!data.events || data.events.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">No events found</td></tr>';
        return;
      }

      tbody.innerHTML = data.events.map(e => \`
        <tr>
          <td><code>\${e.session_id?.substring(0, 8)}...</code></td>
          <td>\${e.event_type}</td>
          <td>\${e.event_name}</td>
          <td><code>\${e.event_data?.substring(0, 50) || '{}'}</code></td>
          <td>\${new Date(e.created_at).toLocaleString()}</td>
        </tr>
      \`).join('');

      renderPagination('eventsPagination', data.pagination, loadEvents);
    }

    function renderPagination(containerId, pagination, loadFn) {
      const container = document.getElementById(containerId);
      if (pagination.totalPages <= 1) {
        container.innerHTML = '';
        return;
      }

      let html = '';
      for (let i = 1; i <= Math.min(pagination.totalPages, 10); i++) {
        html += \`<button class="\${i === pagination.page ? 'active' : ''}" onclick="\${loadFn.name}(\${i})">\${i}</button>\`;
      }
      container.innerHTML = html;
    }
  </script>
</body>
</html>`;
}
