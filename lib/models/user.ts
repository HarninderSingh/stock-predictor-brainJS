import { Schema, models, model, type Document } from "mongoose"

export interface IUser extends Document {
  name?: string
  email: string
  password?: string
  role: "user" | "admin"
  createdAt: Date
  updatedAt: Date
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional for OAuth users
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true },
)

const User = models.User || model<IUser>("User", UserSchema)

export default User
