import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type OrderType = 'pickup' | 'delivery';

export interface Branch {
  id: string;
  name: string;
  name_ar?: string;
  address: string;
  address_ar?: string;
  phone: string;
  is_open: boolean;
  opening_hours: string;
  latitude?: number;
  longitude?: number;
}

export interface DeliveryAddress {
  area: string;
  block: string;
  street: string;
  building: string;
  floor?: string;
  apartment?: string;
  additional_directions?: string;
  latitude?: number;
  longitude?: number;
}

interface OrderContextType {
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch) => void;
  deliveryAddress: DeliveryAddress | null;
  setDeliveryAddress: (address: DeliveryAddress | null) => void;
  showOrderTypeModal: boolean;
  setShowOrderTypeModal: (show: boolean) => void;
  showBranchModal: boolean;
  setShowBranchModal: (show: boolean) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Default branch - Bam Burgers Salwa
const DEFAULT_BRANCH: Branch = {
  id: '3f9570b2-24d2-4f2d-81d7-25c6b35da76b',
  name: 'Bam Burgers - Salwa',
  name_ar: 'بام برجرز - سلوى',
  address: 'Beside Salwa Co-Op, Co-Op Compound, 103 St, 25409, Kuwait',
  address_ar: 'بجانب جمعية سلوى التعاونية، مجمع التعاونية، شارع 103، 25409، الكويت',
  phone: '+965 9474 5424',
  is_open: true,
  opening_hours: 'Daily 11:00 AM - 1:00 AM',
};

const ORDER_TYPE_KEY = 'bam-order-type';
const BRANCH_KEY = 'bam-branch';
const ADDRESS_KEY = 'bam-delivery-address';

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [orderType, setOrderTypeState] = useState<OrderType>(() => {
    const stored = localStorage.getItem(ORDER_TYPE_KEY);
    return (stored === 'pickup' || stored === 'delivery') ? stored : 'delivery';
  });

  const [selectedBranch, setSelectedBranchState] = useState<Branch | null>(() => {
    try {
      const stored = localStorage.getItem(BRANCH_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_BRANCH;
    } catch {
      return DEFAULT_BRANCH;
    }
  });

  const [deliveryAddress, setDeliveryAddressState] = useState<DeliveryAddress | null>(() => {
    try {
      const stored = localStorage.getItem(ADDRESS_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [showOrderTypeModal, setShowOrderTypeModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);

  const setOrderType = (type: OrderType) => {
    setOrderTypeState(type);
    localStorage.setItem(ORDER_TYPE_KEY, type);
  };

  const setSelectedBranch = (branch: Branch) => {
    setSelectedBranchState(branch);
    localStorage.setItem(BRANCH_KEY, JSON.stringify(branch));
  };

  const setDeliveryAddress = (address: DeliveryAddress | null) => {
    setDeliveryAddressState(address);
    if (address) {
      localStorage.setItem(ADDRESS_KEY, JSON.stringify(address));
    } else {
      localStorage.removeItem(ADDRESS_KEY);
    }
  };

  return (
    <OrderContext.Provider
      value={{
        orderType,
        setOrderType,
        selectedBranch,
        setSelectedBranch,
        deliveryAddress,
        setDeliveryAddress,
        showOrderTypeModal,
        setShowOrderTypeModal,
        showBranchModal,
        setShowBranchModal,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};
