export class PagedResult<T> {
    Total: number;
    PageSize: number | null;
    Items: T[];
    WOArray: number[];
    LastPage: boolean;
  }