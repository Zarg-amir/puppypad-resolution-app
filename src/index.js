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
  },

  // Product benefits pitch - for "charged unexpectedly" / don't recognize order
  product_benefits_pitch: {
    model: 'gpt-4o-mini',
    temperature: 0.75,
    maxTokens: 600,
    buildSystemPrompt: (productDoc, orderItems) => `You are Amy, a warm and knowledgeable customer support specialist for PuppyPad.

A customer doesn't recognize a charge on their account. You've already explained that it was likely ordered by someone in their household or as a gift. Now your job is to EXCITE them about the products they received!

=== YOUR GOAL ===
Make them WANT to keep the products by highlighting the genuine benefits. Focus on problem-solution messaging - what problems do these products solve for pet owners?

=== APPROACH ===
1. Mention the SPECIFIC products from their order by name
2. For each product, explain ONE key benefit using problem-solution framing
3. Share a quick "customers love this because..." moment
4. Make it feel like a happy accident - they got something great!
5. Keep it genuine - don't oversell or be pushy

=== PROBLEM-SOLUTION EXAMPLES ===
- PuppyPad: "Tired of buying disposables every week? This reusable pad lasts years and saves hundreds!"
- BusyPet: "Does your pup get bored and destructive? This keeps them mentally stimulated for hours!"
- CalmBuddy: "Anxious during storms or fireworks? The pheromone diffuser helps dogs relax naturally."
- CozyBed: "Older dogs with joint pain? The orthopedic design supports their joints perfectly."

=== TONE & STYLE ===
- Warm, enthusiastic but genuine
- SHORT paragraphs (2-3 sentences max)
- Use ellipses (...) for pauses, NEVER em-dashes
- This is a CHAT message, NOT an email
- Make it feel like discovering something great, not a sales pitch
- NEVER sign off with "Warm regards", "Best", etc.

=== PRODUCT DOCUMENTATION ===
${productDoc || 'Premium pet products designed to solve real problems for pet parents.'}

=== PRODUCTS IN THIS ORDER ===
${orderItems || 'PuppyPad products'}

Write 2-3 short, enthusiastic paragraphs about the products.`,
    buildUserPrompt: (data) => `Customer name: ${data.customerName || 'there'}
Products in their order: ${data.products || 'PuppyPad products'}
Order total: ${data.orderTotal || 'their order'}

Get them excited about what they received! Focus on genuine benefits and problem-solution messaging. Be warm and enthusiastic but not pushy.`
  },

  // Quality difference - customer noticed material difference
  quality_difference: {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 600,
    buildSystemPrompt: (productDoc) => `You are Amy, a warm and knowledgeable customer support specialist for PuppyPad.

A customer has noticed a quality/material difference in their PuppyPad order. This is because we've been transitioning from Original (5-layer) to Enhanced (6-layer) materials.

=== KEY INFORMATION ===
We have TWO versions of PuppyPad:

ORIGINAL (5-layer):
- 270gsm absorber
- Standard waterproof backing
- Anti-slip coating
- Standard stitching
- Retail price: ~$50/pad

ENHANCED (6-layer):
- 300gsm absorber (+30% more absorbent)
- Comfort cushion layer (NEW)
- Medical-grade TPU waterproof backing
- Rubber paw-shaped grip dots
- Reinforced edge binding
- Retail price: ~$70/pad

During transition, some orders ship with Original, some with Enhanced - depending on warehouse stock. Everyone pays Original pricing regardless of which version ships.

=== WHAT STAYS THE SAME ===
Both versions have:
✓ Pheromone technology
✓ 100% leak-proof protection
✓ Machine washable 300+ times
✓ Full 90-day guarantee

=== TONE & STYLE ===
- Warm, friendly, reassuring
- Make them feel like they got a good deal either way
- Don't be defensive about the difference
- Use ellipses (...) for pauses, NEVER em-dashes
- This is a CHAT message, NOT an email
- NEVER sign off with "Warm regards", "Best", etc.

=== PRODUCT INFO ===
${productDoc || 'PuppyPad premium reusable dog pee pads'}`,
    buildUserPrompt: (data) => `Customer name: ${data.customerName || 'there'}
Their concern: "${data.customerMessage || 'noticed different materials'}"
What version they received: ${data.versionReceived || 'Unknown'}

Explain the quality difference in a positive way. Make them feel good about their purchase.`
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
  manual: 'https://docs.puppypad.com/sop/manual-assistance',
  quality_difference: 'https://docs.puppypad.com/sop/quality-difference',
  trouble_report: 'https://docs.puppypad.com/sop/trouble-reports'
};

// Database migrations - add missing columns
let migrationsRun = false;
async function runMigrations(env) {
  if (migrationsRun || !env.ANALYTICS_DB) return;
  migrationsRun = true;

  const migrations = [
    'ALTER TABLE cases ADD COLUMN extra_data TEXT',
    'ALTER TABLE cases ADD COLUMN issue_type TEXT',
  ];

  for (const sql of migrations) {
    try {
      await env.ANALYTICS_DB.prepare(sql).run();
      console.log('Migration success:', sql.substring(0, 50));
    } catch (e) {
      // Column likely already exists - ignore
      if (!e.message.includes('duplicate column')) {
        console.log('Migration skipped:', e.message.substring(0, 50));
      }
    }
  }
}

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

    // Run database migrations (adds missing columns)
    await runMigrations(env);

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
      // DATA COLLECTION ENDPOINTS (renamed from analytics to avoid ad blockers)
      // ============================================

      // Log event
      if ((pathname === '/api/a/event' || pathname === '/api/analytics/event') && request.method === 'POST') {
        return await handleLogEvent(request, env, corsHeaders);
      }

      // Log session
      if ((pathname === '/api/a/session' || pathname === '/api/analytics/session') && request.method === 'POST') {
        return await handleLogSession(request, env, corsHeaders);
      }

      // Log survey response
      if ((pathname === '/api/a/survey' || pathname === '/api/analytics/survey') && request.method === 'POST') {
        return await handleLogSurvey(request, env, corsHeaders);
      }

      // Log policy block
      if ((pathname === '/api/a/policy-block' || pathname === '/api/analytics/policy-block') && request.method === 'POST') {
        return await handleLogPolicyBlock(request, env, corsHeaders);
      }

      // Trouble report submission (for users having issues with the app)
      if (pathname === '/api/trouble-report' && request.method === 'POST') {
        return await handleTroubleReport(request, env, corsHeaders);
      }

      // ============================================
      // ADMIN DASHBOARD ENDPOINTS
      // ============================================

      // Admin login
      if (pathname === '/admin/api/login' && request.method === 'POST') {
        return await handleAdminLogin(request, env, corsHeaders);
      }

      // Admin setup (one-time password reset)
      if (pathname === '/admin/api/setup' && request.method === 'POST') {
        return await handleAdminSetup(request, env, corsHeaders);
      }

      // ============================================
      // USER MANAGEMENT ENDPOINTS
      // ============================================

      // List users (Admin only)
      if (pathname === '/hub/api/users' && request.method === 'GET') {
        return await handleListUsers(request, env, corsHeaders);
      }

      // Create user (Admin only)
      if (pathname === '/hub/api/users' && request.method === 'POST') {
        return await handleCreateUser(request, env, corsHeaders);
      }

      // Update user (Admin only)
      if (pathname === '/hub/api/users' && request.method === 'PUT') {
        return await handleUpdateUser(request, env, corsHeaders);
      }

      // Delete user (Admin only)
      if (pathname.match(/^\/hub\/api\/users\/\d+$/) && request.method === 'DELETE') {
        return await handleDeleteUser(request, env, corsHeaders);
      }

      // Get current user profile
      if (pathname === '/hub/api/profile' && request.method === 'GET') {
        return await handleGetProfile(request, env, corsHeaders);
      }

      // Change password
      if (pathname === '/hub/api/change-password' && request.method === 'POST') {
        return await handleChangePassword(request, env, corsHeaders);
      }

      // Audit log (Admin only)
      if (pathname === '/hub/api/audit-log' && request.method === 'GET') {
        return await handleGetAuditLog(request, env, corsHeaders);
      }

      // ============================================
      // BULK ACTIONS ENDPOINTS
      // ============================================

      // Bulk update status
      if (pathname === '/hub/api/bulk/status' && request.method === 'POST') {
        return await handleBulkUpdateStatus(request, env, corsHeaders);
      }

      // Bulk assign (Admin only)
      if (pathname === '/hub/api/bulk/assign' && request.method === 'POST') {
        return await handleBulkAssign(request, env, corsHeaders);
      }

      // Bulk add comment
      if (pathname === '/hub/api/bulk/comment' && request.method === 'POST') {
        return await handleBulkAddComment(request, env, corsHeaders);
      }

      // Export cases to CSV
      if (pathname === '/hub/api/bulk/export' && request.method === 'POST') {
        return await handleExportCases(request, env, corsHeaders);
      }

      // ============================================
      // ASSIGNMENT SYSTEM ENDPOINTS (Admin Only)
      // ============================================

      // Get assignment queue
      if (pathname === '/hub/api/assignment-queue' && request.method === 'GET') {
        return await handleGetAssignmentQueue(request, env, corsHeaders);
      }

      // Update assignment queue
      if (pathname === '/hub/api/assignment-queue' && request.method === 'POST') {
        return await handleUpdateAssignmentQueue(request, env, corsHeaders);
      }

      // Get next assignee (round robin)
      if (pathname === '/hub/api/assignment/next' && request.method === 'GET') {
        return await handleGetNextAssignee(request, env, corsHeaders);
      }

      // Auto-assign case (round robin)
      if (pathname === '/hub/api/assignment/auto' && request.method === 'POST') {
        return await handleAutoAssign(request, env, corsHeaders);
      }

      // Recalculate assignment loads
      if (pathname === '/hub/api/assignment/recalculate' && request.method === 'POST') {
        return await handleRecalculateLoads(request, env, corsHeaders);
      }

      // ============================================
      // SAVED VIEWS ENDPOINTS
      // ============================================

      // Get saved views
      if (pathname === '/hub/api/views' && request.method === 'GET') {
        return await handleGetSavedViews(request, env, corsHeaders);
      }

      // Create saved view
      if (pathname === '/hub/api/views' && request.method === 'POST') {
        return await handleCreateSavedView(request, env, corsHeaders);
      }

      // Update saved view
      if (pathname === '/hub/api/views' && request.method === 'PUT') {
        return await handleUpdateSavedView(request, env, corsHeaders);
      }

      // Delete saved view
      if (pathname.match(/^\/hub\/api\/views\/\d+$/) && request.method === 'DELETE') {
        return await handleDeleteSavedView(request, env, corsHeaders);
      }

      // ============================================
      // COMPLETION CHECKLIST ENDPOINTS
      // ============================================

      // Get checklist items for a case type
      if (pathname === '/hub/api/checklist-items' && request.method === 'GET') {
        return await handleGetChecklistItems(request, env, corsHeaders);
      }

      // Get checklist status for a specific case
      if (pathname.match(/^\/hub\/api\/case\/[^\/]+\/checklist$/) && request.method === 'GET') {
        return await handleGetCaseChecklistStatus(request, env, corsHeaders);
      }

      // Mark checklist item complete/incomplete
      if (pathname === '/hub/api/checklist/complete' && request.method === 'POST') {
        return await handleCompleteChecklistItem(request, env, corsHeaders);
      }

      // Admin: Manage checklist templates (GET/POST/PUT/DELETE)
      if (pathname === '/hub/api/admin/checklists' || pathname.match(/^\/hub\/api\/admin\/checklists\/\d+$/)) {
        return await handleManageChecklists(request, env, corsHeaders);
      }

      // ============================================
      // PHASE 2: ADMIN TOOLS
      // ============================================

      // SOP Link Management (Admin only)
      if (pathname === '/hub/api/admin/sop-links' && request.method === 'GET') {
        return await handleGetSOPLinks(request, env, corsHeaders);
      }

      if (pathname === '/hub/api/admin/sop-links' && request.method === 'POST') {
        return await handleCreateSOPLink(request, env, corsHeaders);
      }

      if (pathname.match(/^\/hub\/api\/admin\/sop-links\/\d+$/) && request.method === 'PUT') {
        const id = pathname.split('/').pop();
        return await handleUpdateSOPLink(request, id, env, corsHeaders);
      }

      if (pathname.match(/^\/hub\/api\/admin\/sop-links\/\d+$/) && request.method === 'DELETE') {
        const id = pathname.split('/').pop();
        return await handleDeleteSOPLink(request, id, env, corsHeaders);
      }

      // Get SOP link for a specific case (public for hub users)
      if (pathname === '/hub/api/sop-link' && request.method === 'GET') {
        return await handleGetSOPForCase(request, env, corsHeaders);
      }

      // Enhanced Audit Log (Admin only)
      if (pathname === '/hub/api/admin/audit-log' && request.method === 'GET') {
        return await handleGetEnhancedAuditLog(request, env, corsHeaders);
      }

      // Audit Log Export (Admin only)
      if (pathname === '/hub/api/admin/audit-log/export' && request.method === 'GET') {
        return await handleExportAuditLog(request, env, corsHeaders);
      }

      // Resolution Validation Rules
      if (pathname === '/hub/api/validate-resolution' && request.method === 'POST') {
        return await handleValidateResolution(request, env, corsHeaders);
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

      // Sessions list (protected)
      if (pathname === '/admin/api/sessions' && request.method === 'GET') {
        return await handleSessionsList(request, env, corsHeaders);
      }

      // Analytics breakdowns (protected)
      if (pathname === '/admin/api/analytics/issues' && request.method === 'GET') {
        return await handleIssuesAnalytics(request, env, corsHeaders);
      }

      // Serve dashboard HTML
      if (pathname === '/admin' || pathname === '/admin/') {
        return await serveDashboard(env, corsHeaders);
      }

      // Serve Resolution Hub
      if (pathname === '/hub' || pathname === '/hub/') {
        return await serveResolutionHub(env, corsHeaders);
      }

      // Serve Hub JavaScript
      if (pathname === '/hub/hub-app.js') {
        return await serveHubAsset('js', corsHeaders);
      }

      // Serve Hub CSS
      if (pathname === '/hub/hub-styles.css') {
        return await serveHubAsset('css', corsHeaders);
      }

      // Hub API - Stats
      if (pathname === '/hub/api/stats' && request.method === 'GET') {
        return await handleHubStats(request, env, corsHeaders);
      }

      // Hub API - Cases list
      if (pathname === '/hub/api/cases' && request.method === 'GET') {
        return await handleHubCases(request, env, corsHeaders);
      }

      // Hub API - Single case
      if (pathname.startsWith('/hub/api/case/') && request.method === 'GET' && !pathname.includes('/comments') && !pathname.includes('/status')) {
        const caseId = pathname.split('/hub/api/case/')[1];
        return await handleHubGetCase(caseId, env, corsHeaders);
      }

      // Hub API - Update case status
      if (pathname.startsWith('/hub/api/case/') && pathname.endsWith('/status') && request.method === 'PUT') {
        const caseId = pathname.split('/hub/api/case/')[1].replace('/status', '');
        return await handleHubUpdateStatus(request, caseId, env, corsHeaders);
      }

      // Hub API - Get case comments
      if (pathname.startsWith('/hub/api/case/') && pathname.endsWith('/comments') && request.method === 'GET') {
        const caseId = pathname.split('/hub/api/case/')[1].replace('/comments', '');
        return await handleHubGetComments(caseId, env, corsHeaders);
      }

      // Hub API - Add case comment
      if (pathname.startsWith('/hub/api/case/') && pathname.endsWith('/comments') && request.method === 'POST') {
        const caseId = pathname.split('/hub/api/case/')[1].replace('/comments', '');
        return await handleHubAddComment(request, caseId, env, corsHeaders);
      }

      // Hub API - Case activity timeline
      if (pathname.startsWith('/hub/api/case/') && pathname.endsWith('/activity') && request.method === 'GET') {
        const caseId = pathname.split('/hub/api/case/')[1].replace('/activity', '');
        return await handleHubCaseActivity(caseId, env, corsHeaders);
      }

      // Hub API - Sessions list
      if (pathname === '/hub/api/sessions' && request.method === 'GET') {
        return await handleHubSessions(request, env, corsHeaders);
      }

      // Hub API - Events list
      if (pathname === '/hub/api/events' && request.method === 'GET') {
        return await handleHubEvents(request, env, corsHeaders);
      }

      // Hub API - Analytics
      if (pathname === '/hub/api/analytics' && request.method === 'GET') {
        return await handleHubAnalytics(request, env, corsHeaders);
      }

      // Hub API - Issues (Trouble Reports)
      if (pathname === '/hub/api/issues' && request.method === 'GET') {
        return await handleHubIssues(request, env, corsHeaders);
      }

      // Hub API - Single Issue
      if (pathname.startsWith('/hub/api/issues/') && request.method === 'GET') {
        const reportId = pathname.split('/hub/api/issues/')[1];
        return await handleHubIssueDetail(reportId, env, corsHeaders);
      }

      // Hub API - Update Issue Status
      if (pathname.match(/\/hub\/api\/issues\/[^\/]+\/status/) && request.method === 'PUT') {
        const reportId = pathname.split('/hub/api/issues/')[1].split('/status')[0];
        return await handleHubIssueStatusUpdate(reportId, request, env, corsHeaders);
      }

      // ============================================
      // CLICKUP WEBHOOK (Two-way Sync)
      // ============================================
      if (pathname === '/api/clickup/webhook' && request.method === 'POST') {
        return await handleClickUpWebhook(request, env, corsHeaders);
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

      // Proxy PostHog ingest (events, recordings, decide, etc.)
      if (pathname.startsWith('/ph/')) {
        const posthogPath = pathname.replace('/ph/', '');
        const posthogUrl = `https://us.i.posthog.com/${posthogPath}${url.search}`;

        // Read body as arrayBuffer to preserve binary/compressed data
        const requestBody = request.method !== 'GET' && request.method !== 'HEAD'
          ? await request.arrayBuffer()
          : undefined;

        // Forward request with necessary headers for PostHog
        const headers = new Headers();

        // Copy all content-related headers
        const contentType = request.headers.get('Content-Type');
        if (contentType) headers.set('Content-Type', contentType);

        // Critical: Forward Content-Encoding for gzip compressed data
        const contentEncoding = request.headers.get('Content-Encoding');
        if (contentEncoding) headers.set('Content-Encoding', contentEncoding);

        const response = await fetch(posthogUrl, {
          method: request.method,
          headers: headers,
          body: requestBody,
        });

        // Forward the response with CORS headers
        const responseHeaders = new Headers(response.headers);
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Content-Encoding');

        return new Response(response.body, {
          status: response.status,
          headers: responseHeaders
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

    // Try to extract clientOrderId from order data first
    let clientOrderId = extractClientOrderId(order);

    // If not found, try fetching from order metafields (separate API call)
    if (!clientOrderId) {
      clientOrderId = await fetchClientOrderIdFromMetafields(order.id, env);
    }

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

// Extract CheckoutChamp order ID from Shopify order - search 5 locations
function extractClientOrderId(order) {
  // Attribute names to search for (case-insensitive)
  const attributeNames = [
    'clientOrderId', 'client_order_id', 'clientorderid',
    'checkoutchamp_order_id', 'checkoutchampOrderId',
    'cc_order_id', 'ccOrderId',
    'orderId', 'order_id',
    'external_order_id', 'externalOrderId',
    'sticky_order_id', 'stickyOrderId',
    'purchaseId', 'purchase_id'
  ];

  // 1. Check note_attributes array (most common location)
  const noteAttrs = order.note_attributes || [];
  for (const attr of noteAttrs) {
    if (attributeNames.some(name => name.toLowerCase() === attr.name?.toLowerCase())) {
      if (attr.value) {
        console.log('Found clientOrderId in note_attributes:', attr.value);
        return attr.value;
      }
    }
  }

  // 2. Check order tags field
  if (order.tags) {
    const tags = order.tags.split(/[,\s]+/);
    for (const tag of tags) {
      // Look for patterns like "cc:E8D2D8C878" or "orderId:12345" (alphanumeric IDs)
      const match = tag.match(/(?:cc|clientOrderId|orderId|checkoutchamp)[:\-_]?([A-Z0-9]+)/i);
      if (match) {
        console.log('Found clientOrderId in tags:', match[1]);
        return match[1];
      }
    }
  }

  // 3. Check order note field
  if (order.note) {
    // Try various patterns (alphanumeric IDs like E8D2D8C878)
    for (const attrName of attributeNames) {
      const regex = new RegExp(`${attrName}[:\\s=]+["']?([A-Z0-9]+)["']?`, 'i');
      const match = order.note.match(regex);
      if (match) {
        console.log('Found clientOrderId in note:', match[1]);
        return match[1];
      }
    }

    // Also try to parse JSON in note
    try {
      const jsonMatch = order.note.match(/\{[^}]+\}/);
      if (jsonMatch) {
        const noteJson = JSON.parse(jsonMatch[0]);
        for (const attrName of attributeNames) {
          if (noteJson[attrName]) {
            console.log('Found clientOrderId in note JSON:', noteJson[attrName]);
            return noteJson[attrName];
          }
        }
      }
    } catch (e) {
      // Not valid JSON, continue
    }
  }

  // 4. Check custom attributes on line items
  if (order.line_items) {
    for (const item of order.line_items) {
      const itemProps = item.properties || [];
      for (const prop of itemProps) {
        if (attributeNames.some(name => name.toLowerCase() === prop.name?.toLowerCase())) {
          if (prop.value) {
            console.log('Found clientOrderId in line_item properties:', prop.value);
            return prop.value;
          }
        }
      }
    }
  }

  console.log('No clientOrderId found in order:', order.name);
  return null;
}

// Fetch clientOrderId from Shopify order metafields (separate API call)
async function fetchClientOrderIdFromMetafields(orderId, env) {
  const attributeNames = [
    'clientOrderId', 'client_order_id', 'clientorderid',
    'checkoutchamp_order_id', 'checkoutchampOrderId',
    'cc_order_id', 'ccOrderId',
    'orderId', 'order_id',
    'external_order_id', 'externalOrderId',
    'sticky_order_id', 'stickyOrderId',
    'purchaseId', 'purchase_id'
  ];

  try {
    const metafieldsUrl = `https://${env.SHOPIFY_STORE}/admin/api/2024-01/orders/${orderId}/metafields.json`;
    const response = await fetch(metafieldsUrl, {
      headers: {
        'X-Shopify-Access-Token': env.SHOPIFY_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log('Metafields fetch failed for order:', orderId);
      return null;
    }

    const data = await response.json();
    const metafields = data.metafields || [];

    for (const mf of metafields) {
      // Check if the key matches any of our attribute names
      if (attributeNames.some(name => name.toLowerCase() === mf.key?.toLowerCase())) {
        console.log('Found clientOrderId in metafields:', mf.value);
        return mf.value;
      }

      // Also check the value for JSON that might contain the ID
      if (typeof mf.value === 'string' && mf.value.startsWith('{')) {
        try {
          const jsonValue = JSON.parse(mf.value);
          for (const attrName of attributeNames) {
            if (jsonValue[attrName]) {
              console.log('Found clientOrderId in metafield JSON:', jsonValue[attrName]);
              return jsonValue[attrName];
            }
          }
        } catch (e) {
          // Not valid JSON
        }
      }
    }

    console.log('No clientOrderId found in metafields for order:', orderId);
    return null;
  } catch (error) {
    console.error('Error fetching metafields:', error);
    return null;
  }
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
  const { clientOrderId, email } = await request.json();

  console.log('Subscription lookup - clientOrderId:', clientOrderId, 'email:', email);

  try {
    let subscriptionData = null;

    // Method 1: If clientOrderId provided directly, use it
    if (clientOrderId) {
      console.log('Trying subscription lookup by provided clientOrderId:', clientOrderId);
      subscriptionData = await checkSubscriptionStatus(clientOrderId, env);
    }

    // Method 2: If no subscription found and email provided, search Shopify first
    // CORRECT FLOW: Email → Shopify → clientOrderId → CheckoutChamp
    if ((!subscriptionData || !subscriptionData.isSubscription) && email) {
      console.log('Searching Shopify for orders with email:', email);
      subscriptionData = await findSubscriptionViaShopify(email, env);
    }

    if (!subscriptionData || !subscriptionData.isSubscription) {
      return Response.json({
        subscriptions: [],
        isSubscription: false,
        message: 'No subscription found'
      }, { headers: corsHeaders });
    }

    // Return subscription as array for frontend compatibility
    return Response.json({
      subscriptions: [{
        purchaseId: subscriptionData.purchaseId,
        productName: subscriptionData.subscriptionProductName || 'Subscription',
        productSku: subscriptionData.subscriptionProductSku || '',
        status: subscriptionData.subscriptionStatus || 'UNKNOWN',
        nextBillingDate: subscriptionData.nextBillDate,
        lastBillingDate: subscriptionData.currentBillDate,
        frequency: subscriptionData.billFrequency || 30,
        cycleNumber: subscriptionData.cycleNumber || 1,
        price: subscriptionData.price || '0.00',
        clientOrderId: subscriptionData.checkoutChampOrderId || clientOrderId
      }],
      isSubscription: true
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Subscription lookup error:', error);
    return Response.json({
      subscriptions: [],
      error: 'Subscription lookup failed: ' + error.message,
      isSubscription: false
    }, { status: 500, headers: corsHeaders });
  }
}

// CORRECT FLOW: Email → Shopify → clientOrderId → CheckoutChamp
async function findSubscriptionViaShopify(email, env) {
  const result = {
    isSubscription: false,
    checkoutChampOrderId: null,
    subscriptionStatus: null,
    nextBillDate: null,
    currentBillDate: null,
    billFrequency: null,
    cycleNumber: null,
    purchaseId: null,
    subscriptionProductSku: null,
    subscriptionProductName: null,
    price: null
  };

  if (!email) {
    console.log('No email provided for subscription lookup');
    return result;
  }

  try {
    // Step 1: Query Shopify for orders with this email
    const shopifyUrl = `https://${env.SHOPIFY_STORE}/admin/api/2024-01/orders.json?status=any&limit=50&query=email:${encodeURIComponent(email)}`;

    console.log('Querying Shopify for orders with email:', email);

    const shopifyResponse = await fetch(shopifyUrl, {
      headers: {
        'X-Shopify-Access-Token': env.SHOPIFY_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!shopifyResponse.ok) {
      console.error('Shopify order query failed:', shopifyResponse.status);
      return result;
    }

    const shopifyData = await shopifyResponse.json();
    const orders = shopifyData.orders || [];

    console.log('Found', orders.length, 'Shopify orders for email:', email);

    if (orders.length === 0) {
      console.log('No Shopify orders found for email');
      return result;
    }

    // Step 2: For each Shopify order, try to find clientOrderId and check for subscription
    for (const order of orders) {
      console.log('Checking Shopify order:', order.name, 'id:', order.id);

      // Try to extract clientOrderId from order data
      let clientOrderId = extractClientOrderId(order);

      // If not found in order data, try metafields
      if (!clientOrderId) {
        clientOrderId = await fetchClientOrderIdFromMetafields(order.id, env);
      }

      if (!clientOrderId) {
        console.log('No clientOrderId found in Shopify order:', order.name);
        continue;
      }

      console.log('Found clientOrderId:', clientOrderId, 'in Shopify order:', order.name);

      // Step 3: Query CheckoutChamp with this clientOrderId
      const subscriptionData = await checkSubscriptionStatus(clientOrderId, env);

      if (subscriptionData.isSubscription) {
        console.log('Found subscription for clientOrderId:', clientOrderId);
        return subscriptionData;
      }
    }

    console.log('No subscription found in any Shopify order for email:', email);
    return result;

  } catch (error) {
    console.error('Error finding subscription via Shopify:', error);
    return result;
  }
}

// Find subscription by searching CheckoutChamp with email
// CheckoutChamp API uses 'emailAddress' parameter, not 'email'
async function findSubscriptionByEmail(email, env) {
  const result = {
    isSubscription: false,
    checkoutChampOrderId: null,
    subscriptionStatus: null,
    nextBillDate: null,
    currentBillDate: null,
    billFrequency: null,
    cycleNumber: null,
    purchaseId: null,
    subscriptionProductSku: null,
    subscriptionProductName: null,
    price: null
  };

  if (!email) {
    console.log('No email provided for subscription lookup');
    return result;
  }

  console.log('Finding subscription by email:', email);

  try {
    // Method 1: Try customer/find to get customer ID first
    const customerFindUrl = `https://api.checkoutchamp.com/customer/find/?loginId=${encodeURIComponent(env.CC_API_USERNAME)}&password=${encodeURIComponent(env.CC_API_PASSWORD)}&emailAddress=${encodeURIComponent(email)}`;

    console.log('Calling CheckoutChamp customer/find');
    const customerResponse = await fetch(customerFindUrl);
    const customerResponseText = await customerResponse.text();
    console.log('CheckoutChamp customer/find response:', customerResponseText.substring(0, 1000));

    if (customerResponse.ok) {
      try {
        const customerData = JSON.parse(customerResponseText);

        // Check for success response
        if (customerData.result === 'SUCCESS' || customerData.message?.result === 'SUCCESS') {
          const customerId = customerData.message?.customerId || customerData.customerId;

          if (customerId) {
            console.log('Found customerId:', customerId);

            // Now query purchases for this customer
            const purchaseByCustomerUrl = `https://api.checkoutchamp.com/purchase/query/?loginId=${encodeURIComponent(env.CC_API_USERNAME)}&password=${encodeURIComponent(env.CC_API_PASSWORD)}&customerId=${encodeURIComponent(customerId)}`;

            console.log('Calling CheckoutChamp purchase/query by customerId');
            const purchaseResponse = await fetch(purchaseByCustomerUrl);
            const purchaseResponseText = await purchaseResponse.text();
            console.log('CheckoutChamp purchase/query response:', purchaseResponseText.substring(0, 1000));

            if (purchaseResponse.ok) {
              const purchaseData = JSON.parse(purchaseResponseText);
              const subscriptionResult = extractSubscriptionFromPurchaseResponse(purchaseData);
              if (subscriptionResult.isSubscription) {
                return subscriptionResult;
              }
            }
          }
        }
      } catch (parseError) {
        console.log('Error parsing customer response:', parseError.message);
      }
    }

    // Method 2: Try purchase/query with emailAddress parameter
    const purchaseByEmailUrl = `https://api.checkoutchamp.com/purchase/query/?loginId=${encodeURIComponent(env.CC_API_USERNAME)}&password=${encodeURIComponent(env.CC_API_PASSWORD)}&emailAddress=${encodeURIComponent(email)}`;

    console.log('Calling CheckoutChamp purchase/query by emailAddress');
    const purchaseResponse = await fetch(purchaseByEmailUrl);
    const purchaseResponseText = await purchaseResponse.text();
    console.log('CheckoutChamp purchase/query by email response:', purchaseResponseText.substring(0, 1000));

    if (purchaseResponse.ok) {
      try {
        const purchaseData = JSON.parse(purchaseResponseText);
        const subscriptionResult = extractSubscriptionFromPurchaseResponse(purchaseData);
        if (subscriptionResult.isSubscription) {
          return subscriptionResult;
        }
      } catch (parseError) {
        console.log('Error parsing purchase response:', parseError.message);
      }
    }

    // Method 3: Try order/query with emailAddress
    const orderByEmailUrl = `https://api.checkoutchamp.com/order/query/?loginId=${encodeURIComponent(env.CC_API_USERNAME)}&password=${encodeURIComponent(env.CC_API_PASSWORD)}&emailAddress=${encodeURIComponent(email)}`;

    console.log('Calling CheckoutChamp order/query by emailAddress');
    const orderResponse = await fetch(orderByEmailUrl);
    const orderResponseText = await orderResponse.text();
    console.log('CheckoutChamp order/query by email response:', orderResponseText.substring(0, 1000));

    if (orderResponse.ok) {
      try {
        const orderData = JSON.parse(orderResponseText);
        let orders = orderData.message?.data || orderData.data || orderData;

        // Handle single object response
        if (orders && !Array.isArray(orders) && orders.orderId) {
          orders = [orders];
        }

        if (Array.isArray(orders) && orders.length > 0) {
          // Look through orders for one with a purchaseId (indicates subscription)
          for (const order of orders) {
            const purchaseId = order.purchaseId || order.purchase_id;
            const orderId = order.orderId || order.order_id;

            if (purchaseId) {
              console.log('Found order with purchaseId:', purchaseId, 'orderId:', orderId);
              return await checkSubscriptionStatus(orderId, env);
            }
          }

          // If no purchaseId found in orders, try querying each order
          for (const order of orders.slice(0, 5)) { // Limit to first 5 orders
            const orderId = order.orderId || order.order_id;
            if (orderId) {
              console.log('Checking order for subscription:', orderId);
              const subResult = await checkSubscriptionStatus(orderId, env);
              if (subResult.isSubscription) {
                return subResult;
              }
            }
          }
        }
      } catch (parseError) {
        console.log('Error parsing order response:', parseError.message);
      }
    }

    console.log('No subscription found by email after all methods');
    return result;

  } catch (error) {
    console.error('Error finding subscription by email:', error);
    return result;
  }
}

// Extract subscription data from CheckoutChamp purchase/query response
function extractSubscriptionFromPurchaseResponse(purchaseData) {
  const result = {
    isSubscription: false,
    checkoutChampOrderId: null,
    subscriptionStatus: null,
    nextBillDate: null,
    currentBillDate: null,
    billFrequency: null,
    cycleNumber: null,
    purchaseId: null,
    subscriptionProductSku: null,
    subscriptionProductName: null,
    price: null
  };

  // Handle wrapped response - check multiple locations
  let purchases = purchaseData.message?.data || purchaseData.data || purchaseData;

  // Check for error response
  if (purchaseData.result === 'ERROR' || purchaseData.message?.result === 'ERROR') {
    console.log('CheckoutChamp returned error:', purchaseData.message?.message || purchaseData.errorMessage);
    return result;
  }

  // Handle single object response
  if (purchases && !Array.isArray(purchases) && (purchases.purchaseId || purchases.id)) {
    purchases = [purchases];
  }

  // If it's an array, find ACTIVE subscription
  if (Array.isArray(purchases) && purchases.length > 0) {
    // Sort by dateCreated descending to get most recent first
    purchases.sort((a, b) => {
      const dateA = new Date(a.dateCreated || a.createdAt || 0);
      const dateB = new Date(b.dateCreated || b.createdAt || 0);
      return dateB - dateA;
    });

    // Find first ACTIVE subscription, or use first one
    let purchaseInfo = purchases.find(p =>
      p.status === 'ACTIVE' || p.purchaseStatus === 'ACTIVE'
    ) || purchases[0];

    result.isSubscription = true;
    result.purchaseId = purchaseInfo.purchaseId || purchaseInfo.purchase_id || purchaseInfo.id;
    result.checkoutChampOrderId = purchaseInfo.orderId || purchaseInfo.order_id;
    result.subscriptionStatus = purchaseInfo.status || purchaseInfo.purchaseStatus || 'Unknown';
    result.nextBillDate = purchaseInfo.nextBillDate || purchaseInfo.next_bill_date || null;
    result.currentBillDate = purchaseInfo.lastBillDate || purchaseInfo.last_bill_date || purchaseInfo.dateCreated || null;
    result.billFrequency = purchaseInfo.billingIntervalDays || purchaseInfo.frequency || purchaseInfo.billFrequency || null;
    result.cycleNumber = purchaseInfo.billingCycleNumber || purchaseInfo.cycleNumber || purchaseInfo.rebillDepth || null;
    result.subscriptionProductSku = purchaseInfo.productSku || null;
    result.subscriptionProductName = purchaseInfo.displayName || purchaseInfo.productName || null;
    result.price = purchaseInfo.price || purchaseInfo.amount || purchaseInfo.recurringPrice || null;

    console.log('Extracted subscription from purchase response:', JSON.stringify(result));
  }

  return result;
}

// Check subscription status - matches the working implementation exactly
async function checkSubscriptionStatus(clientOrderId, env) {
  const result = {
    isSubscription: false,
    checkoutChampOrderId: clientOrderId,
    subscriptionStatus: null,
    nextBillDate: null,
    currentBillDate: null,
    billFrequency: null,
    cycleNumber: null,
    purchaseId: null,
    subscriptionProductSku: null,
    subscriptionProductName: null,
    price: null
  };

  try {
    // Step 1: Query CheckoutChamp order to get purchaseId
    const orderQueryUrl = `https://api.checkoutchamp.com/order/query/?loginId=${encodeURIComponent(env.CC_API_USERNAME)}&password=${encodeURIComponent(env.CC_API_PASSWORD)}&orderId=${encodeURIComponent(clientOrderId)}`;

    console.log('Calling CheckoutChamp order query:', orderQueryUrl.replace(/password=[^&]+/, 'password=***'));

    const orderResponse = await fetch(orderQueryUrl);

    if (!orderResponse.ok) {
      console.error('CheckoutChamp order query failed:', orderResponse.status);
      return result;
    }

    const orderResponseText = await orderResponse.text();
    console.log('CheckoutChamp order response:', orderResponseText.substring(0, 800));

    let orderData;
    try {
      orderData = JSON.parse(orderResponseText);
    } catch (e) {
      console.error('Failed to parse order response:', e.message);
      return result;
    }

    // Handle wrapped response - data might be in message.data, data, or at root
    const orderInfo = orderData.message?.data || orderData.data || orderData;

    // Find purchaseId in 6 locations
    let purchaseId = null;

    // Method 1: Check top level
    purchaseId = orderInfo.purchaseId || orderInfo.purchase_id || orderInfo.subscriptionId || orderInfo.subscription_id;

    // Method 2: Check inside "items" array
    if (!purchaseId && orderInfo.items && Array.isArray(orderInfo.items)) {
      for (const item of orderInfo.items) {
        if (item.purchaseId || item.purchase_id) {
          purchaseId = item.purchaseId || item.purchase_id;
          break;
        }
      }
    }

    // Method 3: Check inside "products" array
    if (!purchaseId && orderInfo.products && Array.isArray(orderInfo.products)) {
      for (const product of orderInfo.products) {
        if (product.purchaseId || product.purchase_id) {
          purchaseId = product.purchaseId || product.purchase_id;
          break;
        }
      }
    }

    // Method 4: Check inside "purchases" array
    if (!purchaseId && orderInfo.purchases && Array.isArray(orderInfo.purchases)) {
      for (const purchase of orderInfo.purchases) {
        if (purchase.purchaseId || purchase.purchase_id || purchase.id) {
          purchaseId = purchase.purchaseId || purchase.purchase_id || purchase.id;
          break;
        }
      }
    }

    // Method 5: Check nested "order" object
    if (!purchaseId && orderInfo.order) {
      if (orderInfo.order.purchaseId) {
        purchaseId = orderInfo.order.purchaseId;
      }
      // Also check items inside nested order
      if (!purchaseId && orderInfo.order.items && Array.isArray(orderInfo.order.items)) {
        for (const item of orderInfo.order.items) {
          if (item.purchaseId || item.purchase_id) {
            purchaseId = item.purchaseId || item.purchase_id;
            break;
          }
        }
      }
    }

    // Method 6: Deep regex search as last resort
    if (!purchaseId) {
      const responseStr = JSON.stringify(orderInfo);
      const purchaseIdMatch = responseStr.match(/"purchaseId"\s*:\s*"?([A-Z0-9]+)"?/i);
      if (purchaseIdMatch) {
        purchaseId = purchaseIdMatch[1];
      }
    }

    // If no purchaseId found, it's NOT a subscription
    if (!purchaseId) {
      console.log('No purchaseId found in CheckoutChamp response - order is not a subscription');
      return result;
    }

    console.log('Found purchaseId:', purchaseId);
    result.isSubscription = true;
    result.purchaseId = purchaseId;

    // Step 2: Query purchase/subscription details
    const purchaseQueryUrl = `https://api.checkoutchamp.com/purchase/query/?loginId=${encodeURIComponent(env.CC_API_USERNAME)}&password=${encodeURIComponent(env.CC_API_PASSWORD)}&purchaseId=${encodeURIComponent(purchaseId)}`;

    console.log('Calling CheckoutChamp purchase query for purchaseId:', purchaseId);

    const purchaseResponse = await fetch(purchaseQueryUrl);

    if (!purchaseResponse.ok) {
      console.error('CheckoutChamp purchase query failed:', purchaseResponse.status);
      return result;
    }

    const purchaseResponseText = await purchaseResponse.text();
    console.log('CheckoutChamp purchase response:', purchaseResponseText.substring(0, 800));

    let purchaseData;
    try {
      purchaseData = JSON.parse(purchaseResponseText);
    } catch (e) {
      console.error('Failed to parse purchase response:', e.message);
      return result;
    }

    // Handle wrapped response - data might be in message.data, data, or at root
    // IMPORTANT: data is often an ARRAY, get first element
    let purchaseInfo = purchaseData.message?.data || purchaseData.data || purchaseData;

    if (Array.isArray(purchaseInfo)) {
      if (purchaseInfo.length > 0) {
        purchaseInfo = purchaseInfo[0];
      } else {
        console.log('Purchase query returned empty array');
        return result;
      }
    }

    // Extract subscription details
    result.subscriptionStatus = purchaseInfo.status || purchaseInfo.purchaseStatus || 'Unknown';
    result.nextBillDate = purchaseInfo.nextBillDate || purchaseInfo.next_bill_date || null;
    result.currentBillDate = purchaseInfo.lastBillDate || purchaseInfo.last_bill_date || purchaseInfo.dateCreated || purchaseInfo.createdAt || null;
    result.billFrequency = purchaseInfo.billingIntervalDays || purchaseInfo.frequency || purchaseInfo.billFrequency || purchaseInfo.bill_frequency || null;
    result.cycleNumber = purchaseInfo.billingCycleNumber || purchaseInfo.cycleNumber || purchaseInfo.cycle_number || purchaseInfo.rebillDepth || null;
    result.subscriptionProductSku = purchaseInfo.productSku || null;
    result.subscriptionProductName = purchaseInfo.displayName || purchaseInfo.productName || null;
    result.price = purchaseInfo.price || purchaseInfo.amount || purchaseInfo.recurringPrice || null;

    console.log('Subscription data extracted:', JSON.stringify(result));

    return result;

  } catch (error) {
    console.error('Error in checkSubscriptionStatus:', error);
    return result;
  }
}

function findPurchaseIdInOrder(order) {
  if (!order) return null;

  // 1. Top-level fields
  if (order.purchaseId) return order.purchaseId;
  if (order.purchase_id) return order.purchase_id;
  if (order.subscriptionId) return order.subscriptionId;
  if (order.subscription_id) return order.subscription_id;

  // 2. Inside items[] array
  if (Array.isArray(order.items)) {
    for (const item of order.items) {
      if (item.purchaseId) return item.purchaseId;
      if (item.purchase_id) return item.purchase_id;
      if (item.subscriptionId) return item.subscriptionId;
    }
  }

  // 3. Inside products[] array
  if (Array.isArray(order.products)) {
    for (const product of order.products) {
      if (product.purchaseId) return product.purchaseId;
      if (product.purchase_id) return product.purchase_id;
      if (product.subscriptionId) return product.subscriptionId;
    }
  }

  // 4. Inside purchases[] array
  if (Array.isArray(order.purchases)) {
    for (const purchase of order.purchases) {
      if (purchase.purchaseId) return purchase.purchaseId;
      if (purchase.purchase_id) return purchase.purchase_id;
      if (purchase.id) return purchase.id;
    }
  }

  // 5. Nested order object
  if (order.order) {
    const nestedId = findPurchaseIdInOrder(order.order);
    if (nestedId) return nestedId;
  }

  // 6. Deep regex search of entire response (last resort) - alphanumeric IDs
  try {
    const jsonStr = JSON.stringify(order);
    const purchaseMatch = jsonStr.match(/"purchaseId"\s*:\s*"?([A-Z0-9]+)"?/i);
    if (purchaseMatch) return purchaseMatch[1];

    const subscriptionMatch = jsonStr.match(/"subscriptionId"\s*:\s*"?([A-Z0-9]+)"?/i);
    if (subscriptionMatch) return subscriptionMatch[1];
  } catch (e) {
    // Ignore JSON stringify errors
  }

  return null;
}

// Get subscription details from Purchase Query API
async function getSubscriptionDetails(env, purchaseId, orderData) {
  const purchaseUrl = `https://api.checkoutchamp.com/purchase/query/?loginId=${encodeURIComponent(env.CC_API_USERNAME)}&password=${encodeURIComponent(env.CC_API_PASSWORD)}&purchaseId=${encodeURIComponent(purchaseId)}`;

  const purchaseResponse = await fetch(purchaseUrl, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!purchaseResponse.ok) {
    console.error('CheckoutChamp purchase query failed:', purchaseResponse.status);
    return [];
  }

  const purchaseData = await purchaseResponse.json();
  console.log('CheckoutChamp purchase response:', JSON.stringify(purchaseData).substring(0, 500));

  const purchase = purchaseData?.result || purchaseData;

  if (!purchase) {
    return [];
  }

  // Extract subscription details from various possible field names
  const subscription = {
    purchaseId: purchaseId,
    productName: purchase.displayName || purchase.productName || purchase.product_name || 'Subscription',
    productSku: purchase.productSku || purchase.product_sku || purchase.sku || '',
    status: (purchase.status || purchase.purchaseStatus || purchase.purchase_status || 'unknown').toUpperCase(),
    nextBillingDate: purchase.nextBillDate || purchase.next_bill_date || purchase.nextBillingDate || null,
    lastBillingDate: purchase.lastBillDate || purchase.last_bill_date || purchase.dateCreated || purchase.createdAt || null,
    frequency: purchase.billingIntervalDays || purchase.frequency || purchase.billFrequency || purchase.billing_interval_days || 30,
    cycleNumber: purchase.billingCycleNumber || purchase.cycleNumber || purchase.rebillDepth || purchase.cycle_number || 1,
    price: purchase.price || purchase.amount || purchase.recurringPrice || '0.00',
    // Include order info if available
    orderId: orderData?.result?.orderId || orderData?.result?.id || null,
  };

  return [subscription];
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

  // Log to D1 analytics database (include ALL fields for extra_data)
  await logCaseToAnalytics(env, {
    caseId,
    sessionId: caseData.sessionId,
    caseType: caseData.caseType,
    resolution: caseData.resolution,
    orderNumber: caseData.orderNumber,
    email: caseData.email,
    customerName: caseData.customerName,
    customerFirstName: caseData.customerFirstName,
    customerLastName: caseData.customerLastName,
    refundAmount: caseData.refundAmount,
    selectedItems: caseData.selectedItems,
    clickupTaskId: clickupTask?.id,
    clickupTaskUrl: clickupTask?.url,
    sessionReplayUrl: caseData.sessionReplayUrl,
    orderUrl: caseData.orderUrl,
    orderDate: caseData.orderDate,
    richpanelConversationNo: richpanelResult?.conversationNo,
    // Subscription-specific fields
    actionType: caseData.actionType,
    purchaseId: caseData.purchaseId,
    clientOrderId: caseData.clientOrderId,
    subscriptionProductName: caseData.subscriptionProductName,
    subscriptionStatus: caseData.subscriptionStatus,
    pauseDuration: caseData.pauseDuration,
    pauseResumeDate: caseData.pauseResumeDate,
    cancelReason: caseData.cancelReason,
    discountPercent: caseData.discountPercent,
    newFrequency: caseData.newFrequency, // For schedule changes
    previousFrequency: caseData.previousFrequency, // For schedule changes
    newAddress: caseData.newAddress, // For address changes
    // Other fields for extra_data
    keepProduct: caseData.keepProduct,
    issueType: caseData.issueType,
    qualityDetails: caseData.qualityDetails,
    correctedAddress: caseData.correctedAddress,
    notes: caseData.notes,
    intentDetails: caseData.intentDetails,
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
      sessionReplayUrl: sessionReplayUrl || null,
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
    // Partial refunds (product issues) - all ladder steps
    'partial_20': `Give 20% partial refund (${refundAmount}) - customer keeps product`,
    'partial_30': `Give 30% partial refund (${refundAmount}) - customer keeps product`,
    'partial_40': `Give 40% partial refund (${refundAmount}) - customer keeps product`,
    'partial_50': `Give 50% partial refund (${refundAmount}) - customer keeps product`,
    'partial_75': `Give 75% partial refund (${refundAmount}) - customer keeps product`,

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
    'reship_missing_item_bonus': 'Ship missing items + bonus item for inconvenience',
    'refund_missing_item': 'Calculate and refund for missing items (check bundle pricing)',
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

    // Quality difference - upgrade flows (ACTION: what team needs to do)
    'upgrade_keep_originals': 'ACTION: Send checkout link ($20/pad) → Ship PuppyPad 2.0 after payment (customer keeps Originals)',
    'return_upgrade_enhanced': 'ACTION: Wait for return tracking → Send checkout link ($20/pad) → Ship PuppyPad 2.0 after payment',
    'reship_quality_upgrade': 'ACTION: Ship FREE PuppyPad 2.0 (customer keeps Originals) — We absorb cost',
    'full_refund_quality': 'ACTION: Process refund (team to calculate amount) — Customer keeps Originals',
    'full_refund_quality_used': 'ACTION: Process refund (team to calculate amount) — Used items, no return needed',
    'full_refund_quality_return': 'ACTION: Wait for return → Process refund after received (team to calculate amount)',
  };

  // Check for dynamic partial_XX_reship patterns
  const partialReshipMatch = resolution.match(/^partial_(\d+)_reship$/);
  if (partialReshipMatch) {
    const percent = partialReshipMatch[1];
    return `Give ${percent}% partial refund (${refundAmount}) and reship order`;
  }

  // Check for dynamic partial_XX patterns (catches any percentage not explicitly mapped)
  const partialMatch = resolution.match(/^partial_(\d+)$/);
  if (partialMatch) {
    const percent = partialMatch[1];
    return `Give ${percent}% partial refund (${refundAmount}) - customer keeps product`;
  }

  return resolutionMap[resolution] || resolution.replace(/_/g, ' ');
}

// Format order issue from customer's reason (customer perspective - used in emails)
function formatOrderIssue(caseData) {
  // If there's detailed intent from the customer, use it directly
  if (caseData.intentDetails) {
    return caseData.intentDetails;
  }

  // Map issue types to customer-perspective descriptions (sounds like the customer is saying this)
  const issueMap = {
    // Product issues
    'not_met_expectations': "The product didn't meet my expectations",
    'changed_mind': "I changed my mind about this order",
    'ordered_mistake': "I ordered this by mistake",
    'defective': "The product I received is defective",
    'wrong_item': "I received the wrong item",
    'damaged': "My product arrived damaged",
    'missing_item': "There's an item missing from my order",
    'something_missing': "Something was missing from my order",
    'not_as_described': "The product isn't as described",
    'dog_not_using': "My dog isn't using the product",
    'quality_difference': "I noticed a quality difference",

    // Shipping issues
    'late_delivery': "My delivery is taking too long",
    'not_received': "I haven't received my order",
    'lost_package': "My package appears to be lost",
    'stuck_in_transit': "My package is stuck in transit",
    'delivery_exception': "There's a delivery exception on my package",
    'address_issue': "I need to correct my shipping address",
    'failed_delivery': "The delivery attempt failed",

    // Subscription issues
    'subscription_cancel': "I'd like to cancel my subscription",
    'subscription_pause': "I'd like to pause my subscription",
    'subscription_change': "I'd like to change my subscription",
    'charged_unexpectedly': "I was charged unexpectedly",

    // General
    'other': "I have an issue with my order",
  };

  // Check if we have a matching issue type
  if (caseData.issueType && issueMap[caseData.issueType]) {
    return issueMap[caseData.issueType];
  }

  // Fallback based on case type for better context (customer perspective)
  const caseTypeFallbacks = {
    'refund': "I'd like a refund for my order",
    'return': "I'd like to return my order",
    'shipping': "I'm having an issue with my delivery",
    'subscription': "I need help with my subscription",
    'manual': "I need help with my order",
  };

  return caseTypeFallbacks[caseData.caseType] || caseData.issueType?.replace(/_/g, ' ') || "I need help with my order";
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

  // Calculate due date - 1 day from now (internal deadline)
  const dueDate = Date.now() + (24 * 60 * 60 * 1000); // 24 hours in milliseconds

  // Task body with no description (details go in comments)
  const taskBody = {
    name: caseData.customerName || 'Unknown Customer',
    description: '', // Keep empty - details go in comments
    custom_fields: customFields,
    due_date: dueDate, // 1-day internal deadline
    due_date_time: true, // Include time in due date
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
  // Use quality_difference SOP if that's the issue type, otherwise use case type
  const sopUrl = caseData.issueType === 'quality_difference'
    ? SOP_URLS.quality_difference
    : (SOP_URLS[caseData.caseType] || SOP_URLS.manual);
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

    if (caseData.purchaseId) addBoldLine('Subscription ID (Purchase ID):', caseData.purchaseId);
    if (caseData.clientOrderId) addBoldLine('CheckoutChamp Order ID:', caseData.clientOrderId);
    if (caseData.subscriptionProductName) addBoldLine('Product:', caseData.subscriptionProductName);

    if (caseData.actionType) {
      let actionLabel = caseData.actionType;
      if (caseData.actionType === 'pause') {
        actionLabel = caseData.pauseDuration ? `Pause for ${caseData.pauseDuration} days` : 'Pause Subscription';
      } else if (caseData.actionType === 'cancel') {
        actionLabel = 'Cancel Subscription';
      } else if (caseData.actionType === 'changeSchedule') {
        actionLabel = 'Change Schedule';
      } else if (caseData.actionType === 'changeAddress') {
        actionLabel = 'Change Address';
      }
      addBoldLine('Action:', actionLabel);
    }
    if (caseData.pauseResumeDate) {
      const resumeDate = new Date(caseData.pauseResumeDate);
      addBoldLine('Resume Date:', resumeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
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

  // Quality difference specific details
  if (caseData.issueType === 'quality_difference' && caseData.qualityDetails) {
    const qd = caseData.qualityDetails;
    addHeader('🔄 QUALITY UPGRADE DETAILS');

    if (qd.padCount) addBoldLine('Number of Pads:', qd.padCount);
    if (qd.itemsUsed !== undefined) addBoldLine('Items Status:', qd.itemsUsed ? 'USED (keeping)' : 'UNUSED (returning)');
    if (qd.upgradeTotal) addBoldLine('Upgrade Cost:', `$${qd.upgradeTotal} ($20 × ${qd.padCount} pads)`);

    comment.push({ text: '\n', attributes: {} });

    // Action steps based on resolution
    if (caseData.resolution === 'upgrade_keep_originals') {
      comment.push({ text: '✅ ACTION STEPS:', attributes: { bold: true } });
      comment.push({ text: '\n', attributes: {} });
      comment.push({ text: `1. Generate custom checkout link for $${qd.upgradeTotal}`, attributes: {} });
      comment.push({ text: '\n', attributes: {} });
      comment.push({ text: '2. Send checkout link to customer email', attributes: {} });
      comment.push({ text: '\n', attributes: {} });
      comment.push({ text: `3. Once paid, ship ${qd.padCount} Enhanced PuppyPads`, attributes: {} });
      comment.push({ text: '\n', attributes: {} });
      comment.push({ text: '4. Send tracking confirmation', attributes: {} });
      comment.push({ text: '\n', attributes: {} });
      comment.push({ text: '5. Close ticket', attributes: {} });
      comment.push({ text: '\n\n', attributes: {} });
      comment.push({ text: '⚠️ NOTE: Customer is keeping Original pads. We are absorbing Original product cost for satisfaction.', attributes: { italic: true } });
      comment.push({ text: '\n', attributes: {} });
    } else if (caseData.resolution === 'return_upgrade_enhanced') {
      comment.push({ text: '✅ ACTION STEPS:', attributes: { bold: true } });
      comment.push({ text: '\n', attributes: {} });
      comment.push({ text: '1. Wait for customer to ship return (they arrange shipping)', attributes: {} });
      comment.push({ text: '\n', attributes: {} });
      comment.push({ text: '2. Customer will provide tracking number', attributes: {} });
      comment.push({ text: '\n', attributes: {} });
      comment.push({ text: `3. Once tracking received, generate checkout link for $${qd.upgradeTotal}`, attributes: {} });
      comment.push({ text: '\n', attributes: {} });
      comment.push({ text: '4. Send checkout link to customer', attributes: {} });
      comment.push({ text: '\n', attributes: {} });
      comment.push({ text: `5. Once paid, ship ${qd.padCount} Enhanced PuppyPads`, attributes: {} });
      comment.push({ text: '\n', attributes: {} });
      comment.push({ text: '6. Close ticket when delivered', attributes: {} });
      comment.push({ text: '\n', attributes: {} });
    } else if (caseData.resolution === 'reship_quality_upgrade') {
      comment.push({ text: '✅ ACTION STEPS:', attributes: { bold: true } });
      comment.push({ text: '\n', attributes: {} });
      comment.push({ text: `1. Ship ${qd.padCount || 'order quantity'} Enhanced PuppyPads (FREE - no charge)`, attributes: {} });
      comment.push({ text: '\n', attributes: {} });
      comment.push({ text: '2. Send tracking to customer', attributes: {} });
      comment.push({ text: '\n', attributes: {} });
      comment.push({ text: '3. Close ticket once delivered', attributes: {} });
      comment.push({ text: '\n\n', attributes: {} });
      comment.push({ text: '⚠️ COST ABSORPTION: We are covering product + shipping cost. Customer keeps Original pads.', attributes: { italic: true } });
      comment.push({ text: '\n', attributes: {} });
    } else if (caseData.resolution === 'full_refund_quality') {
      comment.push({ text: '✅ ACTION STEPS:', attributes: { bold: true } });
      comment.push({ text: '\n', attributes: {} });
      comment.push({ text: '1. Process full refund in Shopify', attributes: {} });
      comment.push({ text: '\n', attributes: {} });
      comment.push({ text: '2. Send refund confirmation email', attributes: {} });
      comment.push({ text: '\n', attributes: {} });
      comment.push({ text: '3. Close ticket', attributes: {} });
      comment.push({ text: '\n\n', attributes: {} });
      comment.push({ text: '⚠️ NOTE: Customer declined free Enhanced reship. No return needed - customer keeps Original pads.', attributes: { italic: true } });
      comment.push({ text: '\n', attributes: {} });
    }
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
      `I used your online resolution center and would like to return my order for a refund.`,
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
      `Through the resolution center, I was told that once you receive and inspect my return, I'll get a full refund${refundAmountStr ? ` of ${refundAmountStr}` : ''}.`,
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
      `I used your online resolution center and wanted to follow up on my case.`,
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
      `Through the resolution center, I was offered a ${formattedResolution.toLowerCase()}${refundAmountStr ? ` of ${refundAmountStr}` : ''} which I've accepted.`,
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
      `I used your online resolution center regarding an issue with the delivery of my order.`,
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
      `Through the resolution center, we agreed on: ${formattedResolution}${refundAmountStr ? ` (${refundAmountStr})` : ''}.`,
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
    // Build action text with pause duration if applicable
    let actionText = 'make changes to my subscription';
    if (caseData.actionType === 'pause') {
      if (caseData.pauseDuration) {
        actionText = `pause my subscription for ${caseData.pauseDuration} days`;
      } else {
        actionText = 'pause my subscription';
      }
    } else if (caseData.actionType === 'cancel') {
      actionText = 'cancel my subscription';
    } else if (caseData.actionType === 'changeSchedule') {
      actionText = 'change my delivery schedule';
    } else if (caseData.actionType === 'changeAddress') {
      actionText = 'update my shipping address';
    }

    // Build resolution text with pause details
    let resolutionText = formattedResolution;
    if (caseData.actionType === 'pause' && caseData.pauseDuration) {
      resolutionText = `subscription paused for ${caseData.pauseDuration} days`;
      if (caseData.pauseResumeDate) {
        const resumeDate = new Date(caseData.pauseResumeDate);
        resolutionText += ` (resumes ${resumeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`;
      }
    }

    // Use clientOrderId if orderNumber not available
    const orderDisplay = caseData.orderNumber || caseData.clientOrderId || 'N/A';

    messageParts.push(
      'Hi there,',
      '',
      `I used your online resolution center and would like to ${actionText}.`,
      '',
      `Reason: ${orderIssue}`,
      '',
      `My details:`,
      `• Order: ${orderDisplay}`,
      `• Case ID: ${caseId}`
    );
    if (caseData.purchaseId) messageParts.push(`• Subscription ID: ${caseData.purchaseId} (Purchase ID)`);
    if (caseData.subscriptionProductName) messageParts.push(`• Product: ${caseData.subscriptionProductName}`);
    messageParts.push(
      '',
      `Through the resolution center, the agreed action is: ${resolutionText}${refundAmountStr ? ` (${refundAmountStr})` : ''}.`,
      '',
      'Thanks!',
      '',
      firstName
    );
  }
  // QUALITY DIFFERENCE CASES - Custom messages based on resolution
  else if (caseData.issueType === 'quality_difference') {
    const qd = caseData.qualityDetails || {};
    const padCount = qd.padCount || 'my';
    const upgradeTotal = qd.upgradeTotal ? `$${qd.upgradeTotal}` : 'the difference';

    if (caseData.resolution === 'upgrade_keep_originals') {
      // Branch 2A: Used items - keep originals + pay for enhanced
      messageParts.push(
        'Hi there,',
        '',
        `I used your online resolution center about a quality difference I noticed in my PuppyPads.`,
        '',
        `After chatting with your support, I understand there are two versions (Original and Enhanced) and I'd like to upgrade to the Enhanced version.`,
        '',
        `I have ${padCount} Original pads that I've already used, so I can't return them. I was told I could keep them AND pay just the $20 difference per pad for the Enhanced ones.`,
        '',
        `So that's ${upgradeTotal} for ${padCount} Enhanced PuppyPads.`,
        '',
        `Please send me the checkout link when it's ready!`,
        '',
        `My order number is ${caseData.orderNumber || 'N/A'} and my case reference is ${caseId}.`,
        '',
        'Thanks!',
        '',
        firstName
      );
    } else if (caseData.resolution === 'return_upgrade_enhanced') {
      // Branch 2B: Unused items - return + pay for enhanced
      messageParts.push(
        'Hi there,',
        '',
        `I used your online resolution center about a quality difference I noticed in my PuppyPads.`,
        '',
        `I'd like to return my ${padCount} unused Original pads and upgrade to the Enhanced version.`,
        '',
        `I was given your return address and I'll arrange shipping myself. I'll send you the tracking number once I've shipped it.`,
        '',
        `Then I'll pay the ${upgradeTotal} difference ($20 per pad) for the Enhanced ones.`,
        '',
        `My order number is ${caseData.orderNumber || 'N/A'} and my case reference is ${caseId}.`,
        '',
        'Thanks!',
        '',
        firstName
      );
    } else if (caseData.resolution === 'reship_quality_upgrade') {
      // Branch 3A: Accepted free reship of enhanced
      messageParts.push(
        'Hi there,',
        '',
        `I used your online resolution center about a quality difference I noticed in my PuppyPads.`,
        '',
        `I wasn't fully satisfied with the Original materials, but your support team offered to ship me the Enhanced version for free, and I've accepted that offer.`,
        '',
        `I understand I can keep what I already have, and you'll send the Enhanced pads at no cost.`,
        '',
        'Thank you for making this right!',
        '',
        `My order number is ${caseData.orderNumber || 'N/A'} and my case reference is ${caseId}.`,
        '',
        'Thanks!',
        '',
        firstName
      );
    } else if (caseData.resolution === 'full_refund_quality') {
      // Branch 3B: Still want refund
      messageParts.push(
        'Hi there,',
        '',
        `I used your online resolution center about a quality difference I noticed in my PuppyPads.`,
        '',
        `I was offered a free reship of the Enhanced version, but I'd prefer a refund instead.`,
        '',
        `I understand I can keep what I already have.`,
        '',
        `My order number is ${caseData.orderNumber || 'N/A'} and my case reference is ${caseId}.`,
        '',
        'Thanks!',
        '',
        firstName
      );
    } else {
      // Generic quality difference fallback
      messageParts.push(
        'Hi there,',
        '',
        `I used your online resolution center about a quality difference I noticed in my PuppyPads.`,
        '',
        `My order number is ${caseData.orderNumber || 'N/A'} and my case reference is ${caseId}.`,
        '',
        `Through the resolution center, we agreed on: ${formattedResolution}.`,
        '',
        'Thanks!',
        '',
        firstName
      );
    }
  }
  // DEFAULT/MANUAL CASE
  else {
    messageParts.push(
      'Hi there,',
      '',
      `I used your online resolution center and need some help with my order.`,
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
      messageParts.push(`Through the resolution center, the agreed resolution is: ${formattedResolution}${refundAmountStr ? ` (${refundAmountStr})` : ''}`, '');
    }
    messageParts.push(
      'Please let me know if you need any more information.',
      '',
      'Thanks!',
      '',
      firstName
    );
  }

  // Join message parts, converting to HTML for proper Richpanel rendering
  // Empty strings become blank lines (<br><br> for paragraph spacing)
  const plainText = messageParts
    .filter(part => part !== null && part !== undefined)
    .join('\n')
    .trim();

  // Convert newlines to HTML breaks for Richpanel
  return plainText.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
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
  // Use quality_difference SOP if that's the issue type, otherwise use case type
  const sopUrl = caseData.issueType === 'quality_difference'
    ? SOP_URLS.quality_difference
    : (SOP_URLS[caseData.caseType] || SOP_URLS.manual);
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

  // Build missing item-specific details HTML
  let missingItemDetailsHtml = '';
  if (caseData.missingItemOrderList || caseData.missingItemDescription) {
    missingItemDetailsHtml = `
<br>
<b>─────────────────────</b><br>
<br>
<b>📦 MISSING ITEM DETAILS</b><br>
<br>
${caseData.missingItemOrderList ? `<b>What Customer Should Have Received:</b><br>${caseData.missingItemOrderList}<br><br>` : ''}
${caseData.missingItemDescription ? `<b>What Customer Says Is Missing:</b><br>${caseData.missingItemDescription}<br>` : ''}
`;
  }

  // Build quality difference-specific details HTML
  let qualityDetailsHtml = '';
  if (caseData.issueType === 'quality_difference' && caseData.qualityDetails) {
    const qd = caseData.qualityDetails;
    const resolution = caseData.resolution;

    let statusNote = '';
    if (resolution === 'upgrade_keep_originals') {
      statusNote = '⚠️ Customer has USED Original pads - they keep them + pay for Enhanced';
    } else if (resolution === 'return_upgrade_enhanced') {
      statusNote = '📦 Customer will RETURN unused Originals + pay for Enhanced';
    } else if (resolution === 'reship_quality_upgrade') {
      statusNote = '🎁 FREE RESHIP - Customer accepted free Enhanced pads';
    } else if (resolution === 'full_refund_quality') {
      statusNote = '💰 Customer declined free reship - wants refund instead';
    }

    qualityDetailsHtml = `
<br>
<b>─────────────────────</b><br>
<br>
<b>🔄 QUALITY UPGRADE DETAILS</b><br>
<br>
${statusNote ? `<b>${statusNote}</b><br><br>` : ''}
${qd.padCount ? `<b>Number of Pads:</b> ${qd.padCount}<br>` : ''}
${qd.itemsUsed !== undefined ? `<b>Items Status:</b> ${qd.itemsUsed ? 'USED (keeping)' : 'UNUSED (returning)'}<br>` : ''}
${qd.upgradeTotal ? `<b>Upgrade Cost:</b> $${qd.upgradeTotal} ($20 × ${qd.padCount} pads)<br>` : ''}
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
${missingItemDetailsHtml}
${qualityDetailsHtml}
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
    // Check if it's a missing item refund
    if (resolution === 'refund_missing_item') {
      return `1. ✅ Review customer's photos and description below<br>2. ✅ Calculate refund based on missing items (check bundle pricing)<br>3. ✅ Process partial refund in Shopify<br>4. ✅ Send refund confirmation email<br>5. ✅ Close ticket`;
    }
    return `1. ✅ Verify order in Shopify<br>2. ✅ Process partial refund: $${caseData.refundAmount || 'TBD'}<br>3. ✅ Send refund confirmation email<br>4. ✅ Close ticket`;
  }

  if (type === 'return') {
    return `1. ✅ Verify order is within return window<br>2. ✅ Send return label to customer<br>3. ⏳ Wait for return to arrive<br>4. ✅ Process refund once received<br>5. ✅ Close ticket`;
  }

  if (type === 'shipping') {
    // Check if it's a missing item case
    if (resolution === 'reship_missing_item_bonus') {
      return `1. ✅ Review customer's photos and description below<br>2. ✅ Verify what items are missing<br>3. ✅ Create reship order with missing items + bonus item<br>4. ✅ Send tracking to customer<br>5. ✅ Close ticket`;
    }
    return `1. ✅ Check tracking status in ParcelPanel<br>2. ✅ Contact carrier if needed<br>3. ✅ Update customer on status<br>4. ✅ Close ticket when resolved`;
  }

  if (type === 'subscription') {
    return `1. ✅ Verify subscription in CheckoutChamp<br>2. ✅ Process requested change: ${resolution || 'N/A'}<br>3. ✅ Confirm change with customer<br>4. ✅ Close ticket`;
  }

  // Quality difference specific action steps
  if (caseData.issueType === 'quality_difference') {
    const qd = caseData.qualityDetails || {};
    const padCount = qd.padCount || 'X';
    const upgradeTotal = qd.upgradeTotal || 'TBD';

    if (resolution === 'upgrade_keep_originals') {
      return `1. ✅ Generate custom checkout link for $${upgradeTotal}<br>2. ✅ Send checkout link to customer email<br>3. ⏳ Wait for payment<br>4. ✅ Ship ${padCount} Enhanced PuppyPads<br>5. ✅ Send tracking confirmation<br>6. ✅ Close ticket<br><br>⚠️ Customer keeps Original pads - we're absorbing cost for satisfaction`;
    }
    if (resolution === 'return_upgrade_enhanced') {
      return `1. ⏳ Wait for customer to ship return<br>2. ⏳ Customer will provide tracking number<br>3. ✅ Once tracking received, generate checkout link for $${upgradeTotal}<br>4. ✅ Send checkout link to customer<br>5. ⏳ Wait for payment<br>6. ✅ Ship ${padCount} Enhanced PuppyPads<br>7. ✅ Close ticket when delivered`;
    }
    if (resolution === 'reship_quality_upgrade') {
      return `1. ✅ Ship ${padCount} Enhanced PuppyPads (FREE - no charge)<br>2. ✅ Send tracking to customer<br>3. ✅ Close ticket once delivered<br><br>⚠️ We're covering product + shipping cost. Customer keeps Original pads.`;
    }
    if (resolution === 'full_refund_quality') {
      return `1. ✅ Calculate refund amount (check discounts applied)<br>2. ✅ Process refund in Shopify<br>3. ✅ Send refund confirmation email<br>4. ✅ Close ticket<br><br>⚠️ Customer declined free PuppyPad 2.0 reship. No return needed - customer keeps Original pads.`;
    }
    if (resolution === 'full_refund_quality_used') {
      return `1. ✅ Verify customer reported quantity: ${padCount} Original pad(s)<br>2. ✅ Check order for any discounts applied<br>3. ✅ Calculate fair refund amount for Original pads<br>4. ✅ Process refund in Shopify<br>5. ✅ Send refund confirmation email<br>6. ✅ Close ticket<br><br>⚠️ USED ITEMS - No return needed. Customer keeps Original pads.`;
    }
    if (resolution === 'full_refund_quality_return') {
      return `1. ⏳ Wait for customer to ship return<br>2. ⏳ Customer will provide tracking number<br>3. ⏳ Wait to receive ${padCount} Original pad(s)<br>4. ✅ Verify returned items<br>5. ✅ Check order for any discounts applied<br>6. ✅ Calculate fair refund amount<br>7. ✅ Process refund in Shopify<br>8. ✅ Send refund confirmation email<br>9. ✅ Close ticket`;
    }
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
    // Check if it's a missing item refund
    if (resolution === 'refund_missing_item') {
      return `
1. ✅ Review customer's photos and description below
2. ✅ Calculate refund based on missing items (check bundle pricing)
3. ✅ Process partial refund in Shopify
4. ✅ Send refund confirmation email
5. ✅ Close ticket`;
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
    // Check if it's a missing item case
    if (resolution === 'reship_missing_item_bonus') {
      return `
1. ✅ Review customer's photos and description below
2. ✅ Verify what items are missing
3. ✅ Create reship order with missing items + bonus item
4. ✅ Send tracking to customer
5. ✅ Close ticket`;
    }
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
    const data = await request.json();

    // Convert undefined to null (D1 doesn't support undefined)
    const sessionId = data.sessionId ?? null;
    const flowType = data.flowType ?? null;
    const customerEmail = data.customerEmail ?? null;
    const customerName = data.customerName ?? null;
    const orderNumber = data.orderNumber ?? null;
    const persona = data.persona ?? null;
    const deviceType = data.deviceType ?? null;
    const sessionReplayUrl = data.sessionReplayUrl ?? null;
    const issueType = data.issueType ?? null;
    const completed = data.completed;
    const ended = data.ended;

    if (ended) {
      // Update existing session when it ends
      await env.ANALYTICS_DB.prepare(`
        UPDATE sessions SET
          ended_at = CURRENT_TIMESTAMP,
          completed = ?,
          flow_type = COALESCE(?, flow_type),
          session_replay_url = COALESCE(?, session_replay_url),
          customer_email = COALESCE(?, customer_email),
          customer_name = COALESCE(?, customer_name),
          order_number = COALESCE(?, order_number),
          issue_type = COALESCE(?, issue_type)
        WHERE session_id = ?
      `).bind(
        completed ? 1 : 0,
        flowType,
        sessionReplayUrl,
        customerEmail,
        customerName,
        orderNumber,
        issueType,
        sessionId
      ).run();
    } else {
      // Insert or update session (upsert)
      await env.ANALYTICS_DB.prepare(`
        INSERT INTO sessions (session_id, flow_type, customer_email, customer_name, order_number, persona, device_type, session_replay_url, issue_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(session_id) DO UPDATE SET
          flow_type = COALESCE(excluded.flow_type, flow_type),
          customer_email = COALESCE(excluded.customer_email, customer_email),
          customer_name = COALESCE(excluded.customer_name, customer_name),
          order_number = COALESCE(excluded.order_number, order_number),
          session_replay_url = COALESCE(excluded.session_replay_url, session_replay_url),
          issue_type = COALESCE(excluded.issue_type, issue_type)
      `).bind(sessionId, flowType, customerEmail, customerName, orderNumber, persona, deviceType, sessionReplayUrl, issueType).run();
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

// Handle trouble report submissions (users having issues with the app)
async function handleTroubleReport(request, env, corsHeaders) {
  try {
    const data = await request.json();

    const {
      name,
      email,
      description,
      sessionId,
      currentStep,
      customerEmail,
      orderData,
      browser,
      timestamp,
      sessionReplayUrl
    } = data;

    // Generate a reference ID for the report
    const reportId = 'TR-' + Date.now().toString(36).toUpperCase();

    // Create Richpanel conversation so team can respond to customer via email
    let richpanelResult = null;
    if (env.RICHPANEL_API_KEY && email) {
      try {
        richpanelResult = await createTroubleReportRichpanelEntry(env, {
          name,
          email,
          description,
          sessionId,
          currentStep,
          browser,
          sessionReplayUrl
        }, reportId);
      } catch (richpanelError) {
        console.error('Richpanel error:', richpanelError);
      }
    }

    // Log to analytics database
    try {
      await env.ANALYTICS_DB.prepare(`
        INSERT INTO trouble_reports (
          report_id, name, email, description,
          session_id, current_step, browser, session_replay_url,
          richpanel_conversation_no, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        reportId,
        name,
        email,
        description,
        sessionId || null,
        currentStep || null,
        browser || null,
        sessionReplayUrl || null,
        richpanelResult?.conversationNo || null
      ).run();
    } catch (dbError) {
      // Table might not exist yet or columns missing - that's okay, try basic insert
      console.log('Trouble reports table issue:', dbError.message);
      try {
        await env.ANALYTICS_DB.prepare(`
          INSERT INTO trouble_reports (
            report_id, name, email, description,
            session_id, current_step, browser, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          reportId,
          name,
          email,
          description,
          sessionId || null,
          currentStep || null,
          browser || null
        ).run();
      } catch (dbError2) {
        console.log('Basic insert also failed:', dbError2.message);
      }
    }

    const taskDescription = `
**TROUBLE REPORT: ${reportId}**

A customer reported an issue using the resolution app.

---

**Customer Details:**
• Name: ${name}
• Email: ${email}

**What went wrong:**
${description}

**Technical Info:**
• Session ID: ${sessionId || 'N/A'}
• Current Step: ${currentStep || 'N/A'}
• Browser: ${browser || 'N/A'}
• Timestamp: ${timestamp || new Date().toISOString()}
${sessionReplayUrl ? `• Session Recording: ${sessionReplayUrl}` : ''}
${richpanelResult?.conversationNo ? `• Richpanel Conversation: https://app.richpanel.com/conversations?viewId=search&conversationNo=${richpanelResult.conversationNo}` : ''}

---

**Action Required:**
1. Respond to customer via Richpanel conversation
2. If this is a bug, report it to the dev team
3. Help the customer complete their resolution manually if needed
`;

    // Create task in ClickUp (use manual help list)
    let clickupTaskId = null;
    if (env.CLICKUP_API_KEY) {
      try {
        const clickupResponse = await fetch('https://api.clickup.com/api/v2/list/901105691498/task', {
          method: 'POST',
          headers: {
            'Authorization': env.CLICKUP_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: `[TROUBLE REPORT] ${name} - App Issue`,
            description: taskDescription,
            priority: 2, // High priority
            tags: ['trouble-report', 'app-issue'],
            custom_fields: [
              { id: 'f5e59891-0237-4d5b-806b-80bcb2c87936', value: reportId },
              { id: '3db1a193-4548-49b2-a498-b4ed44cce69a', value: email }
            ]
          })
        });

        if (!clickupResponse.ok) {
          console.error('ClickUp task creation failed:', await clickupResponse.text());
        } else {
          const clickupResult = await clickupResponse.json();
          clickupTaskId = clickupResult.id;

          // Update ClickUp with Richpanel conversation URL
          if (richpanelResult?.conversationNo && clickupTaskId) {
            await updateClickUpWithConversationUrl(env, clickupTaskId, richpanelResult.conversationNo);
          }
        }
      } catch (clickupError) {
        console.error('ClickUp error:', clickupError);
      }
    }

    return Response.json({
      success: true,
      reportId: reportId,
      message: 'Report submitted successfully',
      richpanelConversationNo: richpanelResult?.conversationNo || null
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Trouble report error:', error);
    return Response.json({
      success: false,
      error: 'Failed to submit report'
    }, { status: 500, headers: corsHeaders });
  }
}

// Create Richpanel entry for trouble reports
async function createTroubleReportRichpanelEntry(env, reportData, reportId) {
  const testMode = isTestMode(env);
  const fromEmail = testMode
    ? RICHPANEL_CONFIG.testEmail
    : (reportData.email || RICHPANEL_CONFIG.testEmail);

  const customerName = reportData.name || 'Customer';
  const nameParts = customerName.split(' ');
  const firstName = nameParts[0] || 'Customer';
  const lastName = nameParts.slice(1).join(' ') || '';

  const subject = `${reportId} - Help Request - Resolution App`;

  // Build customer message (simulated email from customer - sounds natural)
  const testNotice = testMode
    ? '[TEST MODE - This is not a real customer request]<br><br>'
    : '';

  const customerMessage = `${testNotice}Hi,<br><br>
I need some help with my order. I was trying to use the Resolution Center but ran into a problem.<br><br>
${(reportData.description || 'No description provided').replace(/\n/g, '<br>')}<br><br>
Could you please help me sort this out?<br><br>
Thanks,<br>
${firstName}`;

  try {
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
            firstName: firstName,
            lastName: lastName
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
      console.error('Richpanel API error for trouble report:', response.status, errorText);
      return { success: false, error: `Richpanel API error: ${response.status}` };
    }

    const result = await response.json();
    const ticketId = result.id || result.ticket?.id;
    const conversationNo = result.conversationNo ||
                           result.ticket?.conversationNo ||
                           result.conversation_no ||
                           result.ticket?.conversation_no ||
                           result.ticketNumber ||
                           result.ticket?.ticketNumber;

    // Add private note with action steps
    if (ticketId) {
      await createTroubleReportPrivateNote(env, ticketId, reportData, reportId);
    }

    console.log('Richpanel trouble report created:', { reportId, ticketId, conversationNo });

    return {
      success: true,
      ticketId,
      conversationNo,
      conversationUrl: conversationNo ? `https://app.richpanel.com/conversations?viewId=search&conversationNo=${conversationNo}` : null
    };
  } catch (error) {
    console.error('Richpanel trouble report error:', error);
    return { success: false, error: error.message };
  }
}

async function createTroubleReportPrivateNote(env, ticketId, reportData, reportId) {
  const sopUrl = SOP_URLS.trouble_report;

  const noteContent = `
<b>⚠️ TROUBLE REPORT: ${reportId}</b><br>
<br>
Customer reported an issue using the Resolution App and needs manual assistance.<br>
<br>
<b>─────────────────────</b><br>
<br>
<b>Issue Description:</b><br>
${(reportData.description || 'No description provided').replace(/\n/g, '<br>')}<br>
<br>
<b>─────────────────────</b><br>
<br>
<b>Action Steps:</b><br>
1. ✅ Respond to customer and understand what they need<br>
2. ✅ Help them complete their resolution manually if needed<br>
3. ✅ If this is a bug, notify the dev team<br>
4. ✅ Close ticket once resolved<br>
<br>
<b>─────────────────────</b><br>
<br>
<b>Technical Info:</b><br>
• Session ID: ${reportData.sessionId || 'N/A'}<br>
• Current Step: ${reportData.currentStep || 'Unknown'}<br>
${reportData.sessionReplayUrl ? `<br>🎥 <b>Session Recording:</b> <a href="${reportData.sessionReplayUrl}">${reportData.sessionReplayUrl}</a><br>` : ''}
<br>
<b>SOP:</b> <a href="${sopUrl}">${sopUrl}</a>
`.trim();

  try {
    await fetch(`https://api.richpanel.com/v1/tickets/${ticketId}`, {
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
    });
  } catch (error) {
    console.error('Failed to create trouble report private note:', error);
  }
}

// Log case creation (called from handleCreateCase)
async function logCaseToAnalytics(env, caseData) {
  // Build customer name from first/last name if not directly provided
  let customerName = caseData.customerName;
  if (!customerName && caseData.customerFirstName) {
    customerName = caseData.customerFirstName;
    if (caseData.customerLastName) {
      customerName += ' ' + caseData.customerLastName;
    }
  }

  // Build extra_data JSON with all additional fields
  const extraData = JSON.stringify({
    // Subscription fields
    actionType: caseData.actionType || null,
    purchaseId: caseData.purchaseId || null,
    clientOrderId: caseData.clientOrderId || null,
    subscriptionProductName: caseData.subscriptionProductName || null,
    subscriptionStatus: caseData.subscriptionStatus || null,
    pauseDuration: caseData.pauseDuration || null,
    pauseResumeDate: caseData.pauseResumeDate || null,
    cancelReason: caseData.cancelReason || null,
    discountPercent: caseData.discountPercent || null,
    newFrequency: caseData.newFrequency || null, // For schedule changes
    previousFrequency: caseData.previousFrequency || null, // For schedule changes
    newAddress: caseData.newAddress || null, // For address changes
    // Other fields
    intentDetails: caseData.intentDetails || null,
    keepProduct: caseData.keepProduct,
    issueType: caseData.issueType || null,
    qualityDetails: caseData.qualityDetails || null,
    correctedAddress: caseData.correctedAddress || null,
    notes: caseData.notes || null,
  });

  // Try full insert first with extra_data, fall back to basic insert if columns don't exist
  try {
    await env.ANALYTICS_DB.prepare(`
      INSERT INTO cases (
        case_id, case_type, resolution, customer_email, customer_name,
        order_number, refund_amount, status, session_id,
        clickup_task_id, clickup_task_url, session_replay_url,
        order_url, order_date, richpanel_conversation_no, extra_data, issue_type, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      caseData.caseId,
      caseData.caseType,
      caseData.resolution,
      caseData.email,
      customerName || null,
      caseData.orderNumber,
      caseData.refundAmount || null,
      'pending',
      caseData.sessionId || null,
      caseData.clickupTaskId || null,
      caseData.clickupTaskUrl || null,
      caseData.sessionReplayUrl || null,
      caseData.orderUrl || null,
      caseData.orderDate || null,
      caseData.richpanelConversationNo || null,
      extraData,
      caseData.issueType || null
    ).run();
    console.log('Case saved to database (full with extra_data):', caseData.caseId);
    return;
  } catch (e) {
    console.log('Full insert failed, trying without extra_data:', e.message);
  }

  // Try insert without extra_data column
  try {
    await env.ANALYTICS_DB.prepare(`
      INSERT INTO cases (
        case_id, case_type, resolution, customer_email, customer_name,
        order_number, refund_amount, status, session_id,
        clickup_task_id, clickup_task_url, session_replay_url,
        order_url, order_date, richpanel_conversation_no, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      caseData.caseId,
      caseData.caseType,
      caseData.resolution,
      caseData.email,
      customerName || null,
      caseData.orderNumber,
      caseData.refundAmount || null,
      'pending',
      caseData.sessionId || null,
      caseData.clickupTaskId || null,
      caseData.clickupTaskUrl || null,
      caseData.sessionReplayUrl || null,
      caseData.orderUrl || null,
      caseData.orderDate || null,
      caseData.richpanelConversationNo || null
    ).run();
    console.log('Case saved to database (full):', caseData.caseId);
    return;
  } catch (e) {
    console.log('Full insert failed, trying basic insert:', e.message);
  }

  // Fallback: basic insert with only core columns
  try {
    await env.ANALYTICS_DB.prepare(`
      INSERT INTO cases (
        case_id, case_type, resolution, customer_email, customer_name,
        order_number, refund_amount, status, session_id,
        clickup_task_id, clickup_task_url, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      caseData.caseId,
      caseData.caseType,
      caseData.resolution,
      caseData.email,
      customerName || null,
      caseData.orderNumber,
      caseData.refundAmount || null,
      'pending',
      caseData.sessionId || null,
      caseData.clickupTaskId || null,
      caseData.clickupTaskUrl || null
    ).run();
    console.log('Case saved to database (basic):', caseData.caseId);
    return;
  } catch (e2) {
    console.log('Basic insert failed, trying minimal insert:', e2.message);
  }

  // Final fallback: minimal columns only
  try {
    await env.ANALYTICS_DB.prepare(`
      INSERT INTO cases (case_id, case_type, resolution, customer_email, order_number, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      caseData.caseId,
      caseData.caseType,
      caseData.resolution,
      caseData.email,
      caseData.orderNumber,
      'pending'
    ).run();
    console.log('Case saved to database (minimal):', caseData.caseId);
  } catch (e3) {
    console.error('All case insert attempts failed:', e3.message);
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

    // Check if account is active
    if (user.is_active === 0) {
      return Response.json({ success: false, error: 'Account is disabled. Contact an administrator.' }, { status: 403, headers: corsHeaders });
    }

    // Update last login
    await env.ANALYTICS_DB.prepare(`
      UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(user.id).run();

    const token = await generateToken(username);

    return Response.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        mustChangePassword: user.must_change_password === 1
      }
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
// USER MANAGEMENT (Admin Only)
// ============================================

// Helper: Verify token and get user with role
async function verifyAuthAndGetUser(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized', status: 401 };
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token);
  if (!payload) {
    return { error: 'Invalid or expired token', status: 401 };
  }

  // Get user details from database
  const user = await env.ANALYTICS_DB.prepare(`
    SELECT id, username, name, role, is_active FROM admin_users WHERE username = ?
  `).bind(payload.username).first();

  if (!user) {
    return { error: 'User not found', status: 401 };
  }

  if (user.is_active === 0) {
    return { error: 'Account is disabled', status: 403 };
  }

  return { user };
}

// Helper: Verify admin role
async function verifyAdmin(request, env) {
  const result = await verifyAuthAndGetUser(request, env);
  if (result.error) return result;

  if (result.user.role !== 'admin') {
    return { error: 'Admin access required', status: 403 };
  }

  return result;
}

// Helper: Log audit event
async function logAudit(env, userId, userEmail, userName, actionType, actionCategory, resourceType, resourceId, details, oldValue, newValue, request) {
  try {
    const ip = request?.headers?.get('CF-Connecting-IP') || request?.headers?.get('X-Forwarded-For') || 'unknown';
    const ua = request?.headers?.get('User-Agent') || 'unknown';

    await env.ANALYTICS_DB.prepare(`
      INSERT INTO audit_log (user_id, user_email, user_name, action_type, action_category, resource_type, resource_id, details, old_value, new_value, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId, userEmail, userName, actionType, actionCategory, resourceType, resourceId,
      details ? JSON.stringify(details) : null,
      oldValue, newValue, ip, ua
    ).run();
  } catch (e) {
    console.error('Audit log error:', e);
  }
}

// List all users (Admin only)
async function handleListUsers(request, env, corsHeaders) {
  const auth = await verifyAdmin(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const users = await env.ANALYTICS_DB.prepare(`
      SELECT id, username, name, role, is_active, must_change_password, created_at, last_login, last_activity_at,
             (SELECT name FROM admin_users WHERE id = admin_users.created_by) as created_by_name
      FROM admin_users
      ORDER BY created_at DESC
    `).all();

    return Response.json({ success: true, users: users.results || [] }, { headers: corsHeaders });
  } catch (e) {
    console.error('List users error:', e);
    return Response.json({ error: 'Failed to list users' }, { status: 500, headers: corsHeaders });
  }
}

// Create new user (Admin only)
async function handleCreateUser(request, env, corsHeaders) {
  const auth = await verifyAdmin(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const { username, name, role, password } = await request.json();

    if (!username || !name || !password) {
      return Response.json({ error: 'Username, name, and password are required' }, { status: 400, headers: corsHeaders });
    }

    // Validate role
    const validRoles = ['admin', 'user'];
    if (!validRoles.includes(role)) {
      return Response.json({ error: 'Invalid role. Must be admin or user' }, { status: 400, headers: corsHeaders });
    }

    // Check if username exists
    const existing = await env.ANALYTICS_DB.prepare(`
      SELECT id FROM admin_users WHERE username = ?
    `).bind(username).first();

    if (existing) {
      return Response.json({ error: 'Username already exists' }, { status: 400, headers: corsHeaders });
    }

    const passwordHash = await hashPassword(password);

    // Create user
    await env.ANALYTICS_DB.prepare(`
      INSERT INTO admin_users (username, password_hash, name, role, is_active, must_change_password, created_by)
      VALUES (?, ?, ?, ?, 1, 1, ?)
    `).bind(username, passwordHash, name, role, auth.user.id).run();

    // Log audit
    await logAudit(env, auth.user.id, auth.user.username, auth.user.name, 'user_created', 'users', 'user', username, { name, role }, null, username, request);

    return Response.json({
      success: true,
      message: `User '${username}' created successfully. They will be prompted to change their password on first login.`
    }, { headers: corsHeaders });
  } catch (e) {
    console.error('Create user error:', e);
    return Response.json({ error: 'Failed to create user: ' + e.message }, { status: 500, headers: corsHeaders });
  }
}

// Update user (Admin only)
async function handleUpdateUser(request, env, corsHeaders) {
  const auth = await verifyAdmin(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const { userId, name, role, is_active, resetPassword } = await request.json();

    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400, headers: corsHeaders });
    }

    // Get current user data
    const currentUser = await env.ANALYTICS_DB.prepare(`
      SELECT * FROM admin_users WHERE id = ?
    `).bind(userId).first();

    if (!currentUser) {
      return Response.json({ error: 'User not found' }, { status: 404, headers: corsHeaders });
    }

    // Prevent deactivating yourself
    if (userId === auth.user.id && is_active === false) {
      return Response.json({ error: 'Cannot deactivate your own account' }, { status: 400, headers: corsHeaders });
    }

    // Build update query
    const updates = [];
    const values = [];
    const changes = {};

    if (name !== undefined && name !== currentUser.name) {
      updates.push('name = ?');
      values.push(name);
      changes.name = { old: currentUser.name, new: name };
    }

    if (role !== undefined && role !== currentUser.role) {
      const validRoles = ['admin', 'user'];
      if (!validRoles.includes(role)) {
        return Response.json({ error: 'Invalid role' }, { status: 400, headers: corsHeaders });
      }
      updates.push('role = ?');
      values.push(role);
      changes.role = { old: currentUser.role, new: role };
    }

    if (is_active !== undefined && is_active !== currentUser.is_active) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
      changes.is_active = { old: currentUser.is_active, new: is_active };
    }

    if (resetPassword) {
      // Generate a temporary password
      const tempPassword = 'temp' + Math.random().toString(36).substring(2, 10);
      const passwordHash = await hashPassword(tempPassword);
      updates.push('password_hash = ?');
      updates.push('must_change_password = 1');
      values.push(passwordHash);
      changes.password = { reset: true, tempPassword };
    }

    if (updates.length === 0) {
      return Response.json({ error: 'No changes provided' }, { status: 400, headers: corsHeaders });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    await env.ANALYTICS_DB.prepare(`
      UPDATE admin_users SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    // Log audit
    await logAudit(env, auth.user.id, auth.user.username, auth.user.name, 'user_updated', 'users', 'user', currentUser.username, changes, JSON.stringify(currentUser), null, request);

    const response = { success: true, message: 'User updated successfully' };
    if (resetPassword && changes.password) {
      response.tempPassword = changes.password.tempPassword;
      response.message += `. Temporary password: ${changes.password.tempPassword}`;
    }

    return Response.json(response, { headers: corsHeaders });
  } catch (e) {
    console.error('Update user error:', e);
    return Response.json({ error: 'Failed to update user: ' + e.message }, { status: 500, headers: corsHeaders });
  }
}

// Delete user (Admin only)
async function handleDeleteUser(request, env, corsHeaders) {
  const auth = await verifyAdmin(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();

    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400, headers: corsHeaders });
    }

    // Prevent deleting yourself
    if (parseInt(userId) === auth.user.id) {
      return Response.json({ error: 'Cannot delete your own account' }, { status: 400, headers: corsHeaders });
    }

    // Get user for audit
    const user = await env.ANALYTICS_DB.prepare(`
      SELECT username, name FROM admin_users WHERE id = ?
    `).bind(userId).first();

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404, headers: corsHeaders });
    }

    await env.ANALYTICS_DB.prepare(`
      DELETE FROM admin_users WHERE id = ?
    `).bind(userId).run();

    // Log audit
    await logAudit(env, auth.user.id, auth.user.username, auth.user.name, 'user_deleted', 'users', 'user', user.username, { deletedUser: user.name }, user.username, null, request);

    return Response.json({ success: true, message: 'User deleted successfully' }, { headers: corsHeaders });
  } catch (e) {
    console.error('Delete user error:', e);
    return Response.json({ error: 'Failed to delete user: ' + e.message }, { status: 500, headers: corsHeaders });
  }
}

// Change own password
async function handleChangePassword(request, env, corsHeaders) {
  const auth = await verifyAuthAndGetUser(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!newPassword || newPassword.length < 6) {
      return Response.json({ error: 'New password must be at least 6 characters' }, { status: 400, headers: corsHeaders });
    }

    // If not must_change_password, verify current password
    const userFull = await env.ANALYTICS_DB.prepare(`
      SELECT password_hash, must_change_password FROM admin_users WHERE id = ?
    `).bind(auth.user.id).first();

    if (!userFull.must_change_password) {
      if (!currentPassword) {
        return Response.json({ error: 'Current password is required' }, { status: 400, headers: corsHeaders });
      }
      const currentHash = await hashPassword(currentPassword);
      if (currentHash !== userFull.password_hash) {
        return Response.json({ error: 'Current password is incorrect' }, { status: 400, headers: corsHeaders });
      }
    }

    const newPasswordHash = await hashPassword(newPassword);

    await env.ANALYTICS_DB.prepare(`
      UPDATE admin_users SET password_hash = ?, must_change_password = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(newPasswordHash, auth.user.id).run();

    // Log audit
    await logAudit(env, auth.user.id, auth.user.username, auth.user.name, 'password_changed', 'auth', 'user', auth.user.username, null, null, null, request);

    return Response.json({ success: true, message: 'Password changed successfully' }, { headers: corsHeaders });
  } catch (e) {
    console.error('Change password error:', e);
    return Response.json({ error: 'Failed to change password: ' + e.message }, { status: 500, headers: corsHeaders });
  }
}

// Get current user profile
async function handleGetProfile(request, env, corsHeaders) {
  const auth = await verifyAuthAndGetUser(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const user = await env.ANALYTICS_DB.prepare(`
      SELECT id, username, name, role, is_active, must_change_password, created_at, last_login
      FROM admin_users WHERE id = ?
    `).bind(auth.user.id).first();

    return Response.json({ success: true, user }, { headers: corsHeaders });
  } catch (e) {
    console.error('Get profile error:', e);
    return Response.json({ error: 'Failed to get profile' }, { status: 500, headers: corsHeaders });
  }
}

// ============================================
// AUDIT LOG (Admin Only)
// ============================================

async function handleGetAuditLog(request, env, corsHeaders) {
  const auth = await verifyAdmin(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const category = url.searchParams.get('category');
    const userId = url.searchParams.get('userId');
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM audit_log WHERE 1=1`;
    const params = [];

    if (category) {
      query += ` AND action_category = ?`;
      params.push(category);
    }

    if (userId) {
      query += ` AND user_id = ?`;
      params.push(userId);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const logs = await env.ANALYTICS_DB.prepare(query).bind(...params).all();

    // Get total count
    let countQuery = `SELECT COUNT(*) as count FROM audit_log WHERE 1=1`;
    const countParams = [];
    if (category) {
      countQuery += ` AND action_category = ?`;
      countParams.push(category);
    }
    if (userId) {
      countQuery += ` AND user_id = ?`;
      countParams.push(userId);
    }
    const total = await env.ANALYTICS_DB.prepare(countQuery).bind(...countParams).first();

    return Response.json({
      success: true,
      logs: logs.results || [],
      pagination: {
        page,
        limit,
        total: total?.count || 0,
        totalPages: Math.ceil((total?.count || 0) / limit)
      }
    }, { headers: corsHeaders });
  } catch (e) {
    console.error('Get audit log error:', e);
    return Response.json({ error: 'Failed to get audit log' }, { status: 500, headers: corsHeaders });
  }
}

// ============================================
// BULK ACTIONS
// ============================================

// Bulk update case status (no auth required - same as single case update)
async function handleBulkUpdateStatus(request, env, corsHeaders) {
  try {
    const { caseIds, status, actor, actor_email } = await request.json();

    if (!caseIds || !Array.isArray(caseIds) || caseIds.length === 0) {
      return Response.json({ error: 'Case IDs are required' }, { status: 400, headers: corsHeaders });
    }

    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400, headers: corsHeaders });
    }

    // Limit bulk operations
    if (caseIds.length > 100) {
      return Response.json({ error: 'Maximum 100 cases per bulk operation' }, { status: 400, headers: corsHeaders });
    }

    const actorName = actor || actor_email || 'team_member';
    const placeholders = caseIds.map(() => '?').join(',');
    const resolvedFields = status === 'completed' ? `, resolved_at = CURRENT_TIMESTAMP, resolved_by = ?` : '';
    const bindings = status === 'completed' ? [status, actorName, ...caseIds] : [status, ...caseIds];

    await env.ANALYTICS_DB.prepare(`
      UPDATE cases SET status = ?, updated_at = CURRENT_TIMESTAMP ${resolvedFields} WHERE case_id IN (${placeholders})
    `).bind(...bindings).run();

    return Response.json({
      success: true,
      message: `${caseIds.length} case(s) updated to ${status}`,
      updatedCount: caseIds.length
    }, { headers: corsHeaders });
  } catch (e) {
    console.error('Bulk update status error:', e);
    return Response.json({ error: 'Failed to update cases: ' + e.message }, { status: 500, headers: corsHeaders });
  }
}

// Bulk assign cases
async function handleBulkAssign(request, env, corsHeaders) {
  const auth = await verifyAdmin(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const { caseIds, assignToUserId } = await request.json();

    if (!caseIds || !Array.isArray(caseIds) || caseIds.length === 0) {
      return Response.json({ error: 'Case IDs are required' }, { status: 400, headers: corsHeaders });
    }

    if (caseIds.length > 100) {
      return Response.json({ error: 'Maximum 100 cases per bulk operation' }, { status: 400, headers: corsHeaders });
    }

    // Get assignee info
    let assigneeName = null;
    if (assignToUserId) {
      const assignee = await env.ANALYTICS_DB.prepare(`
        SELECT name FROM admin_users WHERE id = ? AND is_active = 1
      `).bind(assignToUserId).first();
      if (!assignee) {
        return Response.json({ error: 'Assignee not found or inactive' }, { status: 400, headers: corsHeaders });
      }
      assigneeName = assignee.name;
    }

    const placeholders = caseIds.map(() => '?').join(',');

    await env.ANALYTICS_DB.prepare(`
      UPDATE cases SET assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE case_id IN (${placeholders})
    `).bind(assigneeName, ...caseIds).run();

    // Update assignment queue load
    if (assignToUserId) {
      await env.ANALYTICS_DB.prepare(`
        UPDATE assignment_queue SET current_load = current_load + ?, last_assigned_at = CURRENT_TIMESTAMP WHERE user_id = ?
      `).bind(caseIds.length, assignToUserId).run();
    }

    // Log audit
    await logAudit(env, auth.user.id, auth.user.username, auth.user.name, 'bulk_assignment', 'cases', 'case', null,
      { caseIds, assignedTo: assigneeName, count: caseIds.length }, null, assigneeName, request);

    return Response.json({
      success: true,
      message: assigneeName ? `${caseIds.length} case(s) assigned to ${assigneeName}` : `${caseIds.length} case(s) unassigned`,
      updatedCount: caseIds.length
    }, { headers: corsHeaders });
  } catch (e) {
    console.error('Bulk assign error:', e);
    return Response.json({ error: 'Failed to assign cases: ' + e.message }, { status: 500, headers: corsHeaders });
  }
}

// Bulk add comment
async function handleBulkAddComment(request, env, corsHeaders) {
  const auth = await verifyAuthAndGetUser(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const { caseIds, comment } = await request.json();

    if (!caseIds || !Array.isArray(caseIds) || caseIds.length === 0) {
      return Response.json({ error: 'Case IDs are required' }, { status: 400, headers: corsHeaders });
    }

    if (!comment || comment.trim().length === 0) {
      return Response.json({ error: 'Comment is required' }, { status: 400, headers: corsHeaders });
    }

    if (caseIds.length > 50) {
      return Response.json({ error: 'Maximum 50 cases per bulk comment operation' }, { status: 400, headers: corsHeaders });
    }

    // Insert comments for each case
    for (const caseId of caseIds) {
      await env.ANALYTICS_DB.prepare(`
        INSERT INTO case_comments (case_id, author, author_email, comment)
        VALUES (?, ?, ?, ?)
      `).bind(caseId, auth.user.name, auth.user.username, comment.trim()).run();
    }

    // Log audit
    await logAudit(env, auth.user.id, auth.user.username, auth.user.name, 'bulk_comment', 'cases', 'case', null,
      { caseIds, commentPreview: comment.substring(0, 50), count: caseIds.length }, null, null, request);

    return Response.json({
      success: true,
      message: `Comment added to ${caseIds.length} case(s)`,
      updatedCount: caseIds.length
    }, { headers: corsHeaders });
  } catch (e) {
    console.error('Bulk add comment error:', e);
    return Response.json({ error: 'Failed to add comments: ' + e.message }, { status: 500, headers: corsHeaders });
  }
}

// Export cases to CSV
async function handleExportCases(request, env, corsHeaders) {
  const auth = await verifyAuthAndGetUser(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const { caseIds } = await request.json();

    let query = `SELECT * FROM cases`;
    const params = [];

    if (caseIds && Array.isArray(caseIds) && caseIds.length > 0) {
      const placeholders = caseIds.map(() => '?').join(',');
      query += ` WHERE case_id IN (${placeholders})`;
      params.push(...caseIds);
    }

    query += ` ORDER BY created_at DESC LIMIT 1000`;

    const cases = await env.ANALYTICS_DB.prepare(query).bind(...params).all();

    // Convert to CSV
    const headers = ['case_id', 'case_type', 'resolution', 'status', 'customer_email', 'customer_name', 'order_number', 'refund_amount', 'assigned_to', 'created_at', 'resolved_at'];
    const csvRows = [headers.join(',')];

    for (const c of (cases.results || [])) {
      const row = headers.map(h => {
        const val = c[h] || '';
        // Escape commas and quotes
        if (String(val).includes(',') || String(val).includes('"')) {
          return `"${String(val).replace(/"/g, '""')}"`;
        }
        return val;
      });
      csvRows.push(row.join(','));
    }

    // Log audit
    await logAudit(env, auth.user.id, auth.user.username, auth.user.name, 'export_cases', 'cases', 'case', null,
      { count: cases.results?.length || 0, filtered: !!caseIds }, null, null, request);

    return new Response(csvRows.join('\n'), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="cases-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (e) {
    console.error('Export cases error:', e);
    return Response.json({ error: 'Failed to export cases: ' + e.message }, { status: 500, headers: corsHeaders });
  }
}

// ============================================
// ASSIGNMENT SYSTEM (Admin Only)
// ============================================

// Get assignment queue
async function handleGetAssignmentQueue(request, env, corsHeaders) {
  const auth = await verifyAdmin(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const queue = await env.ANALYTICS_DB.prepare(`
      SELECT aq.*, au.name as user_name, au.username, au.is_active as user_active
      FROM assignment_queue aq
      JOIN admin_users au ON aq.user_id = au.id
      ORDER BY aq.sort_order ASC, aq.created_at ASC
    `).all();

    return Response.json({ success: true, queue: queue.results || [] }, { headers: corsHeaders });
  } catch (e) {
    console.error('Get assignment queue error:', e);
    return Response.json({ error: 'Failed to get assignment queue' }, { status: 500, headers: corsHeaders });
  }
}

// Update assignment queue
async function handleUpdateAssignmentQueue(request, env, corsHeaders) {
  const auth = await verifyAdmin(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const { userId, caseType, isActive, maxLoad, sortOrder } = await request.json();

    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400, headers: corsHeaders });
    }

    // Check if entry exists
    const existing = await env.ANALYTICS_DB.prepare(`
      SELECT * FROM assignment_queue WHERE user_id = ? AND (case_type = ? OR (case_type IS NULL AND ? IS NULL))
    `).bind(userId, caseType, caseType).first();

    if (existing) {
      // Update existing
      await env.ANALYTICS_DB.prepare(`
        UPDATE assignment_queue SET is_active = ?, max_load = ?, sort_order = ? WHERE id = ?
      `).bind(isActive ? 1 : 0, maxLoad || 10, sortOrder || 0, existing.id).run();
    } else {
      // Insert new
      await env.ANALYTICS_DB.prepare(`
        INSERT INTO assignment_queue (user_id, case_type, is_active, max_load, sort_order)
        VALUES (?, ?, ?, ?, ?)
      `).bind(userId, caseType, isActive ? 1 : 0, maxLoad || 10, sortOrder || 0).run();
    }

    // Log audit
    await logAudit(env, auth.user.id, auth.user.username, auth.user.name, 'assignment_queue_updated', 'system', 'assignment_queue', userId,
      { caseType, isActive, maxLoad, sortOrder }, null, null, request);

    return Response.json({ success: true, message: 'Assignment queue updated' }, { headers: corsHeaders });
  } catch (e) {
    console.error('Update assignment queue error:', e);
    return Response.json({ error: 'Failed to update assignment queue: ' + e.message }, { status: 500, headers: corsHeaders });
  }
}

// Round robin assignment - get next assignee
async function handleGetNextAssignee(request, env, corsHeaders) {
  const auth = await verifyAdmin(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const caseType = url.searchParams.get('caseType');

    // Get next available user in round robin (least recently assigned, under max load, active)
    const nextAssignee = await env.ANALYTICS_DB.prepare(`
      SELECT aq.*, au.name as user_name, au.username
      FROM assignment_queue aq
      JOIN admin_users au ON aq.user_id = au.id
      WHERE aq.is_active = 1
        AND au.is_active = 1
        AND aq.current_load < aq.max_load
        AND (aq.case_type IS NULL OR aq.case_type = ?)
      ORDER BY aq.last_assigned_at ASC NULLS FIRST, aq.sort_order ASC
      LIMIT 1
    `).bind(caseType).first();

    if (!nextAssignee) {
      return Response.json({
        success: true,
        assignee: null,
        message: 'No available assignees in queue'
      }, { headers: corsHeaders });
    }

    return Response.json({
      success: true,
      assignee: {
        userId: nextAssignee.user_id,
        name: nextAssignee.user_name,
        username: nextAssignee.username,
        currentLoad: nextAssignee.current_load,
        maxLoad: nextAssignee.max_load
      }
    }, { headers: corsHeaders });
  } catch (e) {
    console.error('Get next assignee error:', e);
    return Response.json({ error: 'Failed to get next assignee' }, { status: 500, headers: corsHeaders });
  }
}

// Auto-assign case via round robin
async function handleAutoAssign(request, env, corsHeaders) {
  const auth = await verifyAdmin(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const { caseId, caseType } = await request.json();

    if (!caseId) {
      return Response.json({ error: 'Case ID is required' }, { status: 400, headers: corsHeaders });
    }

    // Get next available user
    const nextAssignee = await env.ANALYTICS_DB.prepare(`
      SELECT aq.*, au.name as user_name
      FROM assignment_queue aq
      JOIN admin_users au ON aq.user_id = au.id
      WHERE aq.is_active = 1
        AND au.is_active = 1
        AND aq.current_load < aq.max_load
        AND (aq.case_type IS NULL OR aq.case_type = ?)
      ORDER BY aq.last_assigned_at ASC NULLS FIRST, aq.sort_order ASC
      LIMIT 1
    `).bind(caseType).first();

    if (!nextAssignee) {
      return Response.json({ error: 'No available assignees in queue' }, { status: 400, headers: corsHeaders });
    }

    // Assign case
    await env.ANALYTICS_DB.prepare(`
      UPDATE cases SET assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE case_id = ?
    `).bind(nextAssignee.user_name, caseId).run();

    // Update queue
    await env.ANALYTICS_DB.prepare(`
      UPDATE assignment_queue SET current_load = current_load + 1, last_assigned_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(nextAssignee.id).run();

    // Log audit
    await logAudit(env, auth.user.id, auth.user.username, auth.user.name, 'auto_assignment', 'cases', 'case', caseId,
      { assignedTo: nextAssignee.user_name, method: 'round_robin' }, null, nextAssignee.user_name, request);

    return Response.json({
      success: true,
      message: `Case assigned to ${nextAssignee.user_name}`,
      assignee: nextAssignee.user_name
    }, { headers: corsHeaders });
  } catch (e) {
    console.error('Auto assign error:', e);
    return Response.json({ error: 'Failed to auto-assign case: ' + e.message }, { status: 500, headers: corsHeaders });
  }
}

// Recalculate assignment loads (for maintenance)
async function handleRecalculateLoads(request, env, corsHeaders) {
  const auth = await verifyAdmin(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    // Get all users in assignment queue
    const queueUsers = await env.ANALYTICS_DB.prepare(`
      SELECT aq.id, aq.user_id, au.name FROM assignment_queue aq JOIN admin_users au ON aq.user_id = au.id
    `).all();

    for (const qu of (queueUsers.results || [])) {
      // Count open cases assigned to this user
      const openCases = await env.ANALYTICS_DB.prepare(`
        SELECT COUNT(*) as count FROM cases WHERE assigned_to = ? AND status IN ('pending', 'in_progress')
      `).bind(qu.name).first();

      await env.ANALYTICS_DB.prepare(`
        UPDATE assignment_queue SET current_load = ? WHERE id = ?
      `).bind(openCases?.count || 0, qu.id).run();
    }

    return Response.json({ success: true, message: 'Assignment loads recalculated' }, { headers: corsHeaders });
  } catch (e) {
    console.error('Recalculate loads error:', e);
    return Response.json({ error: 'Failed to recalculate loads' }, { status: 500, headers: corsHeaders });
  }
}

// ============================================
// SAVED VIEWS
// ============================================

// Get saved views for current user
async function handleGetSavedViews(request, env, corsHeaders) {
  const auth = await verifyAuthAndGetUser(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const views = await env.ANALYTICS_DB.prepare(`
      SELECT * FROM saved_views WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC
    `).bind(auth.user.id).all();

    return Response.json({ success: true, views: views.results || [] }, { headers: corsHeaders });
  } catch (e) {
    console.error('Get saved views error:', e);
    return Response.json({ error: 'Failed to get saved views' }, { status: 500, headers: corsHeaders });
  }
}

// Create saved view
async function handleCreateSavedView(request, env, corsHeaders) {
  const auth = await verifyAuthAndGetUser(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const { name, filters, isDefault } = await request.json();

    if (!name || !filters) {
      return Response.json({ error: 'Name and filters are required' }, { status: 400, headers: corsHeaders });
    }

    // Check limit (max 20 views per user)
    const count = await env.ANALYTICS_DB.prepare(`
      SELECT COUNT(*) as count FROM saved_views WHERE user_id = ?
    `).bind(auth.user.id).first();

    if (count?.count >= 20) {
      return Response.json({ error: 'Maximum 20 saved views allowed' }, { status: 400, headers: corsHeaders });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await env.ANALYTICS_DB.prepare(`
        UPDATE saved_views SET is_default = 0 WHERE user_id = ?
      `).bind(auth.user.id).run();
    }

    const result = await env.ANALYTICS_DB.prepare(`
      INSERT INTO saved_views (user_id, name, filters, is_default, sort_order)
      VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM saved_views WHERE user_id = ?))
    `).bind(auth.user.id, name, JSON.stringify(filters), isDefault ? 1 : 0, auth.user.id).run();

    // Log audit
    await logAudit(env, auth.user.id, auth.user.username, auth.user.name, 'view_created', 'views', 'saved_view', result.meta?.last_row_id,
      { name, filters }, null, name, request);

    return Response.json({ success: true, message: 'View saved', viewId: result.meta?.last_row_id }, { headers: corsHeaders });
  } catch (e) {
    console.error('Create saved view error:', e);
    return Response.json({ error: 'Failed to create saved view: ' + e.message }, { status: 500, headers: corsHeaders });
  }
}

// Update saved view
async function handleUpdateSavedView(request, env, corsHeaders) {
  const auth = await verifyAuthAndGetUser(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const { viewId, name, filters, isDefault, sortOrder } = await request.json();

    if (!viewId) {
      return Response.json({ error: 'View ID is required' }, { status: 400, headers: corsHeaders });
    }

    // Verify ownership
    const view = await env.ANALYTICS_DB.prepare(`
      SELECT * FROM saved_views WHERE id = ? AND user_id = ?
    `).bind(viewId, auth.user.id).first();

    if (!view) {
      return Response.json({ error: 'View not found' }, { status: 404, headers: corsHeaders });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await env.ANALYTICS_DB.prepare(`
        UPDATE saved_views SET is_default = 0 WHERE user_id = ?
      `).bind(auth.user.id).run();
    }

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (filters !== undefined) {
      updates.push('filters = ?');
      values.push(JSON.stringify(filters));
    }
    if (isDefault !== undefined) {
      updates.push('is_default = ?');
      values.push(isDefault ? 1 : 0);
    }
    if (sortOrder !== undefined) {
      updates.push('sort_order = ?');
      values.push(sortOrder);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(viewId);

    await env.ANALYTICS_DB.prepare(`
      UPDATE saved_views SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return Response.json({ success: true, message: 'View updated' }, { headers: corsHeaders });
  } catch (e) {
    console.error('Update saved view error:', e);
    return Response.json({ error: 'Failed to update saved view: ' + e.message }, { status: 500, headers: corsHeaders });
  }
}

// Delete saved view
async function handleDeleteSavedView(request, env, corsHeaders) {
  const auth = await verifyAuthAndGetUser(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const viewId = url.pathname.split('/').pop();

    if (!viewId) {
      return Response.json({ error: 'View ID is required' }, { status: 400, headers: corsHeaders });
    }

    // Verify ownership
    const view = await env.ANALYTICS_DB.prepare(`
      SELECT * FROM saved_views WHERE id = ? AND user_id = ?
    `).bind(viewId, auth.user.id).first();

    if (!view) {
      return Response.json({ error: 'View not found' }, { status: 404, headers: corsHeaders });
    }

    await env.ANALYTICS_DB.prepare(`
      DELETE FROM saved_views WHERE id = ?
    `).bind(viewId).run();

    // Log audit
    await logAudit(env, auth.user.id, auth.user.username, auth.user.name, 'view_deleted', 'views', 'saved_view', viewId,
      { name: view.name }, view.name, null, request);

    return Response.json({ success: true, message: 'View deleted' }, { headers: corsHeaders });
  } catch (e) {
    console.error('Delete saved view error:', e);
    return Response.json({ error: 'Failed to delete saved view: ' + e.message }, { status: 500, headers: corsHeaders });
  }
}

// ============================================
// COMPLETION CHECKLISTS
// ============================================

// Get checklist items for a case type
async function handleGetChecklistItems(request, env, corsHeaders) {
  const auth = await verifyAuthAndGetUser(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const caseType = url.searchParams.get('caseType');
    const resolution = url.searchParams.get('resolution');

    let query = `
      SELECT * FROM completion_checklists
      WHERE is_active = 1 AND case_type = ?
      AND (resolution_pattern IS NULL OR ? LIKE resolution_pattern)
      ORDER BY sort_order ASC
    `;

    const items = await env.ANALYTICS_DB.prepare(query).bind(caseType, resolution || '').all();

    return Response.json({ success: true, items: items.results || [] }, { headers: corsHeaders });
  } catch (e) {
    console.error('Get checklist items error:', e);
    return Response.json({ error: 'Failed to get checklist items' }, { status: 500, headers: corsHeaders });
  }
}

// Get checklist status for a specific case
async function handleGetCaseChecklistStatus(request, env, corsHeaders) {
  const auth = await verifyAuthAndGetUser(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const caseId = url.pathname.split('/')[4]; // /hub/api/case/{caseId}/checklist

    // Get case info
    const caseInfo = await env.ANALYTICS_DB.prepare(`
      SELECT case_type, resolution FROM cases WHERE case_id = ?
    `).bind(caseId).first();

    if (!caseInfo) {
      return Response.json({ error: 'Case not found' }, { status: 404, headers: corsHeaders });
    }

    // Get checklist items for this case type
    const items = await env.ANALYTICS_DB.prepare(`
      SELECT * FROM completion_checklists
      WHERE is_active = 1 AND case_type = ?
      AND (resolution_pattern IS NULL OR ? LIKE resolution_pattern)
      ORDER BY sort_order ASC
    `).bind(caseInfo.case_type, caseInfo.resolution || '').all();

    // Get completed items for this case
    const completions = await env.ANALYTICS_DB.prepare(`
      SELECT cc.*, au.name as completed_by_name
      FROM checklist_completions cc
      LEFT JOIN admin_users au ON cc.completed_by = au.id
      WHERE cc.case_id = ?
    `).bind(caseId).all();

    const completedIds = new Set((completions.results || []).map(c => c.checklist_item_id));

    const checklistWithStatus = (items.results || []).map(item => ({
      ...item,
      isCompleted: completedIds.has(item.id),
      completedBy: completions.results?.find(c => c.checklist_item_id === item.id)?.completed_by_name,
      completedAt: completions.results?.find(c => c.checklist_item_id === item.id)?.completed_at
    }));

    return Response.json({
      success: true,
      checklist: checklistWithStatus,
      allRequiredComplete: checklistWithStatus.filter(i => i.is_required).every(i => i.isCompleted)
    }, { headers: corsHeaders });
  } catch (e) {
    console.error('Get case checklist status error:', e);
    return Response.json({ error: 'Failed to get checklist status' }, { status: 500, headers: corsHeaders });
  }
}

// Mark checklist item as complete
async function handleCompleteChecklistItem(request, env, corsHeaders) {
  const auth = await verifyAuthAndGetUser(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const { caseId, checklistItemId, completed } = await request.json();

    if (!caseId || !checklistItemId) {
      return Response.json({ error: 'Case ID and checklist item ID are required' }, { status: 400, headers: corsHeaders });
    }

    if (completed) {
      // Mark as completed
      await env.ANALYTICS_DB.prepare(`
        INSERT OR REPLACE INTO checklist_completions (case_id, checklist_item_id, completed_by)
        VALUES (?, ?, ?)
      `).bind(caseId, checklistItemId, auth.user.id).run();
    } else {
      // Remove completion
      await env.ANALYTICS_DB.prepare(`
        DELETE FROM checklist_completions WHERE case_id = ? AND checklist_item_id = ?
      `).bind(caseId, checklistItemId).run();
    }

    return Response.json({ success: true, message: completed ? 'Item marked complete' : 'Item marked incomplete' }, { headers: corsHeaders });
  } catch (e) {
    console.error('Complete checklist item error:', e);
    return Response.json({ error: 'Failed to update checklist item' }, { status: 500, headers: corsHeaders });
  }
}

// Admin: Manage checklist templates
async function handleManageChecklists(request, env, corsHeaders) {
  const auth = await verifyAdmin(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    if (request.method === 'GET') {
      const items = await env.ANALYTICS_DB.prepare(`
        SELECT * FROM completion_checklists ORDER BY case_type, sort_order ASC
      `).all();
      return Response.json({ success: true, items: items.results || [] }, { headers: corsHeaders });
    }

    if (request.method === 'POST') {
      const { caseType, resolutionPattern, checklistItem, sortOrder, isRequired } = await request.json();

      if (!caseType || !checklistItem) {
        return Response.json({ error: 'Case type and checklist item are required' }, { status: 400, headers: corsHeaders });
      }

      await env.ANALYTICS_DB.prepare(`
        INSERT INTO completion_checklists (case_type, resolution_pattern, checklist_item, sort_order, is_required)
        VALUES (?, ?, ?, ?, ?)
      `).bind(caseType, resolutionPattern || null, checklistItem, sortOrder || 0, isRequired ? 1 : 0).run();

      await logAudit(env, auth.user.id, auth.user.username, auth.user.name, 'checklist_item_created', 'system', 'checklist', null,
        { caseType, checklistItem }, null, null, request);

      return Response.json({ success: true, message: 'Checklist item created' }, { headers: corsHeaders });
    }

    if (request.method === 'PUT') {
      const { id, checklistItem, sortOrder, isRequired, isActive } = await request.json();

      if (!id) {
        return Response.json({ error: 'Checklist item ID is required' }, { status: 400, headers: corsHeaders });
      }

      await env.ANALYTICS_DB.prepare(`
        UPDATE completion_checklists SET checklist_item = ?, sort_order = ?, is_required = ?, is_active = ? WHERE id = ?
      `).bind(checklistItem, sortOrder || 0, isRequired ? 1 : 0, isActive !== false ? 1 : 0, id).run();

      return Response.json({ success: true, message: 'Checklist item updated' }, { headers: corsHeaders });
    }

    if (request.method === 'DELETE') {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();

      await env.ANALYTICS_DB.prepare(`
        DELETE FROM completion_checklists WHERE id = ?
      `).bind(id).run();

      return Response.json({ success: true, message: 'Checklist item deleted' }, { headers: corsHeaders });
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });
  } catch (e) {
    console.error('Manage checklists error:', e);
    return Response.json({ error: 'Failed to manage checklists: ' + e.message }, { status: 500, headers: corsHeaders });
  }
}

// ============================================
// PHASE 2: SOP LINK MANAGEMENT
// ============================================

// Get all SOP links (admin)
async function handleGetSOPLinks(request, env, corsHeaders) {
  const auth = await verifyAdmin(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const links = await env.ANALYTICS_DB.prepare(`
      SELECT sl.*,
             u1.name as created_by_name,
             u2.name as updated_by_name
      FROM sop_links sl
      LEFT JOIN admin_users u1 ON sl.created_by = u1.id
      LEFT JOIN admin_users u2 ON sl.updated_by = u2.id
      ORDER BY sl.case_type, sl.scenario_name ASC
    `).all();

    return Response.json({ success: true, links: links.results || [] }, { headers: corsHeaders });
  } catch (e) {
    console.error('Get SOP links error:', e);
    return Response.json({ error: 'Failed to get SOP links' }, { status: 500, headers: corsHeaders });
  }
}

// Create SOP link (admin)
async function handleCreateSOPLink(request, env, corsHeaders) {
  const auth = await verifyAdmin(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const { scenarioKey, scenarioName, caseType, sopUrl, description } = await request.json();

    if (!scenarioKey || !scenarioName || !caseType || !sopUrl) {
      return Response.json({ error: 'Scenario key, name, case type, and URL are required' }, { status: 400, headers: corsHeaders });
    }

    // Check for duplicate key
    const existing = await env.ANALYTICS_DB.prepare(`
      SELECT id FROM sop_links WHERE scenario_key = ?
    `).bind(scenarioKey).first();

    if (existing) {
      return Response.json({ error: 'A SOP link with this scenario key already exists' }, { status: 400, headers: corsHeaders });
    }

    await env.ANALYTICS_DB.prepare(`
      INSERT INTO sop_links (scenario_key, scenario_name, case_type, sop_url, description, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(scenarioKey, scenarioName, caseType, sopUrl, description || null, auth.user.id, auth.user.id).run();

    await logAudit(env, auth.user.id, auth.user.username, auth.user.name, 'sop_link_created', 'sop', 'sop_link', scenarioKey,
      { scenarioKey, scenarioName, caseType, sopUrl }, null, JSON.stringify({ scenarioKey, sopUrl }), request);

    return Response.json({ success: true, message: 'SOP link created' }, { headers: corsHeaders });
  } catch (e) {
    console.error('Create SOP link error:', e);
    return Response.json({ error: 'Failed to create SOP link: ' + e.message }, { status: 500, headers: corsHeaders });
  }
}

// Update SOP link (admin)
async function handleUpdateSOPLink(request, id, env, corsHeaders) {
  const auth = await verifyAdmin(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const { scenarioName, sopUrl, description, isActive } = await request.json();

    // Get current values for audit
    const current = await env.ANALYTICS_DB.prepare(`
      SELECT * FROM sop_links WHERE id = ?
    `).bind(id).first();

    if (!current) {
      return Response.json({ error: 'SOP link not found' }, { status: 404, headers: corsHeaders });
    }

    await env.ANALYTICS_DB.prepare(`
      UPDATE sop_links
      SET scenario_name = ?, sop_url = ?, description = ?, is_active = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      scenarioName || current.scenario_name,
      sopUrl || current.sop_url,
      description !== undefined ? description : current.description,
      isActive !== undefined ? (isActive ? 1 : 0) : current.is_active,
      auth.user.id,
      id
    ).run();

    await logAudit(env, auth.user.id, auth.user.username, auth.user.name, 'sop_link_updated', 'sop', 'sop_link', current.scenario_key,
      { id, scenarioName, sopUrl }, JSON.stringify({ sopUrl: current.sop_url }), JSON.stringify({ sopUrl }), request);

    return Response.json({ success: true, message: 'SOP link updated' }, { headers: corsHeaders });
  } catch (e) {
    console.error('Update SOP link error:', e);
    return Response.json({ error: 'Failed to update SOP link' }, { status: 500, headers: corsHeaders });
  }
}

// Delete SOP link (admin)
async function handleDeleteSOPLink(request, id, env, corsHeaders) {
  const auth = await verifyAdmin(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const link = await env.ANALYTICS_DB.prepare(`
      SELECT * FROM sop_links WHERE id = ?
    `).bind(id).first();

    if (!link) {
      return Response.json({ error: 'SOP link not found' }, { status: 404, headers: corsHeaders });
    }

    await env.ANALYTICS_DB.prepare(`
      DELETE FROM sop_links WHERE id = ?
    `).bind(id).run();

    await logAudit(env, auth.user.id, auth.user.username, auth.user.name, 'sop_link_deleted', 'sop', 'sop_link', link.scenario_key,
      { scenarioKey: link.scenario_key }, JSON.stringify(link), null, request);

    return Response.json({ success: true, message: 'SOP link deleted' }, { headers: corsHeaders });
  } catch (e) {
    console.error('Delete SOP link error:', e);
    return Response.json({ error: 'Failed to delete SOP link' }, { status: 500, headers: corsHeaders });
  }
}

// Get SOP link for a specific case (used by hub)
async function handleGetSOPForCase(request, env, corsHeaders) {
  const auth = await verifyAuthAndGetUser(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const caseType = url.searchParams.get('caseType');
    const resolution = url.searchParams.get('resolution');

    if (!caseType) {
      return Response.json({ error: 'Case type is required' }, { status: 400, headers: corsHeaders });
    }

    // First try to find a specific match for resolution pattern
    let link = null;
    if (resolution) {
      link = await env.ANALYTICS_DB.prepare(`
        SELECT sop_url, scenario_name, description FROM sop_links
        WHERE case_type = ? AND is_active = 1 AND (
          scenario_key LIKE ? OR ? LIKE scenario_key || '%'
        )
        ORDER BY LENGTH(scenario_key) DESC
        LIMIT 1
      `).bind(caseType, resolution + '%', resolution).first();
    }

    // Fall back to general case type link
    if (!link) {
      link = await env.ANALYTICS_DB.prepare(`
        SELECT sop_url, scenario_name, description FROM sop_links
        WHERE case_type = ? AND is_active = 1 AND scenario_key LIKE ?
        LIMIT 1
      `).bind(caseType, caseType + '_general').first();
    }

    // Fall back to any link for the case type
    if (!link) {
      link = await env.ANALYTICS_DB.prepare(`
        SELECT sop_url, scenario_name, description FROM sop_links
        WHERE case_type = ? AND is_active = 1
        LIMIT 1
      `).bind(caseType).first();
    }

    // Ultimate fallback to hardcoded URLs
    if (!link) {
      const fallbackUrls = {
        refund: 'https://docs.puppypad.com/sop/refunds',
        return: 'https://docs.puppypad.com/sop/returns',
        shipping: 'https://docs.puppypad.com/sop/shipping-issues',
        subscription: 'https://docs.puppypad.com/sop/subscriptions',
        manual: 'https://docs.puppypad.com/sop/manual-assistance'
      };
      link = {
        sop_url: fallbackUrls[caseType] || fallbackUrls.manual,
        scenario_name: caseType.charAt(0).toUpperCase() + caseType.slice(1) + ' SOP',
        description: 'Standard operating procedure'
      };
    }

    return Response.json({ success: true, link }, { headers: corsHeaders });
  } catch (e) {
    console.error('Get SOP for case error:', e);
    return Response.json({ error: 'Failed to get SOP link' }, { status: 500, headers: corsHeaders });
  }
}

// ============================================
// PHASE 2: ENHANCED AUDIT LOG
// ============================================

// Get enhanced audit log with filtering
async function handleGetEnhancedAuditLog(request, env, corsHeaders) {
  const auth = await verifyAdmin(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 200);
    const offset = (page - 1) * limit;
    const category = url.searchParams.get('category');
    const actionType = url.searchParams.get('actionType');
    const userId = url.searchParams.get('userId');
    const resourceType = url.searchParams.get('resourceType');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const search = url.searchParams.get('search');

    // Build dynamic query
    let conditions = [];
    let params = [];

    if (category) {
      conditions.push('action_category = ?');
      params.push(category);
    }
    if (actionType) {
      conditions.push('action_type = ?');
      params.push(actionType);
    }
    if (userId) {
      conditions.push('user_id = ?');
      params.push(userId);
    }
    if (resourceType) {
      conditions.push('resource_type = ?');
      params.push(resourceType);
    }
    if (startDate) {
      conditions.push('created_at >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('created_at <= ?');
      params.push(endDate + ' 23:59:59');
    }
    if (search) {
      conditions.push('(user_name LIKE ? OR user_email LIKE ? OR resource_id LIKE ? OR details LIKE ?)');
      const searchTerm = '%' + search + '%';
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Get total count
    const countResult = await env.ANALYTICS_DB.prepare(`
      SELECT COUNT(*) as total FROM audit_log ${whereClause}
    `).bind(...params).first();

    // Get logs
    const logs = await env.ANALYTICS_DB.prepare(`
      SELECT * FROM audit_log ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();

    // Get available categories and action types for filters
    const categories = await env.ANALYTICS_DB.prepare(`
      SELECT DISTINCT action_category FROM audit_log ORDER BY action_category
    `).all();

    const actionTypes = await env.ANALYTICS_DB.prepare(`
      SELECT DISTINCT action_type FROM audit_log ORDER BY action_type
    `).all();

    return Response.json({
      success: true,
      logs: logs.results || [],
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit)
      },
      filters: {
        categories: categories.results?.map(c => c.action_category) || [],
        actionTypes: actionTypes.results?.map(a => a.action_type) || []
      }
    }, { headers: corsHeaders });
  } catch (e) {
    console.error('Get enhanced audit log error:', e);
    return Response.json({ error: 'Failed to get audit log' }, { status: 500, headers: corsHeaders });
  }
}

// Export audit log as CSV
async function handleExportAuditLog(request, env, corsHeaders) {
  const auth = await verifyAdmin(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = url.searchParams.get('endDate') || new Date().toISOString().split('T')[0];

    const logs = await env.ANALYTICS_DB.prepare(`
      SELECT * FROM audit_log
      WHERE created_at >= ? AND created_at <= ?
      ORDER BY created_at DESC
      LIMIT 10000
    `).bind(startDate, endDate + ' 23:59:59').all();

    // Build CSV
    const headers = ['Timestamp', 'User', 'Email', 'Action Type', 'Category', 'Resource Type', 'Resource ID', 'Old Value', 'New Value', 'IP Address'];
    const rows = (logs.results || []).map(log => [
      log.created_at,
      log.user_name || '',
      log.user_email || '',
      log.action_type,
      log.action_category,
      log.resource_type || '',
      log.resource_id || '',
      (log.old_value || '').replace(/"/g, '""'),
      (log.new_value || '').replace(/"/g, '""'),
      log.ip_address || ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');

    await logAudit(env, auth.user.id, auth.user.username, auth.user.name, 'audit_log_exported', 'system', 'audit_log', null,
      { startDate, endDate, count: logs.results?.length || 0 }, null, null, request);

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-log-${startDate}-to-${endDate}.csv"`
      }
    });
  } catch (e) {
    console.error('Export audit log error:', e);
    return Response.json({ error: 'Failed to export audit log' }, { status: 500, headers: corsHeaders });
  }
}

// ============================================
// PHASE 2: RESOLUTION VALIDATION
// ============================================

// Validate resolution before completing case
async function handleValidateResolution(request, env, corsHeaders) {
  const auth = await verifyAuthAndGetUser(request, env);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
  }

  try {
    const { caseId, caseType, resolution, refundAmount, orderTotal } = await request.json();

    const errors = [];
    const warnings = [];

    // Case type specific validations
    if (caseType === 'refund') {
      // Refund validations
      if (!resolution) {
        errors.push('Resolution type is required for refund cases');
      }

      if (resolution?.includes('partial') && !refundAmount) {
        errors.push('Refund amount is required for partial refunds');
      }

      if (refundAmount && orderTotal) {
        const refundNum = parseFloat(refundAmount);
        const totalNum = parseFloat(orderTotal);

        if (refundNum > totalNum) {
          errors.push('Refund amount cannot exceed order total');
        }

        if (refundNum === totalNum && resolution?.includes('partial')) {
          warnings.push('Refund amount equals order total - should this be a full refund?');
        }

        if (refundNum < totalNum * 0.1) {
          warnings.push('Refund is less than 10% of order total - please verify');
        }
      }
    }

    if (caseType === 'shipping') {
      // Shipping validations
      if (!resolution) {
        errors.push('Resolution type is required for shipping cases');
      }

      if (resolution?.includes('reship') && !resolution?.includes('tracking')) {
        warnings.push('Consider adding tracking information for reshipment');
      }
    }

    if (caseType === 'subscription') {
      // Subscription validations
      if (!resolution) {
        errors.push('Resolution type is required for subscription cases');
      }

      if (resolution?.includes('cancel') || resolution?.includes('pause')) {
        warnings.push('Ensure subscription status is updated in CheckoutChamp');
      }
    }

    // Check for required checklist items
    const checklistItems = await env.ANALYTICS_DB.prepare(`
      SELECT id, checklist_item, is_required FROM completion_checklists
      WHERE case_type = ? AND is_active = 1 AND is_required = 1
      AND (resolution_pattern IS NULL OR ? LIKE resolution_pattern || '%' OR resolution_pattern LIKE ? || '%')
    `).bind(caseType, resolution || '', resolution || '').all();

    if (checklistItems.results?.length > 0) {
      // Check which are completed
      const completions = await env.ANALYTICS_DB.prepare(`
        SELECT checklist_item_id FROM checklist_completions WHERE case_id = ?
      `).bind(caseId).all();

      const completedIds = new Set((completions.results || []).map(c => c.checklist_item_id));

      for (const item of checklistItems.results) {
        if (!completedIds.has(item.id)) {
          errors.push(`Required checklist item not completed: "${item.checklist_item}"`);
        }
      }
    }

    // General validations
    if (!caseId) {
      errors.push('Case ID is required');
    }

    return Response.json({
      success: errors.length === 0,
      valid: errors.length === 0,
      errors,
      warnings,
      canProceed: errors.length === 0
    }, { headers: corsHeaders });
  } catch (e) {
    console.error('Validate resolution error:', e);
    return Response.json({ error: 'Validation failed: ' + e.message }, { status: 500, headers: corsHeaders });
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

// Get sessions list with pagination
async function handleSessionsList(request, env, corsHeaders) {
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
  const filter = url.searchParams.get('filter') || 'all'; // 'all', 'complete', 'incomplete'
  const range = url.searchParams.get('range') || '7d';

  // Calculate start date based on range
  const now = new Date();
  let startDate;
  switch (range) {
    case '24h': startDate = new Date(now - 24 * 60 * 60 * 1000); break;
    case '7d': startDate = new Date(now - 7 * 24 * 60 * 60 * 1000); break;
    case '30d': startDate = new Date(now - 30 * 24 * 60 * 60 * 1000); break;
    case '90d': startDate = new Date(now - 90 * 24 * 60 * 60 * 1000); break;
    default: startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
  }
  const startDateStr = startDate.toISOString().split('T')[0];

  try {
    let conditions = [`started_at >= '${startDateStr}'`];
    if (filter === 'complete') {
      conditions.push('completed = 1');
    } else if (filter === 'incomplete') {
      conditions.push('(completed = 0 OR completed IS NULL)');
    }
    const whereClause = 'WHERE ' + conditions.join(' AND ');

    const sessions = await env.ANALYTICS_DB.prepare(`
      SELECT
        session_id, started_at, ended_at, flow_type,
        customer_email, customer_name, order_number,
        device_type, completed, session_replay_url, issue_type
      FROM sessions ${whereClause}
      ORDER BY started_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    const countResult = await env.ANALYTICS_DB.prepare(`
      SELECT COUNT(*) as total FROM sessions ${whereClause}
    `).first();

    return Response.json({
      sessions: sessions?.results || [],
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit)
      }
    }, { headers: corsHeaders });
  } catch (e) {
    console.error('Sessions list error:', e);
    return Response.json({ error: 'Failed to load sessions' }, { status: 500, headers: corsHeaders });
  }
}

// Get analytics for issues breakdown
async function handleIssuesAnalytics(request, env, corsHeaders) {
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
  const range = url.searchParams.get('range') || '30d';
  const daysAgo = range === '7d' ? 7 : range === '90d' ? 90 : range === 'year' ? 365 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);
  const startDateStr = startDate.toISOString().split('T')[0];

  try {
    // Top issue types from cases
    const issueTypes = await env.ANALYTICS_DB.prepare(`
      SELECT resolution, COUNT(*) as count
      FROM cases
      WHERE created_at >= ?
      GROUP BY resolution
      ORDER BY count DESC
      LIMIT 10
    `).bind(startDateStr).all();

    // Case types breakdown
    const caseTypes = await env.ANALYTICS_DB.prepare(`
      SELECT case_type, COUNT(*) as count, SUM(refund_amount) as total_refund
      FROM cases
      WHERE created_at >= ?
      GROUP BY case_type
      ORDER BY count DESC
    `).bind(startDateStr).all();

    // Refund amounts by day
    const refundsByDay = await env.ANALYTICS_DB.prepare(`
      SELECT DATE(created_at) as date, SUM(refund_amount) as total, COUNT(*) as count
      FROM cases
      WHERE created_at >= ? AND refund_amount IS NOT NULL
      GROUP BY DATE(created_at)
      ORDER BY date
    `).bind(startDateStr).all();

    // Incomplete sessions with issues
    const incompleteIssues = await env.ANALYTICS_DB.prepare(`
      SELECT issue_type, COUNT(*) as count
      FROM sessions
      WHERE (completed = 0 OR completed IS NULL) AND issue_type IS NOT NULL AND started_at >= ?
      GROUP BY issue_type
      ORDER BY count DESC
    `).bind(startDateStr).all();

    return Response.json({
      issueTypes: issueTypes?.results || [],
      caseTypes: caseTypes?.results || [],
      refundsByDay: refundsByDay?.results || [],
      incompleteIssues: incompleteIssues?.results || []
    }, { headers: corsHeaders });
  } catch (e) {
    console.error('Issues analytics error:', e);
    return Response.json({ error: 'Failed to load analytics' }, { status: 500, headers: corsHeaders });
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

async function serveResolutionHub(env, corsHeaders) {
  const html = getResolutionHubHTML();
  return new Response(html, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
}

async function serveHubAsset(type, corsHeaders) {
  const content = type === 'js' ? getHubAppJS() : getHubStylesCSS();
  const contentType = type === 'js' ? 'application/javascript; charset=utf-8' : 'text/css; charset=utf-8';

  return new Response(content, {
    headers: {
      ...corsHeaders,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600'
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

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .filter-buttons {
      display: flex;
      gap: 8px;
    }

    .filter-btn {
      padding: 6px 12px;
      font-size: 12px;
      border: 1px solid var(--gray-200);
      background: white;
      border-radius: 6px;
      cursor: pointer;
      color: var(--gray-600);
    }

    .filter-btn.active {
      background: var(--accent-teal);
      color: white;
      border-color: var(--accent-teal);
    }

    .recording-link {
      color: var(--accent-coral);
      text-decoration: none;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .recording-link:hover {
      text-decoration: underline;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }

    .status-complete {
      background: #D1FAE5;
      color: #065F46;
    }

    .status-incomplete {
      background: #FEE2E2;
      color: #991B1B;
    }

    .analytics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      padding: 16px 0;
    }

    .analytics-section {
      background: var(--gray-50);
      border-radius: 8px;
      padding: 16px;
    }

    .analytics-section h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: var(--gray-700);
    }

    .chart-container {
      min-height: 200px;
    }

    .chart-bar {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }

    .chart-label {
      width: 140px;
      font-size: 12px;
      color: var(--gray-600);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .chart-bar-bg {
      flex: 1;
      height: 20px;
      background: var(--gray-200);
      border-radius: 4px;
      overflow: hidden;
    }

    .chart-bar-fill {
      height: 100%;
      background: var(--accent-teal);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .chart-bar-fill.coral {
      background: var(--accent-coral);
    }

    .chart-value {
      width: 50px;
      text-align: right;
      font-size: 12px;
      font-weight: 500;
      color: var(--gray-700);
    }

    .no-data {
      text-align: center;
      color: var(--gray-500);
      padding: 40px;
      font-size: 14px;
    }

    .badge-complete {
      background: #D1FAE5;
      color: #065F46;
    }

    .badge-incomplete {
      background: #FEE2E2;
      color: #991B1B;
    }

    .no-recording {
      color: var(--gray-400);
      font-size: 12px;
    }

    .bar-chart {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .bar-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .bar-label {
      font-size: 12px;
      color: var(--gray-600);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bar-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .bar {
      height: 20px;
      border-radius: 4px;
      min-width: 4px;
      transition: width 0.3s ease;
    }

    .bar-value {
      font-size: 12px;
      font-weight: 600;
      color: var(--gray-700);
      min-width: 30px;
    }

    .refunds-summary {
      padding: 8px 0;
    }

    .refund-total {
      font-size: 18px;
      font-weight: 600;
      color: var(--gray-800);
      margin-bottom: 16px;
    }

    .refund-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .refund-day {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 8px;
      background: white;
      border-radius: 4px;
    }

    .refund-day span:first-child {
      color: var(--gray-600);
    }

    .refund-day span:last-child {
      font-weight: 500;
      color: var(--gray-800);
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
        <button class="tab active" data-tab="sessions">Sessions</button>
        <button class="tab" data-tab="cases">Cases</button>
        <button class="tab" data-tab="analytics">Analytics</button>
        <button class="tab" data-tab="events">Event Log</button>
      </div>

      <!-- Sessions Table -->
      <div class="card" id="sessionsCard">
        <div class="card-header">
          <h3 class="card-title">Session Recordings</h3>
          <div class="filter-buttons">
            <button class="filter-btn active" data-filter="all">All</button>
            <button class="filter-btn" data-filter="incomplete">Incomplete</button>
            <button class="filter-btn" data-filter="complete">Completed</button>
          </div>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Started</th>
                <th>Customer</th>
                <th>Order</th>
                <th>Flow</th>
                <th>Status</th>
                <th>Recording</th>
              </tr>
            </thead>
            <tbody id="sessionsTableBody">
              <tr><td colspan="6" class="loading">Loading...</td></tr>
            </tbody>
          </table>
        </div>
        <div class="pagination" id="sessionsPagination"></div>
      </div>

      <!-- Cases Table -->
      <div class="card" id="casesCard" style="display: none;">
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

      <!-- Analytics -->
      <div class="card" id="analyticsCard" style="display: none;">
        <div class="card-header">
          <h3 class="card-title">Issue Analytics</h3>
        </div>
        <div class="analytics-grid">
          <div class="analytics-section">
            <h4>Case Types Breakdown</h4>
            <div id="caseTypesChart" class="chart-container"></div>
          </div>
          <div class="analytics-section">
            <h4>Top Resolutions</h4>
            <div id="resolutionsChart" class="chart-container"></div>
          </div>
          <div class="analytics-section">
            <h4>Refunds Over Time</h4>
            <div id="refundsChart" class="chart-container"></div>
          </div>
          <div class="analytics-section">
            <h4>Incomplete Session Issues</h4>
            <div id="incompleteChart" class="chart-container"></div>
          </div>
        </div>
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
    let currentSessionsPage = 1;
    let currentSessionsFilter = 'all';

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
        document.getElementById('sessionsCard').style.display = tabName === 'sessions' ? 'block' : 'none';
        document.getElementById('casesCard').style.display = tabName === 'cases' ? 'block' : 'none';
        document.getElementById('analyticsCard').style.display = tabName === 'analytics' ? 'block' : 'none';
        document.getElementById('eventsCard').style.display = tabName === 'events' ? 'block' : 'none';

        // Load analytics when tab is selected
        if (tabName === 'analytics') {
          loadAnalytics();
        }
      });
    });

    // Session filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSessionsFilter = btn.dataset.filter;
        loadSessions(1);
      });
    });

    // Date range change
    document.getElementById('dateRange').addEventListener('change', () => {
      loadDashboardData();
      loadAnalytics();
    });

    function showDashboard() {
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('dashboardScreen').classList.add('active');
      loadDashboardData();
      loadSessions();
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

    async function loadSessions(page = 1) {
      currentSessionsPage = page;
      const range = document.getElementById('dateRange').value;

      try {
        const response = await fetch(API_BASE + '/admin/api/sessions?page=' + page + '&filter=' + currentSessionsFilter + '&range=' + range, {
          headers: { 'Authorization': 'Bearer ' + authToken }
        });

        if (response.status === 401) {
          logout();
          return;
        }

        const data = await response.json();
        renderSessions(data);
      } catch (err) {
        console.error('Failed to load sessions:', err);
        document.getElementById('sessionsTableBody').innerHTML = '<tr><td colspan="6" class="loading">Failed to load sessions</td></tr>';
      }
    }

    function renderSessions(data) {
      const tbody = document.getElementById('sessionsTableBody');

      if (!data.sessions || data.sessions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No sessions found</td></tr>';
        return;
      }

      tbody.innerHTML = data.sessions.map(s => {
        const customerDisplay = s.customer_name || s.customer_email || 'Anonymous';
        const statusClass = s.completed ? 'badge-complete' : 'badge-incomplete';
        const statusText = s.completed ? 'Completed' : (s.issue_type || 'Incomplete');
        const recordingLink = s.session_replay_url
          ? \`<a href="\${s.session_replay_url}" target="_blank" class="recording-link">▶ Watch</a>\`
          : '<span class="no-recording">No recording</span>';

        return \`
          <tr>
            <td>\${new Date(s.started_at).toLocaleString()}</td>
            <td title="\${s.customer_email || ''}">\${customerDisplay}</td>
            <td>\${s.order_number || 'N/A'}</td>
            <td>\${s.flow_type || 'N/A'}</td>
            <td><span class="badge \${statusClass}">\${statusText}</span></td>
            <td>\${recordingLink}</td>
          </tr>
        \`;
      }).join('');

      renderPagination('sessionsPagination', data.pagination, loadSessions);
    }

    async function loadAnalytics() {
      const range = document.getElementById('dateRange').value;

      try {
        const response = await fetch(API_BASE + '/admin/api/analytics/issues?range=' + range, {
          headers: { 'Authorization': 'Bearer ' + authToken }
        });

        if (response.status === 401) {
          logout();
          return;
        }

        const data = await response.json();
        renderAnalytics(data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      }
    }

    function renderAnalytics(data) {
      // Transform caseTypes: { case_type, count } -> { name, count }
      const caseTypesData = (data.caseTypes || []).map(c => ({
        name: c.case_type || 'Unknown',
        count: c.count
      }));
      renderBarChart('caseTypesChart', caseTypesData, '#3B82F6');

      // Transform issueTypes (resolutions): { resolution, count } -> { name, count }
      const resolutionsData = (data.issueTypes || []).map(r => ({
        name: r.resolution || 'Unknown',
        count: r.count
      }));
      renderBarChart('resolutionsChart', resolutionsData, '#10B981');

      // Transform incompleteIssues: { issue_type, count } -> { name, count }
      const incompleteData = (data.incompleteIssues || []).map(i => ({
        name: i.issue_type || 'Unknown',
        count: i.count
      }));
      renderBarChart('incompleteChart', incompleteData, '#F59E0B');

      // Render Refunds Over Time as a simple list
      const refundsContainer = document.getElementById('refundsChart');
      if (data.refundsByDay && data.refundsByDay.length > 0) {
        refundsContainer.innerHTML = \`
          <div class="refunds-summary">
            <div class="refund-total">Total: $\${data.refundsByDay.reduce((sum, d) => sum + (d.total || 0), 0).toFixed(2)}</div>
            <div class="refund-list">
              \${data.refundsByDay.slice(-7).reverse().map(d => \`
                <div class="refund-day">
                  <span>\${d.date}</span>
                  <span>$\${(d.total || 0).toFixed(2)} (\${d.count} refunds)</span>
                </div>
              \`).join('')}
            </div>
          </div>
        \`;
      } else {
        refundsContainer.innerHTML = '<p class="no-data">No refund data available</p>';
      }
    }

    function renderBarChart(containerId, items, color) {
      const container = document.getElementById(containerId);

      if (!items || items.length === 0) {
        container.innerHTML = '<p class="no-data">No data available</p>';
        return;
      }

      const maxCount = Math.max(...items.map(i => i.count));

      container.innerHTML = \`
        <div class="bar-chart">
          \${items.slice(0, 8).map(item => \`
            <div class="bar-item">
              <div class="bar-label" title="\${item.name}">\${item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name}</div>
              <div class="bar-wrapper">
                <div class="bar" style="width: \${(item.count / maxCount * 100)}%; background: \${color};"></div>
                <span class="bar-value">\${item.count}</span>
              </div>
            </div>
          \`).join('')}
        </div>
      \`;
    }
  </script>
</body>
</html>`;
}

// ============================================
// RESOLUTION HUB API HANDLERS
// ============================================

async function handleHubStats(request, env, corsHeaders) {
  try {
    // Get case counts by status
    const pendingResult = await env.ANALYTICS_DB.prepare(
      `SELECT COUNT(*) as count FROM cases WHERE status = 'pending' OR status = 'open'`
    ).first();

    const inProgressResult = await env.ANALYTICS_DB.prepare(
      `SELECT COUNT(*) as count FROM cases WHERE status = 'in_progress'`
    ).first();

    // Get completed today
    const today = new Date().toISOString().split('T')[0];
    const completedTodayResult = await env.ANALYTICS_DB.prepare(
      `SELECT COUNT(*) as count FROM cases WHERE status = 'completed' AND DATE(resolved_at) = ?`
    ).bind(today).first();

    // Get counts by type
    const typeCountsResult = await env.ANALYTICS_DB.prepare(
      `SELECT case_type, COUNT(*) as count FROM cases WHERE status != 'completed' GROUP BY case_type`
    ).all();

    const typeCounts = {};
    let total = 0;
    for (const row of typeCountsResult.results || []) {
      typeCounts[row.case_type] = row.count;
      total += row.count;
    }

    return Response.json({
      pending: pendingResult?.count || 0,
      inProgress: inProgressResult?.count || 0,
      completedToday: completedTodayResult?.count || 0,
      avgTime: '-', // TODO: Calculate average resolution time
      all: total,
      shipping: typeCounts.shipping || 0,
      refund: typeCounts.refund || 0,
      return: typeCounts.return || 0,
      subscription: typeCounts.subscription || 0,
      manual: typeCounts.manual || 0
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Hub stats error:', error);
    return Response.json({
      pending: 0, inProgress: 0, completedToday: 0, avgTime: '-',
      all: 0, shipping: 0, refund: 0, return: 0, subscription: 0, manual: 0
    }, { headers: corsHeaders });
  }
}

async function handleHubCases(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const filter = url.searchParams.get('filter') || 'all';
    const status = url.searchParams.get('status');

    let query = `SELECT * FROM cases`;
    const conditions = [];
    const params = [];

    if (filter && filter !== 'all') {
      conditions.push(`case_type = ?`);
      params.push(filter);
    }

    if (status) {
      conditions.push(`status = ?`);
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const stmt = env.ANALYTICS_DB.prepare(query);
    const result = await stmt.bind(...params).all();

    return Response.json({
      cases: result.results || [],
      total: result.results?.length || 0
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Hub cases error:', error);
    return Response.json({ cases: [], total: 0 }, { headers: corsHeaders });
  }
}

async function handleHubGetCase(caseId, env, corsHeaders) {
  try {
    const caseData = await env.ANALYTICS_DB.prepare(
      `SELECT * FROM cases WHERE case_id = ?`
    ).bind(caseId).first();

    if (!caseData) {
      return Response.json({ error: 'Case not found' }, { status: 404, headers: corsHeaders });
    }

    // Parse JSON fields
    if (caseData.selected_items) {
      try { caseData.selected_items = JSON.parse(caseData.selected_items); } catch (e) {}
    }
    if (caseData.photo_urls) {
      try { caseData.photo_urls = JSON.parse(caseData.photo_urls); } catch (e) {}
    }
    if (caseData.shipping_address) {
      try { caseData.shipping_address = JSON.parse(caseData.shipping_address); } catch (e) {}
    }
    if (caseData.extra_data) {
      try { caseData.extra_data = JSON.parse(caseData.extra_data); } catch (e) {}
    }

    return Response.json({ case: caseData }, { headers: corsHeaders });
  } catch (error) {
    console.error('Hub get case error:', error);
    return Response.json({ error: 'Failed to load case' }, { status: 500, headers: corsHeaders });
  }
}

async function handleHubUpdateStatus(request, caseId, env, corsHeaders) {
  try {
    const { status, actor, actor_email } = await request.json();

    // Get current case to record old status
    const currentCase = await env.ANALYTICS_DB.prepare(
      `SELECT status FROM cases WHERE case_id = ?`
    ).bind(caseId).first();

    if (!currentCase) {
      return Response.json({ error: 'Case not found' }, { status: 404, headers: corsHeaders });
    }

    const oldStatus = currentCase.status;
    const now = new Date().toISOString();

    // Update case status - use only columns that definitely exist
    try {
      if (status === 'completed' && oldStatus !== 'completed') {
        await env.ANALYTICS_DB.prepare(
          `UPDATE cases SET status = ?, updated_at = ?, resolved_at = ?, resolved_by = ? WHERE case_id = ?`
        ).bind(status, now, now, actor || actor_email || 'team_member', caseId).run();
      } else {
        await env.ANALYTICS_DB.prepare(
          `UPDATE cases SET status = ?, updated_at = ? WHERE case_id = ?`
        ).bind(status, now, caseId).run();
      }
    } catch (e) {
      // Fallback without resolved_by if column doesn't exist
      try {
        if (status === 'completed' && oldStatus !== 'completed') {
          await env.ANALYTICS_DB.prepare(
            `UPDATE cases SET status = ?, updated_at = ?, resolved_at = ? WHERE case_id = ?`
          ).bind(status, now, now, caseId).run();
        } else {
          await env.ANALYTICS_DB.prepare(
            `UPDATE cases SET status = ?, updated_at = ? WHERE case_id = ?`
          ).bind(status, now, caseId).run();
        }
      } catch (e2) {
        // Fallback without updated_at if column doesn't exist
        await env.ANALYTICS_DB.prepare(
          `UPDATE cases SET status = ? WHERE case_id = ?`
        ).bind(status, caseId).run();
      }
    }

    // Try to log activity (table might not exist)
    try {
      await env.ANALYTICS_DB.prepare(
        `INSERT INTO case_activity (case_id, activity_type, field_name, old_value, new_value, actor, actor_email, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(caseId, 'status_changed', 'status', oldStatus, status, actor || 'team_member', actor_email || '', 'hub').run();
    } catch (e) {
      console.log('Could not log to case_activity:', e.message);
    }

    // Try to log event (columns might not exist)
    try {
      await env.ANALYTICS_DB.prepare(
        `INSERT INTO events (session_id, event_type, event_name, event_data) VALUES (?, ?, ?, ?)`
      ).bind(caseId, 'status_change', 'Status changed to ' + status, JSON.stringify({ old_status: oldStatus, new_status: status, case_id: caseId })).run();
    } catch (e) {
      console.log('Could not log event:', e.message);
    }

    // Sync to ClickUp (fire and forget - don't block response)
    syncStatusToClickUp(env, caseId, status).catch(e => console.error('ClickUp sync error:', e));

    return Response.json({ success: true, status }, { headers: corsHeaders });
  } catch (error) {
    console.error('Hub update status error:', error);
    return Response.json({ error: 'Failed to update status: ' + error.message }, { status: 500, headers: corsHeaders });
  }
}

async function handleHubGetComments(caseId, env, corsHeaders) {
  try {
    const comments = await env.ANALYTICS_DB.prepare(
      `SELECT * FROM case_comments WHERE case_id = ? ORDER BY created_at ASC`
    ).bind(caseId).all();

    return Response.json({ comments: comments.results || [] }, { headers: corsHeaders });
  } catch (error) {
    console.error('Hub get comments error:', error);
    // Check if table doesn't exist
    if (error.message?.includes('no such table')) {
      return Response.json({
        comments: [],
        notice: 'Comments table not yet created. Run migrations to enable comments.'
      }, { headers: corsHeaders });
    }
    return Response.json({ comments: [] }, { headers: corsHeaders });
  }
}

async function handleHubAddComment(request, caseId, env, corsHeaders) {
  try {
    const { content, author_name, author_email } = await request.json();

    if (!content || !content.trim()) {
      return Response.json({ error: 'Comment content is required' }, { status: 400, headers: corsHeaders });
    }

    const now = new Date().toISOString();

    // Insert comment
    const result = await env.ANALYTICS_DB.prepare(
      `INSERT INTO case_comments (case_id, content, author_name, author_email, source, created_at) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(caseId, content.trim(), author_name || 'Team Member', author_email || '', 'hub', now).run();

    // Log activity
    await env.ANALYTICS_DB.prepare(
      `INSERT INTO case_activity (case_id, activity_type, new_value, actor, actor_email, source) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(caseId, 'comment_added', content.trim().substring(0, 100), author_name || 'team_member', author_email || '', 'hub').run();

    // Update case updated_at
    await env.ANALYTICS_DB.prepare(
      `UPDATE cases SET updated_at = ? WHERE case_id = ?`
    ).bind(now, caseId).run();

    // Sync comment to ClickUp (fire and forget)
    syncCommentToClickUp(env, caseId, content.trim(), author_name || 'Team Member').catch(e => console.error('ClickUp comment sync error:', e));

    return Response.json({
      success: true,
      comment: {
        id: result.meta?.last_row_id,
        case_id: caseId,
        content: content.trim(),
        author_name: author_name || 'Team Member',
        author_email: author_email || '',
        source: 'hub',
        created_at: now
      }
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Hub add comment error:', error);
    // Check if table doesn't exist
    if (error.message?.includes('no such table')) {
      return Response.json({
        error: 'Comments table not yet created. Please run: CREATE TABLE case_comments (id INTEGER PRIMARY KEY AUTOINCREMENT, case_id TEXT NOT NULL, content TEXT NOT NULL, author_name TEXT, author_email TEXT, source TEXT DEFAULT \'hub\', created_at DATETIME DEFAULT CURRENT_TIMESTAMP);'
      }, { status: 500, headers: corsHeaders });
    }
    return Response.json({ error: 'Failed to add comment' }, { status: 500, headers: corsHeaders });
  }
}

async function handleHubCaseActivity(caseId, env, corsHeaders) {
  try {
    const activities = await env.ANALYTICS_DB.prepare(
      `SELECT id, case_id, activity_type, field_name, old_value, new_value, actor, actor_email, source, created_at
       FROM case_activity
       WHERE case_id = ?
       ORDER BY created_at DESC
       LIMIT 50`
    ).bind(caseId).all();

    return Response.json({
      success: true,
      activities: activities.results || []
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Hub case activity error:', error);
    // If table doesn't exist, return empty array
    if (error.message?.includes('no such table')) {
      return Response.json({ success: true, activities: [] }, { headers: corsHeaders });
    }
    return Response.json({ error: 'Failed to load activity' }, { status: 500, headers: corsHeaders });
  }
}

async function handleHubSessions(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const offset = parseInt(url.searchParams.get('offset')) || 0;

    const sessions = await env.ANALYTICS_DB.prepare(
      `SELECT * FROM sessions ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();

    const countResult = await env.ANALYTICS_DB.prepare(
      `SELECT COUNT(*) as count FROM sessions`
    ).first();

    return Response.json({
      sessions: sessions.results || [],
      total: countResult?.count || 0
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Hub sessions error:', error);
    return Response.json({ sessions: [], total: 0 }, { headers: corsHeaders });
  }
}

async function handleHubEvents(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 100;
    const offset = parseInt(url.searchParams.get('offset')) || 0;

    const events = await env.ANALYTICS_DB.prepare(
      `SELECT * FROM events ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();

    const countResult = await env.ANALYTICS_DB.prepare(
      `SELECT COUNT(*) as count FROM events`
    ).first();

    return Response.json({
      events: events.results || [],
      total: countResult?.count || 0
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Hub events error:', error);
    return Response.json({ events: [], total: 0 }, { headers: corsHeaders });
  }
}

async function handleHubAnalytics(request, env, corsHeaders) {
  try {
    // Total sessions
    const totalSessions = await env.ANALYTICS_DB.prepare(
      `SELECT COUNT(*) as count FROM sessions`
    ).first();

    // Completed sessions
    const completedSessions = await env.ANALYTICS_DB.prepare(
      `SELECT COUNT(*) as count FROM sessions WHERE completed = 1`
    ).first();

    // Total cases
    const totalCases = await env.ANALYTICS_DB.prepare(
      `SELECT COUNT(*) as count FROM cases`
    ).first();

    // Cases today
    const casesToday = await env.ANALYTICS_DB.prepare(
      `SELECT COUNT(*) as count FROM cases WHERE DATE(created_at) = DATE('now')`
    ).first();

    // Cases this week
    const casesThisWeek = await env.ANALYTICS_DB.prepare(
      `SELECT COUNT(*) as count FROM cases WHERE created_at > datetime('now', '-7 days')`
    ).first();

    // Cases this month
    const casesThisMonth = await env.ANALYTICS_DB.prepare(
      `SELECT COUNT(*) as count FROM cases WHERE created_at > datetime('now', '-30 days')`
    ).first();

    // Pending cases
    const pendingCases = await env.ANALYTICS_DB.prepare(
      `SELECT COUNT(*) as count FROM cases WHERE status = 'pending'`
    ).first();

    // In progress cases
    const inProgressCases = await env.ANALYTICS_DB.prepare(
      `SELECT COUNT(*) as count FROM cases WHERE status = 'in_progress'`
    ).first();

    // Completed cases
    const completedCases = await env.ANALYTICS_DB.prepare(
      `SELECT COUNT(*) as count FROM cases WHERE status = 'completed'`
    ).first();

    // Cases by type
    const casesByType = await env.ANALYTICS_DB.prepare(
      `SELECT case_type, COUNT(*) as count FROM cases GROUP BY case_type`
    ).all();

    // Cases by status
    const casesByStatus = await env.ANALYTICS_DB.prepare(
      `SELECT status, COUNT(*) as count FROM cases GROUP BY status`
    ).all();

    // Resolution types breakdown
    const resolutionTypes = await env.ANALYTICS_DB.prepare(
      `SELECT resolution, COUNT(*) as count, SUM(refund_amount) as total_refund FROM cases GROUP BY resolution ORDER BY count DESC LIMIT 10`
    ).all();

    // Total refunds
    const totalRefunds = await env.ANALYTICS_DB.prepare(
      `SELECT SUM(refund_amount) as total FROM cases WHERE refund_amount IS NOT NULL`
    ).first();

    // Refunds this month
    const refundsThisMonth = await env.ANALYTICS_DB.prepare(
      `SELECT SUM(refund_amount) as total FROM cases WHERE refund_amount IS NOT NULL AND created_at > datetime('now', '-30 days')`
    ).first();

    // Average refund amount
    const avgRefund = await env.ANALYTICS_DB.prepare(
      `SELECT AVG(refund_amount) as avg FROM cases WHERE refund_amount IS NOT NULL AND refund_amount > 0`
    ).first();

    // Sessions by day (last 14 days)
    const sessionsByDay = await env.ANALYTICS_DB.prepare(
      `SELECT DATE(created_at) as date, COUNT(*) as count FROM sessions WHERE created_at > datetime('now', '-14 days') GROUP BY DATE(created_at) ORDER BY date`
    ).all();

    // Cases by day (last 14 days)
    const casesByDay = await env.ANALYTICS_DB.prepare(
      `SELECT DATE(created_at) as date, COUNT(*) as count FROM cases WHERE created_at > datetime('now', '-14 days') GROUP BY DATE(created_at) ORDER BY date`
    ).all();

    // Refunds by day (last 14 days)
    const refundsByDay = await env.ANALYTICS_DB.prepare(
      `SELECT DATE(created_at) as date, SUM(refund_amount) as total FROM cases WHERE refund_amount IS NOT NULL AND created_at > datetime('now', '-14 days') GROUP BY DATE(created_at) ORDER BY date`
    ).all();

    // Flow types breakdown (from sessions)
    const flowTypes = await env.ANALYTICS_DB.prepare(
      `SELECT flow_type, COUNT(*) as count FROM sessions WHERE flow_type IS NOT NULL GROUP BY flow_type ORDER BY count DESC`
    ).all();

    // Recent high-value refunds
    const highValueRefunds = await env.ANALYTICS_DB.prepare(
      `SELECT case_id, customer_email, refund_amount, resolution, created_at FROM cases WHERE refund_amount > 50 ORDER BY created_at DESC LIMIT 5`
    ).all();

    // Cases needing attention (pending for more than 24 hours)
    const staleCases = await env.ANALYTICS_DB.prepare(
      `SELECT COUNT(*) as count FROM cases WHERE status = 'pending' AND created_at < datetime('now', '-24 hours')`
    ).first();

    // ============================================
    // PHASE 3: ENHANCED ANALYTICS
    // ============================================

    // Resolution Time Metrics (for completed cases)
    let avgResolutionTime = { avg_hours: 0 };
    let minResolutionTime = { min_hours: 0 };
    let maxResolutionTime = { max_hours: 0 };
    try {
      avgResolutionTime = await env.ANALYTICS_DB.prepare(
        `SELECT AVG((julianday(resolved_at) - julianday(created_at)) * 24) as avg_hours
         FROM cases WHERE status = 'completed' AND resolved_at IS NOT NULL`
      ).first() || { avg_hours: 0 };

      minResolutionTime = await env.ANALYTICS_DB.prepare(
        `SELECT MIN((julianday(resolved_at) - julianday(created_at)) * 24) as min_hours
         FROM cases WHERE status = 'completed' AND resolved_at IS NOT NULL`
      ).first() || { min_hours: 0 };

      maxResolutionTime = await env.ANALYTICS_DB.prepare(
        `SELECT MAX((julianday(resolved_at) - julianday(created_at)) * 24) as max_hours
         FROM cases WHERE status = 'completed' AND resolved_at IS NOT NULL`
      ).first() || { max_hours: 0 };
    } catch (e) { console.log('Resolution time calc skipped:', e.message); }

    // SLA Compliance (completed within 24 hours)
    let slaCompliant = { count: 0 };
    let slaBreached = { count: 0 };
    try {
      slaCompliant = await env.ANALYTICS_DB.prepare(
        `SELECT COUNT(*) as count FROM cases
         WHERE status = 'completed' AND resolved_at IS NOT NULL
         AND (julianday(resolved_at) - julianday(created_at)) <= 1`
      ).first() || { count: 0 };

      slaBreached = await env.ANALYTICS_DB.prepare(
        `SELECT COUNT(*) as count FROM cases
         WHERE status = 'completed' AND resolved_at IS NOT NULL
         AND (julianday(resolved_at) - julianday(created_at)) > 1`
      ).first() || { count: 0 };
    } catch (e) { console.log('SLA calc skipped:', e.message); }

    // Team Performance (cases completed per user)
    let teamPerformance = { results: [] };
    try {
      teamPerformance = await env.ANALYTICS_DB.prepare(
        `SELECT
           COALESCE(c.resolved_by, c.assigned_to, 'Unassigned') as user_name,
           COUNT(*) as cases_completed,
           SUM(c.refund_amount) as total_refunds,
           AVG((julianday(c.resolved_at) - julianday(c.created_at)) * 24) as avg_resolution_hours
         FROM cases c
         WHERE c.status = 'completed' AND c.created_at > datetime('now', '-30 days')
         GROUP BY COALESCE(c.resolved_by, c.assigned_to, 'Unassigned')
         ORDER BY cases_completed DESC
         LIMIT 10`
      ).all();
    } catch (e) { console.log('Team performance skipped:', e.message); }

    // Root Cause Analysis (refund reasons breakdown)
    let rootCauses = { results: [] };
    try {
      rootCauses = await env.ANALYTICS_DB.prepare(
        `SELECT
           COALESCE(refund_reason, resolution, 'Unknown') as reason,
           COUNT(*) as count,
           SUM(refund_amount) as total_amount,
           AVG(refund_amount) as avg_amount
         FROM cases
         WHERE created_at > datetime('now', '-30 days')
         GROUP BY COALESCE(refund_reason, resolution, 'Unknown')
         ORDER BY count DESC
         LIMIT 15`
      ).all();
    } catch (e) { console.log('Root causes skipped:', e.message); }

    // Cases by hour of day (to identify peak times)
    let casesByHour = { results: [] };
    try {
      casesByHour = await env.ANALYTICS_DB.prepare(
        `SELECT strftime('%H', created_at) as hour, COUNT(*) as count
         FROM cases WHERE created_at > datetime('now', '-30 days')
         GROUP BY strftime('%H', created_at) ORDER BY hour`
      ).all();
    } catch (e) { console.log('Cases by hour skipped:', e.message); }

    // Resolution time distribution
    let resolutionDistribution = { results: [] };
    try {
      resolutionDistribution = await env.ANALYTICS_DB.prepare(
        `SELECT
           CASE
             WHEN (julianday(resolved_at) - julianday(created_at)) * 24 < 1 THEN '< 1 hour'
             WHEN (julianday(resolved_at) - julianday(created_at)) * 24 < 4 THEN '1-4 hours'
             WHEN (julianday(resolved_at) - julianday(created_at)) * 24 < 12 THEN '4-12 hours'
             WHEN (julianday(resolved_at) - julianday(created_at)) * 24 < 24 THEN '12-24 hours'
             ELSE '24+ hours'
           END as time_bucket,
           COUNT(*) as count
         FROM cases
         WHERE status = 'completed' AND resolved_at IS NOT NULL
         GROUP BY time_bucket
         ORDER BY
           CASE time_bucket
             WHEN '< 1 hour' THEN 1
             WHEN '1-4 hours' THEN 2
             WHEN '4-12 hours' THEN 3
             WHEN '12-24 hours' THEN 4
             ELSE 5
           END`
      ).all();
    } catch (e) { console.log('Resolution distribution skipped:', e.message); }

    return Response.json({
      totalSessions: totalSessions?.count || 0,
      completedSessions: completedSessions?.count || 0,
      completionRate: totalSessions?.count ? Math.round((completedSessions?.count || 0) / totalSessions.count * 100) : 0,
      totalCases: totalCases?.count || 0,
      casesToday: casesToday?.count || 0,
      casesThisWeek: casesThisWeek?.count || 0,
      casesThisMonth: casesThisMonth?.count || 0,
      pendingCases: pendingCases?.count || 0,
      inProgressCases: inProgressCases?.count || 0,
      completedCases: completedCases?.count || 0,
      staleCases: staleCases?.count || 0,
      casesByType: casesByType.results || [],
      casesByStatus: casesByStatus.results || [],
      resolutionTypes: resolutionTypes.results || [],
      totalRefunds: totalRefunds?.total || 0,
      refundsThisMonth: refundsThisMonth?.total || 0,
      avgRefund: avgRefund?.avg || 0,
      sessionsByDay: sessionsByDay.results || [],
      casesByDay: casesByDay.results || [],
      refundsByDay: refundsByDay.results || [],
      flowTypes: flowTypes.results || [],
      highValueRefunds: highValueRefunds.results || [],
      // Phase 3: Enhanced Analytics
      avgResolutionHours: avgResolutionTime?.avg_hours || 0,
      minResolutionHours: minResolutionTime?.min_hours || 0,
      maxResolutionHours: maxResolutionTime?.max_hours || 0,
      slaCompliant: slaCompliant?.count || 0,
      slaBreached: slaBreached?.count || 0,
      slaComplianceRate: (slaCompliant?.count || 0) + (slaBreached?.count || 0) > 0
        ? Math.round((slaCompliant?.count || 0) / ((slaCompliant?.count || 0) + (slaBreached?.count || 0)) * 100)
        : 0,
      teamPerformance: teamPerformance.results || [],
      rootCauses: rootCauses.results || [],
      casesByHour: casesByHour.results || [],
      resolutionDistribution: resolutionDistribution.results || []
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Hub analytics error:', error);
    return Response.json({ totalSessions: 0, completedSessions: 0, totalCases: 0 }, { headers: corsHeaders });
  }
}

// ============================================
// HUB API - ISSUES (TROUBLE REPORTS)
// ============================================

async function handleHubIssues(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 50;

    // Try to get issues from trouble_reports table
    let issues = [];
    try {
      const result = await env.ANALYTICS_DB.prepare(`
        SELECT * FROM trouble_reports ORDER BY created_at DESC LIMIT ?
      `).bind(limit).all();
      issues = result.results || [];
    } catch (dbError) {
      // Table might not exist, return empty
      console.log('Trouble reports table may not exist:', dbError.message);
    }

    return Response.json({ issues }, { headers: corsHeaders });
  } catch (error) {
    console.error('Hub issues error:', error);
    return Response.json({ issues: [] }, { headers: corsHeaders });
  }
}

async function handleHubIssueDetail(reportId, env, corsHeaders) {
  try {
    const result = await env.ANALYTICS_DB.prepare(`
      SELECT * FROM trouble_reports WHERE report_id = ?
    `).bind(reportId).first();

    if (!result) {
      return Response.json({ error: 'Issue not found' }, { status: 404, headers: corsHeaders });
    }

    return Response.json(result, { headers: corsHeaders });
  } catch (error) {
    console.error('Hub issue detail error:', error);
    return Response.json({ error: 'Failed to load issue' }, { status: 500, headers: corsHeaders });
  }
}

async function handleHubIssueStatusUpdate(reportId, request, env, corsHeaders) {
  try {
    const { status } = await request.json();

    await env.ANALYTICS_DB.prepare(`
      UPDATE trouble_reports SET status = ? WHERE report_id = ?
    `).bind(status, reportId).run();

    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('Hub issue status update error:', error);
    return Response.json({ error: 'Failed to update status' }, { status: 500, headers: corsHeaders });
  }
}

// ============================================
// CLICKUP TWO-WAY SYNC
// ============================================

// Map ClickUp status names to Hub status
const CLICKUP_STATUS_MAP = {
  'to do': 'pending',
  'in progress': 'in_progress',
  'in-progress': 'in_progress',
  'review': 'in_progress',
  'complete': 'completed',
  'completed': 'completed',
  'closed': 'completed'
};

// Map Hub status to ClickUp status names
const HUB_TO_CLICKUP_STATUS = {
  'pending': 'to do',
  'in_progress': 'in progress',
  'completed': 'complete'
};

// Handle incoming ClickUp webhooks
async function handleClickUpWebhook(request, env, corsHeaders) {
  try {
    const payload = await request.json();
    console.log('ClickUp webhook received:', JSON.stringify(payload));

    // ClickUp sends task_status_updated when status changes
    if (payload.event === 'taskStatusUpdated' || payload.event === 'task_status_updated') {
      const taskId = payload.task_id;
      const newStatus = payload.history_items?.[0]?.after?.status || payload.status?.status;

      if (!taskId || !newStatus) {
        console.log('Missing task_id or status in webhook payload');
        return Response.json({ success: true, message: 'Ignored - missing data' }, { headers: corsHeaders });
      }

      // Find case by clickup_task_id
      const caseData = await env.ANALYTICS_DB.prepare(
        `SELECT case_id, status, last_sync_source FROM cases WHERE clickup_task_id = ?`
      ).bind(taskId).first();

      if (!caseData) {
        console.log('No matching case found for ClickUp task:', taskId);
        return Response.json({ success: true, message: 'No matching case' }, { headers: corsHeaders });
      }

      // Prevent sync loops - if last sync was from Hub, skip this update
      const timeSinceSync = caseData.last_sync_at
        ? (Date.now() - new Date(caseData.last_sync_at).getTime()) / 1000
        : 999999;

      if (caseData.last_sync_source === 'hub' && timeSinceSync < 30) {
        console.log('Skipping ClickUp webhook - recent Hub sync detected');
        return Response.json({ success: true, message: 'Skipped - recent Hub sync' }, { headers: corsHeaders });
      }

      // Map ClickUp status to Hub status
      const hubStatus = CLICKUP_STATUS_MAP[newStatus.toLowerCase()] || 'pending';

      // Only update if status actually changed
      if (caseData.status === hubStatus) {
        return Response.json({ success: true, message: 'Status unchanged' }, { headers: corsHeaders });
      }

      const now = new Date().toISOString();
      const oldStatus = caseData.status;

      // Update case status
      let updateQuery = `UPDATE cases SET status = ?, updated_at = ?, last_sync_at = ?, last_sync_source = 'clickup'`;
      const params = [hubStatus, now, now];

      if (hubStatus === 'completed' && oldStatus !== 'completed') {
        updateQuery += `, resolved_at = ?`;
        params.push(now);
      }

      updateQuery += ` WHERE case_id = ?`;
      params.push(caseData.case_id);

      await env.ANALYTICS_DB.prepare(updateQuery).bind(...params).run();

      // Log activity
      await env.ANALYTICS_DB.prepare(
        `INSERT INTO case_activity (case_id, activity_type, field_name, old_value, new_value, actor, source) VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(caseData.case_id, 'status_changed', 'status', oldStatus, hubStatus, 'clickup_webhook', 'clickup').run();

      console.log(`Case ${caseData.case_id} status synced from ClickUp: ${oldStatus} -> ${hubStatus}`);
      return Response.json({ success: true, message: 'Status synced from ClickUp' }, { headers: corsHeaders });
    }

    // Handle comment added in ClickUp
    if (payload.event === 'taskCommentPosted' || payload.event === 'task_comment_posted') {
      const taskId = payload.task_id;
      const comment = payload.history_items?.[0]?.comment || payload.comment;

      if (!taskId || !comment) {
        return Response.json({ success: true, message: 'Ignored - missing comment data' }, { headers: corsHeaders });
      }

      const caseData = await env.ANALYTICS_DB.prepare(
        `SELECT case_id FROM cases WHERE clickup_task_id = ?`
      ).bind(taskId).first();

      if (!caseData) {
        return Response.json({ success: true, message: 'No matching case' }, { headers: corsHeaders });
      }

      // Check if comment already exists (by clickup_comment_id)
      const existingComment = await env.ANALYTICS_DB.prepare(
        `SELECT id FROM case_comments WHERE clickup_comment_id = ?`
      ).bind(comment.id).first();

      if (existingComment) {
        return Response.json({ success: true, message: 'Comment already synced' }, { headers: corsHeaders });
      }

      // Insert comment
      const now = new Date().toISOString();
      await env.ANALYTICS_DB.prepare(
        `INSERT INTO case_comments (case_id, content, author_name, source, clickup_comment_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(caseData.case_id, comment.comment_text || comment.text_content || '', comment.user?.username || 'ClickUp User', 'clickup', comment.id, now).run();

      console.log(`Comment synced from ClickUp to case ${caseData.case_id}`);
      return Response.json({ success: true, message: 'Comment synced from ClickUp' }, { headers: corsHeaders });
    }

    return Response.json({ success: true, message: 'Event type not handled' }, { headers: corsHeaders });
  } catch (error) {
    console.error('ClickUp webhook error:', error);
    return Response.json({ error: 'Webhook processing failed' }, { status: 500, headers: corsHeaders });
  }
}

// Sync Hub status change TO ClickUp
async function syncStatusToClickUp(env, caseId, newStatus) {
  try {
    // Get case with ClickUp task ID
    const caseData = await env.ANALYTICS_DB.prepare(
      `SELECT clickup_task_id FROM cases WHERE case_id = ?`
    ).bind(caseId).first();

    if (!caseData?.clickup_task_id) {
      console.log('No ClickUp task linked to case:', caseId);
      return { success: false, reason: 'No ClickUp task' };
    }

    const clickupStatus = HUB_TO_CLICKUP_STATUS[newStatus] || 'to do';

    // Update ClickUp task status
    const response = await fetch(`https://api.clickup.com/api/v2/task/${caseData.clickup_task_id}`, {
      method: 'PUT',
      headers: {
        'Authorization': env.CLICKUP_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: clickupStatus }),
    });

    if (response.ok) {
      console.log(`ClickUp task ${caseData.clickup_task_id} status updated to: ${clickupStatus}`);
      return { success: true };
    } else {
      console.error('Failed to update ClickUp status:', response.status);
      return { success: false, reason: 'ClickUp API error' };
    }
  } catch (error) {
    console.error('Error syncing to ClickUp:', error);
    return { success: false, reason: error.message };
  }
}

// Sync Hub comment TO ClickUp
async function syncCommentToClickUp(env, caseId, content, authorName) {
  try {
    const caseData = await env.ANALYTICS_DB.prepare(
      `SELECT clickup_task_id FROM cases WHERE case_id = ?`
    ).bind(caseId).first();

    if (!caseData?.clickup_task_id) {
      return { success: false, reason: 'No ClickUp task' };
    }

    const response = await fetch(`https://api.clickup.com/api/v2/task/${caseData.clickup_task_id}/comment`, {
      method: 'POST',
      headers: {
        'Authorization': env.CLICKUP_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment_text: `[${authorName || 'Hub'}] ${content}`,
      }),
    });

    if (response.ok) {
      console.log('Comment synced to ClickUp');
      return { success: true };
    } else {
      console.error('Failed to sync comment to ClickUp:', response.status);
      return { success: false };
    }
  } catch (error) {
    console.error('Error syncing comment to ClickUp:', error);
    return { success: false };
  }
}

// ============================================
// RESOLUTION HUB HTML
// ============================================
function getResolutionHubHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resolution Hub | PuppyPad</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
  <style>
    :root { --brand-navy: #1e3a5f; --brand-navy-light: #2d4a6f; --accent-teal: #4fd1c5; --accent-coral: #f56565; --gray-50: #f9fafb; --gray-100: #f3f4f6; --gray-200: #e5e7eb; --gray-300: #d1d5db; --gray-400: #9ca3af; --gray-500: #6b7280; --gray-600: #4b5563; --gray-700: #374151; --gray-800: #1f2937; --gray-900: #111827; --success: #10b981; --warning: #f59e0b; --error: #ef4444; --sidebar-width: 260px; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, sans-serif; background: var(--gray-50); color: var(--gray-800); min-height: 100vh; }
    .app-container { display: flex; min-height: 100vh; }
    .sidebar { width: var(--sidebar-width); background: var(--brand-navy); color: white; position: fixed; top: 0; left: 0; height: 100vh; display: flex; flex-direction: column; z-index: 100; }
    .sidebar-header { padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .sidebar-logo { display: flex; align-items: center; gap: 12px; }
    .sidebar-logo img { height: 32px; filter: brightness(0) invert(1); }
    .sidebar-logo span { font-family: 'Poppins', sans-serif; font-size: 18px; font-weight: 600; }
    .sidebar-nav { flex: 1; padding: 16px 0; overflow-y: auto; }
    .nav-section { margin-bottom: 24px; }
    .nav-section-title { padding: 8px 24px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255,255,255,0.5); }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 24px; color: rgba(255,255,255,0.7); text-decoration: none; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; border-left: 3px solid transparent; }
    .nav-item:hover { background: rgba(255,255,255,0.1); color: white; }
    .nav-item.active { background: rgba(255,255,255,0.1); color: white; border-left-color: var(--accent-teal); }
    .nav-item svg { width: 20px; height: 20px; flex-shrink: 0; }
    .nav-item .badge { margin-left: auto; background: var(--accent-coral); color: white; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; min-width: 20px; text-align: center; }
    .sidebar-footer { padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.1); }
    .user-info { display: flex; align-items: center; gap: 12px; }
    .user-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--accent-teal); display: flex; align-items: center; justify-content: center; font-weight: 600; }
    .user-name { font-size: 14px; font-weight: 500; }
    .user-role { font-size: 12px; color: rgba(255,255,255,0.5); }
    .main-content { flex: 1; margin-left: var(--sidebar-width); display: flex; flex-direction: column; }
    .top-header { background: white; padding: 16px 32px; border-bottom: 1px solid var(--gray-200); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 50; }
    .page-title { font-family: 'Poppins', sans-serif; font-size: 24px; font-weight: 600; color: var(--gray-900); }
    .header-actions { display: flex; align-items: center; gap: 16px; }
    .search-box { display: flex; align-items: center; background: var(--gray-100); border-radius: 8px; padding: 8px 16px; gap: 8px; width: 300px; }
    .search-box input { border: none; background: none; outline: none; font-size: 14px; width: 100%; }
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; border: none; }
    .btn-primary { background: var(--brand-navy); color: white; }
    .btn-secondary { background: white; color: var(--gray-700); border: 1px solid var(--gray-200); }
    .btn-secondary:hover { background: var(--gray-50); }
    .page-content { flex: 1; padding: 32px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 32px; }
    .stat-card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .stat-card.highlight { background: linear-gradient(135deg, var(--brand-navy) 0%, var(--brand-navy-light) 100%); color: white; }
    .stat-label { font-size: 13px; color: var(--gray-500); margin-bottom: 8px; }
    .stat-card.highlight .stat-label { color: rgba(255,255,255,0.7); }
    .stat-value { font-family: 'Poppins', sans-serif; font-size: 32px; font-weight: 700; }
    .stat-change { display: inline-flex; font-size: 12px; margin-top: 8px; padding: 4px 8px; border-radius: 4px; background: rgba(16, 185, 129, 0.1); color: var(--success); }
    .cases-card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
    .cases-header { padding: 20px 24px; border-bottom: 1px solid var(--gray-100); display: flex; justify-content: space-between; align-items: center; }
    .cases-title { font-size: 16px; font-weight: 600; }
    .cases-table { width: 100%; border-collapse: collapse; }
    .cases-table th, .cases-table td { padding: 14px 20px; text-align: left; border-bottom: 1px solid var(--gray-100); }
    .cases-table th { background: var(--gray-50); font-size: 12px; font-weight: 600; color: var(--gray-500); text-transform: uppercase; }
    .cases-table tbody tr { cursor: pointer; transition: background 0.2s; }
    .cases-table tbody tr:hover { background: var(--gray-50); }
    .case-id { font-family: monospace; font-size: 13px; color: var(--brand-navy); font-weight: 500; }
    .customer-info { display: flex; flex-direction: column; gap: 2px; }
    .customer-name { font-weight: 500; }
    .customer-email { font-size: 12px; color: var(--gray-500); }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .status-badge.pending { background: #fef3c7; color: #d97706; }
    .status-badge.in-progress { background: #dbeafe; color: #2563eb; }
    .status-badge.completed { background: #d1fae5; color: #059669; }
    .status-badge.abandoned { background: #fee2e2; color: #dc2626; }
    .due-badge { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    .due-badge.due-done { background: #d1fae5; color: #059669; }
    .due-badge.due-overdue { background: #fee2e2; color: #dc2626; }
    .due-badge.due-urgent { background: #fef3c7; color: #d97706; }
    .due-badge.due-warning { background: #fed7aa; color: #c2410c; }
    .due-badge.due-ok { background: #e0e7ff; color: #4f46e5; }
    .type-badge { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
    .type-badge.refund { background: #fee2e2; color: #dc2626; }
    .type-badge.shipping { background: #dbeafe; color: #2563eb; }
    .type-badge.subscription { background: #d1fae5; color: #059669; }
    .type-badge.return { background: #fef3c7; color: #d97706; }
    .type-badge.manual { background: #e5e7eb; color: #374151; }
    .time-ago { font-size: 13px; color: var(--gray-500); }
    .spinner { width: 32px; height: 32px; border: 3px solid var(--gray-200); border-top-color: var(--brand-navy); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 40px auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { text-align: center; padding: 60px 20px; color: var(--gray-500); }
    @media (max-width: 1200px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) { .sidebar { transform: translateX(-100%); } .main-content { margin-left: 0; } }
    /* Modal Styles - Redesigned */
    .modal-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(4px); z-index: 200; justify-content: center; align-items: flex-start; padding: 32px; overflow-y: auto; }
    .modal-overlay.active { display: flex; }
    .modal { background: white; border-radius: 20px; width: 100%; max-width: 960px; max-height: 90vh; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.3); display: flex; flex-direction: column; }
    .modal-header { padding: 28px 32px; background: linear-gradient(135deg, var(--brand-navy) 0%, #2d4a6f 100%); color: white; display: flex; justify-content: space-between; align-items: flex-start; }
    .modal-header-content { flex: 1; }
    .modal-case-id { font-family: monospace; font-size: 13px; background: rgba(255,255,255,0.15); padding: 4px 12px; border-radius: 6px; display: inline-block; margin-bottom: 8px; }
    .modal-title { font-family: 'Poppins', sans-serif; font-size: 24px; font-weight: 600; margin-bottom: 8px; }
    .modal-meta { display: flex; align-items: center; gap: 16px; font-size: 14px; opacity: 0.9; }
    .modal-meta-item { display: flex; align-items: center; gap: 6px; }
    .modal-close { background: rgba(255,255,255,0.1); border: none; width: 40px; height: 40px; border-radius: 10px; font-size: 24px; cursor: pointer; color: white; display: flex; align-items: center; justify-content: center; transition: all 0.2s; margin-left: 16px; flex-shrink: 0; }
    .modal-close:hover { background: rgba(255,255,255,0.2); transform: scale(1.05); }
    .modal-body { flex: 1; overflow-y: auto; padding: 0; }
    .modal-grid { display: grid; grid-template-columns: 2fr 1fr; min-height: 100%; }
    .modal-main { padding: 28px 32px; border-right: 1px solid var(--gray-100); }
    .modal-sidebar { padding: 28px 24px; background: var(--gray-50); }
    .modal-section { margin-bottom: 28px; }
    .modal-section:last-child { margin-bottom: 0; }
    .modal-section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--gray-400); margin-bottom: 16px; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; }
    .modal-section-title svg { width: 16px; height: 16px; }
    .detail-card { background: white; border: 1px solid var(--gray-200); border-radius: 12px; padding: 20px; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--gray-100); }
    .detail-row:last-child { border-bottom: none; padding-bottom: 0; }
    .detail-row:first-child { padding-top: 0; }
    .detail-label { font-size: 13px; color: var(--gray-500); }
    .detail-value { font-size: 14px; font-weight: 600; color: var(--gray-800); text-align: right; max-width: 60%; word-break: break-word; }
    .detail-value.highlight { color: var(--brand-navy); }
    .detail-value.money { color: #059669; font-size: 16px; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
    .info-card { background: white; border: 1px solid var(--gray-200); border-radius: 12px; padding: 16px 20px; }
    .info-card-label { font-size: 11px; color: var(--gray-400); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .info-card-value { font-size: 15px; font-weight: 600; color: var(--gray-800); }
    .info-card-value.email { font-size: 13px; word-break: break-all; }
    /* Status Cards - New Design */
    .status-cards { display: flex; gap: 12px; }
    .status-card { flex: 1; display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: 12px; border: 2px solid var(--gray-200); background: white; cursor: pointer; transition: all 0.2s; position: relative; }
    .status-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .status-card-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .status-card-icon svg { width: 20px; height: 20px; }
    .status-card-content { flex: 1; text-align: left; }
    .status-card-title { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
    .status-card-desc { font-size: 11px; opacity: 0.7; }
    .status-card-check { position: absolute; top: 8px; right: 8px; width: 20px; height: 20px; border-radius: 50%; display: none; align-items: center; justify-content: center; }
    .status-card-check svg { width: 12px; height: 12px; }
    .status-card.pending { border-color: #fcd34d; }
    .status-card.pending .status-card-icon { background: #fffbeb; color: #b45309; }
    .status-card.pending .status-card-title { color: #b45309; }
    .status-card.pending .status-card-check { background: #f59e0b; color: white; }
    .status-card.in-progress { border-color: #93c5fd; }
    .status-card.in-progress .status-card-icon { background: #eff6ff; color: #1d4ed8; }
    .status-card.in-progress .status-card-title { color: #1d4ed8; }
    .status-card.in-progress .status-card-check { background: #3b82f6; color: white; }
    .status-card.completed { border-color: #6ee7b7; }
    .status-card.completed .status-card-icon { background: #ecfdf5; color: #047857; }
    .status-card.completed .status-card-title { color: #047857; }
    .status-card.completed .status-card-check { background: #10b981; color: white; }
    .status-card.active { box-shadow: 0 0 0 3px rgba(30,58,95,0.15); transform: scale(1.02); }
    .status-card.active .status-card-check { display: flex; }
    /* Modal Navigation */
    .modal-nav { display: flex; align-items: center; gap: 8px; margin-left: 16px; }
    .nav-arrow { background: rgba(255,255,255,0.1); border: none; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; color: white; display: flex; align-items: center; justify-content: center; transition: all 0.2s; position: relative; }
    .nav-arrow:hover:not(:disabled) { background: rgba(255,255,255,0.2); }
    .nav-arrow:disabled { opacity: 0.3; cursor: not-allowed; }
    .nav-arrow svg { width: 18px; height: 18px; }
    .nav-preview { display: none; position: absolute; top: 100%; padding: 8px 12px; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-size: 11px; color: var(--gray-700); white-space: nowrap; z-index: 10; }
    .nav-arrow.prev .nav-preview { right: 0; margin-top: 8px; }
    .nav-arrow.next .nav-preview { left: 0; margin-top: 8px; }
    .nav-arrow:hover .nav-preview { display: block; }
    .copy-url-btn { background: rgba(255,255,255,0.1); border: none; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; color: white; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .copy-url-btn:hover { background: rgba(255,255,255,0.2); }
    .copy-url-btn.copied { background: rgba(34,197,94,0.3); }
    .copy-url-btn svg { width: 18px; height: 18px; }
    .modal-close { background: rgba(255,255,255,0.1); border: none; width: 40px; height: 40px; border-radius: 10px; font-size: 24px; cursor: pointer; color: white; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .modal-close:hover { background: rgba(255,255,255,0.2); transform: scale(1.05); }
    .quick-actions { display: flex; flex-direction: column; gap: 10px; }
    .quick-action-btn { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: white; border: 1px solid var(--gray-200); border-radius: 10px; font-size: 14px; font-weight: 500; color: var(--gray-700); text-decoration: none; cursor: pointer; transition: all 0.2s; }
    .quick-action-btn:hover { background: white; border-color: var(--brand-navy); color: var(--brand-navy); transform: translateX(4px); }
    .quick-action-btn svg { width: 20px; height: 20px; flex-shrink: 0; }
    .quick-action-btn.primary { background: var(--brand-navy); color: white; border-color: var(--brand-navy); }
    .quick-action-btn.primary:hover { background: #3d5a80; }
    .quick-action-btn.replay { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; border: none; }
    .quick-action-btn.replay:hover { transform: translateX(4px); box-shadow: 0 4px 15px rgba(124,58,237,0.3); }
    .quick-action-btn.richpanel { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; border: none; }
    .quick-action-btn.richpanel:hover { transform: translateX(4px); box-shadow: 0 4px 15px rgba(14,165,233,0.3); }
    .comments-section { background: white; border: 1px solid var(--gray-200); border-radius: 12px; overflow: hidden; }
    .comments-header { padding: 16px 20px; border-bottom: 1px solid var(--gray-100); display: flex; justify-content: space-between; align-items: center; }
    .comments-title { font-size: 14px; font-weight: 600; }
    .comments-count { font-size: 12px; color: var(--gray-500); }
    .comments-list { max-height: 250px; overflow-y: auto; padding: 16px 20px; }
    .comments-list:empty::after { content: 'No comments yet'; color: var(--gray-400); font-size: 14px; display: block; text-align: center; padding: 20px; }
    .comment-item { background: var(--gray-50); padding: 14px 16px; border-radius: 10px; margin-bottom: 12px; }
    .comment-item:last-child { margin-bottom: 0; }
    .comment-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .comment-author { font-size: 13px; font-weight: 600; color: var(--gray-800); }
    .comment-time { font-size: 11px; color: var(--gray-400); }
    .comment-text { font-size: 14px; color: var(--gray-600); line-height: 1.5; }
    .comment-form { padding: 16px 20px; border-top: 1px solid var(--gray-100); background: var(--gray-50); }
    .comment-input-wrap { display: flex; gap: 12px; }
    .comment-input { flex: 1; padding: 12px 16px; border: 1px solid var(--gray-200); border-radius: 10px; font-size: 14px; resize: none; background: white; font-family: inherit; }
    .comment-input:focus { outline: none; border-color: var(--brand-navy); box-shadow: 0 0 0 3px rgba(30,58,95,0.1); }
    .comment-submit { padding: 12px 20px; background: var(--brand-navy); color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .comment-submit:hover { background: #3d5a80; }
    .timeline-card { border: 1px solid var(--gray-200); border-radius: 10px; }
    .timeline-item { display: flex; gap: 16px; padding: 14px 16px; border-bottom: 1px solid var(--gray-100); transition: background 0.15s; }
    .timeline-item:hover { background: var(--gray-50); }
    .timeline-item:last-child { border-bottom: none; }
    .timeline-dot { width: 10px; height: 10px; background: var(--brand-navy); border-radius: 50%; margin-top: 5px; flex-shrink: 0; box-shadow: 0 0 0 3px rgba(30,64,175,0.1); }
    .timeline-content { flex: 1; min-width: 0; }
    .timeline-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; gap: 8px; }
    .timeline-label { font-size: 12px; color: var(--gray-600); font-weight: 600; }
    .timeline-time { font-size: 11px; color: var(--gray-400); flex-shrink: 0; }
    .timeline-value { font-size: 13px; font-weight: 500; color: var(--gray-700); word-break: break-word; }
    .timeline-actor { font-size: 11px; color: var(--gray-400); margin-top: 4px; }
    @media (max-width: 900px) { .modal-grid { grid-template-columns: 1fr; } .modal-sidebar { border-top: 1px solid var(--gray-100); } }

    /* Performance Dashboard Styles */
    .analytics-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .analytics-title-section h2 { font-size: 24px; font-weight: 700; color: var(--gray-900); margin: 0 0 4px 0; }
    .analytics-title-section p { font-size: 14px; color: var(--gray-500); margin: 0; }
    .analytics-actions { display: flex; gap: 12px; align-items: center; }

    /* KPI Cards Grid */
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    @media (max-width: 1200px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) { .kpi-grid { grid-template-columns: 1fr; } }

    .kpi-card { background: white; border-radius: 16px; padding: 20px; display: flex; gap: 16px; align-items: flex-start; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border: 1px solid var(--gray-100); transition: all 0.2s; }
    .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
    .kpi-card.highlight { background: linear-gradient(135deg, var(--brand-navy) 0%, #2d4a6f 100%); border: none; }
    .kpi-card.highlight .kpi-value, .kpi-card.highlight .kpi-label, .kpi-card.highlight .kpi-sub { color: white; }
    .kpi-card.highlight .kpi-sub { opacity: 0.8; }
    .kpi-card.success { border-left: 4px solid #10b981; }
    .kpi-card.warning { border-left: 4px solid #f59e0b; }
    .kpi-card.danger { border-left: 4px solid #ef4444; }
    .kpi-sub.alert { color: #ef4444; font-weight: 600; }

    .kpi-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .kpi-icon svg { width: 24px; height: 24px; }

    .kpi-content { flex: 1; min-width: 0; }
    .kpi-value { font-size: 28px; font-weight: 700; color: var(--gray-900); line-height: 1.2; }
    .kpi-label { font-size: 13px; font-weight: 500; color: var(--gray-600); margin-top: 2px; }
    .kpi-sub { font-size: 12px; color: var(--gray-400); margin-top: 4px; }
    .kpi-sub.alert { color: #ef4444; font-weight: 500; }

    /* Charts Grid */
    .charts-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-top: 24px; }
    @media (max-width: 1000px) { .charts-grid { grid-template-columns: 1fr; } }

    .chart-card { background: white; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border: 1px solid var(--gray-100); overflow: hidden; }
    .chart-header { padding: 20px 24px 16px; border-bottom: 1px solid var(--gray-100); display: flex; justify-content: space-between; align-items: center; }
    .chart-header h3 { font-size: 16px; font-weight: 600; color: var(--gray-800); margin: 0; }
    .chart-period { font-size: 12px; color: var(--gray-400); background: var(--gray-50); padding: 4px 10px; border-radius: 20px; }
    .chart-body { padding: 20px 24px 24px; }

    /* Breakdown Cards Grid */
    .breakdown-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 24px; }
    @media (max-width: 900px) { .breakdown-grid { grid-template-columns: 1fr; } }

    .breakdown-card { background: white; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border: 1px solid var(--gray-100); overflow: hidden; }
    .breakdown-header { padding: 16px 20px; border-bottom: 1px solid var(--gray-100); display: flex; justify-content: space-between; align-items: center; }
    .breakdown-header h3 { font-size: 15px; font-weight: 600; color: var(--gray-800); margin: 0; }
    .breakdown-count { font-size: 12px; color: var(--gray-400); background: var(--gray-50); padding: 4px 10px; border-radius: 20px; }

    .breakdown-list { padding: 8px 0; max-height: 300px; overflow-y: auto; }
    .breakdown-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; transition: background 0.15s; }
    .breakdown-item:hover { background: var(--gray-50); }
    .breakdown-item-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
    .breakdown-item-name { font-size: 14px; font-weight: 500; color: var(--gray-700); }
    .breakdown-item-meta { font-size: 12px; color: var(--gray-400); }
    .breakdown-item-count { font-size: 16px; font-weight: 700; color: var(--brand-navy); background: var(--gray-50); padding: 4px 12px; border-radius: 8px; flex-shrink: 0; }

    .empty-state { text-align: center; padding: 30px 20px; color: var(--gray-400); font-size: 14px; }
  </style>
  <link rel="stylesheet" href="/hub/hub-styles.css">
</head>
<body>
  <div id="toastContainer"></div>
  <div class="app-container">
    <aside class="sidebar">
      <div class="sidebar-header"><div class="sidebar-logo"><img src="https://cdn.shopify.com/s/files/1/0433/0510/7612/files/navyblue-logo.svg?v=1754231041" alt="PuppyPad"><span>Resolution Hub</span></div></div>
      <nav class="sidebar-nav">
        <div class="nav-section"><div class="nav-section-title">Overview</div><a class="nav-item active" data-page="dashboard"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>Dashboard</a></div>
        <div class="nav-section"><div class="nav-section-title">Cases</div><a class="nav-item" data-page="cases" data-filter="all"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>All Cases<span class="badge" id="allCasesCount">0</span></a><a class="nav-item" data-page="cases" data-filter="shipping"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>Shipping<span class="badge" id="shippingCount">0</span></a><a class="nav-item" data-page="cases" data-filter="refund"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>Refunds<span class="badge" id="refundCount">0</span></a><a class="nav-item" data-page="cases" data-filter="subscription"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>Subscriptions<span class="badge" id="subscriptionCount">0</span></a><a class="nav-item" data-page="cases" data-filter="manual"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>Manual Review<span class="badge" id="manualCount">0</span></a></div>
        <div class="nav-section"><div class="nav-section-title">Activity</div><a class="nav-item" data-page="sessions"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>Sessions</a><a class="nav-item" data-page="events"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>Event Log</a><a class="nav-item" data-page="issues"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>Issue Reports<span class="badge issue-badge" id="issuesCount">0</span></a></div>
        <div class="nav-section"><div class="nav-section-title">Analytics</div><a class="nav-item" data-page="analytics"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>Performance</a></div>
      </nav>
      <div class="sidebar-footer"><div class="user-info"><div class="user-avatar">A</div><div><div class="user-name">Admin</div><div class="user-role">Administrator</div></div></div></div>
    </aside>
    <main class="main-content">
      <header class="top-header"><h1 class="page-title" id="pageTitle">Dashboard</h1><div class="header-actions"><div class="search-box"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg><input type="text" placeholder="Search cases, orders..." id="searchInput"></div><button class="btn btn-secondary" onclick="refreshData()">Refresh</button></div></header>
      <div class="page-content">
        <div id="dashboardView">
          <div class="stats-grid"><div class="stat-card highlight"><div class="stat-label">Pending Cases</div><div class="stat-value" id="statPending">-</div><div class="stat-change">Needs attention</div></div><div class="stat-card"><div class="stat-label">In Progress</div><div class="stat-value" id="statInProgress">-</div></div><div class="stat-card"><div class="stat-label">Completed Today</div><div class="stat-value" id="statCompletedToday">-</div></div><div class="stat-card"><div class="stat-label">Avg. Resolution Time</div><div class="stat-value" id="statAvgTime">-</div></div></div>
          <div class="cases-card"><div class="cases-header"><h2 class="cases-title">Recent Cases</h2><button class="btn btn-secondary" onclick="navigateTo('cases','all')">View All</button></div><table class="cases-table"><thead><tr><th>Case ID</th><th>Customer</th><th>Type</th><th>Status</th><th>Created</th></tr></thead><tbody id="recentCasesBody"><tr><td colspan="5"><div class="spinner"></div></td></tr></tbody></table></div>
        </div>
        <div id="casesView" style="display:none"></div>
        <div id="sessionsView" style="display:none"></div>
        <div id="eventsView" style="display:none"></div>
        <div id="issuesView" style="display:none"></div>
        <div id="analyticsView" style="display:none"></div>
      </div>
    </main>
  </div>

  <!-- Case Detail Modal - Redesigned -->
  <div class="modal-overlay" id="caseModal">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-header-content">
          <div class="modal-case-id" id="modalCaseId">Loading...</div>
          <div class="modal-title" id="modalCustomerName">Customer Name</div>
          <div class="modal-meta">
            <div class="modal-meta-item" id="modalCaseType">
              <span class="type-badge">-</span>
            </div>
            <div class="modal-meta-item" id="modalStatusBadge">
              <span class="status-badge">-</span>
            </div>
            <div class="modal-meta-item" id="modalTimeAgo">-</div>
          </div>
        </div>
        <div class="modal-nav">
          <button class="nav-arrow prev" id="prevCaseBtn" onclick="navigateCase('prev')" title="Previous case">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            <span class="nav-preview" id="prevCasePreview"></span>
          </button>
          <button class="nav-arrow next" id="nextCaseBtn" onclick="navigateCase('next')" title="Next case">
            <span class="nav-preview" id="nextCasePreview"></span>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
          <button class="copy-url-btn" onclick="copyCaseUrl()" title="Copy case URL">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
          </button>
          <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
      </div>
      <div class="modal-body">
        <div class="modal-grid">
          <div class="modal-main">
            <!-- Status Section -->
            <div class="modal-section">
              <div class="modal-section-title">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Update Status
              </div>
              <div class="status-cards">
                <button class="status-card pending" onclick="updateStatus('pending')">
                  <div class="status-card-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <div class="status-card-content">
                    <div class="status-card-title">Pending</div>
                    <div class="status-card-desc">Awaiting review</div>
                  </div>
                  <div class="status-card-check"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg></div>
                </button>
                <button class="status-card in-progress" onclick="updateStatus('in_progress')">
                  <div class="status-card-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  </div>
                  <div class="status-card-content">
                    <div class="status-card-title">In Progress</div>
                    <div class="status-card-desc">Being worked on</div>
                  </div>
                  <div class="status-card-check"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg></div>
                </button>
                <button class="status-card completed" onclick="updateStatus('completed')">
                  <div class="status-card-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <div class="status-card-content">
                    <div class="status-card-title">Completed</div>
                    <div class="status-card-desc">Case resolved</div>
                  </div>
                  <div class="status-card-check"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg></div>
                </button>
              </div>
            </div>

            <!-- Customer & Order Info -->
            <div class="modal-section">
              <div class="modal-section-title">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                Customer & Order
              </div>
              <div class="info-grid">
                <div class="info-card">
                  <div class="info-card-label">Customer Email</div>
                  <div class="info-card-value email" id="modalCustomerEmail">-</div>
                </div>
                <div class="info-card">
                  <div class="info-card-label">Order Number</div>
                  <div class="info-card-value" id="modalOrderNumber">-</div>
                </div>
                <div class="info-card">
                  <div class="info-card-label">Order Date</div>
                  <div class="info-card-value" id="modalOrderDate">-</div>
                </div>
                <div class="info-card">
                  <div class="info-card-label">Session ID</div>
                  <div class="info-card-value" id="modalSessionId" style="font-size:11px;font-family:monospace;">-</div>
                </div>
              </div>
            </div>

            <!-- Resolution (At-a-Glance) -->
            <div class="modal-section">
              <div class="modal-section-title">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                Resolution (At-a-Glance)
              </div>
              <div class="detail-card" style="background: linear-gradient(135deg, #667eea15, #764ba215); border: 2px solid #667eea;">
                <div class="detail-row" style="border-bottom: none;">
                  <span class="detail-value" id="modalResolution" style="font-weight: 600; color: #1a1a2e; font-size: 14px; line-height: 1.5;">-</span>
                </div>
              </div>
            </div>

            <!-- Case Details (Full Breakdown) -->
            <div class="modal-section">
              <div class="modal-section-title">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                Case Details
              </div>
              <div class="detail-card" id="modalCaseDetails">
                <!-- Populated dynamically -->
              </div>
            </div>

            <!-- Timestamps -->
            <div class="modal-section">
              <div class="modal-section-title">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Timestamps
              </div>
              <div class="detail-card">
                <div class="detail-row">
                  <span class="detail-label">Refund Amount</span>
                  <span class="detail-value money" id="modalRefundAmount">-</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Created</span>
                  <span class="detail-value" id="modalCreatedAt">-</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Last Updated</span>
                  <span class="detail-value" id="modalUpdatedAt">-</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Due Date</span>
                  <span class="detail-value" id="modalDueDate">-</span>
                </div>
              </div>
            </div>

            <!-- Comments Section -->
            <div class="modal-section">
              <div class="modal-section-title">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                Team Comments
              </div>
              <div class="comments-section">
                <div class="comments-header">
                  <span class="comments-title">Internal Notes</span>
                  <span class="comments-count" id="commentsCount">0 comments</span>
                </div>
                <div class="comments-list" id="commentsList"></div>
                <div class="comment-form">
                  <div class="comment-input-wrap">
                    <textarea class="comment-input" id="commentInput" placeholder="Add a note or comment..." rows="2"></textarea>
                    <button class="comment-submit" onclick="addComment()">Post</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="modal-sidebar">
            <!-- Quick Actions -->
            <div class="modal-section">
              <div class="modal-section-title">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                Quick Actions
              </div>
              <div class="quick-actions">
                <a class="quick-action-btn" id="replayLink" href="#" target="_blank" style="display:none;">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg>
                  Watch Session Recording
                </a>
                <a class="quick-action-btn" id="richpanelLink" href="#" target="_blank" style="display:none;">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  View Conversation
                </a>
                <a class="quick-action-btn" id="clickupLink" href="#" target="_blank" style="display:none;">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                  View in ClickUp
                </a>
                <a class="quick-action-btn" id="shopifyLink" href="#" target="_blank" style="display:none;">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                  View Shopify Order
                </a>
                <a class="quick-action-btn" id="sopLink" href="#" target="_blank">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                  View SOP Guide
                </a>
              </div>
            </div>

            <!-- Timeline -->
            <div class="modal-section">
              <div class="modal-section-title" style="justify-content:space-between;">
                <span style="display:flex;align-items:center;gap:8px;">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Activity Timeline
                </span>
                <button class="btn btn-secondary" style="padding:4px 8px;font-size:11px;" onclick="loadCaseActivity()" title="Refresh activity">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                </button>
              </div>
              <div class="detail-card timeline-card" style="padding:0;max-height:300px;overflow-y:auto;">
                <div id="activityTimeline">
                  <div class="timeline-item">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                      <div class="timeline-label">Case Created</div>
                      <div class="timeline-value" id="timelineCreated">-</div>
                    </div>
                  </div>
                  <div class="timeline-item" id="timelineFirstResponseRow" style="display:none;">
                    <div class="timeline-dot" style="background:#059669;"></div>
                    <div class="timeline-content">
                      <div class="timeline-label">First Response</div>
                      <div class="timeline-value" id="timelineFirstResponse">-</div>
                    </div>
                  </div>
                  <div class="timeline-item" id="timelineResolvedRow" style="display:none;">
                    <div class="timeline-dot" style="background:#10b981;"></div>
                    <div class="timeline-content">
                      <div class="timeline-label">Resolved</div>
                      <div class="timeline-value" id="timelineResolved">-</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Issue Report Modal - Same structure as Case Modal -->
  <div class="modal-overlay" id="issueModal">
    <div class="modal">
      <div class="modal-header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
        <div class="modal-header-content">
          <div class="modal-case-id" id="issueModalId">Loading...</div>
          <div class="modal-title" id="issueModalName">Customer Name</div>
          <div class="modal-meta">
            <div class="modal-meta-item" id="issueModalStatusBadge">
              <span class="status-badge">-</span>
            </div>
            <div class="modal-meta-item" id="issueModalTime">-</div>
          </div>
        </div>
        <div class="modal-nav">
          <button class="nav-arrow prev" id="prevIssueBtn" onclick="navigateIssue('prev')" title="Previous issue">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button class="nav-arrow next" id="nextIssueBtn" onclick="navigateIssue('next')" title="Next issue">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
          <button class="modal-close" onclick="closeIssueModal()">&times;</button>
        </div>
      </div>
      <div class="modal-body">
        <div class="modal-grid">
          <div class="modal-main">
            <!-- Status Section - Same as Case Modal -->
            <div class="modal-section">
              <div class="modal-section-title">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Update Status
              </div>
              <div class="status-cards">
                <button class="status-card pending" onclick="updateIssueStatus('pending')">
                  <div class="status-card-icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
                  <div class="status-card-content"><div class="status-card-title">Pending</div><div class="status-card-desc">Awaiting review</div></div>
                  <div class="status-card-check"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg></div>
                </button>
                <button class="status-card in-progress" onclick="updateIssueStatus('in_progress')">
                  <div class="status-card-icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg></div>
                  <div class="status-card-content"><div class="status-card-title">In Progress</div><div class="status-card-desc">Being worked on</div></div>
                  <div class="status-card-check"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg></div>
                </button>
                <button class="status-card completed" onclick="updateIssueStatus('resolved')">
                  <div class="status-card-icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
                  <div class="status-card-content"><div class="status-card-title">Resolved</div><div class="status-card-desc">Issue fixed</div></div>
                  <div class="status-card-check"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg></div>
                </button>
              </div>
            </div>

            <!-- Customer Info - Same structure as Case Modal -->
            <div class="modal-section">
              <div class="modal-section-title">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                Customer Information
              </div>
              <div class="info-grid">
                <div class="info-card" style="grid-column: span 2;">
                  <div class="info-card-label">Email Address</div>
                  <div class="info-card-value email" id="issueModalEmail">-</div>
                </div>
              </div>
            </div>

            <!-- Issue Description - Styled like Resolution box -->
            <div class="modal-section">
              <div class="modal-section-title">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>
                Issue Description
              </div>
              <div class="detail-card" style="background: linear-gradient(135deg, #fef3c715, #f59e0b15); border: 2px solid #f59e0b;">
                <div class="detail-row" style="border-bottom: none;">
                  <span class="detail-value" id="issueModalDescription" style="font-weight: 500; color: #1a1a2e; font-size: 14px; line-height: 1.6; text-align: left; max-width: 100%; white-space: pre-wrap;">-</span>
                </div>
              </div>
            </div>

            <!-- Technical Details - Same structure as Case Modal -->
            <div class="modal-section">
              <div class="modal-section-title">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
                Technical Details
              </div>
              <div class="info-grid">
                <div class="info-card">
                  <div class="info-card-label">Session ID</div>
                  <div class="info-card-value" id="issueModalSession" style="font-size:11px;font-family:monospace;">-</div>
                </div>
                <div class="info-card">
                  <div class="info-card-label">Current Step</div>
                  <div class="info-card-value" id="issueModalStep">-</div>
                </div>
                <div class="info-card" style="grid-column: span 2;">
                  <div class="info-card-label">Browser</div>
                  <div class="info-card-value" id="issueModalBrowser" style="font-size:12px;word-break:break-all;">-</div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-sidebar">
            <!-- Quick Actions - Same structure as Case Modal -->
            <div class="modal-section">
              <div class="modal-section-title">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                Quick Actions
              </div>
              <div class="quick-actions">
                <a class="quick-action-btn" id="issueConversationLink" href="#" target="_blank" style="display:none;">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                  View Conversation
                </a>
                <a class="quick-action-btn" id="issueReplayLink" href="#" target="_blank" style="display:none;">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg>
                  Watch Session Recording
                </a>
                <a class="quick-action-btn" id="issueSopLink" href="https://docs.puppypad.com/sop/trouble-reports" target="_blank">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  View SOP
                </a>
              </div>
            </div>

            <!-- Timeline - Same structure as Case Modal -->
            <div class="modal-section">
              <div class="modal-section-title">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Timeline
              </div>
              <div class="detail-card" style="padding:16px;">
                <div class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">
                    <div class="timeline-label">Issue Reported</div>
                    <div class="timeline-value" id="issueTimelineCreated">-</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script>
    const API = '';
    let currentCase = null;
    let currentFilter = 'all';
    let casesList = [];
    let currentCaseIndex = -1;
    let issuesList = [];
    let currentIssueIndex = -1;
    let currentIssue = null;

    // Resolution code to human-readable text
    function formatResolution(code, amount) {
      if (!code) return '-';
      const amountStr = amount ? '$' + parseFloat(amount).toFixed(2) : '';
      const map = {
        // Standard refunds
        'full_refund': 'Process full refund' + (amountStr ? ' (' + amountStr + ')' : ' (calculate amount)'),
        'partial_20': 'Process 20% refund' + (amountStr ? ' (' + amountStr + ')' : '') + ' → Customer keeps product',
        'partial_30': 'Process 30% refund' + (amountStr ? ' (' + amountStr + ')' : '') + ' → Customer keeps product',
        'partial_40': 'Process 40% refund' + (amountStr ? ' (' + amountStr + ')' : '') + ' → Customer keeps product',
        'partial_50': 'Process 50% refund' + (amountStr ? ' (' + amountStr + ')' : '') + ' → Customer keeps product',
        'partial_75': 'Process 75% refund' + (amountStr ? ' (' + amountStr + ')' : '') + ' → Customer keeps product',
        'store_credit': 'Issue store credit',
        'replacement': 'Ship replacement',
        'exchange': 'Process exchange → Send return label, ship replacement after return',
        'reship': 'Reship order',
        'partial_20_reship': 'Process 20% refund + Reship order',
        'partial_50_reship': 'Process 50% refund + Reship order',
        'refund_missing_item': 'Calculate & refund missing item value',
        'reship_missing_item': 'Ship missing item',
        'reship_missing_item_bonus': 'Ship missing item + bonus for inconvenience',
        'replacement_damaged': 'Ship replacement for damaged item',
        'partial_missing': 'Process partial refund for missing item',
        'apology_note': 'Send apology note',
        'training_tips': 'Provide training tips',
        'manual_assistance': 'Manual review required',
        'manual_order_not_found': 'Manual review → Order not found in system',
        'escalate': 'Escalate to team',
        'no_action': 'No action required',

        // Quality difference resolutions - ACTION-ORIENTED
        'upgrade_keep_originals': 'Send $20/pad checkout link → Ship PuppyPad 2.0 after payment (customer keeps Originals)',
        'return_upgrade_enhanced': 'Wait for return tracking → Send $20/pad checkout link → Ship PuppyPad 2.0 after payment',
        'reship_quality_upgrade': 'Ship FREE PuppyPad 2.0 (customer keeps Originals) — We absorb cost',
        'full_refund_quality': 'Process refund (calculate amount) → Customer keeps Originals',
        'full_refund_quality_used': 'Process refund (calculate amount) → Items used, no return needed',
        'full_refund_quality_return': 'Wait for return → Process refund after received (calculate amount)',

        // Return flow
        'return_refund': 'Send return label → Refund' + (amountStr ? ' (' + amountStr + ')' : '') + ' after return received'
      };
      // Check for dynamic patterns
      const partialMatch = code.match(/^partial_(\\d+)$/);
      if (partialMatch) return 'Process ' + partialMatch[1] + '% refund' + (amountStr ? ' (' + amountStr + ')' : '') + ' → Customer keeps product';
      const partialReshipMatch = code.match(/^partial_(\\d+)_reship$/);
      if (partialReshipMatch) return 'Process ' + partialReshipMatch[1] + '% refund + Reship order';
      return map[code] || code.replace(/_/g, ' ').replace(/\\b\\w/g, c => c.toUpperCase());
    }

    document.querySelectorAll('.nav-item').forEach(i => i.addEventListener('click', () => navigateTo(i.dataset.page, i.dataset.filter)));
    document.getElementById('caseModal').addEventListener('click', e => { if(e.target.id === 'caseModal') closeModal(); });

    function navigateTo(page, filter) {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      const sel = filter ? '.nav-item[data-page="'+page+'"][data-filter="'+filter+'"]' : '.nav-item[data-page="'+page+'"]';
      document.querySelector(sel)?.classList.add('active');
      document.getElementById('pageTitle').textContent = {dashboard:'Dashboard',cases:'Cases',sessions:'Sessions',events:'Event Log',issues:'Issue Reports',analytics:'Performance'}[page]||'Dashboard';
      ['dashboard','cases','sessions','events','issues','analytics'].forEach(v => document.getElementById(v+'View').style.display = v===page?'block':'none');
      if(page==='cases') { currentFilter = filter||'all'; loadCasesView(); }
      if(page==='sessions') loadSessionsView();
      if(page==='events') loadEventsView();
      if(page==='issues') loadIssuesView();
      if(page==='analytics') loadAnalyticsView();
    }

    async function loadDashboard() {
      try {
        const r = await fetch(API+'/hub/api/stats'); const d = await r.json();
        document.getElementById('statPending').textContent = d.pending||0;
        document.getElementById('statInProgress').textContent = d.inProgress||0;
        document.getElementById('statCompletedToday').textContent = d.completedToday||0;
        document.getElementById('statAvgTime').textContent = d.avgTime||'-';
        ['all','shipping','refund','subscription','manual'].forEach(t => { const el = document.getElementById((t==='all'?'allCases':t)+'Count'); if(el) el.textContent = d[t]||0; });
        loadRecentCases();
        // Load issues count
        loadIssuesCount();
      } catch(e) { console.error(e); }
    }

    async function loadIssuesCount() {
      try {
        const r = await fetch(API+'/hub/api/issues?limit=100');
        const d = await r.json();
        const pendingCount = (d.issues || []).filter(i => i.status !== 'resolved').length;
        const countEl = document.getElementById('issuesCount');
        if (countEl) countEl.textContent = pendingCount;
      } catch(e) { console.log('Issues count load skipped:', e.message); }
    }

    async function loadRecentCases() {
      try {
        const r = await fetch(API+'/hub/api/cases?limit=10'); const d = await r.json();
        const tbody = document.getElementById('recentCasesBody');
        if (!d.cases?.length) { tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No cases yet</td></tr>'; return; }
        casesList = d.cases || []; // Populate casesList for navigation
        tbody.innerHTML = d.cases.map(c => '<tr onclick="openCase(\\''+c.case_id+'\\')"><td><span class="case-id">'+c.case_id+'</span></td><td><div class="customer-info"><span class="customer-name">'+(c.customer_name||c.customer_email?.split('@')[0]||'Customer')+'</span><span class="customer-email">'+(c.customer_email||'')+'</span></div></td><td><span class="type-badge '+c.case_type+'">'+c.case_type+'</span></td><td><span class="status-badge '+(c.status||'').replace('_','-')+'">'+(c.status||'pending')+'</span></td><td class="time-ago">'+timeAgo(c.created_at)+'</td></tr>').join('');
      } catch(e) { console.error(e); }
    }

    async function loadCasesView() {
      const view = document.getElementById('casesView');
      view.innerHTML = '<div class="spinner"></div>';
      try {
        const url = currentFilter==='all' ? API+'/hub/api/cases?limit=50' : API+'/hub/api/cases?limit=50&filter='+currentFilter;
        const r = await fetch(url); const d = await r.json();
        casesList = d.cases || [];

        // Calculate due date status
        function getDueStatus(c) {
          if (!c.created_at) return { text: '-', class: '' };
          const dueDate = new Date(new Date(c.created_at).getTime() + 24*60*60*1000);
          const now = Date.now();
          const timeLeft = dueDate.getTime() - now;
          if (c.status === 'completed') return { text: '✓ Done', class: 'due-done' };
          if (timeLeft < 0) return { text: 'Overdue', class: 'due-overdue' };
          const hoursLeft = Math.floor(timeLeft / (60*60*1000));
          if (hoursLeft < 1) return { text: '<1h left', class: 'due-urgent' };
          if (hoursLeft < 6) return { text: hoursLeft + 'h left', class: 'due-warning' };
          return { text: hoursLeft + 'h left', class: 'due-ok' };
        }

        function renderCaseRow(c) {
          const due = getDueStatus(c);
          return '<tr>'+
            '<td onclick="event.stopPropagation()"><input type="checkbox" class="case-checkbox" data-case-id="'+c.case_id+'" onchange="toggleCaseSelect(\\''+c.case_id+'\\')" style="width:16px;height:16px;cursor:pointer;"></td>'+
            '<td onclick="openCase(\\''+c.case_id+'\\')" style="cursor:pointer;"><span class="case-id">'+c.case_id+'</span></td>'+
            '<td onclick="openCase(\\''+c.case_id+'\\')" style="cursor:pointer;"><div class="customer-info"><span class="customer-name">'+(c.customer_name||c.customer_email?.split('@')[0]||'Customer')+'</span><span class="customer-email">'+(c.customer_email||'')+'</span></div></td>'+
            '<td onclick="openCase(\\''+c.case_id+'\\')" style="cursor:pointer;"><span class="type-badge '+c.case_type+'">'+c.case_type+'</span></td>'+
            '<td onclick="openCase(\\''+c.case_id+'\\')" style="cursor:pointer;"><span class="status-badge '+(c.status||'').replace('_','-')+'">'+(c.status||'pending')+'</span></td>'+
            '<td onclick="openCase(\\''+c.case_id+'\\')" style="cursor:pointer;"><span class="due-badge '+due.class+'">'+due.text+'</span></td>'+
            '<td onclick="openCase(\\''+c.case_id+'\\')" style="cursor:pointer;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+formatResolution(c.resolution, c.refund_amount)+'</td>'+
            '<td onclick="openCase(\\''+c.case_id+'\\')" style="cursor:pointer;" class="time-ago">'+timeAgo(c.created_at)+'</td>'+
          '</tr>';
        }

        view.innerHTML = '<div class="cases-filters" style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">'+
          '<div class="search-input-wrapper" style="position:relative;flex:1;min-width:200px;max-width:400px;">'+
            '<svg style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--gray-400);" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>'+
            '<input type="text" id="caseSearchInput" placeholder="Search cases... (⌘K)" oninput="debounceSearch()" style="width:100%;padding:8px 12px 8px 36px;border:1px solid var(--gray-200);border-radius:8px;font-size:14px;"/>'+
            '<button id="clearSearchBtn" onclick="clearCaseSearch()" style="display:none;position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--gray-400);font-size:18px;line-height:1;">&times;</button>'+
          '</div>'+
          '<select id="caseStatusFilter" onchange="applyCaseFilters()" style="padding:8px 12px;border:1px solid var(--gray-200);border-radius:8px;font-size:14px;">'+
            '<option value="all">All Statuses</option>'+
            '<option value="pending">Pending</option>'+
            '<option value="in_progress">In Progress</option>'+
            '<option value="completed">Completed</option>'+
          '</select>'+
          '<select id="caseDueFilter" onchange="applyCaseFilters()" style="padding:8px 12px;border:1px solid var(--gray-200);border-radius:8px;font-size:14px;">'+
            '<option value="all">All Due Dates</option>'+
            '<option value="overdue">Overdue Only</option>'+
            '<option value="urgent">Due in < 6 hours</option>'+
            '<option value="today">Due Today</option>'+
          '</select>'+
          '<select id="caseSortBy" onchange="applyCaseFilters()" style="padding:8px 12px;border:1px solid var(--gray-200);border-radius:8px;font-size:14px;">'+
            '<option value="newest">Newest First</option>'+
            '<option value="oldest">Oldest First</option>'+
            '<option value="due_soonest">Due Soonest</option>'+
            '<option value="amount_high">Highest Amount</option>'+
          '</select>'+
          '<span id="searchResultsCount" style="font-size:13px;color:var(--gray-500);"></span>'+
        '</div>'+
        '<div class="cases-card"><table class="cases-table"><thead><tr><th style="width:40px;"><input type="checkbox" id="selectAllCases" onchange="toggleSelectAll(this.checked)" style="width:16px;height:16px;cursor:pointer;"></th><th>Case ID</th><th>Customer</th><th>Type</th><th>Status</th><th>Due</th><th>Resolution</th><th>Created</th></tr></thead><tbody id="casesTableBody">'+
          (casesList.length ? casesList.map(renderCaseRow).join('') : '<tr><td colspan="8" class="empty-state">No cases found</td></tr>')+
        '</tbody></table></div>';

        window.allCases = casesList;
        window.renderCaseRow = renderCaseRow;
        window.getDueStatus = getDueStatus;
      } catch(e) { console.error(e); view.innerHTML = '<div class="empty-state">Failed to load cases</div>'; }
    }

    let searchDebounceTimer = null;
    function debounceSearch() {
      const input = document.getElementById('caseSearchInput');
      const clearBtn = document.getElementById('clearSearchBtn');
      if (clearBtn) clearBtn.style.display = input.value ? 'block' : 'none';
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => applyCaseFilters(), 200);
    }

    function clearCaseSearch() {
      const input = document.getElementById('caseSearchInput');
      const clearBtn = document.getElementById('clearSearchBtn');
      if (input) input.value = '';
      if (clearBtn) clearBtn.style.display = 'none';
      applyCaseFilters();
    }

    // Bulk selection - use HubState from hub-app.js
    function toggleCaseSelect(caseId) {
      if (typeof HubBulkActions !== 'undefined') {
        HubBulkActions.toggleSelect(caseId);
      }
    }

    function toggleSelectAll(checked) {
      if (typeof HubBulkActions !== 'undefined') {
        if (checked) {
          HubBulkActions.selectAll();
        } else {
          HubBulkActions.deselectAll();
        }
      }
    }

    function applyCaseFilters() {
      const searchTerm = (document.getElementById('caseSearchInput')?.value || '').toLowerCase().trim();
      const statusFilter = document.getElementById('caseStatusFilter').value;
      const dueFilter = document.getElementById('caseDueFilter').value;
      const sortBy = document.getElementById('caseSortBy').value;
      let filtered = [...(window.allCases || [])];

      // Search filter - searches across multiple fields
      if (searchTerm) {
        filtered = filtered.filter(c => {
          const searchFields = [
            c.case_id,
            c.customer_name,
            c.customer_email,
            c.order_number,
            c.resolution,
            c.refund_reason,
            c.notes,
            c.case_type,
            c.status
          ].filter(Boolean).map(f => String(f).toLowerCase());
          return searchFields.some(field => field.includes(searchTerm));
        });
      }

      // Status filter
      if (statusFilter !== 'all') filtered = filtered.filter(c => c.status === statusFilter);

      // Due date filter
      if (dueFilter !== 'all') {
        filtered = filtered.filter(c => {
          if (!c.created_at || c.status === 'completed') return false;
          const dueDate = new Date(new Date(c.created_at).getTime() + 24*60*60*1000);
          const now = Date.now();
          const hoursLeft = (dueDate.getTime() - now) / (60*60*1000);
          if (dueFilter === 'overdue') return hoursLeft < 0;
          if (dueFilter === 'urgent') return hoursLeft >= 0 && hoursLeft < 6;
          if (dueFilter === 'today') return hoursLeft >= 0 && hoursLeft < 24;
          return true;
        });
      }

      // Sort
      filtered.sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
        if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
        if (sortBy === 'due_soonest') {
          const dueA = new Date(a.created_at).getTime() + 24*60*60*1000;
          const dueB = new Date(b.created_at).getTime() + 24*60*60*1000;
          return dueA - dueB;
        }
        if (sortBy === 'amount_high') return (parseFloat(b.refund_amount)||0) - (parseFloat(a.refund_amount)||0);
        return 0;
      });

      // Update results count
      const countEl = document.getElementById('searchResultsCount');
      const total = window.allCases?.length || 0;
      if (countEl) {
        if (searchTerm || statusFilter !== 'all' || dueFilter !== 'all') {
          countEl.textContent = filtered.length + ' of ' + total + ' cases';
        } else {
          countEl.textContent = '';
        }
      }

      const tbody = document.getElementById('casesTableBody');
      tbody.innerHTML = filtered.length ? filtered.map(window.renderCaseRow).join('') : '<tr><td colspan="8" class="empty-state">No cases match filters</td></tr>';
    }

    async function loadSessionsView() {
      const view = document.getElementById('sessionsView');
      view.innerHTML = '<div class="spinner"></div>';
      try {
        const r = await fetch(API+'/hub/api/sessions?limit=100'); const d = await r.json();
        const sessions = d.sessions || [];
        const completedSessions = sessions.filter(s => s.completed);
        const incompleteSessions = sessions.filter(s => !s.completed);

        // Calculate time status for sessions (sessions have 30 min typical duration)
        function getSessionTimeStatus(s) {
          if (s.completed) return { text: 'Completed', class: 'completed' };
          const created = new Date(s.created_at).getTime();
          const elapsed = Date.now() - created;
          const elapsedMins = Math.floor(elapsed / 60000);
          if (elapsedMins < 30) return { text: elapsedMins + 'm active', class: 'in-progress' };
          if (elapsedMins < 60) return { text: 'Idle ' + elapsedMins + 'm', class: 'pending' };
          const hours = Math.floor(elapsedMins / 60);
          return { text: 'Abandoned ' + hours + 'h ago', class: 'abandoned' };
        }

        function renderSessionRow(s) {
          const hasRecording = s.session_replay_url;
          const customerName = s.customer_name || s.customer_email?.split('@')[0] || 'Anonymous';
          const flowLabel = { 'refund': 'Refund Request', 'shipping': 'Shipping Issue', 'subscription': 'Subscription', 'manual': 'Manual Help', 'help': 'Help Request', 'track': 'Order Tracking' }[s.flow_type] || s.flow_type || 'Unknown';
          const timeStatus = getSessionTimeStatus(s);
          return '<tr>'+
            '<td><div style="display:flex;flex-direction:column;gap:4px;"><span class="customer-name">'+customerName+'</span><span class="customer-email" style="font-size:11px;color:var(--gray-400);">'+(s.customer_email||'No email')+'</span></div></td>'+
            '<td><span class="type-badge '+s.flow_type+'">'+flowLabel+'</span></td>'+
            '<td>'+(s.order_number||'-')+'</td>'+
            '<td><span class="status-badge '+timeStatus.class+'">'+timeStatus.text+'</span></td>'+
            '<td>'+timeAgo(s.created_at)+'</td>'+
            '<td>'+(hasRecording ? '<a href="'+s.session_replay_url+'" target="_blank" class="btn btn-secondary" style="padding:6px 12px;font-size:12px;">Watch Recording</a>' : '<span style="color:var(--gray-400);font-size:12px;">No recording</span>')+'</td>'+
          '</tr>';
        }

        // Count abandoned sessions
        const abandonedSessions = sessions.filter(s => !s.completed && (Date.now() - new Date(s.created_at).getTime()) > 60*60*1000);

        view.innerHTML = '<div class="sessions-container">'+
          '<div class="stats-grid" style="margin-bottom:24px;">'+
            '<div class="stat-card"><div class="stat-label">Total Sessions</div><div class="stat-value">'+sessions.length+'</div></div>'+
            '<div class="stat-card" style="border-left:3px solid #10b981;"><div class="stat-label">Completed</div><div class="stat-value" style="color:#10b981;">'+completedSessions.length+'</div></div>'+
            '<div class="stat-card" style="border-left:3px solid #f59e0b;"><div class="stat-label">In Progress</div><div class="stat-value" style="color:#f59e0b;">'+(incompleteSessions.length - abandonedSessions.length)+'</div></div>'+
            '<div class="stat-card" style="border-left:3px solid #ef4444;"><div class="stat-label">Abandoned</div><div class="stat-value" style="color:#ef4444;">'+abandonedSessions.length+'</div></div>'+
          '</div>'+
          '<div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">'+
            '<div class="tab-buttons" style="display:flex;gap:8px;">'+
              '<button class="btn btn-primary" id="tabAll" onclick="filterSessions(\\'all\\')">All ('+sessions.length+')</button>'+
              '<button class="btn btn-secondary" id="tabCompleted" onclick="filterSessions(\\'completed\\')">Completed ('+completedSessions.length+')</button>'+
              '<button class="btn btn-secondary" id="tabIncomplete" onclick="filterSessions(\\'incomplete\\')">In Progress ('+(incompleteSessions.length - abandonedSessions.length)+')</button>'+
              '<button class="btn btn-secondary" id="tabAbandoned" onclick="filterSessions(\\'abandoned\\')">Abandoned ('+abandonedSessions.length+')</button>'+
            '</div>'+
            '<select id="sessionSortBy" onchange="filterSessions(window.currentSessionFilter||\\'all\\')" style="padding:8px 12px;border:1px solid var(--gray-200);border-radius:8px;font-size:14px;">'+
              '<option value="newest">Newest First</option>'+
              '<option value="oldest">Oldest First</option>'+
            '</select>'+
          '</div>'+
          '<div class="cases-card"><table class="cases-table"><thead><tr><th>Customer</th><th>Flow Type</th><th>Order #</th><th>Status</th><th>Started</th><th>Recording</th></tr></thead><tbody id="sessionsTableBody">'+
            (sessions.length ? sessions.map(renderSessionRow).join('') : '<tr><td colspan="6" class="empty-state">No sessions yet</td></tr>')+
          '</tbody></table></div>'+
        '</div>';

        window.allSessions = sessions;
        window.renderSessionRow = renderSessionRow;
        window.currentSessionFilter = 'all';
      } catch(e) { console.error(e); view.innerHTML = '<div class="empty-state">Failed to load sessions</div>'; }
    }

    function filterSessions(filter) {
      window.currentSessionFilter = filter;
      const sortBy = document.getElementById('sessionSortBy')?.value || 'newest';
      let filtered = [...(window.allSessions || [])];

      if (filter === 'completed') filtered = filtered.filter(s => s.completed);
      if (filter === 'incomplete') filtered = filtered.filter(s => !s.completed && (Date.now() - new Date(s.created_at).getTime()) <= 60*60*1000);
      if (filter === 'abandoned') filtered = filtered.filter(s => !s.completed && (Date.now() - new Date(s.created_at).getTime()) > 60*60*1000);

      // Sort
      filtered.sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
        if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
        return 0;
      });

      const tbody = document.getElementById('sessionsTableBody');
      tbody.innerHTML = filtered.length ? filtered.map(window.renderSessionRow).join('') : '<tr><td colspan="6" class="empty-state">No sessions found</td></tr>';

      // Update tab styling
      document.getElementById('tabAll').className = filter === 'all' ? 'btn btn-primary' : 'btn btn-secondary';
      document.getElementById('tabCompleted').className = filter === 'completed' ? 'btn btn-primary' : 'btn btn-secondary';
      document.getElementById('tabIncomplete').className = filter === 'incomplete' ? 'btn btn-primary' : 'btn btn-secondary';
      document.getElementById('tabAbandoned').className = filter === 'abandoned' ? 'btn btn-primary' : 'btn btn-secondary';
    }

    async function loadEventsView() {
      const view = document.getElementById('eventsView');
      view.innerHTML = '<div class="spinner"></div>';
      try {
        const r = await fetch(API+'/hub/api/events?limit=100'); const d = await r.json();
        const events = d.events || [];

        // Format event for display
        function formatEventName(e) {
          const nameMap = {
            'flow_start': 'Started Resolution Flow',
            'flow_complete': 'Completed Resolution Flow',
            'step_view': 'Viewed Step',
            'step_complete': 'Completed Step',
            'order_lookup': 'Looked Up Order',
            'order_found': 'Order Found',
            'order_not_found': 'Order Not Found',
            'photo_upload': 'Uploaded Photo',
            'resolution_selected': 'Selected Resolution',
            'case_submitted': 'Case Submitted',
            'status_change': 'Status Changed',
            'page_view': 'Viewed Page',
            'button_click': 'Clicked Button',
            'form_submit': 'Submitted Form'
          };
          return nameMap[e.event_name] || e.event_name?.replace(/_/g, ' ').replace(/\\b\\w/g, c => c.toUpperCase()) || 'Unknown Event';
        }

        function formatEventDetails(e) {
          if (!e.event_data) return '-';
          try {
            const data = typeof e.event_data === 'string' ? JSON.parse(e.event_data) : e.event_data;
            // Create human-readable summary
            const parts = [];
            if (data.step_name) parts.push('Step: ' + data.step_name);
            if (data.flow_type) parts.push('Flow: ' + data.flow_type);
            if (data.order_number) parts.push('Order: #' + data.order_number);
            if (data.resolution) parts.push('Resolution: ' + data.resolution);
            if (data.old_status && data.new_status) parts.push(data.old_status + ' → ' + data.new_status);
            if (data.case_id) parts.push('Case: ' + data.case_id);
            return parts.length ? parts.join(' | ') : '-';
          } catch { return '-'; }
        }

        function getEventIcon(type) {
          const icons = {
            'flow_start': '🚀', 'flow_complete': '✅', 'step_view': '👁️', 'step_complete': '✓',
            'order_lookup': '🔍', 'order_found': '📦', 'order_not_found': '❌',
            'photo_upload': '📷', 'resolution_selected': '🎯', 'case_submitted': '📋',
            'status_change': '🔄', 'page_view': '📄', 'button_click': '👆', 'form_submit': '📝'
          };
          return icons[type] || '📌';
        }

        function getEventColor(type) {
          const colors = {
            'flow_start': '#3b82f6', 'flow_complete': '#10b981', 'case_submitted': '#8b5cf6',
            'status_change': '#f59e0b', 'order_not_found': '#ef4444', 'photo_upload': '#06b6d4'
          };
          return colors[type] || '#6b7280';
        }

        view.innerHTML = '<div class="events-container">'+
          '<div class="cases-card"><div class="cases-header"><h2 class="cases-title">Activity Log</h2><span style="color:var(--gray-500);">'+events.length+' recent events</span></div>'+
          '<div style="padding:0 20px 20px;">'+
            (events.length ? events.map(function(e) {
              return '<div style="display:flex;gap:16px;padding:16px 0;border-bottom:1px solid var(--gray-100);">'+
                '<div style="width:40px;height:40px;border-radius:10px;background:'+getEventColor(e.event_name)+'15;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">'+getEventIcon(e.event_name)+'</div>'+
                '<div style="flex:1;min-width:0;">'+
                  '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">'+
                    '<div>'+
                      '<div style="font-weight:600;color:var(--gray-800);margin-bottom:4px;">'+formatEventName(e)+'</div>'+
                      '<div style="font-size:13px;color:var(--gray-500);">'+formatEventDetails(e)+'</div>'+
                    '</div>'+
                    '<div style="font-size:12px;color:var(--gray-400);white-space:nowrap;">'+timeAgo(e.created_at)+'</div>'+
                  '</div>'+
                '</div>'+
              '</div>';
            }).join('') : '<div class="empty-state">No events yet</div>')+
          '</div></div>'+
        '</div>';
      } catch(e) { console.error(e); view.innerHTML = '<div class="empty-state">Failed to load events</div>'; }
    }

    // ============================================
    // ISSUES / TROUBLE REPORTS
    // ============================================

    async function loadIssuesView() {
      const view = document.getElementById('issuesView');
      view.innerHTML = '<div class="spinner"></div>';
      try {
        const r = await fetch(API+'/hub/api/issues?limit=50');
        const d = await r.json();
        issuesList = d.issues || [];

        // Update badge count
        const countEl = document.getElementById('issuesCount');
        if (countEl) countEl.textContent = issuesList.filter(i => i.status !== 'resolved').length;

        function renderIssueRow(issue) {
          const statusClass = (issue.status || 'pending').replace('_', '-');
          const shortDesc = (issue.description || '-').substring(0, 60) + ((issue.description || '').length > 60 ? '...' : '');
          return '<tr onclick="openIssue(\\''+issue.report_id+'\\')">'+
            '<td><span class="case-id" style="background:#fef3c7;color:#92400e;">'+issue.report_id+'</span></td>'+
            '<td><div class="customer-info"><span class="customer-name">'+(issue.name||'Unknown')+'</span><span class="customer-email">'+(issue.email||'')+'</span></div></td>'+
            '<td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--gray-600);">'+shortDesc+'</td>'+
            '<td><span class="status-badge '+statusClass+'">'+(issue.status||'pending')+'</span></td>'+
            '<td class="time-ago">'+timeAgo(issue.created_at)+'</td>'+
          '</tr>';
        }

        view.innerHTML = '<div class="cases-card">'+
          '<div class="cases-header">'+
            '<h2 class="cases-title">Issue Reports</h2>'+
            '<span style="color:var(--gray-500);">Users who reported problems with the resolution app</span>'+
          '</div>'+
          '<table class="cases-table">'+
            '<thead><tr><th>Report ID</th><th>Customer</th><th>Issue</th><th>Status</th><th>Reported</th></tr></thead>'+
            '<tbody>'+
              (issuesList.length ? issuesList.map(renderIssueRow).join('') : '<tr><td colspan="5" class="empty-state">No issue reports yet</td></tr>')+
            '</tbody>'+
          '</table>'+
        '</div>';

      } catch(e) {
        console.error(e);
        view.innerHTML = '<div class="empty-state">Failed to load issues</div>';
      }
    }

    async function openIssue(reportId) {
      document.getElementById('issueModal').classList.add('active');
      document.getElementById('issueModalId').textContent = reportId;
      document.getElementById('issueModalName').textContent = 'Loading...';

      currentIssueIndex = issuesList.findIndex(i => i.report_id === reportId);

      try {
        const r = await fetch(API+'/hub/api/issues/'+reportId);
        const issue = await r.json();
        currentIssue = issue;

        // Populate modal
        document.getElementById('issueModalId').textContent = issue.report_id;
        document.getElementById('issueModalName').textContent = issue.name || 'Unknown';
        const statusText = (issue.status || 'pending').replace('_', ' ');
        document.getElementById('issueModalStatusBadge').innerHTML = '<span class="status-badge '+(issue.status||'pending').replace('_','-')+'">'+statusText+'</span>';
        document.getElementById('issueModalTime').textContent = timeAgo(issue.created_at);

        document.getElementById('issueModalEmail').textContent = issue.email || '-';
        document.getElementById('issueModalDescription').textContent = issue.description || 'No description provided';

        document.getElementById('issueModalSession').textContent = issue.session_id || 'N/A';
        document.getElementById('issueModalStep').textContent = issue.current_step || 'Unknown';
        document.getElementById('issueModalBrowser').textContent = issue.browser || 'Unknown';

        document.getElementById('issueTimelineCreated').textContent = formatDate(issue.created_at);

        // Update status cards - highlight current status
        document.querySelectorAll('#issueModal .status-card').forEach(card => card.classList.remove('active'));
        const statusClass = (issue.status || 'pending') === 'resolved' ? 'completed' : (issue.status || 'pending').replace('_', '-');
        document.querySelector('#issueModal .status-card.' + statusClass)?.classList.add('active');

        // Richpanel conversation link
        const conversationLink = document.getElementById('issueConversationLink');
        if (issue.richpanel_conversation_no) {
          conversationLink.href = 'https://app.richpanel.com/conversations?viewId=search&conversationNo=' + issue.richpanel_conversation_no;
          conversationLink.style.display = 'flex';
        } else {
          conversationLink.style.display = 'none';
        }

        // Session replay link - use stored URL if available, otherwise construct from session ID
        const replayLink = document.getElementById('issueReplayLink');
        if (issue.session_replay_url) {
          replayLink.href = issue.session_replay_url;
          replayLink.style.display = 'flex';
        } else if (issue.session_id) {
          // Fallback: construct URL from session ID
          replayLink.href = 'https://app.posthog.com/replay/' + issue.session_id;
          replayLink.style.display = 'flex';
        } else {
          replayLink.style.display = 'none';
        }

        // Navigation buttons
        document.getElementById('prevIssueBtn').disabled = currentIssueIndex <= 0;
        document.getElementById('nextIssueBtn').disabled = currentIssueIndex >= issuesList.length - 1;

      } catch(e) {
        console.error(e);
        document.getElementById('issueModalDescription').textContent = 'Failed to load issue details';
      }
    }

    function closeIssueModal() {
      document.getElementById('issueModal').classList.remove('active');
      currentIssue = null;
    }

    function navigateIssue(direction) {
      if (direction === 'prev' && currentIssueIndex > 0) {
        openIssue(issuesList[currentIssueIndex - 1].report_id);
      } else if (direction === 'next' && currentIssueIndex < issuesList.length - 1) {
        openIssue(issuesList[currentIssueIndex + 1].report_id);
      }
    }

    async function updateIssueStatus(newStatus) {
      if (!currentIssue) return;
      try {
        const r = await fetch(API+'/hub/api/issues/'+currentIssue.report_id+'/status', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        if (r.ok) {
          currentIssue.status = newStatus;
          // Update UI - header badge
          const statusText = newStatus.replace('_', ' ');
          document.getElementById('issueModalStatusBadge').innerHTML = '<span class="status-badge '+newStatus.replace('_','-')+'">'+statusText+'</span>';
          // Update status cards
          document.querySelectorAll('#issueModal .status-card').forEach(card => card.classList.remove('active'));
          const statusClass = newStatus === 'resolved' ? 'completed' : newStatus.replace('_', '-');
          document.querySelector('#issueModal .status-card.' + statusClass)?.classList.add('active');
          // Refresh list
          loadIssuesView();
        }
      } catch(e) { console.error(e); }
    }

    // Close issue modal when clicking outside
    document.getElementById('issueModal').addEventListener('click', e => { if(e.target.id === 'issueModal') closeIssueModal(); });

    let analyticsCharts = {};

    async function loadAnalyticsView() {
      const view = document.getElementById('analyticsView');
      view.innerHTML = '<div class="spinner"></div>';
      try {
        const r = await fetch(API+'/hub/api/analytics'); const d = await r.json();
        const typeData = d.casesByType||[]; const statusData = d.casesByStatus||[];

        // Build resolution types list
        const resolutionList = (d.resolutionTypes||[]).map(function(r) {
          return '<div class="breakdown-item"><div class="breakdown-item-info"><span class="breakdown-item-name">'+formatResolution(r.resolution)+'</span><span class="breakdown-item-meta">'+(r.total_refund ? '$'+parseFloat(r.total_refund).toFixed(2)+' total' : '')+'</span></div><span class="breakdown-item-count">'+r.count+'</span></div>';
        }).join('') || '<div class="empty-state">No data</div>';

        // Build status list
        const statusList = statusData.map(function(s) {
          return '<div class="breakdown-item"><div class="breakdown-item-info"><span class="status-badge '+(s.status||'').replace('_','-')+'">'+(s.status||'unknown').replace('_',' ')+'</span></div><span class="breakdown-item-count">'+s.count+'</span></div>';
        }).join('') || '<div class="empty-state">No data</div>';

        // Build flow types list
        const flowList = (d.flowTypes||[]).map(function(f) {
          return '<div class="breakdown-item"><div class="breakdown-item-info"><span class="type-badge '+f.flow_type+'">'+(f.flow_type || 'unknown')+'</span></div><span class="breakdown-item-count">'+f.count+'</span></div>';
        }).join('') || '<div class="empty-state">No data</div>';

        // Build team performance leaderboard
        const teamList = (d.teamPerformance||[]).map(function(t, i) {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
          const avgHours = t.avg_resolution_hours ? t.avg_resolution_hours.toFixed(1) + 'h avg' : '';
          return '<div class="breakdown-item"><div class="breakdown-item-info"><span class="breakdown-item-name">' + medal + ' ' + (t.user_name || 'Unknown') + '</span><span class="breakdown-item-meta">' + avgHours + (t.total_refunds ? ' · $' + parseFloat(t.total_refunds).toFixed(0) + ' refunds' : '') + '</span></div><span class="breakdown-item-count">' + t.cases_completed + '</span></div>';
        }).join('') || '<div class="empty-state">No data yet</div>';

        // Build root cause analysis list
        const rootCauseList = (d.rootCauses||[]).map(function(r) {
          return '<div class="breakdown-item"><div class="breakdown-item-info"><span class="breakdown-item-name">' + formatResolution(r.reason) + '</span><span class="breakdown-item-meta">' + (r.total_amount ? '$' + parseFloat(r.total_amount).toFixed(0) + ' total' : '') + (r.avg_amount ? ' · $' + parseFloat(r.avg_amount).toFixed(0) + ' avg' : '') + '</span></div><span class="breakdown-item-count">' + r.count + '</span></div>';
        }).join('') || '<div class="empty-state">No data</div>';

        // Build resolution time distribution
        const timeDistList = (d.resolutionDistribution||[]).map(function(t) {
          const color = t.time_bucket === '< 1 hour' ? '#10b981' : t.time_bucket === '1-4 hours' ? '#22c55e' : t.time_bucket === '4-12 hours' ? '#f59e0b' : t.time_bucket === '12-24 hours' ? '#f97316' : '#ef4444';
          return '<div class="breakdown-item"><div class="breakdown-item-info"><span class="breakdown-item-name" style="color:' + color + ';">' + t.time_bucket + '</span></div><span class="breakdown-item-count">' + t.count + '</span></div>';
        }).join('') || '<div class="empty-state">No data</div>';

        // Format resolution time
        function formatHours(h) {
          if (!h || h === 0) return '-';
          if (h < 1) return Math.round(h * 60) + 'm';
          if (h < 24) return h.toFixed(1) + 'h';
          return (h / 24).toFixed(1) + 'd';
        }

        view.innerHTML = '<div class="analytics-header"><div class="analytics-title-section"><h2>Performance Dashboard</h2><p>Track your resolution metrics and KPIs</p></div><div class="analytics-actions"><select id="reportPeriod" onchange="loadAnalyticsView()" style="padding:10px 16px;border:1px solid var(--gray-200);border-radius:8px;font-size:14px;cursor:pointer;"><option value="14">Last 14 Days</option><option value="30">Last 30 Days</option><option value="90">Last 90 Days</option></select><button onclick="downloadReport()" class="btn btn-primary" style="display:inline-flex;align-items:center;gap:8px;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>Export Report</button></div></div>'+
          '<div class="kpi-grid">'+
            '<div class="kpi-card"><div class="kpi-icon" style="background:#eff6ff;color:#2563eb;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg></div><div class="kpi-content"><div class="kpi-value">'+(d.totalCases||0)+'</div><div class="kpi-label">Total Cases</div><div class="kpi-sub">'+(d.casesToday||0)+' today</div></div></div>'+
            '<div class="kpi-card"><div class="kpi-icon" style="background:#fef3c7;color:#d97706;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><div class="kpi-content"><div class="kpi-value">'+(d.pendingCases||0)+'</div><div class="kpi-label">Pending Cases</div><div class="kpi-sub'+((d.staleCases||0)>0?' alert':'')+'">'+(d.staleCases||0)+' overdue (24h+)</div></div></div>'+
            '<div class="kpi-card"><div class="kpi-icon" style="background:#dbeafe;color:#1d4ed8;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg></div><div class="kpi-content"><div class="kpi-value">'+(d.inProgressCases||0)+'</div><div class="kpi-label">In Progress</div><div class="kpi-sub">Being worked on</div></div></div>'+
            '<div class="kpi-card success"><div class="kpi-icon" style="background:#d1fae5;color:#059669;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><div class="kpi-content"><div class="kpi-value">'+(d.completedCases||0)+'</div><div class="kpi-label">Completed</div><div class="kpi-sub">'+(d.completionRate||0)+'% resolution rate</div></div></div>'+
          '</div>'+
          '<div class="kpi-grid" style="margin-top:16px;">'+
            '<div class="kpi-card highlight"><div class="kpi-icon" style="background:rgba(255,255,255,0.2);color:white;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><div class="kpi-content"><div class="kpi-value">$'+(d.totalRefunds||0).toFixed(2)+'</div><div class="kpi-label">Total Refunds</div><div class="kpi-sub">All time</div></div></div>'+
            '<div class="kpi-card"><div class="kpi-icon" style="background:#fce7f3;color:#db2777;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg></div><div class="kpi-content"><div class="kpi-value">$'+(d.refundsThisMonth||0).toFixed(2)+'</div><div class="kpi-label">Refunds (30d)</div><div class="kpi-sub">This month</div></div></div>'+
            '<div class="kpi-card"><div class="kpi-icon" style="background:#e0e7ff;color:#4f46e5;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg></div><div class="kpi-content"><div class="kpi-value">$'+(d.avgRefund||0).toFixed(2)+'</div><div class="kpi-label">Avg. Refund</div><div class="kpi-sub">Per case</div></div></div>'+
            '<div class="kpi-card"><div class="kpi-icon" style="background:#ecfdf5;color:#059669;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg></div><div class="kpi-content"><div class="kpi-value">'+(d.totalSessions||0)+'</div><div class="kpi-label">Total Sessions</div><div class="kpi-sub">'+(d.completionRate||0)+'% completion</div></div></div>'+
          '</div>'+
          // Time & SLA Metrics Row
          '<div class="kpi-grid" style="margin-top:16px;">'+
            '<div class="kpi-card"><div class="kpi-icon" style="background:#dbeafe;color:#2563eb;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><div class="kpi-content"><div class="kpi-value">'+formatHours(d.avgResolutionHours)+'</div><div class="kpi-label">Avg Resolution Time</div><div class="kpi-sub">Min: '+formatHours(d.minResolutionHours)+' · Max: '+formatHours(d.maxResolutionHours)+'</div></div></div>'+
            '<div class="kpi-card '+(d.slaComplianceRate >= 90 ? 'success' : d.slaComplianceRate >= 70 ? '' : 'warning')+'"><div class="kpi-icon" style="background:'+(d.slaComplianceRate >= 90 ? '#d1fae5' : d.slaComplianceRate >= 70 ? '#fef3c7' : '#fee2e2')+';color:'+(d.slaComplianceRate >= 90 ? '#059669' : d.slaComplianceRate >= 70 ? '#d97706' : '#dc2626')+';"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg></div><div class="kpi-content"><div class="kpi-value">'+(d.slaComplianceRate||0)+'%</div><div class="kpi-label">SLA Compliance</div><div class="kpi-sub">'+(d.slaCompliant||0)+' met · '+(d.slaBreached||0)+' breached (24h)</div></div></div>'+
            '<div class="kpi-card"><div class="kpi-icon" style="background:#faf5ff;color:#7c3aed;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg></div><div class="kpi-content"><div class="kpi-value">'+(d.teamPerformance?.length||0)+'</div><div class="kpi-label">Active Team Members</div><div class="kpi-sub">Last 30 days</div></div></div>'+
            '<div class="kpi-card"><div class="kpi-icon" style="background:#fef2f2;color:#dc2626;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></div><div class="kpi-content"><div class="kpi-value">'+(d.rootCauses?.length||0)+'</div><div class="kpi-label">Root Cause Categories</div><div class="kpi-sub">Last 30 days</div></div></div>'+
          '</div>'+
          '<div class="charts-grid">'+
            '<div class="chart-card"><div class="chart-header"><h3>Cases & Sessions Trend</h3><span class="chart-period">Last 14 days</span></div><div class="chart-body"><canvas id="trendChart" height="250"></canvas></div></div>'+
            '<div class="chart-card"><div class="chart-header"><h3>Cases by Type</h3></div><div class="chart-body"><canvas id="typeChart" height="250"></canvas></div></div>'+
          '</div>'+
          '<div class="breakdown-grid">'+
            '<div class="breakdown-card"><div class="breakdown-header"><h3>Resolution Types</h3><span class="breakdown-count">'+(d.resolutionTypes||[]).length+' types</span></div><div class="breakdown-list">'+resolutionList+'</div></div>'+
            '<div class="breakdown-card"><div class="breakdown-header"><h3>Status Distribution</h3></div><div class="breakdown-list">'+statusList+'</div></div>'+
            '<div class="breakdown-card"><div class="breakdown-header"><h3>Flow Types</h3></div><div class="breakdown-list">'+flowList+'</div></div>'+
          '</div>'+
          // Phase 3: Enhanced Analytics Breakdown Cards
          '<div class="breakdown-grid" style="margin-top:20px;">'+
            '<div class="breakdown-card"><div class="breakdown-header"><h3>Team Leaderboard</h3><span class="breakdown-count">Last 30 days</span></div><div class="breakdown-list">'+teamList+'</div></div>'+
            '<div class="breakdown-card"><div class="breakdown-header"><h3>Root Cause Analysis</h3><span class="breakdown-count">'+(d.rootCauses||[]).length+' categories</span></div><div class="breakdown-list">'+rootCauseList+'</div></div>'+
            '<div class="breakdown-card"><div class="breakdown-header"><h3>Resolution Time Distribution</h3></div><div class="breakdown-list">'+timeDistList+'</div></div>'+
          '</div>';

        // Initialize charts
        renderTrendChart(d);
        renderTypeChart(typeData);

      } catch(e) { console.error(e); view.innerHTML = '<div class="empty-state">Failed to load analytics</div>'; }
    }

    function renderTrendChart(data) {
      const ctx = document.getElementById('trendChart');
      if (!ctx) return;

      // Destroy existing chart
      if (analyticsCharts.trend) analyticsCharts.trend.destroy();

      const labels = (data.casesByDay || []).map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });

      analyticsCharts.trend = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Cases',
              data: (data.casesByDay || []).map(d => d.count),
              borderColor: '#1e3a5f',
              backgroundColor: 'rgba(30,58,95,0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointBackgroundColor: '#1e3a5f'
            },
            {
              label: 'Sessions',
              data: (data.sessionsByDay || []).map(d => d.count),
              borderColor: '#4ecdc4',
              backgroundColor: 'rgba(78,205,196,0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointBackgroundColor: '#4ecdc4'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    function renderTypeChart(typeData) {
      const ctx = document.getElementById('typeChart');
      if (!ctx) return;

      if (analyticsCharts.type) analyticsCharts.type.destroy();

      const colors = {
        'refund': '#ef4444',
        'shipping': '#3b82f6',
        'subscription': '#10b981',
        'return': '#f59e0b',
        'manual': '#6b7280'
      };

      analyticsCharts.type = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: typeData.map(t => t.case_type),
          datasets: [{
            data: typeData.map(t => t.count),
            backgroundColor: typeData.map(t => colors[t.case_type] || '#6b7280'),
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right' }
          },
          cutout: '60%'
        }
      });
    }

    async function downloadReport() {
      try {
        // Fetch latest analytics data
        const r = await fetch(API+'/hub/api/analytics');
        const d = await r.json();

        // Generate comprehensive CSV report
        const rows = [
          ['PuppyPad Resolution Hub Report'],
          ['Generated:', new Date().toLocaleString()],
          [''],
          ['=== OVERVIEW ==='],
          ['Total Cases', d.totalCases || 0],
          ['Cases Today', d.casesToday || 0],
          ['Cases This Week', d.casesThisWeek || 0],
          ['Cases This Month', d.casesThisMonth || 0],
          [''],
          ['=== STATUS BREAKDOWN ==='],
          ['Pending Cases', d.pendingCases || 0],
          ['In Progress Cases', d.inProgressCases || 0],
          ['Completed Cases', d.completedCases || 0],
          ['Stale Cases (24h+)', d.staleCases || 0],
          [''],
          ['=== SESSIONS ==='],
          ['Total Sessions', d.totalSessions || 0],
          ['Completed Sessions', d.completedSessions || 0],
          ['Completion Rate', (d.completionRate || 0) + '%'],
          [''],
          ['=== FINANCIAL ==='],
          ['Total Refunds', '$' + (d.totalRefunds || 0).toFixed(2)],
          ['Refunds (Last 30 Days)', '$' + (d.refundsThisMonth || 0).toFixed(2)],
          ['Average Refund', '$' + (d.avgRefund || 0).toFixed(2)],
          [''],
          ['=== CASES BY TYPE ==='],
        ];

        (d.casesByType || []).forEach(t => {
          rows.push([t.case_type || 'unknown', t.count || 0]);
        });

        rows.push(['']);
        rows.push(['=== RESOLUTION TYPES ===']);
        rows.push(['Resolution', 'Count', 'Total Refund']);
        (d.resolutionTypes || []).forEach(r => {
          rows.push([formatResolution(r.resolution), r.count || 0, '$' + (parseFloat(r.total_refund) || 0).toFixed(2)]);
        });

        rows.push(['']);
        rows.push(['=== FLOW TYPES ===']);
        (d.flowTypes || []).forEach(f => {
          rows.push([f.flow_type || 'unknown', f.count || 0]);
        });

        rows.push(['']);
        rows.push(['=== DAILY TRENDS (Last 14 Days) ===']);
        rows.push(['Date', 'Cases', 'Sessions']);
        const dates = new Set([...(d.casesByDay||[]).map(x=>x.date), ...(d.sessionsByDay||[]).map(x=>x.date)]);
        [...dates].sort().forEach(date => {
          const caseCount = (d.casesByDay||[]).find(x=>x.date===date)?.count || 0;
          const sessionCount = (d.sessionsByDay||[]).find(x=>x.date===date)?.count || 0;
          rows.push([date, caseCount, sessionCount]);
        });

        const csvContent = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resolution-hub-report-' + new Date().toISOString().split('T')[0] + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch(e) {
        console.error('Report download error:', e);
        alert('Failed to generate report. Please try again.');
      }
    }

    function timeAgo(d) { if(!d)return'-'; const s=Math.floor((Date.now()-new Date(d))/1000); if(s<60)return'Just now'; if(s<3600)return Math.floor(s/60)+'m ago'; if(s<86400)return Math.floor(s/3600)+'h ago'; return Math.floor(s/86400)+'d ago'; }
    function formatDate(d) { if(!d)return'-'; return new Date(d).toLocaleDateString('en-US', {year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}); }

    async function loadCaseActivity() {
      if (!currentCase) return;
      const container = document.getElementById('activityTimeline');
      if (!container) return;

      try {
        const r = await fetch(API + '/hub/api/case/' + currentCase.case_id + '/activity');
        const data = await r.json();

        if (!data.success || !data.activities?.length) {
          // Keep showing the basic timeline
          return;
        }

        // Build enhanced timeline with activities
        let html = '';

        // Sort activities by timestamp descending (newest first)
        const activities = data.activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        activities.forEach(activity => {
          const activityConfig = getActivityConfig(activity.activity_type);
          html += '<div class="timeline-item">' +
            '<div class="timeline-dot" style="background:' + activityConfig.color + ';"></div>' +
            '<div class="timeline-content">' +
              '<div class="timeline-header">' +
                '<span class="timeline-label">' + activityConfig.label + '</span>' +
                '<span class="timeline-time">' + timeAgo(activity.created_at) + '</span>' +
              '</div>' +
              '<div class="timeline-value">' + formatActivityDetails(activity) + '</div>' +
              (activity.actor ? '<div class="timeline-actor">by ' + (activity.actor_email || activity.actor) + '</div>' : '') +
            '</div>' +
          '</div>';
        });

        // Add case created as first event (at the bottom since we're sorted newest first)
        html += '<div class="timeline-item">' +
          '<div class="timeline-dot" style="background:var(--brand-navy);"></div>' +
          '<div class="timeline-content">' +
            '<div class="timeline-header">' +
              '<span class="timeline-label">Case Created</span>' +
              '<span class="timeline-time">' + timeAgo(currentCase.created_at) + '</span>' +
            '</div>' +
            '<div class="timeline-value">' + formatDate(currentCase.created_at) + '</div>' +
          '</div>' +
        '</div>';

        container.innerHTML = html;
      } catch (e) {
        console.error('Failed to load activity:', e);
      }
    }

    function getActivityConfig(type) {
      const configs = {
        'status_change': { label: 'Status Changed', color: '#3b82f6' },
        'note_added': { label: 'Note Added', color: '#8b5cf6' },
        'comment_added': { label: 'Comment Added', color: '#8b5cf6' },
        'assigned': { label: 'Assigned', color: '#f59e0b' },
        'unassigned': { label: 'Unassigned', color: '#6b7280' },
        'resolution_updated': { label: 'Resolution Updated', color: '#10b981' },
        'clickup_created': { label: 'ClickUp Task Created', color: '#7c3aed' },
        'checklist_completed': { label: 'Checklist Completed', color: '#10b981' },
        'webhook_update': { label: 'External Update', color: '#06b6d4' }
      };
      return configs[type] || { label: type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Activity', color: '#6b7280' };
    }

    function formatActivityDetails(activity) {
      if (activity.activity_type === 'status_change') {
        return (activity.old_value || 'unknown') + ' → ' + (activity.new_value || 'unknown');
      }
      if (activity.activity_type === 'note_added' || activity.activity_type === 'comment_added') {
        const note = activity.new_value || '';
        return note.length > 100 ? note.substring(0, 100) + '...' : note;
      }
      if (activity.field_name) {
        return activity.field_name + ': ' + (activity.new_value || '-');
      }
      return activity.new_value || '-';
    }

    // Build detailed case breakdown HTML for modal - plain English bullet points
    function buildCaseDetailsHtml(c) {
      const bullets = [];

      // Parse extra data if available
      let extra = {};
      try {
        if (c.extra_data) extra = typeof c.extra_data === 'string' ? JSON.parse(c.extra_data) : c.extra_data;
      } catch(e) {}

      // QUALITY DIFFERENCE CASES
      if (c.issue_type === 'quality_difference') {
        const qd = extra.qualityDetails || {};
        const padCount = qd.customerReportedCount || qd.padCount || 0;

        // Opening explanation
        bullets.push('Customer received <strong>Original material pads</strong> instead of the newer <strong>PuppyPad 2.0</strong>.');

        if (padCount > 0) {
          bullets.push('Customer reported receiving <strong>' + padCount + ' pad' + (padCount > 1 ? 's' : '') + '</strong> of Original material.');
        }

        // Usage status
        if (qd.itemsUsed === true) {
          bullets.push('<span style="color:#f59e0b;font-weight:600;">Items have been USED</span> — Customer cannot return them.');
        } else if (qd.itemsUsed === false) {
          bullets.push('<span style="color:#10b981;font-weight:600;">Items are UNUSED</span> — Eligible for return if needed.');
        }

        // Return requirement
        if (qd.requiresReturn === true) {
          bullets.push('Return is <strong>REQUIRED</strong> — Customer must ship back items before resolution.');
        } else if (qd.requiresReturn === false) {
          bullets.push('No return needed — Customer keeps the Original pads.');
        }

        // Resolution path chosen
        if (qd.resolutionPath === 'upgrade') {
          bullets.push('Customer chose to <strong>upgrade to PuppyPad 2.0</strong> for $20/pad.');
          if (qd.upgradeTotal) {
            bullets.push('Total upgrade cost: <strong>$' + qd.upgradeTotal + '</strong>');
          }
        } else if (qd.resolutionPath === 'refund') {
          bullets.push('Customer chose a <strong>full refund</strong> for the Original pads.');
        } else if (qd.resolutionPath === 'free_upgrade') {
          bullets.push('Customer received <strong>FREE PuppyPad 2.0 upgrade</strong> (company absorbed cost).');
        }
      }

      // REFUND CASES
      else if (c.case_type === 'refund' || c.issue_type) {
        const issueDescriptions = {
          'damaged': 'Customer received a damaged product.',
          'missing_items': 'Customer is missing items from their order.',
          'wrong_item': 'Customer received the wrong item.',
          'not_met_expectations': 'Product did not meet customer expectations.',
          'lost_package': 'Package was lost in transit.',
          'delivered_not_received': 'Tracking shows delivered but customer never received it.',
          'charged_unexpectedly': 'Customer was charged unexpectedly.',
        };

        if (c.issue_type && issueDescriptions[c.issue_type]) {
          bullets.push(issueDescriptions[c.issue_type]);
        } else if (c.issue_type) {
          bullets.push('Issue: ' + c.issue_type.replace(/_/g, ' '));
        }

        // Refund amount
        if (c.refund_amount) {
          bullets.push('Refund amount: <strong>$' + parseFloat(c.refund_amount).toFixed(2) + '</strong>');
        }

        // Keep product
        if (extra.keepProduct === true) {
          bullets.push('Customer <strong>keeps the product</strong> — no return required.');
        } else if (extra.keepProduct === false) {
          bullets.push('Customer must <strong>return the product</strong> to receive refund.');
        }
      }

      // SHIPPING CASES
      else if (c.case_type === 'shipping') {
        if (c.issue_type) {
          const shippingIssues = {
            'no_tracking': 'No tracking information available for the order.',
            'stuck_in_transit': 'Package is stuck in transit.',
            'pending_too_long': 'Order has been pending for too long.',
            'delivered_not_received': 'Tracking shows delivered but customer never received it.',
          };
          bullets.push(shippingIssues[c.issue_type] || 'Shipping issue: ' + c.issue_type.replace(/_/g, ' '));
        }

        if (extra.correctedAddress) {
          const addr = extra.correctedAddress;
          const addrStr = [addr.line1, addr.line2, addr.city, addr.state, addr.zip, addr.country].filter(Boolean).join(', ');
          bullets.push('<strong>NEW ADDRESS:</strong> ' + addrStr);
        }
      }

      // SUBSCRIPTION CASES - use resolution to determine display
      else if (c.case_type === 'subscription') {
        const resolution = c.resolution || '';

        // PAUSE SUBSCRIPTION
        if (resolution === 'subscription_paused') {
          if (extra.pauseDuration) {
            bullets.push('<strong>Pause subscription for ' + extra.pauseDuration + ' days</strong>');
          } else {
            bullets.push('<strong>Pause subscription</strong>');
          }

          if (extra.subscriptionProductName) {
            bullets.push('Product: <strong>' + extra.subscriptionProductName + '</strong>');
          }
          if (extra.purchaseId) {
            bullets.push('Subscription ID: <strong>' + extra.purchaseId + '</strong>');
          }
          if (extra.pauseResumeDate) {
            const resumeDate = new Date(extra.pauseResumeDate);
            bullets.push('Resume on: <strong>' + resumeDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) + '</strong>');
          }
        }

        // DISCOUNT APPLIED
        else if (resolution === 'discount_applied') {
          if (extra.discountPercent) {
            bullets.push('<strong>Apply ' + extra.discountPercent + '% discount</strong> to all future shipments');
          } else {
            bullets.push('<strong>Apply discount</strong> to future shipments');
          }

          if (extra.subscriptionProductName) {
            bullets.push('Product: <strong>' + extra.subscriptionProductName + '</strong>');
          }
          if (extra.purchaseId) {
            bullets.push('Subscription ID: <strong>' + extra.purchaseId + '</strong>');
          }
          if (extra.cancelReason) {
            const cancelReasons = {
              'expensive': 'Too expensive',
              'too_many': 'Has too many',
              'not_working': 'Not working as described',
              'moving': 'Moving',
              'other': 'Other reason'
            };
            bullets.push('Customer wanted to cancel because: <strong>' + (cancelReasons[extra.cancelReason] || extra.cancelReason) + '</strong>');
          }
        }

        // FULL CANCELLATION
        else if (resolution === 'subscription_cancelled') {
          bullets.push('<strong>Cancel subscription</strong> and process refund');

          if (extra.subscriptionProductName) {
            bullets.push('Product: <strong>' + extra.subscriptionProductName + '</strong>');
          }
          if (extra.purchaseId) {
            bullets.push('Subscription ID: <strong>' + extra.purchaseId + '</strong>');
          }
          if (extra.cancelReason) {
            const cancelReasons = {
              'expensive': 'Too expensive',
              'too_many': 'Has too many',
              'not_working': 'Not working as described',
              'moving': 'Moving',
              'other': 'Other reason'
            };
            bullets.push('Cancel reason: <strong>' + (cancelReasons[extra.cancelReason] || extra.cancelReason) + '</strong>');
          }
          if (extra.keepProduct === true) {
            bullets.push('Customer keeps product — no return needed');
          } else if (extra.keepProduct === false) {
            bullets.push('Wait for return before processing refund');
          }
        }

        // SCHEDULE CHANGED
        else if (resolution === 'schedule_changed') {
          if (extra.newFrequency) {
            bullets.push('<strong>Change delivery schedule</strong> to every <strong>' + extra.newFrequency + ' days</strong>');
          } else {
            bullets.push('<strong>Change delivery schedule</strong>');
          }

          if (extra.subscriptionProductName) {
            bullets.push('Product: <strong>' + extra.subscriptionProductName + '</strong>');
          }
          if (extra.purchaseId) {
            bullets.push('Subscription ID: <strong>' + extra.purchaseId + '</strong>');
          }
          if (extra.previousFrequency) {
            bullets.push('Previous: Every ' + extra.previousFrequency + ' days');
          }
        }

        // ADDRESS CHANGED
        else if (resolution === 'address_changed') {
          bullets.push('<strong>Update shipping address</strong> for subscription');

          if (extra.subscriptionProductName) {
            bullets.push('Product: <strong>' + extra.subscriptionProductName + '</strong>');
          }
          if (extra.purchaseId) {
            bullets.push('Subscription ID: <strong>' + extra.purchaseId + '</strong>');
          }
          if (extra.newAddress) {
            const addr = extra.newAddress;
            const addrStr = [addr.address1, addr.address2, addr.city, addr.state, addr.zip, addr.country].filter(Boolean).join(', ');
            bullets.push('New address: <strong>' + addrStr + '</strong>');
          }
        }

        // FALLBACK
        else {
          if (extra.actionType) {
            const actionMap = {
              'pause': 'Pause subscription',
              'cancel': 'Cancel subscription',
              'changeSchedule': 'Change delivery schedule',
              'changeAddress': 'Update shipping address',
              'discount_accepted': 'Apply discount to future shipments',
            };
            bullets.push('<strong>' + (actionMap[extra.actionType] || extra.actionType) + '</strong>');
          }

          if (extra.subscriptionProductName) {
            bullets.push('Product: <strong>' + extra.subscriptionProductName + '</strong>');
          }
          if (extra.purchaseId) {
            bullets.push('Subscription ID: <strong>' + extra.purchaseId + '</strong>');
          }
        }

        // CheckoutChamp Order ID
        if (extra.clientOrderId) {
          bullets.push('CheckoutChamp Order: <strong>' + extra.clientOrderId + '</strong>');
        }
      }

      // ITEMS AFFECTED (all case types)
      if (c.selected_items) {
        let items = c.selected_items;
        try { if (typeof items === 'string') items = JSON.parse(items); } catch(e) {}
        if (items && items.length > 0) {
          const itemsStr = items.map(function(item) {
            return item.title + (item.quantity > 1 ? ' (x' + item.quantity + ')' : '');
          }).join(', ');
          bullets.push('<strong>Items:</strong> ' + itemsStr);
        }
      }

      // CUSTOMER NOTES
      if (extra.intentDetails) {
        bullets.push('<strong>Customer said:</strong> <em>"' + extra.intentDetails + '"</em>');
      }

      // If no details available
      if (bullets.length === 0) {
        return '<p style="color:#6c757d;margin:0;font-size:14px;">No additional details available for this case.</p>';
      }

      // Build bullet list HTML
      return '<ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.7;color:#374151;">' +
        bullets.map(function(b) { return '<li style="margin-bottom:6px;">' + b + '</li>'; }).join('') +
        '</ul>';
    }

    async function openCase(caseId) {
      document.getElementById('caseModal').classList.add('active');
      document.getElementById('modalCaseId').textContent = caseId;
      document.getElementById('modalCustomerName').textContent = 'Loading...';

      // Set current case index for navigation
      currentCaseIndex = casesList.findIndex(c => c.case_id === caseId);
      updateNavigationButtons();

      try {
        const r = await fetch(API+'/hub/api/case/'+caseId);
        const data = await r.json();
        const c = data.case;
        currentCase = c;

        // Header section
        document.getElementById('modalCaseId').textContent = c.case_id;
        const customerName = c.customer_name || c.customer_email?.split('@')[0] || 'Customer';
        document.getElementById('modalCustomerName').textContent = customerName;
        document.getElementById('modalCaseType').innerHTML = '<span class="type-badge '+c.case_type+'">'+c.case_type+'</span>';
        const statusClass = (c.status||'pending').replace('_','-');
        document.getElementById('modalStatusBadge').innerHTML = '<span class="status-badge '+statusClass+'">'+(c.status||'pending').replace('_',' ')+'</span>';
        document.getElementById('modalTimeAgo').textContent = timeAgo(c.created_at);

        // Customer & Order info
        document.getElementById('modalCustomerEmail').textContent = c.customer_email||'-';
        document.getElementById('modalOrderNumber').textContent = c.order_number||'-';
        document.getElementById('modalOrderDate').textContent = formatDate(c.order_date||c.created_at);
        document.getElementById('modalSessionId').textContent = c.session_id ? c.session_id.substring(0,20)+'...' : '-';

        // Resolution (at-a-glance) - use formatted resolution
        document.getElementById('modalResolution').textContent = formatResolution(c.resolution, c.refund_amount);
        document.getElementById('modalRefundAmount').textContent = c.refund_amount ? '$'+parseFloat(c.refund_amount).toFixed(2) : '-';
        document.getElementById('modalCreatedAt').textContent = formatDate(c.created_at);
        document.getElementById('modalUpdatedAt').textContent = formatDate(c.updated_at||c.created_at);

        // Build Case Details breakdown
        document.getElementById('modalCaseDetails').innerHTML = buildCaseDetailsHtml(c);

        // Due date - 1 day from creation (internal deadline)
        const dueEl = document.getElementById('modalDueDate');
        if (c.created_at) {
          const dueDate = new Date(new Date(c.created_at).getTime() + 24*60*60*1000);
          const isOverdue = Date.now() > dueDate.getTime() && c.status !== 'completed';
          const dueDateStr = dueDate.toLocaleDateString('en-US', {year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
          if (c.status === 'completed') {
            dueEl.innerHTML = '<span style="color:#10b981;">✓ Completed</span>';
          } else if (isOverdue) {
            dueEl.innerHTML = '<span style="color:#ef4444;font-weight:600;">⚠ OVERDUE - ' + dueDateStr + '</span>';
          } else {
            dueEl.textContent = dueDateStr;
          }
        } else {
          dueEl.textContent = '-';
        }

        // Status cards
        document.querySelectorAll('.status-card').forEach(card => card.classList.remove('active'));
        document.querySelector('.status-card.'+statusClass)?.classList.add('active');

        // Quick action links
        if(c.session_replay_url) {
          document.getElementById('replayLink').href = c.session_replay_url;
          document.getElementById('replayLink').style.display = 'flex';
        } else {
          document.getElementById('replayLink').style.display = 'none';
        }

        // Richpanel conversation link
        if(c.richpanel_conversation_no) {
          document.getElementById('richpanelLink').href = 'https://app.richpanel.com/conversations?viewId=search&conversationNo=' + c.richpanel_conversation_no;
          document.getElementById('richpanelLink').style.display = 'flex';
        } else {
          document.getElementById('richpanelLink').style.display = 'none';
        }

        if(c.clickup_task_url) {
          document.getElementById('clickupLink').href = c.clickup_task_url;
          document.getElementById('clickupLink').style.display = 'flex';
        } else {
          document.getElementById('clickupLink').style.display = 'none';
        }
        if(c.order_url) {
          document.getElementById('shopifyLink').href = c.order_url;
          document.getElementById('shopifyLink').style.display = 'flex';
        } else {
          document.getElementById('shopifyLink').style.display = 'none';
        }

        // SOP link - based on case type
        const sopUrls = {
          'refund': 'https://docs.google.com/document/d/YOUR_REFUND_SOP_DOC_ID/edit',
          'shipping': 'https://docs.google.com/document/d/YOUR_SHIPPING_SOP_DOC_ID/edit',
          'subscription': 'https://docs.google.com/document/d/YOUR_SUBSCRIPTION_SOP_DOC_ID/edit',
          'manual': 'https://docs.google.com/document/d/YOUR_MANUAL_SOP_DOC_ID/edit',
          'default': 'https://docs.google.com/document/d/YOUR_DEFAULT_SOP_DOC_ID/edit'
        };
        document.getElementById('sopLink').href = sopUrls[c.case_type] || sopUrls['default'];

        // Timeline
        document.getElementById('timelineCreated').textContent = formatDate(c.created_at);
        if(c.first_response_at) {
          document.getElementById('timelineFirstResponseRow').style.display = 'flex';
          document.getElementById('timelineFirstResponse').textContent = formatDate(c.first_response_at);
        } else {
          document.getElementById('timelineFirstResponseRow').style.display = 'none';
        }
        if(c.resolved_at) {
          document.getElementById('timelineResolvedRow').style.display = 'flex';
          document.getElementById('timelineResolved').textContent = formatDate(c.resolved_at);
        } else {
          document.getElementById('timelineResolvedRow').style.display = 'none';
        }

        // Load comments
        loadComments(caseId);

        // Load activity timeline
        loadCaseActivity();
      } catch(e) {
        console.error(e);
        document.getElementById('modalCustomerName').textContent = 'Error loading case';
      }
    }

    function closeModal() { document.getElementById('caseModal').classList.remove('active'); currentCase = null; currentCaseIndex = -1; }

    function copyCaseUrl() {
      if (!currentCase) return;
      const url = window.location.origin + '/hub?case=' + currentCase.case_id;
      navigator.clipboard.writeText(url).then(() => {
        const btn = document.querySelector('.copy-url-btn');
        if (btn) {
          btn.classList.add('copied');
          btn.innerHTML = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>';
          }, 2000);
        }
        showToast('Case URL copied to clipboard', 'success');
      });
    }

    // Case navigation functions
    function updateNavigationButtons() {
      const prevBtn = document.getElementById('prevCaseBtn');
      const nextBtn = document.getElementById('nextCaseBtn');
      const prevPreview = document.getElementById('prevCasePreview');
      const nextPreview = document.getElementById('nextCasePreview');

      if (currentCaseIndex > 0 && casesList.length > 0) {
        prevBtn.disabled = false;
        const prevCase = casesList[currentCaseIndex - 1];
        prevPreview.textContent = (prevCase.customer_name || prevCase.customer_email?.split('@')[0] || 'Case') + ' - ' + prevCase.case_type;
      } else {
        prevBtn.disabled = true;
        prevPreview.textContent = '';
      }

      if (currentCaseIndex < casesList.length - 1 && casesList.length > 0) {
        nextBtn.disabled = false;
        const nextCase = casesList[currentCaseIndex + 1];
        nextPreview.textContent = (nextCase.customer_name || nextCase.customer_email?.split('@')[0] || 'Case') + ' - ' + nextCase.case_type;
      } else {
        nextBtn.disabled = true;
        nextPreview.textContent = '';
      }
    }

    function navigateCase(direction) {
      if (direction === 'prev' && currentCaseIndex > 0) {
        openCase(casesList[currentCaseIndex - 1].case_id);
      } else if (direction === 'next' && currentCaseIndex < casesList.length - 1) {
        openCase(casesList[currentCaseIndex + 1].case_id);
      }
    }

    async function updateStatus(newStatus) {
      if(!currentCase) {
        console.error('No current case to update');
        return;
      }
      try {
        // Optimistically update UI first
        document.querySelectorAll('.status-card').forEach(card => card.classList.remove('active'));
        const statusClass = newStatus.replace('_','-');
        document.querySelector('.status-card.'+statusClass)?.classList.add('active');
        document.getElementById('modalStatusBadge').innerHTML = '<span class="status-badge '+statusClass+'">'+newStatus.replace('_',' ')+'</span>';

        const r = await fetch(API+'/hub/api/case/'+currentCase.case_id+'/status', {
          method: 'PUT',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({status: newStatus})
        });
        if(r.ok) {
          currentCase.status = newStatus;
          // Update casesList too
          const idx = casesList.findIndex(c => c.case_id === currentCase.case_id);
          if(idx >= 0) casesList[idx].status = newStatus;
          loadDashboard();
        } else {
          // Revert on failure
          const oldStatus = currentCase.status || 'pending';
          const oldClass = oldStatus.replace('_','-');
          document.querySelectorAll('.status-card').forEach(card => card.classList.remove('active'));
          document.querySelector('.status-card.'+oldClass)?.classList.add('active');
          document.getElementById('modalStatusBadge').innerHTML = '<span class="status-badge '+oldClass+'">'+oldStatus.replace('_',' ')+'</span>';
          alert('Failed to update status');
        }
      } catch(e) {
        console.error('Status update error:', e);
        alert('Failed to update status: ' + e.message);
      }
    }

    async function loadComments(caseId) {
      try {
        const r = await fetch(API+'/hub/api/case/'+caseId+'/comments');
        const d = await r.json();
        const list = document.getElementById('commentsList');
        const countEl = document.getElementById('commentsCount');
        const count = d.comments?.length || 0;
        countEl.textContent = count + ' comment' + (count !== 1 ? 's' : '');
        if(!count) {
          list.innerHTML = '';
          return;
        }
        list.innerHTML = d.comments.map(c => '<div class="comment-item"><div class="comment-header"><span class="comment-author">'+(c.author_name||'Team')+'</span><span class="comment-time">'+timeAgo(c.created_at)+'</span></div><div class="comment-text">'+escapeHtml(c.content)+'</div></div>').join('');
      } catch(e) { console.error(e); }
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    async function addComment() {
      if(!currentCase) return;
      const input = document.getElementById('commentInput');
      const content = input.value.trim();
      if(!content) return;
      try {
        const r = await fetch(API+'/hub/api/case/'+currentCase.case_id+'/comments', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({content: content, author_name: 'Admin'})
        });
        if(r.ok) { input.value = ''; loadComments(currentCase.case_id); }
      } catch(e) { console.error(e); alert('Failed to add comment'); }
    }

    function refreshData() { loadDashboard(); }

    // Global keyboard shortcut: Cmd/Ctrl+K to focus search
    document.addEventListener('keydown', function(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('caseSearchInput');
        if (searchInput) {
          if (document.getElementById('casesView').style.display === 'none') {
            navigateTo('cases', 'all');
            setTimeout(() => document.getElementById('caseSearchInput')?.focus(), 100);
          } else {
            searchInput.focus();
            searchInput.select();
          }
        }
      }
      if (e.key === 'Escape') {
        if (document.activeElement?.matches('input, textarea')) {
          document.activeElement.blur();
        }
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) closeModal();
      }
      if (e.key === '/' && !e.target.matches('input, textarea, select')) {
        e.preventDefault();
        const searchInput = document.getElementById('caseSearchInput');
        if (searchInput && document.getElementById('casesView').style.display !== 'none') {
          searchInput.focus();
        }
      }
    });

    loadDashboard();
  </script>

  <!-- Bulk Actions Toolbar -->
  <div class="bulk-actions-toolbar" id="bulkActionsToolbar">
    <span class="selected-count" id="selectedCount">0 selected</span>
    <button class="bulk-btn" onclick="HubBulkActions.updateStatus('pending')">Set Pending</button>
    <button class="bulk-btn" onclick="HubBulkActions.updateStatus('in_progress')">Set In Progress</button>
    <button class="bulk-btn" onclick="HubBulkActions.updateStatus('completed')">Set Completed</button>
    <div class="bulk-btn-divider"></div>
    <button class="bulk-btn admin-only" onclick="HubBulkActions.showAssignModal()">Assign</button>
    <button class="bulk-btn" onclick="HubBulkActions.addComment()">Add Comment</button>
    <button class="bulk-btn" onclick="HubBulkActions.exportCSV()">Export</button>
    <button class="bulk-close" onclick="HubBulkActions.deselectAll()">&times;</button>
  </div>

  <!-- Loading Overlay -->
  <div class="loading-overlay" id="loadingOverlay">
    <div class="loading-spinner"></div>
  </div>

  <!-- Hub Enhanced Features -->
  <script src="/hub/hub-app.js"></script>
</body>
</html>`;
}
// Hub CSS Asset

function getHubStylesCSS() {
  return "/**\n * Resolution Hub Styles\n * Modern, accessible styling for the hub application\n */\n\n/* ============================================\n   CSS Variables\n   ============================================ */\n:root {\n  /* Colors */\n  --primary-50: #eff6ff;\n  --primary-100: #dbeafe;\n  --primary-500: #3b82f6;\n  --primary-600: #2563eb;\n  --primary-700: #1d4ed8;\n\n  --success-50: #ecfdf5;\n  --success-500: #10b981;\n  --success-600: #059669;\n\n  --warning-50: #fffbeb;\n  --warning-500: #f59e0b;\n  --warning-600: #d97706;\n\n  --error-50: #fef2f2;\n  --error-500: #ef4444;\n  --error-600: #dc2626;\n\n  --gray-50: #f9fafb;\n  --gray-100: #f3f4f6;\n  --gray-200: #e5e7eb;\n  --gray-300: #d1d5db;\n  --gray-400: #9ca3af;\n  --gray-500: #6b7280;\n  --gray-600: #4b5563;\n  --gray-700: #374151;\n  --gray-800: #1f2937;\n  --gray-900: #111827;\n\n  /* Spacing */\n  --spacing-xs: 4px;\n  --spacing-sm: 8px;\n  --spacing-md: 16px;\n  --spacing-lg: 24px;\n  --spacing-xl: 32px;\n\n  /* Typography */\n  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\n  --font-mono: 'SF Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace;\n\n  /* Shadows */\n  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);\n  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);\n  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);\n  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);\n\n  /* Borders */\n  --radius-sm: 4px;\n  --radius-md: 8px;\n  --radius-lg: 12px;\n  --radius-full: 9999px;\n\n  /* Transitions */\n  --transition-fast: 150ms ease;\n  --transition-normal: 200ms ease;\n}\n\n/* ============================================\n   Base Styles\n   ============================================ */\n*, *::before, *::after {\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: var(--font-sans);\n  color: var(--gray-900);\n  background: var(--gray-50);\n  margin: 0;\n  padding: 0;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n\n/* ============================================\n   Bulk Actions Toolbar\n   ============================================ */\n.bulk-actions-toolbar {\n  display: none;\n  position: fixed;\n  bottom: 24px;\n  left: 50%;\n  transform: translateX(-50%);\n  background: var(--gray-800);\n  color: white;\n  padding: 12px 20px;\n  border-radius: var(--radius-lg);\n  box-shadow: var(--shadow-xl);\n  align-items: center;\n  gap: 16px;\n  z-index: 100;\n  animation: slideUp 0.2s ease;\n}\n\n@keyframes slideUp {\n  from {\n    opacity: 0;\n    transform: translateX(-50%) translateY(20px);\n  }\n  to {\n    opacity: 1;\n    transform: translateX(-50%) translateY(0);\n  }\n}\n\n.bulk-actions-toolbar .selected-count {\n  font-weight: 600;\n  padding-right: 16px;\n  border-right: 1px solid var(--gray-600);\n}\n\n.bulk-actions-toolbar .bulk-btn {\n  background: transparent;\n  border: none;\n  color: white;\n  padding: 8px 12px;\n  border-radius: var(--radius-sm);\n  cursor: pointer;\n  font-size: 14px;\n  transition: background var(--transition-fast);\n}\n\n.bulk-actions-toolbar .bulk-btn:hover {\n  background: var(--gray-700);\n}\n\n.bulk-actions-toolbar .bulk-btn.danger:hover {\n  background: var(--error-600);\n}\n\n.bulk-actions-toolbar .bulk-btn-divider {\n  width: 1px;\n  height: 24px;\n  background: var(--gray-600);\n}\n\n.bulk-actions-toolbar .bulk-close {\n  background: transparent;\n  border: none;\n  color: var(--gray-400);\n  padding: 4px;\n  cursor: pointer;\n  margin-left: 8px;\n}\n\n.bulk-actions-toolbar .bulk-close:hover {\n  color: white;\n}\n\n/* ============================================\n   Saved Views Sidebar\n   ============================================ */\n.saved-views-section {\n  margin-top: 24px;\n  padding-top: 16px;\n  border-top: 1px solid var(--gray-200);\n}\n\n.saved-views-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 0 16px;\n  margin-bottom: 8px;\n}\n\n.saved-views-header h4 {\n  font-size: 12px;\n  font-weight: 600;\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n  color: var(--gray-500);\n  margin: 0;\n}\n\n.saved-views-header button {\n  background: none;\n  border: none;\n  color: var(--primary-600);\n  font-size: 18px;\n  cursor: pointer;\n  padding: 0;\n  line-height: 1;\n}\n\n.saved-views-header button:hover {\n  color: var(--primary-700);\n}\n\n.saved-view-item {\n  display: flex;\n  align-items: center;\n  padding: 10px 16px;\n  cursor: pointer;\n  transition: background var(--transition-fast);\n}\n\n.saved-view-item:hover {\n  background: var(--gray-100);\n}\n\n.saved-view-item.active {\n  background: var(--primary-50);\n  border-right: 3px solid var(--primary-500);\n}\n\n.saved-view-item .view-name {\n  flex: 1;\n  font-size: 14px;\n  color: var(--gray-700);\n}\n\n.saved-view-item .view-default {\n  font-size: 11px;\n  background: var(--primary-100);\n  color: var(--primary-700);\n  padding: 2px 6px;\n  border-radius: var(--radius-full);\n  margin-left: 8px;\n}\n\n.saved-view-item .view-delete {\n  opacity: 0;\n  background: none;\n  border: none;\n  color: var(--gray-400);\n  cursor: pointer;\n  padding: 2px 6px;\n  font-size: 16px;\n  transition: opacity var(--transition-fast);\n}\n\n.saved-view-item:hover .view-delete {\n  opacity: 1;\n}\n\n.saved-view-item .view-delete:hover {\n  color: var(--error-500);\n}\n\n.empty-views {\n  padding: 16px;\n  text-align: center;\n  color: var(--gray-400);\n  font-size: 13px;\n}\n\n/* ============================================\n   Completion Checklist Modal\n   ============================================ */\n.checklist-items {\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n}\n\n.checklist-item {\n  display: flex;\n  align-items: flex-start;\n  gap: 12px;\n  padding: 12px;\n  background: var(--gray-50);\n  border-radius: var(--radius-md);\n  cursor: pointer;\n  transition: background var(--transition-fast);\n}\n\n.checklist-item:hover {\n  background: var(--gray-100);\n}\n\n.checklist-item.required {\n  border-left: 3px solid var(--error-500);\n}\n\n.checklist-checkbox {\n  width: 20px;\n  height: 20px;\n  accent-color: var(--success-500);\n  cursor: pointer;\n  flex-shrink: 0;\n  margin-top: 2px;\n}\n\n.checklist-text {\n  flex: 1;\n  font-size: 14px;\n  color: var(--gray-700);\n  line-height: 1.5;\n}\n\n.required-badge {\n  display: inline-block;\n  font-size: 11px;\n  background: var(--error-100);\n  color: var(--error-700);\n  padding: 2px 6px;\n  border-radius: var(--radius-full);\n  margin-left: 8px;\n  vertical-align: middle;\n}\n\n.completed-by {\n  font-size: 12px;\n  color: var(--gray-400);\n  white-space: nowrap;\n}\n\n/* ============================================\n   Keyboard Shortcuts Modal\n   ============================================ */\n.shortcuts-section {\n  margin-bottom: 24px;\n}\n\n.shortcuts-section:last-child {\n  margin-bottom: 0;\n}\n\n.shortcuts-section h4 {\n  font-size: 13px;\n  font-weight: 600;\n  color: var(--gray-500);\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n  margin: 0 0 12px 0;\n  padding-bottom: 8px;\n  border-bottom: 1px solid var(--gray-200);\n}\n\n.shortcut {\n  display: flex;\n  align-items: center;\n  padding: 8px 0;\n  font-size: 14px;\n  color: var(--gray-600);\n}\n\n.shortcut kbd {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  min-width: 24px;\n  height: 24px;\n  padding: 0 6px;\n  font-family: var(--font-mono);\n  font-size: 12px;\n  background: var(--gray-100);\n  border: 1px solid var(--gray-300);\n  border-radius: var(--radius-sm);\n  box-shadow: 0 1px 0 var(--gray-300);\n  margin-right: 8px;\n}\n\n/* Keyboard selection highlight */\n.cases-table tbody tr.keyboard-selected {\n  outline: 2px solid var(--primary-500);\n  outline-offset: -2px;\n  background: var(--primary-50);\n}\n\n/* ============================================\n   User Management\n   ============================================ */\n.users-list {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n\n.user-row {\n  display: flex;\n  align-items: center;\n  padding: 12px 16px;\n  background: var(--gray-50);\n  border-radius: var(--radius-md);\n  gap: 16px;\n}\n\n.user-row-info {\n  flex: 1;\n}\n\n.user-row-name {\n  font-weight: 500;\n  color: var(--gray-900);\n}\n\n.user-row-meta {\n  font-size: 13px;\n  color: var(--gray-500);\n  margin-top: 2px;\n}\n\n.user-row-status {\n  font-size: 12px;\n  padding: 4px 8px;\n  border-radius: var(--radius-full);\n}\n\n.user-row-status.active {\n  background: var(--success-50);\n  color: var(--success-600);\n}\n\n.user-row-status.inactive {\n  background: var(--gray-100);\n  color: var(--gray-500);\n}\n\n.user-row-actions {\n  display: flex;\n  gap: 8px;\n}\n\n.btn-icon {\n  background: none;\n  border: none;\n  padding: 4px 8px;\n  font-size: 13px;\n  color: var(--primary-600);\n  cursor: pointer;\n  border-radius: var(--radius-sm);\n}\n\n.btn-icon:hover {\n  background: var(--primary-50);\n}\n\n.btn-icon.danger {\n  color: var(--error-600);\n}\n\n.btn-icon.danger:hover {\n  background: var(--error-50);\n}\n\n/* ============================================\n   Assignment Queue Table\n   ============================================ */\n.queue-table {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 14px;\n}\n\n.queue-table th {\n  text-align: left;\n  padding: 12px;\n  background: var(--gray-50);\n  border-bottom: 1px solid var(--gray-200);\n  font-weight: 600;\n  color: var(--gray-600);\n}\n\n.queue-table td {\n  padding: 12px;\n  border-bottom: 1px solid var(--gray-100);\n}\n\n.queue-table tbody tr:hover {\n  background: var(--gray-50);\n}\n\n/* ============================================\n   Audit Log Table\n   ============================================ */\n.audit-table {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 13px;\n}\n\n.audit-table th {\n  text-align: left;\n  padding: 12px 16px;\n  background: var(--gray-50);\n  border-bottom: 1px solid var(--gray-200);\n  font-weight: 600;\n  color: var(--gray-600);\n  position: sticky;\n  top: 0;\n}\n\n.audit-table td {\n  padding: 10px 16px;\n  border-bottom: 1px solid var(--gray-100);\n  vertical-align: middle;\n}\n\n.audit-table tbody tr:hover {\n  background: var(--gray-50);\n}\n\n.action-badge {\n  display: inline-block;\n  font-size: 11px;\n  padding: 3px 8px;\n  border-radius: var(--radius-full);\n  font-weight: 500;\n}\n\n.action-badge.cases {\n  background: var(--primary-100);\n  color: var(--primary-700);\n}\n\n.action-badge.users {\n  background: var(--warning-100);\n  color: var(--warning-700);\n}\n\n.action-badge.views {\n  background: var(--success-100);\n  color: var(--success-700);\n}\n\n.action-badge.auth {\n  background: var(--gray-100);\n  color: var(--gray-700);\n}\n\n.action-badge.system {\n  background: var(--error-100);\n  color: var(--error-700);\n}\n\n/* ============================================\n   Toast Notifications\n   ============================================ */\n#toastContainer {\n  position: fixed;\n  bottom: 24px;\n  right: 24px;\n  z-index: 1000;\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n\n.toast {\n  padding: 12px 20px;\n  border-radius: var(--radius-md);\n  font-size: 14px;\n  font-weight: 500;\n  box-shadow: var(--shadow-lg);\n  transform: translateX(100%);\n  opacity: 0;\n  transition: all var(--transition-normal);\n}\n\n.toast.show {\n  transform: translateX(0);\n  opacity: 1;\n}\n\n.toast-success {\n  background: var(--success-500);\n  color: white;\n}\n\n.toast-error {\n  background: var(--error-500);\n  color: white;\n}\n\n.toast-warning {\n  background: var(--warning-500);\n  color: white;\n}\n\n.toast-info {\n  background: var(--primary-500);\n  color: white;\n}\n\n/* ============================================\n   Form Elements\n   ============================================ */\n.form-group {\n  margin-bottom: 16px;\n}\n\n.form-group label {\n  display: block;\n  font-size: 13px;\n  font-weight: 500;\n  color: var(--gray-700);\n  margin-bottom: 6px;\n}\n\n.form-input {\n  width: 100%;\n  padding: 10px 12px;\n  font-size: 14px;\n  border: 1px solid var(--gray-300);\n  border-radius: var(--radius-md);\n  background: white;\n  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);\n}\n\n.form-input:focus {\n  outline: none;\n  border-color: var(--primary-500);\n  box-shadow: 0 0 0 3px var(--primary-100);\n}\n\n.form-input::placeholder {\n  color: var(--gray-400);\n}\n\n.error-message {\n  color: var(--error-600);\n  font-size: 13px;\n  margin-top: 8px;\n  padding: 8px 12px;\n  background: var(--error-50);\n  border-radius: var(--radius-sm);\n}\n\n/* ============================================\n   Buttons\n   ============================================ */\n.btn {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  padding: 10px 16px;\n  font-size: 14px;\n  font-weight: 500;\n  border-radius: var(--radius-md);\n  cursor: pointer;\n  transition: all var(--transition-fast);\n  border: none;\n  gap: 8px;\n}\n\n.btn-primary {\n  background: var(--primary-600);\n  color: white;\n}\n\n.btn-primary:hover {\n  background: var(--primary-700);\n}\n\n.btn-secondary {\n  background: var(--gray-100);\n  color: var(--gray-700);\n}\n\n.btn-secondary:hover {\n  background: var(--gray-200);\n}\n\n.btn-success {\n  background: var(--success-600);\n  color: white;\n}\n\n.btn-success:hover {\n  background: var(--success-700);\n}\n\n.btn-danger {\n  background: var(--error-600);\n  color: white;\n}\n\n.btn-danger:hover {\n  background: var(--error-700);\n}\n\n.btn:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n\n/* ============================================\n   Modal Styles\n   ============================================ */\n.modal-overlay {\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  background: rgba(0, 0, 0, 0.5);\n  display: none;\n  align-items: center;\n  justify-content: center;\n  z-index: 200;\n  padding: 24px;\n}\n\n.modal-overlay.active {\n  display: flex;\n}\n\n.modal {\n  background: white;\n  border-radius: var(--radius-lg);\n  box-shadow: var(--shadow-xl);\n  max-height: 90vh;\n  overflow: hidden;\n  display: flex;\n  flex-direction: column;\n  width: 100%;\n  animation: modalIn 0.2s ease;\n}\n\n@keyframes modalIn {\n  from {\n    opacity: 0;\n    transform: scale(0.95);\n  }\n  to {\n    opacity: 1;\n    transform: scale(1);\n  }\n}\n\n.modal-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 16px 24px;\n  border-bottom: 1px solid var(--gray-200);\n  background: white;\n}\n\n.modal-header-content {\n  flex: 1;\n}\n\n.modal-title {\n  font-size: 16px;\n  font-weight: 600;\n  color: var(--gray-900);\n}\n\n.modal-close {\n  background: none;\n  border: none;\n  font-size: 24px;\n  color: var(--gray-400);\n  cursor: pointer;\n  padding: 0;\n  line-height: 1;\n  transition: color var(--transition-fast);\n}\n\n.modal-close:hover {\n  color: var(--gray-600);\n}\n\n.modal-body {\n  padding: 24px;\n  overflow-y: auto;\n}\n\n/* ============================================\n   Cases Table\n   ============================================ */\n.cases-table {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 14px;\n}\n\n.cases-table th {\n  text-align: left;\n  padding: 12px 16px;\n  background: var(--gray-50);\n  border-bottom: 2px solid var(--gray-200);\n  font-weight: 600;\n  color: var(--gray-600);\n  white-space: nowrap;\n}\n\n.cases-table td {\n  padding: 12px 16px;\n  border-bottom: 1px solid var(--gray-100);\n  vertical-align: middle;\n}\n\n.cases-table tbody tr {\n  cursor: pointer;\n  transition: background var(--transition-fast);\n}\n\n.cases-table tbody tr:hover {\n  background: var(--gray-50);\n}\n\n.case-checkbox {\n  width: 18px;\n  height: 18px;\n  cursor: pointer;\n  accent-color: var(--primary-500);\n}\n\n.case-id {\n  font-family: var(--font-mono);\n  font-size: 12px;\n  color: var(--gray-500);\n}\n\n.customer-info {\n  display: flex;\n  flex-direction: column;\n}\n\n.customer-name {\n  font-weight: 500;\n  color: var(--gray-900);\n}\n\n.customer-email {\n  font-size: 12px;\n  color: var(--gray-500);\n  margin-top: 2px;\n}\n\n.time-ago {\n  font-size: 13px;\n  color: var(--gray-500);\n}\n\n/* ============================================\n   Status & Type Badges\n   ============================================ */\n.status-badge {\n  display: inline-block;\n  padding: 4px 10px;\n  font-size: 12px;\n  font-weight: 500;\n  border-radius: var(--radius-full);\n}\n\n.status-badge.pending {\n  background: var(--warning-50);\n  color: var(--warning-700);\n}\n\n.status-badge.in-progress {\n  background: var(--primary-50);\n  color: var(--primary-700);\n}\n\n.status-badge.completed {\n  background: var(--success-50);\n  color: var(--success-700);\n}\n\n.type-badge {\n  display: inline-block;\n  padding: 4px 10px;\n  font-size: 12px;\n  font-weight: 500;\n  border-radius: var(--radius-full);\n  text-transform: capitalize;\n}\n\n.type-badge.shipping {\n  background: #dbeafe;\n  color: #1e40af;\n}\n\n.type-badge.refund {\n  background: #fef3c7;\n  color: #92400e;\n}\n\n.type-badge.subscription {\n  background: #e0e7ff;\n  color: #3730a3;\n}\n\n.type-badge.manual {\n  background: #f3f4f6;\n  color: #4b5563;\n}\n\n.type-badge.return {\n  background: #fce7f3;\n  color: #9d174d;\n}\n\n/* ============================================\n   Empty States\n   ============================================ */\n.empty-state {\n  text-align: center;\n  padding: 48px 24px;\n  color: var(--gray-500);\n}\n\n.empty-state-icon {\n  font-size: 48px;\n  margin-bottom: 16px;\n  opacity: 0.5;\n}\n\n.empty-state-title {\n  font-size: 16px;\n  font-weight: 500;\n  color: var(--gray-700);\n  margin-bottom: 8px;\n}\n\n.empty-state-text {\n  font-size: 14px;\n  color: var(--gray-500);\n}\n\n/* ============================================\n   Pagination\n   ============================================ */\n#casesPagination {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 16px;\n  padding: 16px;\n  border-top: 1px solid var(--gray-200);\n}\n\n#casesPagination button {\n  padding: 8px 16px;\n  font-size: 14px;\n  background: var(--gray-100);\n  border: none;\n  border-radius: var(--radius-md);\n  cursor: pointer;\n  transition: background var(--transition-fast);\n}\n\n#casesPagination button:hover {\n  background: var(--gray-200);\n}\n\n#casesPagination span {\n  font-size: 14px;\n  color: var(--gray-600);\n}\n\n/* ============================================\n   Admin-only Elements\n   ============================================ */\n.admin-only {\n  display: none;\n}\n\n/* ============================================\n   Loading Indicator\n   ============================================ */\n.loading-overlay {\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  background: rgba(255, 255, 255, 0.8);\n  display: none;\n  align-items: center;\n  justify-content: center;\n  z-index: 500;\n}\n\n.loading-overlay.active {\n  display: flex;\n}\n\n.loading-spinner {\n  width: 40px;\n  height: 40px;\n  border: 3px solid var(--gray-200);\n  border-top-color: var(--primary-500);\n  border-radius: 50%;\n  animation: spin 0.8s linear infinite;\n}\n\n@keyframes spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n\n/* ============================================\n   Responsive Adjustments\n   ============================================ */\n@media (max-width: 768px) {\n  .bulk-actions-toolbar {\n    left: 16px;\n    right: 16px;\n    transform: none;\n    flex-wrap: wrap;\n  }\n\n  .modal {\n    margin: 16px;\n  }\n\n  .cases-table {\n    font-size: 13px;\n  }\n\n  .cases-table th,\n  .cases-table td {\n    padding: 10px 12px;\n  }\n\n  #toastContainer {\n    left: 16px;\n    right: 16px;\n    bottom: 16px;\n  }\n}\n\n/* ============================================\n   Status Cards in Case Modal\n   ============================================ */\n.status-cards {\n  display: flex;\n  gap: 12px;\n  margin-bottom: 24px;\n}\n\n.status-card {\n  flex: 1;\n  padding: 12px 16px;\n  border: 2px solid var(--gray-200);\n  border-radius: var(--radius-md);\n  text-align: center;\n  cursor: pointer;\n  transition: all var(--transition-fast);\n}\n\n.status-card:hover {\n  border-color: var(--gray-300);\n  background: var(--gray-50);\n}\n\n.status-card.active {\n  border-color: var(--primary-500);\n  background: var(--primary-50);\n}\n\n.status-card.pending.active {\n  border-color: var(--warning-500);\n  background: var(--warning-50);\n}\n\n.status-card.in-progress.active {\n  border-color: var(--primary-500);\n  background: var(--primary-50);\n}\n\n.status-card.completed.active {\n  border-color: var(--success-500);\n  background: var(--success-50);\n}\n\n.status-card-label {\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--gray-500);\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n}\n\n.status-card-value {\n  font-size: 14px;\n  font-weight: 600;\n  color: var(--gray-900);\n  margin-top: 4px;\n}\n\n/* ============================================\n   Deep Link Copy Button\n   ============================================ */\n.copy-link-btn {\n  background: none;\n  border: none;\n  color: var(--gray-400);\n  cursor: pointer;\n  padding: 4px;\n  border-radius: var(--radius-sm);\n  transition: all var(--transition-fast);\n}\n\n.copy-link-btn:hover {\n  color: var(--primary-600);\n  background: var(--primary-50);\n}\n\n/* ============================================\n   Search Input Enhancements\n   ============================================ */\n.search-container {\n  position: relative;\n}\n\n.search-input {\n  width: 100%;\n  padding: 10px 12px 10px 40px;\n  font-size: 14px;\n  border: 1px solid var(--gray-200);\n  border-radius: var(--radius-md);\n  background: white;\n  transition: all var(--transition-fast);\n}\n\n.search-input:focus {\n  outline: none;\n  border-color: var(--primary-500);\n  box-shadow: 0 0 0 3px var(--primary-100);\n}\n\n.search-icon {\n  position: absolute;\n  left: 12px;\n  top: 50%;\n  transform: translateY(-50%);\n  color: var(--gray-400);\n  pointer-events: none;\n}\n\n.search-shortcut {\n  position: absolute;\n  right: 12px;\n  top: 50%;\n  transform: translateY(-50%);\n  font-size: 11px;\n  color: var(--gray-400);\n  background: var(--gray-100);\n  padding: 2px 6px;\n  border-radius: var(--radius-sm);\n}\n";
}

// Hub JS Asset

function getHubAppJS() {
  return "/**\n * Resolution Hub Application\n * Modular, maintainable hub for PuppyPad Resolution cases\n */\n\n// ============================================\n// CONFIGURATION\n// ============================================\nconst HubConfig = {\n  API_BASE: '', // Same origin\n  REFRESH_INTERVAL: 30000, // 30 seconds\n  MAX_BULK_SELECT: 100,\n  ITEMS_PER_PAGE: 50\n};\n\n// ============================================\n// STATE MANAGEMENT\n// ============================================\nconst HubState = {\n  // User - Initialize from localStorage immediately so bulk actions work\n  currentUser: (() => {\n    try { return JSON.parse(localStorage.getItem('hub_user')); } catch { return null; }\n  })(),\n  token: localStorage.getItem('hub_token'),\n\n  // Cases\n  cases: [],\n  currentCase: null,\n  currentCaseIndex: -1,\n  selectedCaseIds: new Set(),\n\n  // Filters\n  currentFilter: 'all',\n  currentStatus: null,\n  currentSearch: '',\n  casesPage: 1,  // Renamed from currentPage to avoid conflict with navigation\n  totalPages: 1,\n\n  // Views\n  savedViews: [],\n  currentView: null,\n\n  // Assignment\n  assignmentQueue: [],\n\n  // UI\n  currentPage: 'dashboard',\n  isLoading: false,\n  keySequence: '', // For combo shortcuts like 'g' then 'd'\n  keySequenceTimeout: null\n};\n\n// ============================================\n// API CLIENT\n// ============================================\nconst HubAPI = {\n  async request(endpoint, options = {}) {\n    const headers = {\n      'Content-Type': 'application/json',\n      ...options.headers\n    };\n\n    if (HubState.token) {\n      headers['Authorization'] = `Bearer ${HubState.token}`;\n    }\n\n    const response = await fetch(`${HubConfig.API_BASE}${endpoint}`, {\n      ...options,\n      headers\n    });\n\n    if (response.status === 401) {\n      HubAuth.logout();\n      throw new Error('Session expired');\n    }\n\n    return response;\n  },\n\n  async get(endpoint) {\n    const response = await this.request(endpoint);\n    return response.json();\n  },\n\n  async post(endpoint, data) {\n    const response = await this.request(endpoint, {\n      method: 'POST',\n      body: JSON.stringify(data)\n    });\n    return response.json();\n  },\n\n  async put(endpoint, data) {\n    const response = await this.request(endpoint, {\n      method: 'PUT',\n      body: JSON.stringify(data)\n    });\n    return response.json();\n  },\n\n  async delete(endpoint) {\n    const response = await this.request(endpoint, { method: 'DELETE' });\n    return response.json();\n  }\n};\n\n// ============================================\n// AUTHENTICATION\n// ============================================\nconst HubAuth = {\n  init() {\n    const token = localStorage.getItem('hub_token');\n    const user = localStorage.getItem('hub_user');\n\n    if (token && user) {\n      HubState.token = token;\n      HubState.currentUser = JSON.parse(user);\n\n      // Check if password change required\n      if (HubState.currentUser.mustChangePassword) {\n        this.showChangePasswordModal(true);\n      }\n\n      return true;\n    }\n    return false;\n  },\n\n  async login(username, password) {\n    try {\n      const response = await fetch(`${HubConfig.API_BASE}/admin/api/login`, {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify({ username, password })\n      });\n\n      const data = await response.json();\n\n      if (data.success) {\n        HubState.token = data.token;\n        HubState.currentUser = data.user;\n        localStorage.setItem('hub_token', data.token);\n        localStorage.setItem('hub_user', JSON.stringify(data.user));\n\n        if (data.user.mustChangePassword) {\n          this.showChangePasswordModal(true);\n        }\n\n        return { success: true };\n      }\n\n      return { success: false, error: data.error || 'Login failed' };\n    } catch (e) {\n      return { success: false, error: 'Network error' };\n    }\n  },\n\n  logout() {\n    HubState.token = null;\n    HubState.currentUser = null;\n    localStorage.removeItem('hub_token');\n    localStorage.removeItem('hub_user');\n    HubUI.showLoginScreen();\n  },\n\n  isAdmin() {\n    return HubState.currentUser?.role === 'admin';\n  },\n\n  showChangePasswordModal(required = false) {\n    const html = `\n      <div class=\"modal-overlay active\" id=\"changePasswordModal\">\n        <div class=\"modal\" style=\"max-width: 400px;\">\n          <div class=\"modal-header\" style=\"padding: 20px 24px;\">\n            <div class=\"modal-header-content\">\n              <div class=\"modal-title\" style=\"font-size: 18px;\">\n                ${required ? 'Password Change Required' : 'Change Password'}\n              </div>\n            </div>\n            ${!required ? '<button class=\"modal-close\" onclick=\"HubAuth.closeChangePasswordModal()\">&times;</button>' : ''}\n          </div>\n          <div class=\"modal-body\" style=\"padding: 24px;\">\n            ${required ? '<p style=\"margin-bottom: 16px; color: var(--gray-600);\">You must change your password before continuing.</p>' : ''}\n            ${!required ? `\n              <div class=\"form-group\">\n                <label>Current Password</label>\n                <input type=\"password\" id=\"currentPassword\" class=\"form-input\">\n              </div>\n            ` : ''}\n            <div class=\"form-group\">\n              <label>New Password</label>\n              <input type=\"password\" id=\"newPassword\" class=\"form-input\" placeholder=\"Minimum 6 characters\">\n            </div>\n            <div class=\"form-group\">\n              <label>Confirm New Password</label>\n              <input type=\"password\" id=\"confirmPassword\" class=\"form-input\">\n            </div>\n            <div id=\"passwordError\" class=\"error-message\" style=\"display: none;\"></div>\n            <button class=\"btn btn-primary\" style=\"width: 100%; margin-top: 16px;\" onclick=\"HubAuth.changePassword(${required})\">\n              Change Password\n            </button>\n          </div>\n        </div>\n      </div>\n    `;\n    document.body.insertAdjacentHTML('beforeend', html);\n  },\n\n  async changePassword(required) {\n    const currentPassword = document.getElementById('currentPassword')?.value;\n    const newPassword = document.getElementById('newPassword').value;\n    const confirmPassword = document.getElementById('confirmPassword').value;\n    const errorEl = document.getElementById('passwordError');\n\n    if (newPassword !== confirmPassword) {\n      errorEl.textContent = 'Passwords do not match';\n      errorEl.style.display = 'block';\n      return;\n    }\n\n    if (newPassword.length < 6) {\n      errorEl.textContent = 'Password must be at least 6 characters';\n      errorEl.style.display = 'block';\n      return;\n    }\n\n    try {\n      const result = await HubAPI.post('/hub/api/change-password', {\n        currentPassword,\n        newPassword\n      });\n\n      if (result.success) {\n        HubState.currentUser.mustChangePassword = false;\n        localStorage.setItem('hub_user', JSON.stringify(HubState.currentUser));\n        this.closeChangePasswordModal();\n        HubUI.showToast('Password changed successfully', 'success');\n      } else {\n        errorEl.textContent = result.error || 'Failed to change password';\n        errorEl.style.display = 'block';\n      }\n    } catch (e) {\n      errorEl.textContent = 'Network error';\n      errorEl.style.display = 'block';\n    }\n  },\n\n  closeChangePasswordModal() {\n    document.getElementById('changePasswordModal')?.remove();\n  }\n};\n\n// ============================================\n// BULK ACTIONS\n// ============================================\nconst HubBulkActions = {\n  toggleSelect(caseId) {\n    if (HubState.selectedCaseIds.has(caseId)) {\n      HubState.selectedCaseIds.delete(caseId);\n    } else {\n      if (HubState.selectedCaseIds.size >= HubConfig.MAX_BULK_SELECT) {\n        HubUI.showToast(`Maximum ${HubConfig.MAX_BULK_SELECT} cases can be selected`, 'warning');\n        return;\n      }\n      HubState.selectedCaseIds.add(caseId);\n    }\n    this.updateUI();\n  },\n\n  selectAll() {\n    // Use HubState.cases first, fallback to window.allCases or window.casesList (inline script sources)\n    const cases = HubState.cases.length > 0 ? HubState.cases : (window.allCases || window.casesList || []);\n    const visibleIds = cases.slice(0, HubConfig.MAX_BULK_SELECT).map(c => c.case_id);\n    visibleIds.forEach(id => HubState.selectedCaseIds.add(id));\n    this.updateUI();\n  },\n\n  deselectAll() {\n    HubState.selectedCaseIds.clear();\n    this.updateUI();\n  },\n\n  updateUI() {\n    const count = HubState.selectedCaseIds.size;\n    const toolbar = document.getElementById('bulkActionsToolbar');\n\n    // Add null check for toolbar\n    if (toolbar) {\n      if (count > 0) {\n        toolbar.style.display = 'flex';\n        const countEl = document.getElementById('selectedCount');\n        if (countEl) countEl.textContent = `${count} selected`;\n      } else {\n        toolbar.style.display = 'none';\n      }\n    }\n\n    // Update checkboxes\n    document.querySelectorAll('.case-checkbox').forEach(cb => {\n      cb.checked = HubState.selectedCaseIds.has(cb.dataset.caseId);\n    });\n\n    // Update select all checkbox\n    const selectAllCb = document.getElementById('selectAllCases');\n    if (selectAllCb) {\n      const allCases = window.allCases || window.casesList || HubState.cases || [];\n      selectAllCb.checked = count > 0 && count >= allCases.length;\n    }\n  },\n\n  async updateStatus(status) {\n    if (HubState.selectedCaseIds.size === 0) return;\n\n    // If completing, show checklist first\n    if (status === 'completed') {\n      this.showBulkChecklistModal();\n      return;\n    }\n\n    try {\n      HubUI.showLoading();\n      const result = await HubAPI.post('/hub/api/bulk/status', {\n        caseIds: Array.from(HubState.selectedCaseIds),\n        status,\n        actor: HubState.currentUser?.name || 'team_member',\n        actor_email: HubState.currentUser?.email || ''\n      });\n\n      if (result.success) {\n        HubUI.showToast(result.message, 'success');\n        this.deselectAll();\n        // Use inline script's loadCasesView if available, otherwise HubCases.loadCases\n        if (typeof loadCasesView === 'function') {\n          loadCasesView();\n        } else if (typeof HubCases !== 'undefined') {\n          HubCases.loadCases();\n        }\n      } else {\n        HubUI.showToast(result.error || 'Update failed', 'error');\n      }\n    } catch (e) {\n      console.error('Bulk update error:', e);\n      HubUI.showToast('Failed to update cases: ' + (e.message || 'Unknown error'), 'error');\n    } finally {\n      HubUI.hideLoading();\n    }\n  },\n\n  async assign(userId) {\n    if (!HubAuth.isAdmin()) {\n      HubUI.showToast('Admin access required', 'error');\n      return;\n    }\n\n    try {\n      HubUI.showLoading();\n      const result = await HubAPI.post('/hub/api/bulk/assign', {\n        caseIds: Array.from(HubState.selectedCaseIds),\n        assignToUserId: userId\n      });\n\n      if (result.success) {\n        HubUI.showToast(result.message, 'success');\n        this.deselectAll();\n        // Use inline script's loadCasesView if available\n        if (typeof loadCasesView === 'function') {\n          loadCasesView();\n        } else if (typeof HubCases !== 'undefined') {\n          HubCases.loadCases();\n        }\n      } else {\n        HubUI.showToast(result.error || 'Assign failed', 'error');\n      }\n    } catch (e) {\n      HubUI.showToast('Failed to assign cases: ' + (e.message || 'Unknown error'), 'error');\n    } finally {\n      HubUI.hideLoading();\n    }\n  },\n\n  showAssignModal() {\n    // Will be populated with users list\n    HubUsers.showAssignModal(Array.from(HubState.selectedCaseIds));\n  },\n\n  async addComment() {\n    const comment = prompt('Enter comment to add to all selected cases:');\n    if (!comment) return;\n\n    try {\n      HubUI.showLoading();\n      const result = await HubAPI.post('/hub/api/bulk/comment', {\n        caseIds: Array.from(HubState.selectedCaseIds),\n        comment\n      });\n\n      if (result.success) {\n        HubUI.showToast(result.message, 'success');\n      } else {\n        HubUI.showToast(result.error, 'error');\n      }\n    } catch (e) {\n      HubUI.showToast('Failed to add comments', 'error');\n    } finally {\n      HubUI.hideLoading();\n    }\n  },\n\n  async exportCSV() {\n    try {\n      const response = await HubAPI.request('/hub/api/bulk/export', {\n        method: 'POST',\n        body: JSON.stringify({\n          caseIds: HubState.selectedCaseIds.size > 0 ? Array.from(HubState.selectedCaseIds) : null\n        })\n      });\n\n      const blob = await response.blob();\n      const url = URL.createObjectURL(blob);\n      const a = document.createElement('a');\n      a.href = url;\n      a.download = `cases-export-${new Date().toISOString().split('T')[0]}.csv`;\n      a.click();\n      URL.revokeObjectURL(url);\n\n      HubUI.showToast('Export downloaded', 'success');\n    } catch (e) {\n      HubUI.showToast('Failed to export', 'error');\n    }\n  },\n\n  showBulkChecklistModal() {\n    // For bulk completion, show a simple confirmation\n    const html = `\n      <div class=\"modal-overlay active\" id=\"bulkChecklistModal\">\n        <div class=\"modal\" style=\"max-width: 500px;\">\n          <div class=\"modal-header\" style=\"padding: 20px 24px;\">\n            <div class=\"modal-header-content\">\n              <div class=\"modal-title\" style=\"font-size: 18px;\">Complete ${HubState.selectedCaseIds.size} Cases</div>\n            </div>\n            <button class=\"modal-close\" onclick=\"document.getElementById('bulkChecklistModal').remove()\">&times;</button>\n          </div>\n          <div class=\"modal-body\" style=\"padding: 24px;\">\n            <p style=\"margin-bottom: 16px;\">Are you sure you want to mark ${HubState.selectedCaseIds.size} cases as completed?</p>\n            <p style=\"margin-bottom: 24px; color: var(--gray-500); font-size: 14px;\">\n              Make sure you have actioned all resolutions before completing.\n            </p>\n            <div style=\"display: flex; gap: 12px; justify-content: flex-end;\">\n              <button class=\"btn btn-secondary\" onclick=\"document.getElementById('bulkChecklistModal').remove()\">Cancel</button>\n              <button class=\"btn btn-primary\" onclick=\"HubBulkActions.confirmBulkComplete()\">Complete All</button>\n            </div>\n          </div>\n        </div>\n      </div>\n    `;\n    document.body.insertAdjacentHTML('beforeend', html);\n  },\n\n  async confirmBulkComplete() {\n    document.getElementById('bulkChecklistModal')?.remove();\n\n    try {\n      HubUI.showLoading();\n      const result = await HubAPI.post('/hub/api/bulk/status', {\n        caseIds: Array.from(HubState.selectedCaseIds),\n        status: 'completed',\n        actor: HubState.currentUser?.name || 'team_member',\n        actor_email: HubState.currentUser?.email || ''\n      });\n\n      if (result.success) {\n        HubUI.showToast(result.message, 'success');\n        this.deselectAll();\n        // Use inline script's loadCasesView if available\n        if (typeof loadCasesView === 'function') {\n          loadCasesView();\n        } else if (typeof HubCases !== 'undefined') {\n          HubCases.loadCases();\n        }\n      } else {\n        HubUI.showToast(result.error || 'Complete failed', 'error');\n      }\n    } catch (e) {\n      HubUI.showToast('Failed to complete cases: ' + (e.message || 'Unknown error'), 'error');\n    } finally {\n      HubUI.hideLoading();\n    }\n  }\n};\n\n// ============================================\n// SAVED VIEWS\n// ============================================\nconst HubViews = {\n  async load() {\n    try {\n      const result = await HubAPI.get('/hub/api/views');\n      if (result.success) {\n        HubState.savedViews = result.views;\n        this.renderSidebar();\n      }\n    } catch (e) {\n      console.error('Failed to load views:', e);\n    }\n  },\n\n  renderSidebar() {\n    const container = document.getElementById('savedViewsList');\n    if (!container) return;\n\n    if (HubState.savedViews.length === 0) {\n      container.innerHTML = '<div class=\"empty-views\">No saved views</div>';\n      return;\n    }\n\n    container.innerHTML = HubState.savedViews.map(view => `\n      <div class=\"saved-view-item ${HubState.currentView?.id === view.id ? 'active' : ''}\"\n           onclick=\"HubViews.apply(${view.id})\" data-view-id=\"${view.id}\">\n        <span class=\"view-name\">${this.escapeHtml(view.name)}</span>\n        ${view.is_default ? '<span class=\"view-default\">Default</span>' : ''}\n        <button class=\"view-delete\" onclick=\"event.stopPropagation(); HubViews.delete(${view.id})\" title=\"Delete view\">\n          &times;\n        </button>\n      </div>\n    `).join('');\n  },\n\n  async save() {\n    const name = prompt('Enter a name for this view:');\n    if (!name) return;\n\n    const filters = {\n      status: HubState.currentStatus,\n      caseType: HubState.currentFilter,\n      search: HubState.currentSearch\n    };\n\n    try {\n      const result = await HubAPI.post('/hub/api/views', {\n        name,\n        filters,\n        isDefault: false\n      });\n\n      if (result.success) {\n        HubUI.showToast('View saved', 'success');\n        this.load();\n      } else {\n        HubUI.showToast(result.error, 'error');\n      }\n    } catch (e) {\n      HubUI.showToast('Failed to save view', 'error');\n    }\n  },\n\n  async apply(viewId) {\n    const view = HubState.savedViews.find(v => v.id === viewId);\n    if (!view) return;\n\n    const filters = JSON.parse(view.filters);\n    HubState.currentView = view;\n    HubState.currentStatus = filters.status;\n    HubState.currentFilter = filters.caseType || 'all';\n    HubState.currentSearch = filters.search || '';\n\n    // Update UI\n    document.getElementById('searchInput').value = HubState.currentSearch;\n    this.renderSidebar();\n    HubCases.loadCases();\n  },\n\n  async delete(viewId) {\n    if (!confirm('Delete this saved view?')) return;\n\n    try {\n      const result = await HubAPI.delete(`/hub/api/views/${viewId}`);\n      if (result.success) {\n        HubUI.showToast('View deleted', 'success');\n        if (HubState.currentView?.id === viewId) {\n          HubState.currentView = null;\n        }\n        this.load();\n      } else {\n        HubUI.showToast(result.error, 'error');\n      }\n    } catch (e) {\n      HubUI.showToast('Failed to delete view', 'error');\n    }\n  },\n\n  escapeHtml(text) {\n    const div = document.createElement('div');\n    div.textContent = text;\n    return div.innerHTML;\n  }\n};\n\n// ============================================\n// COMPLETION CHECKLIST\n// ============================================\nconst HubChecklist = {\n  async showForCase(caseId) {\n    try {\n      const result = await HubAPI.get(`/hub/api/case/${caseId}/checklist`);\n\n      if (!result.success || !result.checklist || result.checklist.length === 0) {\n        // No checklist items, just complete\n        return { canComplete: true, items: [] };\n      }\n\n      return new Promise((resolve) => {\n        this.showModal(caseId, result.checklist, resolve);\n      });\n    } catch (e) {\n      console.error('Failed to get checklist:', e);\n      return { canComplete: true, items: [] };\n    }\n  },\n\n  showModal(caseId, items, resolve) {\n    const html = `\n      <div class=\"modal-overlay active\" id=\"checklistModal\">\n        <div class=\"modal\" style=\"max-width: 500px;\">\n          <div class=\"modal-header\" style=\"padding: 20px 24px; background: linear-gradient(135deg, #059669 0%, #10b981 100%);\">\n            <div class=\"modal-header-content\">\n              <div class=\"modal-title\" style=\"font-size: 18px;\">Completion Checklist</div>\n              <div style=\"font-size: 13px; opacity: 0.9; margin-top: 4px;\">Verify all items before completing</div>\n            </div>\n            <button class=\"modal-close\" onclick=\"HubChecklist.cancel()\">&times;</button>\n          </div>\n          <div class=\"modal-body\" style=\"padding: 24px;\">\n            <div class=\"checklist-items\">\n              ${items.map((item, idx) => `\n                <label class=\"checklist-item ${item.is_required ? 'required' : ''}\">\n                  <input type=\"checkbox\"\n                         class=\"checklist-checkbox\"\n                         data-item-id=\"${item.id}\"\n                         ${item.isCompleted ? 'checked' : ''}>\n                  <span class=\"checklist-text\">\n                    ${this.escapeHtml(item.checklist_item)}\n                    ${item.is_required ? '<span class=\"required-badge\">Required</span>' : ''}\n                  </span>\n                  ${item.completedBy ? `<span class=\"completed-by\">by ${this.escapeHtml(item.completedBy)}</span>` : ''}\n                </label>\n              `).join('')}\n            </div>\n            <div id=\"checklistError\" class=\"error-message\" style=\"display: none; margin-top: 16px;\"></div>\n            <div style=\"display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;\">\n              <button class=\"btn btn-secondary\" onclick=\"HubChecklist.cancel()\">Cancel</button>\n              <button class=\"btn btn-primary\" onclick=\"HubChecklist.confirm('${caseId}')\" style=\"background: #059669;\">\n                Complete Case\n              </button>\n            </div>\n          </div>\n        </div>\n      </div>\n    `;\n\n    document.body.insertAdjacentHTML('beforeend', html);\n\n    // Store resolve function\n    this._resolve = resolve;\n    this._caseId = caseId;\n  },\n\n  async confirm(caseId) {\n    const checkboxes = document.querySelectorAll('.checklist-checkbox');\n    const requiredItems = document.querySelectorAll('.checklist-item.required .checklist-checkbox');\n    const uncheckedRequired = Array.from(requiredItems).filter(cb => !cb.checked);\n\n    if (uncheckedRequired.length > 0) {\n      const errorEl = document.getElementById('checklistError');\n      errorEl.textContent = 'Please complete all required items';\n      errorEl.style.display = 'block';\n      return;\n    }\n\n    // Save checklist completions\n    for (const cb of checkboxes) {\n      await HubAPI.post('/hub/api/checklist/complete', {\n        caseId,\n        checklistItemId: parseInt(cb.dataset.itemId),\n        completed: cb.checked\n      });\n    }\n\n    document.getElementById('checklistModal')?.remove();\n\n    if (this._resolve) {\n      this._resolve({ canComplete: true });\n      this._resolve = null;\n    }\n  },\n\n  cancel() {\n    document.getElementById('checklistModal')?.remove();\n    if (this._resolve) {\n      this._resolve({ canComplete: false });\n      this._resolve = null;\n    }\n  },\n\n  escapeHtml(text) {\n    const div = document.createElement('div');\n    div.textContent = text;\n    return div.innerHTML;\n  }\n};\n\n// ============================================\n// KEYBOARD SHORTCUTS\n// ============================================\nconst HubKeyboard = {\n  init() {\n    document.addEventListener('keydown', this.handleKeydown.bind(this));\n  },\n\n  handleKeydown(e) {\n    // Ignore if typing in input\n    if (e.target.matches('input, textarea, select')) {\n      if (e.key === 'Escape') {\n        e.target.blur();\n      }\n      return;\n    }\n\n    const key = e.key.toLowerCase();\n\n    // Handle key sequences (g+d, g+c, etc.)\n    if (HubState.keySequence) {\n      this.handleSequence(HubState.keySequence + key, e);\n      HubState.keySequence = '';\n      clearTimeout(HubState.keySequenceTimeout);\n      return;\n    }\n\n    // Start sequence for 'g', 'f', 'b'\n    if (['g', 'f', 'b'].includes(key) && !e.ctrlKey && !e.metaKey) {\n      HubState.keySequence = key;\n      HubState.keySequenceTimeout = setTimeout(() => {\n        HubState.keySequence = '';\n      }, 1000);\n      return;\n    }\n\n    // Single key shortcuts\n    this.handleSingleKey(key, e);\n  },\n\n  handleSequence(seq, e) {\n    const actions = {\n      // Navigation: g + key\n      'gd': () => HubNavigation.goto('dashboard'),\n      'gc': () => HubNavigation.goto('cases'),\n      'ga': () => HubNavigation.goto('analytics'),\n      'gs': () => HubNavigation.goto('sessions'),\n      'gu': () => HubAuth.isAdmin() && HubUsers.showManagement(),\n      'gl': () => HubAuth.isAdmin() && HubEnhancedAuditLog.show(),\n      'gq': () => HubAuth.isAdmin() && HubAssignment.showQueue(),\n\n      // Filters: f + key\n      'fp': () => HubCases.setStatusFilter('pending'),\n      'fi': () => HubCases.setStatusFilter('in_progress'),\n      'fc': () => HubCases.setStatusFilter('completed'),\n      'fa': () => HubCases.setStatusFilter(null),\n\n      // Bulk: b + key\n      'bs': () => HubState.selectedCaseIds.size > 0 && this.showBulkStatusMenu(),\n      'ba': () => HubState.selectedCaseIds.size > 0 && HubBulkActions.showAssignModal(),\n      'bc': () => HubState.selectedCaseIds.size > 0 && HubBulkActions.addComment(),\n      'be': () => HubBulkActions.exportCSV()\n    };\n\n    if (actions[seq]) {\n      e.preventDefault();\n      actions[seq]();\n    }\n  },\n\n  handleSingleKey(key, e) {\n    const modalOpen = document.querySelector('.modal-overlay.active');\n\n    // Global shortcuts\n    if (key === '?') {\n      e.preventDefault();\n      this.showHelp();\n      return;\n    }\n\n    if (key === '/' && !modalOpen) {\n      e.preventDefault();\n      document.getElementById('searchInput')?.focus();\n      return;\n    }\n\n    if (key === 'escape') {\n      if (modalOpen) {\n        HubUI.closeModal();\n      }\n      return;\n    }\n\n    if (key === 'r' && !modalOpen) {\n      e.preventDefault();\n      HubUI.refresh();\n      return;\n    }\n\n    // Case list shortcuts\n    if (!modalOpen && HubState.currentPage === 'cases') {\n      if (key === 'j') {\n        e.preventDefault();\n        this.selectNextCase();\n        return;\n      }\n      if (key === 'k') {\n        e.preventDefault();\n        this.selectPrevCase();\n        return;\n      }\n      if (key === 'enter') {\n        e.preventDefault();\n        this.openSelectedCase();\n        return;\n      }\n      if (key === 'x') {\n        e.preventDefault();\n        if (e.shiftKey) {\n          HubBulkActions.selectAll();\n        } else {\n          this.toggleSelectedCase();\n        }\n        return;\n      }\n    }\n\n    // Case modal shortcuts\n    if (modalOpen && HubState.currentCase) {\n      if (key === '1') {\n        e.preventDefault();\n        HubCases.updateStatus('pending');\n        return;\n      }\n      if (key === '2') {\n        e.preventDefault();\n        HubCases.updateStatus('in_progress');\n        return;\n      }\n      if (key === '3') {\n        e.preventDefault();\n        HubCases.updateStatus('completed');\n        return;\n      }\n      if (key === '[') {\n        e.preventDefault();\n        HubCases.navigateCase('prev');\n        return;\n      }\n      if (key === ']') {\n        e.preventDefault();\n        HubCases.navigateCase('next');\n        return;\n      }\n      if (key === 'c') {\n        e.preventDefault();\n        document.getElementById('commentInput')?.focus();\n        return;\n      }\n      if (key === 'e') {\n        e.preventDefault();\n        this.copyEmail();\n        return;\n      }\n      if (key === 'o') {\n        e.preventDefault();\n        HubCases.openShopifyOrder();\n        return;\n      }\n    }\n  },\n\n  selectNextCase() {\n    const rows = document.querySelectorAll('.cases-table tbody tr');\n    const currentIdx = Array.from(rows).findIndex(r => r.classList.contains('keyboard-selected'));\n    const nextIdx = Math.min(currentIdx + 1, rows.length - 1);\n\n    rows.forEach(r => r.classList.remove('keyboard-selected'));\n    rows[nextIdx]?.classList.add('keyboard-selected');\n    rows[nextIdx]?.scrollIntoView({ block: 'nearest' });\n  },\n\n  selectPrevCase() {\n    const rows = document.querySelectorAll('.cases-table tbody tr');\n    const currentIdx = Array.from(rows).findIndex(r => r.classList.contains('keyboard-selected'));\n    const prevIdx = Math.max(currentIdx - 1, 0);\n\n    rows.forEach(r => r.classList.remove('keyboard-selected'));\n    rows[prevIdx]?.classList.add('keyboard-selected');\n    rows[prevIdx]?.scrollIntoView({ block: 'nearest' });\n  },\n\n  openSelectedCase() {\n    const selected = document.querySelector('.cases-table tbody tr.keyboard-selected');\n    if (selected) {\n      selected.click();\n    }\n  },\n\n  toggleSelectedCase() {\n    const selected = document.querySelector('.cases-table tbody tr.keyboard-selected');\n    if (selected) {\n      const checkbox = selected.querySelector('.case-checkbox');\n      if (checkbox) {\n        HubBulkActions.toggleSelect(checkbox.dataset.caseId);\n      }\n    }\n  },\n\n  copyEmail() {\n    const email = HubState.currentCase?.customer_email;\n    if (email) {\n      navigator.clipboard.writeText(email);\n      HubUI.showToast('Email copied', 'success');\n    }\n  },\n\n  showHelp() {\n    const html = `\n      <div class=\"modal-overlay active\" id=\"helpModal\">\n        <div class=\"modal\" style=\"max-width: 600px;\">\n          <div class=\"modal-header\" style=\"padding: 20px 24px;\">\n            <div class=\"modal-header-content\">\n              <div class=\"modal-title\" style=\"font-size: 18px;\">Keyboard Shortcuts</div>\n            </div>\n            <button class=\"modal-close\" onclick=\"document.getElementById('helpModal').remove()\">&times;</button>\n          </div>\n          <div class=\"modal-body\" style=\"padding: 24px; max-height: 60vh; overflow-y: auto;\">\n            <div class=\"shortcuts-section\">\n              <h4>Global</h4>\n              <div class=\"shortcut\"><kbd>?</kbd> Show help</div>\n              <div class=\"shortcut\"><kbd>/</kbd> Focus search</div>\n              <div class=\"shortcut\"><kbd>R</kbd> Refresh</div>\n              <div class=\"shortcut\"><kbd>Esc</kbd> Close modal</div>\n            </div>\n            <div class=\"shortcuts-section\">\n              <h4>Navigation</h4>\n              <div class=\"shortcut\"><kbd>G</kbd> then <kbd>D</kbd> Dashboard</div>\n              <div class=\"shortcut\"><kbd>G</kbd> then <kbd>C</kbd> Cases</div>\n              <div class=\"shortcut\"><kbd>G</kbd> then <kbd>A</kbd> Analytics</div>\n            </div>\n            <div class=\"shortcuts-section\">\n              <h4>Case List</h4>\n              <div class=\"shortcut\"><kbd>J</kbd> / <kbd>K</kbd> Navigate up/down</div>\n              <div class=\"shortcut\"><kbd>Enter</kbd> Open case</div>\n              <div class=\"shortcut\"><kbd>X</kbd> Toggle select</div>\n              <div class=\"shortcut\"><kbd>Shift+X</kbd> Select all</div>\n            </div>\n            <div class=\"shortcuts-section\">\n              <h4>Case Modal</h4>\n              <div class=\"shortcut\"><kbd>1</kbd> Set Pending</div>\n              <div class=\"shortcut\"><kbd>2</kbd> Set In Progress</div>\n              <div class=\"shortcut\"><kbd>3</kbd> Set Completed</div>\n              <div class=\"shortcut\"><kbd>[</kbd> / <kbd>]</kbd> Prev/Next case</div>\n              <div class=\"shortcut\"><kbd>C</kbd> Add comment</div>\n              <div class=\"shortcut\"><kbd>E</kbd> Copy email</div>\n            </div>\n          </div>\n        </div>\n      </div>\n    `;\n    document.body.insertAdjacentHTML('beforeend', html);\n  },\n\n  showBulkStatusMenu() {\n    // Simple prompt for now\n    const status = prompt('Enter status (pending, in_progress, completed):');\n    if (status && ['pending', 'in_progress', 'completed'].includes(status)) {\n      HubBulkActions.updateStatus(status);\n    }\n  }\n};\n\n// ============================================\n// USER MANAGEMENT (Admin)\n// ============================================\nconst HubUsers = {\n  users: [],\n\n  async load() {\n    if (!HubAuth.isAdmin()) return;\n\n    try {\n      const result = await HubAPI.get('/hub/api/users');\n      if (result.success) {\n        this.users = result.users;\n      }\n    } catch (e) {\n      console.error('Failed to load users:', e);\n    }\n  },\n\n  showManagement() {\n    if (!HubAuth.isAdmin()) {\n      HubUI.showToast('Admin access required', 'error');\n      return;\n    }\n\n    this.load().then(() => {\n      const html = `\n        <div class=\"modal-overlay active\" id=\"userManagementModal\">\n          <div class=\"modal\" style=\"max-width: 700px;\">\n            <div class=\"modal-header\" style=\"padding: 20px 24px;\">\n              <div class=\"modal-header-content\">\n                <div class=\"modal-title\" style=\"font-size: 18px;\">User Management</div>\n              </div>\n              <button class=\"modal-close\" onclick=\"document.getElementById('userManagementModal').remove()\">&times;</button>\n            </div>\n            <div class=\"modal-body\" style=\"padding: 24px;\">\n              <div style=\"display: flex; justify-content: space-between; margin-bottom: 16px;\">\n                <h4>Team Members</h4>\n                <button class=\"btn btn-primary\" onclick=\"HubUsers.showCreateForm()\">Add User</button>\n              </div>\n              <div class=\"users-list\">\n                ${this.users.map(u => `\n                  <div class=\"user-row\">\n                    <div class=\"user-row-info\">\n                      <div class=\"user-row-name\">${this.escapeHtml(u.name)}</div>\n                      <div class=\"user-row-meta\">${u.username} &bull; ${u.role}</div>\n                    </div>\n                    <div class=\"user-row-status ${u.is_active ? 'active' : 'inactive'}\">\n                      ${u.is_active ? 'Active' : 'Inactive'}\n                    </div>\n                    <div class=\"user-row-actions\">\n                      <button class=\"btn-icon\" onclick=\"HubUsers.edit(${u.id})\" title=\"Edit\">Edit</button>\n                      ${u.id !== HubState.currentUser.id ? `\n                        <button class=\"btn-icon danger\" onclick=\"HubUsers.delete(${u.id})\" title=\"Delete\">Delete</button>\n                      ` : ''}\n                    </div>\n                  </div>\n                `).join('')}\n              </div>\n            </div>\n          </div>\n        </div>\n      `;\n      document.body.insertAdjacentHTML('beforeend', html);\n    });\n  },\n\n  showCreateForm() {\n    const html = `\n      <div class=\"modal-overlay active\" id=\"createUserModal\" style=\"z-index: 210;\">\n        <div class=\"modal\" style=\"max-width: 400px;\">\n          <div class=\"modal-header\" style=\"padding: 20px 24px;\">\n            <div class=\"modal-header-content\">\n              <div class=\"modal-title\" style=\"font-size: 18px;\">Create User</div>\n            </div>\n            <button class=\"modal-close\" onclick=\"document.getElementById('createUserModal').remove()\">&times;</button>\n          </div>\n          <div class=\"modal-body\" style=\"padding: 24px;\">\n            <div class=\"form-group\">\n              <label>Username (email)</label>\n              <input type=\"text\" id=\"newUsername\" class=\"form-input\" placeholder=\"user@example.com\">\n            </div>\n            <div class=\"form-group\">\n              <label>Display Name</label>\n              <input type=\"text\" id=\"newUserName\" class=\"form-input\" placeholder=\"John Doe\">\n            </div>\n            <div class=\"form-group\">\n              <label>Role</label>\n              <select id=\"newUserRole\" class=\"form-input\">\n                <option value=\"user\">User</option>\n                <option value=\"admin\">Admin</option>\n              </select>\n            </div>\n            <div class=\"form-group\">\n              <label>Initial Password</label>\n              <input type=\"password\" id=\"newUserPassword\" class=\"form-input\" placeholder=\"Minimum 6 characters\">\n            </div>\n            <div id=\"createUserError\" class=\"error-message\" style=\"display: none;\"></div>\n            <button class=\"btn btn-primary\" style=\"width: 100%; margin-top: 16px;\" onclick=\"HubUsers.create()\">\n              Create User\n            </button>\n          </div>\n        </div>\n      </div>\n    `;\n    document.body.insertAdjacentHTML('beforeend', html);\n  },\n\n  async create() {\n    const username = document.getElementById('newUsername').value;\n    const name = document.getElementById('newUserName').value;\n    const role = document.getElementById('newUserRole').value;\n    const password = document.getElementById('newUserPassword').value;\n    const errorEl = document.getElementById('createUserError');\n\n    if (!username || !name || !password) {\n      errorEl.textContent = 'All fields are required';\n      errorEl.style.display = 'block';\n      return;\n    }\n\n    try {\n      const result = await HubAPI.post('/hub/api/users', { username, name, role, password });\n\n      if (result.success) {\n        document.getElementById('createUserModal').remove();\n        HubUI.showToast(result.message, 'success');\n        // Refresh user list\n        document.getElementById('userManagementModal').remove();\n        this.showManagement();\n      } else {\n        errorEl.textContent = result.error;\n        errorEl.style.display = 'block';\n      }\n    } catch (e) {\n      errorEl.textContent = 'Failed to create user';\n      errorEl.style.display = 'block';\n    }\n  },\n\n  async delete(userId) {\n    if (!confirm('Are you sure you want to delete this user?')) return;\n\n    try {\n      const result = await HubAPI.delete(`/hub/api/users/${userId}`);\n      if (result.success) {\n        HubUI.showToast('User deleted', 'success');\n        document.getElementById('userManagementModal').remove();\n        this.showManagement();\n      } else {\n        HubUI.showToast(result.error, 'error');\n      }\n    } catch (e) {\n      HubUI.showToast('Failed to delete user', 'error');\n    }\n  },\n\n  showAssignModal(caseIds) {\n    this.load().then(() => {\n      const html = `\n        <div class=\"modal-overlay active\" id=\"assignModal\">\n          <div class=\"modal\" style=\"max-width: 400px;\">\n            <div class=\"modal-header\" style=\"padding: 20px 24px;\">\n              <div class=\"modal-header-content\">\n                <div class=\"modal-title\" style=\"font-size: 18px;\">Assign ${caseIds.length} Case(s)</div>\n              </div>\n              <button class=\"modal-close\" onclick=\"document.getElementById('assignModal').remove()\">&times;</button>\n            </div>\n            <div class=\"modal-body\" style=\"padding: 24px;\">\n              <div class=\"form-group\">\n                <label>Assign to</label>\n                <select id=\"assignToUser\" class=\"form-input\">\n                  <option value=\"\">Unassign</option>\n                  ${this.users.filter(u => u.is_active).map(u => `\n                    <option value=\"${u.id}\">${this.escapeHtml(u.name)}</option>\n                  `).join('')}\n                </select>\n              </div>\n              <div style=\"display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;\">\n                <button class=\"btn btn-secondary\" onclick=\"document.getElementById('assignModal').remove()\">Cancel</button>\n                <button class=\"btn btn-primary\" onclick=\"HubUsers.confirmAssign()\">Assign</button>\n              </div>\n            </div>\n          </div>\n        </div>\n      `;\n      document.body.insertAdjacentHTML('beforeend', html);\n    });\n  },\n\n  async confirmAssign() {\n    const userId = document.getElementById('assignToUser').value;\n    document.getElementById('assignModal').remove();\n    await HubBulkActions.assign(userId ? parseInt(userId) : null);\n  },\n\n  escapeHtml(text) {\n    const div = document.createElement('div');\n    div.textContent = text;\n    return div.innerHTML;\n  }\n};\n\n// ============================================\n// ASSIGNMENT QUEUE (Admin)\n// ============================================\nconst HubAssignment = {\n  async showQueue() {\n    if (!HubAuth.isAdmin()) {\n      HubUI.showToast('Admin access required', 'error');\n      return;\n    }\n\n    try {\n      const result = await HubAPI.get('/hub/api/assignment-queue');\n      const queue = result.queue || [];\n\n      const html = `\n        <div class=\"modal-overlay active\" id=\"assignmentQueueModal\">\n          <div class=\"modal\" style=\"max-width: 600px;\">\n            <div class=\"modal-header\" style=\"padding: 20px 24px;\">\n              <div class=\"modal-header-content\">\n                <div class=\"modal-title\" style=\"font-size: 18px;\">Assignment Queue (Round Robin)</div>\n              </div>\n              <button class=\"modal-close\" onclick=\"document.getElementById('assignmentQueueModal').remove()\">&times;</button>\n            </div>\n            <div class=\"modal-body\" style=\"padding: 24px;\">\n              <p style=\"margin-bottom: 16px; color: var(--gray-500);\">\n                Configure which team members receive auto-assigned cases.\n              </p>\n              ${queue.length > 0 ? `\n                <table class=\"queue-table\">\n                  <thead>\n                    <tr>\n                      <th>User</th>\n                      <th>Case Type</th>\n                      <th>Load</th>\n                      <th>Active</th>\n                    </tr>\n                  </thead>\n                  <tbody>\n                    ${queue.map(q => `\n                      <tr>\n                        <td>${q.user_name}</td>\n                        <td>${q.case_type || 'All'}</td>\n                        <td>${q.current_load} / ${q.max_load}</td>\n                        <td>\n                          <input type=\"checkbox\" ${q.is_active ? 'checked' : ''}\n                                 onchange=\"HubAssignment.toggleActive(${q.id}, this.checked)\">\n                        </td>\n                      </tr>\n                    `).join('')}\n                  </tbody>\n                </table>\n              ` : '<p>No users in assignment queue. Add users to enable auto-assignment.</p>'}\n              <button class=\"btn btn-secondary\" style=\"margin-top: 16px;\" onclick=\"HubAssignment.recalculate()\">\n                Recalculate Loads\n              </button>\n            </div>\n          </div>\n        </div>\n      `;\n      document.body.insertAdjacentHTML('beforeend', html);\n    } catch (e) {\n      HubUI.showToast('Failed to load assignment queue', 'error');\n    }\n  },\n\n  async toggleActive(queueId, isActive) {\n    // Implementation would update the queue entry\n  },\n\n  async recalculate() {\n    try {\n      const result = await HubAPI.post('/hub/api/assignment/recalculate', {});\n      if (result.success) {\n        HubUI.showToast('Loads recalculated', 'success');\n        document.getElementById('assignmentQueueModal').remove();\n        this.showQueue();\n      }\n    } catch (e) {\n      HubUI.showToast('Failed to recalculate', 'error');\n    }\n  }\n};\n\n// ============================================\n// CASES\n// ============================================\nconst HubCases = {\n  async loadCases(page = 1) {\n    HubUI.showLoading();\n\n    try {\n      let url = `/hub/api/cases?page=${page}&limit=${HubConfig.ITEMS_PER_PAGE}`;\n\n      if (HubState.currentFilter && HubState.currentFilter !== 'all') {\n        url += `&type=${HubState.currentFilter}`;\n      }\n      if (HubState.currentStatus) {\n        url += `&status=${HubState.currentStatus}`;\n      }\n      if (HubState.currentSearch) {\n        url += `&search=${encodeURIComponent(HubState.currentSearch)}`;\n      }\n\n      const result = await HubAPI.get(url);\n      HubState.cases = result.cases || [];\n      HubState.casesPage = page;\n      HubState.totalPages = result.totalPages || 1;\n\n      this.renderCasesList();\n    } catch (e) {\n      console.error('Failed to load cases:', e);\n      HubUI.showToast('Failed to load cases', 'error');\n    } finally {\n      HubUI.hideLoading();\n    }\n  },\n\n  renderCasesList() {\n    const container = document.getElementById('casesTableBody');\n    if (!container) return;\n\n    if (HubState.cases.length === 0) {\n      container.innerHTML = `\n        <tr>\n          <td colspan=\"7\" class=\"empty-state\">No cases found</td>\n        </tr>\n      `;\n      return;\n    }\n\n    container.innerHTML = HubState.cases.map((c, idx) => `\n      <tr onclick=\"HubCases.openCase('${c.case_id}')\" class=\"${idx === 0 ? 'keyboard-selected' : ''}\">\n        <td>\n          <input type=\"checkbox\" class=\"case-checkbox\" data-case-id=\"${c.case_id}\"\n                 onclick=\"event.stopPropagation(); HubBulkActions.toggleSelect('${c.case_id}')\"\n                 ${HubState.selectedCaseIds.has(c.case_id) ? 'checked' : ''}>\n        </td>\n        <td class=\"case-id\">${c.case_id}</td>\n        <td>\n          <div class=\"customer-info\">\n            <span class=\"customer-name\">${this.escapeHtml(c.customer_name || 'Unknown')}</span>\n            <span class=\"customer-email\">${this.escapeHtml(c.customer_email || '-')}</span>\n          </div>\n        </td>\n        <td><span class=\"type-badge ${c.case_type}\">${c.case_type}</span></td>\n        <td><span class=\"status-badge ${c.status.replace('_', '-')}\">${this.formatStatus(c.status)}</span></td>\n        <td>${c.assigned_to || '-'}</td>\n        <td class=\"time-ago\">${this.timeAgo(c.created_at)}</td>\n      </tr>\n    `).join('');\n\n    this.renderPagination();\n  },\n\n  renderPagination() {\n    const container = document.getElementById('casesPagination');\n    if (!container) return;\n\n    let html = '';\n\n    if (HubState.casesPage > 1) {\n      html += `<button onclick=\"HubCases.loadCases(${HubState.casesPage - 1})\">Previous</button>`;\n    }\n\n    html += `<span>Page ${HubState.casesPage} of ${HubState.totalPages}</span>`;\n\n    if (HubState.casesPage < HubState.totalPages) {\n      html += `<button onclick=\"HubCases.loadCases(${HubState.casesPage + 1})\">Next</button>`;\n    }\n\n    container.innerHTML = html;\n  },\n\n  async openCase(caseId) {\n    try {\n      const result = await HubAPI.get(`/hub/api/case/${caseId}`);\n      if (result.case) {\n        HubState.currentCase = result.case;\n        HubState.currentCaseIndex = HubState.cases.findIndex(c => c.case_id === caseId);\n        HubUI.showCaseModal(result.case);\n      }\n    } catch (e) {\n      HubUI.showToast('Failed to load case', 'error');\n    }\n  },\n\n  async updateStatus(status) {\n    if (!HubState.currentCase) return;\n\n    // If completing, show checklist first\n    if (status === 'completed') {\n      const result = await HubChecklist.showForCase(HubState.currentCase.case_id);\n      if (!result.canComplete) return;\n    }\n\n    try {\n      const result = await HubAPI.put(`/hub/api/case/${HubState.currentCase.case_id}/status`, { status });\n\n      if (result.success) {\n        HubState.currentCase.status = status;\n        HubUI.updateCaseModalStatus(status);\n        HubUI.showToast(`Status updated to ${status}`, 'success');\n\n        // Refresh cases list\n        this.loadCases(HubState.casesPage);\n      } else {\n        HubUI.showToast(result.error, 'error');\n      }\n    } catch (e) {\n      HubUI.showToast('Failed to update status', 'error');\n    }\n  },\n\n  navigateCase(direction) {\n    const newIndex = direction === 'prev'\n      ? HubState.currentCaseIndex - 1\n      : HubState.currentCaseIndex + 1;\n\n    if (newIndex >= 0 && newIndex < HubState.cases.length) {\n      this.openCase(HubState.cases[newIndex].case_id);\n    }\n  },\n\n  setStatusFilter(status) {\n    HubState.currentStatus = status;\n    this.loadCases(1);\n  },\n\n  openShopifyOrder() {\n    if (HubState.currentCase?.order_url) {\n      window.open(HubState.currentCase.order_url, '_blank');\n    }\n  },\n\n  formatStatus(status) {\n    return status.replace(/_/g, ' ').replace(/\\b\\w/g, c => c.toUpperCase());\n  },\n\n  timeAgo(timestamp) {\n    const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);\n\n    if (seconds < 60) return 'Just now';\n    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;\n    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;\n    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;\n\n    return new Date(timestamp).toLocaleDateString();\n  },\n\n  escapeHtml(text) {\n    if (!text) return '';\n    const div = document.createElement('div');\n    div.textContent = text;\n    return div.innerHTML;\n  }\n};\n\n// ============================================\n// NAVIGATION\n// ============================================\nconst HubNavigation = {\n  goto(page, filter = null) {\n    HubState.currentPage = page;\n\n    // Update nav items\n    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));\n    const selector = filter\n      ? `.nav-item[data-page=\"${page}\"][data-filter=\"${filter}\"]`\n      : `.nav-item[data-page=\"${page}\"]`;\n    document.querySelector(selector)?.classList.add('active');\n\n    // Update page title\n    const titles = {\n      dashboard: 'Dashboard',\n      cases: 'Cases',\n      sessions: 'Sessions',\n      events: 'Event Log',\n      analytics: 'Performance'\n    };\n    document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';\n\n    // Show/hide views\n    ['dashboard', 'cases', 'sessions', 'events', 'analytics'].forEach(v => {\n      const el = document.getElementById(v + 'View');\n      if (el) el.style.display = v === page ? 'block' : 'none';\n    });\n\n    // Load data\n    if (page === 'cases') {\n      HubState.currentFilter = filter || 'all';\n      HubCases.loadCases();\n    } else if (page === 'dashboard') {\n      HubDashboard.load();\n    }\n  }\n};\n\n// ============================================\n// DASHBOARD\n// ============================================\nconst HubDashboard = {\n  async load() {\n    try {\n      const result = await HubAPI.get('/hub/api/stats');\n\n      document.getElementById('statPending').textContent = result.pending || 0;\n      document.getElementById('statInProgress').textContent = result.inProgress || 0;\n      document.getElementById('statCompletedToday').textContent = result.completedToday || 0;\n      document.getElementById('statAvgTime').textContent = result.avgTime || '-';\n\n      // Update sidebar counts\n      ['all', 'shipping', 'refund', 'subscription', 'manual'].forEach(type => {\n        const el = document.getElementById((type === 'all' ? 'allCases' : type) + 'Count');\n        if (el) el.textContent = result[type] || 0;\n      });\n    } catch (e) {\n      console.error('Failed to load dashboard:', e);\n    }\n  }\n};\n\n// ============================================\n// UI UTILITIES\n// ============================================\nconst HubUI = {\n  init() {\n    // Setup event listeners\n    document.querySelectorAll('.nav-item').forEach(item => {\n      item.addEventListener('click', () => {\n        HubNavigation.goto(item.dataset.page, item.dataset.filter);\n      });\n    });\n\n    // Search\n    const searchInput = document.getElementById('searchInput');\n    if (searchInput) {\n      let searchTimeout;\n      searchInput.addEventListener('input', (e) => {\n        clearTimeout(searchTimeout);\n        searchTimeout = setTimeout(() => {\n          HubState.currentSearch = e.target.value;\n          if (HubState.currentPage === 'cases') {\n            HubCases.loadCases(1);\n          }\n        }, 300);\n      });\n    }\n\n    // Modal close on overlay click\n    document.getElementById('caseModal')?.addEventListener('click', (e) => {\n      if (e.target.id === 'caseModal') this.closeModal();\n    });\n  },\n\n  showLoginScreen() {\n    const loginScreen = document.getElementById('loginScreen');\n    const appContainer = document.getElementById('appContainer');\n    if (loginScreen) loginScreen.style.display = 'flex';\n    if (appContainer) appContainer.style.display = 'none';\n  },\n\n  showApp() {\n    const loginScreen = document.getElementById('loginScreen');\n    const appContainer = document.getElementById('appContainer');\n    if (loginScreen) loginScreen.style.display = 'none';\n    if (appContainer) appContainer.style.display = 'flex';\n\n    // Update user info in sidebar\n    const userName = HubState.currentUser?.name || 'User';\n    const userRole = HubState.currentUser?.role || 'user';\n\n    const userNameEl = document.querySelector('.user-name');\n    const userRoleEl = document.querySelector('.user-role');\n    const userAvatarEl = document.querySelector('.user-avatar');\n\n    if (userNameEl) userNameEl.textContent = userName;\n    if (userRoleEl) userRoleEl.textContent = userRole === 'admin' ? 'Administrator' : 'Team Member';\n    if (userAvatarEl) userAvatarEl.textContent = userName.charAt(0).toUpperCase();\n\n    // Show/hide admin nav items\n    document.querySelectorAll('.admin-only').forEach(el => {\n      el.style.display = HubAuth.isAdmin() ? 'block' : 'none';\n    });\n  },\n\n  showCaseModal(caseData) {\n    // Implementation would render the full case modal\n    // This is a simplified version\n    const modal = document.getElementById('caseModal');\n    if (modal) {\n      modal.classList.add('active');\n      // Populate modal with case data...\n    }\n  },\n\n  closeModal() {\n    document.querySelectorAll('.modal-overlay.active').forEach(m => {\n      m.classList.remove('active');\n    });\n    HubState.currentCase = null;\n  },\n\n  updateCaseModalStatus(status) {\n    document.querySelectorAll('.status-card').forEach(card => {\n      card.classList.remove('active');\n      if (card.classList.contains(status.replace('_', '-'))) {\n        card.classList.add('active');\n      }\n    });\n  },\n\n  showLoading() {\n    HubState.isLoading = true;\n    // Show loading indicator\n  },\n\n  hideLoading() {\n    HubState.isLoading = false;\n    // Hide loading indicator\n  },\n\n  showToast(message, type = 'info') {\n    const toast = document.createElement('div');\n    toast.className = `toast toast-${type}`;\n    toast.textContent = message;\n\n    const container = document.getElementById('toastContainer') || document.body;\n    container.appendChild(toast);\n\n    setTimeout(() => toast.classList.add('show'), 10);\n    setTimeout(() => {\n      toast.classList.remove('show');\n      setTimeout(() => toast.remove(), 300);\n    }, 3000);\n  },\n\n  refresh() {\n    if (HubState.currentPage === 'dashboard') {\n      HubDashboard.load();\n    } else if (HubState.currentPage === 'cases') {\n      HubCases.loadCases(HubState.casesPage);\n    }\n    HubUI.showToast('Refreshed', 'success');\n  },\n\n  copyToClipboard(text) {\n    navigator.clipboard.writeText(text).then(() => {\n      this.showToast('Copied to clipboard', 'success');\n    });\n  }\n};\n\n// ============================================\n// INITIALIZATION\n// ============================================\nconst HubApp = {\n  async init() {\n    // Check authentication\n    if (HubAuth.init()) {\n      HubUI.showApp();\n      HubUI.init();\n      HubKeyboard.init();\n      HubDashboard.load();\n      HubViews.load();\n\n      // Check URL for case deep link\n      this.handleDeepLink();\n    } else {\n      HubUI.showLoginScreen();\n    }\n  },\n\n  handleDeepLink() {\n    const params = new URLSearchParams(window.location.search);\n    const caseId = params.get('case');\n\n    if (caseId) {\n      HubNavigation.goto('cases');\n      setTimeout(() => HubCases.openCase(caseId), 500);\n    }\n  }\n};\n\n// ============================================\n// PHASE 2: SOP LINK MANAGEMENT (Admin)\n// ============================================\nconst HubSOPLinks = {\n  links: [],\n\n  async show() {\n    if (!HubAuth.isAdmin()) {\n      HubUI.showToast('Admin access required', 'error');\n      return;\n    }\n\n    await this.load();\n\n    const caseTypes = [...new Set(this.links.map(l => l.case_type))];\n\n    const html = `\n      <div class=\"modal-overlay active\" id=\"sopManagementModal\">\n        <div class=\"modal\" style=\"max-width: 900px;\">\n          <div class=\"modal-header\" style=\"padding: 20px 24px;\">\n            <div class=\"modal-header-content\">\n              <div class=\"modal-title\" style=\"font-size: 18px;\">SOP Link Management</div>\n              <div style=\"font-size: 13px; color: var(--gray-500); margin-top: 4px;\">\n                Configure Standard Operating Procedure links for each case scenario\n              </div>\n            </div>\n            <button class=\"modal-close\" onclick=\"document.getElementById('sopManagementModal').remove()\">&times;</button>\n          </div>\n          <div class=\"modal-body\" style=\"padding: 0; max-height: 70vh; overflow-y: auto;\">\n            <div style=\"padding: 16px 24px; border-bottom: 1px solid var(--gray-200); display: flex; justify-content: space-between; align-items: center;\">\n              <div style=\"display: flex; gap: 12px;\">\n                <select id=\"sopCaseTypeFilter\" class=\"form-input\" style=\"width: 150px;\" onchange=\"HubSOPLinks.filterByType(this.value)\">\n                  <option value=\"\">All Types</option>\n                  ${['refund', 'return', 'shipping', 'subscription', 'manual'].map(t =>\n                    `<option value=\"${t}\">${t.charAt(0).toUpperCase() + t.slice(1)}</option>`\n                  ).join('')}\n                </select>\n              </div>\n              <button class=\"btn btn-primary\" onclick=\"HubSOPLinks.showCreateForm()\">Add SOP Link</button>\n            </div>\n            <table class=\"sop-table\" style=\"width: 100%;\">\n              <thead>\n                <tr>\n                  <th style=\"padding: 12px 24px;\">Scenario</th>\n                  <th>Case Type</th>\n                  <th>URL</th>\n                  <th>Status</th>\n                  <th style=\"width: 100px;\">Actions</th>\n                </tr>\n              </thead>\n              <tbody id=\"sopLinksTableBody\">\n                ${this.renderRows(this.links)}\n              </tbody>\n            </table>\n          </div>\n        </div>\n      </div>\n    `;\n    document.body.insertAdjacentHTML('beforeend', html);\n  },\n\n  renderRows(links) {\n    if (links.length === 0) {\n      return '<tr><td colspan=\"5\" class=\"empty-state\">No SOP links configured</td></tr>';\n    }\n\n    return links.map(link => `\n      <tr data-case-type=\"${link.case_type}\">\n        <td style=\"padding: 12px 24px;\">\n          <div style=\"font-weight: 500;\">${this.escapeHtml(link.scenario_name)}</div>\n          <div style=\"font-size: 12px; color: var(--gray-500);\">${link.scenario_key}</div>\n        </td>\n        <td><span class=\"type-badge ${link.case_type}\">${link.case_type}</span></td>\n        <td>\n          <a href=\"${link.sop_url}\" target=\"_blank\" style=\"color: var(--primary-600); text-decoration: none; max-width: 250px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;\">\n            ${this.escapeHtml(link.sop_url)}\n          </a>\n        </td>\n        <td>\n          <span class=\"status-badge ${link.is_active ? 'completed' : 'pending'}\">\n            ${link.is_active ? 'Active' : 'Inactive'}\n          </span>\n        </td>\n        <td>\n          <button class=\"btn-icon\" onclick=\"HubSOPLinks.edit(${link.id})\">Edit</button>\n          <button class=\"btn-icon danger\" onclick=\"HubSOPLinks.delete(${link.id})\">Delete</button>\n        </td>\n      </tr>\n    `).join('');\n  },\n\n  async load() {\n    try {\n      const result = await HubAPI.get('/hub/api/admin/sop-links');\n      if (result.success) {\n        this.links = result.links;\n      }\n    } catch (e) {\n      console.error('Failed to load SOP links:', e);\n    }\n  },\n\n  filterByType(caseType) {\n    const rows = document.querySelectorAll('#sopLinksTableBody tr[data-case-type]');\n    rows.forEach(row => {\n      if (!caseType || row.dataset.caseType === caseType) {\n        row.style.display = '';\n      } else {\n        row.style.display = 'none';\n      }\n    });\n  },\n\n  showCreateForm() {\n    const html = `\n      <div class=\"modal-overlay active\" id=\"sopFormModal\" style=\"z-index: 210;\">\n        <div class=\"modal\" style=\"max-width: 500px;\">\n          <div class=\"modal-header\" style=\"padding: 20px 24px;\">\n            <div class=\"modal-header-content\">\n              <div class=\"modal-title\">Add SOP Link</div>\n            </div>\n            <button class=\"modal-close\" onclick=\"document.getElementById('sopFormModal').remove()\">&times;</button>\n          </div>\n          <div class=\"modal-body\" style=\"padding: 24px;\">\n            <div class=\"form-group\">\n              <label>Scenario Key</label>\n              <input type=\"text\" id=\"sopScenarioKey\" class=\"form-input\" placeholder=\"e.g., refund_partial, shipping_lost\">\n              <div style=\"font-size: 12px; color: var(--gray-500); margin-top: 4px;\">Unique identifier (lowercase, underscores)</div>\n            </div>\n            <div class=\"form-group\">\n              <label>Scenario Name</label>\n              <input type=\"text\" id=\"sopScenarioName\" class=\"form-input\" placeholder=\"e.g., Partial Refund\">\n            </div>\n            <div class=\"form-group\">\n              <label>Case Type</label>\n              <select id=\"sopCaseType\" class=\"form-input\">\n                <option value=\"refund\">Refund</option>\n                <option value=\"return\">Return</option>\n                <option value=\"shipping\">Shipping</option>\n                <option value=\"subscription\">Subscription</option>\n                <option value=\"manual\">Manual</option>\n              </select>\n            </div>\n            <div class=\"form-group\">\n              <label>SOP URL</label>\n              <input type=\"url\" id=\"sopUrl\" class=\"form-input\" placeholder=\"https://docs.example.com/sop/...\">\n            </div>\n            <div class=\"form-group\">\n              <label>Description (optional)</label>\n              <textarea id=\"sopDescription\" class=\"form-input\" rows=\"2\" placeholder=\"Brief description of this SOP\"></textarea>\n            </div>\n            <div id=\"sopFormError\" class=\"error-message\" style=\"display: none;\"></div>\n            <div style=\"display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;\">\n              <button class=\"btn btn-secondary\" onclick=\"document.getElementById('sopFormModal').remove()\">Cancel</button>\n              <button class=\"btn btn-primary\" onclick=\"HubSOPLinks.create()\">Create</button>\n            </div>\n          </div>\n        </div>\n      </div>\n    `;\n    document.body.insertAdjacentHTML('beforeend', html);\n  },\n\n  async create() {\n    const scenarioKey = document.getElementById('sopScenarioKey').value.trim();\n    const scenarioName = document.getElementById('sopScenarioName').value.trim();\n    const caseType = document.getElementById('sopCaseType').value;\n    const sopUrl = document.getElementById('sopUrl').value.trim();\n    const description = document.getElementById('sopDescription').value.trim();\n    const errorEl = document.getElementById('sopFormError');\n\n    if (!scenarioKey || !scenarioName || !sopUrl) {\n      errorEl.textContent = 'Please fill in all required fields';\n      errorEl.style.display = 'block';\n      return;\n    }\n\n    try {\n      const result = await HubAPI.post('/hub/api/admin/sop-links', {\n        scenarioKey,\n        scenarioName,\n        caseType,\n        sopUrl,\n        description\n      });\n\n      if (result.success) {\n        document.getElementById('sopFormModal').remove();\n        HubUI.showToast('SOP link created', 'success');\n        // Refresh the list\n        document.getElementById('sopManagementModal').remove();\n        this.show();\n      } else {\n        errorEl.textContent = result.error;\n        errorEl.style.display = 'block';\n      }\n    } catch (e) {\n      errorEl.textContent = 'Failed to create SOP link';\n      errorEl.style.display = 'block';\n    }\n  },\n\n  edit(id) {\n    const link = this.links.find(l => l.id === id);\n    if (!link) return;\n\n    const html = `\n      <div class=\"modal-overlay active\" id=\"sopFormModal\" style=\"z-index: 210;\">\n        <div class=\"modal\" style=\"max-width: 500px;\">\n          <div class=\"modal-header\" style=\"padding: 20px 24px;\">\n            <div class=\"modal-header-content\">\n              <div class=\"modal-title\">Edit SOP Link</div>\n            </div>\n            <button class=\"modal-close\" onclick=\"document.getElementById('sopFormModal').remove()\">&times;</button>\n          </div>\n          <div class=\"modal-body\" style=\"padding: 24px;\">\n            <div class=\"form-group\">\n              <label>Scenario Key</label>\n              <input type=\"text\" class=\"form-input\" value=\"${this.escapeHtml(link.scenario_key)}\" disabled style=\"background: var(--gray-100);\">\n            </div>\n            <div class=\"form-group\">\n              <label>Scenario Name</label>\n              <input type=\"text\" id=\"sopScenarioName\" class=\"form-input\" value=\"${this.escapeHtml(link.scenario_name)}\">\n            </div>\n            <div class=\"form-group\">\n              <label>SOP URL</label>\n              <input type=\"url\" id=\"sopUrl\" class=\"form-input\" value=\"${this.escapeHtml(link.sop_url)}\">\n            </div>\n            <div class=\"form-group\">\n              <label>Description</label>\n              <textarea id=\"sopDescription\" class=\"form-input\" rows=\"2\">${this.escapeHtml(link.description || '')}</textarea>\n            </div>\n            <div class=\"form-group\">\n              <label style=\"display: flex; align-items: center; gap: 8px;\">\n                <input type=\"checkbox\" id=\"sopIsActive\" ${link.is_active ? 'checked' : ''}>\n                Active\n              </label>\n            </div>\n            <div id=\"sopFormError\" class=\"error-message\" style=\"display: none;\"></div>\n            <div style=\"display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;\">\n              <button class=\"btn btn-secondary\" onclick=\"document.getElementById('sopFormModal').remove()\">Cancel</button>\n              <button class=\"btn btn-primary\" onclick=\"HubSOPLinks.update(${id})\">Save</button>\n            </div>\n          </div>\n        </div>\n      </div>\n    `;\n    document.body.insertAdjacentHTML('beforeend', html);\n  },\n\n  async update(id) {\n    const scenarioName = document.getElementById('sopScenarioName').value.trim();\n    const sopUrl = document.getElementById('sopUrl').value.trim();\n    const description = document.getElementById('sopDescription').value.trim();\n    const isActive = document.getElementById('sopIsActive').checked;\n    const errorEl = document.getElementById('sopFormError');\n\n    try {\n      const result = await HubAPI.put(`/hub/api/admin/sop-links/${id}`, {\n        scenarioName,\n        sopUrl,\n        description,\n        isActive\n      });\n\n      if (result.success) {\n        document.getElementById('sopFormModal').remove();\n        HubUI.showToast('SOP link updated', 'success');\n        document.getElementById('sopManagementModal').remove();\n        this.show();\n      } else {\n        errorEl.textContent = result.error;\n        errorEl.style.display = 'block';\n      }\n    } catch (e) {\n      errorEl.textContent = 'Failed to update SOP link';\n      errorEl.style.display = 'block';\n    }\n  },\n\n  async delete(id) {\n    if (!confirm('Are you sure you want to delete this SOP link?')) return;\n\n    try {\n      const result = await HubAPI.delete(`/hub/api/admin/sop-links/${id}`);\n      if (result.success) {\n        HubUI.showToast('SOP link deleted', 'success');\n        document.getElementById('sopManagementModal').remove();\n        this.show();\n      } else {\n        HubUI.showToast(result.error, 'error');\n      }\n    } catch (e) {\n      HubUI.showToast('Failed to delete SOP link', 'error');\n    }\n  },\n\n  escapeHtml(text) {\n    if (!text) return '';\n    const div = document.createElement('div');\n    div.textContent = text;\n    return div.innerHTML;\n  }\n};\n\n// ============================================\n// PHASE 2: ENHANCED AUDIT LOG (Admin)\n// ============================================\nconst HubEnhancedAuditLog = {\n  currentPage: 1,\n  filters: {},\n  availableFilters: { categories: [], actionTypes: [] },\n\n  async show() {\n    if (!HubAuth.isAdmin()) {\n      HubUI.showToast('Admin access required', 'error');\n      return;\n    }\n\n    const result = await this.load(1);\n\n    const html = `\n      <div class=\"modal-overlay active\" id=\"enhancedAuditModal\">\n        <div class=\"modal\" style=\"max-width: 1000px;\">\n          <div class=\"modal-header\" style=\"padding: 20px 24px;\">\n            <div class=\"modal-header-content\">\n              <div class=\"modal-title\" style=\"font-size: 18px;\">Audit Log</div>\n              <div style=\"font-size: 13px; color: var(--gray-500); margin-top: 4px;\">\n                Complete activity history for compliance and security\n              </div>\n            </div>\n            <button class=\"modal-close\" onclick=\"document.getElementById('enhancedAuditModal').remove()\">&times;</button>\n          </div>\n          <div class=\"modal-body\" style=\"padding: 0;\">\n            <!-- Filters -->\n            <div style=\"padding: 16px 24px; border-bottom: 1px solid var(--gray-200); display: flex; gap: 12px; flex-wrap: wrap; align-items: center;\">\n              <select id=\"auditCategoryFilter\" class=\"form-input\" style=\"width: 140px;\" onchange=\"HubEnhancedAuditLog.applyFilters()\">\n                <option value=\"\">All Categories</option>\n                ${this.availableFilters.categories.map(c =>\n                  `<option value=\"${c}\">${c}</option>`\n                ).join('')}\n              </select>\n              <select id=\"auditActionFilter\" class=\"form-input\" style=\"width: 180px;\" onchange=\"HubEnhancedAuditLog.applyFilters()\">\n                <option value=\"\">All Actions</option>\n                ${this.availableFilters.actionTypes.map(a =>\n                  `<option value=\"${a}\">${a.replace(/_/g, ' ')}</option>`\n                ).join('')}\n              </select>\n              <input type=\"date\" id=\"auditStartDate\" class=\"form-input\" style=\"width: 140px;\" onchange=\"HubEnhancedAuditLog.applyFilters()\">\n              <input type=\"date\" id=\"auditEndDate\" class=\"form-input\" style=\"width: 140px;\" onchange=\"HubEnhancedAuditLog.applyFilters()\">\n              <input type=\"text\" id=\"auditSearch\" class=\"form-input\" style=\"width: 180px;\" placeholder=\"Search...\" onkeyup=\"HubEnhancedAuditLog.debounceSearch(this.value)\">\n              <div style=\"margin-left: auto;\">\n                <button class=\"btn btn-secondary\" onclick=\"HubEnhancedAuditLog.export()\">Export CSV</button>\n              </div>\n            </div>\n            <!-- Table -->\n            <div style=\"max-height: 50vh; overflow-y: auto;\">\n              <table class=\"audit-table\">\n                <thead>\n                  <tr>\n                    <th style=\"padding: 12px 24px; position: sticky; top: 0; background: var(--gray-50);\">Time</th>\n                    <th style=\"position: sticky; top: 0; background: var(--gray-50);\">User</th>\n                    <th style=\"position: sticky; top: 0; background: var(--gray-50);\">Action</th>\n                    <th style=\"position: sticky; top: 0; background: var(--gray-50);\">Resource</th>\n                    <th style=\"position: sticky; top: 0; background: var(--gray-50);\">Details</th>\n                  </tr>\n                </thead>\n                <tbody id=\"auditLogTableBody\">\n                  ${this.renderRows(result.logs)}\n                </tbody>\n              </table>\n            </div>\n            <!-- Pagination -->\n            <div id=\"auditPagination\" style=\"padding: 16px 24px; border-top: 1px solid var(--gray-200); display: flex; justify-content: center; align-items: center; gap: 16px;\">\n              ${this.renderPagination(result.pagination)}\n            </div>\n          </div>\n        </div>\n      </div>\n    `;\n    document.body.insertAdjacentHTML('beforeend', html);\n  },\n\n  renderRows(logs) {\n    if (!logs || logs.length === 0) {\n      return '<tr><td colspan=\"5\" class=\"empty-state\">No audit entries found</td></tr>';\n    }\n\n    return logs.map(log => `\n      <tr>\n        <td style=\"padding: 10px 24px; white-space: nowrap;\">${this.formatTime(log.created_at)}</td>\n        <td>\n          <div style=\"font-weight: 500;\">${log.user_name || 'System'}</div>\n          <div style=\"font-size: 12px; color: var(--gray-500);\">${log.user_email || ''}</div>\n        </td>\n        <td>\n          <span class=\"action-badge ${log.action_category}\">${log.action_type.replace(/_/g, ' ')}</span>\n        </td>\n        <td>\n          ${log.resource_type ? `<span style=\"font-size: 12px; color: var(--gray-600);\">${log.resource_type}</span>` : '-'}\n          ${log.resource_id ? `<br><span style=\"font-size: 11px; font-family: monospace; color: var(--gray-500);\">${log.resource_id}</span>` : ''}\n        </td>\n        <td style=\"max-width: 200px;\">\n          ${log.old_value || log.new_value ? `\n            <button class=\"btn-icon\" onclick=\"HubEnhancedAuditLog.showDetails(${JSON.stringify(log).replace(/\"/g, '&quot;')})\">\n              View\n            </button>\n          ` : '-'}\n        </td>\n      </tr>\n    `).join('');\n  },\n\n  renderPagination(pagination) {\n    if (!pagination) return '';\n\n    let html = '';\n    if (pagination.page > 1) {\n      html += `<button class=\"btn btn-secondary\" onclick=\"HubEnhancedAuditLog.goToPage(${pagination.page - 1})\">Previous</button>`;\n    }\n    html += `<span>Page ${pagination.page} of ${pagination.totalPages} (${pagination.total} entries)</span>`;\n    if (pagination.page < pagination.totalPages) {\n      html += `<button class=\"btn btn-secondary\" onclick=\"HubEnhancedAuditLog.goToPage(${pagination.page + 1})\">Next</button>`;\n    }\n    return html;\n  },\n\n  async load(page = 1) {\n    try {\n      let url = `/hub/api/admin/audit-log?page=${page}&limit=50`;\n\n      if (this.filters.category) url += `&category=${this.filters.category}`;\n      if (this.filters.actionType) url += `&actionType=${this.filters.actionType}`;\n      if (this.filters.startDate) url += `&startDate=${this.filters.startDate}`;\n      if (this.filters.endDate) url += `&endDate=${this.filters.endDate}`;\n      if (this.filters.search) url += `&search=${encodeURIComponent(this.filters.search)}`;\n\n      const result = await HubAPI.get(url);\n\n      if (result.success) {\n        this.currentPage = page;\n        this.availableFilters = result.filters;\n        return result;\n      }\n      return { logs: [], pagination: { page: 1, total: 0, totalPages: 1 } };\n    } catch (e) {\n      console.error('Failed to load audit log:', e);\n      return { logs: [], pagination: { page: 1, total: 0, totalPages: 1 } };\n    }\n  },\n\n  async applyFilters() {\n    this.filters = {\n      category: document.getElementById('auditCategoryFilter').value,\n      actionType: document.getElementById('auditActionFilter').value,\n      startDate: document.getElementById('auditStartDate').value,\n      endDate: document.getElementById('auditEndDate').value,\n      search: document.getElementById('auditSearch').value\n    };\n\n    const result = await this.load(1);\n    document.getElementById('auditLogTableBody').innerHTML = this.renderRows(result.logs);\n    document.getElementById('auditPagination').innerHTML = this.renderPagination(result.pagination);\n  },\n\n  debounceSearch: (function() {\n    let timeout;\n    return function(value) {\n      clearTimeout(timeout);\n      timeout = setTimeout(() => {\n        HubEnhancedAuditLog.filters.search = value;\n        HubEnhancedAuditLog.applyFilters();\n      }, 300);\n    };\n  })(),\n\n  async goToPage(page) {\n    const result = await this.load(page);\n    document.getElementById('auditLogTableBody').innerHTML = this.renderRows(result.logs);\n    document.getElementById('auditPagination').innerHTML = this.renderPagination(result.pagination);\n  },\n\n  showDetails(log) {\n    const html = `\n      <div class=\"modal-overlay active\" id=\"auditDetailModal\" style=\"z-index: 210;\">\n        <div class=\"modal\" style=\"max-width: 600px;\">\n          <div class=\"modal-header\" style=\"padding: 20px 24px;\">\n            <div class=\"modal-title\">Audit Details</div>\n            <button class=\"modal-close\" onclick=\"document.getElementById('auditDetailModal').remove()\">&times;</button>\n          </div>\n          <div class=\"modal-body\" style=\"padding: 24px;\">\n            <div style=\"display: grid; gap: 16px;\">\n              <div>\n                <div style=\"font-size: 12px; color: var(--gray-500); margin-bottom: 4px;\">Action</div>\n                <div style=\"font-weight: 500;\">${log.action_type.replace(/_/g, ' ')}</div>\n              </div>\n              <div>\n                <div style=\"font-size: 12px; color: var(--gray-500); margin-bottom: 4px;\">User</div>\n                <div>${log.user_name || 'System'} ${log.user_email ? `(${log.user_email})` : ''}</div>\n              </div>\n              <div>\n                <div style=\"font-size: 12px; color: var(--gray-500); margin-bottom: 4px;\">Time</div>\n                <div>${new Date(log.created_at).toLocaleString()}</div>\n              </div>\n              ${log.old_value ? `\n                <div>\n                  <div style=\"font-size: 12px; color: var(--gray-500); margin-bottom: 4px;\">Previous Value</div>\n                  <pre style=\"background: var(--gray-50); padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 12px;\">${this.formatJSON(log.old_value)}</pre>\n                </div>\n              ` : ''}\n              ${log.new_value ? `\n                <div>\n                  <div style=\"font-size: 12px; color: var(--gray-500); margin-bottom: 4px;\">New Value</div>\n                  <pre style=\"background: var(--gray-50); padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 12px;\">${this.formatJSON(log.new_value)}</pre>\n                </div>\n              ` : ''}\n              ${log.ip_address ? `\n                <div>\n                  <div style=\"font-size: 12px; color: var(--gray-500); margin-bottom: 4px;\">IP Address</div>\n                  <div style=\"font-family: monospace;\">${log.ip_address}</div>\n                </div>\n              ` : ''}\n            </div>\n          </div>\n        </div>\n      </div>\n    `;\n    document.body.insertAdjacentHTML('beforeend', html);\n  },\n\n  formatJSON(str) {\n    try {\n      return JSON.stringify(JSON.parse(str), null, 2);\n    } catch {\n      return str;\n    }\n  },\n\n  async export() {\n    try {\n      const startDate = document.getElementById('auditStartDate').value ||\n        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];\n      const endDate = document.getElementById('auditEndDate').value ||\n        new Date().toISOString().split('T')[0];\n\n      const response = await HubAPI.request(`/hub/api/admin/audit-log/export?startDate=${startDate}&endDate=${endDate}`);\n      const blob = await response.blob();\n      const url = URL.createObjectURL(blob);\n      const a = document.createElement('a');\n      a.href = url;\n      a.download = `audit-log-${startDate}-to-${endDate}.csv`;\n      a.click();\n      URL.revokeObjectURL(url);\n\n      HubUI.showToast('Audit log exported', 'success');\n    } catch (e) {\n      HubUI.showToast('Failed to export audit log', 'error');\n    }\n  },\n\n  formatTime(timestamp) {\n    const date = new Date(timestamp);\n    const now = new Date();\n    const diffMs = now - date;\n    const diffMins = Math.floor(diffMs / 60000);\n    const diffHours = Math.floor(diffMs / 3600000);\n\n    if (diffMins < 1) return 'Just now';\n    if (diffMins < 60) return `${diffMins}m ago`;\n    if (diffHours < 24) return `${diffHours}h ago`;\n\n    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });\n  }\n};\n\n// ============================================\n// PHASE 2: RESOLUTION VALIDATION\n// ============================================\nconst HubValidation = {\n  async validateBeforeComplete(caseData) {\n    try {\n      const result = await HubAPI.post('/hub/api/validate-resolution', {\n        caseId: caseData.case_id,\n        caseType: caseData.case_type,\n        resolution: caseData.resolution,\n        refundAmount: caseData.refund_amount,\n        orderTotal: caseData.order_total\n      });\n\n      if (!result.valid) {\n        this.showValidationModal(result);\n        return false;\n      }\n\n      if (result.warnings && result.warnings.length > 0) {\n        return await this.showWarningsModal(result.warnings);\n      }\n\n      return true;\n    } catch (e) {\n      console.error('Validation error:', e);\n      // Allow to proceed if validation fails\n      return true;\n    }\n  },\n\n  showValidationModal(result) {\n    const html = `\n      <div class=\"modal-overlay active\" id=\"validationModal\">\n        <div class=\"modal\" style=\"max-width: 500px;\">\n          <div class=\"modal-header\" style=\"padding: 20px 24px; background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white;\">\n            <div class=\"modal-header-content\">\n              <div class=\"modal-title\" style=\"font-size: 18px; color: white;\">Cannot Complete Case</div>\n            </div>\n            <button class=\"modal-close\" style=\"color: white;\" onclick=\"document.getElementById('validationModal').remove()\">&times;</button>\n          </div>\n          <div class=\"modal-body\" style=\"padding: 24px;\">\n            <p style=\"margin-bottom: 16px;\">Please resolve the following issues before completing this case:</p>\n            <ul style=\"margin: 0; padding-left: 20px;\">\n              ${result.errors.map(e => `<li style=\"margin-bottom: 8px; color: var(--error-600);\">${e}</li>`).join('')}\n            </ul>\n            ${result.warnings && result.warnings.length > 0 ? `\n              <div style=\"margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--gray-200);\">\n                <p style=\"font-weight: 500; margin-bottom: 8px;\">Warnings:</p>\n                <ul style=\"margin: 0; padding-left: 20px;\">\n                  ${result.warnings.map(w => `<li style=\"margin-bottom: 8px; color: var(--warning-600);\">${w}</li>`).join('')}\n                </ul>\n              </div>\n            ` : ''}\n            <button class=\"btn btn-primary\" style=\"width: 100%; margin-top: 24px;\" onclick=\"document.getElementById('validationModal').remove()\">\n              Understood\n            </button>\n          </div>\n        </div>\n      </div>\n    `;\n    document.body.insertAdjacentHTML('beforeend', html);\n  },\n\n  showWarningsModal(warnings) {\n    return new Promise((resolve) => {\n      const html = `\n        <div class=\"modal-overlay active\" id=\"warningsModal\">\n          <div class=\"modal\" style=\"max-width: 500px;\">\n            <div class=\"modal-header\" style=\"padding: 20px 24px; background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); color: white;\">\n              <div class=\"modal-header-content\">\n                <div class=\"modal-title\" style=\"font-size: 18px; color: white;\">Review Warnings</div>\n              </div>\n              <button class=\"modal-close\" style=\"color: white;\" onclick=\"HubValidation.resolveWarnings(false)\">&times;</button>\n            </div>\n            <div class=\"modal-body\" style=\"padding: 24px;\">\n              <p style=\"margin-bottom: 16px;\">Please review these warnings before proceeding:</p>\n              <ul style=\"margin: 0; padding-left: 20px;\">\n                ${warnings.map(w => `<li style=\"margin-bottom: 8px; color: var(--warning-700);\">${w}</li>`).join('')}\n              </ul>\n              <div style=\"display: flex; gap: 12px; margin-top: 24px;\">\n                <button class=\"btn btn-secondary\" style=\"flex: 1;\" onclick=\"HubValidation.resolveWarnings(false)\">\n                  Cancel\n                </button>\n                <button class=\"btn btn-primary\" style=\"flex: 1;\" onclick=\"HubValidation.resolveWarnings(true)\">\n                  Proceed Anyway\n                </button>\n              </div>\n            </div>\n          </div>\n        </div>\n      `;\n      document.body.insertAdjacentHTML('beforeend', html);\n\n      this._warningsResolve = resolve;\n    });\n  },\n\n  resolveWarnings(proceed) {\n    document.getElementById('warningsModal')?.remove();\n    if (this._warningsResolve) {\n      this._warningsResolve(proceed);\n      this._warningsResolve = null;\n    }\n  }\n};\n\n// Auto-initialize when DOM is ready\nif (document.readyState === 'loading') {\n  document.addEventListener('DOMContentLoaded', () => HubApp.init());\n} else {\n  HubApp.init();\n}\n\n// Export for global access\nwindow.HubApp = HubApp;\nwindow.HubAuth = HubAuth;\nwindow.HubCases = HubCases;\nwindow.HubBulkActions = HubBulkActions;\nwindow.HubViews = HubViews;\nwindow.HubChecklist = HubChecklist;\nwindow.HubUsers = HubUsers;\nwindow.HubAssignment = HubAssignment;\nwindow.HubUI = HubUI;\nwindow.HubNavigation = HubNavigation;\nwindow.HubKeyboard = HubKeyboard;\n// Phase 2 exports\nwindow.HubSOPLinks = HubSOPLinks;\nwindow.HubEnhancedAuditLog = HubEnhancedAuditLog;\nwindow.HubValidation = HubValidation;\n";
}

