# @yutaura/csv-batch-reader

## Description

This is a library for reading CSV files in batch.

```typescript
import { csvBatchRead } from '@yutaura/csv-batch-reader';


await csvBatchRead(
  'path/to/csv-file.csv',
  100, // batch size
  async (headers) => {
    // do something with headers
  },
  async (batch) => {
    // do something with batch
    for (const row of batch) {
      // do something with row
      console.log(row);
    }
  },
);
```

## Installation

```bash
pnpm install @yutaura/csv-batch-reader
```

## License

MIT

## Funding

If you like this library, please consider supporting me on [GitHub Sponsors](https://github.com/sponsors/YutaUra)
