export class GetConfigModel {
  constructor(
    public inspectionsCount: string | number = 0,
    public inspectionsPageSize: string | number = 0,
    public totalPages: string | number = 0,
    public inspectionsResponseChunk: string | number = 1,
    public opstatus?: number,
    public httpStatusCode?: number
  ) { }
}
