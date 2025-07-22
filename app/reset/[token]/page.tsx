import { AuthForm } from "@/components/auth-form"

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <AuthForm type="reset-password" token={params.token} />
    </div>
  )
}
