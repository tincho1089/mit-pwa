export interface IInspectionQuestionImage {
    questionId: string;
    imageName: string;
    imageData: string;
}

export class InspectionQuestionImage implements IInspectionQuestionImage {
    questionId: string | null;
    imageName: string | null;
    imageData: string | null;

    constructor(
        questionId: string | null, 
        imageName: string | null,
        imageData: string | null
    ){
        this.questionId = questionId;
        this.imageName = imageName;
        this.imageData = imageData;
    }
}