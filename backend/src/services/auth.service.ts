
import bcrypt from "bcryptjs";
import { User } from "../model/User.js";
import type { LoginInput, RegisterInput } from "../validators/auth.validator";
import { generateToken } from "../utils/jwt.js";
import { email } from "zod";

export async function registerUser(input: RegisterInput) {
  const existingUser = await User.findOne({
    email: input.email.toLowerCase(),
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);

  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    password: hashedPassword,
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
  };
}

export async function loginUser(input:LoginInput) {
    const user = await User.findOne({
        email : input.email.toLowerCase(),
    });

    if (!user) {
        throw new Error("Invalid email or password.....");
    }

    const passwordMatches = await bcrypt.compare(
        input.password,
        user.password,
    )
    if (!passwordMatches) {
        throw new Error("Invalid email or password");
    }

    const token = generateToken(user._id.toString());

    return {
        user : {
            id : user._id,
            name : user.name,
            email : user.email,
        },
        token
    };
}