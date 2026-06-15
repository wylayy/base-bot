declare global {
    var API_BASE_URL: string;
    var AUTH_TOKEN: string | null;
    var AUTH_USER: {
        id: number;
        name: string;
        username: string;
    } | null;
}
export {};
