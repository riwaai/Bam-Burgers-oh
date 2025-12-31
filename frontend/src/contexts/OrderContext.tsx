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
}

export interface DeliveryAddress {
  area: string;
  block: string;
  street: string;
  building: string;
  floor?: string;
  apartment?: string;
  additional_directions?: string;
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

// Default branch - Bam Burgers Kitchen Park Salwa
const DEFAULT_BRANCH: Branch = {
  id: '3f9570b2-24d2-4f2d-81d7-25c6b35da76b',
  name: 'Kitchen Park Salwa',
  name_ar: 'كيتشن بارك سلوى',
  address: 'Kitchen Park Salwa - 834C+HH Rumaithiya, Kuwait',
  address_ar: 'كيتشن بارك سلوى - 834C+HH الرميثية، الكويت',
  phone: '+965 9474 5424',
  is_open: true,
  opening_hours: 'Daily 11:00 AM - 1:00 AM',
};

const ORDER_TYPE_KEY = 'bam-order-type';
const ADDRESS_KEY = 'bam-delivery-address';

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [orderType, setOrderTypeState] = useState<OrderType>(() => {
    const stored = localStorage.getItem(ORDER_TYPE_KEY);
    return (stored === 'pickup' || stored === 'delivery') ? stored : 'delivery';
  });

  const [selectedBranch] = useState<Branch>(DEFAULT_BRANCH);

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
    // Single branch for now
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
