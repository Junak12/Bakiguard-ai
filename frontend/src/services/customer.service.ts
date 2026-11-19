import api from "@/lib/api";

export async function getCustomer(id: string) {
  const response = await api.get(`/customers/${id}`);

  return response.data.data;
}

export async function getCustomerTransactions(customerId: string, page = 1, limit = 10) {
  const response = await api.get(`/transactions/customer/${customerId}`, {
    params: { page, limit },
  });

  return response.data;
}

export async function createTransaction(data: {
  customerId: string;
  type: "CREDIT" | "PAYMENT";
  amount: number;
  description?: string;
  /** ISO date; CREDIT only. Defaults to the shop's credit term. */
  dueDate?: string;
}) {
  const response = await api.post("/transactions", data);

  return response.data.data;
}
