import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/lib/models/user"
import PasswordResetToken from "@/lib/models/password-reset"

export async function POST(req: Request, { params }: { params: { token: string } }) {
  try {
    await connectToDatabase()
    const { token } = params
    const { password } = await req.json()

    if (!password) {
      return NextResponse.json({ message: "New password is required" }, { status: 400 })
    }

    const resetToken = await PasswordResetToken.findOne({ token })

    if (!resetToken || resetToken.expires < new Date()) {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 400 })
    }

    const user = await User.findById(resetToken.userId)
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    user.password = await bcrypt.hash(password, 10)
    await user.save()

    await PasswordResetToken.deleteOne({ token })

    return NextResponse.json({ message: "Password reset successfully" }, { status: 200 })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
