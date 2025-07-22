import { AuthForm } from "@/components/auth-form"

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <AuthForm type="register" />
    </div>
  )
}
