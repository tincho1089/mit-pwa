import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, FormGroupDirective } from '@angular/forms';
import { MatFormFieldAppearance } from '@angular/material/form-field';
import { ReplaySubject, Subject, takeUntil } from 'rxjs';
import { InspectionResponse } from 'src/app/core/sync/entities';

@Component({
  selector: 'app-dropdown-search',
  templateUrl: './dropdown-search.component.html',
  styleUrls: ['./dropdown-search.component.scss']
})
export class DropdownSearchComponent implements OnInit, OnDestroy {

  @Input() appearance: MatFormFieldAppearance;
  @Input() label: string;
  @Input() response: InspectionResponse;
  @Input() options: any[];
  @Input() sectionArray: string[];
  @Input() idSelect: string;
  @Input() controlName: string = '';
  @Input() commonOptionDescription: boolean = false;
  @Input() parentParentForm: FormGroup;
  @Input() passFailCode: boolean = false;
  @Input() detailsGroup: boolean = false;
  @Input() multiple: boolean = false;
  @Input() detailsType: string;
  @Input() detailsIndex: number;
  @Input() placeHolder: string;
  @Input() detailsGroupName: string;
  
  form: FormGroup;
  formKey: FormControl;

  filteredOptions: ReplaySubject<any[]> = new ReplaySubject<any[]>();
  filterControl: FormControl<string> = new FormControl<string>('');

  protected _onDestroy = new Subject<void>();

  constructor(private rootFormGroup: FormGroupDirective){}

  ngOnInit() {

    this.form = this.rootFormGroup.form;

    if(this.controlName === ''){
      this.formKey = (this.rootFormGroup.form.get([this.response.inspectionSection]).get([this.response.questionId]) as FormControl);
    }
    else{
      if(this.passFailCode){
        if(this.detailsGroup && this.detailsGroupName)
        {
          this.formKey = (this.rootFormGroup.form.get([this.response.inspectionSection]).get([this.response.questionId]).get([this.detailsGroupName]).get([this.controlName]) as FormControl);
        }
        else{
          this.formKey = (this.rootFormGroup.form.get('passFail').get([this.controlName]) as FormControl);
        }
      }
      else if(this.detailsGroup){

        if(this.detailsGroupName){

          this.formKey = (this.rootFormGroup.form.get([this.detailsGroupName]).get([this.controlName]) as FormControl);

        }
        else{
          if(this.detailsType){
            this.formKey = ((this.rootFormGroup.form.get('details').get([this.detailsType]) as FormArray).at(this.detailsIndex).get([this.controlName]) as FormControl);
          }
          else{
            this.formKey = (this.rootFormGroup.form.get('details').get([this.controlName]) as FormControl);
          }
        }

      }
      else{
        this.formKey = (this.rootFormGroup.form.get([this.controlName]) as FormControl);
      }
    }

    // load the initial options list
    this.filteredOptions.next(this.options.slice());

    // listen for search field value changes
    this.filterControl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterOptions();
      });
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  filterOptions() {
    if (!this.options) {
      return;
    }
    // get the search keyword
    let search = this.filterControl.value;
    if (!search) {
      this.filteredOptions.next(this.options.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the options
    this.filteredOptions.next(
      this.options.filter(option => option.description.toLowerCase().indexOf(search) > -1)
    );
  }
}
