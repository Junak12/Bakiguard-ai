export interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  totalCredit?: number;
  totalPayment?: number;
  currentBaki?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerData {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}