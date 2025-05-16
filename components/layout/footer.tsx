import Link from "next/link"
import Image from "next/image"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-muted py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Image src="/images/logo.png" alt="Spectrum 4 Logo" width={150} height={40} className="h-10 w-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Spectrum 4 Strata provides community information and resources for residents.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/documents" className="text-sm text-muted-foreground hover:text-foreground">
                  Documents
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Contact</h3>
            <address className="not-italic text-sm text-muted-foreground">
              <p>Spectrum 4 Strata</p>
              <p>Email: info@spectrum4.ca</p>
              <p>Website: www.spectrum4.ca</p>
            </address>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-muted-foreground/20">
          <p className="text-sm text-center text-muted-foreground">
            &copy; {currentYear} Spectrum 4 Strata. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
