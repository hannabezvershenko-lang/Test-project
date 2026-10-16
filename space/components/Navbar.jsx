const NAV_LINKS = ["Home", "Voyages", "Worlds", "Innovation", "Plan Launch"];

function Navbar() {
  return (
    <nav className="fixed top-4 left-0 right-0 z-50 px-8 lg:px-16">
      <div className="flex items-center justify-between">
        <a href="#" className="liquid-glass rounded-full h-12 w-12 flex items-center justify-center shrink-0">
          <span className="font-heading italic lowercase text-white text-2xl leading-none">a</span>
        </a>

        <div className="hidden md:flex liquid-glass rounded-full px-1.5 py-1.5 items-center">
          {NAV_LINKS.map((label) => (
            <a key={label} href="#" className="px-3 py-2 text-sm font-medium text-white/90 font-body hover:text-white">
              {label}
            </a>
          ))}
          <a href="#" className="ml-1 inline-flex items-center gap-1 rounded-full bg-white text-black px-4 py-2 text-sm font-medium font-body whitespace-nowrap">
            Claim a Spot
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="h-12 w-12 shrink-0" aria-hidden="true" />
      </div>
    </nav>
  );
}

window.Navbar = Navbar;
