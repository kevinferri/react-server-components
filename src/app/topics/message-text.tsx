import Link from "next/link";
import Linkify from "react-linkify";

type Props = {
  text?: string | null;
  id: string;
  isNewestMessage?: boolean;
};

export function MessageText(props: Props) {
  return (
    <Linkify
      componentDecorator={(decoratedHref, decoratedText, key) => (
        <Link
          key={key}
          target="_blank"
          href={decoratedHref}
          className="underline text-purple-700 dark:text-purple-500 underline-offset-4 hover:opacity-80"
        >
          {decoratedText}
        </Link>
      )}
    >
      <div
        className="whitespace-pre-line break-word leading-normal"
        style={{ overflowWrap: "anywhere" }}
      >
        {props.text}
      </div>
    </Linkify>
  );
}
