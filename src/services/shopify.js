/**
 * Shopify Service
 * Handles all Shopify API interactions
 */

import { POLICY_CONFIG } from '../config/constants.js';
import { cleanPhoneNumber } from '../utils/formatters.js';

/**
 * Country code to name mapping
 */
const COUNTRY_NAMES = {
  'US': 'United States',
  'CA': 'Canada',
  'GB': 'United Kingdom',
  'UK': 'United Kingdom',
  'AU': 'Australia',
  'NZ': 'New Zealand',
  'DE': 'Germany',
  'FR': 'France',
  'ES': 'Spain',
  'IT': 'Italy',
  'NL': 'Netherlands',
  'BE': 'Belgium',
  'AT': 'Austria',
  'CH': 'Switzerland',
  'IE': 'Ireland',
  'PT': 'Portugal',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'PL': 'Poland',
  'CZ': 'Czech Republic',
  'JP': 'Japan',
  'KR': 'South Korea',
  'SG': 'Singapore',
  'HK': 'Hong Kong',
  'MX': 'Mexico',
  'BR': 'Brazil',
  'AR': 'Argentina',
  'ZA': 'South Africa',
  'IN': 'India',
  'PH': 'Philippines',
};

/**
 * Get country name from code
 */
export function getCountryNameFromCode(code) {
  if (!code) return null;
  return COUNTRY_NAMES[code.toUpperCase()] || null;
}

/**
 * Build Shopify search query from lookup parameters
 */
