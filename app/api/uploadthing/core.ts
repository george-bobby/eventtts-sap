import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { auth } from '@clerk/nextjs';

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
	// Define as many FileRoutes as you like, each with a unique routeSlug
	imageUploader: f({ image: { maxFileSize: '4MB' } })
		// Set permissions and file types for this FileRoute
		.middleware(async ({ req }) => {
			// This code runs on your server before upload
			const { userId } = await auth();

			// If you throw, the user will not be able to upload
			if (!userId) throw new Error('Unauthorized');

			// Whatever is returned here is accessible in onUploadComplete as `metadata`
			return { userId };
		})
		.onUploadComplete(async ({ metadata, file }) => {
			// This code RUNS ON YOUR SERVER after upload
			console.log('Upload complete for userId:', metadata.userId);

			console.log('file url', file.url);

			// !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
			return { uploadedBy: metadata.userId };
		}),

	// Certificate template uploader (PDF and images)
	certificateTemplateUploader: f({
		pdf: { maxFileSize: '8MB' },
		image: { maxFileSize: '8MB' },
	})
		.middleware(async ({ req }) => {
			const { userId } = await auth();
			if (!userId) throw new Error('Unauthorized');
			return { userId, uploadType: 'certificate-template' };
		})
		.onUploadComplete(async ({ metadata, file }) => {
			console.log(
				'Certificate template upload complete for userId:',
				metadata.userId
			);
			console.log('file url', file.url);
			return { uploadedBy: metadata.userId, uploadType: metadata.uploadType };
		}),

	// Photo gallery uploader (multiple images)
	photoGalleryUploader: f({
		image: { maxFileSize: '8MB', maxFileCount: 50 },
	})
		.middleware(async ({ req }) => {
			const { userId } = await auth();
			if (!userId) throw new Error('Unauthorized');
			return { userId, uploadType: 'photo-gallery' };
		})
		.onUploadComplete(async ({ metadata, file }) => {
			console.log('Photo gallery upload complete for userId:', metadata.userId);
			console.log('file url', file.url);
			return { uploadedBy: metadata.userId, uploadType: metadata.uploadType };
		}),

	// Stakeholder CSV/Excel uploader
	stakeholderUploader: f({
		'text/csv': { maxFileSize: '2MB' },
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
			maxFileSize: '2MB',
		},
		'application/vnd.ms-excel': { maxFileSize: '2MB' },
	})
		.middleware(async ({ req }) => {
			const { userId } = await auth();
			if (!userId) throw new Error('Unauthorized');
			return { userId, uploadType: 'stakeholder-data' };
		})
		.onUploadComplete(async ({ metadata, file }) => {
			console.log(
				'Stakeholder data upload complete for userId:',
				metadata.userId
			);
			console.log('file url', file.url);
			return { uploadedBy: metadata.userId, uploadType: metadata.uploadType };
		}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
