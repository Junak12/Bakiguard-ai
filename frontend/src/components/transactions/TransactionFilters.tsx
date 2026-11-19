"use client";

import {
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { TransactionType } from "@/types/transaction";

interface Props {
  search: string;
  typeFilter: "ALL" | TransactionType;
  onSearchChange: (value: string) => void;
  onTypeChange: (
    value: "ALL" | TransactionType
  ) => void;
}

export default function TransactionFilters({
  search,
  typeFilter,
  onSearchChange,
  onTypeChange,
}: Props) {
  const hasFilters =
    search.trim().length > 0 ||
    typeFilter !== "ALL";

  const clearFilters = () => {
    onSearchChange("");
    onTypeChange("ALL");
  };

  return (
    <section
      className="
        rounded-[22px]
        border
        border-slate-200
        bg-white
        shadow-sm
      "
    >
      <div className="p-5 sm:p-6">

        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-purple-50
              "
            >
              <SlidersHorizontal
                className="
                  h-5
                  w-5
                  text-purple-600
                "
              />
            </div>

            <div>
              <h2
                className="
                  text-sm
                  font-bold
                  text-slate-900
                "
              >
                Transaction Filters
              </h2>

              <p
                className="
                  mt-0.5
                  text-xs
                  text-slate-500
                "
              >
                Search and filter your transaction history
              </p>
            </div>
          </div>

          {hasFilters && (
            <span
              className="
                hidden
                rounded-full
                bg-purple-50
                px-3
                py-1.5
                text-xs
                font-semibold
                text-purple-700
                sm:inline-flex
              "
            >
              Filters active
            </span>
          )}
        </div>

        <div
          className="
            flex
            flex-col
            gap-3
            lg:flex-row
          "
        >
          {/* SEARCH */}

          <div className="relative flex-1">
            <Search
              className="
                pointer-events-none
                absolute
                left-3.5
                top-1/2
                h-4
                w-4
                -translate-y-1/2
                text-slate-400
              "
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                onSearchChange(e.target.value)
              }
              placeholder="Search customer or description..."
              className="
                h-11
                w-full
                rounded-xl
                border
                border-slate-200
                bg-white
                pl-10
                pr-10
                text-sm
                font-medium
                text-slate-900
                outline-none

                placeholder:text-slate-400

                hover:border-slate-300

                focus:border-purple-400
                focus:ring-4
                focus:ring-purple-100
              "
            />

            {search.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  onSearchChange("")
                }
                className="
                  absolute
                  right-3
                  top-1/2
                  flex
                  h-6
                  w-6
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-md
                  text-slate-400

                  hover:bg-slate-100
                  hover:text-slate-700
                "
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* TYPE */}

          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) =>
                onTypeChange(
                  e.target.value as
                    | "ALL"
                    | TransactionType
                )
              }
              className="
                h-11
                w-full
                min-w-[190px]
                appearance-none
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                pr-10
                text-sm
                font-semibold
                text-slate-700
                outline-none

                hover:border-slate-300

                focus:border-purple-400
                focus:ring-4
                focus:ring-purple-100
              "
            >
              <option value="ALL">
                All transactions
              </option>

              <option value="CREDIT">
                Credit
              </option>

              <option value="PAYMENT">
                Payment
              </option>
            </select>

            <div
              className="
                pointer-events-none
                absolute
                right-3
                top-1/2
                -translate-y-1/2
                text-slate-400
              "
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>

          {/* CLEAR */}

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="
                inline-flex
                h-11
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-purple-200
                bg-purple-50
                px-5
                text-sm
                font-semibold
                text-purple-700

                hover:bg-purple-100
              "
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </div>
    </section>
  );
}