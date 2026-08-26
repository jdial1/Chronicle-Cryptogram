export function DropCapParagraph({
  text,
  className = '',
  night = false,
}: {
  text: string;
  className?: string;
  night?: boolean;
}) {
  const kickerMatch = text.match(/^\([^)]*\)\s*/);
  const kicker = kickerMatch?.[0].trim();
  const story = (kickerMatch ? text.slice(kickerMatch[0].length) : text).trimStart();
  const letter = story.match(/^[A-Za-z]/)?.[0];
  const rest = letter ? story.slice(1) : story;

  return (
    <>
      {kicker && <p className={className}>{kicker}</p>}
      <p className={className}>
        {letter && (
          <span className={`article-dropcap-letter ${night ? 'is-night' : ''}`}>{letter}</span>
        )}
        {rest}
      </p>
    </>
  );
}
