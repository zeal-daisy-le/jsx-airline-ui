import Head from "next/head"
import Link from "next/link"
import { LoginForm } from "@/features/auth/components/LoginForm"

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Sign in — JSX</title>
        <meta
          name="description"
          content="Sign in to your JSX account to manage bookings and enjoy faster checkout."
        />
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="flex min-h-screen flex-col bg-gray-50">
        <header className="border-b border-gray-100 bg-white">
          <div className="container flex h-16 items-center">
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight text-jsx-red"
              aria-label="JSX home"
            >
              JSX
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="rounded-xl border border-gray-200 bg-white px-8 py-10 shadow-sm">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-jsx-black">Sign in to JSX</h1>
                <p className="mt-2 text-sm text-gray-500">
                  No account?{" "}
                  <Link
                    href="/booking/flights"
                    className="font-medium text-jsx-red hover:text-jsx-red-dark"
                  >
                    Continue as guest
                  </Link>
                </p>
              </div>

              <LoginForm />
            </div>
          </div>
        </main>

        <footer className="py-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} JSX. All rights reserved.
        </footer>
      </div>
    </>
  )
}
