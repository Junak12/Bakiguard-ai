import {
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface Props {
  error: string;
  onRetry: () => void;
  loading?: boolean;
}

export default function TransactionErrorState({
  error,
  onRetry,
  loading = false,
}: Props) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-red-200
        bg-red-50/70
        p-4

        dark:border-red-900/50
        dark:bg-red-950/30
      "
    >
      <div className="flex items-start gap-3">
        <div
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-lg
            bg-red-100

            dark:bg-red-900/40
          "
        >
          <AlertCircle
            className="
              h-5
              w-5
              text-red-600

              dark:text-red-400
            "
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3
            className="
              text-sm
              font-semibold
              text-red-800

              dark:text-red-300
            "
          >
            Unable to load transactions
          </h3>

          <p
            className="
              mt-1
              text-sm
              leading-5
              text-red-700

              dark:text-red-400
            "
          >
            {error}
          </p>
        </div>

        <button
          type="button"
          onClick={onRetry}
          disabled={loading}
          className="
            inline-flex
            shrink-0
            items-center
            gap-2
            rounded-lg
            border
            border-red-200
            bg-white
            px-3
            py-2
            text-xs
            font-semibold
            text-red-700
            transition-colors

            hover:bg-red-50

            disabled:cursor-not-allowed
            disabled:opacity-50

            dark:border-red-800
            dark:bg-slate-950
            dark:text-red-300

            dark:hover:bg-red-950/40
          "
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${
              loading ? "animate-spin" : ""
            }`}
          />

          Retry
        </button>
      </div>
    </div>
  );
}