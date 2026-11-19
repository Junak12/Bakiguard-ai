import {
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";

interface Transaction {
  _id: string;
  customerName: string;
  type: "CREDIT" | "PAYMENT";
  amount: number;
  description?: string;
  transactionDate: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export default function RecentTransactions({
  transactions,
}: RecentTransactionsProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-100 p-5">
        <div>
          <h2 className="font-semibold text-zinc-900">
            Recent Transactions
          </h2>

          <p className="mt-1 text-xs text-zinc-400">
            Latest activity from your customers
          </p>
        </div>

        <button className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          View all
        </button>
      </div>

      <div className="divide-y divide-zinc-100">
        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-zinc-400">
              No transactions yet.
            </p>
          </div>
        ) : (
          transactions.map((transaction) => {
            const isCredit =
              transaction.type === "CREDIT";

            return (
              <div
                key={transaction._id}
                className="flex items-center justify-between p-5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      isCredit
                        ? "bg-amber-50"
                        : "bg-emerald-50"
                    }`}
                  >
                    {isCredit ? (
                      <ArrowUpRight
                        size={17}
                        className="text-amber-600"
                      />
                    ) : (
                      <ArrowDownLeft
                        size={17}
                        className="text-emerald-600"
                      />
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {transaction.customerName}
                    </p>

                    <p className="text-xs text-zinc-400">
                      {transaction.description ||
                        (isCredit
                          ? "Credit given"
                          : "Payment received")}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${
                      isCredit
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {isCredit ? "+" : "-"}৳
                    {transaction.amount.toLocaleString()}
                  </p>

                  <p className="text-xs text-zinc-400">
                    {new Date(
                      transaction.transactionDate
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}