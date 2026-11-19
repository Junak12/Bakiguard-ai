export interface Customer {
  _id: string;
  userId: string;

  name: string;
  phone: string;
  address?: string;

  totalDue: number;

  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerData {
  name: string;
  phone: string;
  address?: string;
}
