"use client";

import { useState, useEffect, ReactNode } from "react";

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ClientOnly({ children, fallback }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <>
        {fallback || (
          <div className="animate-pulse">
            <div className="h-20 bg-gray-600/20 rounded"></div>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}
