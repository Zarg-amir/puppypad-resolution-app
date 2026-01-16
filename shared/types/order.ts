/**
 * Order Types - Shared between frontend and backend
 */

export interface ShopifyOrder {
  id: string;
  orderNumber: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  fulfillmentStatus: string | null;
  financialStatus: string;
  totalPrice: string;
  currency: string;
  lineItems: ShopifyLineItem[];
  shippingAddress?: ShopifyAddress;
  billingAddress?: ShopifyAddress;
  customer: ShopifyCustomer;
  fulfillments: ShopifyFulfillment[];
  tags: string[];
  note?: string;
}

export interface ShopifyLineItem {
  id: string;
  title: string;
  quantity: number;
  price: string;
  sku?: string;
  variantTitle?: string;
  productType?: string;
  vendor?: string;
  image?: {
    url: string;
    altText?: string;
  };
  isDigital?: boolean;
  isFree?: boolean;
  isUpsell?: boolean;
}

export interface ShopifyAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  provinceCode?: string;
  country: string;
  countryCode: string;
  zip: string;
  phone?: string;
}

export interface ShopifyCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  ordersCount: number;
  totalSpent: string;
  tags: string[];
}

export interface ShopifyFulfillment {
  id: string;
  status: string;
  trackingNumber?: string;
  trackingUrl?: string;
  trackingCompany?: string;
  createdAt: string;
  lineItems: { id: string; quantity: number }[];
}

export interface OrderLookupRequest {
  email?: string;
  phone?: string;
  orderNumber?: string;
  firstName?: string;
  lastName?: string;
  address1?: string;
  country?: string;
}

export interface OrderLookupResponse {
  success: boolean;
  orders: ProcessedOrder[];
  customer?: {
    email: string;
    firstName: string;
    lastName: string;
    ordersCount: number;
  };
  error?: string;
}

export interface ProcessedOrder {
  id: string;
  orderNumber: string;
  displayName: string;
  createdAt: string;
  formattedDate: string;
  fulfillmentStatus: string;
  fulfillmentStatusDisplay: string;
  financialStatus: string;
  totalPrice: number;
  formattedTotal: string;
  currency: string;
  items: ProcessedLineItem[];
  itemCount: number;
  shippingAddress?: ShopifyAddress;
  trackingInfo?: TrackingInfo;
  isWithinGuarantee: boolean;
  daysSinceOrder: number;
  canCancel: boolean;
  hasSubscription: boolean;
}

export interface ProcessedLineItem {
  id: string;
  title: string;
  quantity: number;
  price: number;
  formattedPrice: string;
  sku?: string;
  variantTitle?: string;
  productType?: string;
  image?: string;
  isDigital: boolean;
  isFree: boolean;
  isUpsell: boolean;
  isSelectable: boolean;
}

export interface TrackingInfo {
  trackingNumber: string;
  trackingUrl?: string;
  carrier: string;
  status: string;
  statusDescription: string;
  estimatedDelivery?: string;
  lastUpdate?: string;
  events: TrackingEvent[];
}

export interface TrackingEvent {
  timestamp: string;
  status: string;
  description: string;
  location?: string;
}
