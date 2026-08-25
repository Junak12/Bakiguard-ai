import jwt from "jsonwebtoken";
interface jwtPayload {
    userId : string;
}

export function generateToken (userId : string) {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_Secret is not defined ......")
    }

    return jwt.sign (
        {userId},
        secret,{
            expiresIn: "7d",
        }
    )
}