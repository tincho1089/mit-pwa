import { AfterViewInit, ChangeDetectorRef, Component, Input, OnDestroy } from '@angular/core';
import { FormArray, FormControl, FormGroup, ValidationErrors } from '@angular/forms';
import { Subscription, debounceTime, distinctUntilChanged, lastValueFrom, skip } from 'rxjs';
import { PromptInfoComponent } from 'src/app/core/components/promptInfo/promptInfo.component';
import { VisionsTML } from 'src/app/core/sync/entities';
import { TmlReading } from 'src/app/core/sync/models/tmlReading.model';
import { db } from 'src/databases/db';
import { TmlDetailAddComponent } from '../tml-detail-add/tml-detail-add.component';
import { TmlDetailModalComponent } from '../tml-detail-modal/tml-detail-modal.component';
import { MIUtilities } from 'src/app/shared/utility';
import * as dayjs from 'dayjs'
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { SettingsService } from 'src/app/core/services/app-settings.service';


const ITEMS = [
  { displayName: "TML ID", property: "TML ID" },
  { displayName: "TML Description", property: "TML Description" },
  { displayName: "TML Classification", property: "TML Classification" },
  { displayName: "Activity Code", property: "Activity Code" },
  { displayName: "Last Reading Date", property: "Last Reading Date" },
  { displayName: "Critical Thick", property: "Critical Thick" },
  { displayName: "Last Reading", property: "Last Read Min Thick" },
  // { displayName: "Short Term Corrosion Rate", property: "corrosionRate" }
];

@Component({
  selector: 'app-tml-detail',
  templateUrl: './tml-detail.component.html',
  styleUrls: ['./tml-detail.component.scss']
})
export class TmlDetailComponent implements OnDestroy, AfterViewInit {
  @Input() tmlDetails: VisionsTML;
  tmlFilterType: string = "ShowAll";
  tmlDetailsForm: FormGroup = new FormGroup({});
  corrosionRate: number = null;
  readings: Array<TmlReading>;
  items = ITEMS;
  inspectorNameFormControl = new FormControl();
  private subscription = new Subscription();

