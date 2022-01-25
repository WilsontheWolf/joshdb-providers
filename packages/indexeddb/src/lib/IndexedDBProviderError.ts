import { JoshProviderError } from '@joshdb/core';

export class IndexedDBProviderError extends JoshProviderError {
	public get name() {
		return 'IndexedDBProviderError';
	}
}
