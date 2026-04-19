export default {
  providers: [
    {
      domain: process.env.CLERK_ISSUER_URL || 'https://crucial-insect-97.clerk.accounts.dev',
      applicationID: 'convex',
    },
  ],
};
