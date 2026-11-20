import mongoose, { Schema, type Document } from "mongoose";

/**
 * A signed-in device. The browser holds a random refresh token in an
 * httpOnly cookie; only its SHA-256 hash is stored here, so a database
 * leak does not leak usable sessions.
 */
export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    userAgent: {
      type: String,
      maxlength: 300,
    },

    ip: String,
  },
  {
    timestamps: true,
  }
);

// MongoDB deletes expired sessions automatically.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.model<ISession>("Session", sessionSchema);
