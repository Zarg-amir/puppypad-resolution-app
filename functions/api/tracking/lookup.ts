/**
 * POST /api/tracking/lookup - Look up tracking information
 */

import type { Env } from '../../_middleware';
import { jsonResponse, errorResponse } from '../../_middleware';

interface TrackingLookupRequest {
  trackingNumber: string;
  carrier?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body: TrackingLookupRequest = await context.request.json();
    const { trackingNumber, carrier } = body;

    if (!trackingNumber) {
      return errorResponse('Tracking number is required', 400);
    }

    const apiKey = context.env.PARCELPANEL_API_KEY;

    if (!apiKey) {
      // Return mock data if no API key
      return jsonResponse({
        success: true,
        tracking: {
          trackingNumber,
          carrier: carrier || 'Unknown',
          status: 'in_transit',
          statusDescription: 'Package is in transit',
          lastUpdate: new Date().toISOString(),
          events: [
            {
              timestamp: new Date().toISOString(),
              status: 'in_transit',
              description: 'Package is in transit to destination',
              location: 'Transit Hub',
            },
          ],
        },
      });
    }

    // Call ParcelPanel API
    const response = await fetch('https://api.parcelpanel.com/api/v1/parcels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-Key': apiKey,
      },
      body: JSON.stringify({
        tracking_number: trackingNumber,
        courier_code: carrier?.toLowerCase(),
      }),
    });

    if (!response.ok) {
      console.error('ParcelPanel API error:', await response.text());
      return jsonResponse({
        success: true,
        tracking: {
          trackingNumber,
          carrier: carrier || 'Unknown',
          status: 'unknown',
          statusDescription: 'Unable to retrieve tracking information',
          events: [],
        },
      });
    }

    const data = await response.json();
    const parcel = data.data?.[0];

    if (!parcel) {
      return jsonResponse({
        success: true,
        tracking: {
          trackingNumber,
          carrier: carrier || 'Unknown',
          status: 'not_found',
          statusDescription: 'Tracking information not found',
          events: [],
        },
      });
    }

    // Map ParcelPanel status to our status
    const statusMap: Record<string, string> = {
      pending: 'pending',
      info_received: 'pending',
      in_transit: 'in_transit',
      out_for_delivery: 'out_for_delivery',
      delivered: 'delivered',
      failed_attempt: 'failed_attempt',
      exception: 'exception',
      expired: 'expired',
    };

    return jsonResponse({
      success: true,
      tracking: {
        trackingNumber: parcel.tracking_number,
        carrier: parcel.courier_name || carrier || 'Unknown',
        status: statusMap[parcel.status] || parcel.status,
        statusDescription: parcel.status_info || parcel.status,
        estimatedDelivery: parcel.estimated_delivery_date,
        lastUpdate: parcel.latest_event?.time,
        events: (parcel.events || []).map((event: any) => ({
          timestamp: event.time,
          status: event.status,
          description: event.description,
          location: event.location,
        })),
      },
    });
  } catch (error) {
    console.error('Tracking lookup error:', error);
    return errorResponse('Internal server error', 500);
  }
};
