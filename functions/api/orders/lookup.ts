/**
 * POST /api/orders/lookup - Look up orders by email/phone
 */

import type { Env } from '../../_middleware';
import { jsonResponse, errorResponse } from '../../_middleware';

interface OrderLookupRequest {
  email?: string;
  phone?: string;
  orderNumber?: string;
  firstName?: string;
  lastName?: string;
  address1?: string;
  country?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body: OrderLookupRequest = await context.request.json();
    const { email, phone, orderNumber, firstName } = body;

    if (!email && !phone) {
      return errorResponse('Email or phone number is required', 400);
    }

    const shopifyUrl = context.env.SHOPIFY_STORE_URL;
    const accessToken = context.env.SHOPIFY_ACCESS_TOKEN;

    if (!shopifyUrl || !accessToken) {
      return errorResponse('Shopify configuration missing', 500);
    }

    // Build GraphQL query
    let query = '';
    if (orderNumber) {
      query = `name:#${orderNumber.replace(/^#/, '')}`;
    } else if (email) {
      query = `email:${email}`;
    } else if (phone) {
      query = `phone:${phone}`;
    }

    const graphqlQuery = `
      query OrdersLookup($query: String!) {
        orders(first: 10, query: $query, sortKey: CREATED_AT, reverse: true) {
          edges {
            node {
              id
              name
              email
              phone
              createdAt
              displayFulfillmentStatus
              displayFinancialStatus
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              lineItems(first: 20) {
                edges {
                  node {
                    id
                    title
                    quantity
                    originalUnitPriceSet {
                      shopMoney {
                        amount
                      }
                    }
                    sku
                    variantTitle
                    product {
                      productType
                    }
                    image {
                      url
                    }
                  }
                }
              }
              shippingAddress {
                firstName
                lastName
                address1
                city
                province
                country
                zip
              }
              fulfillments(first: 5) {
                trackingInfo(first: 1) {
                  number
                  url
                  company
                }
                status
                createdAt
              }
              tags
            }
          }
        }
      }
    `;

    const response = await fetch(`${shopifyUrl}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: { query },
      }),
    });

    if (!response.ok) {
      console.error('Shopify API error:', await response.text());
      return errorResponse('Failed to fetch orders from Shopify', 500);
    }

    const data = await response.json();
    const orders = data.data?.orders?.edges || [];

    // Process orders
    const processedOrders = orders.map((edge: any) => {
      const order = edge.node;
      const createdAt = new Date(order.createdAt);
      const daysSinceOrder = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const isWithinGuarantee = daysSinceOrder <= 90;
      const totalPrice = parseFloat(order.totalPriceSet.shopMoney.amount);

      // Process line items
      const items = order.lineItems.edges.map((itemEdge: any) => {
        const item = itemEdge.node;
        const price = parseFloat(item.originalUnitPriceSet?.shopMoney?.amount || '0');
        const productType = item.product?.productType || '';
        const isDigital = productType.toLowerCase().includes('digital');
        const isFree = price === 0;
        const isUpsell = productType.toLowerCase().includes('upsell');

        return {
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          price,
          formattedPrice: `$${price.toFixed(2)}`,
          sku: item.sku,
          variantTitle: item.variantTitle,
          productType,
          image: item.image?.url,
          isDigital,
          isFree,
          isUpsell,
          isSelectable: !isDigital,
        };
      });

      // Get tracking info
      const fulfillment = order.fulfillments?.[0];
      const trackingInfo = fulfillment?.trackingInfo?.[0];

      return {
        id: order.id,
        orderNumber: order.name.replace('#', ''),
        displayName: order.name,
        createdAt: order.createdAt,
        formattedDate: createdAt.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        fulfillmentStatus: order.displayFulfillmentStatus?.toLowerCase() || 'unfulfilled',
        fulfillmentStatusDisplay: order.displayFulfillmentStatus || 'Unfulfilled',
        financialStatus: order.displayFinancialStatus,
        totalPrice,
        formattedTotal: `$${totalPrice.toFixed(2)}`,
        currency: order.totalPriceSet.shopMoney.currencyCode,
        items,
        itemCount: items.length,
        shippingAddress: order.shippingAddress,
        trackingInfo: trackingInfo
          ? {
              trackingNumber: trackingInfo.number,
              trackingUrl: trackingInfo.url,
              carrier: trackingInfo.company,
              status: fulfillment?.status || 'unknown',
            }
          : undefined,
        isWithinGuarantee,
        daysSinceOrder,
        canCancel: daysSinceOrder < 1 && order.displayFulfillmentStatus === 'UNFULFILLED',
        hasSubscription: order.tags?.includes('subscription') || false,
      };
    });

    return jsonResponse({
      success: true,
      orders: processedOrders,
      customer: processedOrders.length > 0
        ? {
            email: orders[0]?.node?.email,
            firstName: orders[0]?.node?.shippingAddress?.firstName || firstName,
            ordersCount: processedOrders.length,
          }
        : undefined,
    });
  } catch (error) {
    console.error('Order lookup error:', error);
    return errorResponse('Internal server error', 500);
  }
};
