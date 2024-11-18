import {NextFunction, Response} from "express";
import prisma from "../utils/prisma";
import jwt from "jsonwebtoken";

export const isAuthenticated = (
    req: any,
    res: Response,
    next: NextFunction
) => {
    try {
        // Extract the token from the Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res
                .status(401)
                .json({ message: "Please Log in to access this content!" });
        }
        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Token missing" });
        }

        // Verify the token
        jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET!,
            async (err: any, decoded: any) => {
                if (err) {
                    return res.status(401).json({ message: "Invalid token" });
                }

                // Attach the user data to the request object
                req.user = await prisma.user.findUnique({
                    where: {
                        id: decoded.id,
                    },
                });
                next();
            }
        );
    } catch (error) {
        console.log(error);
    }
};