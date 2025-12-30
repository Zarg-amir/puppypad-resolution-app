// PuppyPad Resolution Worker v1.0

/**
 * PuppyPad Resolution Worker
 * Backend API for the Resolution App
 */

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
    const lineItems = processLineItems(order.line_items);
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
      shippingAddress: order.shipping_address,
      billingAddress: order.billing_address,
      lineItems,
      clientOrderId,
    };
  }));

  return Response.json({ orders: processedOrders }, { headers: corsHeaders });
}

// Process line items with images and product type detection
function processLineItems(lineItems) {
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
      productType,
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
  const noteAttrs = order.note_attributes || [];
  const clientOrderIdAttr = noteAttrs.find(attr => 
    attr.name === 'clientOrderId' || attr.name === 'client_order_id'
  );
  if (clientOrderIdAttr) return clientOrderIdAttr.value;

  if (order.note) {
    const match = order.note.match(/clientOrderId[:\s]+(\d+)/i);
    if (match) return match[1];
  }

  return null;
}

// ============================================
// PARCEL PANEL TRACKING
// ============================================
async function handleTracking(request, env, corsHeaders) {
  const { orderNumber, trackingNumber, orderId } = await request.json();

  let url = 'https://open.parcelpanel.com/api/v2/tracking/order?';
  if (orderNumber) {
    url += `order_number=${encodeURIComponent(orderNumber)}`;
  } else if (trackingNumber) {
    url += `tracking_number=${encodeURIComponent(trackingNumber)}`;
  } else if (orderId) {
    url += `order_id=${encodeURIComponent(orderId)}`;
  }

  const response = await fetch(url, {
    headers: {
      'x-parcelpanel-api-key': env.PARCELPANEL_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    return Response.json({ error: 'Tracking lookup failed' }, { status: 500, headers: corsHeaders });
  }

  const data = await response.json();
  const shipments = data.order?.shipments || [];
  const shipment = shipments[0];

  if (!shipment) {
    return Response.json({ tracking: null, message: 'No tracking found' }, { headers: corsHeaders });
  }

  // Calculate days in transit
  const firstCheckpoint = shipment.checkpoints?.[shipment.checkpoints.length - 1];
  let daysInTransit = 0;
  
  if (firstCheckpoint?.checkpoint_time) {
    const startDate = new Date(firstCheckpoint.checkpoint_time);
    const now = new Date();
    daysInTransit = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
  }

  return Response.json({
    tracking: {
      status: shipment.status,
      statusLabel: shipment.status_label,
      trackingNumber: shipment.tracking_number,
      carrier: shipment.carrier,
      deliveryDate: shipment.delivery_date,
      estimatedDelivery: shipment.estimated_delivery_date,
      checkpoints: shipment.checkpoints || [],
      daysInTransit,
    }
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

  const listId = getClickUpListId(caseData.caseType);

  // Create ClickUp task
  const clickupTask = await createClickUpTask(env, listId, {
    ...caseData,
    caseId,
  });

  // Log to analytics
  await logAnalytics(env, {
    caseId,
    caseType: caseData.caseType,
    resolution: caseData.resolution,
    resolvedInApp: caseData.resolvedInApp || false,
    customerEmail: caseData.email,
    orderNumber: caseData.orderNumber,
    timestamp: now.toISOString(),
  });

  return Response.json({ 
    success: true, 
    caseId,
    clickupTaskId: clickupTask?.id,
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
  const listIds = {
    'refund': '901518836463',
    'return': '901519002456',
    'shipping': '901519012573',
    'subscription': '901518836463',
    'manual': '901518836463',
  };
  return listIds[caseType] || '901518836463';
}

async function createClickUpTask(env, listId, caseData) {
  const customFields = [
    { id: '8edc1dca-f349-4663-ab04-be7e1a1c6732', value: caseData.caseId },
    { id: '200cbfa0-5bdf-4a90-910e-986ee1fbbed1', value: caseData.email },
    { id: '44a77a25-2b98-4b79-b1f0-caf2a67a137a', value: caseData.resolution },
    { id: '5f89f376-9bf7-45dd-a06b-ffafda305260', value: caseData.orderNumber },
  ];

  if (caseData.refundAmount) {
    customFields.push({ id: '3a85cb2e-2607-487c-9aaf-5d22b018aae2', value: caseData.refundAmount });
  }

  if (caseData.orderUrl) {
    customFields.push({ id: '71ece2eb-d082-4135-8a11-fb6a1b1c90f4', value: caseData.orderUrl });
  }

  if (caseData.selectedItems) {
    customFields.push({ id: 'aabe9246-54fd-4b8b-b8e2-09347265aa06', value: JSON.stringify(caseData.selectedItems) });
  }

  const taskBody = {
    name: caseData.customerName,
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

// ============================================
// CHECK EXISTING CASE (DEDUPE)
// ============================================
async function handleCheckCase(request, env, corsHeaders) {
  const { orderNumber } = await request.json();

  const lists = ['901518836463', '901519002456', '901519012573'];
  
  for (const listId of lists) {
    const response = await fetch(
      `https://api.clickup.com/api/v2/list/${listId}/task?custom_fields=[{"field_id":"5f89f376-9bf7-45dd-a06b-ffafda305260","operator":"=","value":"${orderNumber}"}]`,
      {
        headers: {
          'Authorization': env.CLICKUP_API_KEY,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.tasks && data.tasks.length > 0) {
        return Response.json({ 
          existingCase: true, 
          taskId: data.tasks[0].id,
          taskUrl: data.tasks[0].url,
        }, { headers: corsHeaders });
      }
    }
  }

  return Response.json({ existingCase: false }, { headers: corsHeaders });
}

// ============================================
// AI RESPONSE (AMY / CLAUDIA)
// ============================================
async function handleAIResponse(request, env, corsHeaders) {
  const { persona, context, productName, customerInput, methodsTried } = await request.json();

  let productDoc = '';
  if (productName) {
    productDoc = await getProductDoc(env, productName);
  }

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
  if (message.length < 300) return [message];

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

  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    return Response.json({ error: 'Please upload a JPG or PNG image' }, { status: 400, headers: corsHeaders });
  }

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
      INSERT INTO cases (case_id, case_type, resolution, resolved_in_app, customer_email, order_number, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.caseId,
      data.caseType,
      data.resolution,
      data.resolvedInApp ? 1 : 0,
      data.customerEmail || '',
      data.orderNumber || '',
      data.timestamp
    ).run();
  } catch (e) {
    console.error('Analytics logging failed:', e);
  }
}
