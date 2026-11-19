export default function TransactionSkeleton() {
  return (
    <div
      className="
        divide-y
        divide-slate-100

        dark:divide-slate-800
      "
    >
      {Array.from({ length: 6 }).map(
        (_, index) => (
          <div
            key={index}
            className="
              flex
              items-center
              gap-6
              bg-white
              px-6
              py-5

              dark:bg-slate-950
            "
          >
            <div
              className="
                h-4
                w-24
                animate-pulse
                rounded
                bg-slate-100

                dark:bg-slate-800
              "
            />

            <div className="flex flex-1 items-center gap-3">
              <div
                className="
                  h-9
                  w-9
                  animate-pulse
                  rounded-full
                  bg-slate-100

                  dark:bg-slate-800
                "
              />

              <div className="space-y-2">
                <div
                  className="
                    h-4
                    w-32
                    animate-pulse
                    rounded
                    bg-slate-100

                    dark:bg-slate-800
                  "
                />

                <div
                  className="
                    h-3
                    w-20
                    animate-pulse
                    rounded
                    bg-slate-100

                    dark:bg-slate-800
                  "
                />
              </div>
            </div>

            <div
              className="
                h-6
                w-20
                animate-pulse
                rounded-full
                bg-slate-100

                dark:bg-slate-800
              "
            />

            <div
              className="
                h-4
                w-24
                animate-pulse
                rounded
                bg-slate-100

                dark:bg-slate-800
              "
            />

            <div
              className="
                h-4
                w-32
                animate-pulse
                rounded
                bg-slate-100

                dark:bg-slate-800
              "
            />
          </div>
        )
      )}
    </div>
  );
}