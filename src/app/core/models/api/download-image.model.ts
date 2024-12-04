export class DownloadImageModel {
  constructor(
    public inspectionID: string,
    public responseID: string,
    public imageID: string,
    public questionId: string,
    public imageCaption: string
  ) {}
}
