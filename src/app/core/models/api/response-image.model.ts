/**
 * Model for made a upload inspection response image
 * @param id - Inspection Id
 * @param respId - Response Id
 * @param imageObject - Object model with image data
 */
export class ResponseImageModel {
  constructor(
    public id: number,
    public respId: string = null,
    public imageObject: ImageObjectModel
  ) {}
}

/**
 * Model to define de params of Image Object Model that it's needed by ResponseImageModel
 * @param ImageCaption - caption for image
 * @param ImageData - image b64
 */
export class ImageObjectModel {
  constructor(
    public ImageCaption: string = '',
    public BlobReference: string = null,
    public ImageData: string = null,
    public OriginalPhoto: string = '',
    public InspectionItemCode: string = null
  ) {}
}
