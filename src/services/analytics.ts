// Google Analytics event tracking
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (window.gtag) {
    window.gtag('event', eventName, eventParams);
  } else {
    console.warn('Google Analytics not loaded');
  }
};

// Page view tracking
export const trackPageView = (path: string, title: string) => {
  if (window.gtag) {
    window.gtag('config', 'G-W5E6DXV7LY', {
      page_path: path,
      page_title: title
    });
  } else {
    console.warn('Google Analytics not loaded');
  }
};

// E-commerce tracking for adding items to cart
export const trackAddToCart = (
  productId: string,
  productName: string,
  price: number,
  quantity: number
) => {
  trackEvent('add_to_cart', {
    currency: 'EUR',
    value: price * quantity,
    items: [
      {
        item_id: productId,
        item_name: productName,
        price: price,
        quantity: quantity
      }
    ]
  });
};

// E-commerce tracking for beginning checkout
export const trackBeginCheckout = (
  items: Array<{
    productId: string;
    productName: string;
    price: number;
    quantity: number;
  }>,
  value: number
) => {
  trackEvent('begin_checkout', {
    currency: 'EUR',
    value: value,
    items: items.map(item => ({
      item_id: item.productId,
      item_name: item.productName,
      price: item.price,
      quantity: item.quantity
    }))
  });
};

// E-commerce tracking for purchase completion
export const trackPurchase = (
  transactionId: string,
  value: number,
  items: Array<{
    productId: string;
    productName: string;
    price: number;
    quantity: number;
  }>
) => {
  trackEvent('purchase', {
    transaction_id: transactionId,
    value: value,
    currency: 'EUR',
    items: items.map(item => ({
      item_id: item.productId,
      item_name: item.productName,
      price: item.price,
      quantity: item.quantity
    }))
  });
};