export function buildSearchQuery(params) {
  const { email, phone, firstName, lastName, orderNumber, address1, country, deepSearch } = params;
  let query = '';

  if (deepSearch && firstName && lastName && address1) {
    // Deep search mode: Search by name
    query = `shipping_address.first_name:${firstName} shipping_address.last_name:${lastName}`;
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
      const cleanPhone = cleanPhoneNumber(phone);
      query = `phone:*${cleanPhone.slice(-10)}*`;
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

  return query;
}

/**
 * Filter orders for deep search (strict matching)
 */
export function filterOrdersDeepSearch(orders, searchParams) {
  const { firstName, lastName, address1, country } = searchParams;
  const searchFirstName = firstName?.toLowerCase().trim();
  const searchLastName = lastName?.toLowerCase().trim();
  const searchAddress = address1?.toLowerCase().trim();
  const searchCountryName = country ? getCountryNameFromCode(country)?.toLowerCase() : null;

  return orders.filter(order => {
    const addr = order.shipping_address;
    if (!addr) return false;

    // EXACT match on first name
    const orderFirstName = (addr.first_name || '').toLowerCase().trim();
    if (orderFirstName !== searchFirstName) return false;

    // EXACT match on last name
    const orderLastName = (addr.last_name || '').toLowerCase().trim();
    if (orderLastName !== searchLastName) return false;

    // EXACT match on country
    if (searchCountryName) {
      const orderCountry = (addr.country || '').toLowerCase().trim();
      if (orderCountry !== searchCountryName) return false;
    }

    // FUZZY match on address
    if (searchAddress) {
      const orderAddress = (addr.address1 || '').toLowerCase();
      const searchParts = searchAddress.split(/[\s,]+/).filter(p => p.length > 1);
      let matchCount = 0;
      for (const part of searchParts) {
        if (orderAddress.includes(part)) matchCount++;
      }
      const matchRatio = searchParts.length > 0 ? matchCount / searchParts.length : 0;
      if (matchRatio < 0.4) return false;
    }

    return true;
  });
}

/**
 * Fetch variant image from Shopify API
 */
async function fetchVariantImage(variantId, env) {
  if (!variantId || !env) return null;
  
  try {
    const variantUrl = `https://${env.SHOPIFY_STORE}/admin/api/2024-01/variants/${variantId}.json`;
    const response = await fetch(variantUrl, {
      headers: {
        'X-Shopify-Access-Token': env.SHOPIFY_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const variant = data.variant;
    
    // Return variant image if available
    if (variant?.image_id) {
      // Fetch the image from the product
      const productUrl = `https://${env.SHOPIFY_STORE}/admin/api/2024-01/products/${variant.product_id}.json`;
      const productResponse = await fetch(productUrl, {
        headers: {
          'X-Shopify-Access-Token': env.SHOPIFY_API_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (productResponse.ok) {
        const productData = await productResponse.json();
        const product = productData.product;
        
        // Find the image matching the variant's image_id
        if (product?.images) {
          const variantImage = product.images.find(img => img.id === variant.image_id);
          if (variantImage?.src) {
            return variantImage.src;
          }
        }
        
        // Fallback to first product image if variant image not found
        if (product?.images?.[0]?.src) {
          return product.images[0].src;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching variant image:', error);
    return null;
  }
}

/**
 * Process line items with images and product type detection
 * Now fetches variant images when missing from order line items
 */
export async function processLineItems(lineItems, env = null) {
  const processedItems = await Promise.all(lineItems.map(async (item) => {
    const productTypeProperty = (item.properties || []).find(p =>
      p.name === 'productType' || p.name === 'product_type'
    );
    const productType = productTypeProperty?.value || null;
    const isFree = parseFloat(item.price) === 0;
    const isDigital = item.requires_shipping === false ||
      item.title?.toLowerCase().includes('ebook') ||
      item.title?.toLowerCase().includes('e-book') ||
      item.title?.toLowerCase().includes('digital');

    // Get image from line item first, fallback to fetching variant image
    let image = item.image?.src || null;
    
    // If no image and we have variant_id and env, fetch variant image
    if (!image && item.variant_id && env) {
      image = await fetchVariantImage(item.variant_id, env);
    }

    return {
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      title: item.title,
      variantTitle: item.variant_title,
      sku: item.sku,
      quantity: item.quantity,
      price: item.price,
      image: image,
      fulfillmentStatus: item.fulfillment_status,
      productType,
      isFree,
      isDigital,
      isPuppyPad: item.title?.toLowerCase().includes('puppypad') ||
                  item.title?.toLowerCase().includes('puppy pad') ||
                  item.title?.toLowerCase().includes('pee pad'),
    };
  }));
  
  return processedItems;
}

/**
 * Extract CheckoutChamp order ID from Shopify order
 * Searches 5 locations: note_attributes, tags, note, line_items, metafields
 */
export function extractClientOrderId(order) {
  const attributeNames = [
    'clientOrderId', 'client_order_id', 'clientorderid',
    'checkoutchamp_order_id', 'checkoutchampOrderId',
    'cc_order_id', 'ccOrderId',
    'orderId', 'order_id',
    'external_order_id', 'externalOrderId',
    'sticky_order_id', 'stickyOrderId',
    'purchaseId', 'purchase_id'
  ];

  // 1. Check note_attributes array
  const noteAttrs = order.note_attributes || [];
  for (const attr of noteAttrs) {
    if (attributeNames.some(name => name.toLowerCase() === attr.name?.toLowerCase())) {
      if (attr.value) return attr.value;
    }
  }

  // 2. Check order tags
  if (order.tags) {
    const tags = order.tags.split(/[,\s]+/);
    for (const tag of tags) {
      const match = tag.match(/(?:cc|clientOrderId|orderId|checkoutchamp)[:\-_]?([A-Z0-9]+)/i);
      if (match) return match[1];
    }
  }

  // 3. Check order note
  if (order.note) {
    for (const attrName of attributeNames) {
      const regex = new RegExp(`${attrName}[:\\s=]+["']?([A-Z0-9]+)["']?`, 'i');
      const match = order.note.match(regex);
      if (match) return match[1];
    }
    // Try JSON in note
    try {
      const jsonMatch = order.note.match(/\{[^}]+\}/);
      if (jsonMatch) {
        const noteJson = JSON.parse(jsonMatch[0]);
        for (const attrName of attributeNames) {
          if (noteJson[attrName]) return noteJson[attrName];
        }
      }
    } catch (e) {}
  }

  // 4. Check line item properties
  if (order.line_items) {
    for (const item of order.line_items) {
      const itemProps = item.properties || [];
      for (const prop of itemProps) {
        if (attributeNames.some(name => name.toLowerCase() === prop.name?.toLowerCase())) {
          if (prop.value) return prop.value;
        }
      }
    }
  }

  return null;
}

/**
 * Fetch clientOrderId from Shopify order metafields
 */
export async function fetchClientOrderIdFromMetafields(orderId, env) {
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

    if (!response.ok) return null;

    const data = await response.json();
    const metafields = data.metafields || [];

    for (const mf of metafields) {
      if (attributeNames.some(name => name.toLowerCase() === mf.key?.toLowerCase())) {
        return mf.value;
      }
      // Check JSON values
      if (typeof mf.value === 'string' && mf.value.startsWith('{')) {
        try {
          const jsonValue = JSON.parse(mf.value);
          for (const attrName of attributeNames) {
            if (jsonValue[attrName]) return jsonValue[attrName];
          }
        } catch (e) {}
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching metafields:', error);
    return null;
  }
}

/**
 * Calculate fulfillment window status for an order
 */
export function calculateFulfillmentWindow(order) {
  const orderDate = new Date(order.created_at);
  const now = new Date();
  const hoursSinceOrder = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
  const isUnfulfilled = !order.fulfillment_status || order.fulfillment_status === 'null';
  const withinFulfillmentWindow = hoursSinceOrder < POLICY_CONFIG.fulfillmentCutoffHours;
  const canModify = isUnfulfilled && withinFulfillmentWindow;
  const hoursUntilFulfillment = withinFulfillmentWindow
    ? Math.max(0, POLICY_CONFIG.fulfillmentCutoffHours - hoursSinceOrder)
    : 0;

  return {
    canModify,
    hoursUntilFulfillment,
    hoursSinceOrder,
    isUnfulfilled,
    withinFulfillmentWindow
  };
}

/**
 * Process a single order into the response format
 */
export async function processOrder(order, env) {
  const lineItems = processLineItems(order.line_items);
  let clientOrderId = extractClientOrderId(order);
  if (!clientOrderId) {
    clientOrderId = await fetchClientOrderIdFromMetafields(order.id, env);
  }

  const fulfillmentWindow = calculateFulfillmentWindow(order);

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
    ...fulfillmentWindow
  };
}

/**
 * Lookup orders from Shopify
 */
export async function lookupOrders(env, searchParams) {
  const query = buildSearchQuery(searchParams);
  const shopifyUrl = `https://${env.SHOPIFY_STORE}/admin/api/2024-01/orders.json?status=any&limit=50&query=${encodeURIComponent(query)}`;

  const response = await fetch(shopifyUrl, {
    headers: {
      'X-Shopify-Access-Token': env.SHOPIFY_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Shopify lookup failed');
  }

  const data = await response.json();
  let orders = data.orders || [];

  // Apply deep search filtering if needed
  if (searchParams.deepSearch && orders.length > 0) {
    orders = filterOrdersDeepSearch(orders, searchParams);
  }

  // Process all orders
  const processedOrders = await Promise.all(orders.map(order => processOrder(order, env)));
  return processedOrders;
}
