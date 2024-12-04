import { Component, Input } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { BaseInspection } from "../../../classes/base-inspection";
import { DomainModel } from "src/app/core/models/local/domain.model";

@Component({
  selector: "equipment-hierarchy",
  templateUrl: "equipment-hierarchy.html",
})
export class EquipmentHierarchyComponent extends BaseInspection {
  @Input()
  showHelper: boolean = false;

  formGroup: FormGroup;
  options: DomainModel[] = [];
  hasSubEquipmentData: boolean = false;

  constructor() {
    super();
  }

   override ngOnInit() {
    super.ngOnInit();
    this._createForm();
    this.fetchData();
    
  }

  async fetchData() {
    const subEquipmentData = await this.getSubEquipmentData(this.response.inspectionId);
    if (subEquipmentData) {
      this.options = JSON.parse(subEquipmentData);
      this.hasSubEquipmentData = true;
    }
  }
  private _createForm(): void {
    const answer = this.getAnswerObject();
    let subEquipment = null;
    try {
      subEquipment = answer["details"]["SubEquipment"];
    } catch {
      console.log("Error getting the information");
    }

    this.formGroup = new FormGroup({
      details: new FormGroup({
        SubEquipment: new FormControl(
          {
            value: subEquipment,
            disabled: false,
          },
          Validators.required
        ),
      }),
    });

    this.setControl(this.formGroup);
  }

  displayEquipment(option: any): string {
    return option ? option['Equipment Desc'] : '';
  }
}
