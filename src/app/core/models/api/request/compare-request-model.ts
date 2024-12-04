/**
 * Request model for comparing inspections
 * @param localWOs - WorkOrder IDs that are in local DB
 * @param Ids - Inspection IDs for getting the image file names
 * @param ImageIds - Inspection Response Image IDs for deletion
 */
export class CompareWOModel {
    constructor(
      public localWOs: string = "",
      public Ids: string = "",
      public ImageIds: string = ""
    ) {}
  }
  