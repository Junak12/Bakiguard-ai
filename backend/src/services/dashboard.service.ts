import { Customer } from "../model/Customer";
import { Transaction } from "../model/Transaction";


export async function getDashboardStats() {
  const totalCustomers = await Customer.countDocuments();

  const transactions = await Transaction.find();

  let totalCredit = 0;
  let totalPayment = 0;

  for (const transaction of transactions) {
    if (transaction.type === "CREDIT") {
      totalCredit += transaction.amount;
    }

    if (transaction.type === "PAYMENT") {
      totalPayment += transaction.amount;
    }
  }

  const totalBaki = totalCredit - totalPayment;

  return {
    totalCustomers,
    totalCredit,
    totalPayment,
    totalBaki,
  };
}