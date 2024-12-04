import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BaseInspection } from 'src/app/pages/inspection/classes/base-inspection';
import { MIUtilities } from 'src/app/shared/utility';
import { InspectionDetailsService } from 'src/app/pages/inspection/services/inspection-details.service';
@Component({
  selector: 'differential-pressure',
  templateUrl: 'differential-pressure.html'
})
export class DifferentialPressureComponent extends BaseInspection implements  OnInit {
    @Input()
    override editable: boolean = true;
    @Input() 
    showHelper: boolean = false;

    formGroup: FormGroup;

    constructor(private _detailsProvider: InspectionDetailsService){
        super();
    }

    override ngOnInit() {
       super.ngOnInit();
        this._createForm();
    }

    private _createForm(): void {
        const answer = this.getAnswerObject();
        console.log("---",answer)
        let observedPumpFlowRate = null;
        let ratedFlowRate = null;
        let observedDP = null;
        let differentialPressure = 0;
        let result = null;

        try{
            observedPumpFlowRate = MIUtilities.isNullOrUndefined(answer["ObservedPumpFlowRate"]) ? null : Number(answer["ObservedPumpFlowRate"]);
            ratedFlowRate = MIUtilities.isNullOrUndefined(answer["RatedFlowRate"]) ? null : Number(answer["RatedFlowRate"]);
            observedDP = MIUtilities.isNullOrUndefined(answer["ObservedDP"]) ? null : Number(answer["ObservedDP"]);
            differentialPressure = MIUtilities.isNullOrUndefined(answer["DifferentialPressure"]) ? null : Number(answer["DifferentialPressure"]);
            result = answer["Result"];
        } catch(e) {
            console.log("___error",e);
        }

        

        this.formGroup = new FormGroup(
            {
                ObservedPumpFlowRate: new FormControl(
                    observedPumpFlowRate,
                    Validators.required
                ),
                RatedFlowRate: new FormControl(
                    ratedFlowRate,
                    Validators.required
                ),
                ObservedDP: new FormControl(
                    observedDP,
                    Validators.required
                ),
                DifferentialPressure: new FormControl(
                    {
                        value: differentialPressure,
                        disabled: true
                    }
                ),
                Result: new FormControl (
                    {
                        value: result,
                        disabled: true
                    }
                )
            }
        )
        this.setControl(this.formGroup)

        this.formGroup.controls['ObservedPumpFlowRate'].valueChanges.subscribe(()=> {
            this.calculateDiffPressure();
        })
        this.formGroup.controls['RatedFlowRate'].valueChanges.subscribe(()=> {
            this.calculateDiffPressure();
        })
        this.formGroup.controls['ObservedDP'].valueChanges.subscribe(()=> {
            this.calculateDiffPressure();
        })

    }

    private calculateDiffPressure(){
        //pull out the inputs
        let OPFR = MIUtilities.isNullOrUndefined(this.formGroup.controls['ObservedPumpFlowRate'].value) ? null : Number(this.formGroup.controls['ObservedPumpFlowRate'].value);
        let RFR = MIUtilities.isNullOrUndefined(this.formGroup.controls['RatedFlowRate'].value) ? null : Number(this.formGroup.controls['RatedFlowRate'].value);
        let ODP = MIUtilities.isNullOrUndefined(this.formGroup.controls['ObservedDP'].value) ? null : Number(this.formGroup.controls['ObservedDP'].value);

        if (OPFR != null && RFR != null && ODP != null){

            //calculate differential pressure
            let temp = 0;
            if(RFR != 0){
                temp = OPFR / RFR;
            }
            console.log(OPFR, RFR, ODP)
            let diffPressure = ODP*((2.237*(2.718**(-0.00896*(temp))))+(9.638*(2.718**(-0.04719*(temp)))));
            diffPressure = Math.round((diffPressure + Number.EPSILON) * 100) / 100; //round to nearest 2 decimal places
            
            this.formGroup.controls['DifferentialPressure'].setValue(diffPressure);

            let newResult = null;

            if (diffPressure > RFR){
                newResult = "Max Flow Exceeded - Recheck";
            }
            if (diffPressure > 15) {
                newResult = "High DP - Change Filter";
            }
            this.formGroup.controls['Result'].setValue(newResult);
        }
        else{
            this.formGroup.controls['DifferentialPressure'].setValue(0);
            this.formGroup.controls['Result'].setValue(null);
        }
    }

}