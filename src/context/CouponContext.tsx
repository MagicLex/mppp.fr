import React, { createContext, useContext, useState, useEffect } from 'react';

interface CouponContextType {
  couponCode: string | null;
  discountRate: number; // 10% = 0.1
  removeCoupon: () => void;
  getDiscountedPrice: (price: number) => number;
  getDiscountAmount: (price: number) => number;
}

const CouponContext = createContext<CouponContextType>({
  couponCode: null,
  discountRate: 0,
  removeCoupon: () => {},
  getDiscountedPrice: (price) => price,
  getDiscountAmount: () => 0,
});

export const useCoupon = () => useContext(CouponContext);

export const CouponProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const discountRate = 0.1; // 10% discount for all coupons

  useEffect(() => {
    // Check for coupon in localStorage on mount
    const storedCoupon = localStorage.getItem('mpp_coupon');
    if (storedCoupon) {
      setCouponCode(storedCoupon);
    }
  }, []);

  const removeCoupon = () => {
    localStorage.removeItem('mpp_coupon');
    setCouponCode(null);
  };

  const getDiscountedPrice = (price: number) => {
    if (!couponCode) return price;
    return price * (1 - discountRate);
  };

  const getDiscountAmount = (price: number) => {
    if (!couponCode) return 0;
    return price * discountRate;
  };

  return (
    <CouponContext.Provider 
      value={{ 
        couponCode, 
        discountRate: couponCode ? discountRate : 0,
        removeCoupon,
        getDiscountedPrice,
        getDiscountAmount
      }}
    >
      {children}
    </CouponContext.Provider>
  );
};