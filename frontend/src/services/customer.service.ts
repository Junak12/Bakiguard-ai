import api from "@/lib/api";


export async function getCustomers() {
  const response = await api.get("/customers");

  return response.data.data;
}

export async function getCustomer(id: string) {
  const response = await api.get(`/customers/${id}`);

  return response.data.data;
}

export async function getCustomerTransactions(
  customerId: string,
  page = 1,
  limit = 10
) {
  const response = await api.get(
    `/transactions/customer/${customerId}`,
    {
      params: {
        page,
        limit,
      },
    }
  );

  return response.data;
}

export async function createTransaction(data: {
  customerId: string;
  type: "CREDIT" | "PAYMENT";
  amount: number;
  description?: string;
}) {
  const response = await api.post(
    "/transactions",
    data
  );

  return response.data.data;
}


export async function updateCustomer(id: string, data: { name?: string; phone?: string; address?: string; }) {
  const response = await api.patch(`/customers/${id}`, data);
  return response.data.data;
}

export async function deleteCustomer(id: string) {
  const response = await api.delete(`/customers/${id}`);

  return response.data;
}