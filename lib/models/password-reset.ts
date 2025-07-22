import mongoose, { Schema, models, model, type Document } from "mongoose"

export interface IPasswordResetToken extends Document {
  userId: mongoose.Schema.Types.ObjectId
  token: string
  expires: Date
  createdAt: Date
}

const PasswordResetTokenSchema: Schema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true, unique: true },
    expires: { type: Date, required: true },
  },
  { timestamps: true },
)

const PasswordResetToken =
  models.PasswordResetToken || model<IPasswordResetToken>("PasswordResetToken", PasswordResetTokenSchema)

export default PasswordResetToken
