import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#2E2C28] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo */}
          <div>
            <span className="text-xl font-black">
              <span className="text-[#F59E0B]">Maste</span>
              <span className="text-white">X</span>
            </span>
            <p className="text-xs text-[#6B6860] mt-1">
              AI-powered WAEC mastery for Ghana SHS
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-[#6B6860]">
            <Link href="/auth/signup" className="hover:text-white transition-colors">
              Sign Up
            </Link>
            <Link href="/auth/login" className="hover:text-white transition-colors">
              Login
            </Link>
            <Link href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-xs text-[#6B6860]">
            © {new Date().getFullYear()} MasteX. Built for Ghana.
          </p>
        </div>
      </div>
    </footer>
  );
}
