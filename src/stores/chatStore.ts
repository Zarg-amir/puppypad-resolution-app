import { create } from 'zustand';
import type { ProcessedOrder, ProcessedLineItem, TrackingInfo } from '@shared/types';
import type { PersonaKey } from '@shared/constants';

// Generate unique session ID
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export type ChatStep =
  | 'welcome'
  | 'identify'
  | 'lookup'
  | 'orders'
  | 'products'
  | 'intent'
  | 'ladder'
  | 'confirmation'
  | 'complete'
  | 'error';

export type FlowType = 'order' | 'shipping' | 'subscription' | 'claudia';

export interface Message {
  id: string;
  type: 'bot' | 'user' | 'system';
  content: string;
  persona?: PersonaKey;
  timestamp: number;
}

export interface CustomerData {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  orderNumber: string;
  address1: string;
  country: string;
}

interface ChatState {
  // Session
  sessionId: string;
  currentStep: ChatStep;
  flowType: FlowType | null;

  // Persona
  currentPersona: PersonaKey;

  // Messages
  messages: Message[];
  isTyping: boolean;

  // Customer data
  identifyMethod: 'email' | 'phone';
  customerData: CustomerData;

  // Orders
  orders: ProcessedOrder[];
  selectedOrder: ProcessedOrder | null;
  selectedItems: ProcessedLineItem[];

  // Tracking
  tracking: TrackingInfo | null;

  // Resolution
  intent: string | null;
  ladderStep: number;
  ladderType: 'refund' | 'shipping' | 'subscription' | null;
  refundAmount: number;
  refundPercentage: number;

  // Case
  caseId: string | null;

  // Actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setStep: (step: ChatStep) => void;
  setFlowType: (flow: FlowType) => void;
  setPersona: (persona: PersonaKey) => void;
  setTyping: (isTyping: boolean) => void;
  setIdentifyMethod: (method: 'email' | 'phone') => void;
  updateCustomerData: (data: Partial<CustomerData>) => void;
  setOrders: (orders: ProcessedOrder[]) => void;
  selectOrder: (order: ProcessedOrder | null) => void;
  setSelectedItems: (items: ProcessedLineItem[]) => void;
  toggleItemSelection: (item: ProcessedLineItem) => void;
  setTracking: (tracking: TrackingInfo | null) => void;
  setIntent: (intent: string) => void;
  setLadderStep: (step: number) => void;
  setLadderType: (type: 'refund' | 'shipping' | 'subscription' | null) => void;
  setRefund: (amount: number, percentage: number) => void;
  setCaseId: (caseId: string) => void;
  reset: () => void;
}

const initialCustomerData: CustomerData = {
  email: '',
  phone: '',
  firstName: '',
  lastName: '',
  orderNumber: '',
  address1: '',
  country: 'US',
};

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  sessionId: generateSessionId(),
  currentStep: 'welcome',
  flowType: null,
  currentPersona: 'amy',
  messages: [],
  isTyping: false,
  identifyMethod: 'email',
  customerData: { ...initialCustomerData },
  orders: [],
  selectedOrder: null,
  selectedItems: [],
  tracking: null,
  intent: null,
  ladderStep: 0,
  ladderType: null,
  refundAmount: 0,
  refundPercentage: 0,
  caseId: null,

  // Actions
  addMessage: (message) => {
    const newMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    set((state) => ({ messages: [...state.messages, newMessage] }));
  },

  setStep: (step) => set({ currentStep: step }),

  setFlowType: (flow) => set({ flowType: flow }),

  setPersona: (persona) => set({ currentPersona: persona }),

  setTyping: (isTyping) => set({ isTyping }),

  setIdentifyMethod: (method) => set({ identifyMethod: method }),

  updateCustomerData: (data) =>
    set((state) => ({
      customerData: { ...state.customerData, ...data },
    })),

  setOrders: (orders) => set({ orders }),

  selectOrder: (order) => set({ selectedOrder: order, selectedItems: [] }),

  setSelectedItems: (items) => set({ selectedItems: items }),

  toggleItemSelection: (item) => {
    const { selectedItems } = get();
    const isSelected = selectedItems.some((i) => i.id === item.id);
    if (isSelected) {
      set({ selectedItems: selectedItems.filter((i) => i.id !== item.id) });
    } else {
      set({ selectedItems: [...selectedItems, item] });
    }
  },

  setTracking: (tracking) => set({ tracking }),

  setIntent: (intent) => set({ intent }),

  setLadderStep: (step) => set({ ladderStep: step }),

  setLadderType: (type) => set({ ladderType: type }),

  setRefund: (amount, percentage) => set({ refundAmount: amount, refundPercentage: percentage }),

  setCaseId: (caseId) => set({ caseId }),

  reset: () =>
    set({
      sessionId: generateSessionId(),
      currentStep: 'welcome',
      flowType: null,
      currentPersona: 'amy',
      messages: [],
      isTyping: false,
      customerData: { ...initialCustomerData },
      orders: [],
      selectedOrder: null,
      selectedItems: [],
      tracking: null,
      intent: null,
      ladderStep: 0,
      ladderType: null,
      refundAmount: 0,
      refundPercentage: 0,
      caseId: null,
    }),
}));
