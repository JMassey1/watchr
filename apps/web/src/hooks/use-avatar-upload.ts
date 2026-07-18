import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { trpcClient } from "@/utils/trpc";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
type AllowedType = (typeof ALLOWED_TYPES)[number];

function isAllowedType(type: string): type is AllowedType {
	return (ALLOWED_TYPES as readonly string[]).includes(type);
}

export function useAvatarUpload() {
	return useMutation({
		mutationFn: async (file: File) => {
			if (!isAllowedType(file.type)) {
				throw new Error("Unsupported file type. Use PNG, JPEG, or WebP.");
			}
			if (file.size > MAX_AVATAR_SIZE) {
				throw new Error("Image is too large (max 5MB).");
			}

			// get urls, upload and render
			const { uploadUrl, publicUrl } =
				await trpcClient.storage.getAvatarUploadUrl.mutate({
					contentType: file.type,
					size: file.size,
				});

			// puts directly to signed url
			const res = await fetch(uploadUrl, {
				method: "PUT",
				body: file,
				headers: { "Content-Type": file.type },
			});
			if (!res.ok) {
				throw new Error("Upload failed. Please try again.");
			}

			// adds url to user
			const { error } = await authClient.updateUser({ image: publicUrl });
			if (error) {
				throw new Error(error.message ?? "Failed to save avatar.");
			}

			return publicUrl;
		},
	});
}
