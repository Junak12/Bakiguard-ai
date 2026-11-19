import api from "@/lib/api";

export async function getTransactions(
  page = 1,
  limit = 10
) {
  const response = await api.get("/transactions", {
    params: {
      page,
      limit,
    },
  });

  return response.data;
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