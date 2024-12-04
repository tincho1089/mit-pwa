import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InspectionJsonViewerComponent } from './inspection-json-viewer.component';

describe('InspectionJsonViewerComponent', () => {
  let component: InspectionJsonViewerComponent;
  let fixture: ComponentFixture<InspectionJsonViewerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InspectionJsonViewerComponent],
      errorOnUnknownElements: false, // enable it as required
      errorOnUnknownProperties: false // enable it as required
    });
    fixture = TestBed.createComponent(InspectionJsonViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
