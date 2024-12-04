import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { MIUtilities } from "src/app/shared/utility";
import { InspectionResponseImage } from "../../sync/entities";
import { ImageObjectModel, ResponseImageModel } from "../../models/api/response-image.model";
import { DownloadImageModel } from "../../models/api/download-image.model";
import { Observable } from "rxjs";

@Injectable()
export class InspectionResponseImageAPIService {
    constructor(private http: HttpClient){}
    httpOpts = {
        headers: new HttpHeaders({
        "Content-Type":"application/json"})
      };

    public downloadImage(image: DownloadImageModel){
        return this.http.get<any>("inspection-assignment/" + image.inspectionID + "/responses/" + image.responseID + "/images/"+image.imageID + "?" + MIUtilities.getDeviceInfo(), {})
    }

    public getImages(images: any)  : Observable<any>{
        return this.http.post<any>(
            "mobileapi/GetImages?"+MIUtilities.getDeviceInfo(), 
            JSON.stringify(images),
            this.httpOpts
        )
    }

    public deleteImages(images: any){
        
        return this.http.post(
            "inspection-assignment/DeleteImages" + "?" + MIUtilities.getDeviceInfo(), 
            JSON.stringify(images),
            this.httpOpts
        )
    }
    
    public updateImages(images: any) : Observable<any> {

        return this.http.put(
            "inspection-assignment/UpdateImages" + "?" + MIUtilities.getDeviceInfo(), 
            JSON.stringify(images),
            this.httpOpts
        )
    }

    public uploadImage(inspectionResponseImage: InspectionResponseImage): Observable<any>{
        const responseImage = new ImageObjectModel(
            inspectionResponseImage.imageCaption,
            inspectionResponseImage.fileName,
            MIUtilities.b64ServerUpload(inspectionResponseImage.photo),
            MIUtilities.b64ServerUpload(inspectionResponseImage.originalPhoto)
        );
        console.log("RESP ID>>"+inspectionResponseImage.inspectionResponseId);
        if(inspectionResponseImage.inspectionResponseId === null){
            responseImage.InspectionItemCode = inspectionResponseImage.inspectionItemCode;

            //this endpoint is used for uploading images that DO NOT have their inspectionResponseId
            //we send inspectionItemCode instead inspectionResponseId
            //this v3 endpoint is different from the v2 endpoint (the uri is different) 
            return this.http.post<ResponseImageModel>(
                "inspection-assignment/"+ inspectionResponseImage.inspectionId + "/responses/upload-image/v3?" +
                MIUtilities.getDeviceInfo(),
                JSON.stringify(responseImage),
                this.httpOpts
            )
        }else{

            //this endpoint is used for uploading images that are associated with a known inspectionResponseid
            //this v2 endpoint is different from the v3 endpoint (the uri is different) 
            return this.http.post<ResponseImageModel>(
                "inspection-assignment/"+ inspectionResponseImage.inspectionId + "/responses/" + 
                inspectionResponseImage.inspectionResponseId + "/upload-image/v2?" +
                MIUtilities.getDeviceInfo(),
                JSON.stringify(responseImage),
                this.httpOpts
            )
        }
    }


    public download(image: DownloadImageModel) {
        return this.http
        .get<any>("inspection-assignment/" + image.inspectionID + "/responses/" + 
        image.responseID + "/images/"+image.imageID + "?" + MIUtilities.getDeviceInfo(), this.httpOpts);
      }
}