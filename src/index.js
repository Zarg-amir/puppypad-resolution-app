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
// 90-DAY GUARANTEE VALIDATION
// ============================================
const GUARANTEE_DAYS = 90;

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
  const daysRemaining = Math.max(0, GUARANTEE_DAYS - daysSince);
  const eligible = daysSince <= GUARANTEE_DAYS;

  return Response.json({
    eligible,
    daysSince,
    daysRemaining,
    usedFallback,
    deliverySource,
    referenceDate: referenceDate.toISOString(),
    guaranteeDays: GUARANTEE_DAYS
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
  await createRichpanelEntry(env, caseData, caseId);

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
const ADMIN_TOKEN_SECRET = 'puppypad-admin-secret-2025'; // In production, use env variable

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + ADMIN_TOKEN_SECRET);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateToken(username) {
  const payload = {
    username,
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload) + ADMIN_TOKEN_SECRET);
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
    const data = encoder.encode(JSON.stringify(payload) + ADMIN_TOKEN_SECRET);
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
}
