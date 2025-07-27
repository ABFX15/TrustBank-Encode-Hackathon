"use client";

export function Header() {
  return (
    <header className="nav-synthwave">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-cyan-400 to-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/50">
                <span className="text-lg font-black text-black">💎</span>
              </div>
              <div>
                <h1 className="chrome-text text-2xl font-bold">TrustBank</h1>
                <p className="text-xs text-pink-400 -mt-1 font-bold tracking-wider">
                  DEFI BANKING
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="nav-link-synthwave">
              LEND
            </a>
            <a href="#" className="nav-link-synthwave">
              BORROW
            </a>
            <a href="#" className="nav-link-synthwave">
              TRUST NETWORK
            </a>
            <a href="#" className="nav-link-synthwave">
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
