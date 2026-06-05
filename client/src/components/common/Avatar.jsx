import React from "react";

const Avatar = ({ src, alt = "Avatar", className = "", fallbackSrc = "/default-avatar.svg", ...props }) => {
  return (
    <img
      src={src || fallbackSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = fallbackSrc;
      }}
      {...props}
    />
  );
};

export default Avatar;
