import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InspectionListItem } from './inspection-list-item.component';

xdescribe('InspectionListItem', () => {
  let component: InspectionListItem;
  let fixture: ComponentFixture<InspectionListItem>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InspectionListItem]
    });
    fixture = TestBed.createComponent(InspectionListItem);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
