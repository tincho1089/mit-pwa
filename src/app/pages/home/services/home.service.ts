import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable()

export class HomeService {
    
    userInformationComplete: Subject<boolean> = new Subject<boolean>();
    userInformationCompleteOnLogin: Subject<boolean> = new Subject<boolean>();
    workOrderRemoved$: Subject<void> = new Subject<void>();
}