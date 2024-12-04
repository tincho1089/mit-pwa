export interface IWorkOrderDocument {
    id: string;
    inspectionId: number;
    docName: string;
    docLink: string;
    isDownloaded: number;
    isUploaded: number;
}

export class WorkOrderDocument implements IWorkOrderDocument {
    id: string;
    inspectionId: number;
    docName: string;
    docLink: string;
    fileURI: string | null = null;
    isDownloaded: number = 0;
    isUploaded: number = 0;
    isOriginal: boolean = true;

    init(json: any): void {
        try {
            this.docLink = json["DocumentLink"];
            this.docName = json["DocumentName"];
            this.inspectionId = json["InspectionWorkOrderId"];
            this.id = (~~json["ID"]).toString();
            this.isDownloaded = 0;
            this.isUploaded = 1;
        } catch (e) {
            console.log(e);
        }
    }
}