  constructor(
    private ref: ChangeDetectorRef,
    private translate: TranslateService,
    public dialog: MatDialog,
    private settingsService: SettingsService) {}

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
    this.tmlDetails = null;
    this.tmlDetailsForm = null;
    this.readings = null;
    this.items = null;
    this.inspectorNameFormControl = null;
  }

  ngAfterViewInit() {
    this.inspectorNameFormControl.setValue(this.tmlDetails.inspectorName);
    this.inspectorNameFormControl.valueChanges
      .pipe(
        skip(1),
        debounceTime(1000),
        distinctUntilChanged()
      ).subscribe((name) => {
        this.tmlDetails.inspectorName = name;
        this.saveTMLDetails();
      })
      
    this.createTMLForm();
    this.ref.detectChanges();
  }

  createTMLForm() {
    this.readings = this.tmlDetails.tmlReadings
      .map(vision => {
        if (!vision["ShortTermCorrosionRate"] || MIUtilities.isNullOrUndefined(vision["ShortTermCorrosionRate"]))
          vision["ShortTermCorrosionRate"] = "0.00";
        return vision;
      });

    this.tmlDetailsForm = new FormGroup({
      tmlReadings: new FormArray(
        this.tmlDetails.tmlReadings
          .map((tmlReading: TmlReading) => this.createFormGroup(tmlReading))
      )
    });  
   

    this.subscription.add(
      (this.tmlDetailsForm.get("tmlReadings") as FormArray).controls.forEach(
        (control: FormGroup) => {
          control.valueChanges.
          pipe(debounceTime(1000)).
          subscribe(values => this.onValueChanges(control, values));
        }
      )
    )
  }

  private createFormGroup(tmlReading: TmlReading): FormGroup {
    let ListReadings: FormArray = null;
    try {
      const columns = !MIUtilities.isNullOrUndefined(tmlReading["Column Count"]) ? tmlReading["Column Count"] : '1';

      ListReadings = new FormArray(new Array(Number(columns)).fill("").map((column, index) => {
        let value: string;
        try {
          value = tmlReading.ListReadings.toString() !== "null" ? tmlReading.ListReadings[index] : null;
        }
        catch{
          value = null;
        }
        return new FormControl(value);
      }), [this.validateThickAlert.bind(this, tmlReading)]);

      ListReadings.valueChanges.
      pipe(
        debounceTime(1000),
        distinctUntilChanged()).
        subscribe(values => { 
          this.onReadingsChange(values, tmlReading);
          this.saveTMLDetails();
      });

      this.onReadingsChange(ListReadings.value, tmlReading);
    }

    catch{ }

    return new FormGroup({
      "TML ID": new FormControl(tmlReading["TML ID"]),
      ListReadings,
      "Coordinate X": new FormControl(
        tmlReading["Coordinate X"] ? tmlReading["Coordinate X"] : ""
      ),
      "Coordinate Y": new FormControl(
        tmlReading["Coordinate Y"] ? tmlReading["Coordinate Y"] : ""
      ),
      corrosionRate: new FormControl(tmlReading.corrosionRate),
      comments: new FormControl(!MIUtilities.isNullOrUndefined(tmlReading.comments) ? tmlReading.comments : "")
    });
  }

  private validateThickAlert(tmlReading: TmlReading, control: FormArray): ValidationErrors {
    const values: Array<any> = control.value;
    const numbers: Array<number> = values.filter(e => (parseFloat(e) == e)).map(e => {
      return Number(e);
    });
    const someMin = numbers.some(e => (
      e < parseFloat(tmlReading["Critical Thick"] ? tmlReading["Critical Thick"].toString() : "") &&
      e < parseFloat(tmlReading["Last Read Min Thick"] ? tmlReading["Last Read Min Thick"].toString(): "")
    ))
    return (someMin) ? { "thick-alert": true } : null;    
  }

  private onValueChanges(control: FormGroup, values: any) {
    let findIndex = 0;
    let filteredReadings = [];
    
    let user = this.settingsService.getUser() // Getting user details from settings

    const reading: TmlReading = this.tmlDetails.tmlReadings.find(
      (reading, index) => {
        if (reading["TML ID"] == control.get("TML ID").value) {
          filteredReadings =  values["ListReadings"].map( function(item, index) {
            if (reading["ListReadings"] != null && item != reading["ListReadings"][index])
            {
              reading.CVXReadingDate = dayjs().format("YYYY-MM-DDTHH:mm:ss");
            }
            const val = parseFloat(item);
            return isNaN(val) ? "" : val;
          });
          reading["ListReadings"] = filteredReadings;
          reading["ReadingsCSV"] = reading["ListReadings"].join(";");
          reading["NewThick"] = reading["ListReadings"].join(";");
          reading["Coordinate X"] = values["Coordinate X"];
          reading["Coordinate Y"] = values["Coordinate Y"];
          reading.comments = values["comments"];
          reading.createdDate = dayjs().format("YYYY-MM-DDTHH:mm:ss");
          reading.createdBy = user?.Email;
          findIndex = index;      
          return true;
        }
        return false;
      }
    );

    const readingControl = this.tmlDetailsForm.get("tmlReadings." + findIndex + ".corrosionRate");
    readingControl.setValue(TmlReading.getCorrosionRate(reading), {
      onlySelf: true,
      emitEvent: false
    });

    this.saveTMLDetails();
  }

  private onReadingsChange(values: Array<any>, tmlReading: TmlReading): void {    
    const numbers: Array<number> = values.filter(e => (parseFloat(e) == e)).map(e => {
      return Number(e);
    });
    tmlReading.isValid = numbers.length > 0;
    tmlReading.minValue = (numbers.length === 0) ? null : Math.min.apply(null, numbers);
    tmlReading['minIndex'] = [];
    values.forEach((item, index) => {
      if (tmlReading.minValue && parseFloat(item) === parseFloat(tmlReading.minValue.toString()))
        tmlReading['minIndex'].push(index);
    });
  }

  showTML(tmlReading: TmlReading) {
    tmlReading.showTML = !tmlReading.showTML;
    this.saveTMLDetails();
  }

  getGPS(index) {
    const control = this.tmlDetailsForm.get("tmlReadings." + index);
    navigator.geolocation.getCurrentPosition(
      this.getLocation.bind(this, control),
      this.handleLocationError.bind(this),
      { timeout: 3000 }
    );
  }

  private async getLocation(control, position: any) {
    const formcontrolX = control.get("Coordinate X");
    const formcontrolY = control.get("Coordinate Y");
    formcontrolX.setValue(position.coords.latitude);
    formcontrolY.setValue(position.coords.longitude);
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

  numberOnlyValidation(event: any) {
    const pattern = /[0-9.]/;
    let inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  onFilterChange(){
    this.readings = this.tmlDetails.tmlReadings
      .map(vision => {
        if (!vision["ShortTermCorrosionRate"] || MIUtilities.isNullOrUndefined(vision["ShortTermCorrosionRate"]))
          vision["ShortTermCorrosionRate"] = "0.00";
        return vision;
      });

    let filteredReadings = null;

    switch(this.tmlFilterType){
      case "ShowActive":
          filteredReadings = this.tmlDetails.tmlReadings.filter(r => r.Active === true || r.Active.toString() === "true");
          break;
        case "ShowInactive":
          filteredReadings = this.tmlDetails.tmlReadings.filter(r => r.Active === false|| r.Active.toString() === "false");
          break;
        default:
          filteredReadings = this.tmlDetails.tmlReadings;
          break;
    }
    
    this.readings = filteredReadings
      .map(vision => {
        if (!vision["ShortTermCorrosionRate"] || MIUtilities.isNullOrUndefined(vision["ShortTermCorrosionRate"]))
          vision["ShortTermCorrosionRate"] = "0.00";
        return vision;
      });

    this.tmlDetailsForm = new FormGroup({
      tmlReadings: new FormArray(
        filteredReadings
          .map((tmlReading: TmlReading) => this.createFormGroup(tmlReading))
      )
    });

    this.subscription.add(
      (this.tmlDetailsForm.get("tmlReadings") as FormArray).controls.forEach(
        (control: FormGroup) => {
          control.valueChanges.pipe(debounceTime(1000)).subscribe(values => this.onValueChanges(control, values));
        }
      )
    );
  }

  // TO View TML
  seeDetail(reading: TmlReading) {
    this.dialog.open(TmlDetailModalComponent, {
      width: '750px',
      panelClass: 'custom-dialog',
      data : {
        Id: reading["TML ID"],
        data : reading,
        tableStructure : [
          { displayName: 'TML ID:', property: 'TML ID' },
          { displayName: 'Equipment Type:', property: 'Equipment Type' },
          { displayName: 'Equipment Number:', property: 'Equipment Number' },
          { displayName: 'Plant ID:', property: 'Plant ID' },
          { displayName: 'TML Type:', property: 'TML Type' },
          { displayName: 'Circuit ID:', property: 'Circuit ID' },
          { displayName: 'Location:', property: 'Location' },
          { displayName: 'Nominal:', property: 'Nominal' },
          { displayName: 'Corr Allow:', property: 'Corr Allow' },

          { displayName: 'Min Thick:', property: 'Min Thick' },
          { displayName: 'Active:', property: 'Active' },
          { displayName: 'Critical Thick:', property: 'Critical Thick' },
          { displayName: 'Insulation Removal:', property: 'Insulation Removal' },
          { displayName: 'Scaffold Required:', property: 'Scaffold Required' },
          { displayName: 'Ladder Required:', property: 'Ladder Required' },
          { displayName: 'ManLift:', property: 'ManLift' },
          { displayName: 'Confined Space:', property: 'Confined Space' },

          { displayName: 'Other Access:', property: 'Other Access' },
          { displayName: 'Min Short Loss:', property: 'Min Short Loss' },
          { displayName: 'TML Classification:', property: 'TML Classification' },
          { displayName: 'Min Long Loss:', property: 'Min Long Loss' },
          { displayName: 'Next Inpection Date:', property: 'Next Insp Date Due' },
          {
            displayName: 'Next Inspection Date Calculated:',
            property: 'Next Insp Date Calculated'
          },
          { displayName: 'Last Reading Min Thick:', property: 'Last Read Min Thick' },
          { displayName: 'Expiration Date:', property: 'Expiration Date' },

          { displayName: 'Last Note Text:', property: 'Last Notes Text' },
          { displayName: 'Column Count:', property: 'Column Count' },
          { displayName: 'Readings:', property: 'ReadingsCSV' },
          { displayName: 'Row Count:', property: 'Row Count' },
          { displayName: 'Activity Code:', property: 'Activity Code' },
          { displayName: 'OnOffFlag:', property: 'OnOffFlag' },
          { displayName: 'Inspector:', property: 'Inspector' }
        ]
      }
    })
  }

  // To Create New TML
  showAddTML() {
    const dialogRef = this.dialog.open(TmlDetailAddComponent, {
      width: '750px',
      panelClass: 'custom-dialog',
      data : {
        visionTML: this.tmlDetails,
        tmlReadings: this.tmlDetails.tmlReadings,
        editMode: false
      }
    })

    dialogRef.afterClosed().subscribe(newTmlReading => {
      if(newTmlReading && newTmlReading.event == 'save') {       
      
        const newTmlReadings: Array<any> = JSON.parse(this.tmlDetails.newTMLs);
        newTmlReadings.push(newTmlReading.newTml);
        this.tmlDetails.newTMLs = JSON.stringify(newTmlReadings);

        this.tmlDetails.tmlReadings.push(newTmlReading.tmlReading);
        this.readings.push(newTmlReading.tmlReading);

        const tmlReading = this.tmlDetailsForm.get("tmlReadings") as FormArray;
        const control = this.createFormGroup(newTmlReading.tmlReading);
        tmlReading.push(control);
        control.valueChanges.pipe(debounceTime(1000)).subscribe(values => this.onValueChanges(control, values));

        this.ref.detectChanges()
        this.saveTMLDetails();
      }
    })

  }

  // To Edit TML
  showEditTML(index:number) {
    const tmlReadingsIndex = index;
    const currentTMLID = this.tmlDetails.tmlReadings[tmlReadingsIndex]["TML ID"];

    const dialogRef = this.dialog.open(TmlDetailAddComponent, {
      width: '750px',
      panelClass: 'custom-dialog',
      data : {
        visionTML: this.tmlDetails,
        tmlReadings: this.tmlDetails.tmlReadings,
        editMode: true,
        editIndex: tmlReadingsIndex
      }
    })

    dialogRef.afterClosed().subscribe(newTmlReading => {
      if(newTmlReading && newTmlReading.event == 'save') {
        

        const newTmlReadings: Array<any> = JSON.parse(this.tmlDetails.newTMLs);
        const newTMLIndex = newTmlReadings.findIndex(t => t.TMLID === currentTMLID);

        // Remove from newTML If exists
        if (newTMLIndex > -1) {
          newTmlReadings.splice(newTMLIndex, 1, newTmlReading.newTml);
          this.tmlDetails.newTMLs = JSON.stringify(newTmlReadings);
        }

        this.tmlDetails.tmlReadings.splice(tmlReadingsIndex, 1, newTmlReading.tmlReading);
        this.readings.splice(tmlReadingsIndex, 1, newTmlReading.tmlReading);

        const tmlReading = this.tmlDetailsForm.get("tmlReadings") as FormArray;
        const control = this.createFormGroup(newTmlReading.tmlReading);
        tmlReading.removeAt(tmlReadingsIndex);
        tmlReading.insert(tmlReadingsIndex, control)
        control.valueChanges.pipe(debounceTime(1000)).subscribe(values => this.onValueChanges(control, values));
        
        this.ref.detectChanges()

        this.saveTMLDetails();
      }
       
    })
  }

  // Short Corrosion Difference
  getDifference(minValue: number, LastReading: number){
    let diff = Math.abs(minValue - LastReading);    
    return diff > 0.02 ? true : false;
  }

  // To Delete TML
  async deleteTML(index:number) {
    const currentTMLID = this.tmlDetails.tmlReadings[index]["TML ID"];
    

    let t = await lastValueFrom(this.translate.get(
      ['filters.confirm', 'tml.confirmMessage']
    ));

    const dialogRef = this.dialog.open(PromptInfoComponent, {
      width: '350px',
      data: {
        title: t['filters.confirm'],
        content: t['tml.confirmMessage'],
        showYesButton:true,
        showCancelButton: true
      },
      panelClass: 'custom-dialog'
    })

    dialogRef.afterClosed().subscribe((res) => {
      if(res) {
        const tmlReadings : Array<TmlReading> = this.tmlDetails.tmlReadings;
        const index = tmlReadings.findIndex(t => t['TML ID'] === currentTMLID);

        const newTmlReadings: Array<any> = JSON.parse(this.tmlDetails.newTMLs);
        const newTMLIndex = newTmlReadings.findIndex(t => t.TMLID === currentTMLID);

        if(newTMLIndex > -1) {
          newTmlReadings.splice(newTMLIndex, 1);
          this.tmlDetails.newTMLs = JSON.stringify(newTmlReadings);
        }

        if(index > -1) {
          this.tmlDetails.tmlReadings.splice(index, 1);
          this.readings.splice(index,1); 
        }

        const tmlReading = this.tmlDetailsForm.get("tmlReadings") as FormArray;
        tmlReading.removeAt(index);
        
        this.ref.detectChanges();

        this.saveTMLDetails();
      }
    })
  }

  // Save Whole Details
  saveTMLDetails() {
    this.tmlDetails.isChanged = "Y";
    db.updateTMLDetails(this.tmlDetails.inspectionId, this.tmlDetails);
  }
}
