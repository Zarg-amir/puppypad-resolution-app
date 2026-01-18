/**
 * Flow Documentation - React Components
 * Replicates resolution-center flow editor design for read-only documentation
 * Uses React 18 + React Flow via CDN
 */

// Wait for React to be available (no React Flow dependency - using custom SVG)
(function initFlowDocs() {
  if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
    setTimeout(initFlowDocs, 100);
    return;
  }

  const { useState, useCallback, useEffect, useMemo, useRef } = React;

  // ============================================
  // FLOW DATA - All flows with nodes and edges
  // ============================================
  const FLOW_DATA = {
    // Parent flow definitions
    parentFlows: [
      {
        id: 'help_with_order',
        name: 'Help With My Order',
        description: 'Customer needs assistance with an existing order',
        icon: 'help-circle',
        color: '#8b5cf6',
        subflows: ['changed_mind', 'dog_not_using', 'quality_issue', 'other_reason']
      },
      {
        id: 'track_order',
        name: 'Track My Order',
        description: 'Customer wants to check order status or tracking',
        icon: 'truck',
        color: '#3b82f6',
        subflows: ['tracking_status']
      },
      {
        id: 'manage_subscription',
        name: 'Manage My Subscription',
        description: 'Customer wants to modify or cancel subscription',
        icon: 'refresh-cw',
        color: '#10b981',
        subflows: ['pause_subscription', 'cancel_subscription', 'change_frequency']
      }
    ],

    // Subflow definitions with nodes and edges
    subflows: {
      // ============================================
      // TRACK MY ORDER SUBFLOWS
      // ============================================
      tracking_status: {
        id: 'tracking_status',
        parentId: 'track_order',
        name: 'Check Tracking Status',
        description: 'Customer wants to know where their order is',
        nodes: [
          { id: 'n1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Start', triggers: ['track_order'] } },
          { id: 'n2', type: 'message', position: { x: 250, y: 100 }, data: { persona: 'amy', content: "Hi! I'm Amy, your PuppyPad support assistant. 🐕 Let me help you track your order!" } },
          { id: 'n3', type: 'form', position: { x: 250, y: 220 }, data: { formType: 'identify', title: 'Find Your Order', fields: ['email', 'order_number'] } },
          { id: 'n4', type: 'api', position: { x: 250, y: 340 }, data: { service: 'Shopify', endpoint: 'lookupOrder', description: 'Fetch order details from Shopify API' } },
          { id: 'n5', type: 'api', position: { x: 250, y: 460 }, data: { service: 'ParcelPanel', endpoint: 'getTracking', description: 'Get real-time tracking from ParcelPanel' } },
          { id: 'n6', type: 'message', position: { x: 250, y: 580 }, data: { persona: 'amy', content: "Great news! I found your order. Here's the latest tracking info:" } },
          { id: 'n7', type: 'end', position: { x: 250, y: 700 }, data: { title: 'Tracking Displayed', showSurvey: true } }
        ],
        edges: [
          { id: 'e1-2', source: 'n1', target: 'n2', type: 'smoothstep' },
          { id: 'e2-3', source: 'n2', target: 'n3', type: 'smoothstep' },
          { id: 'e3-4', source: 'n3', target: 'n4', type: 'smoothstep' },
          { id: 'e4-5', source: 'n4', target: 'n5', type: 'smoothstep' },
          { id: 'e5-6', source: 'n5', target: 'n6', type: 'smoothstep' },
          { id: 'e6-7', source: 'n6', target: 'n7', type: 'smoothstep' }
        ]
      },

      // ============================================
      // HELP WITH ORDER SUBFLOWS
      // ============================================
      changed_mind: {
        id: 'changed_mind',
        parentId: 'help_with_order',
        name: 'Changed My Mind',
        description: 'Customer wants a refund because they changed their mind',
        nodes: [
          { id: 'n1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Changed Mind Flow', triggers: ['refund', 'changed_mind'] } },
          { id: 'n2', type: 'message', position: { x: 250, y: 100 }, data: { persona: 'amy', content: "I understand, and I appreciate you being upfront about it. Let me see what options we have for you!" } },
          { id: 'n3', type: 'api', position: { x: 250, y: 220 }, data: { service: 'Shopify', endpoint: 'lookupOrder', description: 'Verify order and delivery date' } },
          { id: 'n4', type: 'condition', position: { x: 250, y: 340 }, data: { variable: 'order.daysSinceDelivery', operator: '<', value: 90, description: 'Check 90-day guarantee eligibility' } },
          { id: 'n5', type: 'offer', position: { x: 100, y: 470 }, data: { percent: 20, label: 'Keep product + 20% refund', description: 'First discount offer' } },
          { id: 'n6', type: 'offer', position: { x: 100, y: 600 }, data: { percent: 30, label: 'Keep product + 30% refund', description: 'Second discount offer' } },
          { id: 'n7', type: 'offer', position: { x: 100, y: 730 }, data: { percent: 40, label: 'Keep product + 40% refund', description: 'Final discount offer' } },
          { id: 'n8', type: 'case', position: { x: 100, y: 860 }, data: { type: 'refund', priority: 'normal', description: 'Create refund case for team review' } },
          { id: 'n9', type: 'message', position: { x: 400, y: 470 }, data: { persona: 'amy', content: "I'm sorry, but our 90-day guarantee has expired for this order. However, I can still help you." } },
          { id: 'n10', type: 'end', position: { x: 250, y: 990 }, data: { title: 'Case Submitted', showSurvey: true } }
        ],
        edges: [
          { id: 'e1-2', source: 'n1', target: 'n2', type: 'smoothstep' },
          { id: 'e2-3', source: 'n2', target: 'n3', type: 'smoothstep' },
          { id: 'e3-4', source: 'n3', target: 'n4', type: 'smoothstep' },
          { id: 'e4-5', source: 'n4', target: 'n5', type: 'smoothstep', label: 'Within 90 days', sourceHandle: 'yes' },
          { id: 'e4-9', source: 'n4', target: 'n9', type: 'smoothstep', label: 'Expired', sourceHandle: 'no' },
          { id: 'e5-6', source: 'n5', target: 'n6', type: 'smoothstep', label: 'Decline' },
          { id: 'e6-7', source: 'n6', target: 'n7', type: 'smoothstep', label: 'Decline' },
          { id: 'e7-8', source: 'n7', target: 'n8', type: 'smoothstep', label: 'Decline' },
          { id: 'e5-8a', source: 'n5', target: 'n8', type: 'smoothstep', label: 'Accept', style: { stroke: '#22c55e' } },
          { id: 'e6-8a', source: 'n6', target: 'n8', type: 'smoothstep', label: 'Accept', style: { stroke: '#22c55e' } },
          { id: 'e7-8a', source: 'n7', target: 'n8', type: 'smoothstep', label: 'Accept', style: { stroke: '#22c55e' } },
          { id: 'e8-10', source: 'n8', target: 'n10', type: 'smoothstep' },
          { id: 'e9-10', source: 'n9', target: 'n10', type: 'smoothstep' }
        ]
      },

      dog_not_using: {
        id: 'dog_not_using',
        parentId: 'help_with_order',
        name: 'Dog Not Using Product',
        description: 'Customer reports their dog is not using the PuppyPad',
        nodes: [
          { id: 'n1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Dog Not Using Flow', triggers: ['product_issue'] } },
          { id: 'n2', type: 'message', position: { x: 250, y: 100 }, data: { persona: 'amy', content: "I understand — the main reason you purchased this was to solve your problem, and we want to make sure it works for you! 🐕\n\nLet me get some details about your pup so we can help." } },
          { id: 'n3', type: 'form', position: { x: 250, y: 240 }, data: { formType: 'dog_info', title: 'Tell Us About Your Dog', fields: ['dog_name', 'breed', 'age', 'specific_issue'] } },
          { id: 'n4', type: 'message', position: { x: 250, y: 380 }, data: { persona: 'amy', content: "Thanks for sharing! Let me connect you with our dog trainer, Claudia, who specializes in this..." } },
          { id: 'n5', type: 'ai', position: { x: 250, y: 500 }, data: { 
            persona: 'claudia', 
            model: 'gpt-4o', 
            maxTokens: 500,
            prompt: 'Generate personalized training tips for {{dog_name}} ({{breed}}, {{age}}) who is having issues with: {{specific_issue}}. Include 3-5 specific actionable tips.',
            description: 'AI generates personalized training advice based on dog info'
          }},
          { id: 'n6', type: 'options', position: { x: 250, y: 640 }, data: { prompt: "Did Claudia's tips help?", options: ['Yes, thanks!', 'No, I want a refund'] } },
          { id: 'n7', type: 'end', position: { x: 100, y: 780 }, data: { title: 'Resolved with Tips!', showSurvey: true } },
          { id: 'n8', type: 'ladder', position: { x: 400, y: 780 }, data: { steps: [20, 30, 40, 50], description: 'Discount ladder for refund requests' } },
          { id: 'n9', type: 'case', position: { x: 400, y: 920 }, data: { type: 'refund', priority: 'normal', description: 'Create case if all offers declined' } },
          { id: 'n10', type: 'end', position: { x: 400, y: 1040 }, data: { title: 'Case Submitted', showSurvey: true } }
        ],
        edges: [
          { id: 'e1-2', source: 'n1', target: 'n2', type: 'smoothstep' },
          { id: 'e2-3', source: 'n2', target: 'n3', type: 'smoothstep' },
          { id: 'e3-4', source: 'n3', target: 'n4', type: 'smoothstep' },
          { id: 'e4-5', source: 'n4', target: 'n5', type: 'smoothstep' },
          { id: 'e5-6', source: 'n5', target: 'n6', type: 'smoothstep' },
          { id: 'e6-7', source: 'n6', target: 'n7', type: 'smoothstep', label: 'Satisfied' },
          { id: 'e6-8', source: 'n6', target: 'n8', type: 'smoothstep', label: 'Want Refund' },
          { id: 'e8-9', source: 'n8', target: 'n9', type: 'smoothstep' },
          { id: 'e9-10', source: 'n9', target: 'n10', type: 'smoothstep' }
        ]
      },

      quality_issue: {
        id: 'quality_issue',
        parentId: 'help_with_order',
        name: 'Quality / Material Issue',
        description: 'Customer notices quality or material differences',
        nodes: [
          { id: 'n1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Quality Issue Flow' } },
          { id: 'n2', type: 'message', position: { x: 250, y: 100 }, data: { persona: 'amy', content: "I'm sorry to hear that! We take quality seriously. Let me help you with this." } },
          { id: 'n3', type: 'form', position: { x: 250, y: 220 }, data: { formType: 'photo_upload', title: 'Upload Photos', fields: ['photos'], description: 'Request photos of the quality issue' } },
          { id: 'n4', type: 'api', position: { x: 250, y: 340 }, data: { service: 'Cloudflare R2', endpoint: 'uploadPhotos', description: 'Store evidence photos securely' } },
          { id: 'n5', type: 'case', position: { x: 250, y: 460 }, data: { type: 'quality', priority: 'high', description: 'Create high-priority quality case' } },
          { id: 'n6', type: 'end', position: { x: 250, y: 580 }, data: { title: 'Quality Case Created', showSurvey: true } }
        ],
        edges: [
          { id: 'e1-2', source: 'n1', target: 'n2', type: 'smoothstep' },
          { id: 'e2-3', source: 'n2', target: 'n3', type: 'smoothstep' },
          { id: 'e3-4', source: 'n3', target: 'n4', type: 'smoothstep' },
          { id: 'e4-5', source: 'n4', target: 'n5', type: 'smoothstep' },
          { id: 'e5-6', source: 'n5', target: 'n6', type: 'smoothstep' }
        ]
      },

      other_reason: {
        id: 'other_reason',
        parentId: 'help_with_order',
        name: 'Other Reason',
        description: 'Customer has a different issue not covered by other options',
        nodes: [
          { id: 'n1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Other Reason Flow' } },
          { id: 'n2', type: 'message', position: { x: 250, y: 100 }, data: { persona: 'amy', content: "I'd love to help! Please tell me more about your situation." } },
          { id: 'n3', type: 'form', position: { x: 250, y: 220 }, data: { formType: 'text', title: 'Describe Your Issue', fields: ['description'] } },
          { id: 'n4', type: 'case', position: { x: 250, y: 340 }, data: { type: 'manual', priority: 'normal', description: 'Create manual review case' } },
          { id: 'n5', type: 'end', position: { x: 250, y: 460 }, data: { title: 'Case Created', showSurvey: true } }
        ],
        edges: [
          { id: 'e1-2', source: 'n1', target: 'n2', type: 'smoothstep' },
          { id: 'e2-3', source: 'n2', target: 'n3', type: 'smoothstep' },
          { id: 'e3-4', source: 'n3', target: 'n4', type: 'smoothstep' },
          { id: 'e4-5', source: 'n4', target: 'n5', type: 'smoothstep' }
        ]
      },

      // ============================================
      // SUBSCRIPTION SUBFLOWS
      // ============================================
      pause_subscription: {
        id: 'pause_subscription',
        parentId: 'manage_subscription',
        name: 'Pause Subscription',
        description: 'Customer wants to temporarily pause their subscription',
        nodes: [
          { id: 'n1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Pause Subscription Flow' } },
          { id: 'n2', type: 'message', position: { x: 250, y: 100 }, data: { persona: 'amy', content: "I can help you pause your subscription. How long would you like to pause for?" } },
          { id: 'n3', type: 'options', position: { x: 250, y: 220 }, data: { prompt: 'Select pause duration:', options: ['1 month', '2 months', '3 months'] } },
          { id: 'n4', type: 'api', position: { x: 250, y: 340 }, data: { service: 'Checkout Champ', endpoint: 'pauseSubscription', description: 'Pause subscription in billing system' } },
          { id: 'n5', type: 'message', position: { x: 250, y: 460 }, data: { persona: 'amy', content: "Done! Your subscription has been paused. You'll receive a reminder email before it resumes." } },
          { id: 'n6', type: 'end', position: { x: 250, y: 580 }, data: { title: 'Subscription Paused', showSurvey: true } }
        ],
        edges: [
          { id: 'e1-2', source: 'n1', target: 'n2', type: 'smoothstep' },
          { id: 'e2-3', source: 'n2', target: 'n3', type: 'smoothstep' },
          { id: 'e3-4', source: 'n3', target: 'n4', type: 'smoothstep' },
          { id: 'e4-5', source: 'n4', target: 'n5', type: 'smoothstep' },
          { id: 'e5-6', source: 'n5', target: 'n6', type: 'smoothstep' }
        ]
      },

      cancel_subscription: {
        id: 'cancel_subscription',
        parentId: 'manage_subscription',
        name: 'Cancel Subscription',
        description: 'Customer wants to cancel their subscription',
        nodes: [
          { id: 'n1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Cancel Subscription Flow' } },
          { id: 'n2', type: 'message', position: { x: 250, y: 100 }, data: { persona: 'amy', content: "I'm sorry to hear you want to cancel. May I ask why you're looking to cancel?" } },
          { id: 'n3', type: 'options', position: { x: 250, y: 220 }, data: { 
            prompt: 'Select your reason:', 
            options: ['Too expensive', 'Too much product', 'Moving', "They didn't work", 'Other'] 
          }},
          { id: 'n4', type: 'condition', position: { x: 250, y: 360 }, data: { variable: 'cancel_reason', description: 'Route based on cancellation reason' } },
          { id: 'n5', type: 'offer', position: { x: 100, y: 500 }, data: { percent: 20, label: '20% off next 3 months', description: 'Price-sensitive retention offer' } },
          { id: 'n6', type: 'message', position: { x: 400, y: 500 }, data: { persona: 'amy', content: "I understand! Would you like to skip a few shipments instead of cancelling completely?" } },
          { id: 'n7', type: 'api', position: { x: 250, y: 640 }, data: { service: 'Checkout Champ', endpoint: 'cancelSubscription', description: 'Process subscription cancellation' } },
          { id: 'n8', type: 'end', position: { x: 250, y: 760 }, data: { title: 'Subscription Cancelled', showSurvey: true } }
        ],
        edges: [
          { id: 'e1-2', source: 'n1', target: 'n2', type: 'smoothstep' },
          { id: 'e2-3', source: 'n2', target: 'n3', type: 'smoothstep' },
          { id: 'e3-4', source: 'n3', target: 'n4', type: 'smoothstep' },
          { id: 'e4-5', source: 'n4', target: 'n5', type: 'smoothstep', label: 'Too expensive' },
          { id: 'e4-6', source: 'n4', target: 'n6', type: 'smoothstep', label: 'Too much product' },
          { id: 'e5-7', source: 'n5', target: 'n7', type: 'smoothstep', label: 'Decline' },
          { id: 'e6-7', source: 'n6', target: 'n7', type: 'smoothstep' },
          { id: 'e7-8', source: 'n7', target: 'n8', type: 'smoothstep' }
        ]
      },

      change_frequency: {
        id: 'change_frequency',
        parentId: 'manage_subscription',
        name: 'Change Frequency',
        description: 'Customer wants to change delivery frequency',
        nodes: [
          { id: 'n1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Change Frequency Flow' } },
          { id: 'n2', type: 'message', position: { x: 250, y: 100 }, data: { persona: 'amy', content: "I can help you change your delivery frequency. What works best for you?" } },
          { id: 'n3', type: 'options', position: { x: 250, y: 220 }, data: { prompt: 'Select new frequency:', options: ['Every 2 weeks', 'Every month', 'Every 6 weeks', 'Every 2 months'] } },
          { id: 'n4', type: 'api', position: { x: 250, y: 340 }, data: { service: 'Checkout Champ', endpoint: 'updateFrequency', description: 'Update subscription frequency' } },
          { id: 'n5', type: 'message', position: { x: 250, y: 460 }, data: { persona: 'amy', content: "Perfect! Your delivery frequency has been updated. Your next shipment will follow the new schedule." } },
          { id: 'n6', type: 'end', position: { x: 250, y: 580 }, data: { title: 'Frequency Updated', showSurvey: true } }
        ],
        edges: [
          { id: 'e1-2', source: 'n1', target: 'n2', type: 'smoothstep' },
          { id: 'e2-3', source: 'n2', target: 'n3', type: 'smoothstep' },
          { id: 'e3-4', source: 'n3', target: 'n4', type: 'smoothstep' },
          { id: 'e4-5', source: 'n4', target: 'n5', type: 'smoothstep' },
          { id: 'e5-6', source: 'n5', target: 'n6', type: 'smoothstep' }
        ]
      }
    }
  };

  // ============================================
  // ICONS - SVG icon components
  // ============================================
  const Icons = {
    play: () => React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      React.createElement('circle', { cx: 12, cy: 12, r: 10 }),
      React.createElement('polygon', { points: '10,8 16,12 10,16', fill: 'currentColor' })
    ),
    message: () => React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      React.createElement('path', { d: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' })
    ),
    list: () => React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      React.createElement('line', { x1: 8, y1: 6, x2: 21, y2: 6 }),
      React.createElement('line', { x1: 8, y1: 12, x2: 21, y2: 12 }),
      React.createElement('line', { x1: 8, y1: 18, x2: 21, y2: 18 }),
      React.createElement('line', { x1: 3, y1: 6, x2: 3.01, y2: 6 }),
      React.createElement('line', { x1: 3, y1: 12, x2: 3.01, y2: 12 }),
      React.createElement('line', { x1: 3, y1: 18, x2: 3.01, y2: 18 })
    ),
    gitBranch: () => React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      React.createElement('line', { x1: 6, y1: 3, x2: 6, y2: 15 }),
      React.createElement('circle', { cx: 18, cy: 6, r: 3 }),
      React.createElement('circle', { cx: 6, cy: 18, r: 3 }),
      React.createElement('path', { d: 'M18 9a9 9 0 01-9 9' })
    ),
    form: () => React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      React.createElement('rect', { x: 3, y: 3, width: 18, height: 18, rx: 2 }),
      React.createElement('path', { d: 'M9 9h6' }),
      React.createElement('path', { d: 'M9 13h6' }),
      React.createElement('path', { d: 'M9 17h4' })
    ),
    zap: () => React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      React.createElement('polygon', { points: '13,2 3,14 12,14 11,22 21,10 12,10' })
    ),
    bot: () => React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      React.createElement('rect', { x: 3, y: 11, width: 18, height: 10, rx: 2 }),
      React.createElement('circle', { cx: 12, cy: 5, r: 4 })
    ),
    trendingUp: () => React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      React.createElement('polyline', { points: '23,6 13.5,15.5 8.5,10.5 1,18' }),
      React.createElement('polyline', { points: '17,6 23,6 23,12' })
    ),
    tag: () => React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      React.createElement('path', { d: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z' }),
      React.createElement('line', { x1: 7, y1: 7, x2: 7.01, y2: 7 })
    ),
    folder: () => React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      React.createElement('path', { d: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z' })
    ),
    flag: () => React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      React.createElement('path', { d: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z' }),
      React.createElement('line', { x1: 4, y1: 22, x2: 4, y2: 15 })
    ),
    helpCircle: () => React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      React.createElement('circle', { cx: 12, cy: 12, r: 10 }),
      React.createElement('path', { d: 'M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3' }),
      React.createElement('line', { x1: 12, y1: 17, x2: 12.01, y2: 17 })
    ),
    truck: () => React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      React.createElement('rect', { x: 1, y: 3, width: 15, height: 13 }),
      React.createElement('polygon', { points: '16,8 20,8 23,11 23,16 16,16' }),
      React.createElement('circle', { cx: 5.5, cy: 18.5, r: 2.5 }),
      React.createElement('circle', { cx: 18.5, cy: 18.5, r: 2.5 })
    ),
    refreshCw: () => React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      React.createElement('polyline', { points: '23,4 23,10 17,10' }),
      React.createElement('polyline', { points: '1,20 1,14 7,14' }),
      React.createElement('path', { d: 'M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15' })
    ),
    arrowLeft: () => React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      React.createElement('line', { x1: 19, y1: 12, x2: 5, y2: 12 }),
      React.createElement('polyline', { points: '12,19 5,12 12,5' })
    ),
    x: () => React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      React.createElement('line', { x1: 18, y1: 6, x2: 6, y2: 18 }),
      React.createElement('line', { x1: 6, y1: 6, x2: 18, y2: 18 })
    ),
    chevronRight: () => React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
      React.createElement('polyline', { points: '9,18 15,12 9,6' })
    ),
    star: () => React.createElement('svg', { viewBox: '0 0 24 24', fill: 'currentColor', stroke: 'currentColor', strokeWidth: 2 },
      React.createElement('polygon', { points: '12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26' })
    )
  };

  // ============================================
  // CUSTOM NODE COMPONENTS
  // ============================================
  const nodeColors = {
    start: { bg: '#dcfce7', border: '#22c55e', text: '#15803d', icon: '#22c55e' },
    message: { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8', icon: '#3b82f6' },
    options: { bg: '#f3e8ff', border: '#a855f7', text: '#7c3aed', icon: '#a855f7' },
    condition: { bg: '#fef3c7', border: '#f59e0b', text: '#b45309', icon: '#f59e0b' },
    form: { bg: '#d1fae5', border: '#10b981', text: '#047857', icon: '#10b981' },
    api: { bg: '#fce7f3', border: '#ec4899', text: '#be185d', icon: '#ec4899' },
    ai: { bg: '#e0e7ff', border: '#6366f1', text: '#4338ca', icon: '#6366f1' },
    ladder: { bg: '#ccfbf1', border: '#14b8a6', text: '#0f766e', icon: '#14b8a6' },
    offer: { bg: '#ccfbf1', border: '#14b8a6', text: '#0f766e', icon: '#14b8a6' },
    case: { bg: '#ffedd5', border: '#f97316', text: '#c2410c', icon: '#f97316' },
    end: { bg: '#fee2e2', border: '#ef4444', text: '#dc2626', icon: '#ef4444' }
  };

  const getNodeIcon = (type) => {
    const iconMap = {
      start: Icons.play,
      message: Icons.message,
      options: Icons.list,
      condition: Icons.gitBranch,
      form: Icons.form,
      api: Icons.zap,
      ai: Icons.bot,
      ladder: Icons.trendingUp,
      offer: Icons.tag,
      case: Icons.folder,
      end: Icons.flag
    };
    return iconMap[type] || Icons.helpCircle;
  };

  // Note: Using custom SVG-based flow visualization instead of React Flow

  // ============================================
  // SIMULATOR POPUP COMPONENT
  // ============================================
  const SimulatorPopup = ({ node, onClose }) => {
    if (!node) return null;

    const overlayStyle = {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    };

    const phoneStyle = {
      width: '375px',
      height: '700px',
      background: 'linear-gradient(135deg, #FFF8E7 0%, #FFF5F5 50%, #F0F7FF 100%)',
      borderRadius: '40px',
      boxShadow: '0 25px 80px rgba(0,0,0,0.3), inset 0 0 0 8px #1a1a1a',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    };

    const headerStyle = {
      background: '#1a365d',
      color: 'white',
      padding: '48px 20px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    };

    const avatarStyle = {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      background: '#FF6B6B',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: '18px'
    };

    const chatAreaStyle = {
      flex: 1,
      padding: '20px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    };

    const closeButtonStyle = {
      position: 'absolute',
      top: '12px',
      right: '12px',
      background: 'rgba(255,255,255,0.9)',
      border: 'none',
      borderRadius: '50%',
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      zIndex: 10
    };

    // Render different content based on node type
    const renderSimulatorContent = () => {
      const { type, data } = node;
      
      switch (type) {
        case 'message':
          return React.createElement('div', { style: { display: 'flex', gap: '8px', alignItems: 'flex-start' } },
            React.createElement('div', { style: { ...avatarStyle, width: '36px', height: '36px', fontSize: '14px', flexShrink: 0 } },
              (data.persona || 'A')[0].toUpperCase()
            ),
            React.createElement('div', { style: { 
              background: 'white', 
              padding: '12px 16px', 
              borderRadius: '18px 18px 18px 4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              maxWidth: '80%',
              fontSize: '14px',
              lineHeight: '1.5'
            } }, data.content || 'Message content')
          );

        case 'options':
          return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
            React.createElement('div', { style: { fontSize: '14px', color: '#6b7280', marginBottom: '4px' } }, 
              data.prompt || 'Select an option:'
            ),
            ...(data.options || ['Option 1', 'Option 2']).map((opt, i) => 
              React.createElement('button', { 
                key: i,
                style: {
                  background: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }
              }, opt)
            )
          );

        case 'form':
          return React.createElement('div', { style: { 
            background: 'white', 
            borderRadius: '16px', 
            padding: '20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
          } },
            React.createElement('h4', { style: { margin: '0 0 16px', fontSize: '16px', fontWeight: 600 } }, 
              data.title || 'Form'
            ),
            ...(data.fields || ['field']).map((field, i) => 
              React.createElement('div', { key: i, style: { marginBottom: '12px' } },
                React.createElement('label', { style: { display: 'block', fontSize: '12px', fontWeight: 500, color: '#6b7280', marginBottom: '4px', textTransform: 'capitalize' } }, 
                  field.replace('_', ' ')
                ),
                React.createElement('input', { 
                  type: 'text',
                  placeholder: `Enter ${field}`,
                  style: {
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }
                })
              )
            ),
            React.createElement('button', { style: {
              width: '100%',
              padding: '12px',
              background: '#1a365d',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '8px'
            } }, 'Continue')
          );

        case 'offer':
          return React.createElement('div', { style: { 
            background: 'linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)',
            borderRadius: '16px',
            padding: '20px',
            border: '2px solid #22c55e'
          } },
            React.createElement('div', { style: { fontSize: '14px', color: '#047857', marginBottom: '8px' } }, 
              '🎉 Special Offer'
            ),
            React.createElement('div', { style: { fontSize: '24px', fontWeight: 700, color: '#15803d', marginBottom: '8px' } }, 
              `${data.percent || 20}% Refund`
            ),
            React.createElement('div', { style: { fontSize: '13px', color: '#047857', marginBottom: '16px' } }, 
              data.label || 'Keep product + partial refund'
            ),
            React.createElement('div', { style: { display: 'flex', gap: '8px' } },
              React.createElement('button', { style: {
                flex: 1,
                padding: '10px',
                background: 'white',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              } }, 'Decline'),
              React.createElement('button', { style: {
                flex: 1,
                padding: '10px',
                background: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              } }, 'Accept')
            )
          );

        case 'end':
          return React.createElement('div', { style: { textAlign: 'center', padding: '20px' } },
            React.createElement('div', { style: {
              width: '64px',
              height: '64px',
              background: '#dcfce7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '32px'
            } }, '✓'),
            React.createElement('h3', { style: { margin: '0 0 8px', fontSize: '20px', fontWeight: 600 } }, 
              data.title || 'Thank You!'
            ),
            data.showSurvey && React.createElement('div', { style: { marginTop: '16px' } },
              React.createElement('p', { style: { fontSize: '14px', color: '#6b7280', marginBottom: '12px' } }, 
                'How was your experience?'
              ),
              React.createElement('div', { style: { display: 'flex', justifyContent: 'center', gap: '8px' } },
                [1,2,3,4,5].map(n => React.createElement('span', { 
                  key: n, 
                  style: { fontSize: '24px', cursor: 'pointer', filter: 'grayscale(0.5)' }
                }, '⭐'))
              )
            )
          );

        case 'ai':
          return React.createElement('div', null,
            React.createElement('div', { style: { display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '16px' } },
              React.createElement('div', { style: { 
                width: '36px', 
                height: '36px', 
                borderRadius: '50%',
                background: '#A78BFA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '14px',
                color: 'white',
                flexShrink: 0
              } }, 'C'),
              React.createElement('div', { style: { 
                background: 'white', 
                padding: '12px 16px', 
                borderRadius: '18px 18px 18px 4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                maxWidth: '80%'
              } },
                React.createElement('div', { style: { fontSize: '12px', color: '#A78BFA', fontWeight: 600, marginBottom: '4px' } }, 
                  'Claudia - Dog Trainer'
                ),
                React.createElement('div', { style: { fontSize: '14px', lineHeight: '1.5' } }, 
                  'Based on your dog\'s information, here are my personalized training tips...'
                )
              )
            ),
            React.createElement('div', { style: { 
              background: '#f3f4f6', 
              borderRadius: '12px', 
              padding: '12px',
              fontSize: '11px',
              color: '#6b7280'
            } },
              React.createElement('div', { style: { fontWeight: 600, marginBottom: '4px' } }, '🤖 AI Integration'),
              React.createElement('div', null, `Model: ${data.model || 'gpt-4o'}`),
              React.createElement('div', null, `Max Tokens: ${data.maxTokens || 500}`)
            )
          );

        default:
          return React.createElement('div', { style: { 
            background: 'white', 
            borderRadius: '12px', 
            padding: '16px',
            fontSize: '14px'
          } },
            React.createElement('strong', null, type.toUpperCase()),
            React.createElement('pre', { style: { 
              marginTop: '8px', 
              fontSize: '11px', 
              background: '#f3f4f6', 
              padding: '8px', 
              borderRadius: '6px',
              overflow: 'auto'
            } }, JSON.stringify(data, null, 2))
          );
      }
    };

    return React.createElement('div', { style: overlayStyle, onClick: onClose },
      React.createElement('div', { style: phoneStyle, onClick: e => e.stopPropagation() },
        React.createElement('button', { style: closeButtonStyle, onClick: onClose },
          React.createElement('div', { style: { width: '20px', height: '20px' } }, React.createElement(Icons.x))
        ),
        React.createElement('div', { style: headerStyle },
          React.createElement('div', { style: avatarStyle }, 'A'),
          React.createElement('div', null,
            React.createElement('div', { style: { fontWeight: 600, fontSize: '16px' } }, 'Amy'),
            React.createElement('div', { style: { fontSize: '12px', opacity: 0.8 } }, 'Customer Support')
          )
        ),
        React.createElement('div', { style: chatAreaStyle },
          renderSimulatorContent()
        )
      )
    );
  };

  // ============================================
  // NODE PROPERTIES PANEL
  // ============================================
  const NodeProperties = ({ node, onSimulate }) => {
    if (!node) {
      return React.createElement('div', { style: { 
        padding: '40px 24px', 
        textAlign: 'center',
        color: '#9ca3af'
      } },
        React.createElement('div', { style: { 
          width: '64px', 
          height: '64px', 
          background: '#f3f4f6', 
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          color: '#9ca3af'
        } },
          React.createElement('div', { style: { width: '32px', height: '32px' } }, React.createElement(Icons.helpCircle))
        ),
        React.createElement('p', { style: { fontSize: '14px' } }, 'Click a node to view its properties')
      );
    }

    const { type, data } = node;
    const colors = nodeColors[type] || nodeColors.message;
    const IconComponent = getNodeIcon(type);

    const panelStyle = {
      padding: '24px',
      height: '100%',
      overflowY: 'auto'
    };

    const headerStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '24px',
      paddingBottom: '16px',
      borderBottom: '1px solid #e5e7eb'
    };

    const iconContainerStyle = {
      width: '48px',
      height: '48px',
      background: colors.bg,
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.icon
    };

    const sectionStyle = {
      marginBottom: '20px'
    };

    const labelStyle = {
      fontSize: '11px',
      fontWeight: 600,
      color: '#9ca3af',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '6px'
    };

    const valueStyle = {
      fontSize: '14px',
      color: '#374151',
      lineHeight: '1.5'
    };

    const codeStyle = {
      background: '#f3f4f6',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      overflow: 'auto'
    };

    return React.createElement('div', { style: panelStyle },
      React.createElement('div', { style: headerStyle },
        React.createElement('div', { style: iconContainerStyle },
          React.createElement('div', { style: { width: '24px', height: '24px' } }, React.createElement(IconComponent))
        ),
        React.createElement('div', null,
          React.createElement('div', { style: { fontWeight: 600, fontSize: '16px', color: colors.text, textTransform: 'capitalize' } }, 
            type.replace('_', ' ')
          ),
          React.createElement('div', { style: { fontSize: '12px', color: '#9ca3af' } }, 
            `Node ID: ${node.id}`
          )
        )
      ),

      // Content/Description
      (data.content || data.description) && React.createElement('div', { style: sectionStyle },
        React.createElement('div', { style: labelStyle }, data.content ? 'Message Content' : 'Description'),
        React.createElement('div', { style: valueStyle }, data.content || data.description)
      ),

      // Persona (for message/ai nodes)
      data.persona && React.createElement('div', { style: sectionStyle },
        React.createElement('div', { style: labelStyle }, 'Persona'),
        React.createElement('div', { style: { 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          padding: '8px 12px',
          background: '#f9fafb',
          borderRadius: '8px'
        } },
          React.createElement('div', { style: {
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: data.persona === 'claudia' ? '#A78BFA' : '#FF6B6B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
            fontSize: '14px'
          } }, data.persona[0].toUpperCase()),
          React.createElement('span', { style: { textTransform: 'capitalize' } }, data.persona)
        )
      ),

      // Form fields
      data.fields && React.createElement('div', { style: sectionStyle },
        React.createElement('div', { style: labelStyle }, 'Form Fields'),
        React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px' } },
          data.fields.map((field, i) => React.createElement('span', { 
            key: i,
            style: {
              background: '#e5e7eb',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500
            }
          }, field))
        )
      ),

      // Options
      data.options && React.createElement('div', { style: sectionStyle },
        React.createElement('div', { style: labelStyle }, 'Options'),
        data.options.map((opt, i) => React.createElement('div', { 
          key: i,
          style: {
            padding: '8px 12px',
            background: '#f9fafb',
            borderRadius: '6px',
            marginBottom: '6px',
            fontSize: '13px'
          }
        }, opt))
      ),

      // API info
      data.service && React.createElement('div', { style: sectionStyle },
        React.createElement('div', { style: labelStyle }, 'API Integration'),
        React.createElement('div', { style: codeStyle },
          React.createElement('div', null, `Service: ${data.service}`),
          data.endpoint && React.createElement('div', null, `Endpoint: ${data.endpoint}`),
          data.storeAs && React.createElement('div', null, `Store As: ${data.storeAs}`)
        )
      ),

      // AI info
      data.model && React.createElement('div', { style: sectionStyle },
        React.createElement('div', { style: labelStyle }, 'AI Configuration'),
        React.createElement('div', { style: codeStyle },
          React.createElement('div', null, `Model: ${data.model}`),
          data.maxTokens && React.createElement('div', null, `Max Tokens: ${data.maxTokens}`),
          data.prompt && React.createElement('div', { style: { marginTop: '8px', whiteSpace: 'pre-wrap' } }, `Prompt: ${data.prompt}`)
        )
      ),

      // Condition
      data.variable && React.createElement('div', { style: sectionStyle },
        React.createElement('div', { style: labelStyle }, 'Condition'),
        React.createElement('div', { style: codeStyle },
          `${data.variable} ${data.operator || '='} ${data.value}`
        )
      ),

      // Offer
      data.percent && React.createElement('div', { style: sectionStyle },
        React.createElement('div', { style: labelStyle }, 'Offer Details'),
        React.createElement('div', { style: { 
          padding: '12px', 
          background: '#dcfce7', 
          borderRadius: '8px',
          border: '1px solid #22c55e'
        } },
          React.createElement('div', { style: { fontSize: '20px', fontWeight: 700, color: '#15803d' } }, 
            `${data.percent}% Refund`
          ),
          data.label && React.createElement('div', { style: { fontSize: '13px', color: '#047857', marginTop: '4px' } }, 
            data.label
          )
        )
      ),

      // Case
      data.type && type === 'case' && React.createElement('div', { style: sectionStyle },
        React.createElement('div', { style: labelStyle }, 'Case Configuration'),
        React.createElement('div', { style: codeStyle },
          React.createElement('div', null, `Type: ${data.type}`),
          React.createElement('div', null, `Priority: ${data.priority || 'normal'}`)
        )
      ),

      // Simulate button
      React.createElement('button', {
        onClick: () => onSimulate(node),
        style: {
          width: '100%',
          padding: '14px',
          background: '#1a365d',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '24px',
          transition: 'all 0.2s'
        }
      },
        React.createElement('div', { style: { width: '18px', height: '18px' } }, React.createElement(Icons.play)),
        'Simulate This Step'
      )
    );
  };

  // ============================================
  // FLOW CANVAS VIEW (Custom SVG-based)
  // ============================================
  const FlowCanvas = ({ subflow, onBack, parentFlow }) => {
    const [selectedNode, setSelectedNode] = useState(null);
    const [simulatorNode, setSimulatorNode] = useState(null);
    const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 800 });
    const [zoom, setZoom] = useState(1);
    const svgRef = useRef(null);

    const nodes = subflow.nodes || [];
    const edges = subflow.edges || [];

    // Calculate viewBox based on nodes
    useEffect(() => {
      if (nodes.length > 0) {
        const minX = Math.min(...nodes.map(n => n.position.x)) - 50;
        const maxX = Math.max(...nodes.map(n => n.position.x)) + 300;
        const minY = Math.min(...nodes.map(n => n.position.y)) - 50;
        const maxY = Math.max(...nodes.map(n => n.position.y)) + 150;
        setViewBox({ x: minX, y: minY, width: maxX - minX, height: maxY - minY });
      }
    }, [nodes]);

    const handleNodeClick = (node) => {
      setSelectedNode(node);
    };

    const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 3));
    const handleZoomOut = () => setZoom(z => Math.max(z / 1.2, 0.3));
    const handleZoomReset = () => setZoom(1);

    // Render edge path
    const renderEdge = (edge) => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      if (!sourceNode || !targetNode) return null;

      const sx = sourceNode.position.x + 100; // Center of node
      const sy = sourceNode.position.y + 60;  // Bottom of node
      const tx = targetNode.position.x + 100; // Center of node
      const ty = targetNode.position.y;       // Top of node

      // Smooth step path
      const midY = (sy + ty) / 2;
      const path = `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`;

      return React.createElement('g', { key: edge.id },
        React.createElement('path', {
          d: path,
          fill: 'none',
          stroke: edge.style?.stroke || '#94a3b8',
          strokeWidth: 2,
          markerEnd: 'url(#arrowhead)'
        }),
        edge.label && React.createElement('text', {
          x: (sx + tx) / 2,
          y: midY - 8,
          textAnchor: 'middle',
          fill: '#6b7280',
          fontSize: 11,
          fontWeight: 500
        }, edge.label)
      );
    };

    // Render node
    const renderNode = (node) => {
      const colors = nodeColors[node.type] || nodeColors.message;
      const IconComponent = getNodeIcon(node.type);
      const isSelected = selectedNode?.id === node.id;

      return React.createElement('g', { 
        key: node.id,
        transform: `translate(${node.position.x}, ${node.position.y})`,
        onClick: () => handleNodeClick(node),
        style: { cursor: 'pointer' }
      },
        // Node background
        React.createElement('rect', {
          width: 200,
          height: 60,
          rx: 12,
          fill: colors.bg,
          stroke: isSelected ? colors.icon : colors.border,
          strokeWidth: isSelected ? 3 : 2,
          filter: isSelected ? 'url(#selectedShadow)' : 'url(#nodeShadow)'
        }),
        // Icon container
        React.createElement('rect', {
          x: 12,
          y: 12,
          width: 36,
          height: 36,
          rx: 8,
          fill: 'white',
          fillOpacity: 0.8
        }),
        // Icon (simplified - just show type letter)
        React.createElement('text', {
          x: 30,
          y: 36,
          textAnchor: 'middle',
          fill: colors.icon,
          fontSize: 14,
          fontWeight: 700
        }, node.type[0].toUpperCase()),
        // Type label
        React.createElement('text', {
          x: 60,
          y: 26,
          fill: colors.text,
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'capitalize'
        }, node.type.replace('_', ' ')),
        // Content preview
        React.createElement('text', {
          x: 60,
          y: 44,
          fill: '#6b7280',
          fontSize: 10
        }, (node.data?.content || node.data?.label || '').slice(0, 25) + ((node.data?.content || '').length > 25 ? '...' : ''))
      );
    };

    const containerStyle = {
      display: 'flex',
      height: 'calc(100vh - 180px)',
      background: 'linear-gradient(135deg, #faf5ff 0%, #fdf2f8 50%, #eff6ff 100%)',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid #e5e7eb'
    };

    const canvasStyle = {
      flex: 1,
      height: '100%',
      position: 'relative',
      overflow: 'hidden'
    };

    const propertiesPanelStyle = {
      width: '340px',
      background: 'white',
      borderLeft: '1px solid #e5e7eb',
      overflow: 'hidden'
    };

    const headerStyle = {
      padding: '16px 20px',
      borderBottom: '1px solid #e5e7eb',
      background: 'white'
    };

    const controlsStyle = {
      position: 'absolute',
      bottom: '16px',
      left: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    };

    const controlBtnStyle = {
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      background: 'white',
      cursor: 'pointer',
      fontSize: '18px',
      color: '#374151'
    };

    return React.createElement('div', null,
      // Header with back button
      React.createElement('div', { style: { marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px' } },
        React.createElement('button', {
          onClick: onBack,
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer'
          }
        },
          React.createElement('div', { style: { width: '16px', height: '16px' } }, React.createElement(Icons.arrowLeft)),
          'Back'
        ),
        React.createElement('div', null,
          React.createElement('div', { style: { fontSize: '12px', color: '#9ca3af' } }, parentFlow?.name || 'Parent Flow'),
          React.createElement('div', { style: { fontSize: '18px', fontWeight: 600 } }, subflow.name)
        )
      ),
      
      // Canvas and properties panel
      React.createElement('div', { style: containerStyle },
        React.createElement('div', { style: canvasStyle },
          // SVG Canvas
          React.createElement('svg', {
            ref: svgRef,
            width: '100%',
            height: '100%',
            viewBox: `${viewBox.x} ${viewBox.y} ${viewBox.width / zoom} ${viewBox.height / zoom}`,
            style: { background: 'transparent' }
          },
            // Defs for filters and markers
            React.createElement('defs', null,
              React.createElement('marker', {
                id: 'arrowhead',
                markerWidth: 10,
                markerHeight: 7,
                refX: 10,
                refY: 3.5,
                orient: 'auto'
              },
                React.createElement('polygon', {
                  points: '0 0, 10 3.5, 0 7',
                  fill: '#94a3b8'
                })
              ),
              React.createElement('filter', { id: 'nodeShadow', x: '-20%', y: '-20%', width: '140%', height: '140%' },
                React.createElement('feDropShadow', { dx: 0, dy: 2, stdDeviation: 3, floodOpacity: 0.1 })
              ),
              React.createElement('filter', { id: 'selectedShadow', x: '-20%', y: '-20%', width: '140%', height: '140%' },
                React.createElement('feDropShadow', { dx: 0, dy: 4, stdDeviation: 6, floodOpacity: 0.2 })
              )
            ),
            // Grid pattern
            React.createElement('defs', null,
              React.createElement('pattern', { id: 'grid', width: 20, height: 20, patternUnits: 'userSpaceOnUse' },
                React.createElement('circle', { cx: 1, cy: 1, r: 1, fill: '#e5e7eb' })
              )
            ),
            React.createElement('rect', { width: '100%', height: '100%', fill: 'url(#grid)' }),
            // Edges
            edges.map(renderEdge),
            // Nodes
            nodes.map(renderNode)
          ),
          // Zoom controls
          React.createElement('div', { style: controlsStyle },
            React.createElement('button', { style: controlBtnStyle, onClick: handleZoomIn }, '+'),
            React.createElement('button', { style: controlBtnStyle, onClick: handleZoomReset }, '⌂'),
            React.createElement('button', { style: controlBtnStyle, onClick: handleZoomOut }, '−')
          )
        ),
        React.createElement('div', { style: propertiesPanelStyle },
          React.createElement('div', { style: headerStyle },
            React.createElement('div', { style: { fontWeight: 600, fontSize: '14px' } }, 'Node Properties')
          ),
          React.createElement(NodeProperties, { 
            node: selectedNode, 
            onSimulate: (node) => setSimulatorNode(node) 
          })
        )
      ),

      // Simulator popup
      simulatorNode && React.createElement(SimulatorPopup, {
        node: simulatorNode,
        onClose: () => setSimulatorNode(null)
      })
    );
  };

  // ============================================
  // PARENT FLOW DETAIL VIEW
  // ============================================
  const ParentFlowDetail = ({ parentFlow, onBack, onSelectSubflow }) => {
    const subflows = parentFlow.subflows.map(id => FLOW_DATA.subflows[id]).filter(Boolean);
    const IconComponent = parentFlow.icon === 'help-circle' ? Icons.helpCircle : 
                          parentFlow.icon === 'truck' ? Icons.truck : Icons.refreshCw;

    const cardStyle = {
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e5e7eb',
      padding: '20px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    };

    return React.createElement('div', null,
      // Header with back
      React.createElement('div', { style: { marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' } },
        React.createElement('button', {
          onClick: onBack,
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer'
          }
        },
          React.createElement('div', { style: { width: '16px', height: '16px' } }, React.createElement(Icons.arrowLeft)),
          'Back to Flows'
        ),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
          React.createElement('div', { style: {
            width: '48px',
            height: '48px',
            background: `${parentFlow.color}20`,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: parentFlow.color
          } },
            React.createElement('div', { style: { width: '24px', height: '24px' } }, React.createElement(IconComponent))
          ),
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: '20px', fontWeight: 600 } }, parentFlow.name),
            React.createElement('div', { style: { fontSize: '14px', color: '#6b7280' } }, parentFlow.description)
          )
        )
      ),

      // Entry Flow Section
      React.createElement('div', { style: { marginBottom: '32px' } },
        React.createElement('h3', { style: { 
          fontSize: '14px', 
          fontWeight: 600, 
          color: '#6b7280', 
          textTransform: 'uppercase', 
          letterSpacing: '0.05em',
          marginBottom: '12px'
        } }, 'Entry Flow'),
        React.createElement('div', { 
          style: { 
            ...cardStyle, 
            background: `linear-gradient(135deg, ${parentFlow.color}10 0%, ${parentFlow.color}05 100%)`,
            borderColor: `${parentFlow.color}40`
          }
        },
          React.createElement('div', { style: { fontWeight: 600, marginBottom: '4px' } }, 'Main Entry Point'),
          React.createElement('div', { style: { fontSize: '14px', color: '#6b7280' } }, 
            'Customer selects this flow from the main menu'
          )
        )
      ),

      // Subflows Section
      React.createElement('div', null,
        React.createElement('h3', { style: { 
          fontSize: '14px', 
          fontWeight: 600, 
          color: '#6b7280', 
          textTransform: 'uppercase', 
          letterSpacing: '0.05em',
          marginBottom: '12px'
        } }, `Sub-Flows (${subflows.length})`),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' } },
          subflows.map(subflow => 
            React.createElement('div', { 
              key: subflow.id,
              style: cardStyle,
              onClick: () => onSelectSubflow(subflow),
              onMouseEnter: e => {
                e.currentTarget.style.borderColor = parentFlow.color;
                e.currentTarget.style.boxShadow = `0 4px 16px ${parentFlow.color}20`;
              },
              onMouseLeave: e => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
              }
            },
              React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' } },
                React.createElement('div', null,
                  React.createElement('div', { style: { fontWeight: 600, marginBottom: '4px' } }, subflow.name),
                  React.createElement('div', { style: { fontSize: '13px', color: '#6b7280' } }, subflow.description)
                ),
                React.createElement('div', { style: { width: '20px', height: '20px', color: '#9ca3af' } },
                  React.createElement(Icons.chevronRight)
                )
              ),
              React.createElement('div', { style: { 
                marginTop: '12px', 
                paddingTop: '12px', 
                borderTop: '1px solid #f3f4f6',
                display: 'flex',
                gap: '16px',
                fontSize: '12px',
                color: '#9ca3af'
              } },
                React.createElement('span', null, `${subflow.nodes?.length || 0} nodes`),
                React.createElement('span', null, `${subflow.edges?.length || 0} connections`)
              )
            )
          )
        )
      )
    );
  };

  // ============================================
  // FLOW SETTINGS (Main View)
  // ============================================
  const FlowSettings = ({ onSelectParent }) => {
    const cardStyle = {
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e5e7eb',
      padding: '24px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    };

    return React.createElement('div', null,
      React.createElement('div', { style: { marginBottom: '24px' } },
        React.createElement('h2', { style: { fontSize: '24px', fontWeight: 600, marginBottom: '8px' } }, 
          'Flow Documentation'
        ),
        React.createElement('p', { style: { color: '#6b7280' } }, 
          'Explore the customer resolution flows and their logic'
        )
      ),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' } },
        FLOW_DATA.parentFlows.map(flow => {
          const IconComponent = flow.icon === 'help-circle' ? Icons.helpCircle : 
                                flow.icon === 'truck' ? Icons.truck : Icons.refreshCw;
          const subflowCount = flow.subflows.length;

          return React.createElement('div', { 
            key: flow.id,
            style: cardStyle,
            onClick: () => onSelectParent(flow),
            onMouseEnter: e => {
              e.currentTarget.style.borderColor = flow.color;
              e.currentTarget.style.boxShadow = `0 8px 24px ${flow.color}20`;
              e.currentTarget.style.transform = 'translateY(-2px)';
            },
            onMouseLeave: e => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          },
            React.createElement('div', { style: { display: 'flex', alignItems: 'flex-start', gap: '16px' } },
              React.createElement('div', { style: {
                width: '56px',
                height: '56px',
                background: `${flow.color}15`,
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: flow.color,
                flexShrink: 0
              } },
                React.createElement('div', { style: { width: '28px', height: '28px' } }, React.createElement(IconComponent))
              ),
              React.createElement('div', { style: { flex: 1 } },
                React.createElement('div', { style: { fontWeight: 600, fontSize: '16px', marginBottom: '4px' } }, flow.name),
                React.createElement('div', { style: { fontSize: '14px', color: '#6b7280', marginBottom: '12px' } }, flow.description)
              )
            ),
            React.createElement('div', { style: { 
              marginTop: '16px', 
              paddingTop: '16px', 
              borderTop: '1px solid #f3f4f6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            } },
              React.createElement('span', { style: { fontSize: '13px', color: '#9ca3af' } }, 
                `${subflowCount} sub-flow${subflowCount !== 1 ? 's' : ''}`
              ),
              React.createElement('div', { style: { 
                width: '32px', 
                height: '32px', 
                background: '#f3f4f6',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280'
              } },
                React.createElement('div', { style: { width: '16px', height: '16px' } }, React.createElement(Icons.chevronRight))
              )
            )
          );
        })
      )
    );
  };

  // ============================================
  // MAIN APP COMPONENT
  // ============================================
  const FlowDocsApp = () => {
    const [view, setView] = useState('settings'); // settings, parent, canvas
    const [selectedParent, setSelectedParent] = useState(null);
    const [selectedSubflow, setSelectedSubflow] = useState(null);

    const handleSelectParent = (parent) => {
      setSelectedParent(parent);
      setView('parent');
    };

    const handleSelectSubflow = (subflow) => {
      setSelectedSubflow(subflow);
      setView('canvas');
    };

    const handleBackToSettings = () => {
      setSelectedParent(null);
      setSelectedSubflow(null);
      setView('settings');
    };

    const handleBackToParent = () => {
      setSelectedSubflow(null);
      setView('parent');
    };

    if (view === 'canvas' && selectedSubflow) {
      return React.createElement(FlowCanvas, {
        subflow: selectedSubflow,
        parentFlow: selectedParent,
        onBack: handleBackToParent
      });
    }

    if (view === 'parent' && selectedParent) {
      return React.createElement(ParentFlowDetail, {
        parentFlow: selectedParent,
        onBack: handleBackToSettings,
        onSelectSubflow: handleSelectSubflow
      });
    }

    return React.createElement(FlowSettings, {
      onSelectParent: handleSelectParent
    });
  };

  // ============================================
  // MOUNT THE APP
  // ============================================
  window.FlowDocsReact = {
    mount: function(container) {
      if (!container) {
        console.error('FlowDocsReact: No container provided');
        return;
      }
      const root = ReactDOM.createRoot(container);
      root.render(React.createElement(FlowDocsApp));
      return root;
    },
    unmount: function(root) {
      if (root) {
        root.unmount();
      }
    }
  };

  console.log('FlowDocsReact loaded and ready');
})();
