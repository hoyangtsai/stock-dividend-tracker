import React from 'react'
import { clsx } from "clsx"

const LoadingMask = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className={clsx(isVisible ? "flex" : "none", "absolute top-0 left-0 bg-black bg-opacity-50 w-full h-full z-20 items-center justify-center")}>
      <span className="loading loading-spinner loading-lg"></span>
    </div>
  )
}

export default LoadingMask