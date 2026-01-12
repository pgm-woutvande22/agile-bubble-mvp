import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">GS</span>
              </div>
              <span className="font-semibold text-gray-900">
                Ghent Study Spots
              </span>
            </div>
            <p className="text-gray-500 text-sm max-w-md">
              Find the perfect study spot in Ghent with real-time occupancy and
              noise levels. Plan your study sessions and never waste time looking
              for a quiet place again.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/locations"
                  className="text-gray-500 hover:text-primary-600 text-sm"
                >
                  All Locations
                </Link>
              </li>
              <li>
                <Link
                  href="/map"
                  className="text-gray-500 hover:text-primary-600 text-sm"
                >
                  Map View
                </Link>
              </li>
              <li>
                <Link
                  href="/favorites"
                  className="text-gray-500 hover:text-primary-600 text-sm"
                >
                  My Favorites
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Data Source</h4>
            <p className="text-gray-500 text-sm mb-2">
              Location data powered by:
            </p>
            <a
              href="https://data.stad.gent/explore/dataset/bloklocaties-gent/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              Stad Gent Open Data
            </a>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Ghent Study Spots. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm mt-2 sm:mt-0">
            Made with ❤️ for students in Ghent
          </p>
        </div>
      </div>
    </footer>
  )
}
