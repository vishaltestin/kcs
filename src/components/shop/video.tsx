export function Video({ src }: { src: string }) {
  const youtubeMatch = src.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/
  );

  return (
    <div className="rounded-lg overflow-hidden aspect-video bg-black">
      {youtubeMatch ? (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
          title="Product video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      ) : (
        <video src={src} controls className="w-full h-full" preload="metadata">
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
}
