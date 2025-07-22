"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

interface AuthFormProps {
  type: "login" | "register" | "forgot-password" | "reset-password"
  token?: string // For reset-password
}

export function AuthForm({ type, token }: AuthFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      if (type === "register") {
        if (password !== confirmPassword) {
          setError("Passwords do not match.")
          return
        }
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.message || "Registration failed.")
        }
        setSuccessMessage("Registration successful! Redirecting to login...")
        setTimeout(() => router.push("/login"), 2000)
      } else if (type === "login") {
        const result = await signIn("credentials", {
          redirect: false,
          email,
          password,
        })
        if (result?.error) {
          setError(result.error)
        } else {
          setSuccessMessage("Login successful! Redirecting to dashboard...")
          router.push("/dashboard")
        }
      } else if (type === "forgot-password") {
        const response = await fetch("/api/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.message || "Failed to send reset link.")
        }
        setSuccessMessage(data.message)
      } else if (type === "reset-password" && token) {
        if (password !== confirmPassword) {
          setError("Passwords do not match.")
          return
        }
        const response = await fetch(`/api/reset/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.message || "Failed to reset password.")
        }
        setSuccessMessage("Password reset successfully! Redirecting to login...")
        setTimeout(() => router.push("/login"), 2000)
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" })
  }

  const title =
    type === "login"
      ? "Login"
      : type === "register"
        ? "Register"
        : type === "forgot-password"
          ? "Forgot Password"
          : "Reset Password"
  const description =
    type === "login"
      ? "Enter your credentials to access your account."
      : type === "register"
        ? "Create a new account."
        : type === "forgot-password"
          ? "Enter your email to receive a password reset link."
          : "Enter your new password."

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === "register" && (
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          {type !== "reset-password" && (
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          )}
          {(type === "login" || type === "register" || type === "reset-password") && (
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}
          {(type === "register" || type === "reset-password") && (
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {successMessage && <p className="text-green-500 text-sm">{successMessage}</p>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {type === "login"
              ? "Login"
              : type === "register"
                ? "Register"
                : type === "forgot-password"
                  ? "Send Reset Link"
                  : "Reset Password"}
          </Button>
        </form>

        {type === "login" && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.0003 4.75C14.0273 4.75 15.8003 5.45 17.1503 6.85L20.0253 3.975C18.0403 1.99 15.2303 0.75 12.0003 0.75C7.72831 0.75 4.02531 3.255 2.37531 6.885L6.00031 9.76C6.95031 7.255 9.22531 4.75 12.0003 4.75Z" />
                <path d="M23.25 12.2499C23.25 11.4899 23.185 10.7499 23.055 10.0299H12.25V14.2499H18.725C18.435 15.7799 17.57 17.0999 16.315 17.9999L20.085 20.9999C22.205 19.0149 23.25 16.0999 23.25 12.2499Z" />
                <path d="M6.00031 9.75996C5.72531 10.4299 5.57531 11.1499 5.57531 11.8799C5.57531 12.6099 5.72531 13.3299 6.00031 13.9999L2.36531 16.8749C1.30531 14.7499 0.750312 12.3799 0.750312 9.99996C0.750312 7.61996 1.30531 5.24996 2.36531 3.12496L6.00031 6.00001L6.00031 9.75996Z" />
                <path d="M12.25 23.2499C15.23 23.2499 17.835 22.2049 19.855 20.5499L16.315 17.9999C15.23 18.7299 13.845 19.2499 12.25 19.2499C9.225 19.2499 6.95 17.2599 6.00001 14.7599L2.375 17.6249C4.025 21.2549 7.728 23.2499 12.25 23.2499Z" />
              </svg>
              Google
            </Button>
          </>
        )}

        <div className="text-center text-sm">
          {type === "login" && (
            <>
              Don't have an account?{" "}
              <Link href="/register" className="underline">
                Sign up
              </Link>
              <br />
              <Link href="/reset" className="underline">
                Forgot password?
              </Link>
            </>
          )}
          {type === "register" && (
            <>
              Already have an account?{" "}
              <Link href="/login" className="underline">
                Login
              </Link>
            </>
          )}
          {type === "forgot-password" && (
            <>
              Remember your password?{" "}
              <Link href="/login" className="underline">
                Login
              </Link>
            </>
          )}
          {type === "reset-password" && (
            <>
              <Link href="/login" className="underline">
                Back to Login
              </Link>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
