import type { Notice as NoticeType } from "../types";
import { cx } from "../lib/utils";
import { noticeStyles } from "./styles";

interface NoticeProps {
  notice: NoticeType;
}

export function Notice({ notice }: NoticeProps) {
  return (
    <div
      className={cx(
        "rounded-2xl border px-4 py-3 text-sm animate-in fade-in slide-in-from-top-2 duration-300",
        noticeStyles[notice.type],
      )}
      role="alert"
    >
      {notice.message}
    </div>
  );
}
