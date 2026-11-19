import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function TransactionPagination({
  page,
  totalPages,
  onPageChange,
}: Props) {
  if (totalPages <= 0) {
    return null;
  }

  return (
    <div
      className="
        flex
        flex-col
        gap-3
        border-t
        border-slate-200
        bg-white
        px-4
        py-4

        sm:flex-row
        sm:items-center
        sm:justify-between
        sm:px-6
      "
    >
      {/* PAGE INFO */}

      <p
        className="
          text-sm
          text-slate-500
        "
      >
        Page{" "}
        <span
          className="
            font-semibold
            text-slate-900
          "
        >
          {page}
        </span>{" "}
        of{" "}
        <span
          className="
            font-semibold
            text-slate-900
          "
        >
          {totalPages}
        </span>
      </p>

      {/* BUTTONS */}

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() =>
            onPageChange(page - 1)
          }
          className="
            inline-flex
            h-9
            items-center
            gap-1.5
            rounded-lg
            border
            border-slate-200
            bg-white
            px-3
            text-sm
            font-medium
            text-slate-700

            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() =>
            onPageChange(page + 1)
          }
          className="
            inline-flex
            h-9
            items-center
            gap-1.5
            rounded-lg
            border
            border-slate-200
            bg-white
            px-3
            text-sm
            font-medium
            text-slate-700

            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}