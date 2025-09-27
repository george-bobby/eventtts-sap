import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
	publicRoutes: [
		'/',
		'/event/:id',
		'/event/:id/feedback',
		'/api/webhook/clerk',
		'/api/webhook/stripe',
		'/api/uploadthing',
		'/api/health',
		'/api/predict',
		'/api/feedback/template/:id',
		'/api/feedback/submit',
		'/api/cron/feedback-emails',
		'/track',
		'/gallery/:shareableLink',
		'/api/gallery/:galleryId/public',
	],
	ignoredRoutes: [
		'/api/webhook/clerk',
		'/api/webhook/stripe',
		'/api/uploadthing',
		'/api/cron/feedback-emails',
	],
});

export const config = {
	matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
