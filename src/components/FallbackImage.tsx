"use client";

import { useState, type ImgHTMLAttributes } from "react";

type FallbackImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fallbackSrc?: string;
};

export default function FallbackImage({
  src,
  alt,
  fallbackSrc = "/valorantLogo.png",
  referrerPolicy = "no-referrer",
  onError,
  ...rest
}: FallbackImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);

  return (
    <img
      {...rest}
      src={currentSrc || fallbackSrc}
      alt={alt}
      referrerPolicy={referrerPolicy}
      onError={(event) => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }

        onError?.(event);
      }}
    />
  );
}
