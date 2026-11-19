interface Props {
  type: "CREDIT" | "PAYMENT";
}

export default function TransactionTypeBadge({
  type,
}: Props) {
  const isPayment = type === "PAYMENT";

  return (
    <span
      className={`
        inline-flex
        shrink-0
        items-center
        rounded-full
        px-2.5
        py-1
        text-[10px]
        font-semibold
        uppercase
        tracking-wide

        ${
          isPayment
            ? `
              bg-emerald-50
              text-emerald-600
              dark:bg-emerald-500/10
              dark:text-emerald-400
            `
            : `
              bg-red-50
              text-red-600
              dark:bg-red-500/10
              dark:text-red-400
            `
        }
      `}
    >
      {type}
    </span>
  );
}