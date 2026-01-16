/**
 * Persona Configuration - Chat bot personalities
 */

export interface Persona {
  name: string;
  title: string;
  avatar: string;
  color: string;
  greeting: string;
}

export const PERSONAS: Record<string, Persona> = {
  amy: {
    name: 'Amy',
    title: 'Customer Support',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    color: '#FF6B6B',
    greeting: "Hi! I'm Amy, and I'm here to help you with your order.",
  },
  sarah: {
    name: 'Sarah',
    title: 'CX Lead',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    color: '#FFE66D',
    greeting: "Hello! I'm Sarah, the Customer Experience Lead. Let me see how I can assist you.",
  },
  claudia: {
    name: 'Claudia',
    title: 'Veterinarian',
    avatar:
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face',
    color: '#A78BFA',
    greeting:
      "Hi there! I'm Dr. Claudia, and I'm here to help with any questions about your pup.",
  },
};

export const MESSAGES = {
  welcome: {
    default: "Welcome to PuppyPad Resolution Center! I'm here to help.",
    order: "Let's get your order sorted out. First, I'll need some information.",
    shipping: "I'll help you track down your shipment. Let's find your order.",
    subscription: "I can help you manage your subscription. Let me look that up.",
  },
  errors: {
    network: "I'm having trouble connecting. Please check your internet and try again.",
    orderNotFound: "I couldn't find any orders with that information. Please double-check and try again.",
    generic: 'Something went wrong. Please try again or contact support.',
    sessionExpired: 'Your session has expired. Please refresh and start again.',
  },
  success: {
    caseCreated: "I've created a support case for you. Our team will follow up shortly.",
    refundProcessed: 'Your refund has been processed successfully.',
    subscriptionUpdated: 'Your subscription has been updated.',
  },
} as const;

export type PersonaKey = keyof typeof PERSONAS;
