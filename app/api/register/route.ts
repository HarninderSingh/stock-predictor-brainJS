import { NextResponse, type NextRequest } from "next/server" // Added type NextRequest
import bcrypt from "bcryptjs"
import User from "@/lib/models/user"
import { connectToDatabase } from "@/lib/mongodb"

console.log("Register route file loaded and execution started.")

export async function POST(req: NextRequest) {
  // Changed type from Request to NextRequest
  try {
    console.log("Attempting to connect to database for registration...")
    await connectToDatabase()
    console.log("Database connected successfully.")

    const body = await req.json()
    const { name, email, password } = body // Destructure here after logging body
    console.log("Received registration request with data:", {
      name,
      email,
      password: password ? "[PASSWORD_PROVIDED]" : "[NO_PASSWORD]",
    })

    if (!name || !email || !password) {
      console.error("Validation error: All fields are required.", { name, email, password: password ? true : false })
      return NextResponse.json({ message: "All fields are required" }, { status: 400 })
    }

    console.log(`Checking if user with email ${email} already exists...`)
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      console.warn(`User with email ${email} already exists.`)
      return NextResponse.json({ message: "User with this email already exists" }, { status: 409 })
    }
    console.log("User does not exist, proceeding with registration.")

    console.log("Hashing password...")
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log("Password hashed successfully.")

    console.log("Creating new user in database...")
    await User.create({ name, email, password: hashedPassword })
    console.log("User registered successfully.")

    return NextResponse.json({ message: "User registered successfully" }, { status: 201 })
  } catch (error) {
    console.error("Registration error caught in API route:", error)
    // Ensure the error response is always JSON, even for unexpected errors.
    // This will prevent the "Unexpected token 'A'" error on the client.
    return NextResponse.json(
      { message: "Internal server error", details: (error as Error).message || "No specific error message provided." },
      { status: 500 },
    )
  }
}
