export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type:
    | "ORDER_PAID"
    | "ORDER_SHIPPED"
    | "ORDER_DELIVERED"
    | "ORDER_CANCELLED"
    | "ORDER_CANCELLED_BY_CUSTOMER"
    | "NEW_MESSAGE"
    | "NEW_SALE"
    | "PRODUCT_QUESTION"
    | "QUESTION_ANSWERED";
  isRead: boolean;
  createdAt: string;
  productSlug?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalItems: number;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  finalPrice: number;
  name: string;
  slug: string;
  sku: string;
  productImage: string;
}

export interface Conversation {
  id: string;
  orderId: string;
  orderNumber: string;
  buyerId: string;
  sellerId: string;
  storeId: string;
  storeName: string;
  itemSummary: string;
  unreadCount: number;
  otherUserName: string;
  lastMessage?: string;
  updatedAt: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
}

export interface Order {
  id: string;
  customerId: string;
  orderNumber: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  subtotal: number;
}

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "SHIPPED"
  | "CANCELLED"
  | "REFUNDED"
  | "DELIVERED";

export interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  page: number;
  totalElements: number;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  stock: number;
  averageRating: number;
  category: string;
  features?: string[];
  isFavorite?: boolean;
  productImage?: string;
  isActive: boolean;
  purchaseCount: number;
  discount?: ProductDiscount;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDiscount {
  code: string;
  percentage: number;
  expirationDate: string;
}

export interface ProductQuestion {
  id: string;
  productId: string;
  buyerId: string;
  questionText: string;
  answerText: string | null;
  status: "OPEN" | "ANSWERED";
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  authorId: string;
  title: string;
  description: string;
  username: string;
  rating: number;
  reviewImage?: string;
  postedAt: string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  adminIds: string[];
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  storeId?: string;
  active: boolean;
  avatar: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole =
  | "CUSTOMER"
  | "SALES_ADMIN"
  | "SUPER_ADMIN"
  | "SUPPORT"
  | "DELIVERY_AGENT";
