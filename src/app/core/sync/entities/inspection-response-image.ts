export interface IInspectionResponseImage {
  inspectionId: number;
  inspectionResponseQuestionId: string;
  inspectionItemCode: string;
  serverId: string;
  serverFlag: string;
}

export class InspectionResponseImage implements IInspectionResponseImage {
  inspectionId: number;
  inspectionResponseQuestionId: string;
  inspectionItemCode: string;
  serverId: string;
  imageCaption: string | null;
  photo: string;
  thumbnail: string | null;
  serverFlag: string = 'N';
  fileName: string | null;
  isChanged: string | null = 'N';
  originalPhoto: string | null = '';
  inspectionResponseId:number;
  init(
    inspectionId: number,
    inspectionItemCode: string,
    jsonArray: any
  ): Array<InspectionResponseImage> {
    // Map and transform the API response to match the JSON model
    const transformedImages = jsonArray?.map((json) => {
      return {
        inspectionId: inspectionId,
        inspectionResponseId: json['InspectionResponseID'],
        inspectionItemCode: inspectionItemCode,
        imageCaption: json['ImageCaption'],
        photo: '',
        thumbnail: '',
        serverId: json['ID'],
        serverFlag: 'Y',
        originalPhoto: null,
      };
    });
    return transformedImages;
  }
}
