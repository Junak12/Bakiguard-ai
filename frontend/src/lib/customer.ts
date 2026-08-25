import api from "./api";
import {
  Customer,
  CreateCustomerData,
} from "@/types/customer";

export async function getCustomers(): Promise<Customer[]> {
  const response = await api.get("/customers");

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