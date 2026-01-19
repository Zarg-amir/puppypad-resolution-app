/**
 * Flow Documentation - React Flow Canvas
 * Uses React 18 + React Flow via CDN for interactive flow visualization
 * Integrates with main hub sidebar
 */

(function initFlowDocs() {
  // Wait for React and ReactDOM
  if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
    setTimeout(initFlowDocs, 100);
    return;
  }

  const { useState, useCallback, useEffect, useMemo, useRef } = React;

  // Check if React Flow is loaded
  let ReactFlowLoaded = typeof window.ReactFlow !== 'undefined';
  let ReactFlowComponent, Controls, Background, MiniMap, useNodesState, useEdgesState, Handle, Position, MarkerType;

  if (ReactFlowLoaded) {
    ({ ReactFlow: ReactFlowComponent, Controls, Background, MiniMap, useNodesState, useEdgesState, Handle, Position, MarkerType } = window.ReactFlow);
  }

  // ============================================
  // SVG ICONS
  // ============================================
  const Icons = {
    Play: () => React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'currentColor', stroke: 'none' },
      React.createElement('polygon', { points: '5 3 19 12 5 21 5 3' })
    ),
    MessageSquare: () => React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      React.createElement('path', { d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' })
    ),
    List: () => React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      React.createElement('line', { x1: 8, y1: 6, x2: 21, y2: 6 }),
      React.createElement('line', { x1: 8, y1: 12, x2: 21, y2: 12 }),
      React.createElement('line', { x1: 8, y1: 18, x2: 21, y2: 18 }),
      React.createElement('line', { x1: 3, y1: 6, x2: 3.01, y2: 6 }),
      React.createElement('line', { x1: 3, y1: 12, x2: 3.01, y2: 12 }),
      React.createElement('line', { x1: 3, y1: 18, x2: 3.01, y2: 18 })
    ),
    GitBranch: () => React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      React.createElement('line', { x1: 6, y1: 3, x2: 6, y2: 15 }),
      React.createElement('circle', { cx: 18, cy: 6, r: 3 }),
      React.createElement('circle', { cx: 6, cy: 18, r: 3 }),
      React.createElement('path', { d: 'M18 9a9 9 0 0 1-9 9' })
    ),
    Zap: () => React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      React.createElement('polygon', { points: '13 2 3 14 12 14 11 22 21 10 12 10 13 2' })
    ),
    Bot: () => React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      React.createElement('rect', { x: 3, y: 11, width: 18, height: 10, rx: 2 }),
      React.createElement('circle', { cx: 12, cy: 5, r: 2 }),
      React.createElement('path', { d: 'M12 7v4' }),
      React.createElement('line', { x1: 8, y1: 16, x2: 8, y2: 16 }),
      React.createElement('line', { x1: 16, y1: 16, x2: 16, y2: 16 })
    ),
    Gift: () => React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      React.createElement('polyline', { points: '20 12 20 22 4 22 4 12' }),
      React.createElement('rect', { x: 2, y: 7, width: 20, height: 5 }),
      React.createElement('line', { x1: 12, y1: 22, x2: 12, y2: 7 }),
      React.createElement('path', { d: 'M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z' }),
      React.createElement('path', { d: 'M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z' })
    ),
    FolderOpen: () => React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      React.createElement('path', { d: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' }),
      React.createElement('path', { d: 'M2 10h20' })
    ),
    FileText: () => React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      React.createElement('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
      React.createElement('polyline', { points: '14 2 14 8 20 8' }),
      React.createElement('line', { x1: 16, y1: 13, x2: 8, y2: 13 }),
      React.createElement('line', { x1: 16, y1: 17, x2: 8, y2: 17 }),
      React.createElement('polyline', { points: '10 9 9 9 8 9' })
    ),
    Flag: () => React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      React.createElement('path', { d: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z' }),
      React.createElement('line', { x1: 4, y1: 22, x2: 4, y2: 15 })
    ),
    ArrowLeft: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      React.createElement('line', { x1: 19, y1: 12, x2: 5, y2: 12 }),
      React.createElement('polyline', { points: '12 19 5 12 12 5' })
    ),
    ChevronRight: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      React.createElement('polyline', { points: '9 18 15 12 9 6' })
    ),
    Settings: () => React.createElement('svg', { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      React.createElement('circle', { cx: 12, cy: 12, r: 3 }),
      React.createElement('path', { d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z' })
    )
  };

  // Node colors
  const nodeColors = {
    start: '#22c55e',
    message: '#3b82f6',
    options: '#8b5cf6',
    condition: '#f59e0b',
    api: '#ec4899',
    ai: '#6366f1',
    offer: '#14b8a6',
    case: '#f97316',
    form: '#10b981',
    end: '#ef4444',
    subflow: '#8b5cf6'
  };

  // ============================================
  // FLOW DATA
  // ============================================
  const FLOW_DATA = {
    parentFlows: [
      { 
        id: 'help_with_order', 
        name: 'Help With My Order', 
        icon: '📦',
        color: '#8b5cf6', 
        description: 'Complete flow for order issues including refunds, returns, and complaints',
        tags: ['💭 Changed', '🐕 Dog', '💔 Damaged', '😕 Other'],
        subflows: ['changed_mind', 'dog_not_using', 'quality_issue', 'other_reason'],
        entryNodes: [
          { id: 'start', type: 'start', position: { x: 400, y: 0 }, data: { label: 'Start' } },
          { id: 'opts1', type: 'options', position: { x: 350, y: 120 }, data: { prompt: "What's going on with your order?", options: [{ label: 'Changed my mind' }, { label: 'Dog not using it' }, { label: 'Quality issue' }, { label: 'Other reason' }] } },
          { id: 'sub1', type: 'subflow', position: { x: 50, y: 320 }, data: { name: 'Changed My Mind', slug: 'changed_mind' } },
          { id: 'sub2', type: 'subflow', position: { x: 300, y: 320 }, data: { name: 'Dog Not Using', slug: 'dog_not_using' } },
          { id: 'sub3', type: 'subflow', position: { x: 550, y: 320 }, data: { name: 'Quality Issue', slug: 'quality_issue' } },
          { id: 'sub4', type: 'subflow', position: { x: 300, y: 480 }, data: { name: 'Other Reason', slug: 'other_reason' } }
        ],
        entryEdges: [
          { id: 'e1', source: 'start', target: 'opts1', animated: true },
          { id: 'e2', source: 'opts1', target: 'sub1', sourceHandle: 'opt-0', animated: true },
          { id: 'e3', source: 'opts1', target: 'sub2', sourceHandle: 'opt-1', animated: true },
          { id: 'e4', source: 'opts1', target: 'sub3', sourceHandle: 'opt-2', animated: true },
          { id: 'e5', source: 'opts1', target: 'sub4', sourceHandle: 'opt-3', animated: true }
        ]
      },
      { 
        id: 'track_order', 
        name: 'Track My Order', 
        icon: '🚚',
        color: '#3b82f6', 
        description: 'Help customers track their order status and shipping updates',
        tags: ['📍 Track'],
        subflows: ['tracking_status'],
        entryNodes: [
          { id: 'start', type: 'start', position: { x: 400, y: 0 }, data: { label: 'Start' } },
          { id: 'sub1', type: 'subflow', position: { x: 350, y: 140 }, data: { name: 'Check Tracking Status', slug: 'tracking_status' } }
        ],
        entryEdges: [
          { id: 'e1', source: 'start', target: 'sub1', animated: true }
        ]
      },
      { 
        id: 'manage_subscription', 
        name: 'Manage My Subscription', 
        icon: '🔄',
        color: '#10b981', 
        description: 'Help customers manage their subscription, billing, and delivery preferences',
        tags: ['⏸️ Pause', '❌ Cancel', '🔄 Change'],
        subflows: ['pause_subscription', 'cancel_subscription', 'change_frequency'],
        entryNodes: [
          { id: 'start', type: 'start', position: { x: 400, y: 0 }, data: { label: 'Start' } },
          { id: 'opts1', type: 'options', position: { x: 350, y: 120 }, data: { prompt: 'What would you like to do?', options: [{ label: 'Pause subscription' }, { label: 'Cancel subscription' }, { label: 'Change frequency' }] } },
          { id: 'sub1', type: 'subflow', position: { x: 100, y: 320 }, data: { name: 'Pause Subscription', slug: 'pause_subscription' } },
          { id: 'sub2', type: 'subflow', position: { x: 350, y: 320 }, data: { name: 'Cancel Subscription', slug: 'cancel_subscription' } },
          { id: 'sub3', type: 'subflow', position: { x: 600, y: 320 }, data: { name: 'Change Frequency', slug: 'change_frequency' } }
        ],
        entryEdges: [
          { id: 'e1', source: 'start', target: 'opts1', animated: true },
          { id: 'e2', source: 'opts1', target: 'sub1', sourceHandle: 'opt-0', animated: true },
          { id: 'e3', source: 'opts1', target: 'sub2', sourceHandle: 'opt-1', animated: true },
          { id: 'e4', source: 'opts1', target: 'sub3', sourceHandle: 'opt-2', animated: true }
        ]
      }
    ],
    subflows: {
      changed_mind: {
        id: 'changed_mind',
        parentId: 'help_with_order',
        name: 'Changed My Mind',
        description: 'Customer wants a refund because they changed their mind',
        nodes: [
          { id: 'start', type: 'start', position: { x: 400, y: 0 }, data: { label: 'Start' } },
          { id: 'msg1', type: 'message', position: { x: 350, y: 120 }, data: { persona: 'amy', content: "I understand, and I appreciate you being upfront about it. Let me see what options we have for you!" } },
          { id: 'api1', type: 'api', position: { x: 350, y: 280 }, data: { service: 'Shopify', endpoint: 'checkGuarantee' } },
          { id: 'cond1', type: 'condition', position: { x: 350, y: 420 }, data: { variable: 'guaranteeStatus', operator: 'equals', value: 'active' } },
          { id: 'offer1', type: 'offer', position: { x: 150, y: 580 }, data: { percent: 20, label: 'Keep product' } },
          { id: 'offer2', type: 'offer', position: { x: 150, y: 740 }, data: { percent: 30, label: 'Keep product' } },
          { id: 'offer3', type: 'offer', position: { x: 150, y: 900 }, data: { percent: 40, label: 'Keep product' } },
          { id: 'case1', type: 'case', position: { x: 150, y: 1060 }, data: { type: 'refund', priority: 'normal' } },
          { id: 'msg2', type: 'message', position: { x: 550, y: 580 }, data: { persona: 'amy', content: "I'm sorry, but our 90-day guarantee has expired for this order. However, I can still help!" } },
          { id: 'end1', type: 'end', position: { x: 350, y: 1200 }, data: { title: 'Thank You!', showSurvey: true } }
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'msg1', animated: true },
          { id: 'e2', source: 'msg1', target: 'api1', animated: true },
          { id: 'e3', source: 'api1', target: 'cond1', animated: true },
          { id: 'e4', source: 'cond1', target: 'offer1', sourceHandle: 'yes', label: 'Within 90 days', animated: true },
          { id: 'e5', source: 'cond1', target: 'msg2', sourceHandle: 'no', label: 'Expired', animated: true },
          { id: 'e6', source: 'offer1', target: 'offer2', sourceHandle: 'decline', label: 'Decline', animated: true },
          { id: 'e7', source: 'offer1', target: 'case1', sourceHandle: 'accept', label: 'Accept', animated: true },
          { id: 'e8', source: 'offer2', target: 'offer3', sourceHandle: 'decline', label: 'Decline', animated: true },
          { id: 'e9', source: 'offer2', target: 'case1', sourceHandle: 'accept', label: 'Accept', animated: true },
          { id: 'e10', source: 'offer3', target: 'case1', sourceHandle: 'decline', label: 'Decline', animated: true },
          { id: 'e11', source: 'offer3', target: 'case1', sourceHandle: 'accept', label: 'Accept', animated: true },
          { id: 'e12', source: 'case1', target: 'end1', animated: true },
          { id: 'e13', source: 'msg2', target: 'end1', animated: true }
        ]
      },
      dog_not_using: {
        id: 'dog_not_using',
        parentId: 'help_with_order',
        name: 'Dog Not Using Product',
        description: 'Customer reports their dog is not using the PuppyPad',
        nodes: [
          { id: 'start', type: 'start', position: { x: 400, y: 0 }, data: { label: 'Start' } },
          { id: 'msg1', type: 'message', position: { x: 350, y: 120 }, data: { persona: 'amy', content: "I'm sorry to hear that! Our trainer Claudia has some tips that might help." } },
          { id: 'ai1', type: 'ai', position: { x: 350, y: 280 }, data: { persona: 'claudia', prompt: 'Generate training tips', model: 'gpt-4o-mini' } },
          { id: 'opts1', type: 'options', position: { x: 350, y: 440 }, data: { prompt: 'Did the tips help?', options: [{ label: 'Yes, thanks!' }, { label: 'Still having issues' }] } },
          { id: 'end1', type: 'end', position: { x: 150, y: 620 }, data: { title: 'Great!', showSurvey: true } },
          { id: 'offer1', type: 'offer', position: { x: 550, y: 620 }, data: { percent: 30, label: 'Keep product' } },
          { id: 'case1', type: 'case', position: { x: 550, y: 780 }, data: { type: 'refund' } },
          { id: 'end2', type: 'end', position: { x: 550, y: 920 }, data: { title: 'Case Created', showSurvey: true } }
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'msg1', animated: true },
          { id: 'e2', source: 'msg1', target: 'ai1', animated: true },
          { id: 'e3', source: 'ai1', target: 'opts1', animated: true },
          { id: 'e4', source: 'opts1', target: 'end1', sourceHandle: 'opt-0', animated: true },
          { id: 'e5', source: 'opts1', target: 'offer1', sourceHandle: 'opt-1', animated: true },
          { id: 'e6', source: 'offer1', target: 'case1', animated: true },
          { id: 'e7', source: 'case1', target: 'end2', animated: true }
        ]
      },
      quality_issue: {
        id: 'quality_issue',
        parentId: 'help_with_order',
        name: 'Quality / Material Issue',
        description: 'Customer notices quality or material differences',
        nodes: [
          { id: 'start', type: 'start', position: { x: 400, y: 0 }, data: { label: 'Start' } },
          { id: 'msg1', type: 'message', position: { x: 350, y: 120 }, data: { persona: 'amy', content: "I'm so sorry about that! Can you upload some photos so we can take a look?" } },
          { id: 'upload1', type: 'form', position: { x: 350, y: 280 }, data: { formType: 'Photo Upload', label: 'Upload Photos' } },
          { id: 'case1', type: 'case', position: { x: 350, y: 440 }, data: { type: 'quality', priority: 'high' } },
          { id: 'msg2', type: 'message', position: { x: 350, y: 600 }, data: { persona: 'amy', content: "Thanks for those photos. I've created a priority case for our quality team to review." } },
          { id: 'end1', type: 'end', position: { x: 350, y: 760 }, data: { title: 'Case Submitted', showSurvey: true } }
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'msg1', animated: true },
          { id: 'e2', source: 'msg1', target: 'upload1', animated: true },
          { id: 'e3', source: 'upload1', target: 'case1', animated: true },
          { id: 'e4', source: 'case1', target: 'msg2', animated: true },
          { id: 'e5', source: 'msg2', target: 'end1', animated: true }
        ]
      },
      other_reason: {
        id: 'other_reason',
        parentId: 'help_with_order',
        name: 'Other Reason',
        description: 'Customer has a different issue not covered by other options',
        nodes: [
          { id: 'start', type: 'start', position: { x: 400, y: 0 }, data: { label: 'Start' } },
          { id: 'msg1', type: 'message', position: { x: 350, y: 120 }, data: { persona: 'amy', content: "I'd love to help! Can you tell me more about what's going on?" } },
          { id: 'form1', type: 'form', position: { x: 350, y: 280 }, data: { formType: 'Form', label: 'Describe Issue' } },
          { id: 'ai1', type: 'ai', position: { x: 350, y: 440 }, data: { persona: 'amy', prompt: 'Analyze issue and provide response', model: 'gpt-4o' } },
          { id: 'end1', type: 'end', position: { x: 350, y: 600 }, data: { title: 'Thanks!', showSurvey: true } }
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'msg1', animated: true },
          { id: 'e2', source: 'msg1', target: 'form1', animated: true },
          { id: 'e3', source: 'form1', target: 'ai1', animated: true },
          { id: 'e4', source: 'ai1', target: 'end1', animated: true }
        ]
      },
      tracking_status: {
        id: 'tracking_status',
        parentId: 'track_order',
        name: 'Check Tracking Status',
        description: 'Customer wants to see where their order is',
        nodes: [
          { id: 'start', type: 'start', position: { x: 400, y: 0 }, data: { label: 'Start' } },
          { id: 'form1', type: 'form', position: { x: 350, y: 120 }, data: { formType: 'Form', label: 'Find Your Order' } },
          { id: 'api1', type: 'api', position: { x: 350, y: 280 }, data: { service: 'Shopify', endpoint: 'lookupOrder' } },
          { id: 'api2', type: 'api', position: { x: 350, y: 440 }, data: { service: 'ParcelPanel', endpoint: 'getTracking' } },
          { id: 'msg1', type: 'message', position: { x: 350, y: 600 }, data: { persona: 'amy', content: "Here's your tracking info! Your package is {{trackingStatus}}." } },
          { id: 'end1', type: 'end', position: { x: 350, y: 760 }, data: { title: 'All done!', showSurvey: true } }
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'form1', animated: true },
          { id: 'e2', source: 'form1', target: 'api1', animated: true },
          { id: 'e3', source: 'api1', target: 'api2', animated: true },
          { id: 'e4', source: 'api2', target: 'msg1', animated: true },
          { id: 'e5', source: 'msg1', target: 'end1', animated: true }
        ]
      },
      cancel_subscription: {
        id: 'cancel_subscription',
        parentId: 'manage_subscription',
        name: 'Cancel Subscription',
        description: 'Customer wants to cancel their subscription',
        nodes: [
          { id: 'start', type: 'start', position: { x: 400, y: 0 }, data: { label: 'Start' } },
          { id: 'msg1', type: 'message', position: { x: 350, y: 120 }, data: { persona: 'amy', content: "I'm sorry to see you go! Before we cancel, may I ask why?" } },
          { id: 'opts1', type: 'options', position: { x: 350, y: 280 }, data: { prompt: 'Reason for canceling?', options: [{ label: 'Too expensive' }, { label: 'Dog passed away' }, { label: 'Moving' }, { label: 'Other' }] } },
          { id: 'offer1', type: 'offer', position: { x: 50, y: 480 }, data: { percent: 20, label: '20% off next 3 months' } },
          { id: 'case1', type: 'case', position: { x: 250, y: 480 }, data: { type: 'subscription', priority: 'high', note: 'Pet loss - handle sensitively' } },
          { id: 'msg2', type: 'message', position: { x: 450, y: 480 }, data: { persona: 'amy', content: "No problem! I'll process your cancellation." } },
          { id: 'api1', type: 'api', position: { x: 650, y: 480 }, data: { service: 'Shopify', endpoint: 'cancelSubscription' } },
          { id: 'end1', type: 'end', position: { x: 350, y: 680 }, data: { title: 'Subscription Updated', showSurvey: true } }
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'msg1', animated: true },
          { id: 'e2', source: 'msg1', target: 'opts1', animated: true },
          { id: 'e3', source: 'opts1', target: 'offer1', sourceHandle: 'opt-0', label: 'Too expensive', animated: true },
          { id: 'e4', source: 'opts1', target: 'case1', sourceHandle: 'opt-1', label: 'Pet loss', animated: true },
          { id: 'e5', source: 'opts1', target: 'msg2', sourceHandle: 'opt-2', label: 'Moving', animated: true },
          { id: 'e6', source: 'opts1', target: 'api1', sourceHandle: 'opt-3', label: 'Other', animated: true },
          { id: 'e7', source: 'offer1', target: 'end1', animated: true },
          { id: 'e8', source: 'case1', target: 'end1', animated: true },
          { id: 'e9', source: 'msg2', target: 'end1', animated: true },
          { id: 'e10', source: 'api1', target: 'end1', animated: true }
        ]
      },
      pause_subscription: {
        id: 'pause_subscription',
        parentId: 'manage_subscription',
        name: 'Pause Subscription',
        description: 'Customer wants to temporarily pause deliveries',
        nodes: [
          { id: 'start', type: 'start', position: { x: 400, y: 0 }, data: { label: 'Start' } },
          { id: 'msg1', type: 'message', position: { x: 350, y: 120 }, data: { persona: 'amy', content: "No problem! How long would you like to pause?" } },
          { id: 'opts1', type: 'options', position: { x: 350, y: 280 }, data: { prompt: 'Pause duration', options: [{ label: '1 month' }, { label: '2 months' }, { label: '3 months' }] } },
          { id: 'api1', type: 'api', position: { x: 350, y: 480 }, data: { service: 'Shopify', endpoint: 'pauseSubscription' } },
          { id: 'msg2', type: 'message', position: { x: 350, y: 640 }, data: { persona: 'amy', content: "Done! Your subscription is paused. We'll resume on {{resumeDate}}." } },
          { id: 'end1', type: 'end', position: { x: 350, y: 800 }, data: { title: 'Paused!', showSurvey: true } }
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'msg1', animated: true },
          { id: 'e2', source: 'msg1', target: 'opts1', animated: true },
          { id: 'e3', source: 'opts1', target: 'api1', animated: true },
          { id: 'e4', source: 'api1', target: 'msg2', animated: true },
          { id: 'e5', source: 'msg2', target: 'end1', animated: true }
        ]
      },
      change_frequency: {
        id: 'change_frequency',
        parentId: 'manage_subscription',
        name: 'Change Delivery Frequency',
        description: 'Customer wants to adjust how often they receive deliveries',
        nodes: [
          { id: 'start', type: 'start', position: { x: 400, y: 0 }, data: { label: 'Start' } },
          { id: 'api1', type: 'api', position: { x: 350, y: 120 }, data: { service: 'Shopify', endpoint: 'getSubscription' } },
          { id: 'msg1', type: 'message', position: { x: 350, y: 280 }, data: { persona: 'amy', content: "Your current frequency is {{currentFrequency}}. What would you like to change it to?" } },
          { id: 'opts1', type: 'options', position: { x: 350, y: 440 }, data: { prompt: 'New frequency', options: [{ label: 'Every 2 weeks' }, { label: 'Every month' }, { label: 'Every 6 weeks' }, { label: 'Every 2 months' }] } },
          { id: 'api2', type: 'api', position: { x: 350, y: 640 }, data: { service: 'Shopify', endpoint: 'updateFrequency' } },
          { id: 'end1', type: 'end', position: { x: 350, y: 800 }, data: { title: 'Updated!', showSurvey: true } }
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'api1', animated: true },
          { id: 'e2', source: 'api1', target: 'msg1', animated: true },
          { id: 'e3', source: 'msg1', target: 'opts1', animated: true },
          { id: 'e4', source: 'opts1', target: 'api2', animated: true },
          { id: 'e5', source: 'api2', target: 'end1', animated: true }
        ]
      }
    }
  };

  // ============================================
  // CUSTOM NODE COMPONENTS (React Flow)
  // ============================================
  const createNodeComponents = () => {
    if (!ReactFlowLoaded) return {};

    const StartNode = ({ data, selected }) => {
      return React.createElement('div', {
        style: {
          padding: '16px 32px',
          borderRadius: '12px',
          background: '#22c55e',
          color: 'white',
          fontWeight: 600,
          fontSize: '15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          boxShadow: selected ? '0 0 0 2px #22c55e, 0 0 0 4px rgba(34, 197, 94, 0.2), 0 10px 15px -3px rgba(0,0,0,0.1)' : '0 10px 15px -3px rgba(0,0,0,0.1)',
          minWidth: '140px',
          cursor: 'pointer'
        }
      },
        React.createElement(Icons.Play, null),
        React.createElement('span', null, 'Start'),
        React.createElement(Handle, { type: 'source', position: Position.Bottom, style: { background: '#16a34a', width: '10px', height: '10px', border: '2px solid white' } })
      );
    };

    const MessageNode = ({ data, selected }) => {
      const personas = { amy: 'Amy', claudia: 'Claudia', sarah: 'Sarah' };
      return React.createElement('div', {
        style: {
          padding: '16px',
          borderRadius: '12px',
          background: 'white',
          border: selected ? '2px solid #3b82f6' : '2px solid #e5e7eb',
          boxShadow: selected ? '0 0 0 2px rgba(59, 130, 246, 0.2), 0 10px 15px -3px rgba(0,0,0,0.1)' : '0 10px 15px -3px rgba(0,0,0,0.1)',
          minWidth: '200px',
          maxWidth: '280px',
          cursor: 'pointer'
        }
      },
        React.createElement(Handle, { type: 'target', position: Position.Top, style: { background: '#3b82f6', width: '10px', height: '10px', border: '2px solid white' } }),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' } },
          React.createElement('div', { style: { width: '28px', height: '28px', borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' } }, React.createElement(Icons.MessageSquare, null)),
          React.createElement('span', { style: { fontSize: '13px', fontWeight: 500, color: '#6b7280' } }, personas[data.persona] || 'Amy')
        ),
        React.createElement('p', { style: { fontSize: '14px', color: '#374151', lineHeight: '1.5', margin: 0 } }, data.content || 'Hello! How can I help you today?'),
        React.createElement(Handle, { type: 'source', position: Position.Bottom, style: { background: '#3b82f6', width: '10px', height: '10px', border: '2px solid white' } })
      );
    };

    const OptionsNode = ({ data, selected }) => {
      return React.createElement('div', {
        style: { padding: '16px', borderRadius: '12px', background: 'white', border: selected ? '2px solid #8b5cf6' : '2px solid #e5e7eb', boxShadow: selected ? '0 0 0 2px rgba(139, 92, 246, 0.2), 0 10px 15px -3px rgba(0,0,0,0.1)' : '0 10px 15px -3px rgba(0,0,0,0.1)', minWidth: '200px', maxWidth: '280px', cursor: 'pointer' }
      },
        React.createElement(Handle, { type: 'target', position: Position.Top, style: { background: '#8b5cf6', width: '10px', height: '10px', border: '2px solid white' } }),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' } },
          React.createElement('div', { style: { width: '28px', height: '28px', borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' } }, React.createElement(Icons.List, null)),
          React.createElement('span', { style: { fontSize: '13px', fontWeight: 500, color: '#6b7280' } }, 'Options')
        ),
        React.createElement('p', { style: { fontSize: '14px', color: '#374151', marginBottom: '12px', fontWeight: 500 } }, data.prompt || 'What would you like to do?'),
        (data.options || []).slice(0, 3).map((opt, i) => React.createElement('div', { key: i, style: { fontSize: '12px', color: '#6b7280', padding: '8px 12px', background: '#f9fafb', borderRadius: '6px', marginBottom: '6px', border: '1px solid #e5e7eb' } }, opt.label)),
        React.createElement(Handle, { type: 'source', position: Position.Bottom, style: { background: '#8b5cf6', width: '10px', height: '10px', border: '2px solid white' } })
      );
    };

    const ConditionNode = ({ data, selected }) => {
      return React.createElement('div', {
        style: { padding: '16px', borderRadius: '12px', background: 'white', border: selected ? '2px solid #f59e0b' : '2px solid #e5e7eb', boxShadow: selected ? '0 0 0 2px rgba(245, 158, 11, 0.2), 0 10px 15px -3px rgba(0,0,0,0.1)' : '0 10px 15px -3px rgba(0,0,0,0.1)', minWidth: '180px', cursor: 'pointer' }
      },
        React.createElement(Handle, { type: 'target', position: Position.Top, style: { background: '#f59e0b', width: '10px', height: '10px', border: '2px solid white' } }),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' } },
          React.createElement('div', { style: { width: '28px', height: '28px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' } }, React.createElement(Icons.GitBranch, null)),
          React.createElement('span', { style: { fontSize: '13px', fontWeight: 500, color: '#6b7280' } }, 'Condition')
        ),
        React.createElement('p', { style: { fontSize: '13px', color: '#6b7280', fontFamily: 'monospace', margin: 0 } }, data.variable || '{{variable}}'),
        React.createElement(Handle, { type: 'source', position: Position.Bottom, id: 'yes', style: { background: '#22c55e', width: '10px', height: '10px', border: '2px solid white', left: '30%' } }),
        React.createElement(Handle, { type: 'source', position: Position.Bottom, id: 'no', style: { background: '#ef4444', width: '10px', height: '10px', border: '2px solid white', left: '70%' } })
      );
    };

    const ApiNode = ({ data, selected }) => {
      return React.createElement('div', {
        style: { padding: '16px', borderRadius: '12px', background: 'white', border: selected ? '2px solid #ec4899' : '2px solid #e5e7eb', boxShadow: selected ? '0 0 0 2px rgba(236, 72, 153, 0.2), 0 10px 15px -3px rgba(0,0,0,0.1)' : '0 10px 15px -3px rgba(0,0,0,0.1)', minWidth: '180px', cursor: 'pointer' }
      },
        React.createElement(Handle, { type: 'target', position: Position.Top, style: { background: '#ec4899', width: '10px', height: '10px', border: '2px solid white' } }),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' } },
          React.createElement('div', { style: { width: '28px', height: '28px', borderRadius: '50%', background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899' } }, React.createElement(Icons.Zap, null)),
          React.createElement('span', { style: { fontSize: '13px', fontWeight: 500, color: '#6b7280' } }, 'API Call')
        ),
        React.createElement('p', { style: { fontSize: '13px', color: '#374151', margin: 0 } }, `${data.service || 'Shopify'}, ${data.endpoint || 'lookup'}`),
        React.createElement(Handle, { type: 'source', position: Position.Bottom, style: { background: '#ec4899', width: '10px', height: '10px', border: '2px solid white' } })
      );
    };

    const AiNode = ({ data, selected }) => {
      return React.createElement('div', {
        style: { padding: '16px', borderRadius: '12px', background: 'white', border: selected ? '2px solid #6366f1' : '2px solid #e5e7eb', boxShadow: selected ? '0 0 0 2px rgba(99, 102, 241, 0.2), 0 10px 15px -3px rgba(0,0,0,0.1)' : '0 10px 15px -3px rgba(0,0,0,0.1)', minWidth: '200px', cursor: 'pointer' }
      },
        React.createElement(Handle, { type: 'target', position: Position.Top, style: { background: '#6366f1', width: '10px', height: '10px', border: '2px solid white' } }),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' } },
          React.createElement('div', { style: { width: '28px', height: '28px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' } }, React.createElement(Icons.Bot, null)),
          React.createElement('span', { style: { fontSize: '13px', fontWeight: 500, color: '#6b7280' } }, 'AI Response')
        ),
        React.createElement('p', { style: { fontSize: '13px', color: '#374151', margin: 0 } }, 'GPT-powered reply'),
        React.createElement('p', { style: { fontSize: '11px', color: '#9ca3af', marginTop: '4px' } }, data.model || 'gpt-4o-mini'),
        React.createElement(Handle, { type: 'source', position: Position.Bottom, style: { background: '#6366f1', width: '10px', height: '10px', border: '2px solid white' } })
      );
    };

    const OfferNode = ({ data, selected }) => {
      return React.createElement('div', {
        style: { padding: '20px', borderRadius: '12px', background: 'white', border: selected ? '2px solid #14b8a6' : '2px solid #e5e7eb', boxShadow: selected ? '0 0 0 2px rgba(20, 184, 166, 0.2), 0 10px 15px -3px rgba(0,0,0,0.1)' : '0 10px 15px -3px rgba(0,0,0,0.1)', minWidth: '220px', cursor: 'pointer' }
      },
        React.createElement(Handle, { type: 'target', position: Position.Top, style: { background: '#14b8a6', width: '10px', height: '10px', border: '2px solid white' } }),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' } },
          React.createElement('div', { style: { width: '32px', height: '32px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#14b8a6' } }, React.createElement(Icons.Gift, null)),
          React.createElement('span', { style: { fontSize: '14px', fontWeight: 500, color: '#14b8a6' } }, 'Offer Card')
        ),
        React.createElement('p', { style: { fontSize: '28px', fontWeight: 700, color: '#10b981', margin: 0 } }, `${data.percent || 20}% Refund`),
        React.createElement('p', { style: { fontSize: '14px', color: '#6b7280', marginTop: '6px', marginBottom: '16px' } }, data.label || 'Keep product'),
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-around', paddingTop: '12px', borderTop: '1px solid #f3f4f6' } },
          React.createElement('span', { style: { fontSize: '13px', fontWeight: 500, color: '#6b7280' } }, 'Accept'),
          React.createElement('span', { style: { fontSize: '13px', fontWeight: 500, color: '#6b7280' } }, 'Decline')
        ),
        React.createElement(Handle, { type: 'source', position: Position.Bottom, id: 'accept', style: { background: '#22c55e', width: '12px', height: '12px', border: '2px solid white', left: '25%' } }),
        React.createElement(Handle, { type: 'source', position: Position.Bottom, id: 'decline', style: { background: '#ef4444', width: '12px', height: '12px', border: '2px solid white', left: '75%' } })
      );
    };

    const CaseNode = ({ data, selected }) => {
      return React.createElement('div', {
        style: { padding: '16px', borderRadius: '12px', background: 'white', border: selected ? '2px solid #f97316' : '2px solid #e5e7eb', boxShadow: selected ? '0 0 0 2px rgba(249, 115, 22, 0.2), 0 10px 15px -3px rgba(0,0,0,0.1)' : '0 10px 15px -3px rgba(0,0,0,0.1)', minWidth: '180px', cursor: 'pointer' }
      },
        React.createElement(Handle, { type: 'target', position: Position.Top, style: { background: '#f97316', width: '10px', height: '10px', border: '2px solid white' } }),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' } },
          React.createElement('div', { style: { width: '28px', height: '28px', borderRadius: '50%', background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316' } }, React.createElement(Icons.FolderOpen, null)),
          React.createElement('span', { style: { fontSize: '13px', fontWeight: 500, color: '#6b7280' } }, 'Create Case')
        ),
        React.createElement('p', { style: { fontSize: '13px', color: '#374151', margin: 0 } }, 'Submit to Hub'),
        React.createElement('p', { style: { fontSize: '11px', color: '#9ca3af', marginTop: '4px' } }, `Type: ${data.type || 'refund'}`),
        React.createElement(Handle, { type: 'source', position: Position.Bottom, style: { background: '#f97316', width: '10px', height: '10px', border: '2px solid white' } })
      );
    };

    const FormNode = ({ data, selected }) => {
      return React.createElement('div', {
        style: { padding: '16px', borderRadius: '12px', background: 'white', border: selected ? '2px solid #10b981' : '2px solid #e5e7eb', boxShadow: selected ? '0 0 0 2px rgba(16, 185, 129, 0.2), 0 10px 15px -3px rgba(0,0,0,0.1)' : '0 10px 15px -3px rgba(0,0,0,0.1)', minWidth: '180px', cursor: 'pointer' }
      },
        React.createElement(Handle, { type: 'target', position: Position.Top, style: { background: '#10b981', width: '10px', height: '10px', border: '2px solid white' } }),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' } },
          React.createElement('div', { style: { width: '28px', height: '28px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' } }, React.createElement(Icons.FileText, null)),
          React.createElement('span', { style: { fontSize: '13px', fontWeight: 500, color: '#6b7280' } }, data.formType || 'Form')
        ),
        React.createElement('p', { style: { fontSize: '13px', color: '#374151', margin: 0 } }, data.label || 'Collect user input'),
        React.createElement(Handle, { type: 'source', position: Position.Bottom, style: { background: '#10b981', width: '10px', height: '10px', border: '2px solid white' } })
      );
    };

    const EndNode = ({ data, selected }) => {
      return React.createElement('div', {
        style: { padding: '16px 20px', borderRadius: '12px', background: '#ef4444', border: selected ? '2px solid #dc2626' : '2px solid #ef4444', boxShadow: selected ? '0 0 0 3px rgba(239, 68, 68, 0.3), 0 10px 15px -3px rgba(0,0,0,0.15)' : '0 10px 15px -3px rgba(0,0,0,0.1)', minWidth: '180px', cursor: 'pointer' }
      },
        React.createElement(Handle, { type: 'target', position: Position.Top, style: { background: '#fca5a5', width: '10px', height: '10px', border: '2px solid white' } }),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' } },
          React.createElement('div', { style: { color: 'white' } }, React.createElement(Icons.Flag, null)),
          React.createElement('span', { style: { fontSize: '14px', fontWeight: 600, color: 'white' } }, 'End')
        ),
        React.createElement('p', { style: { fontSize: '15px', color: 'rgba(255,255,255,0.9)', margin: 0, fontWeight: 500 } }, data.title || 'Thank You!')
      );
    };

    const SubflowNode = ({ data, selected }) => {
      return React.createElement('div', {
        style: { padding: '16px 20px', borderRadius: '12px', background: 'white', border: selected ? '2px dashed #8b5cf6' : '2px dashed #c4b5fd', boxShadow: selected ? '0 0 0 2px rgba(139, 92, 246, 0.2), 0 10px 15px -3px rgba(0,0,0,0.1)' : '0 4px 6px -1px rgba(0,0,0,0.05)', minWidth: '220px', cursor: 'pointer' }
      },
        React.createElement(Handle, { type: 'target', position: Position.Top, style: { background: '#8b5cf6', width: '10px', height: '10px', border: '2px solid white' } }),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' } },
          React.createElement('div', { style: { width: '28px', height: '28px', borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' } },
            React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
              React.createElement('path', { d: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' }),
              React.createElement('path', { d: 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' })
            )
          ),
          React.createElement('span', { style: { fontSize: '13px', fontWeight: 500, color: '#8b5cf6' } }, 'Subflow')
        ),
        React.createElement('p', { style: { fontSize: '15px', fontWeight: 600, color: '#374151', margin: 0 } }, data.name || 'Go to Subflow'),
        React.createElement('p', { style: { fontSize: '12px', color: '#8b5cf6', marginTop: '6px' } }, 'Click to view →'),
        React.createElement(Handle, { type: 'source', position: Position.Bottom, style: { background: '#8b5cf6', width: '10px', height: '10px', border: '2px solid white' } })
      );
    };

    return { start: StartNode, message: MessageNode, options: OptionsNode, condition: ConditionNode, api: ApiNode, ai: AiNode, offer: OfferNode, case: CaseNode, form: FormNode, end: EndNode, subflow: SubflowNode };
  };

  // ============================================
  // LEFT PANEL - SUBFLOW NAVIGATION
  // ============================================
  const LeftPanel = ({ parentFlow, currentSubflow, subflows, viewingEntry, onSelectSubflow, onSelectEntry, onBackToParent }) => {
    return React.createElement('div', { 
      style: { width: '260px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', flexShrink: 0 } 
    },
      React.createElement('div', { style: { padding: '16px', borderBottom: '1px solid #e5e7eb' } },
        React.createElement('button', { onClick: onBackToParent, style: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#6b7280', marginBottom: '12px' } }, 
          React.createElement(Icons.ArrowLeft, null), 'Back to Hub'
        ),
        React.createElement('div', { style: { padding: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' } },
          React.createElement('div', { style: { fontSize: '14px', fontWeight: 600, color: '#111827' } }, parentFlow?.name),
          React.createElement('div', { style: { fontSize: '12px', color: '#6b7280', marginTop: '4px' } }, `Viewing: ${currentSubflow?.name}`)
        )
      ),
      React.createElement('div', { style: { flex: 1, overflowY: 'auto', padding: '12px' } },
        React.createElement('div', { style: { fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: '8px', paddingLeft: '8px' } }, 'Entry Flow'),
        React.createElement('div', {
          onClick: onSelectEntry,
          style: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '16px', background: viewingEntry ? `${parentFlow?.color}15` : 'transparent', border: viewingEntry ? `1px solid ${parentFlow?.color}40` : '1px solid transparent' }
        },
          React.createElement('div', { style: { width: '8px', height: '8px', borderRadius: '50%', background: viewingEntry ? parentFlow?.color : '#d1d5db' } }),
          React.createElement('div', { style: { flex: 1 } },
            React.createElement('div', { style: { fontSize: '13px', fontWeight: viewingEntry ? 600 : 500, color: viewingEntry ? '#111827' : '#374151' } }, 'Entry Flow'),
            React.createElement('div', { style: { fontSize: '11px', color: '#9ca3af', marginTop: '2px' } }, `${parentFlow?.entryNodes?.length || 0} nodes`)
          )
        ),
        React.createElement('div', { style: { fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: '8px', paddingLeft: '8px' } }, 'Sub-flows'),
        subflows.map(subflow => 
          React.createElement('div', {
            key: subflow.id,
            onClick: () => onSelectSubflow(subflow),
            style: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '4px', background: !viewingEntry && currentSubflow?.id === subflow.id ? `${parentFlow?.color}15` : 'transparent', border: !viewingEntry && currentSubflow?.id === subflow.id ? `1px solid ${parentFlow?.color}40` : '1px solid transparent' }
          },
            React.createElement('div', { style: { width: '8px', height: '8px', borderRadius: '50%', background: !viewingEntry && currentSubflow?.id === subflow.id ? parentFlow?.color : '#d1d5db' } }),
            React.createElement('div', { style: { flex: 1, minWidth: 0 } },
              React.createElement('div', { style: { fontSize: '13px', fontWeight: !viewingEntry && currentSubflow?.id === subflow.id ? 600 : 500, color: !viewingEntry && currentSubflow?.id === subflow.id ? '#111827' : '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, subflow.name),
              React.createElement('div', { style: { fontSize: '11px', color: '#9ca3af', marginTop: '2px' } }, `${subflow.nodes?.length || 0} nodes`)
            )
          )
        )
      )
    );
  };

  // ============================================
  // PROPERTIES PANEL
  // ============================================
  const PropertiesPanel = ({ selectedNode }) => {
    if (!selectedNode) {
      return React.createElement('div', { style: { padding: '40px 24px', textAlign: 'center', color: '#9ca3af' } },
        React.createElement('div', { style: { width: '64px', height: '64px', background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#9ca3af' } },
          React.createElement('svg', { width: 32, height: 32, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
            React.createElement('circle', { cx: 12, cy: 12, r: 10 }),
            React.createElement('path', { d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' }),
            React.createElement('line', { x1: 12, y1: 17, x2: 12.01, y2: 17 })
          )
        ),
        React.createElement('p', { style: { fontSize: '14px' } }, 'Select a node'),
        React.createElement('p', { style: { fontSize: '12px', color: '#9ca3af', marginTop: '4px' } }, 'Click on any node in the canvas to view its properties and details')
      );
    }

    const getIcon = () => {
      const iconMap = { message: Icons.MessageSquare, options: Icons.List, condition: Icons.GitBranch, api: Icons.Zap, ai: Icons.Bot, offer: Icons.Gift, case: Icons.FolderOpen, form: Icons.FileText, end: Icons.Flag, start: Icons.Play };
      const IconComp = iconMap[selectedNode.type] || Icons.Play;
      return React.createElement(IconComp);
    };

    return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
      React.createElement('div', { style: { padding: '20px', borderBottom: '1px solid #f3f4f6' } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
          React.createElement('div', { style: { width: '40px', height: '40px', borderRadius: '10px', background: (nodeColors[selectedNode.type] || '#94a3b8') + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: nodeColors[selectedNode.type] || '#94a3b8' } }, getIcon()),
          React.createElement('div', null,
            React.createElement('h3', { style: { fontSize: '16px', fontWeight: 600, margin: 0, textTransform: 'capitalize', color: '#111827' } }, selectedNode.type === 'ai' ? 'AI Response' : selectedNode.type + ' Node'),
            React.createElement('p', { style: { fontSize: '12px', color: '#9ca3af', margin: 0, marginTop: '2px' } }, `ID: ${selectedNode.id}`)
          )
        )
      ),
      React.createElement('div', { style: { flex: 1, padding: '20px', overflowY: 'auto' } },
        React.createElement('div', { style: { marginBottom: '16px' } },
          React.createElement('span', { style: { display: 'inline-block', padding: '4px 10px', background: (nodeColors[selectedNode.type] || '#94a3b8') + '15', color: nodeColors[selectedNode.type] || '#94a3b8', borderRadius: '6px', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' } }, selectedNode.type)
        ),
        selectedNode.data?.persona && React.createElement('div', { style: { marginBottom: '16px' } },
          React.createElement('label', { style: { fontSize: '11px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' } }, 'Persona'),
          React.createElement('div', { style: { padding: '12px 14px', background: '#f9fafb', borderRadius: '10px', fontSize: '14px', border: '1px solid #e5e7eb' } }, selectedNode.data.persona === 'amy' ? 'Amy (Support)' : selectedNode.data.persona === 'claudia' ? 'Claudia (Trainer)' : selectedNode.data.persona)
        ),
        selectedNode.data?.content && React.createElement('div', { style: { marginBottom: '16px' } },
          React.createElement('label', { style: { fontSize: '11px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' } }, 'Message'),
          React.createElement('div', { style: { padding: '12px 14px', background: '#f9fafb', borderRadius: '10px', fontSize: '14px', border: '1px solid #e5e7eb', lineHeight: '1.5' } }, selectedNode.data.content)
        ),
        selectedNode.data?.service && React.createElement('div', { style: { marginBottom: '16px' } },
          React.createElement('label', { style: { fontSize: '11px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' } }, 'API Integration'),
          React.createElement('div', { style: { padding: '12px 14px', background: '#f9fafb', borderRadius: '10px', fontSize: '13px', border: '1px solid #e5e7eb', fontFamily: 'monospace' } }, `${selectedNode.data.service} / ${selectedNode.data.endpoint}`)
        ),
        selectedNode.data?.percent && React.createElement('div', { style: { marginBottom: '16px' } },
          React.createElement('label', { style: { fontSize: '11px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' } }, 'Offer'),
          React.createElement('div', { style: { padding: '16px', background: '#d1fae5', borderRadius: '10px', border: '1px solid #10b981' } },
            React.createElement('div', { style: { fontSize: '24px', fontWeight: 700, color: '#10b981' } }, `${selectedNode.data.percent}% Refund`),
            React.createElement('div', { style: { fontSize: '13px', color: '#047857', marginTop: '4px' } }, selectedNode.data.label)
          )
        )
      )
    );
  };

  // ============================================
  // FLOW CANVAS COMPONENT (React Flow)
  // ============================================
  const FlowCanvas = ({ subflow, parentFlow, allSubflows, viewingEntry, onSelectSubflow, onSelectEntry, onSubflowNodeClick, onBackToFlows }) => {
    if (!ReactFlowLoaded) {
      return React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280' } },
        React.createElement('p', null, 'Loading React Flow...')
      );
    }

    const nodeTypes = useMemo(() => createNodeComponents(), []);
    const [nodes, setNodes, onNodesChange] = useNodesState(subflow.nodes || []);
    const [edges, setEdges, onEdgesChange] = useEdgesState(subflow.edges || []);
    const [selectedNode, setSelectedNode] = useState(null);

    useEffect(() => {
      setNodes(subflow.nodes || []);
      setEdges(subflow.edges || []);
      setSelectedNode(null);
    }, [subflow.id]);

    const onNodeClick = useCallback((event, node) => {
      setSelectedNode(node);
      if (node.type === 'subflow' && node.data?.slug) {
        onSubflowNodeClick(node.data.slug);
      }
    }, [onSubflowNodeClick]);

    const defaultEdgeOptions = { type: 'smoothstep', animated: true, style: { strokeWidth: 2, stroke: '#94a3b8' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' } };

    return React.createElement('div', { style: { display: 'flex', height: '100%' } },
      React.createElement(LeftPanel, {
        parentFlow: parentFlow,
        currentSubflow: subflow,
        subflows: allSubflows,
        viewingEntry: viewingEntry,
        onSelectSubflow: onSelectSubflow,
        onSelectEntry: onSelectEntry,
        onBackToParent: onBackToFlows
      }),
      React.createElement('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #fef7f0 0%, #fdf2f8 25%, #f5f3ff 50%, #eff6ff 75%, #f0fdf4 100%)' } },
        React.createElement('div', { style: { flex: 1 } },
          React.createElement(ReactFlowComponent, {
            nodes: nodes,
            edges: edges,
            onNodesChange: onNodesChange,
            onEdgesChange: onEdgesChange,
            onNodeClick: onNodeClick,
            nodeTypes: nodeTypes,
            defaultEdgeOptions: defaultEdgeOptions,
            fitView: true,
            fitViewOptions: { padding: 0.2 }
          },
            React.createElement(Background, { variant: 'dots', gap: 20, size: 1, color: '#e2e8f0' }),
            React.createElement(Controls, null),
            React.createElement(MiniMap, { nodeColor: (n) => nodeColors[n.type] || '#94a3b8', maskColor: 'rgba(255,255,255,0.8)' })
          )
        )
      ),
      React.createElement('div', { style: { width: '320px', background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(8px)', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', flexShrink: 0 } },
        React.createElement(PropertiesPanel, { selectedNode: selectedNode })
      )
    );
  };

  // ============================================
  // FLOW SETTINGS (Main Entry View)
  // ============================================
  const FlowSettings = ({ onSelectParent }) => {
    const cardStyle = { background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '24px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' };

    return React.createElement('div', { style: { padding: '32px', height: '100%', overflow: 'auto' } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' } },
        React.createElement(Icons.Settings, { style: { width: '32px', height: '32px', color: '#6b7280' } }),
        React.createElement('h1', { style: { fontSize: '28px', fontWeight: 600, color: '#111827', margin: 0, fontFamily: "'Space Grotesk', sans-serif" } }, 'Flow Settings')
      ),
      React.createElement('p', { style: { color: '#6b7280', marginBottom: '32px' } }, 'Configure what customers see and experience in each flow'),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' } },
        FLOW_DATA.parentFlows.map(flow => 
          React.createElement('div', {
            key: flow.id,
            style: cardStyle,
            onClick: () => onSelectParent(flow),
            onMouseEnter: e => { e.currentTarget.style.borderColor = flow.color; e.currentTarget.style.boxShadow = `0 8px 24px ${flow.color}20`; e.currentTarget.style.transform = 'translateY(-2px)'; },
            onMouseLeave: e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }
          },
            React.createElement('div', { style: { display: 'flex', alignItems: 'flex-start', gap: '16px' } },
              React.createElement('div', { style: { width: '56px', height: '56px', background: `${flow.color}15`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 } }, flow.icon),
              React.createElement('div', { style: { flex: 1 } },
                React.createElement('div', { style: { fontWeight: 600, fontSize: '16px', marginBottom: '4px' } }, flow.name),
                React.createElement('div', { style: { fontSize: '14px', color: '#6b7280', marginBottom: '12px' } }, flow.description),
                React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px' } },
                  (flow.tags || []).map((tag, i) => React.createElement('span', { key: i, style: { padding: '4px 8px', background: '#f3f4f6', borderRadius: '6px', fontSize: '12px', color: '#6b7280' } }, tag))
                )
              )
            ),
            React.createElement('div', { style: { marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' } },
              React.createElement('div', { style: { width: '32px', height: '32px', background: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' } },
                React.createElement(Icons.ChevronRight, null)
              )
            )
          )
        )
      )
    );
  };

  // ============================================
  // MAIN APP COMPONENT
  // ============================================
  const FlowDocsApp = () => {
    const [view, setView] = useState('settings');
    const [selectedParent, setSelectedParent] = useState(null);
    const [selectedSubflow, setSelectedSubflow] = useState(null);
    const [viewingEntry, setViewingEntry] = useState(false);

    const handleSelectParent = (parent) => {
      setSelectedParent(parent);
      const firstSubflowId = parent.subflows[0];
      const firstSubflow = FLOW_DATA.subflows[firstSubflowId];
      setSelectedSubflow(firstSubflow);
      setViewingEntry(false);
      setView('canvas');
    };

    const handleSelectSubflow = (subflow) => {
      setSelectedSubflow(subflow);
      setViewingEntry(false);
    };

    const handleSelectEntry = () => {
      setSelectedSubflow({ id: 'entry', name: 'Entry Flow', nodes: selectedParent.entryNodes, edges: selectedParent.entryEdges });
      setViewingEntry(true);
    };

    const handleSubflowNodeClick = (slug) => {
      const subflow = FLOW_DATA.subflows[slug];
      if (subflow) {
        setSelectedSubflow(subflow);
        setViewingEntry(false);
      }
    };

    const handleBackToFlows = () => {
      setSelectedParent(null);
      setSelectedSubflow(null);
      setViewingEntry(false);
      setView('settings');
    };

    const allSubflows = selectedParent ? selectedParent.subflows.map(id => FLOW_DATA.subflows[id]).filter(Boolean) : [];

    if (view === 'canvas' && selectedSubflow && selectedParent) {
      return React.createElement(FlowCanvas, {
        subflow: selectedSubflow,
        parentFlow: selectedParent,
        allSubflows: allSubflows,
        viewingEntry: viewingEntry,
        onSelectSubflow: handleSelectSubflow,
        onSelectEntry: handleSelectEntry,
        onSubflowNodeClick: handleSubflowNodeClick,
        onBackToFlows: handleBackToFlows
      });
    }

    return React.createElement(FlowSettings, { onSelectParent: handleSelectParent });
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

  console.log('FlowDocsReact loaded and ready (React Flow version)');
})();
