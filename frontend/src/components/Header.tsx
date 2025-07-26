"use client";

export function Header() {
  return (
    <header className="nav-miami">
      {/* Palm Tree Silhouettes */}
      <div className="palm-tree palm-tree-left"></div>
      <div className="palm-tree palm-tree-right"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-cyan-400 to-pink-400 flex items-center justify-center shadow-lg shadow-cyan-400/50">
                <svg
                  className="w-6 h-6 text-black font-bold"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-miami-gradient">
                  TrustBank
                </h1>
                <p className="text-xs text-neon-cyan -mt-1 font-bold">
                  MIAMI DEFI
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="nav-link-miami">
              LEND
            </a>
            <a href="#" className="nav-link-miami">
              BORROW
            </a>
            <a href="#" className="nav-link-miami">
              TRUST NETWORK
            </a>
            <a href="#" className="nav-link-miami">
              YIELD
            </a>
          </nav>

          {/* Connect Button - Using official AppKit web component */}
          <div className="flex items-center">
            <appkit-button />
          </div>
        </div>
      </div>
    </header>
  );
}
