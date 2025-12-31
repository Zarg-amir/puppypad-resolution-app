/**
 * PuppyPad Resolution Worker
 * Backend API for the Resolution App
 */

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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS headers for frontend
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
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

      // Get subscription
      if (pathname === '/api/subscription' && request.method === 'POST') {
        return await handleSubscription(request, env, corsHeaders);
      }

      // Create case
      if (pathname === '/api/create-case' && request.method === 'POST') {
        return await handleCreateCase(request, env, corsHeaders);
      }

      // Check existing case
      if (pathname === '/api/check-case' && request.method === 'POST') {
        return await handleCheckCase(request, env, corsHeaders);
      }

      // AI response (Amy/Claudia)
      if (pathname === '/api/ai-response' && request.method === 'POST') {
        return await handleAIResponse(request, env, corsHeaders);
      }

      // Upload evidence
      if (pathname === '/api/upload-evidence' && request.method === 'POST') {
        return await handleUploadEvidence(request, env, corsHeaders);
      }

      // Serve audio files
      if (pathname.startsWith('/audio/')) {
        return await handleAudio(pathname, env, corsHeaders);
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
  const { email, phone, firstName, lastName, orderNumber, address1 } = await request.json();

  // Build Shopify search query
  let query = '';
  if (email) {
    query = `email:${email}`;
  } else if (phone) {
    query = `phone:${phone}`;
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

  const shopifyUrl = `https://${env.SHOPIFY_STORE}/admin/api/2024-01/orders.json?status=any&limit=10&query=${encodeURIComponent(query)}`;

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
  const orders = data.orders || [];

  // Process orders - extract line items with images and product type
  const processedOrders = await Promise.all(orders.map(async (order) => {
    const lineItems = await processLineItems(order.line_items, env);
    const clientOrderId = extractClientOrderId(order);
    
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
// PARCEL PANEL TRACKING (FIXED API URL)
// ============================================
async function handleTracking(request, env, corsHeaders) {
  const { orderNumber, trackingNumber } = await request.json();

  // Use correct ParcelPanel API v3 endpoint
  let url = 'https://api.parcelpanel.com/api/v3/parcels?';
  if (orderNumber) {
    const cleanOrder = orderNumber.replace('#', '');
    url += `order_number=${encodeURIComponent(cleanOrder)}`;
  } else if (trackingNumber) {
    url += `tracking_number=${encodeURIComponent(trackingNumber)}`;
  } else {
    return Response.json({ tracking: null, message: 'No identifier provided' }, { headers: corsHeaders });
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${env.PARCELPANEL_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    return Response.json({ tracking: null, message: 'Tracking lookup failed' }, { headers: corsHeaders });
  }

  const data = await response.json();
  const parcels = data.data || [];

  if (parcels.length === 0) {
    return Response.json({ tracking: null, message: 'No tracking found' }, { headers: corsHeaders });
  }

  // Process all parcels
  const trackingResults = parcels.map(parcel => {
    const checkpoints = parcel.checkpoints || [];
    let daysInTransit = 0;
    
    if (checkpoints.length > 0) {
      const firstCheckpoint = checkpoints[checkpoints.length - 1];
      if (firstCheckpoint?.checkpoint_time) {
        const startDate = new Date(firstCheckpoint.checkpoint_time);
        daysInTransit = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24));
      }
    }

    return {
      trackingNumber: parcel.tracking_number,
      carrier: parcel.courier_code,
      status: parcel.delivery_status,
      statusLabel: formatTrackingStatus(parcel.delivery_status),
      deliveryDate: parcel.delivery_date,
      estimatedDelivery: parcel.expected_delivery,
      checkpoints: checkpoints.slice(0, 10),
      daysInTransit,
      lastUpdate: checkpoints[0]?.checkpoint_time || null
    };
  });

  return Response.json({
    tracking: trackingResults[0],
    allTracking: trackingResults
  }, { headers: corsHeaders });
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
  await createRichpanelEntry(env, caseData, caseId);

  // Log to analytics
  await logAnalytics(env, {
    caseId,
    caseType: caseData.caseType,
    resolution: caseData.resolution,
    resolvedInApp: caseData.resolvedInApp || false,
    timestamp: now.toISOString(),
  });

  return Response.json({ 
    success: true, 
    caseId,
    clickupTaskId: clickupTask?.id,
    clickupTaskUrl: clickupTask?.url,
  }, { headers: corsHeaders });
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

async function createClickUpTask(env, listId, caseData) {
  // Build custom fields array
  const customFields = [
    { id: CLICKUP_CONFIG.fields.caseId, value: caseData.caseId },
    { id: CLICKUP_CONFIG.fields.emailAddress, value: caseData.email || '' },
    { id: CLICKUP_CONFIG.fields.resolution, value: caseData.resolution || '' },
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

  const taskBody = {
    name: caseData.customerName || 'Unknown Customer', // Task title is customer name only
    description: caseData.description || '',
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

  // Add comment with action steps
  if (caseData.comment) {
    await fetch(`https://api.clickup.com/api/v2/task/${task.id}/comment`, {
      method: 'POST',
      headers: {
        'Authorization': env.CLICKUP_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment_text: caseData.comment }),
    });
  }

  return task;
}

async function createRichpanelEntry(env, caseData, caseId) {
  // Create customer email (proof of request)
  const emailBody = `
Case ID: ${caseId}
Order: ${caseData.orderNumber}
Request: ${caseData.resolution}

Customer Details:
Name: ${caseData.customerName}
Email: ${caseData.email}

Selected Items:
${caseData.selectedItems?.map(item => `- ${item.title} (${item.sku})`).join('\n') || 'N/A'}

Additional Notes:
${caseData.notes || 'None'}
  `.trim();

  // Note: Implement actual Richpanel API calls here
  // This is a placeholder structure
  console.log('Richpanel entry would be created:', { caseId, emailBody });
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
// AI RESPONSE (AMY / CLAUDIA)
// ============================================
async function handleAIResponse(request, env, corsHeaders) {
  const { persona, context, productName, customerInput, methodsTried } = await request.json();

  // Get product doc from R2 if needed
  let productDoc = '';
  if (productName) {
    productDoc = await getProductDoc(env, productName);
  }

  // Build prompt based on persona
  const systemPrompt = persona === 'claudia' 
    ? buildClaudiaPrompt(productDoc, methodsTried)
    : buildAmyPrompt(productDoc, context);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: customerInput },
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    return Response.json({ error: 'AI response failed' }, { status: 500, headers: corsHeaders });
  }

  const data = await response.json();
  const message = data.choices[0]?.message?.content || '';

  // Split into multiple messages if too long
  const messages = splitMessage(message);

  return Response.json({ messages }, { headers: corsHeaders });
}

async function getProductDoc(env, productName) {
  const productDocMap = {
    'puppypad': 'PuppyPad-_Reusable-Pee-Pad_-_1_.txt',
    'pee pad': 'PuppyPad-_Reusable-Pee-Pad_-_1_.txt',
    'busypet': 'BusyPet.txt',
    'calmbuddy': 'CalmBuddy Premium Diffuser Kit.txt',
    'cozybed': 'CozyBed (1).txt',
    'laundry': 'Laundry-Detergent-Sheets.txt',
    'stain': 'Stain-and-Odor-Eliminator.txt',
  };

  const lowerName = productName.toLowerCase();
  let filename = null;

  for (const [key, value] of Object.entries(productDocMap)) {
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

function buildAmyPrompt(productDoc, context) {
  return `You are Amy from PuppyPad customer support. You are warm, caring, and helpful.

Your characteristics:
- Warm and heartwarming tone
- Use occasional emojis like 🙂 ❤️ but don't overuse them
- Sound like a real human friend, not a corporate bot
- Be empathetic and understanding
- Keep responses concise but caring

Product knowledge:
${productDoc}

Context: ${context || 'General customer support'}

Respond naturally to help the customer. If tackling an objection, be persuasive but genuine about the product's value.`;
}

function buildClaudiaPrompt(productDoc, methodsTried) {
  return `You are Claudia, an in-house veterinarian at PuppyPad. You specialize in helping customers train their dogs to use PuppyPad products.

Your characteristics:
- Professional but warm and friendly
- Knowledgeable about dog behavior and training
- Encouraging and supportive
- Provide specific, actionable tips
- Sound like a trusted friend who happens to be an expert

Product knowledge:
${productDoc}

Methods the customer has already tried (DO NOT suggest these again):
${methodsTried || 'None specified'}

Provide personalized training tips based on the dog's information. Be specific and helpful. Make the customer feel confident they can succeed.`;
}

function splitMessage(message) {
  // If message is short, return as single message
  if (message.length < 300) return [message];

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
// ANALYTICS LOGGING
// ============================================
async function logAnalytics(env, data) {
  try {
    await env.ANALYTICS_DB.prepare(`
      INSERT INTO cases (case_id, case_type, resolution, resolved_in_app, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      data.caseId,
      data.caseType,
      data.resolution,
      data.resolvedInApp ? 1 : 0,
      data.timestamp
    ).run();
  } catch (e) {
    console.error('Analytics logging failed:', e);
  }
}
