import Image from "next/image";

import { IMAGES } from "@/lib/constants";

/**
 * Full-width dark banner used by content pages (About Us, Why Us, Contact…).
 */
export default function Banner({
  imageUrl,
  title,
  height = "h-64",
}: {
  imageUrl?: string;
  title: string;
  height?: string;
}) {
  return (
    <div className={`relative w-full ${height} mt-6 overflow-hidden`}>
      <Image
        src={imageUrl ?? IMAGES.contentBanner}
        alt={`${title} banner`}
        fill
        style={{ objectFit: "cover" }}
        priority
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
        <h1 className="text-white text-4xl md:text-5xl font-bold text-center px-4">{title}</h1>
      </div>
    </div>
  );
}
