import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { PromptInfoComponent } from 'src/app/core/components/promptInfo/promptInfo.component';
import { VisionsTML } from 'src/app/core/sync/entities';
import { TmlReading } from 'src/app/core/sync/models/tmlReading.model';

@Component({
  selector: 'app-tml-detail-add',
  templateUrl: './tml-detail-add.component.html',
  styleUrls: ['./tml-detail-add.component.scss']
})
export class TmlDetailAddComponent {
  tmlReadingForm: FormGroup;
  fields: any;
  dropDownOptions: any;
  submitted = false;
  public columnOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  private currentReadings = [];
  public editMode = false;

  fieldDetails = [];
  isTMLGPSenabled : boolean = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any,
  public dialogRef: MatDialogRef<TmlDetailAddComponent>,
  private translate: TranslateService,
  public dialog: MatDialog) { }

  ngOnInit() {
    
    const visionTML: VisionsTML = this.data.visionTML;
    this.currentReadings = this.data.tmlReadings;

    this.editMode = this.data.editMode;
    const editIndex: number = this.editMode ? this.data.editIndex : 0;
    const currentTMLReading: TmlReading = this.editMode ? this.currentReadings[editIndex] : undefined;

    this.tmlReadingForm = new FormGroup({
      ["Equipment Number"]: new FormControl(visionTML?.equipmentNumber),
      ["Equipment Type"]: new FormControl(visionTML?.equipmentType),
      ["Plant Number"]: new FormControl(visionTML?.plantId),
      ["TML ID"]: new FormControl(this.editMode ? currentTMLReading["TML ID"] : "", Validators.required),
      ["TML Description"]: new FormControl(this.editMode ? currentTMLReading["TML Description"]: "", Validators.required),
      ["TML Type"]: new FormControl(this.editMode ? currentTMLReading["TML Type"] : "", Validators.required),
      ["Row Count"]: new FormControl(1),
      ["Column Count"]: new FormControl(this.editMode ? Number(currentTMLReading["Column Count"]): 1, Validators.required),
      ["TML Classification"]: new FormControl(this.editMode ? currentTMLReading["TML Classification"]: "", Validators.required),
      ["Activity Code"]: new FormControl(this.editMode ? currentTMLReading["Activity Code"]: "", Validators.required),
      ["Section ID"]: new FormControl(this.editMode ? currentTMLReading["Section ID"]: ""),
      ["OnOffFlag"]: new FormControl(this.editMode ? currentTMLReading["OnOffFlag"]: ""),
      ["Inspector"]: new FormControl(this.editMode ? currentTMLReading["Inspector"]: ""),
      ["Coordinate X"]: new FormControl(this.editMode ? currentTMLReading["Coordinate X"]: ""),
      ["Coordinate Y"]: new FormControl(this.editMode ? currentTMLReading["Coordinate Y"] : "")
    });

    this.fields = Object.keys(this.tmlReadingForm.value);
    if (visionTML.tmlConfig)
      this.dropDownOptions = JSON.parse(visionTML.tmlConfig).Fields;
  }

  get f() {
    return this.tmlReadingForm.controls;
  }

  public getDisplayName(fieldName) {
    let display = null;
    if (this.dropDownOptions) {
      display =  this.dropDownOptions.find(field => field.FieldName == fieldName);
      return display ? display.DisplayName : fieldName;    
    } else return fieldName;
  }

  public getOptions(fieldName) {
    if (this.dropDownOptions) {
      const index = this.dropDownOptions.findIndex(field => field.DisplayName == fieldName || field.FieldName == fieldName);
      if(index > -1) {
        return this.dropDownOptions.find(field => field.DisplayName == fieldName || field.FieldName == fieldName)
        .Options;
      }
      else return [];
    }     

    else return [];
  }

  getGPS() {
    navigator.geolocation.getCurrentPosition(
      this._getLocation.bind(this),
      this.handleLocationError.bind(this),
      { timeout: 3000 }
    );
  }

  private handleLocationError(error) {
    let errorTitle = '';
    let errorMessage = '';

    this.translate.get(['gps.error', 'gps.errorMessage', 'commons.dismiss']).subscribe(
      values => {
        errorTitle = values['gps.error'];
        errorMessage = values['gps.errorMessage'];
      }
    );

    this.dialog.open(PromptInfoComponent, {
      width: '350px',
      data: {
        title: errorTitle,
        content: errorMessage,
        showOkButton: true
      },
      panelClass: 'custom-dialog'
    })
  }

  private _getLocation(position: any) {
    const formcontrolX = this.tmlReadingForm.get("Coordinate X");
    const formcontrolY = this.tmlReadingForm.get("Coordinate Y");
    formcontrolX.setValue(position.coords.latitude);
    formcontrolY.setValue(position.coords.longitude);
  }

  onSubmit() {
    this.submitted = true;

    if (this.tmlReadingForm.invalid) { return; }

    if (!this.editMode && this.currentReadings.find(
        reading => reading["TML ID"] == this.tmlReadingForm.get("TML ID").value
      )
    ) {
      this.dialog.open(PromptInfoComponent, {
        width: '350px',
        data: {
          title: "TML ID Already Exists",
          content: "The TML ID you are trying to save already Exists",
          showOkButton: true
        },
        panelClass: 'custom-dialog'
      })
    }
    else {
      this.saveDetails()
    }
  }

  loadNewTMLConfigValues(tmlReading) : string {

    let values = "";

    values = tmlReading["Section ID"]
      ? values +
      "[Value field='Section ID']" +
      tmlReading["Section ID"] +
      "[/Value]"
      : values;

    values = tmlReading["Activity Code"]
      ? values +
      "[Value field='ActivityCode']" +
      tmlReading["Activity Code"] +
      "[/Value]"
      : values;

    values = tmlReading["OnOffFlag"]
    ? values +
    "[Value field='OnOffFlag']" +
    tmlReading["OnOffFlag"] +
    "[/Value]"
    : values;

    return values;

  }

  loadListReadings(tmlReading,currentTMLReading) : string[] {
    let ListReadings: string[];

    if(this.editMode) {
      ListReadings = new Array(Number(tmlReading["Column Count"])).fill("").map((column, index) => {
        let value: string;
        try {
          if(currentTMLReading.ListReadings.toString() !== "null") {
            value = currentTMLReading.ListReadings[index] ?? null;
          }
          else {
            value = null;
          }
        }
        catch{
          value = null;
        }
        return value;
      });
    }
    else {
      ListReadings =  new Array(tmlReading["Column Count"]).fill("");
    }

    return ListReadings;
  }

  saveDetails() {

    const editIndex: number = this.editMode ?  this.data.editIndex : 0;
    const currentTMLReading: TmlReading = this.editMode ? this.currentReadings[editIndex] : undefined;

    let tmlReading: TmlReading = this.editMode ? currentTMLReading : new TmlReading();

    let newTml = {};
    let values = "";

    newTml["EquipNum"] = tmlReading[
      "Equipment Number"
    ] = this.tmlReadingForm.get("Equipment Number").value;

    newTml["EquipType"] = tmlReading[
      "Equipment Type"
    ] = this.tmlReadingForm.get("Equipment Type").value;

    newTml["PlantNum"] = tmlReading["Plant ID"] = this.tmlReadingForm.get(
      "Plant Number"
    ).value;

    newTml["TMLID"] = tmlReading["TML ID"] = this.tmlReadingForm.get(
      "TML ID"
    ).value;

    newTml["TMLDescription"] = tmlReading[
      "TML Description"
    ] = this.tmlReadingForm.get("TML Description").value;

    newTml["TMLType"] = tmlReading["TML Type"] = this.tmlReadingForm.get(
      "TML Type"
    ).value;

    newTml["RowCount"] = tmlReading["Row Count"] = this.tmlReadingForm.get(
      "Row Count"
    ).value;

    newTml["ColumnCount"] = tmlReading[
      "Column Count"
    ] = this.tmlReadingForm.get("Column Count").value;

    newTml["TMLClassification"] = tmlReading[
      "TML Classification"
    ] = this.tmlReadingForm.get("TML Classification").value;

    newTml["Coordinate X"] = tmlReading[
      "Coordinate X"
    ] = this.tmlReadingForm.get("Coordinate X").value;

    newTml["Coordinate Y"] = tmlReading[
      "Coordinate Y"
    ] = this.tmlReadingForm.get("Coordinate Y").value;

    //newTml["SiteName"] = this.navParams.get("siteName");
    // Commented SiteName , not available in model.

    newTml["Inspector"] = tmlReading["Inspector"] = this.tmlReadingForm.get(
      "Inspector"
    ).value;

    tmlReading["Activity Code"] = this.tmlReadingForm.get("Activity Code").value;
    tmlReading["Section ID"] = this.tmlReadingForm.get("Section ID").value;
    tmlReading["OnOffFlag"] = this.tmlReadingForm.get("OnOffFlag").value;
    tmlReading["comments"] = this.editMode ? currentTMLReading["comments"] : "";
    tmlReading["showTML"] = true;
    tmlReading["ListReadings"] = this.loadListReadings(tmlReading,currentTMLReading);   
   
    // Old Code for TML List Readings
    //tmlReading["ListReadings"] = this.editMode ? currentTMLReading["ListReadings"] : new Array(tmlReading["Column Count"]).fill("");

    tmlReading["NewThick"] = tmlReading["ListReadings"].join(";");
    tmlReading["ReadingsCSV"] = tmlReading["ListReadings"].join(";");

    newTml["Active"] = tmlReading["Active"] = true;
    newTml["MeasureTML"] = tmlReading["MeasureTML"] = true;

    values = this.loadNewTMLConfigValues(tmlReading);      
    newTml["Values"] = `[Values]${values}[/Values]`;

    this.dialogRef.close({event:'save',tmlReading: JSON.parse(JSON.stringify(tmlReading)), newTml: newTml })
  }
}
