'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

export function Navbar() {
  const { data: session, status } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)

  const isAdmin = session?.user?.role === 'ADMIN'

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">GS</span>
              </div>
              <span className="font-semibold text-gray-900 hidden sm:block">
                Ghent Study Spots
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/locations"
              className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              Locations
            </Link>
            <Link
              href="/map"
              className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              Map
            </Link>

            {status === 'authenticated' ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/favorites"
                  className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Favorites
                </Link>
                <Link
                  href="/plans"
                  className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  My Plans
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
                  <span className="text-sm text-gray-500">
                    {session.user.name}
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-sm text-gray-600 hover:text-primary-600 font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col space-y-2">
              <Link
                href="/locations"
                className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium"
                onClick={() => setMenuOpen(false)}
              >
                Locations
              </Link>
              <Link
                href="/map"
                className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium"
                onClick={() => setMenuOpen(false)}
              >
                Map
              </Link>
              {status === 'authenticated' ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium"
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/favorites"
                    className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium"
                    onClick={() => setMenuOpen(false)}
                  >
                    Favorites
                  </Link>
                  <Link
                    href="/plans"
                    className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium"
                    onClick={() => setMenuOpen(false)}
                  >
                    My Plans
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium"
                      onClick={() => setMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      signOut({ callbackUrl: '/' })
                    }}
                    className="text-left text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium"
                  >
                    Sign Out ({session.user.name})
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium"
                    onClick={() => setMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
