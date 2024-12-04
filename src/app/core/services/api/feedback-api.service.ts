import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Feedback } from "../../sync/entities";

@Injectable()
export class FeedbackAPIService {
    constructor(private http: HttpClient){}

    public uploadFeedback(feedback: Feedback) {
        this.http.post<Feedback>("/Feedback/sendFeedback", feedback).subscribe();
    }
}