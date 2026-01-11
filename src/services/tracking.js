/**
 * Tracking Service
 * Handles ParcelPanel tracking API interactions
 */

import { formatTrackingStatus as formatStatus } from '../utils/formatters.js';

/**
 * Numeric status code to string mapping (ParcelPanel v2)
 */
const STATUS_MAP = {
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

/**
 * Normalize status label to standard status code
 */
function normalizeStatusLabel(statusLabel) {
  if (!statusLabel) return 'unknown';

  const normalized = statusLabel.toLowerCase().replace(/\s+/g, '_');

  if (normalized.includes('pickup') || normalized.includes('ready_for')) {
    return 'pickup';
  } else if (normalized.includes('exception') || normalized.includes('problem')) {
    return 'exception';
  } else if (normalized.includes('delivered')) {
    return 'delivered';
  } else if (normalized.includes('transit') || normalized.includes('shipped')) {
    return 'in_transit';
  } else if (normalized.includes('out_for_delivery')) {
    return 'out_for_delivery';
  }

  return normalized || 'unknown';
}

/**
 * Process a shipment from ParcelPanel response
 */
function processShipment(shipment) {
  const checkpoints = shipment.checkpoints || [];

  // Determine status from numeric code or label
  let status = STATUS_MAP[shipment.status];
  if (!status) {
    status = normalizeStatusLabel(shipment.status_label);
  }

  return {
    trackingNumber: shipment.tracking_number,
    carrier: shipment.carrier?.name || shipment.carrier?.code || 'Unknown',
    carrierCode: shipment.carrier?.code,
    carrierLogo: shipment.carrier?.logo_url,
    carrierUrl: shipment.carrier?.url,
    status: status,
    statusLabel: shipment.status_label || formatStatus(status),
    substatus: shipment.substatus,
    substatusLabel: shipment.substatus_label,
    deliveryDate: shipment.delivery_date,
    estimatedDelivery: shipment.estimated_delivery_date,
    daysInTransit: shipment.transit_time || 0,
    orderDate: shipment.order_date,
    fulfillmentDate: shipment.fulfillment_date,
    lastMile: shipment.last_mile,
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
}

/**
 * Look up tracking information by order number
 */
export async function lookupByOrderNumber(env, orderNumber) {
  const orderNum = orderNumber.startsWith('#') ? orderNumber : `#${orderNumber}`;
  const url = `https://open.parcelpanel.com/api/v2/tracking/order?order_number=${encodeURIComponent(orderNum)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-parcelpanel-api-key': env.PARCELPANEL_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error('ParcelPanel API error:', response.status);
    return { tracking: null, message: 'Tracking lookup failed' };
  }

  const data = await response.json();
  const shipments = data?.order?.shipments || [];

  if (shipments.length === 0) {
    return { tracking: null, message: 'No tracking found' };
  }

  const trackingResults = shipments.map(processShipment);

  return {
    tracking: trackingResults[0],
    allTracking: trackingResults
  };
}

/**
 * Look up tracking information by tracking number
 */
export async function lookupByTrackingNumber(env, trackingNumber) {
  const url = `https://open.parcelpanel.com/api/v2/tracking?tracking_number=${encodeURIComponent(trackingNumber)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-parcelpanel-api-key': env.PARCELPANEL_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error('ParcelPanel API error:', response.status);
    return { tracking: null, message: 'Tracking lookup failed' };
  }

  const data = await response.json();
  const shipments = data?.order?.shipments || [];

  if (shipments.length === 0) {
    return { tracking: null, message: 'No tracking found' };
  }

  const trackingResults = shipments.map(processShipment);

  return {
    tracking: trackingResults[0],
    allTracking: trackingResults
  };
}

/**
 * Look up tracking - accepts either order number or tracking number
 */
export async function lookupTracking(env, { orderNumber, trackingNumber }) {
  if (!orderNumber && !trackingNumber) {
    return { tracking: null, message: 'No identifier provided' };
  }

  try {
    if (orderNumber) {
      return await lookupByOrderNumber(env, orderNumber);
    } else {
      return await lookupByTrackingNumber(env, trackingNumber);
    }
  } catch (error) {
    console.error('Tracking error:', error);
    return { tracking: null, message: 'Tracking lookup error' };
  }
}
