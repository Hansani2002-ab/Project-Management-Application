export const protect = async (req, res, next) => {
    try {
        const auth = req.auth();

        const userId = auth?.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        next();
    } catch (error) {
        console.log(error);
        res.status(401).json({ message: error.message });
    }
};