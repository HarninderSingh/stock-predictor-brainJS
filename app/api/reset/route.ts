import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/lib/models/user"
import PasswordResetToken from "@/lib/models/password-reset"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    await connectToDatabase()
    const { email } = await req.json()

    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Delete any existing tokens for this user
    await PasswordResetToken.deleteMany({ userId: user._id })

    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 3600000) // 1 hour from now

    await PasswordResetToken.create({ userId: user._id, token, expires })

    // In a real application, you would send an email here.
    // For this tutorial, we'll just log the URL.
    const resetUrl = `${req.headers.get("origin")}/reset/${token}`
    console.log(`Password reset URL: ${resetUrl}`)

    return NextResponse.json(
      { message: "Password reset link sent to your email (check console for URL)" },
      { status: 200 },
    )
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
