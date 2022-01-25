import type { JoshProvider } from '@joshdb/core';
import { runProviderTest } from '../../../../tests/runProviderTest';
import { IndexedDBProvider, IndexedDBProviderError } from '../../src';
import 'fake-indexeddb/auto';

runProviderTest<typeof IndexedDBProvider, JoshProvider.Options>({
	providerConstructor: IndexedDBProvider,
	errorConstructor: IndexedDBProviderError,
	providerOptions: {}
});
