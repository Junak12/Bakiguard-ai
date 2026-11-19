import { Receipt, SearchX } from "lucide-react";

interface Props {
  hasFilters?: boolean;
}

export default function TransactionEmptyState({
  hasFilters = false,
}: Props) {
  return (
    <div
      className="
        flex
        flex-col
        items-center
        justify-center
        px-6
        py-20
        text-center
        bg-white
        dark:bg-slate-950
      "
    >
      <div
        className="
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-2xl
          bg-slate-50
          ring-1
          ring-slate-100

          dark:bg-slate-900
          dark:ring-slate-800
        "
      >
        {hasFilters ? (
          <SearchX
            className="
              h-6
              w-6
              text-slate-400

              dark:text-slate-500
            "
          />
        ) : (
          <Receipt
            className="
              h-6
              w-6
              text-slate-400

              dark:text-slate-500
            "
          />
        )}
      </div>

      <h3
        className="
          mt-4
          text-sm
          font-semibold
          text-slate-900

          dark:text-white
        "
      >
        {hasFilters
          ? "No matching transactions"
          : "No transactions yet"}
      </h3>

      <p
        className="
          mt-1
          max-w-sm
          text-sm
          leading-6
          text-slate-500

          dark:text-slate-400
        "
      >
        {hasFilters
          ? "Try adjusting your search or filters to find what you're looking for."
          : "Your customer credit and payment activity will appear here."}
      </p>
    </div>
  );
}