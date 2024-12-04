import { Component } from "@angular/core";
import { SharedService } from "../../services/shared.service";
declare var require: any;

@Component({
  selector: "app-footer",
  templateUrl: "./footer.component.html",
  styleUrls: ["./footer.component.scss"],
})
export class FooterComponent {
  public version = "";
  public expanded: boolean = false;
  public year: number = (new Date).getFullYear();
  
  constructor(
    public sharedService: SharedService
  ) {
    this.version = require("../../../../../package.json").version;
  }
  
}
