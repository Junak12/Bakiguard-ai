import api from "./api";
import {
  Customer,
  CreateCustomerData,
} from "@/types/customer";

export interface CustomerListParams {
  search?: string;
  /** "due": owes anything. "overdue": has money past its due date. */
  status?: "all" | "due" | "overdue";
}

export async function getCustomers(params: CustomerListParams = {}): Promise<Customer[]> {
  const response = await api.get("/customers", { params });

  return response.data.data;
}

export async function getCustomerById(
  id: string
): Promise<Customer> {
  const response = await api.get(`/customers/${id}`);

  return response.data.data;
}

export async function createCustomer(
  data: CreateCustomerData
): Promise<Customer> {
  const response = await api.post(
    "/customers",
    data
  );

  return response.data.data;
}

export async function updateCustomer(
  id: string,
  data: Partial<CreateCustomerData>
): Promise<Customer> {
  const response = await api.patch(
    `/customers/${id}`,
    data
  );

  return response.data.data;
}

export async function deleteCustomer(
  id: string
) {
  const response = await api.delete(
    `/customers/${id}`
  );

  return response.data;
}