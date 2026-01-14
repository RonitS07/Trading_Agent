import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/login",
    },
});

export const config = {
    matcher: [
        "/api/trade/:path*",
        "/api/user/:path*",
        "/api/portfolio/:path*",
    ],
};
