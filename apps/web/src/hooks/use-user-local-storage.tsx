import SuperJSON from "superjson";
import {useEffect, useState} from "react";
import {publicUserSchema} from "@watch3r/db/schema/user";
import {z} from "zod";

export function useUserLocalStorage<T>(
	userId: z.infer<typeof publicUserSchema>['id'],
	key: string,
	initialValue: T
) {
	const storageKey = userId ? `user:${userId}:${key}` : null;

	const [value, setValue] = useState<T>(() => {
		if (!storageKey || typeof window === "undefined") {
			return initialValue;
		}

		const storedValue = window.localStorage.getItem(storageKey);
		if (!storedValue) {
			return initialValue;
		}

		try {
			return SuperJSON.parse<T>(storedValue);
		} catch {
			return initialValue;
		}
	});

	useEffect(() => {
		if (!storageKey) {
			setValue(initialValue);
			return;
		}
		const storedValue = window.localStorage.getItem(storageKey);

		try {
			setValue(storedValue ? SuperJSON.parse<T>(storedValue) : initialValue);
		} catch {
			setValue(initialValue);
		}
	}, [storageKey, initialValue]);

	useEffect(() => {
		if (!storageKey || typeof window === "undefined") {
			return;
		}

		window.localStorage.setItem(storageKey, SuperJSON.stringify(value));
	}, [storageKey, value]);

	return [value, setValue] as const;
}