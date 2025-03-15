export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  options?: OrderOption[];
}

export interface OrderOption {
  id: string;
  name: string;
  price: number;
  type: 'drink' | 'sauce' | 'side' | 'extra';
  description?: string;
}

export interface OrderDetails {
  name: string;
  phone: string;
  email: string;
  pickupTime: string;
}

export interface HubspotContact {
  email: string;
  firstname: string;
  phone: string;
  lastorder?: string;
}

export interface PaymentIntent {
  clientSecret: string;
  id: string;
}