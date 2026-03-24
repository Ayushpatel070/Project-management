import prisma from "../configs/prisma.js";

export const protect = async (req, res, next) => {
    try {
        // console.log("Auth middleware: checking authentication");
        const auth = await req.auth();
        // console.log("Auth result:", { userId: auth.userId, hasToken: !!auth });

        if (!auth.userId) {
            // console.log("No userId found in auth");
            return res.status(401).json({ message: "Unauthorized" });
        }

        const userId = auth.userId;
        // console.log("User ID:", userId);

        // Ensure user exists in database
        let user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            // console.log("User not found in database, creating...");
            // Create minimal user record - Inngest webhook will update with full data
            user = await prisma.user.create({
                data: {
                    id: userId,
                    email: userId, // Use userId as temporary unique email
                    name: "User", // Will be updated by Inngest webhook
                    image: "", // Use empty string as per schema default
                }
            });
            // console.log("User created:", user.id);
        }

        // Attach user to request
        req.user = user;
        // console.log("Auth middleware: success, proceeding to next");
        return next();
    } catch (error) {
        console.log("Auth middleware error:", error);
        return res.status(401).json({ message: error.code || error.message });
    }
}    