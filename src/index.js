/**
 * PuppyPad Resolution Worker v2.0
 * Complete Backend API with ClickUp Integration
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

const CASE_PREFIXES = { refund: 'REF', return: 'RET', shipping: 'SHP', subscription: 'SUB', manual: 'MAN' };

// ============================================
// MAIN WORKER
// ============================================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (pathname === '/api/health') {
        return Response.json({ status: 'ok', timestamp: new Date().toISOString(), version: '2.0' }, { headers: corsHeaders });
      }
      if (pathname === '/api/lookup-order' && request.method === 'POST') {
        return await handleLookupOrder(request, env, corsHeaders);
      }
      if (pathname === '/api/tracking' && request.method === 'POST') {
        return await handleTracking(request, env, corsHeaders);
      }
      if (pathname === '/api/subscription' && request.method === 'POST') {
        return await handleSubscription(request, env, corsHeaders);
      }
      if (pathname === '/api/create-case' && request.method === 'POST') {
        return await handleCreateCase(request, env, corsHeaders);
      }
      if (pathname === '/api/check-case' && request.method === 'POST') {
        return await handleCheckCase(request, env, corsHeaders);
      }
      if (pathname === '/api/ai-response' && request.method === 'POST') {
        return await handleAIResponse(request, env, corsHeaders);
      }
      if (pathname === '/api/upload-evidence' && request.method === 'POST') {
        return await handleUploadEvidence(request, env, corsHeaders);
      }
      if (pathname.startsWith('/audio/')) {
        return await handleAudio(pathname, env, corsHeaders);
      }
      return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Worker error:', error);
      return Response.json({ error: 'Internal server error', details: error.message }, { status: 500, headers: corsHeaders });
    }
  }
};

// ============================================
// SHOPIFY ORDER LOOKUP
// ============================================
async function handleLookupOrder(request, env, corsHeaders) {
  const { email, phone, firstName, lastName, orderNumber, address1 } = await request.json();

  let query = '';
  if (email) query = `email:${email}`;
  else if (phone) query = `phone:${phone}`;

  if (orderNumber) {
    const cleanOrderNumber = orderNumber.replace('#', '').replace(/P$/i, '');
    query += ` name:#${cleanOrderNumber}`;
  }
  if (firstName) query += ` billing_address.first_name:${firstName}`;
  if (lastName) query += ` billing_address.last_name:${lastName}`;
  if (address1) query += ` shipping_address.address1:*${address1}*`;

  const shopifyUrl = `https://${env.SHOPIFY_STORE}/admin/api/2024-01/orders.json?status=any&limit=10&query=${encodeURIComponent(query)}`;

  const response = await fetch(shopifyUrl, {
    headers: { 'X-Shopify-Access-Token': env.SHOPIFY_API_KEY, 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    return Response.json({ error: 'Shopify lookup failed' }, { status: 500, headers: corsHeaders });
  }

  const data = await response.json();
  const orders = data.orders || [];

  // Get product images
  const productIds = [...new Set(orders.flatMap(o => o.line_items.map(i => i.product_id)).filter(Boolean))];
  const productImageMap = await fetchProductImages(env, productIds);

  // Get tracking for each order
  const processedOrders = await Promise.all(orders.map(async (order) => {
    const lineItems = processLineItems(order.line_items, productImageMap);
    const clientOrderId = extractClientOrderId(order);
    
    // Get tracking info from ParcelPanel
    let trackingInfo = null;
    try {
      const trackingResponse = await fetchParcelPanelTracking(env, order.name);
      trackingInfo = trackingResponse;
    } catch (e) {
      console.error('Tracking fetch error:', e);
    }
    
    return {
      id: order.id,
      orderNumber: order.name,
      email: order.email,
      phone: order.phone,
      createdAt: order.created_at,
      financialStatus: order.financial_status,
      fulfillmentStatus: order.fulfillment_status,
      totalPrice: order.total_price,
      subtotalPrice: order.subtotal_price,
      currency: order.currency,
      customerName: `${order.billing_address?.first_name || ''} ${order.billing_address?.last_name || ''}`.trim(),
      customerFirstName: order.billing_address?.first_name || order.customer?.first_name || '',
      customerLastName: order.billing_address?.last_name || order.customer?.last_name || '',
      shippingAddress: order.shipping_address,
      billingAddress: order.billing_address,
      lineItems,
      clientOrderId,
      orderUrl: `https://${env.SHOPIFY_STORE}/admin/orders/${order.id}`,
      paymentMethod: order.payment_gateway_names?.[0] || 'Unknown',
      note: order.note,
      tags: order.tags,
      fulfillments: order.fulfillments || [],
      tracking: trackingInfo
    };
  }));

  return Response.json({ orders: processedOrders }, { headers: corsHeaders });
}

async function fetchProductImages(env, productIds) {
  const imageMap = {};
  for (const productId of productIds.slice(0, 20)) {
    try {
      const response = await fetch(
        `https://${env.SHOPIFY_STORE}/admin/api/2024-01/products/${productId}.json?fields=id,images,variants`,
        { headers: { 'X-Shopify-Access-Token': env.SHOPIFY_API_KEY, 'Content-Type': 'application/json' } }
      );
      if (response.ok) {
        const data = await response.json();
        const product = data.product;
        if (product.images?.[0]) imageMap[`product_${productId}`] = product.images[0].src;
        product.variants?.forEach(variant => {
          const variantImage = product.images?.find(img => img.id === variant.image_id);
          if (variantImage) imageMap[`variant_${variant.id}`] = variantImage.src;
        });
      }
    } catch (e) { console.error(`Error fetching product ${productId}:`, e); }
  }
  return imageMap;
}

function processLineItems(lineItems, productImageMap) {
  return lineItems.map(item => {
    const productTypeProperty = (item.properties || []).find(p => p.name === 'productType' || p.name === 'product_type');
    const productType = productTypeProperty?.value || null;
    const variantImage = productImageMap[`variant_${item.variant_id}`];
    const productImage = productImageMap[`product_${item.product_id}`];
    const itemImage = variantImage || productImage || item.image?.src || null;
    const isFree = parseFloat(item.price) === 0;
    const isDigital = item.requires_shipping === false || item.title?.toLowerCase().includes('ebook') || item.title?.toLowerCase().includes('digital') || item.sku?.toLowerCase().includes('ebook');
    const isPuppyPad = item.title?.toLowerCase().includes('puppypad') || item.title?.toLowerCase().includes('puppy pad') || item.title?.toLowerCase().includes('pee pad') || item.title?.toLowerCase().includes('training pad');

    return {
      id: item.id, productId: item.product_id, variantId: item.variant_id,
      title: item.title, variantTitle: item.variant_title, sku: item.sku,
      quantity: item.quantity, price: item.price, image: itemImage,
      fulfillmentStatus: item.fulfillment_status, productType, isFree, isDigital, isPuppyPad
    };
  });
}

function extractClientOrderId(order) {
  const noteAttrs = order.note_attributes || [];
  const clientOrderIdAttr = noteAttrs.find(attr => attr.name === 'clientOrderId' || attr.name === 'client_order_id' || attr.name === 'cc_order_id');
  if (clientOrderIdAttr) return clientOrderIdAttr.value;
  if (order.note) {
    const match = order.note.match(/clientOrderId[:\s]+(\d+)/i);
    if (match) return match[1];
  }
  if (order.tags) {
    const match = order.tags.match(/cc[_-]?order[_-]?id[:\s]*(\d+)/i);
    if (match) return match[1];
  }
  return null;
}

// ============================================
// PARCEL PANEL TRACKING
// ============================================
async function handleTracking(request, env, corsHeaders) {
  const { orderNumber, trackingNumber } = await request.json();
  const trackingResult = await fetchParcelPanelTracking(env, orderNumber, trackingNumber);
  return Response.json(trackingResult, { headers: corsHeaders });
}

async function fetchParcelPanelTracking(env, orderNumber, trackingNumber) {
  let url = 'https://api.parcelpanel.com/api/v3/parcels?';
  if (orderNumber) {
    const cleanOrder = orderNumber.replace('#', '');
    url = `https://api.parcelpanel.com/api/v3/parcels?order_number=${encodeURIComponent(cleanOrder)}`;
  } else if (trackingNumber) {
    url = `https://api.parcelpanel.com/api/v3/parcels?tracking_number=${encodeURIComponent(trackingNumber)}`;
  } else {
    return { tracking: null, message: 'No identifier provided' };
  }

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${env.PARCELPANEL_API_KEY}`, 'Content-Type': 'application/json' },
  });

  if (!response.ok) return { tracking: null, message: 'Tracking lookup failed' };

  const data = await response.json();
  const parcels = data.data || [];
  if (parcels.length === 0) return { tracking: null, message: 'No tracking found' };

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

  return { tracking: trackingResults[0], allTracking: trackingResults };
}

function formatTrackingStatus(status) {
  const statusMap = {
    'pending': 'Pending', 'info_received': 'Info Received', 'in_transit': 'In Transit',
    'out_for_delivery': 'Out for Delivery', 'delivered': 'Delivered',
    'failed_attempt': 'Failed Delivery', 'exception': 'Exception', 'expired': 'Expired', 'pickup': 'Ready for Pickup'
  };
  return statusMap[status] || status;
}

// ============================================
// CHECKOUTCHAMP SUBSCRIPTION
// ============================================
async function handleSubscription(request, env, corsHeaders) {
  const { clientOrderId } = await request.json();
  if (!clientOrderId) return Response.json({ error: 'clientOrderId required' }, { status: 400, headers: corsHeaders });

  const authHeader = 'Basic ' + btoa(`${env.CC_API_USERNAME}:${env.CC_API_PASSWORD}`);
  const orderResponse = await fetch(`https://api.checkoutchamp.com/order/${clientOrderId}`, {
    headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
  });

  if (!orderResponse.ok) return Response.json({ error: 'CheckoutChamp order lookup failed' }, { status: 500, headers: corsHeaders });

  const orderData = await orderResponse.json();
  const purchases = orderData.result?.purchases || [];

  const subscriptions = await Promise.all(purchases.map(async (purchase) => {
    try {
      const purchaseResponse = await fetch(`https://api.checkoutchamp.com/purchase/${purchase.purchaseId}`, {
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
      });
      if (!purchaseResponse.ok) return null;
      const purchaseData = await purchaseResponse.json();
      const p = purchaseData.result;
      return {
        purchaseId: purchase.purchaseId, productName: p.productName, productId: p.productId,
        status: p.status, lastBillingDate: p.dateLastBilled, nextBillingDate: p.dateNextBilling,
        frequency: p.billingIntervalDays, price: p.price, quantity: p.quantity,
        totalBilled: p.totalBilled, totalOrders: p.totalOrders, dateCreated: p.dateCreated
      };
    } catch (e) { return null; }
  }));

  return Response.json({ subscriptions: subscriptions.filter(s => s !== null), clientOrderId }, { headers: corsHeaders });
}

// ============================================
// CREATE CLICKUP CASE
// ============================================
async function handleCreateCase(request, env, corsHeaders) {
  const caseData = await request.json();
  const now = new Date();
  const prefix = CASE_PREFIXES[caseData.caseType] || 'CAS';
  const timestamp = now.getFullYear().toString().slice(-2) + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0');
  const caseId = `${prefix}-${timestamp}`;

  const listId = getListId(caseData.caseType);
  const customFields = buildCustomFields(caseData, caseId);

  const taskBody = {
    name: caseData.customerName || 'Unknown Customer',
    description: buildTaskDescription(caseData),
    custom_fields: customFields,
    priority: caseData.priority || 3
  };

  const taskResponse = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
    method: 'POST',
    headers: { 'Authorization': env.CLICKUP_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(taskBody),
  });

  if (!taskResponse.ok) {
    const errorText = await taskResponse.text();
    console.error('ClickUp task creation failed:', errorText);
    return Response.json({ error: 'Failed to create case' }, { status: 500, headers: corsHeaders });
  }

  const task = await taskResponse.json();
  if (caseData.comment || caseData.actionSteps) await addTaskComment(env, task.id, caseData);
  await logAnalytics(env, { caseId, caseType: caseData.caseType, subType: caseData.subType, resolution: caseData.resolution, customerEmail: caseData.email, orderNumber: caseData.orderNumber, refundAmount: caseData.refundAmount, resolvedInApp: caseData.resolvedInApp || false, timestamp: now.toISOString() });

  return Response.json({ success: true, caseId, taskId: task.id, taskUrl: task.url }, { headers: corsHeaders });
}

function getListId(caseType) {
  switch (caseType) {
    case 'refund': return CLICKUP_CONFIG.lists.refundRequests;
    case 'return': return CLICKUP_CONFIG.lists.returnRequests;
    case 'shipping': return CLICKUP_CONFIG.lists.shippingIssues;
    case 'subscription': return CLICKUP_CONFIG.lists.subscriptionManagement;
    default: return CLICKUP_CONFIG.lists.manualHelp;
  }
}

function buildCustomFields(caseData, caseId) {
  const fields = [
    { id: CLICKUP_CONFIG.fields.caseId, value: caseId },
    { id: CLICKUP_CONFIG.fields.emailAddress, value: caseData.email || '' },
    { id: CLICKUP_CONFIG.fields.resolution, value: caseData.resolution || '' }
  ];
  if (caseData.orderNumber) fields.push({ id: CLICKUP_CONFIG.fields.orderNumber, value: caseData.orderNumber });
  if (caseData.orderUrl) fields.push({ id: CLICKUP_CONFIG.fields.orderUrl, value: caseData.orderUrl });
  if (caseData.refundAmount) fields.push({ id: CLICKUP_CONFIG.fields.refundAmount, value: String(caseData.refundAmount) });
  if (caseData.selectedItems) {
    const itemsText = Array.isArray(caseData.selectedItems) ? caseData.selectedItems.map(i => `${i.title} (${i.sku})`).join(', ') : caseData.selectedItems;
    fields.push({ id: CLICKUP_CONFIG.fields.selectedItems, value: itemsText });
  }
  if (caseData.caseType === 'shipping' && caseData.carrierIssue) {
    const optionId = CLICKUP_CONFIG.options.carrierIssue[caseData.carrierIssue];
    if (optionId) fields.push({ id: CLICKUP_CONFIG.fields.carrierIssue, value: optionId });
  }
  if (caseData.caseType === 'return') {
    fields.push({ id: CLICKUP_CONFIG.fields.returnStatus, value: CLICKUP_CONFIG.options.returnStatus.awaitingReturn });
  }
  if (caseData.caseType === 'subscription') {
    if (caseData.actionType) {
      const actionId = CLICKUP_CONFIG.options.actionType[caseData.actionType];
      if (actionId) fields.push({ id: CLICKUP_CONFIG.fields.actionType, value: actionId });
    }
    if (caseData.subscriptionStatus) {
      const statusId = CLICKUP_CONFIG.options.subscriptionStatus[caseData.subscriptionStatus];
      if (statusId) fields.push({ id: CLICKUP_CONFIG.fields.subscriptionStatus, value: statusId });
    }
  }
  return fields;
}

function buildTaskDescription(caseData) {
  let desc = `## Case Details\n\n**Case Type:** ${caseData.caseType}\n**Email:** ${caseData.email || 'N/A'}\n**Order:** ${caseData.orderNumber || 'N/A'}\n`;
  if (caseData.resolution) desc += `\n## Resolution Requested\n${caseData.resolution}\n`;
  if (caseData.intentDetails) desc += `\n## Customer's Issue\n${caseData.intentDetails}\n`;
  if (caseData.selectedItems?.length > 0) {
    desc += `\n## Selected Items\n`;
    caseData.selectedItems.forEach(item => { desc += `- ${item.title} (SKU: ${item.sku}) - ${item.price}\n`; });
  }
  return desc;
}

async function addTaskComment(env, taskId, caseData) {
  let commentText = `## Action Steps\n\n`;
  if (caseData.actionSteps) {
    commentText += caseData.actionSteps;
  } else {
    switch (caseData.caseType) {
      case 'refund':
        commentText += `1. Review order in Shopify\n2. Process refund of ${caseData.refundAmount || 'full amount'}\n3. Send confirmation email to customer\n`;
        break;
      case 'return':
        commentText += `1. Wait for customer to ship return\n2. Customer will reply with tracking number\n3. Once received, inspect and process refund\n\n**Return Address:**\nPuppyPad Returns\n[PLACEHOLDER]\nWisconsin, USA\n`;
        break;
      case 'shipping':
        commentText += `1. Check ParcelPanel for latest status\n2. Contact fulfillment center if needed\n3. Process reship or refund as requested\n`;
        break;
      case 'subscription':
        commentText += `1. Update subscription in CheckoutChamp\n2. Verify changes reflect in system\n3. Send confirmation to customer\n`;
        break;
      default:
        commentText += `Review case and take appropriate action.\n`;
    }
  }
  if (caseData.evidenceUrls?.length > 0) {
    commentText += `\n## Evidence/Photos\n`;
    caseData.evidenceUrls.forEach((url, i) => { commentText += `- [Photo ${i + 1}](${url})\n`; });
  }
  await fetch(`https://api.clickup.com/api/v2/task/${taskId}/comment`, {
    method: 'POST',
    headers: { 'Authorization': env.CLICKUP_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment_text: commentText }),
  });
}

// ============================================
// CHECK EXISTING CASE (DEDUPE)
// ============================================
async function handleCheckCase(request, env, corsHeaders) {
  const { orderNumber, email } = await request.json();
  if (!orderNumber && !email) return Response.json({ existingCase: false }, { headers: corsHeaders });

  const lists = Object.values(CLICKUP_CONFIG.lists);
  for (const listId of lists) {
    try {
      const response = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task?statuses[]=to%20do&statuses[]=in%20progress`, {
        headers: { 'Authorization': env.CLICKUP_API_KEY }
      });
      if (response.ok) {
        const data = await response.json();
        const matchingTask = (data.tasks || []).find(task => {
          const orderField = task.custom_fields?.find(f => f.id === CLICKUP_CONFIG.fields.orderNumber);
          const emailField = task.custom_fields?.find(f => f.id === CLICKUP_CONFIG.fields.emailAddress);
          return (orderNumber && orderField?.value === orderNumber) || (email && emailField?.value === email);
        });
        if (matchingTask) {
          const caseIdField = matchingTask.custom_fields?.find(f => f.id === CLICKUP_CONFIG.fields.caseId);
          return Response.json({ existingCase: true, taskId: matchingTask.id, taskUrl: matchingTask.url, caseId: caseIdField?.value || null, status: matchingTask.status?.status }, { headers: corsHeaders });
        }
      }
    } catch (e) { console.error(`Error checking list ${listId}:`, e); }
  }
  return Response.json({ existingCase: false }, { headers: corsHeaders });
}

// ============================================
// AI RESPONSE (AMY / CLAUDIA)
// ============================================
async function handleAIResponse(request, env, corsHeaders) {
  const { persona, context, productName, customerInput, dogInfo, methodsTried } = await request.json();
  let productDoc = productName ? await getProductDoc(env, productName) : '';
  const systemPrompt = persona === 'claudia' ? buildClaudiaPrompt(productDoc, dogInfo, methodsTried) : buildAmyPrompt(productDoc, context);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: customerInput }], max_tokens: 600, temperature: 0.7 }),
  });

  if (!response.ok) return Response.json({ error: 'AI response failed' }, { status: 500, headers: corsHeaders });
  const data = await response.json();
  const message = data.choices[0]?.message?.content || '';
  return Response.json({ messages: splitMessage(message), persona }, { headers: corsHeaders });
}

async function getProductDoc(env, productName) {
  const productDocMap = {
    'puppypad': 'PuppyPad-_Reusable-Pee-Pad_-_1_.txt', 'pee pad': 'PuppyPad-_Reusable-Pee-Pad_-_1_.txt',
    'training pad': 'PuppyPad-_Reusable-Pee-Pad_-_1_.txt', 'busypet': 'BusyPet.txt',
    'calmbuddy': 'CalmBuddy Premium Diffuser Kit.txt', 'cozybed': 'CozyBed (1).txt',
    'laundry': 'Laundry-Detergent-Sheets.txt', 'detergent': 'Laundry-Detergent-Sheets.txt',
    'stain': 'Stain-and-Odor-Eliminator.txt', 'odor': 'Stain-and-Odor-Eliminator.txt'
  };
  const lowerName = productName.toLowerCase();
  let filename = null;
  for (const [key, value] of Object.entries(productDocMap)) { if (lowerName.includes(key)) { filename = value; break; } }
  if (!filename) return '';
  try { const file = await env.PRODUCT_DOCS.get(filename); if (file) return await file.text(); } catch (e) { console.error('Error fetching product doc:', e); }
  return '';
}

function buildAmyPrompt(productDoc, context) {
  return `You are Amy from PuppyPad customer support. You are warm, caring, heartwarming, and natural - like a helpful friend.

PERSONALITY:
- Warm and genuinely caring
- Use light emojis like 🙂 ❤️ but don't overuse them
- Sound like a real human, not a corporate bot
- Be empathetic and understanding
- Keep responses concise but caring (2-4 sentences typically)

PRODUCT KNOWLEDGE:
${productDoc || 'General PuppyPad products - reusable training pads for dogs.'}

CONTEXT: ${context || 'General customer support'}

Respond naturally to help the customer. Be genuine and persuasive about the product's value when handling objections, but never pushy.`;
}

function buildClaudiaPrompt(productDoc, dogInfo, methodsTried) {
  return `You are Claudia, an in-house veterinarian at PuppyPad. You specialize in helping customers train their dogs.

PERSONALITY:
- Professional but warm and friendly
- Knowledgeable about dog behavior and training
- Encouraging and supportive
- Provide specific, actionable tips
- Use occasional emojis but stay professional 🐕

DOG INFORMATION:
${dogInfo ? JSON.stringify(dogInfo, null, 2) : 'No specific dog info provided'}

METHODS ALREADY TRIED (DO NOT SUGGEST THESE):
${methodsTried || 'None specified'}

PRODUCT KNOWLEDGE:
${productDoc || 'PuppyPad reusable training pads - washable, absorbent, eco-friendly.'}

Provide personalized training tips. DO NOT repeat methods they've already tried.`;
}

function splitMessage(message) {
  if (message.length < 280) return [message];
  const midPoint = Math.floor(message.length / 2);
  let splitIndex = message.lastIndexOf('. ', midPoint + 80);
  if (splitIndex === -1 || splitIndex < midPoint - 80) splitIndex = message.indexOf('. ', midPoint);
  if (splitIndex === -1) return [message];
  return [message.substring(0, splitIndex + 1).trim(), message.substring(splitIndex + 1).trim()].filter(m => m.length > 0);
}

// ============================================
// UPLOAD EVIDENCE
// ============================================
async function handleUploadEvidence(request, env, corsHeaders) {
  const formData = await request.formData();
  const file = formData.get('file');
  const caseId = formData.get('caseId') || `temp_${Date.now()}`;
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400, headers: corsHeaders });
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) return Response.json({ error: 'Please upload a JPG, PNG, or WebP image' }, { status: 400, headers: corsHeaders });
  if (file.size > 5 * 1024 * 1024) return Response.json({ error: 'File too large. Max 5MB.' }, { status: 400, headers: corsHeaders });
  const ext = file.type.split('/')[1];
  const filename = `${caseId}/${Date.now()}.${ext}`;
  await env.EVIDENCE_UPLOADS.put(filename, file.stream(), { httpMetadata: { contentType: file.type } });
  return Response.json({ success: true, filename, url: `/evidence/${filename}` }, { headers: corsHeaders });
}

// ============================================
// SERVE AUDIO FILES
// ============================================
async function handleAudio(pathname, env, corsHeaders) {
  const filename = decodeURIComponent(pathname.replace('/audio/', ''));
  const file = await env.PRODUCT_DOCS.get(filename);
  if (!file) return Response.json({ error: 'Audio not found' }, { status: 404, headers: corsHeaders });
  return new Response(file.body, { headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg', 'Content-Length': file.size } });
}

// ============================================
// ANALYTICS LOGGING
// ============================================
async function logAnalytics(env, data) {
  try {
    await env.ANALYTICS_DB.prepare(`INSERT INTO cases (case_id, case_type, sub_type, resolution, resolved_in_app, customer_email, order_number, refund_amount, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(data.caseId, data.caseType, data.subType || '', data.resolution || '', data.resolvedInApp ? 1 : 0, data.customerEmail || '', data.orderNumber || '', data.refundAmount || '', data.timestamp).run();
  } catch (e) { console.error('Analytics logging failed:', e); }
}
